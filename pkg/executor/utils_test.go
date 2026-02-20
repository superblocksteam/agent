package executor

import (
	"context"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/golang/protobuf/jsonpb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/fetch"
	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	mocks "github.com/superblocksteam/agent/internal/flags/mock"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/testutils"
	"github.com/superblocksteam/agent/pkg/utils"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	v2 "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v2"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestResolve(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer sandbox.Close()

	for _, test := range []struct {
		name     string
		template string
		options  []engine.ResultOption
		expected any
		err      string
		resolved map[string]*apiv1.Resolved
	}{
		{
			name:     "error fetching engine",
			template: "[1,2,,]",
			options:  nil,
			expected: []string{"1", "2", ""},
			resolved: map[string]*apiv1.Resolved{
				"test_path": {
					Value: &structpb.Value{
						Kind: &structpb.Value_ListValue{
							ListValue: &structpb.ListValue{
								Values: []*structpb.Value{
									{
										Kind: &structpb.Value_NumberValue{
											NumberValue: 1,
										},
									},
									{
										Kind: &structpb.Value_NumberValue{
											NumberValue: 2,
										},
									},
									{
										Kind: &structpb.Value_NullValue{},
									},
								},
							},
						},
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := apictx.New(&apictx.Context{
				Context: context.Background(),
				RequestOptions: &apiv1.ExecuteRequest_Options{
					IncludeResolved: true,
				},
			})

			result, err := ResolveTemplate[any](ctx, sandbox, zap.NewNop(), test.template, false, append(test.options, engine.WithResolved("test_path"))...)

			if test.err != "" {
				assert.Error(t, err)
				assert.Equal(t, test.err, err.Error())
			} else {
				assert.NotNil(t, result)
				assert.Equal(t, test.expected, *result)
				assert.NoError(t, err)
				assert.Equal(t, test.resolved, ctx.GetResolved())
			}
		})
	}
}

func TestExtractJSONOutputAtKey(t *testing.T) {
	for _, test := range []struct {
		in, out string
		err     error
	}{
		{`{"output":""}`, `""`, nil},
		{`{"output":" "}`, `" "`, nil},
		{`{"output":" 5"}`, `" 5"`, nil},
		{`{"output": "5 "}`, `"5 "`, nil},
		{`{"output":null}`, "null", nil},
		{`{"output":true}`, "true", nil},
		{`{"output":false}`, "false", nil},
		{`{"output":"\"5\""}`, `"\"5\""`, nil},
		{`{"output":"\n"}`, `"\n"`, nil},
		{`{"output":"\\\\"}`, `"\\\\"`, nil},
		{`{"output":"output"}`, `"output"`, nil},
		{`{"output":"{\"output\":5}"}`, `"{\"output\":5}"`, nil},
		{`{"output":[1,2,3]}`, "[1,2,3]", nil},
		{`{"output":{"nestedOutput":"5"}}`, `{"nestedOutput":"5"}`, nil},
		{`{"output":{"nestedOutput":{"nestedOutput":"5"}}}`, `{"nestedOutput":{"nestedOutput":"5"}}`, nil},
		{`{"output":[{"nestedOutput":"5"},{"nestedOutput":"6"}]}`, `[{"nestedOutput":"5"},{"nestedOutput":"6"}]`, nil},
		{`{"notOutput":"5"}`, "", sberrors.ErrInternal},
		{`{"output":5,"output":6}`, "5", nil},
		{`{"output":["5", "6"]}`, `["5", "6"]`, nil},
		{`{ "output": { "foo": [ "bar", "baz" ] } }`, `{ "foo": [ "bar", "baz" ] }`, nil},
		{`{"output":  {"output": 5} }`, `{"output": 5}`, nil},
		{`{"output":  [1, 2, 3, {"output": 5}] }`, `[1, 2, 3, {"output": 5}]`, nil},
		{`{"output":  [1, 2, 3, {"output": [1, 2, 3]}] }`, `[1, 2, 3, {"output": [1, 2, 3]}]`, nil},
		{`{"output":  [1, 2, 3, {"notOutput": [1, 2, 3]}] }`, `[1, 2, 3, {"notOutput": [1, 2, 3]}]`, nil},
		{`{"output":  [] }`, `[]`, nil},
		{`jkdfsakdfs`, "", sberrors.ErrInternal},
		{`{"output":5}`, "5", nil},
		{`{ "output": { "foo": "bar" } }`, `{ "foo": "bar" }`, nil},
		{`    { "output": { "foo": "bar" } }`, `{ "foo": "bar" }`, nil},
		{`{"startTimeUtc":"2023-07-24T02:47:17Z","request":"return 5;","log":[],"executionTime":113,"output":   5}`, "5", nil},
	} {
		out, err := extractJSONOutputAtKey(test.in, "output", true)

		assert.Equal(t, test.err, err)
		assert.Equal(t, test.out, out)
	}
}

func BenchmarkExtractJSONOutputAtKey(b *testing.B) {
	for i := 0; i < b.N; i++ {
		extractJSONOutputAtKey(`{ "output": { "foo": "bar" } }`, "output", true)
	}
}

func TestExtractVariablesFromInputs(t *testing.T) {
	for _, test := range []struct {
		name string
		in   map[string]*structpb.Value
		out  []*apiv1.Variables_Config
		err  bool
	}{
		{
			name: "happy path",
			in: map[string]*structpb.Value{
				"FilePicker1": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"files": []any{
							map[string]any{
								"$superblocksId": "hi",
							},
							map[string]any{
								"$superblocksId": "bye",
							},
						},
					})
					return value
				}(),
			},
			out: []*apiv1.Variables_Config{
				{
					Key:   "FilePicker1",
					Value: `{{{"files":[{"$superblocksId":"hi","path":"/var/file"},{"$superblocksId":"bye"}]}}}`,
					Type:  apiv1.Variables_TYPE_FILEPICKER,
					Mode:  apiv1.Variables_MODE_READ,
				},
			},
		},
		{
			name: "no files",
			in: map[string]*structpb.Value{
				"FilePicker1": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"wrong_key": []any{"hello", "world"},
					})
					return value
				}(),
				"FilePicker2": func() *structpb.Value {
					value, _ := structpb.NewValue([]any{"wrong_type"})
					return value
				}(),
				"FilePicker3": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"files": "wrong_value",
					})
					return value
				}(),
				"FilePicker4": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"files": []any{5},
					})
					return value
				}(),
				"FilePicker5": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"files": []any{
							map[string]any{
								"$wrong": "hi",
							},
						},
					})
					return value
				}(),
				"FilePicker6": func() *structpb.Value {
					value, _ := structpb.NewValue(map[string]any{
						"files": []any{
							map[string]any{
								"$superblocksId": 5,
							},
						},
					})
					return value
				}(),
				"": nil,
			},
			out: []*apiv1.Variables_Config{
				{
					Key:   "FilePicker1",
					Value: `{{{"wrong_key":["hello","world"]}}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
				{
					Key:   "FilePicker2",
					Value: `{{["wrong_type"]}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
				{
					Key:   "FilePicker3",
					Value: `{{{"files":"wrong_value"}}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
				{
					Key:   "FilePicker4",
					Value: `{{{"files":[5]}}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
				{
					Key:   "FilePicker5",
					Value: `{{{"files":[{"$wrong":"hi"}]}}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
				{
					Key:   "FilePicker6",
					Value: `{{{"files":[{"$superblocksId":5}]}}}`,
					Type:  apiv1.Variables_TYPE_NATIVE,
					Mode:  apiv1.Variables_MODE_READ,
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := ExtractVariablesFromInputs(test.in, []*transportv1.Request_Data_Data_Props_File{
				{
					Originalname: "hi",
					Path:         "/var/file",
				},
			})

			sort.SliceStable(result, func(i, j int) bool {
				return result[i].Key < result[j].Key
			})

			sort.SliceStable(test.out, func(i, j int) bool {
				return test.out[i].Key < test.out[j].Key
			})

			// Protobuf is inserting random whitespace to guard against stuff like this.
			// However, this is a uint test so it's okay...
			for k, v := range result {
				v.Value = strings.Join(strings.Fields(v.Value), "")
				result[k] = v
			}

			if test.err {
				assert.Error(t, err)
			} else {
				assert.Equal(t, test.out, result)
				assert.NoError(t, err)
			}
		})
	}
}

func TestConstructHandleWorkflowFetchRequest(t *testing.T) {
	flags := &mocks.Flags{}
	flags.On("GetWorkflowPluginInheritanceEnabled", mock.Anything).Return(true)

	for _, test := range []struct {
		name     string
		options  *Options
		isStep   bool
		expected *apiv1.ExecuteRequest
	}{
		{
			name: "inheritance deployed without branch",
			options: &Options{
				Flags:      flags,
				IsDeployed: true,
			},
			isStep: true,
			expected: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						Id: "plugin",
						Profile: &commonv1.Profile{
							Name: utils.Pointer("profile"),
						},
						Token:    utils.Pointer("token"),
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
					},
				},
			},
		},
		{
			name: "inheritance deployed with branch",
			options: &Options{
				Flags:      flags,
				IsDeployed: true,
				BranchName: "branch",
			},
			isStep: true,
			expected: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						Id: "plugin",
						Profile: &commonv1.Profile{
							Name: utils.Pointer("profile"),
						},
						Token:      utils.Pointer("token"),
						ViewMode:   apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						BranchName: utils.Pointer("branch"),
					},
				},
			},
		},
		{
			name: "inheritance deployed with branch",
			options: &Options{
				Flags:      flags,
				IsDeployed: true,
				BranchName: "branch",
			},
			isStep: true,
			expected: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						Id: "plugin",
						Profile: &commonv1.Profile{
							Name: utils.Pointer("profile"),
						},
						Token:      utils.Pointer("token"),
						ViewMode:   apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						BranchName: utils.Pointer("branch"),
					},
				},
			},
		},
		{
			name: "inheritance not deployed with branch",
			options: &Options{
				Flags:      flags,
				BranchName: "branch",
			},
			isStep: true,
			expected: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						Id: "plugin",
						Profile: &commonv1.Profile{
							Name: utils.Pointer("profile"),
						},
						Token:      utils.Pointer("token"),
						ViewMode:   apiv1.ViewMode_VIEW_MODE_EDIT,
						BranchName: utils.Pointer("branch"),
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			test.options.DefinitionMetadata = &apiv1.Definition_Metadata{
				Profile: "profile",
			}

			test.options.Api = &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Organization: "org",
				},
			}

			test.options.FetchToken = "token"

			assert.Equal(t, test.expected, constructHandleWorkflowFetchRequest(
				&v2.Plugin{
					Id: "plugin",
				},
				test.options,
				test.isStep,
			))
		})
	}
}

func TestFetchSecretStores(t *testing.T) {
	cfg, err := structpb.NewStruct(map[string]interface{}{
		"provider": map[string]interface{}{
			"mock": map[string]interface{}{
				"data": map[string]interface{}{
					"shhh": "secret",
				},
			},
		},
	})
	assert.NoError(t, err)

	for _, test := range []struct {
		name   string
		mock   *integrationv1.GetIntegrationsResponse
		stores []*secretsv1.Store
	}{
		{
			name: "happy path",
			mock: &integrationv1.GetIntegrationsResponse{
				Data: []*integrationv1.Integration{
					{
						Name:           "name",
						OrganizationId: "org",
						Slug:           "slug",
						Configurations: []*integrationv1.Configuration{
							{
								Id:            "c1",
								Configuration: cfg,
							},
						},
					},
				},
			},
			stores: []*secretsv1.Store{
				{
					ConfigurationId: "c1",
					Metadata: &commonv1.Metadata{
						Name:         "slug",
						Organization: "org",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"shhh": "secret",
								},
							},
						},
					},
				},
			},
		},
		{
			name: "nothing",
			mock: &integrationv1.GetIntegrationsResponse{
				Data: []*integrationv1.Integration{},
			},
			stores: []*secretsv1.Store{},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fetcher := &fetchmocks.Fetcher{}
			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(test.mock, nil)

			stores, err := FetchSecretStores(context.Background(), fetcher, "profile", false, zap.NewNop())
			assert.NoError(t, err)

			for idx, store := range test.stores {
				assert.True(t, proto.Equal(stores[idx], store), "expected %v, got %v", stores[idx], store)
			}
		})
	}
}

func TestGenerateAuditLog(t *testing.T) {
	tests := []struct {
		name         string
		ctx          context.Context
		options      Options
		auditLogId   string
		expectedLogs []zap.Field
	}{
		{
			name: "happy path",
			ctx:  context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)),
			options: Options{
				IsDeployed: true,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "api_id",
						Organization: "org_id",
					},
					Trigger: &apiv1.Trigger{
						Config: &apiv1.Trigger_Application_{Application: &apiv1.Trigger_Application{Id: "app_id"}},
					},
				},
				Requester: "test@sb.com",
				DefinitionMetadata: &apiv1.Definition_Metadata{
					Requester:     "test@sb.com",
					RequesterType: commonv1.UserType_USER_TYPE_EXTERNAL.Enum(),
				},
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", true),
				zap.String("target", "api_id"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("userType", "external"),
				zap.String("source", "test@sb.com"),
				zap.String("applicationId", "app_id"),
				zap.String("entityId", "app_id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
			},
		},
		{
			name: "get user email and user type from context with external user type",
			ctx:  context.WithValue(jwt_validator.WithUserEmail(context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)), "test@sb.com"), jwt_validator.ContextKeyUserType, "external"),
			options: Options{
				IsDeployed: true,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "api_id",
						Organization: "org_id",
					},
					Trigger: &apiv1.Trigger{
						Config: &apiv1.Trigger_Application_{Application: &apiv1.Trigger_Application{Id: "app_id"}},
					},
				},
				DefinitionMetadata: &apiv1.Definition_Metadata{
					RequesterType: commonv1.UserType_USER_TYPE_EXTERNAL.Enum(),
				},
				Requester: "test@sb.com",
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", true),
				zap.String("target", "api_id"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("userType", "external"),
				zap.String("source", "test@sb.com"),
				zap.String("applicationId", "app_id"),
				zap.String("entityId", "app_id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
			},
		},
		{
			name: "no user email or user type provided",
			ctx:  context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)),
			options: Options{
				IsDeployed: true,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "api_id",
						Organization: "org_id",
					},
					Trigger: &apiv1.Trigger{
						Config: &apiv1.Trigger_Application_{Application: &apiv1.Trigger_Application{Id: "app_id"}},
					},
				},
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", true),
				zap.String("target", "api_id"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("applicationId", "app_id"),
				zap.String("entityId", "app_id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actualLogs := generateAuditLog(test.ctx, &test.options)
			// Extract and assert the auditLogId
			var actualAuditLogId string
			var filteredActualLogs []zap.Field
			for _, log := range actualLogs {
				if log.Key == "auditLogId" {
					actualAuditLogId = log.String
				} else {
					filteredActualLogs = append(filteredActualLogs, log)
				}
			}

			fmt.Println("filtered = ", actualLogs)

			// Check if the actualAuditLogId is a valid UUID (simple regex pattern for UUID)
			uuidPattern := regexp.MustCompile(`^[a-fA-F0-9-]{36}$`)
			assert.Regexp(t, uuidPattern, actualAuditLogId)

			// Assert the other fields
			assert.ElementsMatch(t, test.expectedLogs, filteredActualLogs)
		})
	}
}

func TestSingleStepRunApiDefinitionParsing(t *testing.T) {
	t.Run("Should parse profile properly", func(t *testing.T) {

		defJson := `{
			"api": {
				"blocks": [
					{
						"name": "SINGLE_BLOCK_VARIABLES_BLOCK",
						"variables": {
							"items": []
						}
					}
				],
				"metadata": {
					"id": "e2142d1a-b93f-4939-b503-237dffbafd8c",
					"description": "",
					"name": "Cheng's Fabulous Workflow",
					"organization": "71b53980-0a9d-45dc-a4e8-5efd62ebfb1f",
					"folder": "",
					"timestamps": {
						"updated": "2024-03-22T19:38:54.749Z"
					},
					"version": "",
					"tags": {}
				}
			},
			"metadata": {
				"organizationName": "ClosedAI",
				"organizationPlan": "free"
			}
		}`

		var definition apiv1.Definition
		err := jsonpb.UnmarshalString(defJson, &definition)
		if err != nil {
			panic(err)
		}
		logger := zap.NewNop()

		profileName := "profile1"

		def, rawDef, err := Fetch(context.Background(), &apiv1.ExecuteRequest{
			Options: nil,
			Inputs:  map[string]*structpb.Value{},
			Request: &apiv1.ExecuteRequest_Definition{
				Definition: &definition,
			},
			Files: nil,
			Profile: &commonv1.Profile{
				Id:          nil,
				Name:        &profileName,
				Environment: nil,
			},
		}, &fetchmocks.Fetcher{}, false, logger)

		assert.NoError(t, err)
		assert.Equal(t, "profile1", def.GetMetadata().GetProfile())
		assert.Equal(t, "free", def.GetMetadata().GetOrganizationPlan())
		assert.Equal(t, "ClosedAI", def.GetMetadata().GetOrganizationName())

		rawMetadata := rawDef.GetFields()["metadata"].GetStructValue()
		assert.NotNil(t, rawMetadata)
		assert.Equal(t, "profile1", rawMetadata.GetFields()["profile"].GetStringValue())
		assert.Equal(t, "free", rawMetadata.GetFields()["organizationPlan"].GetStringValue())
		assert.Equal(t, "ClosedAI", rawMetadata.GetFields()["organizationName"].GetStringValue())
	})
}

func TestFetch_FetchCodePath(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	t.Run("returns error for empty applicationId", func(t *testing.T) {
		t.Parallel()
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: ""}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		_, _, err := Fetch(context.Background(), req, &fetchmocks.Fetcher{}, false, zap.NewNop())
		require.Error(t, err)
		assert.Contains(t, err.Error(), "applicationId")
	})

	t.Run("propagates FetchApiCode error", func(t *testing.T) {
		t.Parallel()
		commitID := "abc"
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1", CommitId: &commitID}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		fetcher := &fetchmocks.Fetcher{}
		fetchErr := fmt.Errorf("server error")
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "abc", "", false).
			Return(nil, fetchErr)
		_, _, err := Fetch(context.Background(), req, fetcher, false, zap.NewNop())
		require.Error(t, err)
		assert.ErrorIs(t, err, fetchErr)
		fetcher.AssertExpectations(t)
	})

	t.Run("returns error for empty bundle", func(t *testing.T) {
		t.Parallel()
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1"}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		fetcher := &fetchmocks.Fetcher{}
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", false).
			Return(&fetch.ApiCodeBundle{Bundle: ""}, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, zap.NewNop())
		require.Error(t, err)
		assert.Contains(t, err.Error(), "empty bundle")
		fetcher.AssertExpectations(t)
	})

	t.Run("returns def and rawDef with bundle when successful", func(t *testing.T) {
		t.Parallel()
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1"}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		fetcher := &fetchmocks.Fetcher{}
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", false).
			Return(&fetch.ApiCodeBundle{Bundle: "const x = 1;"}, nil)
		def, rawDef, err := Fetch(context.Background(), req, fetcher, false, zap.NewNop())
		require.NoError(t, err)
		assert.Equal(t, "code-mode", def.GetApi().GetMetadata().GetName())
		assert.Equal(t, "app-1", def.GetApi().GetTrigger().GetApplication().GetId())
		require.NotNil(t, rawDef)
		assert.Equal(t, "const x = 1;", rawDef.GetFields()["bundle"].GetStringValue())
		fetcher.AssertExpectations(t)
	})

	t.Run("propagates commitId and branchName to FetchApiCode", func(t *testing.T) {
		t.Parallel()
		commitID := "commit-123"
		branch := "main"
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-2", CommitId: &commitID, BranchName: &branch}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		fetcher := &fetchmocks.Fetcher{}
		fetcher.On("FetchApiCode", mock.Anything, "app-2", "", "commit-123", "main", false).
			Return(&fetch.ApiCodeBundle{Bundle: "code"}, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, zap.NewNop())
		require.NoError(t, err)
		fetcher.AssertExpectations(t)
	})

	t.Run("returns error when FetchApiCode returns nil bundle", func(t *testing.T) {
		t.Parallel()
		fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "app-1"}
		req := &apiv1.ExecuteRequest{
			Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		}
		fetcher := &fetchmocks.Fetcher{}
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", false).
			Return(nil, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, zap.NewNop())
		require.Error(t, err)
		assert.Contains(t, err.Error(), "empty bundle")
		fetcher.AssertExpectations(t)
	})
}

func TestConstructAuth(t *testing.T) {
	for _, test := range []struct {
		name        string
		authField   map[string]any
		expected    *pluginscommon.Auth
		expectedErr string
	}{
		{
			name:      "nil auth field returns nil",
			authField: nil,
			expected:  nil,
		},
		{
			name: "happy path",
			authField: map[string]any{
				"basic": map[string]any{
					"username": "username",
					"password": "password",
				},
			},
			expected: &pluginscommon.Auth{
				Method: &pluginscommon.Auth_Basic{
					Basic: &pluginscommon.Basic{
						Username: "username",
						Password: "password",
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var authFieldStruct *structpb.Value
			if test.authField != nil {
				authFieldStruct, _ = structpb.NewValue(test.authField)
			}

			retAuth, err := ConstructAuth(authFieldStruct)

			assert.True(t, proto.Equal(test.expected, retAuth), "expected %v, got %v", test.expected, retAuth)
			if test.expectedErr == "" {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, test.expectedErr)
			}
		})
	}
}

func TestRenderDatasourceConfig(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer sandbox.Close()

	tests := []struct {
		name           string
		datasource     map[string]any
		expectedOutput map[string]any
	}{
		{
			name:           "empty datasource",
			datasource:     map[string]any{},
			expectedOutput: map[string]any{},
		},
		{
			name: "simple datasource without binding fields",
			datasource: map[string]any{
				"host":     `{{ "localhost" }}`,
				"port":     5432,
				"database": "mydb",
			},
			expectedOutput: map[string]any{
				"host":     "localhost",
				"port":     float64(5432),
				"database": "mydb",
			},
		},
		{
			name: "datasource with empty binding fields",
			datasource: map[string]any{
				"host":          `{{ "localhost" }}`,
				"port":          5432,
				"bindingFields": []any{},
			},
			expectedOutput: map[string]any{
				"host":          "localhost",
				"port":          float64(5432),
				"bindingFields": []any{},
			},
		},
		{
			name: "datasource with no matching binding fields",
			datasource: map[string]any{
				"host": `{{ "localhost" }}`,
				"port": `{{ 5432 }}`,
				"bindingFields": []any{
					"not_a_binding_field",
				},
			},
			expectedOutput: map[string]any{
				"host": "localhost",
				"port": "5432",
				"bindingFields": []any{
					"not_a_binding_field",
				},
			},
		},
		{
			name: "datasource with binding fields",
			datasource: map[string]any{
				"host":     `{{ "local" + "host" }}`,
				"password": `"secrets.db_password"`,
				"bindingFields": []any{
					"password",
				},
			},
			expectedOutput: map[string]any{
				"host":     "localhost",
				"password": "secrets.db_password",
				"bindingFields": []any{
					"password",
				},
			},
		},
		{
			name: "nested datasource with binding fields",
			datasource: map[string]any{
				"connection": map[string]any{
					"host":        "localhost",
					"port":        5432,
					"password":    `"password: ${secrets.db_password}"`,
					"ssl_enabled": true,
				},
				"settings": map[string]any{
					"timeout": `{{ 10 * 3 }}`,
					"apiKey":  `"secrets.api_key"`,
				},
				"bindingFields": []any{
					"connection.password",
					"settings.apiKey",
				},
			},
			expectedOutput: map[string]any{
				"connection": map[string]any{
					"host":        "localhost",
					"port":        float64(5432),
					"password":    "password: ${secrets.db_password}",
					"ssl_enabled": true,
				},
				"settings": map[string]any{
					"timeout": "30",
					"apiKey":  "secrets.api_key",
				},
				"bindingFields": []any{
					"connection.password",
					"settings.apiKey",
				},
			},
		},
		{
			name: "datasource with no templates",
			datasource: map[string]any{
				"host":     "localhost",
				"port":     5432,
				"database": "mydb",
			},
			expectedOutput: map[string]any{
				"host":     "localhost",
				"port":     float64(5432),
				"database": "mydb",
			},
		},
		{
			name: "datasource with arrays and binding fields",
			datasource: map[string]any{
				"servers": []any{
					`"server1.com"`,
					`"server2.com"`,
				},
				"credentials": []any{
					map[string]any{
						"username": `{{ "user1" }}`,
						"password": `{{ "secrets.pass1" }}`,
					},
					map[string]any{
						"username": `{{ "user2" }}`,
						"password": `{{ "secrets.pass2" }}`,
					},
				},
				"bindingFields": []any{
					"servers",
				},
			},
			expectedOutput: map[string]any{
				"servers": []any{
					"server1.com",
					"server2.com",
				},
				"credentials": []any{
					map[string]any{
						"username": "user1",
						"password": "secrets.pass1",
					},
					map[string]any{
						"username": "user2",
						"password": "secrets.pass2",
					},
				},
				"bindingFields": []any{
					"servers",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := apictx.New(&apictx.Context{
				Context: context.Background(),
			})

			// Convert test input to structpb.Value
			datasourceValue, err := structpb.NewValue(tt.datasource)
			require.NoError(t, err)

			// Call renderDatasourceConfig
			result, err := renderDatasourceConfig(ctx, datasourceValue, sandbox, zap.NewNop())

			assert.NoError(t, err)
			assert.NotNil(t, result)

			// Convert result back to map for comparison
			resultMap := result.GetStructValue().AsMap()
			assert.Equal(t, tt.expectedOutput, resultMap)
		})
	}
}

func TestRenderDatasourceConfig_EdgeCases(t *testing.T) {
	t.Parallel()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer sandbox.Close()

	tests := []struct {
		name       string
		datasource *structpb.Value
	}{
		{
			name:       "nil datasource",
			datasource: nil,
		},
		{
			name:       "non-struct datasource",
			datasource: structpb.NewStringValue("not a struct"),
		},
		{
			name:       "number datasource",
			datasource: structpb.NewNumberValue(42),
		},
		{
			name:       "boolean datasource",
			datasource: structpb.NewBoolValue(true),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := apictx.New(&apictx.Context{
				Context: context.Background(),
			})

			result, err := renderDatasourceConfig(ctx, tt.datasource, sandbox, zap.NewNop())

			assert.NoError(t, err)
			assert.Equal(t, tt.datasource, result)
		})
	}
}

func TestFilterParameters(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		parameters *commonv1.HttpParameters
		trigger    *apiv1.Trigger_Workflow
		expected   *commonv1.HttpParameters
	}{
		{
			name: "happy path",
			parameters: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{
					"query1": structpb.NewStringValue("value1"),
					"query2": structpb.NewStringValue("value2"),
				},
				Body: map[string]*structpb.Value{
					"body1": structpb.NewStringValue("value1"),
					"body2": structpb.NewStringValue("value2"),
				},
			},
			trigger: &apiv1.Trigger_Workflow{
				Parameters: &apiv1.Trigger_Workflow_Parameters{
					Query: map[string]*apiv1.Trigger_Workflow_Parameters_QueryParam{
						"query1": {
							Values: []string{"value1"},
						},
					},
					Body: map[string]*structpb.Value{
						"body1": structpb.NewStringValue("value1"),
					},
				},
			},
			expected: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{
					"query1": structpb.NewStringValue("value1"),
				},
				Body: map[string]*structpb.Value{
					"body1": structpb.NewStringValue("value1"),
				},
			},
		},
		{
			name: "no parameters",
			parameters: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{},
				Body:  map[string]*structpb.Value{},
			},
			trigger: &apiv1.Trigger_Workflow{
				Parameters: &apiv1.Trigger_Workflow_Parameters{
					Query: map[string]*apiv1.Trigger_Workflow_Parameters_QueryParam{
						"query1": {
							Values: []string{"value1"},
						},
					},
					Body: map[string]*structpb.Value{
						"body1": structpb.NewStringValue("value1"),
					},
				},
			},
			expected: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{},
				Body:  map[string]*structpb.Value{},
			},
		},
		{
			name: "handles nil trigger parameters",
			parameters: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{
					"query1": structpb.NewStringValue("value1"),
				},
				Body: map[string]*structpb.Value{
					"body1": structpb.NewStringValue("value1"),
				},
			},
			trigger: &apiv1.Trigger_Workflow{
				Parameters: nil,
			},
			expected: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{},
				Body:  map[string]*structpb.Value{},
			},
		},
		{
			name: "handles nil body and query",
			parameters: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{
					"query1": structpb.NewStringValue("value1"),
				},
				Body: map[string]*structpb.Value{
					"body1": structpb.NewStringValue("value1"),
				},
			},
			trigger: &apiv1.Trigger_Workflow{
				Parameters: &apiv1.Trigger_Workflow_Parameters{
					Query: nil,
					Body:  nil,
				},
			},
			expected: &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{},
				Body:  map[string]*structpb.Value{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filterParameters(tt.parameters, tt.trigger)
			testutils.ProtoEquals(t, tt.expected, tt.parameters)
		})
	}
}

func TestViewModeEnumToString(t *testing.T) {
	tests := []struct {
		name     string
		viewMode apiv1.ViewMode
		expected string
	}{
		{
			name:     "edit mode",
			viewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
			expected: "editor",
		},
		{
			name:     "preview mode",
			viewMode: apiv1.ViewMode_VIEW_MODE_PREVIEW,
			expected: "preview",
		},
		{
			name:     "deployed mode",
			viewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
			expected: "deployed",
		},
		{
			name:     "unspecified mode",
			viewMode: apiv1.ViewMode_VIEW_MODE_UNSPECIFIED,
			expected: "",
		},
		{
			name:     "invalid mode",
			viewMode: apiv1.ViewMode(999),
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := viewModeEnumToString(tt.viewMode)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFetchDefinitionFromRequestWithValidation(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		request        *apiv1.ExecuteRequest
		mockValidation func(*fetchmocks.Fetcher)
		expectError    bool
		errorContains  string
	}{
		{
			name: "inline definition with profile validation success",
			request: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
					Id:   utils.Pointer("profile-id"),
				},
				Request: &apiv1.ExecuteRequest_Definition{
					Definition: &apiv1.Definition{
						Api: &apiv1.Api{
							Metadata: &commonv1.Metadata{
								Id:   "api-id",
								Name: "Test API",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "Step1",
									Config: &apiv1.Block_Step{
										Step: &apiv1.Step{
											Integration: "integration-1",
										},
									},
								},
							},
						},
						Integrations: map[string]*structpb.Struct{
							"integration-1": func() *structpb.Struct {
								s, _ := structpb.NewStruct(map[string]interface{}{
									"id": "integration-1",
								})
								return s
							}(),
						},
					},
				},
			},
			mockValidation: func(f *fetchmocks.Fetcher) {
				f.On("ValidateProfile", mock.Anything, mock.MatchedBy(func(req *integrationv1.ValidateProfileRequest) bool {
					return req.ViewMode == "editor" &&
						req.Profile.GetName() == "production" &&
						len(req.IntegrationIds) == 1 &&
						req.IntegrationIds[0] == "integration-1"
				})).Return(nil)
			},
			expectError: false,
		},
		{
			name: "inline definition with profile validation failure",
			request: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
				},
				Request: &apiv1.ExecuteRequest_Definition{
					Definition: &apiv1.Definition{
						Api: &apiv1.Api{
							Metadata: &commonv1.Metadata{
								Id:   "api-id",
								Name: "Test API",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "Step1",
									Config: &apiv1.Block_Step{
										Step: &apiv1.Step{
											Integration: "integration-1",
										},
									},
								},
							},
						},
						Integrations: map[string]*structpb.Struct{},
					},
				},
			},
			mockValidation: func(f *fetchmocks.Fetcher) {
				f.On("ValidateProfile", mock.Anything, mock.Anything).Return(sberrors.ErrAuthorization)
			},
			expectError:   true,
			errorContains: "Authorization",
		},
		{
			name: "inline definition without profile - no validation",
			request: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
				Request: &apiv1.ExecuteRequest_Definition{
					Definition: &apiv1.Definition{
						Api: &apiv1.Api{
							Metadata: &commonv1.Metadata{
								Id:   "api-id",
								Name: "Test API",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "Step1",
									Config: &apiv1.Block_Step{
										Step: &apiv1.Step{
											Integration: "integration-1",
										},
									},
								},
							},
						},
						Integrations: map[string]*structpb.Struct{
							"integration-1": func() *structpb.Struct {
								s, _ := structpb.NewStruct(map[string]interface{}{
									"id": "integration-1",
								})
								return s
							}(),
						},
					},
				},
			},
			mockValidation: func(f *fetchmocks.Fetcher) {
				// Should not be called
			},
			expectError: false,
		},
		{
			name: "inline definition with unspecified view mode - no validation",
			request: &apiv1.ExecuteRequest{
				ViewMode: apiv1.ViewMode_VIEW_MODE_UNSPECIFIED,
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
				},
				Request: &apiv1.ExecuteRequest_Definition{
					Definition: &apiv1.Definition{
						Api: &apiv1.Api{
							Metadata: &commonv1.Metadata{
								Id:   "api-id",
								Name: "Test API",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "Step1",
									Config: &apiv1.Block_Step{
										Step: &apiv1.Step{
											Integration: "integration-1",
										},
									},
								},
							},
						},
						Integrations: map[string]*structpb.Struct{
							"integration-1": func() *structpb.Struct {
								s, _ := structpb.NewStruct(map[string]interface{}{
									"id": "integration-1",
								})
								return s
							}(),
						},
					},
				},
			},
			mockValidation: func(f *fetchmocks.Fetcher) {
				// Should not be called
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockFetcher := fetchmocks.NewFetcher(t)
			if tt.mockValidation != nil {
				tt.mockValidation(mockFetcher)
			}

			_, _, err := fetchDefinitionFromRequest(
				context.Background(),
				tt.request,
				mockFetcher,
				false,
				zap.NewNop(),
			)

			if tt.expectError {
				require.Error(t, err)
				if tt.errorContains != "" {
					assert.Contains(t, err.Error(), tt.errorContains)
				}
			} else {
				require.NoError(t, err)
			}

			mockFetcher.AssertExpectations(t)
		})
	}
}

func TestFindParametersExpression(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		action         map[string]any
		expectedExpr   string
		expectedNested bool
	}{
		{
			name:           "no parameters field",
			action:         map[string]any{"body": "SELECT * FROM users"},
			expectedExpr:   "",
			expectedNested: false,
		},
		{
			name:           "flat parameters (postgres style)",
			action:         map[string]any{"body": "SELECT * FROM users WHERE id = $1", "parameters": "[userId]"},
			expectedExpr:   "[userId]",
			expectedNested: false,
		},
		{
			name: "nested parameters (databricks style)",
			action: map[string]any{
				"runSql": map[string]any{
					"sqlBody":    "SELECT * FROM users WHERE id = :param_1",
					"parameters": "[userId]",
				},
			},
			expectedExpr:   "[userId]",
			expectedNested: true,
		},
		{
			name:           "empty parameters string",
			action:         map[string]any{"parameters": ""},
			expectedExpr:   "",
			expectedNested: false,
		},
		{
			name: "flat takes precedence over nested",
			action: map[string]any{
				"parameters": "[flatParam]",
				"runSql": map[string]any{
					"parameters": "[nestedParam]",
				},
			},
			expectedExpr:   "[flatParam]",
			expectedNested: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actionStruct, err := structpb.NewStruct(tt.action)
			require.NoError(t, err)

			expr, nestedStruct := findParametersExpression(actionStruct)

			assert.Equal(t, tt.expectedExpr, expr)
			if tt.expectedNested {
				assert.NotNil(t, nestedStruct, "expected nested struct to be returned")
			} else {
				assert.Nil(t, nestedStruct, "expected nested struct to be nil")
			}
		})
	}
}

func TestHasParametersField(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		action   map[string]any
		expected bool
	}{
		{
			name:     "no parameters",
			action:   map[string]any{"body": "SELECT 1"},
			expected: false,
		},
		{
			name:     "flat parameters",
			action:   map[string]any{"parameters": "[1, 2, 3]"},
			expected: true,
		},
		{
			name:     "nested parameters",
			action:   map[string]any{"runSql": map[string]any{"parameters": "[1]"}},
			expected: true,
		},
		{
			name:     "empty parameters",
			action:   map[string]any{"parameters": ""},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actionStruct, err := structpb.NewStruct(tt.action)
			require.NoError(t, err)

			result := hasParametersField(actionStruct)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestEvaluateParameters(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer sandbox.Close()

	tests := []struct {
		name           string
		action         map[string]any
		expectedParams []any
		expectedError  string
		checkNested    bool // if true, verify parameters removed from nested runSql
	}{
		{
			name:           "flat parameters with literals",
			action:         map[string]any{"body": "SELECT * FROM users WHERE id = $1", "parameters": "[1, 'hello', true]"},
			expectedParams: []any{float64(1), "hello", true},
		},
		{
			name:           "spread operator in expression",
			action:         map[string]any{"parameters": "[...[1, 2], 3]"},
			expectedParams: []any{float64(1), float64(2), float64(3)},
		},
		{
			name: "nested parameters (databricks style)",
			action: map[string]any{
				"runSql": map[string]any{
					"sqlBody":    "SELECT * FROM users WHERE id = :param_1",
					"parameters": "[123]",
				},
			},
			expectedParams: []any{float64(123)},
			checkNested:    true,
		},
		{
			name:           "preserves number types",
			action:         map[string]any{"parameters": "[99.99, 42, -10]"},
			expectedParams: []any{99.99, float64(42), float64(-10)},
		},
		{
			name:           "preserves boolean types",
			action:         map[string]any{"parameters": "[true, false]"},
			expectedParams: []any{true, false},
		},
		{
			name:           "preserves null",
			action:         map[string]any{"parameters": "[null, 'test']"},
			expectedParams: []any{nil, "test"},
		},
		{
			name:           "array parameter",
			action:         map[string]any{"parameters": "[[1, 2, 3]]"},
			expectedParams: []any{[]any{float64(1), float64(2), float64(3)}},
		},
		{
			name:           "object parameter",
			action:         map[string]any{"parameters": "[{\"name\": \"test\"}]"},
			expectedParams: []any{map[string]any{"name": "test"}},
		},
		{
			name:          "non-array result errors",
			action:        map[string]any{"parameters": "\"not an array\""},
			expectedError: "parameters must evaluate to an array",
		},
		{
			name:          "undefined variable errors",
			action:        map[string]any{"parameters": "[undefined_var]"},
			expectedError: "parameters expression failed",
		},
		{
			name:           "no parameters field - no-op",
			action:         map[string]any{"body": "SELECT 1"},
			expectedParams: nil,
		},
		{
			name:           "empty parameters string - no-op",
			action:         map[string]any{"parameters": ""},
			expectedParams: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actionStruct, err := structpb.NewStruct(tt.action)
			require.NoError(t, err)

			ctx := apictx.New(&apictx.Context{
				Context: context.Background(),
			})

			err = evaluateParameters(ctx, sandbox, actionStruct, zap.NewNop())

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				return
			}

			require.NoError(t, err)

			if tt.expectedParams == nil {
				// No parameters expected - verify preparedStatementContext not set
				assert.Nil(t, actionStruct.Fields["preparedStatementContext"])
				return
			}

			// Verify preparedStatementContext was set
			psc := actionStruct.Fields["preparedStatementContext"]
			require.NotNil(t, psc, "preparedStatementContext should be set")

			listValue := psc.GetListValue()
			require.NotNil(t, listValue, "preparedStatementContext should be a list")

			// Convert to []any for comparison
			var actualParams []any
			for _, v := range listValue.Values {
				actualParams = append(actualParams, v.AsInterface())
			}

			assert.Equal(t, tt.expectedParams, actualParams)

			// Verify parameters field was removed
			if tt.checkNested {
				runSql := actionStruct.Fields["runSql"].GetStructValue()
				assert.Nil(t, runSql.Fields["parameters"], "nested parameters should be removed")
			} else if tt.action["parameters"] != nil && tt.action["parameters"] != "" {
				assert.Nil(t, actionStruct.Fields["parameters"], "flat parameters should be removed")
			}
		})
	}
}
