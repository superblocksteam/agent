package integrationexecutor

import (
	"context"
	"encoding/base64"
	"fmt"
	"net"
	"testing"

	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/constants"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
)

const testOrgID = "11111111-1111-1111-1111-111111111111"

// makeTestJWT builds a minimal unsigned JWT whose payload contains the given org_id.
func makeTestJWT(orgID string) string {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"none","typ":"JWT"}`))
	payload := base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf(`{"org_id":%q}`, orgID)))
	return header + "." + payload + ".fakesig"
}

// mockFileContextProvider implements FileContextProvider for testing.
type mockFileContextProvider struct {
	contexts map[string]*redisstore.ExecutionFileContext
}

func (m *mockFileContextProvider) GetFileContext(executionID string) *redisstore.ExecutionFileContext {
	return m.contexts[executionID]
}

// fakeOrchestratorServer implements the Await RPC for testing.
type fakeOrchestratorServer struct {
	apiv1.UnimplementedExecutorServiceServer

	lastRequest  *apiv1.ExecuteRequest
	lastJwtToken string
	response     *apiv1.AwaitResponse
	err          error
}

func (f *fakeOrchestratorServer) Await(ctx context.Context, req *apiv1.ExecuteRequest) (*apiv1.AwaitResponse, error) {
	f.lastRequest = req

	// Extract JWT from incoming metadata.
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if vals := md.Get(constants.HeaderSuperblocksJwt); len(vals) > 0 {
			f.lastJwtToken = vals[0]
		}
	}

	if f.err != nil {
		return nil, f.err
	}

	return f.response, nil
}

// startFakeOrchestrator starts a gRPC server with the fake orchestrator and
// returns the address and a cleanup function.
func startFakeOrchestrator(t *testing.T, fake *fakeOrchestratorServer) string {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	server := grpc.NewServer()
	apiv1.RegisterExecutorServiceServer(server, fake)

	go func() {
		_ = server.Serve(lis)
	}()

	t.Cleanup(func() {
		server.GracefulStop()
	})

	return lis.Addr().String()
}

func TestBuildStep(t *testing.T) {
	for _, test := range []struct {
		name          string
		integrationID string
		pluginID      string
		actionConfig  *structpb.Struct
		wantErr       bool
		checkStep     func(t *testing.T, step *apiv1.Step)
	}{
		{
			name:          "postgres plugin",
			integrationID: "int-123",
			pluginID:      "postgres",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": structpb.NewStringValue("SELECT 1"),
				},
			},
			checkStep: func(t *testing.T, step *apiv1.Step) {
				assert.Equal(t, "int-123", step.GetIntegration())
				assert.NotNil(t, step.GetPostgres(), "expected postgres config to be set")
			},
		},
		{
			name:          "restapi plugin",
			integrationID: "int-456",
			pluginID:      "restapi",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"path": structpb.NewStringValue("/api/v1/data"),
				},
			},
			checkStep: func(t *testing.T, step *apiv1.Step) {
				assert.Equal(t, "int-456", step.GetIntegration())
				assert.NotNil(t, step.GetRestapi(), "expected restapi config to be set")
			},
		},
		{
			name:          "empty action config",
			integrationID: "int-789",
			pluginID:      "postgres",
			actionConfig:  &structpb.Struct{Fields: map[string]*structpb.Value{}},
			checkStep: func(t *testing.T, step *apiv1.Step) {
				assert.Equal(t, "int-789", step.GetIntegration())
				assert.NotNil(t, step.GetPostgres())
			},
		},
		{
			name:          "unknown plugin ID",
			integrationID: "int-000",
			pluginID:      "nonexistent_plugin",
			actionConfig:  &structpb.Struct{Fields: map[string]*structpb.Value{}},
			wantErr:       true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			step, err := buildStep(test.integrationID, test.pluginID, test.actionConfig)
			if test.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			test.checkStep(t, step)
		})
	}
}

func TestExecuteIntegration(t *testing.T) {
	outputValue, err := structpb.NewValue(map[string]any{"key": "value"})
	require.NoError(t, err)

	profileTest := &commonv1.Profile{Name: strPtr("test-profile")}
	profileFallback := &commonv1.Profile{Name: strPtr("fallback-profile")}

	actionConfig := &structpb.Struct{
		Fields: map[string]*structpb.Value{
			"body": structpb.NewStringValue("SELECT 1"),
		},
	}

	validJWT := makeTestJWT(testOrgID)

	for _, test := range []struct {
		name               string
		request            *workerv1.ExecuteIntegrationRequest
		contexts           map[string]*redisstore.ExecutionFileContext
		orchestratorErr    error
		orchestratorErrors []*commonv1.Error // block-level errors in AwaitResponse.Errors
		wantCode           codes.Code
		wantOutput         *structpb.Value
		wantError          string
		wantJwt            string
		wantOrg            string
		wantProfile        *commonv1.Profile
	}{
		{
			name: "happy path",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
				ViewMode:            apiv1.ViewMode_VIEW_MODE_DEPLOYED,
				Profile:             profileTest,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT, Profile: profileFallback},
			},
			wantJwt:     "Bearer " + validJWT,
			wantOrg:     testOrgID,
			wantProfile: profileTest,
			wantOutput:  outputValue,
		},
		{
			name: "profile falls back to parent execution",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT, Profile: profileFallback},
			},
			wantJwt:     "Bearer " + validJWT,
			wantOrg:     testOrgID,
			wantProfile: profileFallback,
			wantOutput:  outputValue,
		},
		{
			name: "missing execution_id",
			request: &workerv1.ExecuteIntegrationRequest{
				IntegrationId: "int-1",
				PluginId:      "postgres",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "missing integration_id",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId: "exec-1",
				PluginId:    "postgres",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "missing plugin_id",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:   "exec-1",
				IntegrationId: "int-1",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "unknown execution_id",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:   "unknown",
				IntegrationId: "int-1",
				PluginId:      "postgres",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{},
			wantCode: codes.NotFound,
		},
		{
			name: "no JWT in context",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:   "exec-1",
				IntegrationId: "int-1",
				PluginId:      "postgres",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: ""},
			},
			wantCode: codes.PermissionDenied,
		},
		{
			name: "malformed JWT in context",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:   "exec-1",
				IntegrationId: "int-1",
				PluginId:      "postgres",
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: "not-a-jwt"},
			},
			wantCode: codes.PermissionDenied,
		},
		{
			name: "orchestrator returns error",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			orchestratorErr: status.Error(codes.Internal, "something went wrong"),
			wantError:       "rpc error: code = Internal desc = something went wrong",
		},
		{
			name: "nil action configuration defaults to empty struct",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: nil,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			wantJwt:    "Bearer " + validJWT,
			wantOrg:    testOrgID,
			wantOutput: outputValue,
		},
		{
			name: "orchestrator returns block-level errors (e.g. bad SQL query)",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			// Simulate a failed Postgres step: orchestrator returns errors and no output.
			// Without the fix this would return output=nil and error="" which caused the
			// confusing "Expected array result from Postgres query, got: undefined" message.
			orchestratorErrors: []*commonv1.Error{
				{Message: `relation "users" does not exist`},
			},
			wantError: `relation "users" does not exist`,
		},
		{
			name: "orchestrator returns errors with empty Message but non-empty Name",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			// Some plugins return errors with Name/Code but empty Message.
			// Without the fix these would fall through to success path (nil Output, no Error).
			orchestratorErrors: []*commonv1.Error{
				{Name: "ConnectionError"},
			},
			wantError: "ConnectionError",
		},
		{
			name: "orchestrator returns errors with empty Message and Name, uses Code fallback",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			orchestratorErrors: []*commonv1.Error{
				{Code: commonv1.Code_CODE_INTEGRATION_NETWORK},
			},
			wantError: "CODE_INTEGRATION_NETWORK",
		},
		{
			name: "orchestrator returns errors with all fields empty, uses generic fallback",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: validJWT},
			},
			orchestratorErrors: []*commonv1.Error{
				{},
			},
			wantError: "integration execution failed",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fakeResp := &apiv1.AwaitResponse{
				Execution: "result-exec-id",
				Errors:    test.orchestratorErrors,
			}
			// Only populate Output when there are no block-level errors, mirroring
			// what the real orchestrator does for a successful step execution.
			if len(test.orchestratorErrors) == 0 {
				fakeResp.Output = &apiv1.Output{Result: outputValue}
			}
			fake := &fakeOrchestratorServer{
				response: fakeResp,
				err:      test.orchestratorErr,
			}

			orchestratorAddr := startFakeOrchestrator(t, fake)

			svc := &IntegrationExecutorService{
				logger:              zap.NewNop(),
				orchestratorAddress: orchestratorAddr,
				fileContextProvider: &mockFileContextProvider{contexts: test.contexts},
			}

			// Pre-create the orchestrator client for the test.
			conn, err := grpc.NewClient(
				orchestratorAddr,
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			)
			require.NoError(t, err)
			t.Cleanup(func() { conn.Close() })

			svc.orchestratorClient = apiv1.NewExecutorServiceClient(conn)
			svc.orchestratorConn = conn

			resp, err := svc.ExecuteIntegration(context.Background(), test.request)

			if test.wantCode != codes.OK {
				require.Error(t, err)
				st, ok := status.FromError(err)
				require.True(t, ok)
				assert.Equal(t, test.wantCode, st.Code())
				return
			}

			require.NoError(t, err)

			if test.wantError != "" {
				assert.Equal(t, test.wantError, resp.GetError())
				return
			}

			assert.Equal(t, "result-exec-id", resp.GetExecutionId())
			assert.Equal(t, test.wantOutput.GetStructValue().AsMap(), resp.GetOutput().GetStructValue().AsMap())

			// Verify the orchestrator received the JWT with Bearer prefix.
			assert.Equal(t, test.wantJwt, fake.lastJwtToken)

			// Verify the Await request uses an inline Definition.
			def := fake.lastRequest.GetDefinition()
			require.NotNil(t, def, "expected inline Definition in Await request")
			require.NotNil(t, def.GetApi())
			require.Len(t, def.GetApi().GetBlocks(), 1)

			block := def.GetApi().GetBlocks()[0]
			assert.Equal(t, "query", block.GetName())
			assert.NotNil(t, block.GetStep(), "expected block to contain a Step")
			assert.Equal(t, test.request.GetIntegrationId(), block.GetStep().GetIntegration())

			if test.wantOrg != "" {
				assert.Equal(t, test.wantOrg, def.GetApi().GetMetadata().GetOrganization())
			}

			if test.wantProfile != nil {
				assert.Equal(t, test.wantProfile.GetName(), fake.lastRequest.GetProfile().GetName())
			}
		})
	}
}

func TestExtractOrgIDFromJWT(t *testing.T) {
	validUUID := "11111111-1111-1111-1111-111111111111"
	validJWT := makeTestJWT(validUUID)

	for _, test := range []struct {
		name    string
		token   string
		wantID  string
		wantErr string
	}{
		{
			name:   "valid token without Bearer prefix",
			token:  validJWT,
			wantID: validUUID,
		},
		{
			name:   "valid token with Bearer prefix",
			token:  "Bearer " + validJWT,
			wantID: validUUID,
		},
		{
			name:    "empty string",
			token:   "",
			wantErr: "malformed JWT",
		},
		{
			name:    "single segment (no dots)",
			token:   "onlyone",
			wantErr: "malformed JWT",
		},
		{
			name:    "invalid base64 payload",
			token:   "header.!!!.sig",
			wantErr: "malformed JWT payload",
		},
		{
			name:    "valid base64 payload but missing org_id",
			token:   "header." + base64.RawURLEncoding.EncodeToString([]byte(`{"sub":"user123"}`)) + ".sig",
			wantErr: "missing org_id",
		},
		{
			name:    "empty org_id in payload",
			token:   "header." + base64.RawURLEncoding.EncodeToString([]byte(`{"org_id":""}`)) + ".sig",
			wantErr: "missing org_id",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			got, err := extractOrgIDFromJWT(test.token)
			if test.wantErr != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), test.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.wantID, got)
		})
	}
}

func strPtr(s string) *string {
	return &s
}

// TestStartNilServer verifies that Start() returns an error when the gRPC
// server was not configured (nil), rather than panicking or hanging.
func TestStartNilServer(t *testing.T) {
	port := getFreePort(t)
	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		// server intentionally nil
		port: port,
		done: make(chan error, 1),
	}

	err := svc.Start()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "gRPC server is nil")
}

// TestGetOrCreateOrchestratorClientCreatesAndReuses verifies that
// getOrCreateOrchestratorClient lazily creates a gRPC client on the first
// call and returns the cached client (without re-dialing) on subsequent calls.
func TestGetOrCreateOrchestratorClientCreatesAndReuses(t *testing.T) {
	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{Execution: "test"},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: orchestratorAddr,
	}

	assert.Nil(t, svc.orchestratorClient)

	// First call should create the connection and client.
	client1, err := svc.getOrCreateOrchestratorClient()
	require.NoError(t, err)
	assert.NotNil(t, client1)
	assert.NotNil(t, svc.orchestratorConn)

	connAfterFirst := svc.orchestratorConn

	// Second call should return the same client without creating a new connection.
	client2, err := svc.getOrCreateOrchestratorClient()
	require.NoError(t, err)
	assert.NotNil(t, client2)
	assert.Equal(t, connAfterFirst, svc.orchestratorConn, "connection should not be re-created on second call")
}

// TestCloseWithActiveOrchestratorConnection verifies that Close() properly
// tears down an active orchestrator connection and marks the service as stopped.
func TestCloseWithActiveOrchestratorConnection(t *testing.T) {
	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{Execution: "test"},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	conn, err := grpc.NewClient(
		orchestratorAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)

	svc := &IntegrationExecutorService{
		logger:             zap.NewNop(),
		server:             grpc.NewServer(),
		orchestratorConn:   conn,
		orchestratorClient: apiv1.NewExecutorServiceClient(conn),
	}

	assert.True(t, svc.Alive())

	require.NoError(t, svc.Close(context.Background()))

	assert.Nil(t, svc.orchestratorConn)
	assert.Nil(t, svc.orchestratorClient)
	assert.False(t, svc.Alive())
}

// TestExecuteIntegrationLazyClientCreation verifies that ExecuteIntegration
// creates the orchestrator gRPC client lazily when it has not been pre-created.
func TestExecuteIntegrationLazyClientCreation(t *testing.T) {
	outputValue, err := structpb.NewValue(map[string]any{"key": "value"})
	require.NoError(t, err)

	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "lazy-exec-id",
			Output:    &apiv1.Output{Result: outputValue},
		},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	lazyJWT := makeTestJWT(testOrgID)

	// Do NOT pre-create the orchestrator client; it must be created lazily.
	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: orchestratorAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: lazyJWT},
			},
		},
	}

	resp, err := svc.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
		ExecutionId:   "exec-1",
		IntegrationId: "int-1",
		PluginId:      "postgres",
		ActionConfiguration: &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		},
	})
	require.NoError(t, err)
	assert.Equal(t, "lazy-exec-id", resp.GetExecutionId())
	assert.Empty(t, resp.GetError())

	// The client and connection should now be cached on the service.
	assert.NotNil(t, svc.orchestratorClient)
	assert.NotNil(t, svc.orchestratorConn)

	// JWT should have been forwarded with Bearer prefix.
	assert.Equal(t, "Bearer "+lazyJWT, fake.lastJwtToken)
}
