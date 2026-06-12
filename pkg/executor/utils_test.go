package executor

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/golang/protobuf/jsonpb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/auth"
	authmocks "github.com/superblocksteam/agent/internal/auth/mocks"
	authtypes "github.com/superblocksteam/agent/internal/auth/types"
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
	secretspkg "github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/testutils"
	"github.com/superblocksteam/agent/pkg/utils"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	postgresv1 "github.com/superblocksteam/agent/types/gen/go/plugins/postgresql/v1"
	workflowv1pkg "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v1"
	v2 "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v2"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	storev1 "github.com/superblocksteam/agent/types/gen/go/store/v1"
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

func TestShouldSkipDefinitionSecretInjection(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name             string
		appEngineVersion string
		expected         bool
	}{
		{
			name:     "no app engine version",
			expected: false,
		},
		{
			name:             "legacy app engine version",
			appEngineVersion: legacyAppEngineVersion,
			expected:         false,
		},
		{
			name:             "non legacy app engine version",
			appEngineVersion: "2.0",
			expected:         true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			if test.appEngineVersion != "" {
				ctx = jwt_validator.WithAppEngineVersion(ctx, test.appEngineVersion)
			}

			assert.Equal(t, test.expected, shouldSkipDefinitionSecretInjection(ctx))
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

func TestHandleWorkflowUsesSeparateServerFetchAgentKeyFlag(t *testing.T) {
	t.Parallel()

	fetchErr := errors.New("stop after fetch")
	fetcher := fetchmocks.NewFetcher(t)
	fetcher.On(
		"FetchApi",
		mock.Anything,
		mock.MatchedBy(func(req *apiv1.ExecuteRequest_Fetch) bool {
			return req.GetId() == "workflow-id"
		}),
		false,
	).Return((*apiv1.Definition)(nil), (*structpb.Struct)(nil), fetchErr).Once()

	flags := mocks.NewFlags(t)
	flags.On("GetWorkflowPluginInheritanceEnabled", "org-id").Return(false).Once()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{Logger: zap.NewNop()})
	defer sandbox.Close()

	_, _, _, err := HandleWorkflow(
		apictx.New(&apictx.Context{Context: context.Background()}),
		sandbox,
		&workflowv1pkg.Plugin{Workflow: "workflow-id"},
		func(def *apiv1.Definition) string {
			return def.GetApi().GetMetadata().GetName()
		},
		mustache.Instance,
		true,
		&Options{
			Api: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Organization: "org-id",
				},
			},
			DefinitionMetadata: &apiv1.Definition_Metadata{
				Profile: "production",
			},
			Fetcher:                   fetcher,
			Flags:                     flags,
			Logger:                    zap.NewNop(),
			UseAgentKey:               true,
			UseAgentKeyForServerFetch: false,
		},
	)
	require.ErrorIs(t, err, fetchErr)
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

func TestFetchDefinitionFromRequestSkipsSecretStoresForNonLegacyAppEngine(t *testing.T) {
	t.Parallel()

	profileName := "production"
	makeRequest := func() *apiv1.ExecuteRequest {
		return &apiv1.ExecuteRequest{
			Profile: &commonv1.Profile{
				Name: &profileName,
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
										Config: &apiv1.Step_Javascript{
											Javascript: &javascriptv1.Plugin{
												Body: "return sb_secrets;",
											},
										},
									},
								},
							},
						},
					},
					Integrations: map[string]*structpb.Struct{},
				},
			},
		}
	}

	for _, test := range []struct {
		name             string
		appEngineVersion string
		integrations     map[string]*structpb.Struct
		sdkIntegration   bool
		verifiedJwt      bool
		appScopedJwt     bool
		expectStores     bool
	}{
		{
			name:         "missing app engine version preserves legacy secret stores",
			expectStores: true,
		},
		{
			name:             "legacy app engine version preserves secret stores",
			appEngineVersion: "1.0",
			expectStores:     true,
		},
		{
			name:             "scoped app engine version skips secret stores",
			appEngineVersion: "2.0",
		},
		{
			name:             "signed SDK integration execution with scoped app engine version fetches secret stores",
			appEngineVersion: "2.0",
			sdkIntegration:   true,
			expectStores:     true,
		},
		{
			name:             "unknown app engine version skips secret stores",
			appEngineVersion: "3.0",
		},
		{
			// Caller-supplied inline integration configs are wiped before the
			// secret-store decision on scoped executions, so a smuggled
			// {{sb_secrets...}} datasource binding cannot trigger a store fetch.
			name:             "scoped execution ignores caller inline secret integration",
			appEngineVersion: "2.0",
			integrations: map[string]*structpb.Struct{
				"integration-id": {
					Fields: map[string]*structpb.Value{
						"headers": structpb.NewListValue(&structpb.ListValue{
							Values: []*structpb.Value{
								structpb.NewStructValue(&structpb.Struct{
									Fields: map[string]*structpb.Value{
										"key":   structpb.NewStringValue("x-secret"),
										"value": structpb.NewStringValue("{{sb_secrets.mock_store.shhh}}"),
									},
								}),
							},
						}),
					},
				},
			},
			expectStores: false,
		},
		{
			// Org-only JWTs are not tied to a specific application, so they keep
			// legacy inline secret-store behavior and caller-supplied integration
			// configs are not wiped.
			name:        "org-scoped jwt without app engine version preserves legacy secret stores",
			verifiedJwt: true,
			integrations: map[string]*structpb.Struct{
				"integration-id": {
					Fields: map[string]*structpb.Value{
						"headers": structpb.NewListValue(&structpb.ListValue{
							Values: []*structpb.Value{
								structpb.NewStructValue(&structpb.Struct{
									Fields: map[string]*structpb.Value{
										"key":   structpb.NewStringValue("x-secret"),
										"value": structpb.NewStringValue("{{sb_secrets.mock_store.shhh}}"),
									},
								}),
							},
						}),
					},
				},
			},
			expectStores: true,
		},
		{
			// An app-scoped JWT without an app engine version claim is a trusted
			// datasource-secret renderer (see shouldRenderDatasourceSecrets), so
			// caller-supplied inline integration configs are wiped just like
			// scoped executions. A smuggled {{sb_secrets...}} datasource binding
			// must not be able to trigger a secret-store fetch.
			name:         "app-scoped jwt without app engine version ignores caller inline secret integration",
			verifiedJwt:  true,
			appScopedJwt: true,
			integrations: map[string]*structpb.Struct{
				"integration-id": {
					Fields: map[string]*structpb.Value{
						"headers": structpb.NewListValue(&structpb.ListValue{
							Values: []*structpb.Value{
								structpb.NewStructValue(&structpb.Struct{
									Fields: map[string]*structpb.Value{
										"key":   structpb.NewStringValue("x-secret"),
										"value": structpb.NewStringValue("{{sb_secrets.mock_store.shhh}}"),
									},
								}),
							},
						}),
					},
				},
			},
			expectStores: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			if test.appEngineVersion != "" {
				ctx = jwt_validator.WithAppEngineVersion(ctx, test.appEngineVersion)
			}
			if test.sdkIntegration {
				ctx = constants.WithSDKIntegrationExecution(ctx, nil)
			}
			if test.verifiedJwt {
				ctx = constants.WithRequestUsesJwtAuth(ctx, true)
				ctx = jwt_validator.WithOrganizationID(ctx, "org-id")
			}
			if test.appScopedJwt {
				ctx = jwt_validator.WithApplicationID(ctx, "app-id")
			}

			fetcher := fetchmocks.NewFetcher(t)
			if test.expectStores {
				fetcher.On(
					"FetchIntegrations",
					mock.Anything,
					mock.MatchedBy(func(req *integrationv1.GetIntegrationsRequest) bool {
						return req.GetProfile().GetName() == profileName && req.GetKind() == integrationv1.Kind_KIND_SECRET
					}),
					false,
				).Return(&integrationv1.GetIntegrationsResponse{
					Data: []*integrationv1.Integration{},
				}, nil)
			}

			request := makeRequest()
			if test.integrations != nil {
				request.GetDefinition().Integrations = test.integrations
			}

			def, _, err := fetchDefinitionFromRequest(ctx, request, fetcher, false, zap.NewNop())
			require.NoError(t, err)

			if test.expectStores {
				require.NotNil(t, def.GetStores())
				assert.NotNil(t, def.GetStores().GetSecrets())
			} else {
				assert.Nil(t, def.GetStores())
			}
		})
	}
}

func TestFetchDefinitionFromRequestWipesCallerInlineIntegrationsForScopedExecution(t *testing.T) {
	t.Parallel()

	profileName := "production"
	makeRequest := func() *apiv1.ExecuteRequest {
		return &apiv1.ExecuteRequest{
			Profile: &commonv1.Profile{
				Name: &profileName,
			},
			Options: &apiv1.ExecuteRequest_Options{
				IsAiTriggered: true,
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
										Config: &apiv1.Step_Javascript{
											Javascript: &javascriptv1.Plugin{
												Body: "return 1;",
											},
										},
									},
								},
							},
						},
					},
					Integrations: map[string]*structpb.Struct{
						"attacker-integration": {
							Fields: map[string]*structpb.Value{
								"headers": structpb.NewListValue(&structpb.ListValue{
									Values: []*structpb.Value{
										structpb.NewStructValue(&structpb.Struct{
											Fields: map[string]*structpb.Value{
												"key":   structpb.NewStringValue("x-exfil"),
												"value": structpb.NewStringValue("{{sb_secrets.mock_store.shhh}}"),
											},
										}),
									},
								}),
							},
						},
					},
				},
			},
		}
	}

	ctx := constants.WithAITriggeredExecution(
		jwt_validator.WithAppEngineVersion(context.Background(), "2.0"),
	)

	fetcher := fetchmocks.NewFetcher(t)
	fetcher.On(
		"FetchIntegrations",
		mock.Anything,
		mock.MatchedBy(func(req *integrationv1.GetIntegrationsRequest) bool {
			return req.GetKind() == integrationv1.Kind_KIND_SECRET
		}),
		false,
	).Return(&integrationv1.GetIntegrationsResponse{
		Data: []*integrationv1.Integration{},
	}, nil).Maybe()

	def, _, err := fetchDefinitionFromRequest(ctx, makeRequest(), fetcher, false, zap.NewNop())
	require.NoError(t, err)

	assert.NotContains(t, def.GetIntegrations(), "attacker-integration")

	contains, err := utils.ContainsSuperblocksSecrets(def.GetApi(), def.GetIntegrations())
	require.NoError(t, err)
	assert.False(t, contains)
}

func TestFetchDefinitionFromRequestWipesCallerInlineIntegrationsForAppScopedJwtWithoutAppEngineVersion(t *testing.T) {
	t.Parallel()

	profileName := "production"
	makeRequest := func() *apiv1.ExecuteRequest {
		return &apiv1.ExecuteRequest{
			Profile: &commonv1.Profile{
				Name: &profileName,
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
										Config: &apiv1.Step_Javascript{
											Javascript: &javascriptv1.Plugin{
												Body: "return 1;",
											},
										},
									},
								},
							},
						},
					},
					Integrations: map[string]*structpb.Struct{
						"attacker-integration": {
							Fields: map[string]*structpb.Value{
								"headers": structpb.NewListValue(&structpb.ListValue{
									Values: []*structpb.Value{
										structpb.NewStructValue(&structpb.Struct{
											Fields: map[string]*structpb.Value{
												"key":   structpb.NewStringValue("x-exfil"),
												"value": structpb.NewStringValue("{{sb_secrets.mock_store.shhh}}"),
											},
										}),
									},
								}),
							},
						},
					},
				},
			},
		}
	}

	// An app-scoped Superblocks JWT request with no app_engine_version claim is
	// authorized to render datasource secrets, so it must receive the same
	// inline-integration wiping as a scoped execution. Otherwise a hand-crafted
	// inline integration carrying a {{sb_secrets...}} binding would survive into
	// datasource evaluation and exfiltrate the org secret store.
	ctx := jwt_validator.WithApplicationID(
		jwt_validator.WithOrganizationID(
			constants.WithRequestUsesJwtAuth(context.Background(), true),
			"org-id",
		),
		"app-id",
	)

	fetcher := fetchmocks.NewFetcher(t)
	fetcher.On(
		"FetchIntegrations",
		mock.Anything,
		mock.MatchedBy(func(req *integrationv1.GetIntegrationsRequest) bool {
			return req.GetKind() == integrationv1.Kind_KIND_SECRET
		}),
		false,
	).Return(&integrationv1.GetIntegrationsResponse{
		Data: []*integrationv1.Integration{},
	}, nil).Maybe()

	def, _, err := fetchDefinitionFromRequest(ctx, makeRequest(), fetcher, false, zap.NewNop())
	require.NoError(t, err)

	assert.NotContains(t, def.GetIntegrations(), "attacker-integration")

	contains, err := utils.ContainsSuperblocksSecrets(def.GetApi(), def.GetIntegrations())
	require.NoError(t, err)
	assert.False(t, contains)
}

func TestFetchDefinitionFromRequestPreservesCallerInlineIntegrationsForOrgJwtWithoutAppEngineVersion(t *testing.T) {
	t.Parallel()

	profileName := "production"
	makeRequest := func() *apiv1.ExecuteRequest {
		return &apiv1.ExecuteRequest{
			Profile: &commonv1.Profile{
				Name: &profileName,
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
										Integration: "postgres",
										Config: &apiv1.Step_Postgres{
											Postgres: &postgresv1.Plugin{
												Body: "SELECT 1;",
											},
										},
									},
								},
							},
						},
					},
					Integrations: map[string]*structpb.Struct{
						"postgres": {
							Fields: map[string]*structpb.Value{
								"id": structpb.NewStringValue("postgres-config"),
							},
						},
					},
				},
			},
		}
	}

	// Org-only JWTs without app_engine_version are used by existing E2E and
	// legacy inline execute paths. They are not authorized datasource-secret
	// renderers, so caller-supplied inline integration configs remain in place
	// and should not be refetched from the server.
	ctx := jwt_validator.WithOrganizationID(
		constants.WithRequestUsesJwtAuth(context.Background(), true),
		"org-id",
	)

	fetcher := fetchmocks.NewFetcher(t)

	def, _, err := fetchDefinitionFromRequest(ctx, makeRequest(), fetcher, false, zap.NewNop())
	require.NoError(t, err)

	assert.Contains(t, def.GetIntegrations(), "postgres")
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
		{
			name: "integration query audit tags route to integration event fields",
			ctx:  context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)),
			options: Options{
				IsDeployed: false,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "sdk-query-int-1",
						Organization: "org_id",
						Tags: map[string]string{
							"audit.event_type":     "integration_query",
							"audit.integration_id": "int-1",
							"audit.plugin_type":    "postgres",
						},
					},
				},
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", false),
				zap.String("target", "sdk-query-int-1"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("type", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_INTEGRATION_QUERY.String()),
				zap.String("entityId", "int-1"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_STEP.String()),
				zap.String("integrationId", "int-1"),
				zap.String("pluginType", "postgres"),
				zap.Int64("integrationQueryStart", int64(123456)),
				zap.String("source", "SDK API"),
			},
		},
		{
			name: "integration query sdk target routes without metadata tags",
			ctx:  context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)),
			options: Options{
				IsDeployed: false,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "sdk-query-int-2",
						Organization: "org_id",
					},
					Blocks: []*apiv1.Block{
						{
							Name: "query",
							Config: &apiv1.Block_Step{
								Step: &apiv1.Step{
									Integration: "int-2",
									Config:      &apiv1.Step_Postgres{},
								},
							},
						},
					},
				},
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", false),
				zap.String("target", "sdk-query-int-2"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("type", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_INTEGRATION_QUERY.String()),
				zap.String("entityId", "int-2"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_STEP.String()),
				zap.String("integrationId", "int-2"),
				zap.String("pluginType", "postgres"),
				zap.Int64("integrationQueryStart", int64(123456)),
				zap.String("source", "SDK API"),
			},
		},
		{
			name: "integration query sdk target infers canonical oneof plugin name",
			ctx:  context.WithValue(context.Background(), constants.ContextKeyApiStartTime, int64(123456)),
			options: Options{
				IsDeployed: false,
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "sdk-query-int-3",
						Organization: "org_id",
					},
					Blocks: []*apiv1.Block{
						{
							Name: "query",
							Config: &apiv1.Block_Step{
								Step: &apiv1.Step{
									Integration: "int-3",
									Config:      &apiv1.Step_OpenaiV2{},
								},
							},
						},
					},
				},
			},
			auditLogId: "log_id_1",
			expectedLogs: []zap.Field{
				zap.Bool("isDeployed", false),
				zap.String("target", "sdk-query-int-3"),
				zap.String("organizationId", "org_id"),
				zap.Int64("start", int64(123456)),
				zap.String("type", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_INTEGRATION_QUERY.String()),
				zap.String("entityId", "int-3"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_STEP.String()),
				zap.String("integrationId", "int-3"),
				zap.String("pluginType", "openai_v2"),
				zap.Int64("integrationQueryStart", int64(123456)),
				zap.String("source", "SDK API"),
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
		}, &fetchmocks.Fetcher{}, false, false, logger)

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

func TestFetchUsesSeparateAgentKeyForServerAndDefinitionHydration(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	fetchOptions := &apiv1.ExecuteRequest_Fetch{Id: "api-id"}
	req := &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_Fetch_{Fetch: fetchOptions},
	}
	def := &apiv1.Definition{
		Api: &apiv1.Api{
			Metadata: &commonv1.Metadata{
				Id:           "00000000-0000-0000-0000-000000000001",
				Organization: "00000000-0000-0000-0000-000000000002",
				Name:         "Test API",
			},
		},
	}

	mockFetcher := fetchmocks.NewFetcher(t)
	mockFetcher.On("FetchApi", mock.Anything, fetchOptions, false).Return(def, &structpb.Struct{}, nil)

	_, _, err := Fetch(context.Background(), req, mockFetcher, false, true, zap.NewNop())
	require.NoError(t, err)
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
		_, _, err := Fetch(context.Background(), req, &fetchmocks.Fetcher{}, false, false, zap.NewNop())
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
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "abc", "", false).
			Return(nil, fetchErr)
		_, _, err := Fetch(context.Background(), req, fetcher, false, false, zap.NewNop())
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
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", "", false).
			Return(&fetch.ApiCodeBundle{Bundle: ""}, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, false, zap.NewNop())
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
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", "", false).
			Return(&fetch.ApiCodeBundle{Bundle: "const x = 1;"}, nil)
		def, rawDef, err := Fetch(context.Background(), req, fetcher, false, false, zap.NewNop())
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
		fetcher.On("FetchApiCode", mock.Anything, "app-2", "", "", "commit-123", "main", false).
			Return(&fetch.ApiCodeBundle{Bundle: "code"}, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, false, zap.NewNop())
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
		fetcher.On("FetchApiCode", mock.Anything, "app-1", "", "", "", "", false).
			Return(nil, nil)
		_, _, err := Fetch(context.Background(), req, fetcher, false, false, zap.NewNop())
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

func TestEvaluateDatasourceAllowsSDKIntegrationDatasourceSecrets(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	memoryStore := store.Memory()
	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
		Store:  memoryStore,
	})
	defer sandbox.Close()

	makeDatasource := func(t *testing.T) *structpb.Value {
		t.Helper()

		datasource, err := structpb.NewValue(map[string]any{
			"id": "configuration-id",
			"headers": []any{
				map[string]any{
					"key":   "x-secret",
					"value": "{{sb_secrets.mock_store.shhh}}",
				},
			},
		})
		require.NoError(t, err)

		return datasource
	}

	makeOptions := func(t *testing.T) *Options {
		t.Helper()

		tokenManager := authmocks.NewTokenManager(t)
		tokenManager.On(
			"AddTokenIfNeeded",
			mock.Anything,
			mock.Anything,
			mock.Anything,
			mock.Anything,
			"integration-id",
			"configuration-id",
			"restapi",
		).Return(authtypes.TokenPayload{}, nil)

		return &Options{
			Api: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Organization: "org-id",
				},
			},
			Logger:       zap.NewNop(),
			Secrets:      secretspkg.Manager(),
			Store:        memoryStore,
			TokenManager: tokenManager,
			Stores: &storev1.Stores{
				Secrets: []*secretsv1.Store{
					{
						Metadata: &commonv1.Metadata{
							Name: "mock_store",
						},
						Provider: &secretsv1.Provider{
							Config: &secretsv1.Provider_Mock{
								Mock: &secretsv1.MockStore{
									Data: map[string]string{
										"shhh": "this is a secret",
									},
								},
							},
						},
					},
				},
			},
		}
	}

	t.Run("signed SDK integration callback renders datasource secrets", func(t *testing.T) {
		ctx := apictx.New(&apictx.Context{
			Context: constants.WithSDKIntegrationExecution(constants.WithOrganizationID(context.Background(), "org-id"), nil),
		})
		datasource := makeDatasource(t)

		rendered, redacted, err := EvaluateDatasource(
			ctx,
			sandbox,
			datasource,
			proto.Clone(datasource).(*structpb.Value),
			"integration-id",
			"",
			"restapi",
			gc.New(&gc.Options{Store: memoryStore}),
			makeOptions(t),
		)
		require.NoError(t, err)

		header := rendered.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "this is a secret", header.GetFields()["value"].GetStringValue())

		redactedHeader := redacted.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "<redacted>", redactedHeader.GetFields()["value"].GetStringValue())

		_, ok := ctx.Variables.Get("sb_secrets")
		assert.False(t, ok, "datasource secrets should not be added to the caller action context")
	})

	t.Run("scoped app engine version renders datasource secrets", func(t *testing.T) {
		ctx := apictx.New(&apictx.Context{
			Context: jwt_validator.WithAppEngineVersion(constants.WithOrganizationID(context.Background(), "org-id"), "2.0"),
		})
		datasource := makeDatasource(t)

		rendered, redacted, err := EvaluateDatasource(
			ctx,
			sandbox,
			datasource,
			proto.Clone(datasource).(*structpb.Value),
			"integration-id",
			"",
			"restapi",
			gc.New(&gc.Options{Store: memoryStore}),
			makeOptions(t),
		)
		require.NoError(t, err)

		header := rendered.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "this is a secret", header.GetFields()["value"].GetStringValue())

		redactedHeader := redacted.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "<redacted>", redactedHeader.GetFields()["value"].GetStringValue())

		_, ok := ctx.Variables.Get("sb_secrets")
		assert.False(t, ok, "datasource secrets should not be added to the caller action context")
	})

	t.Run("verified jwt without stores renders datasource without secret lookups", func(t *testing.T) {
		ctx := apictx.New(&apictx.Context{
			Context: constants.WithRequestUsesJwtAuth(constants.WithOrganizationID(context.Background(), "org-id"), true),
		})
		datasource, err := structpb.NewValue(map[string]any{
			"id": "configuration-id",
			"headers": []any{
				map[string]any{
					"key":   "x-plain",
					"value": "plain",
				},
			},
		})
		require.NoError(t, err)
		options := makeOptions(t)
		options.Stores = nil

		rendered, redacted, err := EvaluateDatasource(
			ctx,
			sandbox,
			datasource,
			proto.Clone(datasource).(*structpb.Value),
			"integration-id",
			"",
			"restapi",
			gc.New(&gc.Options{Store: memoryStore}),
			options,
		)
		require.NoError(t, err)

		header := rendered.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "plain", header.GetFields()["value"].GetStringValue())

		redactedHeader := redacted.GetStructValue().GetFields()["headers"].GetListValue().GetValues()[0].GetStructValue()
		assert.Equal(t, "plain", redactedHeader.GetFields()["value"].GetStringValue())
	})

	t.Run("spoofable AI-triggered flag alone cannot render datasource secrets", func(t *testing.T) {
		ctx := apictx.New(&apictx.Context{
			Context: constants.WithAITriggeredExecution(constants.WithOrganizationID(context.Background(), "org-id")),
		})
		datasource := makeDatasource(t)

		_, _, err := EvaluateDatasource(
			ctx,
			sandbox,
			datasource,
			proto.Clone(datasource).(*structpb.Value),
			"integration-id",
			"",
			"restapi",
			gc.New(&gc.Options{Store: memoryStore}),
			makeOptions(t),
		)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "sb_secrets")
	})
}

func TestWithDatasourceSecretsSkipsWhenNotApplicable(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name       string
		ctx        context.Context
		datasource *structpb.Value
	}{
		{
			name:       "ordinary execution",
			ctx:        context.Background(),
			datasource: structpb.NewStructValue(&structpb.Struct{}),
		},
		{
			name:       "sdk execution with non object datasource",
			ctx:        constants.WithSDKIntegrationExecution(context.Background(), nil),
			datasource: structpb.NewStringValue("not-an-object"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			ctx := apictx.New(&apictx.Context{Context: test.ctx})
			redactedCtx := apictx.New(&apictx.Context{Context: test.ctx})

			gotCtx, gotRedactedCtx, err := withDatasourceSecrets(ctx, redactedCtx, test.datasource, nil, nil, &Options{})
			require.NoError(t, err)
			assert.Same(t, ctx, gotCtx)
			assert.Same(t, redactedCtx, gotRedactedCtx)
		})
	}
}

func TestRedactSecretValue(t *testing.T) {
	t.Parallel()

	assert.Nil(t, redactSecretValue(nil))

	number := structpb.NewNumberValue(42)
	assert.True(t, proto.Equal(number, redactSecretValue(number)))

	secret := structpb.NewStructValue(&structpb.Struct{
		Fields: map[string]*structpb.Value{
			"nested": structpb.NewListValue(&structpb.ListValue{
				Values: []*structpb.Value{
					structpb.NewStringValue("secret"),
					structpb.NewBoolValue(true),
				},
			}),
		},
	})

	redacted := redactSecretValue(secret)
	values := redacted.GetStructValue().GetFields()["nested"].GetListValue().GetValues()
	assert.Equal(t, auth.RedactedSecret, values[0].GetStringValue())
	assert.Equal(t, true, values[1].GetBoolValue())
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

func TestFetchDefinitionFromRequestFailsWhenFetchedIntegrationHasNoConfigurations(t *testing.T) {
	t.Parallel()

	profileName := "production"
	req := &apiv1.ExecuteRequest{
		ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
		Profile: &commonv1.Profile{
			Name: &profileName,
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
	}

	mockFetcher := fetchmocks.NewFetcher(t)
	mockFetcher.On("ValidateProfile", mock.Anything, mock.Anything).Return(nil)
	mockFetcher.On(
		"FetchIntegrations",
		mock.Anything,
		mock.MatchedBy(func(fetchReq *integrationv1.GetIntegrationsRequest) bool {
			return fetchReq.GetProfile().GetName() == profileName && len(fetchReq.GetIds()) == 1 && fetchReq.GetIds()[0] == "integration-1"
		}),
		false,
	).Return(&integrationv1.GetIntegrationsResponse{
		Data: []*integrationv1.Integration{
			{
				Id:             "integration-1",
				Configurations: []*integrationv1.Configuration{},
			},
		},
	}, nil)

	_, _, err := fetchDefinitionFromRequest(context.Background(), req, mockFetcher, false, zap.NewNop())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "integration-1")
}

func TestFetchDefinitionFromRequestInjectsConfigurationId(t *testing.T) {
	t.Parallel()

	profileName := "production"
	configurationId := "config-abc-123"
	innerConfig, err := structpb.NewStruct(map[string]interface{}{
		"authType": "oauth2-code",
		"authConfig": map[string]interface{}{
			"clientId":   "my-client-id",
			"tokenScope": "datasource",
		},
	})
	require.NoError(t, err)

	req := &apiv1.ExecuteRequest{
		ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
		Profile: &commonv1.Profile{
			Name: &profileName,
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
	}

	mockFetcher := fetchmocks.NewFetcher(t)
	mockFetcher.On("ValidateProfile", mock.Anything, mock.Anything).Return(nil)
	mockFetcher.On(
		"FetchIntegrations",
		mock.Anything,
		mock.MatchedBy(func(fetchReq *integrationv1.GetIntegrationsRequest) bool {
			return fetchReq.GetProfile().GetName() == profileName
		}),
		false,
	).Return(&integrationv1.GetIntegrationsResponse{
		Data: []*integrationv1.Integration{
			{
				Id: "integration-1",
				Configurations: []*integrationv1.Configuration{
					{
						Id:            configurationId,
						Configuration: innerConfig,
					},
				},
			},
		},
	}, nil)

	def, _, err := fetchDefinitionFromRequest(context.Background(), req, mockFetcher, false, zap.NewNop())
	require.NoError(t, err)

	integrationStruct := def.Integrations["integration-1"]
	require.NotNil(t, integrationStruct)

	idField, ok := integrationStruct.GetFields()["id"]
	require.True(t, ok, "expected 'id' field to be injected into integration config struct")
	assert.Equal(t, configurationId, idField.GetStringValue())

	assert.Equal(t, "oauth2-code", integrationStruct.GetFields()["authType"].GetStringValue())
}

func TestFetchDefinitionFromRequestUsesAgentDatasourceEndpointForSDKIntegrationExecution(t *testing.T) {
	t.Parallel()

	profileName := "production"

	makeReq := func(integrationID string, prepopulateIntegration bool) *apiv1.ExecuteRequest {
		integrations := map[string]*structpb.Struct{}
		if prepopulateIntegration {
			integrations[integrationID] = &structpb.Struct{Fields: map[string]*structpb.Value{
				"id":       structpb.NewStringValue("caller-supplied-config"),
				"pluginId": structpb.NewStringValue("postgres"),
			}}
		}
		return &apiv1.ExecuteRequest{
			ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
			Profile: &commonv1.Profile{
				Name: &profileName,
			},
			Request: &apiv1.ExecuteRequest_Definition{
				Definition: &apiv1.Definition{
					Api: &apiv1.Api{
						Metadata: &commonv1.Metadata{
							Id:   "sdk-query-" + integrationID,
							Name: "SDK Integration Query",
						},
						Blocks: []*apiv1.Block{
							{
								Name: "query",
								Config: &apiv1.Block_Step{
									Step: &apiv1.Step{
										Integration: integrationID,
									},
								},
							},
						},
					},
					Integrations: integrations,
				},
			},
		}
	}

	for _, test := range []struct {
		name                   string
		requestIntegrationID   string
		allowedIntegrationIDs  []string
		integration            *fetch.Integration
		fetchErr               error
		expectFetch            bool
		expectValidateProfile  bool
		prepopulateIntegration bool
		assertResult           func(t *testing.T, def *apiv1.Definition)
		errorContains          string
	}{
		{
			name:                  "hydrates config from agent datasource endpoint",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			integration: &fetch.Integration{
				PluginId: "postgres",
				Configuration: map[string]interface{}{
					"id":       "config-from-agent-endpoint",
					"authType": "oauth2-code",
				},
			},
			assertResult: func(t *testing.T, def *apiv1.Definition) {
				t.Helper()

				integrationStruct := def.Integrations["integration-1"]
				require.NotNil(t, integrationStruct)
				assert.Equal(t, "config-from-agent-endpoint", integrationStruct.GetFields()["id"].GetStringValue())
				assert.Equal(t, "oauth2-code", integrationStruct.GetFields()["authType"].GetStringValue())
				assert.Equal(t, "postgres", integrationStruct.GetFields()["pluginId"].GetStringValue())
			},
		},
		{
			name:                   "re-fetches and overwrites pre-populated integration config",
			requestIntegrationID:   "integration-1",
			allowedIntegrationIDs:  []string{"integration-1"},
			expectFetch:            true,
			expectValidateProfile:  true,
			prepopulateIntegration: true,
			integration: &fetch.Integration{
				PluginId: "postgres",
				Configuration: map[string]interface{}{
					"id":       "server-authoritative-config",
					"authType": "oauth2-code",
				},
			},
			assertResult: func(t *testing.T, def *apiv1.Definition) {
				t.Helper()

				integrationStruct := def.Integrations["integration-1"]
				require.NotNil(t, integrationStruct)
				assert.Equal(t, "server-authoritative-config", integrationStruct.GetFields()["id"].GetStringValue())
			},
		},
		{
			name:                  "rejects integration not in signed allowlist",
			requestIntegrationID:  "integration-2",
			allowedIntegrationIDs: []string{"integration-1"},
			errorContains:         "not declared by the SDK API source",
		},
		{
			name:                   "rejects pre-populated integration not in signed allowlist",
			requestIntegrationID:   "integration-2",
			allowedIntegrationIDs:  []string{"integration-1"},
			prepopulateIntegration: true,
			errorContains:          "not declared by the SDK API source",
		},
		{
			name:                  "returns fetch error",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			fetchErr:              errors.New("datasource fetch failed"),
			errorContains:         "datasource fetch failed",
		},
		{
			name:                  "returns error for nil integration",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			integration:           nil,
			errorContains:         "configuration not found or inaccessible",
		},
		{
			name:                  "returns error for nil configuration",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			integration: &fetch.Integration{
				PluginId:      "postgres",
				Configuration: nil,
			},
			errorContains: "configuration not found or inaccessible",
		},
		{
			name:                  "returns error for invalid configuration",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			integration: &fetch.Integration{
				PluginId: "postgres",
				Configuration: map[string]interface{}{
					"bad": func() {},
				},
			},
			errorContains: "configuration is invalid",
		},
		{
			name:                  "returns error for missing configuration id",
			requestIntegrationID:  "integration-1",
			allowedIntegrationIDs: []string{"integration-1"},
			expectFetch:           true,
			expectValidateProfile: true,
			integration: &fetch.Integration{
				PluginId: "postgres",
				Configuration: map[string]interface{}{
					"authType": "oauth2-code",
				},
			},
			errorContains: "configuration id not found or inaccessible",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			req := makeReq(test.requestIntegrationID, test.prepopulateIntegration)
			mockFetcher := fetchmocks.NewFetcher(t)
			if test.expectValidateProfile {
				mockFetcher.On("ValidateProfile", mock.Anything, mock.Anything).Return(nil)
			}
			if test.expectFetch {
				mockFetcher.On(
					"FetchIntegration",
					mock.Anything,
					test.requestIntegrationID,
					req.GetProfile(),
				).Return(test.integration, test.fetchErr)
			}

			ctx := constants.WithSDKIntegrationExecution(context.Background(), test.allowedIntegrationIDs)
			def, _, err := fetchDefinitionFromRequest(ctx, req, mockFetcher, false, zap.NewNop())
			if test.errorContains != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), test.errorContains)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, def)
			test.assertResult(t, def)
		})
	}
}

func TestFetchDefinitionFromRequestValidatesProfileForSDKCallbackWithoutViewMode(t *testing.T) {
	t.Parallel()

	profileName := "production"
	req := &apiv1.ExecuteRequest{
		Profile: &commonv1.Profile{Name: &profileName},
		Request: &apiv1.ExecuteRequest_Definition{
			Definition: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:   "sdk-query-integration-1",
						Name: "SDK Integration Query",
					},
					Blocks: []*apiv1.Block{{
						Name: "query",
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{Integration: "integration-1"},
						},
					}},
				},
			},
		},
	}

	mockFetcher := &fetchmocks.Fetcher{}
	mockFetcher.On("ValidateProfile", mock.Anything, mock.MatchedBy(func(req *integrationv1.ValidateProfileRequest) bool {
		return req.ViewMode == "deployed" &&
			req.Profile.GetName() == profileName &&
			len(req.IntegrationIds) == 1 &&
			req.IntegrationIds[0] == "integration-1"
	})).Return(nil)
	mockFetcher.On("FetchIntegration", mock.Anything, "integration-1", req.GetProfile()).Return(&fetch.Integration{
		PluginId: "postgres",
		Configuration: map[string]interface{}{
			"id": "config-from-agent-endpoint",
		},
	}, nil)

	ctx := constants.WithSDKIntegrationExecution(context.Background(), []string{"integration-1"})
	_, _, err := fetchDefinitionFromRequest(ctx, req, mockFetcher, false, zap.NewNop())
	require.NoError(t, err)
	mockFetcher.AssertExpectations(t)
}

func TestFetchDefinitionFromRequestPreservesExistingConfigurationId(t *testing.T) {
	t.Parallel()

	profileName := "production"
	existingConfigId := "existing-config-id"
	innerConfig, err := structpb.NewStruct(map[string]interface{}{
		"id":       existingConfigId,
		"authType": "oauth2-code",
	})
	require.NoError(t, err)

	req := &apiv1.ExecuteRequest{
		ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
		Profile: &commonv1.Profile{
			Name: &profileName,
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
					"integration-1": innerConfig,
				},
			},
		},
	}

	mockFetcher := fetchmocks.NewFetcher(t)
	mockFetcher.On("ValidateProfile", mock.Anything, mock.Anything).Return(nil)

	def, _, err := fetchDefinitionFromRequest(context.Background(), req, mockFetcher, false, zap.NewNop())
	require.NoError(t, err)

	integrationStruct := def.Integrations["integration-1"]
	require.NotNil(t, integrationStruct)

	idField := integrationStruct.GetFields()["id"]
	assert.Equal(t, existingConfigId, idField.GetStringValue())
}

func TestFetchDefinitionFromRequest_RefsRequireAllowlist(t *testing.T) {
	// Request contains an integration config with an embedded
	// {resolver, ref, field} map. With the refresolver allowlist
	// env var unset, fetchDefinitionFromRequest must reject the
	// request rather than dereferencing the ARN under the
	// orchestrator's IAM identity.
	//
	// t.Setenv unsets the variable for this test (passing "" matches
	// "unset" semantically because refresolver's CSV split treats
	// empty strings as nil) and restores the prior value on cleanup.
	// Implicitly prevents t.Parallel(), which is what we want here.
	t.Setenv(refresolver.AllowedRefPrefixesEnvVar, "")

	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id":   "integration-1",
		"host": "db.example.com",
		"password": map[string]interface{}{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:caller-supplied/x",
			"field":    "password",
		},
	})
	require.NoError(t, err)

	req := &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_Definition{
			Definition: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{Id: "api-id", Name: "Test API"},
					Blocks: []*apiv1.Block{
						{
							Name: "Step1",
							Config: &apiv1.Block_Step{
								Step: &apiv1.Step{Integration: "integration-1"},
							},
						},
					},
				},
				Integrations: map[string]*structpb.Struct{
					"integration-1": cfg,
				},
			},
		},
	}

	mockFetcher := fetchmocks.NewFetcher(t)
	_, _, err = fetchDefinitionFromRequest(context.Background(), req, mockFetcher, false, zap.NewNop())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "SUPERBLOCKS_SECRETS_REFRESOLVER_ALLOWED_REF_PREFIXES")
}

func TestFetch_ResolvesCredentialRefsForFetchedDefinition(t *testing.T) {
	const arn = "arn:aws:secretsmanager:us-east-1:1:secret:rds!binding-abc"
	t.Setenv(refresolver.AllowedRefPrefixesEnvVar, "arn:aws:secretsmanager:us-east-1:1:secret:rds!")
	withFakeCredRefDispatcher(t, &fakeRefResolver{docs: map[string]map[string]string{
		arn: {"password": "hunter2"},
	}}, nil)

	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id":   "integration-1",
		"host": "db.example.com",
		"password": map[string]interface{}{
			"resolver": "aws_secrets_manager",
			"ref":      arn,
			"field":    "password",
		},
	})
	require.NoError(t, err)

	def := &apiv1.Definition{
		Api: &apiv1.Api{
			Metadata: &commonv1.Metadata{
				Id:           "00000000-0000-0000-0000-000000000001",
				Organization: "00000000-0000-0000-0000-000000000002",
				Name:         "Test API",
			},
		},
		Integrations: map[string]*structpb.Struct{"integration-1": cfg},
	}

	fetchOptions := &apiv1.ExecuteRequest_Fetch{Id: "api-id"}
	req := &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_Fetch_{Fetch: fetchOptions},
	}
	mockFetcher := fetchmocks.NewFetcher(t)
	mockFetcher.On("FetchApi", mock.Anything, fetchOptions, false).Return(def, &structpb.Struct{}, nil)

	got, _, err := Fetch(context.Background(), req, mockFetcher, false, false, zap.NewNop())
	require.NoError(t, err)
	assert.Equal(t, "hunter2", got.Integrations["integration-1"].Fields["password"].GetStringValue())
}

// fakeRefResolver is an in-memory refresolver.Resolver used by the
// resolveIntegrationCredentialRefs tests. Avoids dragging the full AWS
// SDK surface into executor tests.
type fakeRefResolver struct {
	docs map[string]map[string]string
	err  error
}

func (f *fakeRefResolver) Resolve(_ context.Context, ref, field string) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	if doc, ok := f.docs[ref]; ok {
		return doc[field], nil
	}
	return "", fmt.Errorf("fake: secret %q not found", ref)
}

// withFakeCredRefDispatcher swaps the package-level dispatcher factory
// for one backed by an in-memory fake. Mirrors the dsn.go test seam
// pattern. Tests using this MUST NOT call t.Parallel().
func withFakeCredRefDispatcher(t *testing.T, fake *fakeRefResolver, factoryErr error) {
	t.Helper()
	prev := newCredRefDispatcher
	newCredRefDispatcher = func(_ context.Context, allowedPrefixes []string) (*refresolver.Dispatcher, error) {
		if factoryErr != nil {
			return nil, factoryErr
		}
		return refresolver.NewDispatcher(map[refresolver.ResolverType]refresolver.Resolver{
			refresolver.ResolverAWSSecretsManager: fake,
		}, allowedPrefixes), nil
	}
	t.Cleanup(func() { newCredRefDispatcher = prev })
}

func TestResolveIntegrationCredentialRefs_NoRefsIsNoOp(t *testing.T) {
	// HasRefs returns false → short-circuit before constructing a
	// dispatcher. The expensive AWS SDK init must not run for the
	// common case (integration carries literal scalar credentials).
	withFakeCredRefDispatcher(t, &fakeRefResolver{}, errors.New("must not be called"))
	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id":       "integration-1",
		"host":     "db.example.com",
		"username": "alice",
		"password": "literal",
	})
	require.NoError(t, err)
	integrations := map[string]*structpb.Struct{"integration-1": cfg}

	require.NoError(t, resolveIntegrationCredentialRefs(context.Background(), integrations, zap.NewNop()))
}

func TestResolveIntegrationCredentialRefs_DispatcherInitFailureBubblesUp(t *testing.T) {
	// AWS SDK config-chain init failure (missing IAM role, malformed
	// credentials) must surface verbatim so the operator sees the
	// underlying SDK error, not a generic "resolve failed".
	t.Setenv(refresolver.AllowedRefPrefixesEnvVar, "arn:aws:secretsmanager:us-east-1:1:secret:rds!")
	withFakeCredRefDispatcher(t, nil, errors.New("ec2 metadata unreachable"))

	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id": "integration-1",
		"password": map[string]interface{}{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:1:secret:rds!x",
			"field":    "password",
		},
	})
	require.NoError(t, err)

	err = resolveIntegrationCredentialRefs(context.Background(),
		map[string]*structpb.Struct{"integration-1": cfg}, zap.NewNop())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "init credential resolver")
	assert.Contains(t, err.Error(), "ec2 metadata unreachable")
}

func TestResolveIntegrationCredentialRefs_HappyPathInPlaceRewrite(t *testing.T) {
	// Refs present + allowlist set + dispatcher init succeeds +
	// individual resolves succeed → integration config is rewritten in
	// place with the literal credential values (the structpb Map
	// value's previously-ref-shaped entry is replaced by the resolved
	// string).
	const arn = "arn:aws:secretsmanager:us-east-1:1:secret:rds!binding-abc"
	t.Setenv(refresolver.AllowedRefPrefixesEnvVar, "arn:aws:secretsmanager:us-east-1:1:secret:rds!")
	withFakeCredRefDispatcher(t, &fakeRefResolver{docs: map[string]map[string]string{
		arn: {"password": "hunter2"},
	}}, nil)

	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id":   "integration-1",
		"host": "db.example.com",
		"password": map[string]interface{}{
			"resolver": "aws_secrets_manager",
			"ref":      arn,
			"field":    "password",
		},
	})
	require.NoError(t, err)
	integrations := map[string]*structpb.Struct{"integration-1": cfg}

	require.NoError(t, resolveIntegrationCredentialRefs(context.Background(), integrations, zap.NewNop()))
	// The ref-map at integrations["integration-1"].password is replaced
	// in place with the resolved literal string.
	pwdField := integrations["integration-1"].Fields["password"]
	require.NotNil(t, pwdField)
	assert.Equal(t, "hunter2", pwdField.GetStringValue())
}

func TestResolveIntegrationCredentialRefs_PerIntegrationFailureLabelsId(t *testing.T) {
	// When ResolveInConfig fails for one specific integration, the
	// error must include the integration id so the operator can find
	// the broken config. Other integrations in the same call are
	// skipped (resolve order is map-iteration order, so we only assert
	// that the id of whichever-failed lands in the message).
	t.Setenv(refresolver.AllowedRefPrefixesEnvVar, "arn:aws:secretsmanager:us-east-1:1:secret:rds!")
	withFakeCredRefDispatcher(t, &fakeRefResolver{docs: map[string]map[string]string{}}, nil)
	// Fake returns "not found" for every ref → every integration's
	// resolve fails → the iteration aborts on the first failure.

	cfg, err := structpb.NewStruct(map[string]interface{}{
		"id": "integration-bad",
		"password": map[string]interface{}{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:1:secret:rds!gone",
			"field":    "password",
		},
	})
	require.NoError(t, err)

	err = resolveIntegrationCredentialRefs(context.Background(),
		map[string]*structpb.Struct{"integration-bad": cfg}, zap.NewNop())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "resolve credential refs for integration")
	assert.Contains(t, err.Error(), "integration-bad")
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

func TestPrimaryPluginFromIntegrations(t *testing.T) {
	for _, test := range []struct {
		name         string
		integrations map[string]*structpb.Struct
		expected     string
	}{
		{
			name:         "nil map returns unknown",
			integrations: nil,
			expected:     "unknown",
		},
		{
			name:         "empty map returns unknown",
			integrations: map[string]*structpb.Struct{},
			expected:     "unknown",
		},
		{
			name: "nil config entry returns unknown",
			integrations: map[string]*structpb.Struct{
				"abc": nil,
			},
			expected: "unknown",
		},
		{
			name: "missing pluginId returns unknown",
			integrations: map[string]*structpb.Struct{
				"abc": {Fields: map[string]*structpb.Value{
					"name": structpb.NewStringValue("my integration"),
				}},
			},
			expected: "unknown",
		},
		{
			name: "single plugin returns normalized name",
			integrations: map[string]*structpb.Struct{
				"abc": {Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("Postgres"),
				}},
			},
			expected: "postgres",
		},
		{
			name: "same plugin with mixed case returns single name",
			integrations: map[string]*structpb.Struct{
				"abc": {Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("POSTGRES"),
				}},
				"def": {Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("postgres"),
				}},
			},
			expected: "postgres",
		},
		{
			name: "multiple distinct plugins returns multi",
			integrations: map[string]*structpb.Struct{
				"abc": {Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("postgres"),
				}},
				"def": {Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("restapi"),
				}},
			},
			expected: "multi",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, PrimaryPluginFromIntegrations(test.integrations))
		})
	}
}

func TestMustJSONString(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "normal JWT",
			input:    "eyJhbGciOiJSUzI1NiJ9.abc123",
			expected: `"eyJhbGciOiJSUzI1NiJ9.abc123"`,
		},
		{
			name:     "empty string",
			input:    "",
			expected: `""`,
		},
		{
			name:     "single quote",
			input:    "it's-a-token",
			expected: `"it's-a-token"`,
		},
		{
			name:     "double quote",
			input:    `token"with"quotes`,
			expected: `"token\"with\"quotes"`,
		},
		{
			name:     "backslash",
			input:    `token\path`,
			expected: `"token\\path"`,
		},
		{
			name:     "newline",
			input:    "token\ninjection",
			expected: `"token\ninjection"`,
		},
		{
			name:     "tab",
			input:    "token\there",
			expected: `"token\there"`,
		},
		{
			name:     "unicode",
			input:    "token-with-émojis-🔑",
			expected: `"token-with-émojis-🔑"`,
		},
		{
			name:     "angle brackets escaped for XSS safety",
			input:    "abc</script><script>alert(1)</script>",
			expected: "\"abc\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e\"",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, mustJSONString(test.input))
		})
	}
}

func TestMustJSONString_ProducesValidJSExpression(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer sandbox.Close()

	for _, test := range []struct {
		name  string
		token string
	}{
		{name: "normal JWT", token: "eyJhbGciOiJSUzI1NiJ9.abc123"},
		{name: "single quote", token: "it's-a-token"},
		{name: "double quote", token: `token"with"quotes`},
		{name: "backslash", token: `token\path`},
		{name: "unicode", token: "token-with-émojis-🔑"},
		{name: "newline", token: "token\ninjection"},
		{name: "carriage return", token: "token\rinjection"},
		// Without proper escaping this payload would break out of the string
		// literal and execute arbitrary JS (e.g. require('child_process').execSync(...)).
		{name: "double-quote breakout attempt", token: `" + (1+1) + "`},
	} {
		t.Run(test.name, func(t *testing.T) {
			expr := fmt.Sprintf("{{ { token: %s } }}", mustJSONString(test.token))
			template := fmt.Sprintf("{{ %s.token }}", utils.IdempotentUnwrap(expr))

			ctx := apictx.New(&apictx.Context{Context: context.Background()})
			e, err := sandbox.Engine(ctx.Context)
			require.NoError(t, err)
			defer e.Close()

			result, err := e.Resolve(ctx.Context, template, nil).Result()
			require.NoError(t, err)
			assert.Equal(t, test.token, result)
		})
	}
}
