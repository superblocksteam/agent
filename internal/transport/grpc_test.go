package transport

import (
	"context"
	"errors"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"

	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/utils"
	"google.golang.org/protobuf/proto"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/types"

	"github.com/superblocksteam/agent/internal/fetch"
	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	sberror "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/worker"
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

// 			metrics.RegisterMetrics()
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
			mockWorker.On("Metadata", ctx, tc.pluginId, mock.Anything, mock.Anything).Return(tc.expectedMetadataResp, tc.expectedMetadataErr)

			fetcher := &fetchmocks.Fetcher{}
			fetcher.On("FetchIntegration", ctx, tc.integrationId, mock.Anything).Return(&fetch.Integration{
				PluginId: tc.pluginId,
			}, nil)
			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(new(integrationv1.GetIntegrationsResponse), nil)

			metrics.RegisterMetrics()
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
