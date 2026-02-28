package integrationexecutor

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"strings"
	"sync"

	"github.com/superblocksteam/agent/pkg/constants"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

// IntegrationExecutorService implements the SandboxIntegrationExecutorService
// gRPC service. It proxies integration execution requests from the sandbox to
// the orchestrator's Await endpoint using an inline Definition.
type IntegrationExecutorService struct {
	workerv1.UnimplementedSandboxIntegrationExecutorServiceServer

	server              *grpc.Server
	port                int
	logger              *zap.Logger
	orchestratorAddress string
	fileContextProvider FileContextProvider

	orchestratorClient     apiv1.ExecutorServiceClient
	orchestratorClientLock sync.Mutex
	orchestratorConn       *grpc.ClientConn

	shutdownLock sync.RWMutex
	done         chan error

	run.ForwardCompatibility
}

var _ run.Runnable = (*IntegrationExecutorService)(nil)

// New creates a new IntegrationExecutorService.
func New(opts ...Option) *IntegrationExecutorService {
	o := ApplyOptions(opts...)

	return &IntegrationExecutorService{
		server:              o.server,
		port:                o.port,
		logger:              o.logger,
		orchestratorAddress: o.orchestratorAddress,
		fileContextProvider: o.fileContextProvider,
		done:                make(chan error, 1),
	}
}

// Name returns the service name.
func (s *IntegrationExecutorService) Name() string {
	return "IntegrationExecutorService"
}

// Start initializes and starts the gRPC server.
func (s *IntegrationExecutorService) Start() error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
	if err != nil {
		return fmt.Errorf("failed to listen on port %d: %w", s.port, err)
	}

	s.shutdownLock.RLock()
	if s.server == nil {
		s.shutdownLock.RUnlock()
		return errors.New("cannot start integration executor service: gRPC server is nil")
	}

	workerv1.RegisterSandboxIntegrationExecutorServiceServer(s.server, s)
	server := s.server
	s.shutdownLock.RUnlock()

	s.logger.Info("IntegrationExecutorService gRPC server starting", zap.Int("port", s.port))
	return server.Serve(lis)
}

// Run implements run.Runnable. It starts the gRPC server and blocks until
// the context is cancelled or an error occurs.
func (s *IntegrationExecutorService) Run(ctx context.Context) error {
	// Capture locally to avoid a race with Close() setting s.done = nil.
	done := s.done
	go func() {
		done <- s.Start()
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-done:
		return err
	}
}

// Close gracefully stops the gRPC server and closes the orchestrator connection.
func (s *IntegrationExecutorService) Close(ctx context.Context) error {
	s.shutdownLock.Lock()
	defer s.shutdownLock.Unlock()

	if s.orchestratorConn != nil {
		if err := s.orchestratorConn.Close(); err != nil {
			s.logger.Warn("error closing orchestrator connection", zap.Error(err))
		}
		s.orchestratorConn = nil
		s.orchestratorClient = nil
	}

	if s.server != nil {
		s.server.GracefulStop()
		s.server = nil
	}

	return nil
}

// Alive returns true if the server is running.
func (s *IntegrationExecutorService) Alive() bool {
	return s.server != nil
}

// getOrCreateOrchestratorClient lazily creates a gRPC client to the orchestrator.
func (s *IntegrationExecutorService) getOrCreateOrchestratorClient() (apiv1.ExecutorServiceClient, error) {
	s.orchestratorClientLock.Lock()
	defer s.orchestratorClientLock.Unlock()

	if s.orchestratorClient != nil {
		return s.orchestratorClient, nil
	}

	conn, err := grpc.NewClient(
		s.orchestratorAddress,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create orchestrator client: %w", err)
	}

	s.orchestratorConn = conn
	s.orchestratorClient = apiv1.NewExecutorServiceClient(conn)

	return s.orchestratorClient, nil
}

// buildStep constructs an apiv1.Step with the correct plugin-typed config
// using protojson to dynamically set the oneof field by plugin_id.
//
// The Step proto has a oneof config with 80+ plugin types (e.g. "postgres",
// "restapi", "mongodb"). Rather than a massive switch statement, we build
// JSON with the plugin name as the key and use protojson.Unmarshal to populate
// the correct oneof field.
func buildStep(integrationID, pluginID string, actionConfig *structpb.Struct) (*apiv1.Step, error) {
	configJSON, err := protojson.Marshal(actionConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal action configuration: %w", err)
	}

	pluginKeyJSON, err := json.Marshal(pluginID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal plugin ID: %w", err)
	}

	integrationJSON, err := json.Marshal(integrationID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal integration ID: %w", err)
	}

	stepJSON := fmt.Sprintf(`{"integration":%s,%s:%s}`,
		string(integrationJSON),
		string(pluginKeyJSON),
		string(configJSON),
	)

	step := &apiv1.Step{}
	if err := protojson.Unmarshal([]byte(stepJSON), step); err != nil {
		return nil, fmt.Errorf("failed to unmarshal step with plugin %q: %w", pluginID, err)
	}

	return step, nil
}

// ExecuteIntegration handles integration execution requests from the sandbox.
// It looks up the stored JWT for the execution, builds an inline Definition
// with the plugin-typed Step config, and proxies the request to the
// orchestrator's Await endpoint.
func (s *IntegrationExecutorService) ExecuteIntegration(ctx context.Context, req *workerv1.ExecuteIntegrationRequest) (*workerv1.ExecuteIntegrationResponse, error) {
	if req.GetExecutionId() == "" {
		return nil, status.Error(codes.InvalidArgument, "execution_id is required")
	}

	if req.GetIntegrationId() == "" {
		return nil, status.Error(codes.InvalidArgument, "integration_id is required")
	}

	if req.GetPluginId() == "" {
		return nil, status.Error(codes.InvalidArgument, "plugin_id is required")
	}

	// Look up stored execution context (contains JWT and profile).
	fileCtx := s.fileContextProvider.GetFileContext(req.GetExecutionId())
	if fileCtx == nil {
		return nil, status.Errorf(codes.NotFound, "no execution context found for execution_id %q", req.GetExecutionId())
	}

	if fileCtx.JwtToken == "" {
		return nil, status.Error(codes.PermissionDenied, "no JWT token available for this execution")
	}

	orgID, err := extractOrgIDFromJWT(fileCtx.JwtToken)
	if err != nil {
		return nil, status.Errorf(codes.PermissionDenied, "could not extract org_id from JWT: %v", err)
	}

	client, err := s.getOrCreateOrchestratorClient()
	if err != nil {
		s.logger.Error("failed to get orchestrator client", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to connect to orchestrator")
	}

	// Use the profile from the request, falling back to the parent execution's profile.
	profile := req.GetProfile()
	if profile == nil {
		profile = fileCtx.Profile
	}

	// Build the Step with the correct plugin-typed config.
	actionConfig := req.GetActionConfiguration()
	if actionConfig == nil {
		actionConfig = &structpb.Struct{Fields: map[string]*structpb.Value{}}
	}

	step, err := buildStep(req.GetIntegrationId(), req.GetPluginId(), actionConfig)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid step configuration: %v", err)
	}

	// Forward the JWT as outgoing gRPC metadata to the orchestrator.
	// The stored token has the "Bearer " prefix stripped, but the orchestrator's
	// JWT middleware expects it in "Bearer <token>" format.
	md := metadata.Pairs(
		constants.HeaderSuperblocksJwt, "Bearer "+fileCtx.JwtToken,
		constants.HeaderForceAgentKey, "true",
	)
	outCtx := metadata.NewOutgoingContext(ctx, md)

	resp, err := client.Await(outCtx, &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_Definition{
			Definition: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           fmt.Sprintf("sdk-query-%s", req.GetIntegrationId()),
						Name:         "SDK Integration Query",
						Organization: orgID,
					},
					Blocks: []*apiv1.Block{{
						Name:   "query",
						Config: &apiv1.Block_Step{Step: step},
					}},
				},
			},
		},
		Profile:  profile,
		ViewMode: req.GetViewMode(),
	})
	if err != nil {
		s.logger.Error("orchestrator Await failed",
			zap.String("execution_id", req.GetExecutionId()),
			zap.String("integration_id", req.GetIntegrationId()),
			zap.String("plugin_id", req.GetPluginId()),
			zap.Error(err),
		)
		return &workerv1.ExecuteIntegrationResponse{
			Error: err.Error(),
		}, nil
	}

	// Propagate block-level execution errors. When the integration plugin fails
	// (e.g. a bad SQL query, connection error), the orchestrator returns them in
	// Errors rather than as a gRPC status error. Without this check the caller
	// would receive a nil Output and no Error, which surfaces as the confusing
	// "Expected array result from Postgres query, got: undefined" message in the
	// SDK instead of the actual plugin error.
	//
	// Use Message first, then Name, then Code.String() as fallbacks so that
	// errors with empty Message but non-empty Name or Code are still surfaced.
	if errs := resp.GetErrors(); len(errs) > 0 {
		msgs := make([]string, 0, len(errs))
		for _, e := range errs {
			msg := e.GetMessage()
			if msg == "" {
				msg = e.GetName()
			}
			if msg == "" && e.GetCode() != commonv1.Code_CODE_UNSPECIFIED {
				msg = e.GetCode().String()
			}
			if msg == "" {
				msg = "integration execution failed"
			}
			msgs = append(msgs, msg)
		}
		s.logger.Warn("integration execution returned block-level errors",
			zap.String("execution_id", req.GetExecutionId()),
			zap.String("integration_id", req.GetIntegrationId()),
			zap.String("plugin_id", req.GetPluginId()),
			zap.Strings("errors", msgs),
		)
		return &workerv1.ExecuteIntegrationResponse{
			Error: strings.Join(msgs, "; "),
		}, nil
	}

	return &workerv1.ExecuteIntegrationResponse{
		ExecutionId: resp.GetExecution(),
		Output:      resp.GetOutput().GetResult(),
	}, nil
}

// extractOrgIDFromJWT extracts the org_id claim from a JWT without verifying the
// signature. The token may optionally carry a "Bearer " prefix. This mirrors the
// logic in main-worker-integration-executor.ts.
func extractOrgIDFromJWT(jwtToken string) (string, error) {
	token := strings.TrimPrefix(jwtToken, "Bearer ")
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return "", errors.New("malformed JWT: expected at least two dot-separated segments")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("malformed JWT payload: %w", err)
	}

	var claims struct {
		OrgID string `json:"org_id"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", fmt.Errorf("malformed JWT payload JSON: %w", err)
	}

	if claims.OrgID == "" {
		return "", errors.New("JWT payload missing org_id claim")
	}

	return claims.OrgID, nil
}
