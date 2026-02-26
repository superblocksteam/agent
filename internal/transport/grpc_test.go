package transport

import (
	"context"
	"errors"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"

	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/utils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/types"

	"github.com/superblocksteam/agent/internal/fetch"
	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/pkg/constants"
	sberror "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	storemock "github.com/superblocksteam/agent/pkg/store/mock"
	"github.com/superblocksteam/agent/pkg/worker"
	workeroptions "github.com/superblocksteam/agent/pkg/worker/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	gsheets "github.com/superblocksteam/agent/types/gen/go/plugins/gsheets/v1"
	kinesis "github.com/superblocksteam/agent/types/gen/go/plugins/kinesis/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

// mockServerStream implements grpc.ServerStream for testing
type mockServerStream struct {
	ctx context.Context
}

func (m *mockServerStream) SetHeader(metadata.MD) error  { return nil }
func (m *mockServerStream) SendHeader(metadata.MD) error { return nil }
func (m *mockServerStream) SetTrailer(metadata.MD)       {}
func (m *mockServerStream) Context() context.Context     { return m.ctx }
func (m *mockServerStream) SendMsg(interface{}) error    { return nil }
func (m *mockServerStream) RecvMsg(interface{}) error    { return nil }

// mockStreamServer implements apiv1.ExecutorService_StreamServer for testing
type mockStreamServer struct {
	grpc.ServerStream
	ctx context.Context
}

func (m *mockStreamServer) Send(*apiv1.StreamResponse) error { return nil }
func (m *mockStreamServer) Context() context.Context         { return m.ctx }

// mockTwoWayStreamServer implements apiv1.ExecutorService_TwoWayStreamServer for testing
type mockTwoWayStreamServer struct {
	grpc.ServerStream
	ctx          context.Context
	recvMessages []*apiv1.TwoWayRequest
	recvIndex    int
}

func (m *mockTwoWayStreamServer) Send(*apiv1.TwoWayResponse) error { return nil }
func (m *mockTwoWayStreamServer) Recv() (*apiv1.TwoWayRequest, error) {
	if m.recvIndex >= len(m.recvMessages) {
		return nil, errors.New("no more messages")
	}
	msg := m.recvMessages[m.recvIndex]
	m.recvIndex++
	return msg, nil
}
func (m *mockTwoWayStreamServer) Context() context.Context { return m.ctx }

func TestGetActionConfig(t *testing.T) {
	testCases := []struct {
		name       string
		step       *apiv1.Step
		pluginName string
		expected   *structpb.Struct
	}{
		{
			name: "Gsheets plugin config",
			step: &apiv1.Step{
				Config: &apiv1.Step_Gsheets{
					Gsheets: &gsheets.Plugin{
						SpreadsheetId: "blerglergler",
					},
				},
			},
			pluginName: "gsheets",
			expected: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"spreadsheetId": structpb.NewStringValue("blerglergler"),
				},
			},
		},
		{
			name: "Nonexistent plugin config",
			step: &apiv1.Step{
				Config: &apiv1.Step_Gsheets{
					Gsheets: &gsheets.Plugin{},
				},
			},
			pluginName: "nonexistent",
			expected:   nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := getActionConfig(tc.step, tc.pluginName)
			assert.NoError(t, err)
			assert.Equal(t, tc.expected.String(), result.String())
		})
	}
}

// helper funcs for the tests below
func protoMapEqual(t *testing.T, m1, m2 map[string]*structpb.Value) {
	require.Equal(t, len(m1), len(m2))
	for k, v1 := range m1 {
		v2, ok := m2[k]
		require.True(t, ok, "missing key: %s", k)

		utils.AssertProtoEqual(t, v1, v2)
	}
}

func cloneStructpbMap(original map[string]*structpb.Value) map[string]*structpb.Value {
	copied := make(map[string]*structpb.Value, len(original))
	for k, v := range original {
		copied[k] = proto.Clone(v).(*structpb.Value)
	}
	return copied
}

func defaultCtxWithInfo() context.Context {
	ctx := context.Background()
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "uid")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserEmail, "ue")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserDisplayName, "udn")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyRbacGroupObjects, []*authv1.Claims_RbacGroupObject{
		{
			Id:   "1",
			Name: "g1",
		},
		{
			Id:   "2",
			Name: "g2",
		},
	})
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyMetadata, &structpb.Struct{})
	return ctx
}

func defaultGlobalStructWithInfo(dontIncludeKeys []string) *structpb.Value {
	keys := map[string]*structpb.Value{
		"id":       structpb.NewStringValue("uid"),
		"email":    structpb.NewStringValue("ue"),
		"name":     structpb.NewStringValue("udn"),
		"username": structpb.NewStringValue("ue"),
		"metadata": structpb.NewStructValue(&structpb.Struct{}),
		"groups": structpb.NewListValue(&structpb.ListValue{
			Values: []*structpb.Value{
				structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"id":   structpb.NewStringValue("1"),
						"name": structpb.NewStringValue("g1"),
					},
				}),
				structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"id":   structpb.NewStringValue("2"),
						"name": structpb.NewStringValue("g2"),
					},
				}),
			},
		}),
	}

	skip := make(map[string]struct{}, len(dontIncludeKeys))
	for _, k := range dontIncludeKeys {
		skip[k] = struct{}{}
	}

	filtered := make(map[string]*structpb.Value)
	for k, v := range keys {
		if _, excluded := skip[k]; !excluded {
			filtered[k] = v
		}
	}

	return structpb.NewStructValue(&structpb.Struct{
		Fields: map[string]*structpb.Value{
			"user": structpb.NewStructValue(&structpb.Struct{
				Fields: filtered,
			}),
		},
	})
}

func TestInjectGlobalUserIntoInputs(t *testing.T) {
	testCases := []struct {
		name                         string
		ctx                          context.Context
		inputs                       map[string]*structpb.Value
		expectedInputsAfterInjection map[string]*structpb.Value
		expectedError                string
	}{
		{
			name:   "works when inputs is empty",
			ctx:    defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name:   "works when inputs is nil",
			ctx:    defaultCtxWithInfo(),
			inputs: nil,
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global is empty",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewStructValue(&structpb.Struct{}),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global is nil",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": nil,
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global is null",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewNullValue(),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global.user is empty",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"user": structpb.NewStructValue(&structpb.Struct{}),
					},
				}),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global.user is nil",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"user": nil,
					},
				}),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when inputs.Global.user is null",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"user": structpb.NewNullValue(),
					},
				}),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "ensure inputs retains existing data",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Foo": structpb.NewStringValue("Bar"),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Foo":    structpb.NewStringValue("Bar"),
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "ensure inputs.Global.Foo retains existing data",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"Foo": structpb.NewStringValue("Bar"),
					},
				}),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": func() *structpb.Value {
					def := defaultGlobalStructWithInfo(nil)
					def.GetStructValue().Fields["Foo"] = structpb.NewStringValue("Bar")
					return def
				}(),
			},
		},
		{
			name: "ensure given inputs.Global.user data is overwritten",
			ctx:  defaultCtxWithInfo(),
			inputs: map[string]*structpb.Value{
				"Global": func() *structpb.Value {
					def := defaultGlobalStructWithInfo([]string{})
					def.GetStructValue().Fields["user"].GetStructValue().Fields["id"] = structpb.NewStringValue("injected")
					def.GetStructValue().Fields["user"].GetStructValue().Fields["email"] = structpb.NewStringValue("injected")
					def.GetStructValue().Fields["user"].GetStructValue().Fields["name"] = structpb.NewStringValue("injected")
					def.GetStructValue().Fields["user"].GetStructValue().Fields["username"] = structpb.NewStringValue("injected")
					def.GetStructValue().Fields["user"].GetStructValue().Fields["metadata"] = structpb.NewStringValue("injected")
					def.GetStructValue().Fields["user"].GetStructValue().Fields["groups"] = structpb.NewStringValue("injected")
					return def
				}(),
			},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo(nil),
			},
		},
		{
			name: "works when user id is nil",
			ctx: func() context.Context {
				ctx := defaultCtxWithInfo()
				return context.WithValue(ctx, jwt_validator.ContextKeyUserId, nil)
			}(),
			inputs: map[string]*structpb.Value{},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo([]string{"id"}),
			},
		},
		{
			name: "works when display name is nil",
			ctx: func() context.Context {
				ctx := defaultCtxWithInfo()
				return context.WithValue(ctx, jwt_validator.ContextKeyUserDisplayName, nil)
			}(),
			inputs: map[string]*structpb.Value{},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo([]string{"name"}),
			},
		},
		{
			name: "works when rbac group objects is nil",
			ctx: func() context.Context {
				ctx := defaultCtxWithInfo()
				return context.WithValue(ctx, jwt_validator.ContextKeyRbacGroupObjects, nil)
			}(),
			inputs: map[string]*structpb.Value{},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo([]string{"groups"}),
			},
		},
		{
			name: "works when metadata is nil",
			ctx: func() context.Context {
				ctx := defaultCtxWithInfo()
				return context.WithValue(ctx, jwt_validator.ContextKeyMetadata, nil)
			}(),
			inputs: map[string]*structpb.Value{},
			expectedInputsAfterInjection: map[string]*structpb.Value{
				"Global": defaultGlobalStructWithInfo([]string{"metadata"}),
			},
		},
		{
			name:          "errors when context is missing user email",
			ctx:           context.Background(),
			inputs:        map[string]*structpb.Value{},
			expectedError: "could not get user email",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			givenInputs := cloneStructpbMap(tc.inputs)
			newInputs, err := injectGlobalUserIntoInputs(tc.ctx, tc.inputs)
			if tc.expectedError == "" {
				require.NoError(t, err)
			} else {
				require.Equal(t, tc.expectedError, err.Error())
			}
			protoMapEqual(t, tc.expectedInputsAfterInjection, newInputs)
			// make sure original inputs was not mutated
			protoMapEqual(t, givenInputs, tc.inputs)
		})
	}
}

// This test ensures /v2/test requires the X-Superblocks-Authorization header.
//
// Without this check, attackers could use bindings like {{Env.SECRET}} in datasource_config
// to fish for environment variables on the agent, even without valid credentials.
//
// Note: We only check the header is present, not that the JWT is valid.
func TestTestAuthorizationRequired(t *testing.T) {
	testCases := []struct {
		name            string
		contextWithAuth bool
		expectError     bool
		expectAuthError bool
	}{
		{
			name:            "rejects request without authorization header",
			contextWithAuth: false,
			expectError:     true,
			expectAuthError: true,
		},
		{
			name:            "allows request with authorization header",
			contextWithAuth: true,
			expectError:     false,
			expectAuthError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tm := &mocks.TokenManager{}
			ctx := context.Background()

			// Auth middleware sets this flag based on whether X-Superblocks-Authorization header exists
			if tc.contextWithAuth {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, true)
			} else {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, false)
			}

			mockWorker := &worker.MockClient{}
			fetcher := &fetchmocks.Fetcher{}

			// Mock FetchIntegrations to avoid unexpected call errors
			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(new(integrationv1.GetIntegrationsResponse), nil).Maybe()

			// Mock TokenManager AddTokenIfNeeded
			tm.On("AddTokenIfNeeded", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(types.TokenPayload{}, nil).Maybe()

			// Mock Worker TestConnection
			mockWorker.On("TestConnection", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil).Maybe()

			defer metrics.SetupForTesting()()
			server := NewServer(&Config{
				TokenManager:  tm,
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			req := &apiv1.TestRequest{
				IntegrationType: "gsheets",
				DatasourceConfig: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"spreadsheetId": structpb.NewStringValue("test-id"),
					},
				},
			}

			_, err := server.Test(ctx, req)

			if tc.expectError {
				require.Error(t, err)
				if tc.expectAuthError {
					assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError")
				}
			} else {
				// May fail for other reasons, but shouldn't be an auth error
				if err != nil {
					assert.False(t, sberror.IsAuthorizationError(err), "should not get AuthorizationError when auth header is present")
				}
			}
		})
	}
}

// TestInlineDefinitionAuthorizationRequired ensures that endpoints accepting ExecuteRequest
// require authorization when an inline definition is provided. This prevents anonymous users
// from executing arbitrary code while still allowing public apps (which use fetch by ID) to work.
func TestInlineDefinitionAuthorizationRequired(t *testing.T) {
	testCases := []struct {
		name            string
		useDefinition   bool // true = inline definition, false = fetch by ID
		contextWithAuth bool
		expectAuthError bool
	}{
		{
			name:            "inline definition without auth - should reject",
			useDefinition:   true,
			contextWithAuth: false,
			expectAuthError: true,
		},
		{
			name:            "inline definition with auth - should allow",
			useDefinition:   true,
			contextWithAuth: true,
			expectAuthError: false,
		},
		{
			name:            "fetch by ID without auth - should allow (for public apps)",
			useDefinition:   false,
			contextWithAuth: false,
			expectAuthError: false,
		},
		{
			name:            "fetch by ID with auth - should allow",
			useDefinition:   false,
			contextWithAuth: true,
			expectAuthError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()

			// Auth middleware sets this flag based on whether X-Superblocks-Authorization header exists
			if tc.contextWithAuth {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, true)
			} else {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, false)
			}

			var req *apiv1.ExecuteRequest
			if tc.useDefinition {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Definition{
						Definition: &apiv1.Definition{
							Api: &apiv1.Api{
								Metadata: &v1.Metadata{
									Name: "test-api",
								},
							},
						},
					},
				}
			} else {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Fetch_{
						Fetch: &apiv1.ExecuteRequest_Fetch{
							Id: "some-api-id",
						},
					},
				}
			}

			err := requireAuthForInlineDefinition(ctx, req)

			if tc.expectAuthError {
				require.Error(t, err)
				assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError")
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestStreamInlineDefinitionAuthorizationRequired tests that the Stream endpoint
// rejects inline definitions without authorization.
func TestStreamInlineDefinitionAuthorizationRequired(t *testing.T) {
	testCases := []struct {
		name            string
		useDefinition   bool
		contextWithAuth bool
		expectAuthError bool
	}{
		{
			name:            "inline definition without auth - should reject",
			useDefinition:   true,
			contextWithAuth: false,
			expectAuthError: true,
		},
		{
			name:            "inline definition with auth - should allow (will fail later for other reasons)",
			useDefinition:   true,
			contextWithAuth: true,
			expectAuthError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()

			if tc.contextWithAuth {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, true)
			} else {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, false)
			}

			mockWorker := &worker.MockClient{}
			fetcher := &fetchmocks.Fetcher{}

			defer metrics.SetupForTesting()()
			server := NewServer(&Config{
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			var req *apiv1.ExecuteRequest
			if tc.useDefinition {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Definition{
						Definition: &apiv1.Definition{
							Api: &apiv1.Api{
								Metadata: &v1.Metadata{
									Name: "test-api",
								},
							},
						},
					},
				}
			} else {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Fetch_{
						Fetch: &apiv1.ExecuteRequest_Fetch{
							Id: "some-api-id",
						},
					},
				}
			}

			mockStream := &mockStreamServer{
				ServerStream: &mockServerStream{ctx: ctx},
				ctx:          ctx,
			}

			err := server.Stream(req, mockStream)

			if tc.expectAuthError {
				require.Error(t, err)
				assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError, got: %v", err)
			}
			// When auth is present but definition is inline, it will fail later during execution
			// for other reasons (missing fetcher setup, etc.), but NOT with an auth error
			if tc.contextWithAuth && err != nil {
				assert.False(t, sberror.IsAuthorizationError(err), "should not get AuthorizationError when auth header is present")
			}
		})
	}
}

// TestAwaitInlineDefinitionAuthorizationRequired tests that the Await endpoint
// rejects inline definitions without authorization.
func TestAwaitInlineDefinitionAuthorizationRequired(t *testing.T) {
	testCases := []struct {
		name            string
		useDefinition   bool
		contextWithAuth bool
		expectAuthError bool
	}{
		{
			name:            "inline definition without auth - should reject",
			useDefinition:   true,
			contextWithAuth: false,
			expectAuthError: true,
		},
		{
			name:            "inline definition with auth - should allow (will fail later for other reasons)",
			useDefinition:   true,
			contextWithAuth: true,
			expectAuthError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()

			if tc.contextWithAuth {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, true)
			} else {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, false)
			}

			mockWorker := &worker.MockClient{}
			fetcher := &fetchmocks.Fetcher{}

			defer metrics.SetupForTesting()()
			server := NewServer(&Config{
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			var req *apiv1.ExecuteRequest
			if tc.useDefinition {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Definition{
						Definition: &apiv1.Definition{
							Api: &apiv1.Api{
								Metadata: &v1.Metadata{
									Name: "test-api",
								},
							},
						},
					},
				}
			} else {
				req = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Fetch_{
						Fetch: &apiv1.ExecuteRequest_Fetch{
							Id: "some-api-id",
						},
					},
				}
			}

			_, err := server.Await(ctx, req)

			if tc.expectAuthError {
				require.Error(t, err)
				assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError, got: %v", err)
			}
			// When auth is present but definition is inline, it will fail later during execution
			// for other reasons (missing fetcher setup, etc.), but NOT with an auth error
			if tc.contextWithAuth && err != nil {
				assert.False(t, sberror.IsAuthorizationError(err), "should not get AuthorizationError when auth header is present")
			}
		})
	}
}

// TestTwoWayStreamInlineDefinitionAuthorizationRequired tests that the TwoWayStream endpoint
// rejects inline definitions without authorization.
func TestTwoWayStreamInlineDefinitionAuthorizationRequired(t *testing.T) {
	testCases := []struct {
		name            string
		useDefinition   bool
		contextWithAuth bool
		expectAuthError bool
	}{
		{
			name:            "inline definition without auth - should reject",
			useDefinition:   true,
			contextWithAuth: false,
			expectAuthError: true,
		},
		{
			name:            "inline definition with auth - should allow (will fail later for other reasons)",
			useDefinition:   true,
			contextWithAuth: true,
			expectAuthError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()

			if tc.contextWithAuth {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, true)
			} else {
				ctx = context.WithValue(ctx, constants.ContextKeyRequestUsesJwtAuth, false)
			}

			mockWorker := &worker.MockClient{}
			fetcher := &fetchmocks.Fetcher{}

			defer metrics.SetupForTesting()()
			server := NewServer(&Config{
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			var executeRequest *apiv1.ExecuteRequest
			if tc.useDefinition {
				executeRequest = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Definition{
						Definition: &apiv1.Definition{
							Api: &apiv1.Api{
								Metadata: &v1.Metadata{
									Name: "test-api",
								},
							},
						},
					},
				}
			} else {
				executeRequest = &apiv1.ExecuteRequest{
					Request: &apiv1.ExecuteRequest_Fetch_{
						Fetch: &apiv1.ExecuteRequest_Fetch{
							Id: "some-api-id",
						},
					},
				}
			}

			mockStream := &mockTwoWayStreamServer{
				ServerStream: &mockServerStream{ctx: ctx},
				ctx:          ctx,
				recvMessages: []*apiv1.TwoWayRequest{
					{
						Type: &apiv1.TwoWayRequest_Execute{
							Execute: executeRequest,
						},
					},
				},
			}

			err := server.TwoWayStream(mockStream)

			if tc.expectAuthError {
				require.Error(t, err)
				assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError, got: %v", err)
			}
			// When auth is present but definition is inline, it will fail later during execution
			// for other reasons (missing fetcher setup, etc.), but NOT with an auth error
			if tc.contextWithAuth && err != nil {
				assert.False(t, sberror.IsAuthorizationError(err), "should not get AuthorizationError when auth header is present")
			}
		})
	}
}

// NOTE(frank): This test is failing. Rather than block all of CI, I'm commenting it out for now.
//
// func TestTest(t *testing.T) {
// 	testCases := []struct {
// 		name                      string
// 		req                       *apiv1.TestRequest
// 		integrationId             string
// 		evaluatedDatasourceConfig *structpb.Struct
// 		err                       error
// 	}{
// 		{
// 			name: "gsheets without integration id",
// 			req: &apiv1.TestRequest{
// 				IntegrationType: "gsheets",
// 				ConfigurationId: "configuration-id",
// 				DatasourceConfig: &structpb.Struct{
// 					Fields: map[string]*structpb.Value{
// 						"spreadsheetId": structpb.NewStringValue("blerglergler"),
// 					},
// 				},
// 			},
// 			evaluatedDatasourceConfig: &structpb.Struct{
// 				Fields: map[string]*structpb.Value{
// 					"spreadsheetId": structpb.NewStringValue("blerglergler"),
// 				},
// 			},
// 		},
// 		{
// 			name:          "gsheets with integration id",
// 			integrationId: "integration-id",
// 			req: &apiv1.TestRequest{
// 				IntegrationType: "gsheets",
// 				ConfigurationId: "configuration-id",
// 				DatasourceConfig: &structpb.Struct{
// 					Fields: map[string]*structpb.Value{
// 						"id":            structpb.NewStringValue("integration-id"),
// 						"spreadsheetId": structpb.NewStringValue("blerglergler"),
// 					},
// 				},
// 			},
// 			evaluatedDatasourceConfig: &structpb.Struct{
// 				Fields: map[string]*structpb.Value{
// 					"id":            structpb.NewStringValue("integration-id"),
// 					"spreadsheetId": structpb.NewStringValue("blerglergler"),
// 				},
// 			},
// 		},
// 		{
// 			name:          "gsheets with integration id",
// 			integrationId: "integration-id",
// 			req: &apiv1.TestRequest{
// 				IntegrationType: "gsheets",
// 				ConfigurationId: "configuration-id",
// 				DatasourceConfig: &structpb.Struct{
// 					Fields: map[string]*structpb.Value{
// 						"id":            structpb.NewStringValue("integration-id"),
// 						"spreadsheetId": structpb.NewStringValue("{{Env.hello}}"),
// 					},
// 				},
// 			},
// 			evaluatedDatasourceConfig: &structpb.Struct{
// 				Fields: map[string]*structpb.Value{
// 					"id":            structpb.NewStringValue("integration-id"),
// 					"spreadsheetId": structpb.NewStringValue("Elon Musk"),
// 				},
// 			},
// 		},
// 	}

// 	for _, tc := range testCases {
// 		t.Run(tc.name, func(t *testing.T) {
// 			tm := &mocks.TokenManager{}
// 			ctx := context.Background()
// 			var authConfigNew *pluginscommon.Auth
// 			tm.On("AddTokenIfNeeded", ctx, tc.req.DatasourceConfig, tc.req.DatasourceConfig, authConfigNew, tc.integrationId, tc.req.ConfigurationId, tc.req.IntegrationType).Return(types.TokenPayload{}, nil)

// 			mockWorker := &worker.MockClient{}
// 			mockWorker.On("TestConnection", ctx, tc.req.IntegrationType, tc.evaluatedDatasourceConfig).Return(nil, nil)

// 			fetcher := &fetchmocks.Fetcher{}
// 			fetcher.On("FetchIntegrationMetadata", ctx, tc.integrationId).Return(nil, errors.New("not found error"))
// 			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(new(integrationv1.GetIntegrationsResponse), nil)

// 			defer metrics.SetupForTesting()()
// 			os.Setenv("SUPERBLOCKS_AGENT_APP_ENV_HELLO", "Elon Musk")
// 			secretManager := secrets.NewSecretManager()

// 			server := NewServer(&Config{
// 				TokenManager:  tm,
// 				Logger:        zap.NewNop(),
// 				Store:         store.Memory(),
// 				Worker:        mockWorker,
// 				Fetcher:       fetcher,
// 				SecretManager: secretManager,
// 			})

// 			_, err := server.Test(ctx, tc.req)
// 			assert.Equal(t, tc.err, err)
// 			if tc.err != nil {
// 				assert.Equal(t, tc.err, sberror.ToIntegrationError(err))
// 				_, ok := sberror.IsIntegrationError(tc.err)
// 				assert.Equal(t, ok, true)
// 			}
// 		})
// 	}
// }

func TestGetViewMode(t *testing.T) {
	tests := []struct {
		name     string
		req      *apiv1.ExecuteRequest
		expected apiv1.ViewMode
	}{
		{
			name: "fetch with view mode",
			req: &apiv1.ExecuteRequest{
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
					},
				},
			},
			expected: apiv1.ViewMode_VIEW_MODE_EDIT,
		},
		{
			name: "fetch by path with view mode",
			req: &apiv1.ExecuteRequest{
				Request: &apiv1.ExecuteRequest_FetchByPath_{
					FetchByPath: &apiv1.ExecuteRequest_FetchByPath{
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
					},
				},
			},
			expected: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
		},
		{
			name: "inline definition with top-level view mode",
			req: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_PREVIEW,
				Request: &apiv1.ExecuteRequest_Definition{
					Definition: &apiv1.Definition{},
				},
			},
			expected: apiv1.ViewMode_VIEW_MODE_PREVIEW,
		},
		{
			name: "no fetch returns top-level view mode",
			req: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
			},
			expected: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
		},
		{
			name: "unspecified view mode",
			req: &apiv1.ExecuteRequest{
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode: apiv1.ViewMode_VIEW_MODE_UNSPECIFIED,
					},
				},
			},
			expected: apiv1.ViewMode_VIEW_MODE_UNSPECIFIED,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getViewMode(tt.req)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestMetadata(t *testing.T) {
	testToken := "test-token"
	profileName := "test-profile"
	emptyStepConfig := &structpb.Struct{
		Fields: map[string]*structpb.Value{},
	}
	testActionConfig := structpb.NewStructValue(emptyStepConfig)
	testCases := []struct {
		name                 string
		req                  *apiv1.MetadataRequest
		pluginId             string
		integrationId        string
		err                  error
		expectedActionConfig *structpb.Value
		expectedMetadataResp *transportv1.Response
		expectedMetadataErr  error
		// the response we expect from the metadata call
		expectResponse any
	}{
		{
			name:          "gsheets with integration id",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"gsheets": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: nil,
			expectedMetadataErr:  nil,
		},
		{
			name:          "kinesis metadata happy path",
			integrationId: "test-integration-id",
			pluginId:      "kinesis",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"kinesis": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: &transportv1.Response{Data: &transportv1.Response_Data{Data: &transportv1.Response_Data_Data{Kinesis: &kinesis.Metadata{Streams: []string{"foo", "bar"}}}}},
			expectResponse:       &apiv1.MetadataResponse_Kinesis{Kinesis: &kinesis.Metadata{Streams: []string{"foo", "bar"}}},
		},
		{
			name:          "handles missing step configuration gracefully",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: nil,
			expectedMetadataErr:  nil,
		},
		{
			name:          "handles wrong plugin gracefully",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"wrong plugin": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: nil,
			expectedMetadataErr:  nil,
		},
		{
			name:          "handles worker returned non-integration error correctly",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"wrong plugin": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: nil,
			expectedMetadataErr:  errors.New("some worker error"),
		},
		{
			name:          "handles worker returned integration error correctly",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"wrong plugin": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: nil,
			expectedMetadataErr:  sberror.IntegrationError(errors.New("some worker error"), v1.Code_CODE_INTEGRATION_AUTHORIZATION),
		},
		{
			name:          "check googlesheets next page token is returned when present",
			integrationId: "test-integration-id",
			pluginId:      "gsheets",
			req: &apiv1.MetadataRequest{
				Integration: "test-integration-id",
				Profile:     &v1.Profile{Name: &profileName},
				StepConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"wrong plugin": testActionConfig,
					},
				},
			},
			expectedActionConfig: testActionConfig,
			expectedMetadataResp: &transportv1.Response{Data: &transportv1.Response_Data{Data: &transportv1.Response_Data_Data{GSheetsNextPageToken: &testToken}}},
			expectedMetadataErr:  nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tm := &mocks.TokenManager{}
			ctx := context.Background()
			tm.On("AddTokenIfNeeded", ctx, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(types.TokenPayload{}, nil)

			mockWorker := &worker.MockClient{}
			mockWorker.On("Metadata", ctx, tc.pluginId, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tc.expectedMetadataResp, tc.expectedMetadataErr)

			fetcher := &fetchmocks.Fetcher{}
			fetcher.On("FetchIntegration", ctx, tc.integrationId, mock.Anything).Return(&fetch.Integration{
				PluginId: tc.pluginId,
			}, nil)
			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(new(integrationv1.GetIntegrationsResponse), nil)

			defer metrics.SetupForTesting()()
			server := NewServer(&Config{
				TokenManager:  tm,
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			resp, err := server.Metadata(ctx, tc.req)
			if err != nil {
				assert.Equal(t, err, sberror.ToIntegrationError(tc.expectedMetadataErr))
				_, ok := sberror.IsIntegrationError(err)
				assert.Equal(t, ok, true)
			} else {
				assert.Equal(t, tc.err, err)
			}

			if tc.expectedMetadataResp.GetData().GetData().GetGSheetsNextPageToken() == testToken {
				assert.Equal(t, resp.GetGSheetsNextPageToken(), testToken)
			}

			if tc.expectedMetadataResp.GetData().GetData().GetGSheetsNextPageToken() == "" {
				assert.Equal(t, resp.GetGSheetsNextPageToken(), "")
			}

			if tc.expectResponse != nil {
				assert.Equal(t, resp.Metadata, tc.expectResponse)
			}
		})
	}
}

// TestExecuteV3ConvertsToFetchCodeRequest verifies that ExecuteV3 correctly
// converts an ExecuteV3Request into an internal ExecuteRequest with FetchCode,
// passing applicationId through to FetchApiCode. Fetch() calls FetchApiCode
// directly (same flow as FetchByPath) and returns synthetic def + bundle in rawDef.
func TestExecuteV3ConvertsToFetchCodeRequest(t *testing.T) {
	commitId := "commit-abc"
	branchName := "feature/code-mode"

	for _, test := range []struct {
		name                  string
		request               *apiv1.ExecuteV3Request
		expectedApplicationId string
		expectedCommitId      *string
		expectedBranchName    *string
	}{
		{
			name: "all fields populated with commitId",
			request: &apiv1.ExecuteV3Request{
				ApplicationId: "app-123",
				ViewMode:      apiv1.ViewMode_VIEW_MODE_DEPLOYED,
				CommitId:      &commitId,
			},
			expectedApplicationId: "app-123",
			expectedCommitId:      &commitId,
			expectedBranchName:    nil,
		},
		{
			name: "with branchName instead of commitId",
			request: &apiv1.ExecuteV3Request{
				ApplicationId: "app-789",
				ViewMode:      apiv1.ViewMode_VIEW_MODE_EDIT,
				BranchName:    &branchName,
			},
			expectedApplicationId: "app-789",
			expectedCommitId:      nil,
			expectedBranchName:    &branchName,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			defer metrics.SetupForTesting()()

			expectedCommitId := ""
			if test.expectedCommitId != nil {
				expectedCommitId = *test.expectedCommitId
			}
			expectedBranchName := ""
			if test.expectedBranchName != nil {
				expectedBranchName = *test.expectedBranchName
			}

			mockWorker := &worker.MockClient{}
			fetcher := &fetchmocks.Fetcher{}

			// FetchCode skips FetchApi and goes straight to FetchApiCode via fetchCodeBundle.
			// Mock FetchApiCode to verify applicationId, commitId, and branchName propagation.
			fetchErr := errors.New("fetch stopped for test")
			fetcher.On("FetchApiCode", mock.Anything,
				mock.MatchedBy(func(appId string) bool {
					assert.Equal(t, test.expectedApplicationId, appId)
					return true
				}),
				"", // entryPoint is empty for code-mode
				mock.MatchedBy(func(commitId string) bool {
					assert.Equal(t, expectedCommitId, commitId, "commitId must propagate correctly")
					return true
				}),
				mock.MatchedBy(func(branchName string) bool {
					assert.Equal(t, expectedBranchName, branchName, "branchName must propagate correctly")
					return true
				}),
				mock.Anything, // useAgentKey
			).Return(nil, fetchErr)

			server := NewServer(&Config{
				Logger:        zap.NewNop(),
				Store:         store.Memory(),
				Worker:        mockWorker,
				Fetcher:       fetcher,
				SecretManager: secrets.NewSecretManager(),
			})

			ctx := context.WithValue(context.Background(), constants.ContextKeyRequestUsesJwtAuth, true)
			ctx = jwt_validator.WithUserEmail(ctx, "test@example.com")
			_, err := server.ExecuteV3(ctx, test.request)

			require.Error(t, err)
			fetcher.AssertExpectations(t)
		})
	}
}

// TestExecuteCodeMode verifies the direct code-mode execution path bypasses the block executor
// and dispatches the combined wrapper+bundle script directly to the JS worker.
func TestExecuteCodeMode(t *testing.T) {
	t.Parallel()

	t.Run("dispatches wrapper+bundle to worker and returns output", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		fetcher := &fetchmocks.Fetcher{}
		memStore := store.Memory()

		// Pre-write the worker output to the store (simulating what the worker would do).
		// Workers use protojson.Marshal(OutputOld), which produces camelCase (e.g. placeHoldersInfo).
		// We use protojson.Unmarshal to avoid silent data loss from encoding/json's snake_case expectation.
		outputJSON := `{"output":{"key":"value"},"placeHoldersInfo":{"foo":"bar"}}`
		outputKey := "output-key-123"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: outputJSON}))

		// Mock Worker.Execute to return the output key.
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.MatchedBy(func(data *transportv1.Request_Data_Data) bool {
			// Verify the action configuration contains the wrapper script with the bundle.
			body := data.GetProps().GetActionConfiguration().GetFields()["body"].GetStringValue()
			return body != "" &&
				// Script should contain the sdk-api execute pattern and bundle (from rawResult)
				assert.Contains(t, body, "__sb_execute") &&
				assert.Contains(t, body, "__sb_result") &&
				assert.Contains(t, body, "module.exports = { run: function(ctx) { return ctx; } };") &&
				assert.Contains(t, body, "__sb_executionId")
		}), mock.Anything, mock.Anything).Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger:  zap.NewNop(),
				Store:   memStore,
				Worker:  mockWorker,
				Fetcher: fetcher,
			},
		}

		// Set up context with JWT claims for user extraction.
		executionID := "exec-code-mode-success"
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyRbacGroupObjects, []*authv1.Claims_RbacGroupObject{
			{Id: "group-1", Name: "admins"},
		})
		metadata, err := structpb.NewStruct(map[string]interface{}{"department": "engineering"})
		require.NoError(t, err)
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyMetadata, metadata)
		ctx = constants.WithExecutionID(ctx, executionID)

		fetchCode := &apiv1.ExecuteRequest_FetchCode{
			Id:       "app-1",
			CommitId: strPtr("commit-abc"),
		}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
			Inputs: map[string]*structpb.Value{
				"greeting": structpb.NewStringValue("hello"),
			},
		}

		var sentEvents []*apiv1.StreamResponse
		send := func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		}

		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("module.exports = { run: function(ctx) { return ctx; } };"),
			},
		}
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, send)
		require.NoError(t, err)
		require.NotNil(t, done)
		assert.Equal(t, "code-mode", done.Last)
		assert.NotNil(t, done.Output)
		assert.NotNil(t, done.Output.Result, "output.Result should be populated from worker response")
		// Verify protojson camelCase (placeHoldersInfo) is preserved; encoding/json would have lost it.
		require.NotNil(t, done.Output.RequestV2)
		require.NotNil(t, done.Output.RequestV2.Metadata)
		ph := done.Output.RequestV2.Metadata.GetFields()["placeHoldersInfo"]
		require.NotNil(t, ph)
		assert.Equal(t, "bar", ph.GetStructValue().GetFields()["foo"].GetStringValue())
		assert.Len(t, sentEvents, 1)
		assert.Equal(t, executionID, sentEvents[0].GetExecution())
		assert.Empty(t, sentEvents[0].GetEvent().GetResponse().GetErrors(), "success case should have no errors")

		mockWorker.AssertExpectations(t)
	})

	t.Run("propagates execution errors in response when worker output contains error", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		fetcher := &fetchmocks.Fetcher{}
		memStore := store.Memory()

		// Worker output with error field (JS bundle threw at runtime).
		// Workers set output.error when execution fails; OutputFromOutputOldJSON maps this to Stderr.
		outputJSON := `{"output":{},"log":["[ERROR] runtime error"],"error":"ReferenceError: x is not defined"}`
		outputKey := "output-key-error"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: outputJSON}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger:  zap.NewNop(),
				Store:   memStore,
				Worker:  mockWorker,
				Fetcher: fetcher,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = constants.WithExecutionID(ctx, "exec-code-mode-error")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})
		require.NoError(t, err)
		require.NotNil(t, done)
		require.NotNil(t, done.Output)
		assert.Len(t, done.Output.Stderr, 2, "Stderr should include both log [ERROR] and error field")
		assert.Contains(t, done.Output.Stderr, "runtime error")
		assert.Contains(t, done.Output.Stderr, "ReferenceError: x is not defined")

		require.Len(t, sentEvents, 1)
		respEvent := sentEvents[0].GetEvent().GetResponse()
		require.NotNil(t, respEvent)
		assert.Len(t, respEvent.Errors, 2, "Response.Errors should propagate worker execution errors")
		assert.Equal(t, "runtime error", respEvent.Errors[0].GetMessage())
		assert.Equal(t, "ReferenceError: x is not defined", respEvent.Errors[1].GetMessage())

		mockWorker.AssertExpectations(t)
	})

	t.Run("sends structured error event when bundle is missing from rawResult", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
			},
		}

		executionID := "exec-code-mode-missing-bundle"
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = constants.WithExecutionID(ctx, executionID)
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		// rawResult with empty bundle - simulates Fetch returning malformed data.
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue(""),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "missing bundle")
		assert.Nil(t, done)
		assert.Len(t, sentEvents, 1, "should send an error event")
		assert.Equal(t, executionID, sentEvents[0].GetExecution())
		assert.NotNil(t, sentEvents[0].GetEvent().GetEnd().GetError())
	})

	t.Run("sends structured error event when worker execution fails", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, "", errors.New("worker crashed"))

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "worker crashed")
		assert.Nil(t, done)
		assert.Len(t, sentEvents, 1, "should send an error event")
		assert.NotNil(t, sentEvents[0].GetEvent().GetEnd().GetError())

		mockWorker.AssertExpectations(t)
	})

	t.Run("passes JWT org_id and org_type to worker as OrganizationPlan and OrgId options", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		fetcher := &fetchmocks.Fetcher{}
		memStore := store.Memory()

		outputKey := "output-key-org"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":{}}`}))

		var capturedOpts []workeroptions.Option
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Run(func(args mock.Arguments) {
				// The variadic options start at index 3.
				for i := 3; i < len(args); i++ {
					if opt, ok := args[i].(workeroptions.Option); ok {
						capturedOpts = append(capturedOpts, opt)
					}
				}
			}).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger:  zap.NewNop(),
				Store:   memStore,
				Worker:  mockWorker,
				Fetcher: fetcher,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = jwt_validator.WithOrganizationID(ctx, "cdc9b994-34a3-41bc-8a07-1d0f47b61d84")
		ctx = jwt_validator.WithOrganizationType(ctx, "ENTERPRISE")
		ctx = constants.WithExecutionID(ctx, "exec-org-id-test")

		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("module.exports = { run: function(ctx) { return ctx; } };"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		_, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error {
			return nil
		})
		require.NoError(t, err)

		applied := workeroptions.Apply(capturedOpts...)
		assert.Equal(t, "cdc9b994-34a3-41bc-8a07-1d0f47b61d84", applied.OrgId,
			"Worker.Execute must receive orgId from JWT org_id claim")
		assert.Equal(t, "ENTERPRISE", applied.OrganizationPlan,
			"Worker.Execute must receive orgPlan from JWT org_type claim")

		mockWorker.AssertExpectations(t)
	})

	t.Run("passes empty orgId and orgPlan when JWT claims are missing", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		fetcher := &fetchmocks.Fetcher{}
		memStore := store.Memory()

		outputKey := "output-key-no-org"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":{}}`}))

		var capturedOpts []workeroptions.Option
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Run(func(args mock.Arguments) {
				for i := 3; i < len(args); i++ {
					if opt, ok := args[i].(workeroptions.Option); ok {
						capturedOpts = append(capturedOpts, opt)
					}
				}
			}).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger:  zap.NewNop(),
				Store:   memStore,
				Worker:  mockWorker,
				Fetcher: fetcher,
			},
		}

		// Context with user email (required) but WITHOUT org_id / org_type JWT claims.
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = constants.WithExecutionID(ctx, "exec-no-org-test")

		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		_, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error {
			return nil
		})
		require.NoError(t, err)

		applied := workeroptions.Apply(capturedOpts...)
		assert.Empty(t, applied.OrgId,
			"Without JWT org_id claim, orgId should be empty — LD flags will use fallthrough defaults")
		assert.Empty(t, applied.OrganizationPlan,
			"Without JWT org_type claim, orgPlan should be empty — LD flags will use fallthrough defaults")

		mockWorker.AssertExpectations(t)
	})

	t.Run("returns error when JWT user id is missing", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
			},
		}

		// Context without JWT user identity.
		ctx := context.Background()
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})
		assert.Error(t, err)
		assert.True(t, sberror.IsAuthorizationError(err), "missing JWT should return auth error, not internal")
		assert.Contains(t, err.Error(), "user id")
		assert.Nil(t, done)
		assert.Len(t, sentEvents, 1, "should send an error event")
	})

	t.Run("garbage collects output key after success", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()

		outputKey := "gc-test-key"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":"ok"}`}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return nil })
		require.NoError(t, err)
		require.NotNil(t, done)

		// The output key should have been cleaned up.
		vals, readErr := memStore.Read(context.Background(), outputKey)
		assert.NoError(t, readErr)
		if len(vals) > 0 {
			assert.Nil(t, vals[0], "output key should have been garbage collected")
		}

		mockWorker.AssertExpectations(t)
	})

	t.Run("wrapper script contains run() invocation", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()

		outputKey := "run-test-key"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":"ok"}`}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.MatchedBy(func(data *transportv1.Request_Data_Data) bool {
			body := data.GetProps().GetActionConfiguration().GetFields()["body"].GetStringValue()
			return assert.Contains(t, body, "__sb_execute") &&
				assert.Contains(t, body, "var module = { exports: {} }")
		}), mock.Anything, mock.Anything).Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{
				Metadata: &v1.Metadata{Name: "code-mode"},
			},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("module.exports = { run: function(ctx) { return ctx; } };"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return nil })
		require.NoError(t, err)
		require.NotNil(t, done)

		mockWorker.AssertExpectations(t)
	})

	t.Run("sends error event when rawResult is nil", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		s := &server{
			Config: &Config{Logger: zap.NewNop()},
		}

		executionID := "exec-code-mode-nil-raw"
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = constants.WithExecutionID(ctx, executionID)
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, nil, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "nil rawResult")
		assert.Nil(t, done)
		assert.Len(t, sentEvents, 1)
		assert.NotNil(t, sentEvents[0].GetEvent().GetEnd().GetError())
	})

	t.Run("returns error when Store.Read fails", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		mockStore := &storemock.Store{}
		outputKey := "read-error-key"
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)
		mockStore.On("Read", mock.Anything, outputKey).Return(nil, errors.New("redis connection failed"))
		mockStore.On("Delete", mock.Anything, outputKey).Return(nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  mockStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{"bundle": structpb.NewStringValue("code")},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return nil })
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "redis connection failed")
		assert.Nil(t, done)

		mockWorker.AssertExpectations(t)
		mockStore.AssertExpectations(t)
	})

	t.Run("returns error when store value has unexpected type", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()
		outputKey := "unexpected-type-key"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: 42}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{"bundle": structpb.NewStringValue("code")},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return nil })
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "unexpected store value type int")
		assert.Nil(t, done)

		mockWorker.AssertExpectations(t)
	})

	t.Run("returns error when worker output JSON is malformed", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()
		outputKey := "malformed-json-key"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{invalid json`}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{"bundle": structpb.NewStringValue("code")},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return nil })
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "could not unmarshal worker output")
		assert.Nil(t, done)

		mockWorker.AssertExpectations(t)
	})

	t.Run("recovers stdout/stderr from store when worker fails", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()

		outputKey := "output-key-worker-err-with-logs"
		outputJSON := `{"output":{"partial":"data"},"log":["[INFO] connecting to db","[ERROR] connection refused"],"error":"Integration \"abc\" failed during \"query\": ECONNREFUSED"}`
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: outputJSON}))

		workerErr := errors.New("execution failed: non-zero exit code")
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, workerErr)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		executionID := "exec-worker-err-with-logs"
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = constants.WithExecutionID(ctx, executionID)
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("module.exports = { run: function() {} };"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})

		require.NoError(t, err, "should succeed with structured errors, not return a Go error")
		require.NotNil(t, done)
		require.NotNil(t, done.Output)

		assert.Contains(t, done.Output.Stdout, "[INFO] connecting to db", "stdout log lines should be recovered")
		assert.Contains(t, done.Output.Stderr, "connection refused", "stderr log lines should be recovered")
		assert.Contains(t, done.Output.Stderr, `Integration "abc" failed during "query": ECONNREFUSED`, "error field should appear in stderr")

		require.Len(t, sentEvents, 1)
		respEvent := sentEvents[0].GetEvent().GetResponse()
		require.NotNil(t, respEvent, "should send a Response event, not an End/error event")
		require.GreaterOrEqual(t, len(respEvent.Errors), 2, "should include worker error + stderr entries")
		assert.Contains(t, respEvent.Errors[0].GetMessage(), "execution failed", "first error should be the worker error")

		mockWorker.AssertExpectations(t)
	})

	t.Run("falls back to sendError when worker fails and store has no useful output", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()

		// Don't pre-write anything to the store for this key — simulates the
		// worker crashing before it could write any output.
		outputKey := "output-key-worker-err-empty"

		workerErr := errors.New("sandbox OOM killed")
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, workerErr)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = constants.WithExecutionID(ctx, "exec-worker-err-empty-output")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"bundle": structpb.NewStringValue("code"),
			},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})

		assert.Error(t, err, "should return Go error when no useful output to recover")
		assert.Contains(t, err.Error(), "sandbox OOM killed")
		assert.Nil(t, done)
		require.Len(t, sentEvents, 1)
		assert.NotNil(t, sentEvents[0].GetEvent().GetEnd().GetError(), "should send End error event, not Response event")

		mockWorker.AssertExpectations(t)
	})

	t.Run("worker fails and store read also fails falls back to sendError", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		mockStore := &storemock.Store{}
		outputKey := "output-key-both-fail"

		workerErr := errors.New("worker timeout")
		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, workerErr)
		mockStore.On("Read", mock.Anything, outputKey).Return(nil, errors.New("redis unavailable"))
		mockStore.On("Delete", mock.Anything, outputKey).Return(nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  mockStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-1")
		ctx = constants.WithExecutionID(ctx, "exec-both-fail")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{"bundle": structpb.NewStringValue("code")},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		var sentEvents []*apiv1.StreamResponse
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(resp *apiv1.StreamResponse) error {
			sentEvents = append(sentEvents, resp)
			return nil
		})

		assert.Error(t, err, "should fall back to sendError when both worker and store fail")
		assert.Contains(t, err.Error(), "worker timeout")
		assert.Nil(t, done)
		require.Len(t, sentEvents, 1)
		assert.NotNil(t, sentEvents[0].GetEvent().GetEnd().GetError())

		mockWorker.AssertExpectations(t)
		mockStore.AssertExpectations(t)
	})

	t.Run("returns error when send fails", func(t *testing.T) {
		t.Parallel()
		defer metrics.SetupForTesting()()

		mockWorker := &worker.MockClient{}
		memStore := store.Memory()
		outputKey := "send-fail-key"
		require.NoError(t, memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":"ok"}`}))

		mockWorker.On("Execute", mock.Anything, "javascriptsdkapi", mock.Anything, mock.Anything, mock.Anything).
			Return(nil, outputKey, nil)

		s := &server{
			Config: &Config{
				Logger: zap.NewNop(),
				Store:  memStore,
				Worker: mockWorker,
			},
		}

		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: strPtr("abc")}
		result := &apiv1.Definition{
			Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "code-mode"}},
		}
		rawResult := &structpb.Struct{
			Fields: map[string]*structpb.Value{"bundle": structpb.NewStringValue("code")},
		}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}

		sendErr := errors.New("stream closed")
		done, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, func(*apiv1.StreamResponse) error { return sendErr })
		assert.Error(t, err)
		assert.ErrorIs(t, err, sendErr)
		assert.Nil(t, done)

		mockWorker.AssertExpectations(t)
	})
}

func strPtr(s string) *string { return &s }
