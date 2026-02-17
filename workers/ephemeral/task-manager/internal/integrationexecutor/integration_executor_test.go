package integrationexecutor

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"net"
	"testing"
	"time"

	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	"github.com/golang-jwt/jwt/v5"

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

// generateTestKey creates an ECDSA P-256 key pair for testing.
func generateTestKey(t *testing.T) *ecdsa.PrivateKey {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	return key
}

// signTestJWT creates a signed JWT with the given claims and private key.
func signTestJWT(t *testing.T, key *ecdsa.PrivateKey, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	signed, err := token.SignedString(key)
	require.NoError(t, err)
	return signed
}

func TestValidateJWT(t *testing.T) {
	key := generateTestKey(t)
	otherKey := generateTestKey(t)

	validToken := signTestJWT(t, key, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})

	expiredToken := signTestJWT(t, key, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(-time.Hour).Unix(),
	})

	wrongKeyToken := signTestJWT(t, otherKey, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})

	// Token that expires within the padding window (10s < 30s padding).
	expiresSoonToken := signTestJWT(t, key, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(10 * time.Second).Unix(),
	})

	// Token with nbf set to now should be accepted (negative leeway bug would reject it).
	tokenWithNbf := signTestJWT(t, key, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
		"nbf": time.Now().Unix(),
	})

	// Token without exp claim should be rejected (exp is required).
	tokenNoExp := signTestJWT(t, key, jwt.MapClaims{
		"sub": "user-123",
	})

	// Create an HMAC-signed token to test wrong signing method detection.
	hmacToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	hmacSigned, err := hmacToken.SignedString([]byte("secret"))
	require.NoError(t, err)

	for _, test := range []struct {
		name    string
		key     *ecdsa.PublicKey
		token   string
		wantErr bool
	}{
		{
			name:  "valid token",
			key:   &key.PublicKey,
			token: validToken,
		},
		{
			name:    "expired token",
			key:     &key.PublicKey,
			token:   expiredToken,
			wantErr: true,
		},
		{
			name:    "wrong signing key",
			key:     &key.PublicKey,
			token:   wrongKeyToken,
			wantErr: true,
		},
		{
			name:    "expires within padding window",
			key:     &key.PublicKey,
			token:   expiresSoonToken,
			wantErr: true,
		},
		{
			name:    "wrong signing method (HMAC)",
			key:     &key.PublicKey,
			token:   hmacSigned,
			wantErr: true,
		},
		{
			name:  "nil key skips validation",
			key:   nil,
			token: "any-token",
		},
		{
			name:    "malformed token",
			key:     &key.PublicKey,
			token:   "not.a.jwt",
			wantErr: true,
		},
		{
			name:  "valid token with nbf set to now",
			key:   &key.PublicKey,
			token: tokenWithNbf,
		},
		{
			name:    "token without exp claim",
			key:     &key.PublicKey,
			token:   tokenNoExp,
			wantErr: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			svc := &IntegrationExecutorService{jwtSigningKey: test.key}
			err := svc.validateJWT(test.token)
			if test.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
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

	// Generate test ECDSA keys for JWT signing.
	signingKey := generateTestKey(t)
	validJWT := signTestJWT(t, signingKey, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	expiredJWT := signTestJWT(t, signingKey, jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(-time.Hour).Unix(),
	})

	for _, test := range []struct {
		name            string
		request         *workerv1.ExecuteIntegrationRequest
		contexts        map[string]*redisstore.ExecutionFileContext
		jwtSigningKey   *ecdsa.PublicKey
		orchestratorErr error
		wantCode        codes.Code
		wantOutput      *structpb.Value
		wantError       string
		wantJwt         string
		wantProfile     *commonv1.Profile
	}{
		{
			name: "happy path with JWT validation",
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
			jwtSigningKey: &signingKey.PublicKey,
			wantJwt:       "Bearer " + validJWT,
			wantProfile:   profileTest,
			wantOutput:    outputValue,
		},
		{
			name: "happy path without JWT validation (nil key)",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
				ViewMode:            apiv1.ViewMode_VIEW_MODE_DEPLOYED,
				Profile:             profileTest,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: "my-jwt-token", Profile: profileFallback},
			},
			jwtSigningKey: nil,
			wantJwt:       "Bearer my-jwt-token",
			wantProfile:   profileTest,
			wantOutput:    outputValue,
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
			jwtSigningKey: &signingKey.PublicKey,
			wantJwt:       "Bearer " + validJWT,
			wantProfile:   profileFallback,
			wantOutput:    outputValue,
		},
		{
			name: "expired JWT returns PermissionDenied",
			request: &workerv1.ExecuteIntegrationRequest{
				ExecutionId:         "exec-1",
				IntegrationId:       "int-1",
				PluginId:            "postgres",
				ActionConfiguration: actionConfig,
			},
			contexts: map[string]*redisstore.ExecutionFileContext{
				"exec-1": {JwtToken: expiredJWT},
			},
			jwtSigningKey: &signingKey.PublicKey,
			wantCode:      codes.PermissionDenied,
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
			jwtSigningKey:   &signingKey.PublicKey,
			orchestratorErr: status.Error(codes.Internal, "something went wrong"),
			wantError:       "rpc error: code = Internal desc = something went wrong",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fake := &fakeOrchestratorServer{
				response: &apiv1.AwaitResponse{
					Execution: "result-exec-id",
					Output: &apiv1.Output{
						Result: outputValue,
					},
				},
				err: test.orchestratorErr,
			}

			orchestratorAddr := startFakeOrchestrator(t, fake)

			svc := &IntegrationExecutorService{
				logger:              zap.NewNop(),
				orchestratorAddress: orchestratorAddr,
				fileContextProvider: &mockFileContextProvider{contexts: test.contexts},
				jwtSigningKey:       test.jwtSigningKey,
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

			if test.wantProfile != nil {
				assert.Equal(t, test.wantProfile.GetName(), fake.lastRequest.GetProfile().GetName())
			}
		})
	}
}

func strPtr(s string) *string {
	return &s
}
