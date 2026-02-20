package transport

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/internal/flags"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	internalutils "github.com/superblocksteam/agent/internal/utils"
	"github.com/superblocksteam/agent/pkg/constants"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	sberror "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/functions"
	"github.com/superblocksteam/agent/pkg/mocker"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/plugin"
	"github.com/superblocksteam/agent/pkg/secrets"
	secretsoptions "github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/expression"
	"github.com/superblocksteam/agent/pkg/template/plugins/legacyexpression"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/validation"
	"github.com/superblocksteam/agent/pkg/worker"
	workeroptions "github.com/superblocksteam/agent/pkg/worker/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	utilsv1 "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/structpb"
)

// VisitorOrganizationID is the organization ID when a JWT is not required and not provided.
const VisitorOrganizationID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

type server struct {
	*Config
	apiv1.UnimplementedExecutorServiceServer
	secretsv1.UnimplementedStoreServiceServer
	securityv1.UnimplementedSignatureServiceServer
}

type Services interface {
	apiv1.ExecutorServiceServer
	apiv1.MetadataServiceServer
	apiv1.DeprecatedServiceServer
	apiv1.IntegrationAuthServiceServer
	secretsv1.StoreServiceServer
	securityv1.SignatureServiceServer
}

type Config struct {
	Logger                *zap.Logger
	Worker                worker.Client
	Store                 store.Store
	Flags                 flags.Flags
	FileServerUrl         string
	Fetcher               fetch.Fetcher
	Health                func(*apiv1.HealthRequest) (*commonv1.HealthResponse, error)
	DefaultResolveOptions []options.Option
	DefaultSecretOptions  []secretsoptions.Option
	TokenManager          auth.TokenManager
	SecretManager         secrets.SecretManager
	AgentId               string
	AgentVersion          string
	Secrets               secrets.Secrets
	Signature             signature.Registry
	WaitGroup             *sync.WaitGroup
}

func NewServer(config *Config) Services {
	return &server{
		Config: config,
	}
}

func (s *server) Health(_ context.Context, req *apiv1.HealthRequest) (*commonv1.HealthResponse, error) {
	return s.Config.Health(req)
}

// getUseAgentKeyForHydration returns whether to use agent key for hydration requests.
// Returns false (default) if Flags is nil (e.g., in tests without mock flags configured).
func (s *server) getUseAgentKeyForHydration(ctx context.Context) bool {
	if s.Flags == nil {
		return false
	}

	orgId := constants.OrganizationID(ctx)
	if orgId == "" {
		requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
		if err == nil && !requestUsesJwtAuth {
			orgId = VisitorOrganizationID
		}
	}

	return s.Flags.GetUseAgentKeyForHydration(orgId)
}

func (s *server) Workflow(ctx context.Context, req *apiv1.ExecuteRequest) (*apiv1.WorkflowResponse, error) {
	if fetch := req.GetFetch(); fetch != nil {
		if fetch.GetTest() {
			fetch.ViewMode = apiv1.ViewMode_VIEW_MODE_EDIT
		} else {
			fetch.ViewMode = apiv1.ViewMode_VIEW_MODE_DEPLOYED
		}
	}

	apiResponse, err := s.Await(ctx, req)
	if err != nil {
		return nil, err
	}

	workflowResponse := &apiv1.WorkflowResponse{
		ResponseMeta: &apiv1.WorkflowResponse_ResponseMeta{
			Success: true,
			Status:  200,
			Message: "",
		},
	}

	if apiResponse != nil && apiResponse.Output != nil {
		workflowResponse.Data = apiResponse.Output.Result
	}

	return workflowResponse, nil
}

// requireAuthForInlineDefinition checks if the request contains an inline definition
// and requires authorization if so. This prevents anonymous users from executing
// arbitrary code while still allowing public apps (which use fetch by ID) to work.
func requireAuthForInlineDefinition(ctx context.Context, req *apiv1.ExecuteRequest) error {
	if _, ok := req.GetRequest().(*apiv1.ExecuteRequest_Definition); ok {
		requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
		if err != nil || !requestUsesJwtAuth {
			return sberror.AuthorizationError(errors.New("Authorization header required for inline definitions"))
		}
	}
	return nil
}

// ExecuteV3 handles the /v3/execute endpoint for API 2.0 execution.
// It converts the minimal ExecuteV3Request to an internal ExecuteRequest
// with FetchCode (API 2.0 code delivery) and delegates to the existing
// await() pipeline. JWT is always required (enforced by the jwtDecider in main.go).
func (s *server) ExecuteV3(ctx context.Context, req *apiv1.ExecuteV3Request) (*apiv1.AwaitResponse, error) {
	fetchCode := &apiv1.ExecuteRequest_FetchCode{
		Id:         req.GetApplicationId(),
		ViewMode:   req.GetViewMode(),
		Profile:    req.GetProfile(),
		CommitId:   req.CommitId,
		BranchName: req.BranchName,
	}
	return s.await(ctx, &apiv1.ExecuteRequest{
		Inputs: req.GetInputs(),
		Request: &apiv1.ExecuteRequest_FetchCode_{
			FetchCode: fetchCode,
		},
	})
}

func (s *server) Await(ctx context.Context, req *apiv1.ExecuteRequest) (resp *apiv1.AwaitResponse, err error) {
	// Require authorization for inline definitions to prevent anonymous code execution
	if err := requireAuthForInlineDefinition(ctx, req); err != nil {
		return nil, err
	}

	if req.Options == nil || !req.Options.Async {
		return s.await(ctx, req)
	}

	if req.Options == nil {
		req.Options = &apiv1.ExecuteRequest_Options{}
	}

	// Ensure we don't handle more data than we need to.
	req.Options.ExcludeOutput = true
	req.Options.IncludeEventOutputs = false
	req.Options.IncludeEvents = false
	req.Options.IncludeResolved = false

	s.WaitGroup.Add(1)
	go func() {
		defer s.WaitGroup.Done()
		s.await(context.WithoutCancel(ctx), req)
	}()

	return &apiv1.AwaitResponse{
		Execution: constants.ExecutionID(ctx),
		Status:    apiv1.AwaitResponse_STATUS_EXECUTING,
	}, nil
}

func (s *server) await(ctx context.Context, req *apiv1.ExecuteRequest) (resp *apiv1.AwaitResponse, err error) {
	var events []*apiv1.Event
	var output *apiv1.Output
	var failures []*commonv1.Error
	var mutex sync.Mutex
	var execution string

	forEach := streamResponseProcessor(req.GetOptions(), func(resp *apiv1.StreamResponse) error {
		mutex.Lock()
		defer mutex.Unlock()

		events = append(events, resp.Event)
		return nil
	})

	if output, err = tracer.Observe(ctx, "execute.api.await", nil, func(spanCtx context.Context, span trace.Span) (*apiv1.Output, error) {
		done, err := s.stream(spanCtx, req, func(resp *apiv1.StreamResponse) error {
			execution = resp.Execution

			if err := forEach(resp); err != nil {
				mutex.Lock()
				defer mutex.Unlock()

				failures = append(failures, sberror.ToCommonV1(err))
			}

			return nil
		}, nil)
		if err != nil {
			return nil, err
		}

		if done == nil {
			return nil, nil
		}

		return done.Output, nil
	}, nil); err != nil {
		return nil, err
	}

	var respErr error = nil
	for i := 0; i < len(failures); i++ {
		if e := transformCommonQuotaErrorToError(failures[i]); e != nil {
			respErr = e
			break
		}
	}

	return &apiv1.AwaitResponse{
		Execution: execution,
		Status:    apiv1.AwaitResponse_STATUS_COMPLETED,
		Events:    events,
		Output:    output,
		Errors:    failures,
	}, respErr
}

func (s *server) Async(ctx context.Context, req *apiv1.ExecuteRequest) (*apiv1.AsyncResponse, error) {
	return s.UnimplementedExecutorServiceServer.Async(ctx, req)
}

func (s *server) TwoWayStream(stream apiv1.ExecutorService_TwoWayStreamServer) (first error) {
	var req *apiv1.ExecuteRequest
	{
		event, err := stream.Recv()
		if err != nil {
			return err
		}

		// The first event MUST be an execute request.
		if req = event.GetExecute(); req == nil {
			return sberror.ErrBadRequest
		}
	}

	// Require authorization for inline definitions to prevent anonymous code execution
	if err := requireAuthForInlineDefinition(stream.Context(), req); err != nil {
		return err
	}

	requests := make(chan *apiv1.Function_Request)
	responses := make(chan *apiv1.Function_Response)

	defer close(requests)
	defer close(responses)

	bus := functions.NewBus(requests, responses)

	go func() {
		for {
			event, err := stream.Recv()

			if err != nil {
				s.Logger.Error("failed to receive event", zap.Error(err))
				break
			}

			// We could return an error here but it's benign if we don't.
			if event.GetExecute() != nil {
				continue
			}

			responses <- event.GetFunction()
		}
	}()

	go func() {
		for request := range requests {
			if err := stream.Send(&apiv1.TwoWayResponse{
				Type: &apiv1.TwoWayResponse_Function{
					Function: request,
				},
			}); err != nil {
				s.Logger.Error("failed to send function request", zap.Error(err))
			}
		}
	}()

	forEach := streamResponseProcessor(req.GetOptions(), func(resp *apiv1.StreamResponse) error {
		return stream.Send(&apiv1.TwoWayResponse{
			Type: &apiv1.TwoWayResponse_Stream{
				Stream: resp,
			},
		})
	})

	if _, err := tracer.Observe(stream.Context(), "execute.api.stream", nil, func(ctx context.Context, span trace.Span) (any, error) {
		return s.stream(ctx, req, func(resp *apiv1.StreamResponse) error {
			if err := forEach(resp); err != nil && first == nil {
				// NOTE(frank): Do not return this error.
				first = err

				if e := transformCommonQuotaErrorToError(sberror.ToCommonV1(first)); e != nil {
					first = e
				}
			}

			return nil
		}, bus)
	}, nil); err != nil {
		return err
	}

	return
}

func (s *server) Stream(req *apiv1.ExecuteRequest, stream apiv1.ExecutorService_StreamServer) (first error) {
	// Require authorization for inline definitions to prevent anonymous code execution
	if err := requireAuthForInlineDefinition(stream.Context(), req); err != nil {
		return err
	}

	// TODO(frank): Move to `stream` after I ensure it doesn't break anything.
	if err := utils.ProtoValidate(req); err != nil {
		return err
	}

	forEach := streamResponseProcessor(req.GetOptions(), func(resp *apiv1.StreamResponse) error {
		return stream.Send(resp)
	})

	if _, err := tracer.Observe(stream.Context(), "execute.api.stream", nil, func(ctx context.Context, span trace.Span) (any, error) {
		return s.stream(ctx, req, func(resp *apiv1.StreamResponse) error {
			if err := forEach(resp); err != nil && first == nil {
				// NOTE(frank): Do not return this error.
				first = err

				if e := transformCommonQuotaErrorToError(sberror.ToCommonV1(first)); e != nil {
					first = e
				}
			}

			return nil
		}, nil)
	}, nil); err != nil {
		return err
	}

	return
}

func (s *server) Download(req *apiv1.DownloadRequest, stream apiv1.ExecutorService_DownloadServer) error {
	s.Logger.Info("Received file download request", zap.String("location", req.GetLocation()))
	location := req.GetLocation()

	if !s.isPathUnderTempDir(location) {
		s.Logger.Error("Requested download path is not under the temp directory", zap.String("location", location))
		return sberror.ErrNotFound
	}

	if !s.isFile(location) {
		s.Logger.Error("Requested download path is not a file", zap.String("location", location))
		return sberror.ErrNotFound
	}

	file, err := os.Open(location)
	if err != nil {
		return sberror.ErrNotFound
	}
	defer file.Close()

	buffer := make([]byte, 1024)

	for {
		n, err := file.Read(buffer)
		if err != nil {
			if err == io.EOF {
				break
			}
			s.Logger.Error("Failed to read file", zap.String("location", req.GetLocation()), zap.Error(err))
			return sberror.ErrInternal
		}

		if err := stream.Send(&apiv1.DownloadResponse{
			Data: buffer[:n],
		}); err != nil {
			return sberror.ErrInternal
		}
	}

	return nil
}

func (*server) isPathUnderTempDir(path string) bool {
	tempDir, err := filepath.Abs(os.TempDir())
	if err != nil {
		return false
	}

	resolvedTempDir, err := filepath.EvalSymlinks(tempDir)
	if err != nil {
		return false
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return false
	}

	// Resolve symlinks to get the real path
	resolvedPath, err := filepath.EvalSymlinks(absPath)
	if err != nil {
		return false
	}

	relPath, err := filepath.Rel(resolvedTempDir, resolvedPath)
	if err != nil {
		return false
	}

	return !strings.HasPrefix(relPath, "..")
}

func (*server) isFile(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}

	return info.Mode().IsRegular()
}

// returns a copy of the given inputs with 'Global.user' populated with values from the upstream JWT
// this will not mutate the given inputs
func injectGlobalUserIntoInputs(ctx context.Context, inputs map[string]*structpb.Value) (map[string]*structpb.Value, error) {
	// construct the user from the jwt

	// REQUIRED

	email, ok := jwt_validator.GetUserEmail(ctx)
	if !ok {
		return nil, errors.New("could not get user email")
	}

	userStruct := &structpb.Struct{
		Fields: map[string]*structpb.Value{
			"email":    structpb.NewStringValue(email),
			"username": structpb.NewStringValue(email),
		},
	}

	// OPTIONAL

	id, ok := jwt_validator.GetUserId(ctx)
	if ok {
		userStruct.Fields["id"] = structpb.NewStringValue(id)
	}

	displayName, ok := jwt_validator.GetUserDisplayName(ctx)
	if ok {
		userStruct.Fields["name"] = structpb.NewStringValue(displayName)
	}

	rbacGroupObjects, ok := jwt_validator.GetRbacGroupObjects(ctx)
	if ok {
		// NOTE: @joeyagreco - gross.. not ideal that we have to do this conversion manually
		structPbRbacGroupObjects := make([]*structpb.Value, len(rbacGroupObjects))
		for i, obj := range rbacGroupObjects {
			structPbObj, err := utils.ProtoToStructPb(obj, nil)
			if err != nil {
				return nil, errors.New("error converting rbac groups")
			}
			structPbRbacGroupObjects[i] = structpb.NewStructValue(structPbObj)
		}
		userStruct.Fields["groups"] = structpb.NewListValue(&structpb.ListValue{Values: structPbRbacGroupObjects})
	}

	// OPTIONAL
	metadata, ok := jwt_validator.GetMetadata(ctx)
	if ok {
		userStruct.Fields["metadata"] = structpb.NewStructValue(metadata)
	}

	// clone or create the global struct
	var globalStruct *structpb.Struct
	if val, ok := inputs["Global"]; ok && val.GetStructValue() != nil {
		globalStruct = proto.Clone(val.GetStructValue()).(*structpb.Struct)
	} else {
		globalStruct = &structpb.Struct{Fields: map[string]*structpb.Value{}}
	}

	if globalStruct.Fields == nil {
		globalStruct.Fields = map[string]*structpb.Value{}
	}

	// upsert 'user' field
	globalStruct.Fields["user"] = structpb.NewStructValue(userStruct)

	// clone inputs map and insert updated global
	outputs := make(map[string]*structpb.Value, len(inputs))
	for k, v := range inputs {
		if v != nil {
			outputs[k] = proto.Clone(v).(*structpb.Value)
		}
	}
	outputs["Global"] = structpb.NewStructValue(globalStruct)

	return outputs, nil
}

// getViewMode returns the view mode for the request.
// For fetch/fetchByPath/fetchCode, it uses the nested view_mode.
// For inline definitions, it uses the top-level view_mode.
func getViewMode(req *apiv1.ExecuteRequest) apiv1.ViewMode {
	if fetch := req.GetFetch(); fetch != nil {
		return fetch.GetViewMode()
	}
	if fetchByPath := req.GetFetchByPath(); fetchByPath != nil {
		return fetchByPath.GetViewMode()
	}
	if fetchCode := req.GetFetchCode(); fetchCode != nil {
		return fetchCode.GetViewMode()
	}
	return req.GetViewMode()
}

func (s *server) stream(ctx context.Context, req *apiv1.ExecuteRequest, send func(*apiv1.StreamResponse) error, bus functions.Bus) (done *executor.Done, err error) {
	ctx = constants.WithAgentId(
		constants.WithAgentVersion(
			constants.WithApiStartTime(ctx, time.Now().UnixMilli()),
			s.AgentVersion,
		),
		s.AgentId,
	)

	var disableSignatureVerification bool
	{
		// NOTE(frank): If an API literal is being presented for execution,
		// we do not perform signature validation. We call this "insecure".
		if _, ok := req.GetRequest().(*apiv1.ExecuteRequest_Definition); ok {
			disableSignatureVerification = true
		}
	}

	useAgentKey := s.getUseAgentKeyForHydration(ctx)

	var result *apiv1.Definition
	var rawResult *structpb.Struct
	var rawApiValue *structpb.Value
	{
		result, rawResult, err = executor.Fetch(ctx, req, s.Fetcher, useAgentKey, s.Logger)
		rawApiValue, _ = utils.GetStructField(rawResult, "api")
	}

	if err != nil {
		return nil, err
	}

	// Code-mode direct execution: bypass the block executor entirely.
	// Bundle was fetched in Fetch(); generate wrapper script and dispatch to JS worker.
	if fetchCode := req.GetFetchCode(); fetchCode != nil {
		return s.executeCodeMode(ctx, fetchCode, result, rawResult, req, useAgentKey, send)
	}

	viewMode := getViewMode(req)

	var inputs map[string]*structpb.Value
	{
		var params *commonv1.HttpParameters
		{
			if trigger := result.Api.GetTrigger(); trigger != nil && trigger.GetWorkflow() != nil && viewMode != apiv1.ViewMode_VIEW_MODE_DEPLOYED {
				params = executor.ToHttpParameters(trigger.GetWorkflow().GetParameters())
			} else {
				params = &commonv1.HttpParameters{}
			}
		}

		// NOTE(frank): This is where we set the special `params` and `body` globals for workflows and scheduled jobs.
		if trigger := result.Api.GetTrigger(); trigger != nil && (trigger.GetWorkflow() != nil || trigger.GetJob() != nil) {
			inputs, err = params.WithSuperblocksInjected(result.Metadata.Profile).AsInputs(ctx, func(_ context.Context, s string) (*string, error) {
				// Don't resolve since this is the behavior we see in v1
				return &s, nil
			})

			if err != nil {
				s.Logger.Error("could not compute inputs for workflow", zap.Error(err))
				return nil, err
			}

			for k, v := range req.Inputs {
				switch k {
				case "params", "body":
					for fk, fv := range v.GetStructValue().GetFields() {
						inputs[k].GetStructValue().GetFields()[fk] = fv
					}
				default:
					inputs[k] = v
				}
			}
		} else {
			inputs = req.Inputs
		}
	}

	// check if we used a JWT for auth
	// if we did, then we are safe to inject `Global.user` based on claims from JWT
	requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
	if err != nil {
		s.Logger.Error("could not determine if request used jwt auth")
		return nil, err
	}
	if requestUsesJwtAuth {
		inputs, err = injectGlobalUserIntoInputs(ctx, inputs)
		if err != nil {
			return nil, fmt.Errorf("error injecting 'Global.user' into inputs: %w", err)
		}
	}

	var legacyTemplatePlugin func(*plugins.Input) plugins.Plugin
	var legacyTemplateResolver func(context.Context, *utils.TokenJoiner, string) engine.Value
	var legacyTemplateTokenJoiner *utils.TokenJoiner
	var templatePlugin func(*plugins.Input) plugins.Plugin
	{
		if req.GetFetchByPath() != nil {
			templatePlugin = expression.Instance

			legacyTemplatePlugin = legacyexpression.Instance
			legacyTemplateResolver = legacyexpression.Resolver
			legacyTemplateTokenJoiner, err = utils.NewTokenJoiner()
			if err != nil {
				s.Logger.Error("error creating legacy template token joiner", zap.Error(err))
				return nil, sberror.ErrInternal
			}
		} else {
			// Fetch and inline definitions use mustache.
			// (FetchCode takes the direct code-mode path and never reaches here.)
			templatePlugin = mustache.Instance
		}
	}

	var failures []*commonv1.Error
	var mutex sync.Mutex

	// Extract the raw JWT from gRPC metadata so it can be forwarded to the
	// task-manager (via transport Props) for proxied integration execution.
	var jwtToken string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if vals := md.Get(constants.HeaderSuperblocksJwt); len(vals) > 0 {
			jwtToken = strings.TrimPrefix(vals[0], "Bearer ")
		}
	}

	var fetchToken string
	var branchName string
	if fetch := req.GetFetch(); fetch != nil {
		fetchToken = fetch.GetToken()
		branchName = fetch.GetBranchName()
	} else if fetchByPath := req.GetFetchByPath(); fetchByPath != nil {
		branchName = fetchByPath.GetBranchName()
	}
	// NOTE: FetchCode requests are handled by executeCodeMode() above and never reach here.

	done, err, _ = executor.Execute(ctx, &executor.Options{
		Logger:                       s.Logger.With(observability.Enrich(result.Api, viewMode.Enum())...).With(observability.EnrichUserInfo(ctx, result.Metadata)...),
		Store:                        s.Store,
		Worker:                       s.Worker,
		Integrations:                 result.Integrations,
		Api:                          result.Api,
		RawApi:                       rawApiValue,
		DefinitionMetadata:           result.Metadata,
		Requester:                    result.GetMetadata().GetRequester(),
		OrgPlan:                      result.GetMetadata().GetOrganizationPlan(),
		Options:                      req.Options,
		Files:                        req.Files,
		FileServerUrl:                s.FileServerUrl,
		JwtToken:                     jwtToken,
		Profile:                      req.GetProfile(),
		Inputs:                       inputs,
		Fetcher:                      s.Fetcher,
		Flags:                        s.Flags,
		TokenManager:                 s.TokenManager,
		IsDeployed:                   viewMode == apiv1.ViewMode_VIEW_MODE_DEPLOYED,
		DefaultResolveOptions:        s.DefaultResolveOptions,
		FetchToken:                   fetchToken,
		RootStartTime:                time.Now(),
		SecretManager:                s.SecretManager,
		GarbageCollect:               true,
		UseAgentKey:                  s.getUseAgentKeyForHydration(ctx),
		Stores:                       result.GetStores(),
		Secrets:                      s.Secrets,
		Signature:                    s.Signature,
		DisableSignatureVerification: disableSignatureVerification,
		BranchName:                   branchName,
		Mocker:                       mocker.New(req.GetMocks(), bus),
		TemplatePlugin:               templatePlugin,
		LegacyTemplatePlugin:         legacyTemplatePlugin,
		LegacyTemplateResolver:       legacyTemplateResolver,
		LegacyTemplateTokenJoiner:    legacyTemplateTokenJoiner,
	}, func(resp *apiv1.StreamResponse) error {
		if err := executor.ExtractErrorFromEvent(resp.GetEvent()); err != nil {
			mutex.Lock()
			failures = append(failures, sberror.ToCommonV1(err))
			mutex.Unlock()
		}

		if _, ok := resp.Event.Event.(*apiv1.Event_Response_); ok {
			resp.Event.Event.(*apiv1.Event_Response_).Response.Errors = failures
		}

		return send(resp)
	})

	return done, err
}

// executeCodeMode handles the FetchCode (API 2.0 / code-mode) execution path.
// It bypasses the block executor entirely: uses the bundle from rawResult (fetched
// in Fetch()), generates a JS wrapper with user context + inputs, and dispatches
// the combined script directly to the JS worker.
func (s *server) executeCodeMode(
	ctx context.Context,
	fetchCode *apiv1.ExecuteRequest_FetchCode,
	result *apiv1.Definition,
	rawResult *structpb.Struct,
	req *apiv1.ExecuteRequest,
	useAgentKey bool,
	send func(*apiv1.StreamResponse) error,
) (*executor.Done, error) {
	logger := s.Logger.With(
		zap.String("execution_path", "code-mode"),
		zap.String("organizationId", result.GetApi().GetMetadata().GetOrganization()),
	)
	executionID := constants.ExecutionID(ctx)

	sendError := func(err error) (*executor.Done, error) {
		commonErr := sberror.ToCommonV1(err)
		_ = send(&apiv1.StreamResponse{
			Execution: executionID,
			Event: &apiv1.Event{
				Name: result.GetApi().GetMetadata().GetName(),
				Type: apiv1.BlockType_BLOCK_TYPE_STEP,
				Event: &apiv1.Event_End_{
					End: &apiv1.Event_End{
						Error: commonErr,
					},
				},
			},
		})
		return nil, err
	}

	bundle := ""
	if rawResult != nil {
		if f := rawResult.GetFields()["bundle"]; f != nil {
			bundle = f.GetStringValue()
		}
	}
	if bundle == "" {
		detail := "empty bundle string"
		if rawResult == nil {
			detail = "nil rawResult"
		}
		logger.Error("missing bundle in rawResult", zap.String("detail", detail))
		return sendError(fmt.Errorf("missing bundle in code-mode response: %s", detail))
	}

	user, err := extractUserContext(ctx)
	if err != nil {
		logger.Error("could not extract user context", zap.Error(err))
		// Code-mode requires JWT for user context. Return auth error so callers get
		// Unauthenticated (not Internal) when reaching this path via legacy Await/Stream.
		return sendError(sberror.AuthorizationError(err))
	}

	wrapperScript, err := generateWrapperScript(user, req.GetInputs(), bundle)
	if err != nil {
		logger.Error("could not generate wrapper script", zap.Error(err))
		return sendError(err)
	}

	workerData := &transportv1.Request_Data_Data{
		Props: &transportv1.Request_Data_Data_Props{
			ActionConfiguration: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": structpb.NewStringValue(wrapperScript),
				},
			},
			StepName: "code-mode",
		},
		AConfig: &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"body": structpb.NewStringValue(wrapperScript),
			},
		},
		Quotas: &transportv1.Request_Data_Data_Quota{
			Duration: 1_200_000, // 20 minutes, matches javascriptExecutionTimeoutMs default
		},
	}

	_, outputKey, err := s.Worker.Execute(ctx, "javascriptsdkapi", workerData)
	if err != nil {
		logger.Error("worker execution failed", zap.Error(err))
		return sendError(err)
	}

	// Clean up the output key from the store to prevent leaking Redis keys.
	defer func() {
		if outputKey != "" {
			if delErr := s.Store.Delete(context.WithoutCancel(ctx), outputKey); delErr != nil {
				logger.Warn("could not garbage-collect worker output key", zap.Error(delErr), zap.String("output_key", outputKey))
			}
		}
	}()

	values, err := s.Store.Read(ctx, outputKey)
	if err != nil {
		logger.Error("could not read worker output", zap.Error(err), zap.String("output_key", outputKey))
		return sendError(err)
	}

	var output apiv1.Output
	if len(values) > 0 && values[0] != nil {
		var raw string
		switch v := values[0].(type) {
		case string:
			raw = v
		case []byte:
			raw = string(v)
		default:
			return sendError(fmt.Errorf("unexpected store value type %T", values[0]))
		}
		parsed, jsonErr := apiv1.OutputFromOutputOldJSON([]byte(raw))
		if jsonErr != nil {
			logger.Error("could not unmarshal worker output", zap.Error(jsonErr))
			return sendError(fmt.Errorf("could not unmarshal worker output: %w", jsonErr))
		}
		output = *parsed
	}

	var responseErrors []*commonv1.Error
	if len(output.Stderr) > 0 {
		responseErrors = make([]*commonv1.Error, len(output.Stderr))
		for i, msg := range output.Stderr {
			responseErrors[i] = &commonv1.Error{Message: msg}
		}
	}

	if sendErr := send(&apiv1.StreamResponse{
		Execution: executionID,
		Event: &apiv1.Event{
			Name: result.GetApi().GetMetadata().GetName(),
			Event: &apiv1.Event_Response_{
				Response: &apiv1.Event_Response{
					Last:   "code-mode",
					Errors: responseErrors,
				},
			},
		},
	}); sendErr != nil {
		logger.Error("could not send stream response", zap.Error(sendErr))
		return nil, sendErr
	}

	return &executor.Done{
		Output: &output,
		Last:   "code-mode",
	}, nil
}

func (s *server) Status(ctx context.Context, req *apiv1.StatusRequest) (*apiv1.AwaitResponse, error) {
	return s.UnimplementedExecutorServiceServer.Status(ctx, req)
}

func (s *server) Cancel(ctx context.Context, req *apiv1.CancelRequest) (*apiv1.CancelResponse, error) {
	return s.UnimplementedExecutorServiceServer.Cancel(ctx, req)
}

// NOTE(frank): Ask ChatGPT to simply this code.
func (s *server) Validate(_ context.Context, req *apiv1.ValidateRequest) (_ *emptypb.Empty, err error) {
	e := &sberror.ValidationError{}

	if req == nil || req.Api == nil {
		e.Issues = append(e.Issues, errors.New("an API must be defined"))
		return new(emptypb.Empty), e
	}

	e.Issues = append(e.Issues, validation.Validate(req.Api)...)
	failures := utils.ProtoValidate(req.Api)

	// There we no errors in either static or dynamic validation.
	if failures == nil && e.Issues == nil && len(e.Issues) == 0 {
		return new(emptypb.Empty), nil
	}

	if ve, ok := sberror.IsValidationError(failures); ok {
		e.Issues = append(e.Issues, ve.Issues...)
	} else if failures != nil {
		e.Issues = append(e.Issues, failures)
	}

	if e.Issues == nil || len(e.Issues) == 0 {
		return new(emptypb.Empty), nil
	}

	return new(emptypb.Empty), e
}

func (s *server) Metadata(ctx context.Context, req *apiv1.MetadataRequest) (*apiv1.MetadataResponse, error) {
	span := trace.SpanFromContext(ctx)

	span.SetAttributes(
		attribute.String(observability.OBS_TAG_INTEGRATION_ID, req.Integration),
	)

	integration, err := s.Fetcher.FetchIntegration(ctx, req.Integration, req.Profile)
	if err != nil {
		return nil, sberror.ErrNotFound
	}

	span.SetAttributes(
		attribute.String(observability.OBS_TAG_PLUGIN_NAME, integration.PluginId),
	)

	configuration, err := structpb.NewValue(integration.Configuration)

	if err != nil {
		return nil, sberror.ErrInternal
	}

	var profile string
	{
		if req.Profile != nil {
			profile = *req.Profile.Name
		}
	}

	renderedIntegrationConfig, err := s.evaluateDatasource(ctx, configuration.GetStructValue(), req.Integration, "", integration.PluginId, profile)
	if err != nil {
		return nil, err
	}

	// TODO: fix ui to send the action configuration, not the step
	pluginConfig, ok := req.GetStepConfiguration().GetFields()[integration.PluginId]
	if !ok {
		empty := make(map[string]interface{})
		emptyConfig, err := structpb.NewStruct(empty)
		if err != nil {
			s.Logger.Error("failed to create empty struct", zap.Error(err))
			return nil, sberror.ErrInternal
		}
		pluginConfig = structpb.NewStructValue(emptyConfig)
	}

	orgPlan, orgId := getOrganizationPlanAndIdFromContext(ctx)
	resp, err := s.Worker.Metadata(ctx, integration.PluginId, renderedIntegrationConfig, pluginConfig.GetStructValue(), workeroptions.OrganizationPlan(orgPlan), workeroptions.OrgId(orgId))
	if err != nil {
		return nil, sberror.ToIntegrationError(err)
	}

	metaRes := &apiv1.MetadataResponse{}

	// NOTE: @joeyagreco - the code below is an abomination to the lord
	// NOTE: @joeyagreco - im sorry

	if dbSchema := resp.GetData().GetData().GetDbSchema(); dbSchema != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_DatabaseSchemaMetadata_{
			DatabaseSchemaMetadata: dbSchema,
		}
	}

	if buckets := resp.GetData().GetData().GetBuckets(); buckets != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_BucketsMetadata_{
			BucketsMetadata: &apiv1.MetadataResponse_BucketsMetadata{
				Buckets: buckets,
			},
		}
	}

	if couchbase := resp.GetData().GetData().GetCouchbase(); couchbase != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Couchbase{
			Couchbase: couchbase,
		}
	}

	if kafka := resp.GetData().GetData().GetKafka(); kafka != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Kafka{
			Kafka: kafka,
		}
	}

	if kinesis := resp.GetData().GetData().GetKinesis(); kinesis != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Kinesis{
			Kinesis: kinesis,
		}
	}

	if cosmosdb := resp.GetData().GetData().GetCosmosdb(); cosmosdb != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Cosmosdb{
			Cosmosdb: cosmosdb,
		}
	}

	if adls := resp.GetData().GetData().GetAdls(); adls != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Adls{
			Adls: adls,
		}
	}

	if graphql := resp.GetData().GetData().GetGraphql(); graphql != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Graphql{
			Graphql: graphql,
		}
	}

	if gSheetsNextPageToken := resp.GetData().GetData().GetGSheetsNextPageToken(); gSheetsNextPageToken != "" {
		metaRes.GSheetsNextPageToken = gSheetsNextPageToken
	}

	return metaRes, nil
}

func (s *server) MetadataDeprecated(ctx context.Context, req *apiv1.MetadataRequestDeprecated) (*apiv1.MetadataResponse, error) {
	var err error
	var fetchRes *apiv1.Definition
	{
		useAgentKey := s.getUseAgentKeyForHydration(ctx)
		fetchRes, _, err = s.Fetcher.FetchApi(ctx, &apiv1.ExecuteRequest_Fetch{
			Id:      req.ApiId,
			Profile: req.Profile,
		}, useAgentKey)
	}

	if err != nil {
		return nil, err
	}

	var integration *structpb.Struct
	for id, integrationRes := range fetchRes.Integrations {
		if id == req.Integration {
			integration = integrationRes
			break
		}
	}

	// some integrations don't have any config, namely language plugins
	// It would be nice to force language plugins to have a config in the future so we can
	// validate the integration is defined in the API.
	if integration == nil {
		return &apiv1.MetadataResponse{}, nil
	}

	var pluginName string
	var actionConfig *structpb.Struct

	utils.ForEachBlockInAPI(fetchRes.Api, func(b *apiv1.Block) {
		if pluginName != "" {
			return
		}

		if b.GetStep().GetIntegration() != req.Integration {
			return
		}

		if plugin, ok := b.GetStep().GetConfig().(plugin.Plugin); ok {
			pluginName = plugin.Name()

			// Need to convert strong proto type to generic structpb for the worker.
			if ac, err := getActionConfig(b.GetStep(), pluginName); err == nil && ac != nil {
				actionConfig = ac
			}
		}
	})

	if pluginName == "" {
		s.Logger.Error("could not find plugin name in API blocks",
			zap.String("integration", req.Integration),
			zap.String("api_id", req.ApiId),
			zap.String("plugin_name", pluginName),
		)
		return nil, sberror.ErrInternal
	}

	var profile string
	{
		if req.Profile != nil {
			profile = *req.Profile.Name
		}
	}

	renderedIntegrationConfig, err := s.evaluateDatasource(ctx, integration, req.Integration, "", pluginName, profile)
	if err != nil {
		return nil, err
	}

	orgPlan, orgId := getOrganizationPlanAndIdFromContext(ctx)
	resp, err := s.Worker.Metadata(ctx, pluginName, renderedIntegrationConfig, actionConfig, workeroptions.OrganizationPlan(orgPlan), workeroptions.OrgId(orgId))
	if err != nil {
		return nil, sberror.ToIntegrationError(err)
	}

	metaRes := &apiv1.MetadataResponse{}

	if dbSchema := resp.GetData().GetData().GetDbSchema(); dbSchema != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_DatabaseSchemaMetadata_{
			DatabaseSchemaMetadata: dbSchema,
		}
	}

	if buckets := resp.GetData().GetData().GetBuckets(); buckets != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_BucketsMetadata_{
			BucketsMetadata: &apiv1.MetadataResponse_BucketsMetadata{
				Buckets: buckets,
			},
		}
	}

	if kafka := resp.GetData().GetData().GetKafka(); kafka != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Kafka{
			Kafka: kafka,
		}
	}

	if cosmosdb := resp.GetData().GetData().GetCosmosdb(); cosmosdb != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Cosmosdb{
			Cosmosdb: cosmosdb,
		}
	}

	if adls := resp.GetData().GetData().GetAdls(); adls != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Adls{
			Adls: adls,
		}
	}

	if graphql := resp.GetData().GetData().GetGraphql(); graphql != nil {
		metaRes.Metadata = &apiv1.MetadataResponse_Graphql{
			Graphql: graphql,
		}
	}

	return metaRes, nil
}

func (s *server) Test(ctx context.Context, req *apiv1.TestRequest) (*apiv1.TestResponse, error) {
	// Require authorization header to prevent unauthenticated code execution
	requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
	if err != nil || !requestUsesJwtAuth {
		return nil, sberror.AuthorizationError(errors.New("Authorization header required"))
	}

	var integration string
	{
		if req != nil && req.GetDatasourceConfig() != nil && req.GetDatasourceConfig().Fields != nil {
			integration = req.GetDatasourceConfig().Fields["id"].GetStringValue()
		}
	}

	var profile string
	{
		if req.Profile != nil {
			profile = *req.Profile.Name
		}
	}

	var plugin string
	{
		// NOTE(frank): This needs to be done in the Protobuf.
		if plugin = strings.ToLower(req.GetIntegrationType()); plugin == "" {
			return nil, &sberror.ValidationError{Issues: []error{errors.New("integration type is required")}}
		}
	}

	s.Logger.Info("Test",
		zap.String("integration", integration),
		zap.String("plugin", plugin),
		zap.String("profile", profile),
	)

	if integration != "" {
		if fetched, err := s.Fetcher.FetchIntegrationMetadata(ctx, integration); err == nil || fetched.GetData().GetDemoIntegrationId() != "" {
			s.Logger.Error("could not FetchIntegrationMetadata",
				zap.Error(err),
				zap.String("integration", integration),
				zap.String("profile", profile),
			)
			return &apiv1.TestResponse{}, nil
		}
	}

	ctx = constants.WithEventType(ctx, constants.EventTypeTest)
	renderedIntegrationConfig, err := s.evaluateDatasource(ctx, req.GetDatasourceConfig(), integration, req.ConfigurationId, plugin, profile)
	if err != nil {
		return nil, err
	}

	orgPlan, orgId := getOrganizationPlanAndIdFromContext(ctx)
	if _, err := s.Worker.TestConnection(ctx, plugin, renderedIntegrationConfig, req.ActionConfig, workeroptions.OrganizationPlan(orgPlan), workeroptions.OrgId(orgId)); err != nil {
		return nil, sberror.ToIntegrationError(err)
	}

	return &apiv1.TestResponse{}, nil
}

func (s *server) Delete(ctx context.Context, req *apiv1.DeleteRequest) (*apiv1.DeleteResponse, error) {
	// Skip the testing if the integration exist, and it's demo integration
	integrationId := req.GetIntegration()
	pluginName := strings.ToLower(req.GetPluginName())

	integration, err := s.Fetcher.FetchIntegration(ctx, integrationId, req.Profile)
	if err != nil {
		s.Logger.Info("Integration already deleted", zap.String("integrationId", integrationId))
		return &apiv1.DeleteResponse{}, nil
	}

	if pluginName == "" {
		pluginName = strings.ToLower(integration.PluginId)
	}
	integrationStruct, err := structpb.NewStruct(integration.Configuration)
	if err != nil {
		s.Logger.Warn("Failed to convert integration to pb struct", zap.String("integrationId", integrationId))
		return nil, sberror.ErrInternal
	}

	if integrationStruct.Fields["authType"].GetStringValue() == "oauth-code" {
		// mostly used for gsheets, since rest-apis / graphql plugins dont support the test endpoint
		_, err := s.TokenManager.AddTokenIfNeeded(ctx, integrationStruct, nil, nil, integrationId, req.GetConfigurationId(), pluginName)

		// for gsheet it's guaranteed there will be a token, but for rest or graphql with oauth-code auth,
		// token might not be there at all, so it's ok to continue the deletion
		if err != nil && pluginName == "gsheets" {
			if errors.Is(err, oauth.ErrInvalidRefreshToken) {
				// log and continue with deletion for this case of expired refresh token (indicates integration was deleted on google side)
				s.Logger.Warn("Failed to add token due to invalid refresh token", zap.String("integrationId", integrationId))
			} else {
				return nil, err
			}
		}
	}

	orgPlan, orgId := getOrganizationPlanAndIdFromContext(ctx)
	_, err = s.Worker.PreDelete(ctx, pluginName, integrationStruct, workeroptions.OrganizationPlan(orgPlan), workeroptions.OrgId(orgId))
	if err != nil {
		s.Logger.Warn("Failed to delete integration", zap.String("integrationId", integrationId))
		return nil, sberror.ToIntegrationError(err)
	}

	return &apiv1.DeleteResponse{}, nil
}

func (s *server) Invalidate(ctx context.Context, req *secretsv1.InvalidateRequest) (*secretsv1.InvalidateResponse, error) {
	var secrets []string
	{
		if req.GetSecret() != "" {
			secrets = append(secrets, req.GetSecret())
		}
	}

	invalidations, err := s.Secrets.Invalidate(ctx, req.GetStore(), req.GetConfigurationId(), secrets...)
	if err != nil {
		return nil, err
	}

	return &secretsv1.InvalidateResponse{
		Invalidations: invalidations,
	}, nil
}

func (s *server) ListSecrets(ctx context.Context, req *secretsv1.ListSecretsRequest) (*secretsv1.ListSecretsResponse, error) {
	if err := utils.ProtoValidate(req); err != nil {
		return nil, err
	}

	var store *secretsv1.Store
	{
		if req.GetProvider() == nil {
			resp, err := tracer.Observe[*integrationv1.GetIntegrationsResponse](ctx, "fetch.integrations", nil, func(ctx context.Context, _ trace.Span) (*integrationv1.GetIntegrationsResponse, error) {
				kind := integrationv1.Kind_KIND_SECRET

				return s.Fetcher.FetchIntegrations(ctx, &integrationv1.GetIntegrationsRequest{
					Profile: req.GetProfile(),
					Kind:    &kind,
					Slug:    proto.String(req.GetStore()),
				}, false)
			}, nil)
			if err != nil {
				s.Logger.Error("failed to fetch secret integrations", zap.Error(err))
				return nil, err
			}

			if len(resp.Data) != 1 {
				s.Logger.Debug("no secret integrations were found")
				return nil, sberror.ErrNotFound
			}

			stores, err := utils.IntegrationsToSecretStores(resp.Data)
			if err != nil {
				s.Logger.Error("failed to convert integration to secret stores", zap.Error(err))
				return nil, sberror.ErrInternal
			}

			if len(stores) != 1 {
				s.Logger.Error("expected a single secret store configuration")
				return nil, sberror.ErrInternal
			}

			store = stores[0]
		} else {
			store = &secretsv1.Store{
				Provider: req.GetProvider(),
			}
		}
	}

	details, err := tracer.Observe[[]*secretsv1.Details](ctx, "fetch.secrets", nil, func(ctx context.Context, _ trace.Span) ([]*secretsv1.Details, error) {
		return s.Secrets.List(ctx, store)
	}, nil)
	if err != nil {
		s.Logger.Error("failed to list secrets", zap.Error(err))
		return nil, err
	}

	return &secretsv1.ListSecretsResponse{
		Secrets: details,
	}, nil
}

func (s *server) Sign(_ context.Context, req *securityv1.SignRequest) (*securityv1.SignResponse, error) {
	if err := utils.ProtoValidate(req); err != nil {
		return nil, &sberror.ValidationError{Issues: []error{err}}
	}

	signature, err := s.Signature.Sign(req.Resource)
	if err != nil {
		return nil, err
	}

	signingKeyId := s.Signature.SigningKeyID()
	publicKeys := s.Signature.PublicKeys()

	return &securityv1.SignResponse{
		Signature: &utilsv1.Signature{
			KeyId:     signingKeyId,
			Algorithm: publicKeys[signingKeyId].Algorithm,
			PublicKey: publicKeys[signingKeyId].Value,
			Data:      signature,
		},
	}, nil
}

func (s *server) Verify(ctx context.Context, req *securityv1.VerifyRequest) (*securityv1.VerifyResponse, error) {
	if err := utils.ProtoValidate(req); err != nil {
		return nil, &sberror.ValidationError{Issues: []error{err}}
	}

	for _, resource := range req.Resources {
		if err := s.Signature.Verify(resource); err != nil {
			return nil, err
		}
	}

	return &securityv1.VerifyResponse{
		KeyId: s.Signature.SigningKeyID(),
	}, nil
}

func getActionConfig(step *apiv1.Step, pluginName string) (*structpb.Struct, error) {
	protoBytes, err := protojson.Marshal(step)
	if err != nil {
		return nil, err
	}

	stepStruct := &structpb.Struct{}
	err = protojson.Unmarshal(protoBytes, stepStruct)
	if err != nil {
		return nil, err
	}

	return stepStruct.GetFields()[pluginName].GetStructValue(), nil
}

func transformCommonQuotaErrorToError(err *commonv1.Error) error {
	if err != nil && err.Name == "QuotaError" {
		return sberror.NewQuotaError(err.Message, "")
	}
	return nil
}

// client must call sandbox.Close() and garbage.Run
func (s *server) getSbctx(ctx context.Context, st store.Store, integrationProfileName string, integrationConfigs map[string]*structpb.Struct) (*apictx.Context, engine.Sandbox, gc.GC, error) {
	var sandbox engine.Sandbox
	{
		sandbox = javascript.Sandbox(ctx, &javascript.Options{
			Logger:    s.Logger,
			Store:     st,
			AfterFunc: internalutils.EngineAfterFunc,
		})
	}

	var garbage gc.GC
	{
		garbage = gc.New(&gc.Options{
			Store: st,
		})
	}

	var inputs map[string]*structpb.Value
	{
		inputs = map[string]*structpb.Value{}

		var agentAppVarMap = map[string]*structpb.Value{}
		for k, v := range s.Config.SecretManager.GetSecrets() {
			agentAppVarMap[k] = structpb.NewStringValue(v)
		}
		inputs["Env"] = structpb.NewStructValue(&structpb.Struct{Fields: agentAppVarMap})

		stores, err := executor.FetchSecretStores(ctx, s.Fetcher, integrationProfileName, false, s.Logger)
		if err != nil {
			s.Logger.Error("failed to fetch secret stores", zap.Error(err))
			return nil, nil, nil, err
		}

		if _, err := tracer.Observe[any](ctx, "fetch.secrets", nil, func(ctx context.Context, _ trace.Span) (any, error) {
			return nil, secrets.RetrieveAndUnmarshalIfNeeded(
				ctx,
				s.Secrets,
				stores,
				nil,
				integrationConfigs,
				inputs,
			)
		}, nil); err != nil {
			s.Logger.Error("failed to retrieve secrets", zap.Error(err))
			return nil, nil, nil, err
		}
	}

	var sbctx *apictx.Context
	{
		sbctx = apictx.New(&apictx.Context{
			Context: ctx,
			Parent:  "NONE",
		})

		variables, err := executor.ExtractVariablesFromInputs(inputs, nil)
		if err != nil {
			s.Logger.Error("could not transform secrets into variables", zap.Error(err))
			return nil, nil, nil, err
		}

		sbctxWithVariables, err := executor.Variables(sbctx, &apiv1.Variables{
			Items: variables,
		}, sandbox, s.Logger, garbage, st)
		if err != nil {
			s.Logger.Error("could not initialize variables", zap.Error(err))
			return nil, nil, nil, err
		}

		sbctx = sbctxWithVariables
	}
	return sbctx, sandbox, garbage, nil
}

func (s *server) evaluateDatasource(
	ctx context.Context,
	unrenderedIntegrationConfig *structpb.Struct,
	integrationId, integrationConfigurationId, pluginName, profileName string,
) (*structpb.Struct, error) {
	unrenderedRedactedIntegrationConfig, err := structpb.NewValue(unrenderedIntegrationConfig.AsMap())
	if err != nil {
		return nil, err
	}

	memory := store.Memory()
	sbctx, sandbox, garbage, err := s.getSbctx(ctx, memory, profileName, map[string]*structpb.Struct{
		"anonymous": unrenderedIntegrationConfig,
	})
	if sandbox != nil {
		defer sandbox.Close()
	}
	if garbage != nil {
		defer func() {
			if err := garbage.Run(context.Background()); err != nil {
				s.Logger.Error("could not run garbage collection", zap.Error(err))
			}
		}()
	}
	if err != nil {
		return nil, err
	}

	// Handles auth tokens and dynamic workflow configs
	renderedIntegrationConfig, _, err := executor.EvaluateDatasource(
		sbctx,
		sandbox,
		structpb.NewStructValue(unrenderedIntegrationConfig),
		unrenderedRedactedIntegrationConfig,
		integrationId,
		integrationConfigurationId,
		pluginName,
		garbage,
		&executor.Options{
			Worker:        s.Worker,
			Flags:         s.Flags,
			Logger:        s.Logger,
			Store:         s.Store,
			TokenManager:  s.TokenManager,
			Fetcher:       s.Fetcher,
			SecretManager: s.SecretManager,
			Secrets:       s.Secrets,
			FileServerUrl: s.FileServerUrl,
			RootStartTime: time.Now(),
			DefinitionMetadata: &apiv1.Definition_Metadata{
				Profile: profileName,
			},
			Timeout:   time.Duration(30 * time.Second),
			Key:       utils.NewMap[string](),
			Signature: s.Signature,
		},
	)
	if err != nil {
		return nil, sberror.ToIntegrationError(err)
	}

	return renderedIntegrationConfig.GetStructValue(), nil
}

func getOrganizationPlanAndIdFromContext(ctx context.Context) (orgPlan string, orgId string) {
	if orgType, ok := jwt_validator.GetOrganizationType(ctx); ok {
		orgPlan = orgType
	}

	if id, ok := jwt_validator.GetOrganizationID(ctx); ok {
		orgId = id
	} else {
		orgId = constants.OrganizationID(ctx)
	}

	return orgPlan, orgId
}
