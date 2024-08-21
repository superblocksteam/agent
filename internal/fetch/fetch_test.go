package fetch

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	syncerv1 "github.com/superblocksteam/agent/types/gen/go/syncer/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestRequest(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name            string
		metadata        map[string]string
		options         *apiv1.ExecuteRequest_Fetch
		headers         map[string]string
		expectedURL     string
		expectedHeaders http.Header
		err             bool
		useAgentKey     bool
	}{
		{
			name: "basic without profile",
			metadata: map[string]string{
				"authorization":               "Bearer <token>",
				"x-superblocks-authorization": "Bearer <sb token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			headers: map[string]string{
				"foo": "bar",
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": {"Bearer <sb token>"},
				"Foo":                         {"bar"},
			},
			useAgentKey: false,
		},
		{
			name:     "with token",
			metadata: map[string]string{},
			options: &apiv1.ExecuteRequest_Fetch{
				Id:    "00000000-0000-0000-0000-000000000001",
				Token: utils.Pointer("<token>"),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			expectedHeaders: http.Header{
				"x-superblocks-api-key": {"<token>"},
			},
			useAgentKey: false,
		},
		{
			name: "basic with profile",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
				Profile: &commonv1.Profile{
					Id:          utils.Pointer("profile-id"),
					Name:        utils.Pointer("profile-name"),
					Environment: utils.Pointer("environment-deprecated"),
				},
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?environment=environment-deprecated&hydrate=true&profile=profile-name&profileId=profile-id&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "basic with view mode deployed",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id:       "00000000-0000-0000-0000-000000000001",
				ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
				Profile: &commonv1.Profile{
					Id:          utils.Pointer("profile-id"),
					Name:        utils.Pointer("profile-name"),
					Environment: utils.Pointer("environment-deprecated"),
				},
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?environment=environment-deprecated&hydrate=true&isPublished=true&profile=profile-name&profileId=profile-id&v2=true&viewMode=deployed",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "basic with view mode editor",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id:       "00000000-0000-0000-0000-000000000001",
				ViewMode: apiv1.ViewMode_VIEW_MODE_EDIT,
				Profile: &commonv1.Profile{
					Id:          utils.Pointer("profile-id"),
					Name:        utils.Pointer("profile-name"),
					Environment: utils.Pointer("environment-deprecated"),
				},
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?environment=environment-deprecated&hydrate=true&profile=profile-name&profileId=profile-id&v2=true&viewMode=editor",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "commit id passed",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
				Profile: &commonv1.Profile{
					Id:          utils.Pointer("profile-id"),
					Name:        utils.Pointer("profile-name"),
					Environment: utils.Pointer("environment-deprecated"),
				},
				CommitId: utils.Pointer("commit-id"),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?commitId=commit-id&environment=environment-deprecated&hydrate=true&profile=profile-name&profileId=profile-id&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "branch name passed",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
				Profile: &commonv1.Profile{
					Id:          utils.Pointer("profile-id"),
					Name:        utils.Pointer("profile-name"),
					Environment: utils.Pointer("environment-deprecated"),
				},
				BranchName: utils.Pointer("git-project"),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001/branches/git-project?environment=environment-deprecated&hydrate=true&profile=profile-name&profileId=profile-id&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "branch name with slash passed",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
				Profile: &commonv1.Profile{
					Id:   utils.Pointer("profile-id"),
					Name: utils.Pointer("profile-name"),
				},
				BranchName: utils.Pointer("ts/feature-branch"),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001/branches/ts%2Ffeature-branch?hydrate=true&profile=profile-name&profileId=profile-id&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "test passed (workflow testing)",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
				Profile: &commonv1.Profile{
					Name: utils.Pointer("profile-name"),
				},
				Test: utils.Pointer(true),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&profile=profile-name&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "test == false",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id:   "00000000-0000-0000-0000-000000000001",
				Test: utils.Pointer(false),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&isPublished=true&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
		{
			name: "basic with agent key",
			metadata: map[string]string{
				"authorization": "Bearer <token>",
			},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			headers: map[string]string{
				"foo": "bar",
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer <token>"},
				"Foo":                         {"bar"},
				"X-Superblocks-Agent-Key":     {"foobar"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: true,
		},
		{
			name:     "basic with no auth",
			metadata: map[string]string{},
			options: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			headers: map[string]string{
				"foo": "bar",
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			expectedHeaders: http.Header{
				"Authorization":               []string(nil),
				"Foo":                         {"bar"},
				"X-Superblocks-Authorization": []string(nil),
			},
			useAgentKey: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockHttpClient := mocks.NewHttpClient(t)
			mockHttpClient.On("Do", mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
			}, nil)

			logger := zap.NewNop()

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL:                 "https://api.superblocks.com",
				Headers:             test.headers,
				Client:              mockHttpClient,
				SuperblocksAgentKey: "foobar",
			})

			fetcher := New(&Options{
				Logger:       logger,
				ServerClient: serverClient,
			}).(*fetcher)

			_, err := fetcher.sendFetchApiRequest(
				metadata.NewIncomingContext(context.Background(), metadata.New(test.metadata)),
				test.options,
				test.useAgentKey)

			if test.err {
				assert.Error(t, err, test.name)
				return
			}

			mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
			req := mockHttpClient.Calls[0].Arguments[0].(*http.Request)

			assert.NoError(t, err, test.name)
			assert.Equal(t, http.MethodGet, req.Method)
			assert.Equal(t, test.expectedURL, req.URL.String(), test.name)
			assert.Equal(t, http.Header(test.expectedHeaders), req.Header, test.name)
		})
	}
}

func TestFetchIntegrations(t *testing.T) {
	t.Parallel()

	kindSecret := integrationv1.Kind_KIND_SECRET

	for _, test := range []struct {
		name        string
		request     *integrationv1.GetIntegrationsRequest
		expectedURL string
		response    *http.Response
		err         error
	}{
		{
			name: "normal",
			request: &integrationv1.GetIntegrationsRequest{
				Kind: &kindSecret,
				Slug: proto.String("slug"),
				Profile: &commonv1.Profile{
					Name: proto.String("default"),
				},
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
			},
			expectedURL: "https://api.superblocks.com/api/v1/integrations?kind=SECRET&profile=default&slug=slug",
		},
		{
			name: "timed out, nil response",
			request: &integrationv1.GetIntegrationsRequest{
				Kind: &kindSecret,
				Slug: proto.String("slug"),
				Profile: &commonv1.Profile{
					Name: proto.String("default"),
				},
			},
			expectedURL: "https://api.superblocks.com/api/v1/integrations?kind=SECRET&profile=default&slug=slug",
			response:    nil,
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := mocks.NewHttpClient(t)
			client.On("Do", mock.Anything).Return(test.response, test.err)

			fetcher := New(&Options{
				Logger: zap.NewNop(),
				ServerClient: clients.NewServerClient(&clients.ServerClientOptions{
					URL:                 "https://api.superblocks.com",
					Client:              client,
					SuperblocksAgentKey: "foobar",
				}),
			}).(*fetcher)

			_, err := fetcher.FetchIntegrations(context.Background(), test.request, false)

			if test.err != nil {
				assert.Error(t, err, test.name)
				return
			}

			assert.NoError(t, err, test.name)

			client.AssertNumberOfCalls(t, "Do", 1)
			req := client.Calls[0].Arguments[0].(*http.Request)

			assert.Equal(t, http.MethodGet, req.Method)
			assert.Equal(t, test.expectedURL, req.URL.String(), test.name)
		})
	}
}

func TestFetchApi(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		request        *apiv1.ExecuteRequest_Fetch
		expectedURL    string
		expectedDef    *apiv1.Definition
		expectedRawDef map[string]any
		err            error
		response       *http.Response
	}{
		{
			name: "normal",
			request: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi",
					},
					Trigger: &apiv1.Trigger{
						Config: &apiv1.Trigger_Application_{
							Application: &apiv1.Trigger_Application{
								Id: "app-id",
							},
						},
					},
					Blocks: []*apiv1.Block{},
				},
			},
			expectedRawDef: map[string]any{
				"api": map[string]any{
					"metadata": map[string]any{
						"id":           "00000000-0000-0000-0000-000000000001",
						"organization": "org-id",
						"name":         "TestApi",
					},
					"trigger": map[string]any{
						"application": map[string]any{
							"id": "app-id",
						},
					},
					"blocks":     []any{},
					"extraField": "extraValue",
				},
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
				{
					"api": {
						"metadata": {
						  "id": "00000000-0000-0000-0000-000000000001",
						  "organization": "org-id",
						  "name": "TestApi"
						},
						"trigger": {
						  "application": {
						    "id": "app-id"
						  }
						},
						"blocks": [],
						"extraField": "extraValue"
					}
				}
				`)),
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
		},
		{
			name: "signed api",
			request: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi",
					},
					Trigger: &apiv1.Trigger{
						Config: &apiv1.Trigger_Application_{
							Application: &apiv1.Trigger_Application{
								Id: "app-id",
							},
						},
					},
					Blocks: []*apiv1.Block{},
					Signature: &pbutils.Signature{
						KeyId: "key-id",
						Data:  []byte("api-signature"),
					},
				},
			},
			expectedRawDef: map[string]any{
				"api": map[string]any{
					"metadata": map[string]any{
						"id":           "00000000-0000-0000-0000-000000000001",
						"organization": "org-id",
						"name":         "TestApi",
					},
					"trigger": map[string]any{
						"application": map[string]any{
							"id": "app-id",
						},
					},
					"blocks": []any{},
					"signature": map[string]any{
						"keyId": "key-id",
						"data":  "api-signature",
					},
					"extraField": "extraValue",
				},
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
				{
					"api": {
						"metadata": {
						  "id": "00000000-0000-0000-0000-000000000001",
						  "organization": "org-id",
						  "name": "TestApi"
						},
						"trigger": {
						  "application": {
						    "id": "app-id"
						  }
						},
						"blocks": [],
						"signature": {
						  "keyId": "key-id",
						  "data": "YXBpLXNpZ25hdHVyZQ=="
						},
						"extraField": "extraValue"
					}
				}
				`)),
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
		},
		{
			name: "timed out, nil response",
			request: &apiv1.ExecuteRequest_Fetch{
				Id: "00000000-0000-0000-0000-000000000001",
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			response:    nil,
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := mocks.NewHttpClient(t)
			client.On("Do", mock.Anything).Return(test.response, test.err)

			expectedRaw, err := structpb.NewStruct(test.expectedRawDef)
			assert.NoError(t, err)

			fetcher := New(&Options{
				Logger: zap.NewNop(),
				ServerClient: clients.NewServerClient(&clients.ServerClientOptions{
					URL:                 "https://api.superblocks.com",
					Client:              client,
					SuperblocksAgentKey: "foobar",
				}),
			}).(*fetcher)

			actual, actualRaw, err := fetcher.FetchApi(context.Background(), test.request, false)

			if test.err != nil {
				assert.Error(t, err, test.name)
				return
			}

			assert.NoError(t, err, test.name)
			utils.AssertProtoEqual(t, test.expectedDef, actual)
			utils.AssertProtoEqual(t, expectedRaw, actualRaw)

			client.AssertNumberOfCalls(t, "Do", 1)
			req := client.Calls[0].Arguments[0].(*http.Request)

			assert.Equal(t, http.MethodGet, req.Method)
			assert.Equal(t, test.expectedURL, req.URL.String(), test.name)
		})
	}
}

func TestFetchIntegration(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name          string
		integrationId string
		profile       *commonv1.Profile
		expectedURL   string
		err           error
		response      *http.Response
	}{
		{
			name:          "normal",
			integrationId: "integration-id",
			profile: &commonv1.Profile{
				Name: proto.String("default"),
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
					{
						"data": {
						  "datasource": {
							"pluginId": "abc"
						  }
						}
					  }
					`)),
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v1/agents/datasource/integration-id?profile=default",
		},
		{
			name:          "timed out, nil response",
			integrationId: "integration-id",
			profile: &commonv1.Profile{
				Name: proto.String("default"),
			},
			expectedURL: "https://api.superblocks.com/api/v1/agents/datasource/integration-id?profile=default",
			response:    nil,
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := mocks.NewHttpClient(t)
			client.On("Do", mock.Anything).Return(test.response, test.err)

			fetcher := New(&Options{
				Logger: zap.NewNop(),
				ServerClient: clients.NewServerClient(&clients.ServerClientOptions{
					URL:                 "https://api.superblocks.com",
					Client:              client,
					SuperblocksAgentKey: "foobar",
				}),
			}).(*fetcher)

			_, err := fetcher.FetchIntegration(context.Background(), test.integrationId, test.profile)

			if test.err != nil {
				assert.Error(t, err, test.name)
				return
			}

			assert.NoError(t, err, test.name)

			client.AssertNumberOfCalls(t, "Do", 1)
			req := client.Calls[0].Arguments[0].(*http.Request)

			assert.Equal(t, http.MethodPost, req.Method)
			assert.Equal(t, test.expectedURL, req.URL.String(), test.name)
		})
	}
}
func TestScheduleJobRequest(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		expectedURL string
		err         error
		response    *http.Response
	}{
		{
			name: "normal",
			response: &http.Response{
				StatusCode: http.StatusOK,
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v1/agents/jobs/00000000-0000-0000-0000-000000000001",
		},
		{
			name:        "timed out, nil response",
			expectedURL: "https://api.superblocks.com/api/v1/agents/jobs/00000000-0000-0000-0000-000000000001",
			response:    nil,
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockHttpClient := mocks.NewHttpClient(t)
			mockHttpClient.On("Do", mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
			}, nil)

			logger := zap.NewNop()

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL: "https://foo.bar.com",
				Headers: map[string]string{
					"x-superblocks-agent-id": "foobar",
				},
				Client:              mockHttpClient,
				SuperblocksAgentKey: "foobar",
			})

			fetcher := New(&Options{
				Logger:       logger,
				ServerClient: serverClient,
			}).(*fetcher)

			ctx := context.Background()

			_, err := fetcher.sendFetchScheduleJobRequest(ctx)
			assert.NoError(t, err)

			expectedRequestHeaders := http.Header{}
			expectedRequestHeaders.Set("x-superblocks-agent-key", "foobar")
			expectedRequestHeaders.Set("x-superblocks-agent-id", "foobar")

			mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
			request := mockHttpClient.Calls[0].Arguments[0].(*http.Request)
			assert.Equal(t, http.MethodPost, request.Method)
			assert.Equal(t, "https://foo.bar.com/api/v2/agents/pending-jobs", request.URL.String())
			assert.Equal(t, expectedRequestHeaders, request.Header)
		})
	}
}

func TestUpsertMetadata(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		request     *syncerv1.UpsertMetadataRequest
		expectedURL string
		err         error
		response    *http.Response
	}{
		{
			name: "normal",
			request: &syncerv1.UpsertMetadataRequest{
				Metadata: []*syncerv1.Metadata{
					{
						ConfigurationId: "00000000-0000-0000-0000-000000000001",
						IntegrationId:   "00000000-0000-0000-0000-000000000002",
					},
				},
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
					{
						"data": {
						  "datasource": {
							"pluginId": "abc"
						  }
						}
					  }
					`)),
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
		},
		{
			name: "timed out, nil response",
			request: &syncerv1.UpsertMetadataRequest{
				Metadata: []*syncerv1.Metadata{
					{
						ConfigurationId: "00000000-0000-0000-0000-000000000001",
						IntegrationId:   "00000000-0000-0000-0000-000000000002",
					},
				},
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/00000000-0000-0000-0000-000000000001?hydrate=true&v2=true",
			response:    nil,
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			intakeClient := mocks.NewIntakeClient(t)
			intakeClient.On("UpsertMetadata", mock.Anything, mock.Anything, test.request).Return(test.response, test.err)

			fetcher := New(&Options{
				Logger:       zap.NewNop(),
				IntakeClient: intakeClient,
			}).(*fetcher)

			err := fetcher.UpsertMetadata(context.Background(), test.request)

			if test.err != nil {
				assert.Error(t, err, test.name)
				return
			}

			assert.NoError(t, err, test.name)

			intakeClient.AssertNumberOfCalls(t, "UpsertMetadata", 1)
			req := intakeClient.Calls[0].Arguments[2].(*syncerv1.UpsertMetadataRequest)

			assert.Equal(t, test.request, req)
		})
	}
}
