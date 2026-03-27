package integrationexecutor

import (
	"context"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
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

func makeWorkerJWTContext(superblocksJWT, authorizationJWT string, origin ...string) string {
	if len(origin) > 0 && origin[0] != "" {
		return fmt.Sprintf("%s%s\n%s%s\n%s%s",
			workerJWTContextSuperblocksPrefix, superblocksJWT,
			workerJWTContextAuthorizationPrefix, authorizationJWT,
			workerJWTContextOriginPrefix, origin[0],
		)
	}

	return fmt.Sprintf("%s%s\n%s%s",
		workerJWTContextSuperblocksPrefix, superblocksJWT,
		workerJWTContextAuthorizationPrefix, authorizationJWT,
	)
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

	lastAuthorization string
	lastOrigin        string
	lastRequest       *apiv1.ExecuteRequest
	lastJwtToken      string
	response          *apiv1.AwaitResponse
	err               error
}

func (f *fakeOrchestratorServer) Await(ctx context.Context, req *apiv1.ExecuteRequest) (*apiv1.AwaitResponse, error) {
	f.lastRequest = req

	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if vals := md.Get("authorization"); len(vals) > 0 {
			f.lastAuthorization = vals[0]
		}
		if vals := md.Get("origin"); len(vals) > 0 {
			f.lastOrigin = vals[0]
		}
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
		wantOrigin         string
		wantOrg            string
		wantProfile        *commonv1.Profile
		wantFiles          []*apiv1.ExecuteRequest_File
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT), Profile: profileFallback},
			},
			wantJwt:     "Bearer " + validJWT,
			wantOrg:     testOrgID,
			wantProfile: profileTest,
			wantOutput:  outputValue,
		},
		{
			name: "files lazily fetched from file server and forwarded to Await",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-files",
				IntegrationId:       "int-1",
				PluginId:            "s3",
				ActionConfiguration: actionConfig,
				ViewMode:            apiv1.ViewMode_VIEW_MODE_EDIT,
			},
			// contexts is set dynamically below (needs file server URL)
			wantJwt: "Bearer " + validJWT,
			wantOrg: testOrgID,
			wantFiles: []*apiv1.ExecuteRequest_File{
				{
					OriginalName: "activate.sh-375-1772482012190",
					Buffer:       []byte("#!/bin/bash\necho hello"),
					Encoding:     "7bit",
					MimeType:     "application/x-sh",
					Size:         "22",
				},
			},
			wantOutput: outputValue,
		},
		{
			name: "forwards origin metadata when present",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT, "https://app.superblocks.com")},
			},
			wantJwt:    "Bearer " + validJWT,
			wantOrigin: "https://app.superblocks.com",
			wantOrg:    testOrgID,
			wantOutput: outputValue,
		},
		{
			name: "drops invalid origin metadata when present",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT, "https://app.superblocks.com/oauth/callback")},
			},
			wantJwt:    "Bearer " + validJWT,
			wantOrigin: "",
			wantOrg:    testOrgID,
			wantOutput: outputValue,
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT), Profile: profileFallback},
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
				"exec-1": {JwtToken: makeWorkerJWTContext("not-a-jwt", "not-a-jwt")},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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
				"exec-1": {JwtToken: makeWorkerJWTContext(validJWT, validJWT)},
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

			// For the lazy file server test: spin up a fake HTTP file server
			// that returns file content by path, then wire it into the context.
			if test.contexts == nil {
				fileServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					location := r.URL.Query().Get("location")
					if location == "/tmp/activate.sh" {
						w.Write([]byte("#!/bin/bash\necho hello"))
						return
					}
					http.NotFound(w, r)
				}))
				t.Cleanup(fileServer.Close)

				test.contexts = map[string]*redisstore.ExecutionFileContext{
					"exec-files": {
						JwtToken:      makeWorkerJWTContext(validJWT, validJWT),
						FileServerURL: fileServer.URL,
						AgentKey:      "test-key",
						FileRefs: []redisstore.FileRef{
							{
								OriginalName: "activate.sh-375-1772482012190",
								Encoding:     "7bit",
								MimeType:     "application/x-sh",
								Size:         22,
								Path:         "/tmp/activate.sh",
							},
						},
					},
				}
			}

			svc := &IntegrationExecutorService{
				logger:              zap.NewNop(),
				orchestratorAddress: orchestratorAddr,
				fileContextProvider: &mockFileContextProvider{contexts: test.contexts},
			}

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

			// Verify both authorization and x-superblocks-authorization carry the JWT.
			assert.Equal(t, test.wantJwt, fake.lastAuthorization)
			assert.Equal(t, test.wantJwt, fake.lastJwtToken)
			assert.Equal(t, test.wantOrigin, fake.lastOrigin)

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

			if test.wantFiles != nil {
				require.Len(t, fake.lastRequest.GetFiles(), len(test.wantFiles))
				for i, wf := range test.wantFiles {
					got := fake.lastRequest.GetFiles()[i]
					assert.Equal(t, wf.GetOriginalName(), got.GetOriginalName())
					assert.Equal(t, wf.GetBuffer(), got.GetBuffer())
					assert.Equal(t, wf.GetEncoding(), got.GetEncoding())
					assert.Equal(t, wf.GetMimeType(), got.GetMimeType())
					assert.Equal(t, wf.GetSize(), got.GetSize())
				}
			} else {
				assert.Empty(t, fake.lastRequest.GetFiles(), "no files should be forwarded when context has none")
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
			name:    "invalid JSON payload",
			token:   "header." + base64.RawURLEncoding.EncodeToString([]byte(`{"org_id":`)) + ".sig",
			wantErr: "malformed JWT payload JSON",
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

func TestParseWorkerJWTContext(t *testing.T) {
	for _, test := range []struct {
		name       string
		input      string
		wantSuper  string
		wantAuth   string
		wantOrigin string
	}{
		{
			name:       "empty input",
			input:      "",
			wantSuper:  "",
			wantAuth:   "",
			wantOrigin: "",
		},
		{
			name:       "no recognized prefixes",
			input:      "foo=bar\nanother=line",
			wantSuper:  "",
			wantAuth:   "",
			wantOrigin: "",
		},
		{
			name:       "extracts both tokens",
			input:      makeWorkerJWTContext("sb-token", "auth-token"),
			wantSuper:  "sb-token",
			wantAuth:   "auth-token",
			wantOrigin: "",
		},
		{
			name:       "extracts tokens and origin",
			input:      makeWorkerJWTContext("sb-token", "auth-token", "https://app.superblocks.com"),
			wantSuper:  "sb-token",
			wantAuth:   "auth-token",
			wantOrigin: "https://app.superblocks.com",
		},
		{
			name:       "extracts prefixed tokens with whitespace",
			input:      "  " + workerJWTContextSuperblocksPrefix + "  sb-token \n " + workerJWTContextAuthorizationPrefix + " auth-token  \n " + workerJWTContextOriginPrefix + " https://app.superblocks.com  ",
			wantSuper:  "sb-token",
			wantAuth:   "auth-token",
			wantOrigin: "https://app.superblocks.com",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			gotSuper, gotAuth, gotOrigin := parseWorkerJWTContext(test.input)
			assert.Equal(t, test.wantSuper, gotSuper)
			assert.Equal(t, test.wantAuth, gotAuth)
			assert.Equal(t, test.wantOrigin, gotOrigin)
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

	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)

	// First call should create the connection and client.
	target := orchestratorDialTarget{Address: orchestratorAddr, UseTLS: false}
	cacheKey := target.cacheKey()

	client1, err := svc.getOrCreateOrchestratorClient(target)
	require.NoError(t, err)
	assert.NotNil(t, client1)
	assert.NotNil(t, svc.orchestratorConns[cacheKey])
	assert.NotNil(t, svc.orchestratorClients[cacheKey])

	connAfterFirst := svc.orchestratorConns[cacheKey]

	// Second call should return the same client without creating a new connection.
	client2, err := svc.getOrCreateOrchestratorClient(target)
	require.NoError(t, err)
	assert.NotNil(t, client2)
	assert.Equal(t, connAfterFirst, svc.orchestratorConns[cacheKey], "connection should not be re-created on second call")
	assert.Equal(t, client1, client2, "client should be re-used for the same address")
}

func TestGetOrCreateOrchestratorClientReturnsErrorForInvalidAddress(t *testing.T) {
	dialErr := fmt.Errorf("dial failed")
	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		newOrchestratorConn: func(_ string, _ ...grpc.DialOption) (*grpc.ClientConn, error) {
			return nil, dialErr
		},
	}

	_, err := svc.getOrCreateOrchestratorClient(orchestratorDialTarget{
		Address: "orchestrator.internal:443",
		UseTLS:  false,
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create orchestrator client")
	assert.ErrorIs(t, err, dialErr)
}

func TestCloseOrchestratorConnectionUsesDefaultCloserFromNew(t *testing.T) {
	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{Execution: "test"},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	conn, err := grpc.NewClient(
		orchestratorAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)

	svc := New()
	require.NoError(t, svc.closeOrchestratorConnection(conn))
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
		logger: zap.NewNop(),
		server: grpc.NewServer(),
		orchestratorConns: map[string]*grpc.ClientConn{
			orchestratorDialTarget{Address: orchestratorAddr, UseTLS: false}.cacheKey(): conn,
		},
		orchestratorClients: map[string]apiv1.ExecutorServiceClient{
			orchestratorDialTarget{Address: orchestratorAddr, UseTLS: false}.cacheKey(): apiv1.NewExecutorServiceClient(conn),
		},
	}

	assert.True(t, svc.Alive())

	require.NoError(t, svc.Close(context.Background()))

	assert.Empty(t, svc.orchestratorConns)
	assert.Empty(t, svc.orchestratorClients)
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
				"exec-1": {JwtToken: makeWorkerJWTContext(lazyJWT, lazyJWT)},
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
	cacheKey := orchestratorDialTarget{Address: orchestratorAddr, UseTLS: false}.cacheKey()
	assert.NotNil(t, svc.orchestratorClients[cacheKey])
	assert.NotNil(t, svc.orchestratorConns[cacheKey])

	// JWT should have been forwarded with Bearer prefix in both headers.
	assert.Equal(t, "Bearer "+lazyJWT, fake.lastAuthorization)
	assert.Equal(t, "Bearer "+lazyJWT, fake.lastJwtToken)
}

func TestExecuteIntegrationUsesOverrideAddressWhenPresent(t *testing.T) {
	defaultOutput, err := structpb.NewValue(map[string]any{"source": "default"})
	require.NoError(t, err)
	overrideOutput, err := structpb.NewValue(map[string]any{"source": "override"})
	require.NoError(t, err)

	defaultFake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "default-exec",
			Output:    &apiv1.Output{Result: defaultOutput},
		},
	}
	overrideFake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "override-exec",
			Output:    &apiv1.Output{Result: overrideOutput},
		},
	}

	defaultAddr := startFakeOrchestrator(t, defaultFake)
	overrideAddr := startFakeOrchestrator(t, overrideFake)
	testJWT := makeTestJWT(testOrgID)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: defaultAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken:                makeWorkerJWTContext(testJWT, testJWT),
					IntegrationsCallbackUrl: "http://" + overrideAddr,
				},
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
	assert.Equal(t, "override-exec", resp.GetExecutionId())
	assert.Equal(t, overrideOutput.GetStructValue().AsMap(), resp.GetOutput().GetStructValue().AsMap())
	assert.NotNil(t, overrideFake.lastRequest, "override orchestrator should receive the request")
	assert.Nil(t, defaultFake.lastRequest, "default orchestrator should not receive the request when override is present")
}

func TestExecuteIntegrationFallsBackToDefaultAddressWhenOverrideMissing(t *testing.T) {
	defaultOutput, err := structpb.NewValue(map[string]any{"source": "default"})
	require.NoError(t, err)
	overrideOutput, err := structpb.NewValue(map[string]any{"source": "override"})
	require.NoError(t, err)

	defaultFake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "default-exec",
			Output:    &apiv1.Output{Result: defaultOutput},
		},
	}
	overrideFake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "override-exec",
			Output:    &apiv1.Output{Result: overrideOutput},
		},
	}

	defaultAddr := startFakeOrchestrator(t, defaultFake)
	_ = startFakeOrchestrator(t, overrideFake)
	testJWT := makeTestJWT(testOrgID)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: defaultAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken: makeWorkerJWTContext(testJWT, testJWT),
				},
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
	assert.Equal(t, "default-exec", resp.GetExecutionId())
	assert.Equal(t, defaultOutput.GetStructValue().AsMap(), resp.GetOutput().GetStructValue().AsMap())
	assert.NotNil(t, defaultFake.lastRequest, "default orchestrator should receive the request")
	assert.Nil(t, overrideFake.lastRequest, "unused orchestrator should not receive the request")
}

func TestExecuteIntegrationRejectsInvalidOverrideAddress(t *testing.T) {
	defaultFake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "default-exec",
			Output:    &apiv1.Output{Result: structpb.NewNullValue()},
		},
	}
	defaultAddr := startFakeOrchestrator(t, defaultFake)
	testJWT := makeTestJWT(testOrgID)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: defaultAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken:                makeWorkerJWTContext(testJWT, testJWT),
					IntegrationsCallbackUrl: "http://bad-host:8080/path-not-allowed",
				},
			},
		},
	}

	_, err := svc.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
		ExecutionId:   "exec-1",
		IntegrationId: "int-1",
		PluginId:      "postgres",
		ActionConfiguration: &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		},
	})
	require.Error(t, err)
	st, ok := status.FromError(err)
	require.True(t, ok)
	assert.Equal(t, codes.InvalidArgument, st.Code())
	assert.Contains(t, st.Message(), "invalid orchestrator address")
	assert.Nil(t, defaultFake.lastRequest, "request should fail before contacting orchestrator")
}

func TestExecuteIntegrationHTTPSOverrideUsesTLSDialing(t *testing.T) {
	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "insecure-server-exec",
			Output:    &apiv1.Output{Result: structpb.NewNullValue()},
		},
	}
	defaultAddr := startFakeOrchestrator(t, fake) // insecure gRPC server
	testJWT := makeTestJWT(testOrgID)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: defaultAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken:                makeWorkerJWTContext(testJWT, testJWT),
					IntegrationsCallbackUrl: "https://" + defaultAddr,
				},
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
	require.NotNil(t, resp)
	assert.NotEmpty(t, resp.GetError(), "TLS dialing to an insecure server should fail")
	assert.Nil(t, fake.lastRequest, "TLS handshake should fail before request reaches the fake orchestrator handler")
}

func TestExecuteIntegrationReturnsInternalWhenOrchestratorClientCreationFails(t *testing.T) {
	testJWT := makeTestJWT(testOrgID)
	dialErr := fmt.Errorf("dial failed")

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: "orchestrator.internal:443",
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken: makeWorkerJWTContext(testJWT, testJWT),
				},
			},
		},
		newOrchestratorConn: func(_ string, _ ...grpc.DialOption) (*grpc.ClientConn, error) {
			return nil, dialErr
		},
	}

	_, err := svc.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
		ExecutionId:   "exec-1",
		IntegrationId: "int-1",
		PluginId:      "postgres",
		ActionConfiguration: &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		},
	})
	require.Error(t, err)
	st, ok := status.FromError(err)
	require.True(t, ok)
	assert.Equal(t, codes.Internal, st.Code())
	assert.Contains(t, st.Message(), "failed to connect to orchestrator")
}

func TestNormalizeOrchestratorDialTarget(t *testing.T) {
	for _, test := range []struct {
		name         string
		input        string
		wantAddress  string
		wantTLS      bool
		wantErrMatch string
	}{
		{name: "host:port defaults to insecure", input: "orchestrator.internal:8081", wantAddress: "orchestrator.internal:8081", wantTLS: false},
		{name: "http URL maps to insecure", input: "http://orchestrator.internal", wantAddress: "orchestrator.internal:80", wantTLS: false},
		{name: "https URL maps to TLS", input: "https://orchestrator.internal", wantAddress: "orchestrator.internal:443", wantTLS: true},
		{name: "https URL root path is allowed", input: "https://orchestrator.internal/", wantAddress: "orchestrator.internal:443", wantTLS: true},
		{name: "grpcs URL maps to TLS", input: "grpcs://orchestrator.internal:9443", wantAddress: "orchestrator.internal:9443", wantTLS: true},
		{name: "grpc URL maps to insecure", input: "grpc://orchestrator.internal:8081", wantAddress: "orchestrator.internal:8081", wantTLS: false},
		{name: "reject URL path", input: "https://orchestrator.internal/grpc", wantErrMatch: "must not include path"},
		{name: "reject URL user info", input: "https://user@orchestrator.internal", wantErrMatch: "must not include user info"},
		{name: "reject URL query", input: "https://orchestrator.internal?x=1", wantErrMatch: "must not include query or fragment"},
		{name: "reject URL fragment", input: "https://orchestrator.internal#anchor", wantErrMatch: "must not include query or fragment"},
		{name: "reject unsupported URL scheme", input: "tcp://orchestrator.internal:9000", wantErrMatch: "unsupported orchestrator URL scheme"},
		{name: "reject unsupported URL scheme without port", input: "tcp://orchestrator.internal", wantErrMatch: "unsupported orchestrator URL scheme"},
		{name: "reject URL missing host", input: "http:///path", wantErrMatch: "must be absolute"},
		{name: "reject URL with empty host", input: "https://:443", wantErrMatch: "host is empty"},
		{name: "reject malformed URL", input: "://bad url", wantErrMatch: "invalid orchestrator URL"},
		{name: "reject malformed absolute URL", input: "https://[::1", wantErrMatch: "invalid orchestrator URL"},
		{name: "reject host without port for raw address", input: "orchestrator.internal", wantErrMatch: "must be host:port or absolute URL"},
		{name: "reject empty host in raw address", input: ":8081", wantErrMatch: "must include host and port"},
		{name: "reject empty port in raw address", input: "orchestrator.internal:", wantErrMatch: "must include host and port"},
		{name: "reject empty", input: "", wantErrMatch: "is empty"},
	} {
		t.Run(test.name, func(t *testing.T) {
			got, err := normalizeOrchestratorDialTarget(test.input)
			if test.wantErrMatch != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), test.wantErrMatch)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, test.wantAddress, got.Address)
			assert.Equal(t, test.wantTLS, got.UseTLS)
		})
	}
}

func TestEvictOldestOrchestratorClientLockedClosesConnection(t *testing.T) {
	fake := &fakeOrchestratorServer{response: &apiv1.AwaitResponse{Execution: "test"}}
	addr := startFakeOrchestrator(t, fake)

	conn, err := grpc.NewClient(
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)

	oldestTarget := orchestratorDialTarget{Address: addr, UseTLS: false}
	oldestKey := oldestTarget.cacheKey()

	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		orchestratorClients: map[string]apiv1.ExecutorServiceClient{
			oldestKey: apiv1.NewExecutorServiceClient(conn),
		},
		orchestratorConns: map[string]*grpc.ClientConn{
			oldestKey: conn,
		},
		orchestratorClientKeys: []string{oldestKey},
	}

	svc.evictOldestOrchestratorClientLocked()

	assert.Empty(t, svc.orchestratorClientKeys)
	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)
}

func TestEvictOldestOrchestratorClientLockedNoopWhenEmpty(t *testing.T) {
	svc := &IntegrationExecutorService{
		logger:                 zap.NewNop(),
		orchestratorClients:    map[string]apiv1.ExecutorServiceClient{},
		orchestratorConns:      map[string]*grpc.ClientConn{},
		orchestratorClientKeys: []string{},
	}

	svc.evictOldestOrchestratorClientLocked()

	assert.Empty(t, svc.orchestratorClientKeys)
	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)
}

func TestCloseSkipsNilCachedConnection(t *testing.T) {
	cacheKey := "insecure|nil-conn:8081"
	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		server: grpc.NewServer(),
		orchestratorClients: map[string]apiv1.ExecutorServiceClient{
			cacheKey: nil,
		},
		orchestratorConns: map[string]*grpc.ClientConn{
			cacheKey: nil,
		},
		orchestratorClientKeys: []string{cacheKey},
	}

	require.NoError(t, svc.Close(context.Background()))
	assert.False(t, svc.Alive())
	assert.Empty(t, svc.orchestratorClientKeys)
	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)
}

func TestCloseContinuesWhenCachedConnectionCloseFails(t *testing.T) {
	cacheKey := "insecure|close-error:8081"
	closeCalls := 0

	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		server: grpc.NewServer(),
		orchestratorClients: map[string]apiv1.ExecutorServiceClient{
			cacheKey: nil,
		},
		orchestratorConns: map[string]*grpc.ClientConn{
			cacheKey: new(grpc.ClientConn),
		},
		orchestratorClientKeys: []string{cacheKey},
		closeOrchestratorConn: func(_ *grpc.ClientConn) error {
			closeCalls++
			return fmt.Errorf("close failed")
		},
	}

	require.NoError(t, svc.Close(context.Background()))
	assert.Equal(t, 1, closeCalls)
	assert.False(t, svc.Alive())
	assert.Empty(t, svc.orchestratorClientKeys)
	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)
}

func TestOrchestratorClientCacheEvictsOldestWhenFull(t *testing.T) {
	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{Execution: "test"},
	}
	addr := startFakeOrchestrator(t, fake)

	svc := &IntegrationExecutorService{
		logger:                 zap.NewNop(),
		orchestratorClients:    map[string]apiv1.ExecutorServiceClient{},
		orchestratorConns:      map[string]*grpc.ClientConn{},
		orchestratorClientKeys: []string{},
	}

	oldestKey := "insecure|oldest:1111"
	for i := 0; i < maxOrchestratorClientCacheSize; i++ {
		key := fmt.Sprintf("insecure|existing-%d:8081", i)
		if i == 0 {
			key = oldestKey
		}
		svc.orchestratorClientKeys = append(svc.orchestratorClientKeys, key)
		svc.orchestratorClients[key] = nil
		svc.orchestratorConns[key] = nil
	}

	newTarget := orchestratorDialTarget{Address: addr, UseTLS: false}
	_, err := svc.getOrCreateOrchestratorClient(newTarget)
	require.NoError(t, err)

	assert.Len(t, svc.orchestratorClientKeys, maxOrchestratorClientCacheSize)
	_, hasOldest := svc.orchestratorClients[oldestKey]
	assert.False(t, hasOldest, "oldest client should be evicted")
	_, hasNew := svc.orchestratorClients[newTarget.cacheKey()]
	assert.True(t, hasNew, "new client should be cached")
}

func TestEvictOldestOrchestratorClientLockedContinuesWhenCloseFails(t *testing.T) {
	oldestKey := "insecure|oldest:1111"
	closeCalls := 0

	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
		orchestratorClients: map[string]apiv1.ExecutorServiceClient{
			oldestKey: nil,
		},
		orchestratorConns: map[string]*grpc.ClientConn{
			oldestKey: new(grpc.ClientConn),
		},
		orchestratorClientKeys: []string{oldestKey},
		closeOrchestratorConn: func(_ *grpc.ClientConn) error {
			closeCalls++
			return fmt.Errorf("close failed")
		},
	}

	svc.evictOldestOrchestratorClientLocked()

	assert.Equal(t, 1, closeCalls)
	assert.Empty(t, svc.orchestratorClientKeys)
	assert.Empty(t, svc.orchestratorClients)
	assert.Empty(t, svc.orchestratorConns)
}

func TestExecuteIntegrationFileServerFailureReturnsError(t *testing.T) {
	validJWT := makeTestJWT(testOrgID)

	fileServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	t.Cleanup(fileServer.Close)

	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "exec-id",
			Output:    &apiv1.Output{Result: structpb.NewNullValue()},
		},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: orchestratorAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {
					JwtToken:      makeWorkerJWTContext(validJWT, validJWT),
					FileServerURL: fileServer.URL,
					AgentKey:      "key",
					FileRefs: []redisstore.FileRef{
						{OriginalName: "broken.txt", Path: "/tmp/missing"},
					},
				},
			},
		},
	}

	_, err := svc.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
		ExecutionId:         "exec-1",
		IntegrationId:       "int-1",
		PluginId:            "s3",
		ActionConfiguration: &structpb.Struct{Fields: map[string]*structpb.Value{}},
	})
	require.Error(t, err)
	st, ok := status.FromError(err)
	require.True(t, ok)
	assert.Equal(t, codes.Internal, st.Code())
	assert.Contains(t, st.Message(), "failed to resolve uploaded files")
	assert.Nil(t, fake.lastRequest, "request should not reach orchestrator when file fetch fails")
}

func TestExecuteIntegrationMultipleFiles(t *testing.T) {
	validJWT := makeTestJWT(testOrgID)

	fileServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		location := r.URL.Query().Get("location")
		switch location {
		case "/tmp/file-a":
			w.Write([]byte("content-a"))
		case "/tmp/file-b":
			w.Write([]byte("content-b"))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(fileServer.Close)

	outputValue, err := structpb.NewValue(map[string]any{"ok": true})
	require.NoError(t, err)

	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "multi-exec",
			Output:    &apiv1.Output{Result: outputValue},
		},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	svc := &IntegrationExecutorService{
		logger:              zap.NewNop(),
		orchestratorAddress: orchestratorAddr,
		fileContextProvider: &mockFileContextProvider{
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-multi": {
					JwtToken:      makeWorkerJWTContext(validJWT, validJWT),
					FileServerURL: fileServer.URL,
					AgentKey:      "key",
					FileRefs: []redisstore.FileRef{
						{OriginalName: "a.txt", Encoding: "7bit", MimeType: "text/plain", Size: 9, Path: "/tmp/file-a"},
						{OriginalName: "b.bin", Encoding: "binary", MimeType: "application/octet-stream", Size: 9, Path: "/tmp/file-b"},
					},
				},
			},
		},
	}

	resp, err := svc.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
		ExecutionId:         "exec-multi",
		IntegrationId:       "int-1",
		PluginId:            "s3",
		ActionConfiguration: &structpb.Struct{Fields: map[string]*structpb.Value{}},
	})
	require.NoError(t, err)
	assert.Empty(t, resp.GetError())

	require.Len(t, fake.lastRequest.GetFiles(), 2)

	assert.Equal(t, "a.txt", fake.lastRequest.GetFiles()[0].GetOriginalName())
	assert.Equal(t, []byte("content-a"), fake.lastRequest.GetFiles()[0].GetBuffer())
	assert.Equal(t, "text/plain", fake.lastRequest.GetFiles()[0].GetMimeType())
	assert.Equal(t, "9", fake.lastRequest.GetFiles()[0].GetSize())

	assert.Equal(t, "b.bin", fake.lastRequest.GetFiles()[1].GetOriginalName())
	assert.Equal(t, []byte("content-b"), fake.lastRequest.GetFiles()[1].GetBuffer())
	assert.Equal(t, "application/octet-stream", fake.lastRequest.GetFiles()[1].GetMimeType())
	assert.Equal(t, "9", fake.lastRequest.GetFiles()[1].GetSize())
}

func TestGetOrCreateOrchestratorClientReuseKeyedByAddress(t *testing.T) {
	fakeA := &fakeOrchestratorServer{response: &apiv1.AwaitResponse{Execution: "a"}}
	fakeB := &fakeOrchestratorServer{response: &apiv1.AwaitResponse{Execution: "b"}}
	addrA := startFakeOrchestrator(t, fakeA)
	addrB := startFakeOrchestrator(t, fakeB)

	svc := &IntegrationExecutorService{
		logger: zap.NewNop(),
	}

	targetA := orchestratorDialTarget{Address: addrA, UseTLS: false}
	keyA := targetA.cacheKey()
	_, err := svc.getOrCreateOrchestratorClient(targetA)
	require.NoError(t, err)
	connA := svc.orchestratorConns[keyA]

	_, err = svc.getOrCreateOrchestratorClient(targetA)
	require.NoError(t, err)
	assert.Same(t, connA, svc.orchestratorConns[keyA], "same address should reuse connection")

	targetB := orchestratorDialTarget{Address: addrB, UseTLS: false}
	keyB := targetB.cacheKey()
	_, err = svc.getOrCreateOrchestratorClient(targetB)
	require.NoError(t, err)
	connB := svc.orchestratorConns[keyB]

	assert.NotNil(t, connA)
	assert.NotNil(t, connB)
	assert.NotSame(t, connA, connB, "different addresses should use different connections")
	assert.Len(t, svc.orchestratorConns, 2)
	assert.Len(t, svc.orchestratorClients, 2)
}
