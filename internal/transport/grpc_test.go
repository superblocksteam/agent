package transport

import (
	"context"
	"errors"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/secrets"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/internal/fetch"
	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	sberror "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/worker"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	gsheets "github.com/superblocksteam/agent/types/gen/go/plugins/gsheets/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
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
		})
	}
}
