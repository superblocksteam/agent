package fetch

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	syncerv1 "github.com/superblocksteam/agent/types/gen/go/syncer/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

// errorReader is an io.Reader that always returns an error, used to test body read failures.
type errorReader struct{}

func (e *errorReader) Read([]byte) (int, error) {
	return 0, fmt.Errorf("simulated read error")
}

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

// TestFetchIntegrationsHeaderForwarding proves that the HTTP Authorization header
// sent to the server is determined entirely by the "authorization" key in the
// incoming gRPC metadata. This is the root cause of the "configuration not found
// or inaccessible" bug: the integration executor was only setting
// "x-superblocks-authorization" in the gRPC metadata, so the server's checkJwt
// middleware saw no Authorization header and treated the request as a visitor,
// causing the integration query to run against the wrong organization.
func TestFetchIntegrationsHeaderForwarding(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name            string
		metadata        map[string]string
		useAgentKey     bool
		expectedHeaders http.Header
	}{
		{
			name: "BUG REPRO: only x-superblocks-authorization in gRPC metadata → no Authorization HTTP header",
			metadata: map[string]string{
				"x-superblocks-authorization": "Bearer user-jwt-token",
			},
			useAgentKey: true,
			expectedHeaders: http.Header{
				"Authorization":               []string(nil),
				"X-Superblocks-Authorization": {"Bearer user-jwt-token"},
				"X-Superblocks-Agent-Key":     {"test-agent-key"},
			},
		},
		{
			name: "FIX: both authorization and x-superblocks-authorization → both HTTP headers present",
			metadata: map[string]string{
				"authorization":               "Bearer user-jwt-token",
				"x-superblocks-authorization": "Bearer user-jwt-token",
			},
			useAgentKey: true,
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-jwt-token"},
				"X-Superblocks-Authorization": {"Bearer user-jwt-token"},
				"X-Superblocks-Agent-Key":     {"test-agent-key"},
			},
		},
		{
			name: "normal browser flow: both headers present, no agent key",
			metadata: map[string]string{
				"authorization":               "Bearer user-jwt-token",
				"x-superblocks-authorization": "Bearer user-jwt-token",
			},
			useAgentKey: false,
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-jwt-token"},
				"X-Superblocks-Authorization": {"Bearer user-jwt-token"},
				"X-Superblocks-Agent-Key":     []string(nil),
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockHttpClient := mocks.NewHttpClient(t)
			mockHttpClient.On("Do", mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"data":[]}`)),
			}, nil)

			fetcher := New(&Options{
				Logger: zap.NewNop(),
				ServerClient: clients.NewServerClient(&clients.ServerClientOptions{
					URL:                 "https://api.superblocks.com",
					Client:              mockHttpClient,
					SuperblocksAgentKey: "test-agent-key",
				}),
			})

			ctx := metadata.NewIncomingContext(
				context.Background(),
				metadata.New(test.metadata),
			)

			profileName := "production"
			_, _ = fetcher.FetchIntegrations(ctx, &integrationv1.GetIntegrationsRequest{
				Ids:     []string{"7f0d5df0-ddd0-48c3-87d4-03c9adb57b06"},
				Profile: &commonv1.Profile{Name: &profileName},
			}, test.useAgentKey)

			mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
			req := mockHttpClient.Calls[0].Arguments[0].(*http.Request)

			for key, expected := range test.expectedHeaders {
				assert.Equal(t, expected, req.Header[key],
					"HTTP header %q mismatch: server's checkJwt middleware uses Authorization to authenticate the user", key)
			}
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
						KeyId:     "key-id",
						Data:      []byte("api-signature"),
						PublicKey: []byte("any-public-key"),
						Algorithm: pbutils.Signature_ALGORITHM_ED25519,
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
						"keyId":     "key-id",
						"data":      "api-signature",
						"publicKey": "any-public-key",
						"algorithm": 1,
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
						  "data": "YXBpLXNpZ25hdHVyZQ==",
						  "publicKey": "YW55LXB1YmxpYy1rZXk=",
						  "algorithm": 1
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
			name: "signed api, no algorithm public key",
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

func TestFetchApiByPath(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		request        *apiv1.ExecuteRequest_FetchByPath
		expectedURL    string
		expectedDef    *apiv1.Definition
		expectedRawDef map[string]any
		err            error
		response       *http.Response
	}{
		{
			name: "normal fetch with commit id",
			request: &apiv1.ExecuteRequest_FetchByPath{
				Path:          "/pages/Page 2/apis/TestApi1/api.json",
				ApplicationId: proto.String("app-id"),
				CommitId:      proto.String("commit-id"),
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi1",
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
						"name":         "TestApi1",
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
						  "name": "TestApi1"
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
			expectedURL: "https://api.superblocks.com/api/v3/apis/applications/app-id/commits/commit-id/%2Fpages%2FPage%202%2Fapis%2FTestApi1%2Fapi.json?hydrate=true",
		},
		{
			name: "normal fetch with branch name",
			request: &apiv1.ExecuteRequest_FetchByPath{
				Path:          "/pages/Page 2/apis/TestApi1/api.json",
				ApplicationId: proto.String("app-id"),
				BranchName:    proto.String("jdoe/test-branch"),
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi1",
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
						"name":         "TestApi1",
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
						  "name": "TestApi1"
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
			expectedURL: "https://api.superblocks.com/api/v3/apis/applications/app-id/branches/jdoe%2Ftest-branch/%2Fpages%2FPage%202%2Fapis%2FTestApi1%2Fapi.json?hydrate=true",
		},
		{
			name: "signed api",
			request: &apiv1.ExecuteRequest_FetchByPath{
				Path:          "/pages/Page 2/apis/TestApi1/api.json",
				ApplicationId: proto.String("app-id"),
				CommitId:      proto.String("commit-id"),
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi1",
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
						KeyId:     "key-id",
						Data:      []byte("api-signature"),
						PublicKey: []byte("any-public-key"),
						Algorithm: pbutils.Signature_ALGORITHM_ED25519,
					},
				},
			},
			expectedRawDef: map[string]any{
				"api": map[string]any{
					"metadata": map[string]any{
						"id":           "00000000-0000-0000-0000-000000000001",
						"organization": "org-id",
						"name":         "TestApi1",
					},
					"trigger": map[string]any{
						"application": map[string]any{
							"id": "app-id",
						},
					},
					"blocks": []any{},
					"signature": map[string]any{
						"keyId":     "key-id",
						"data":      "api-signature",
						"publicKey": "any-public-key",
						"algorithm": 1,
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
						  "name": "TestApi1"
						},
						"trigger": {
						  "application": {
						    "id": "app-id"
						  }
						},
						"blocks": [],
						"signature": {
						  "keyId": "key-id",
						  "data": "YXBpLXNpZ25hdHVyZQ==",
						  "publicKey": "YW55LXB1YmxpYy1rZXk=",
						  "algorithm": 1
						},
						"extraField": "extraValue"
					}
				}
				`)),
			},
			err:         nil,
			expectedURL: "https://api.superblocks.com/api/v3/apis/applications/app-id/commits/commit-id/%2Fpages%2FPage%202%2Fapis%2FTestApi1%2Fapi.json?hydrate=true",
		},
		{
			name: "signed api, no algorithm public key",
			request: &apiv1.ExecuteRequest_FetchByPath{
				Path:          "/pages/Page 2/apis/TestApi1/api.json",
				ApplicationId: proto.String("app-id"),
				BranchName:    proto.String("jdoe/test-branch"),
			},
			expectedDef: &apiv1.Definition{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id:           "00000000-0000-0000-0000-000000000001",
						Organization: "org-id",
						Name:         "TestApi1",
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
						"name":         "TestApi1",
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
						  "name": "TestApi1"
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
			expectedURL: "https://api.superblocks.com/api/v3/apis/applications/app-id/branches/jdoe%2Ftest-branch/%2Fpages%2FPage%202%2Fapis%2FTestApi1%2Fapi.json?hydrate=true",
		},
		{
			name: "timed out, nil response",
			request: &apiv1.ExecuteRequest_FetchByPath{
				Path:          "/pages/Page 2/apis/TestApi1/api.json",
				ApplicationId: proto.String("app-id"),
				CommitId:      proto.String("commit-id"),
			},
			expectedURL: "https://api.superblocks.com/api/v3/apis/applications/app-id/commits/commit-id/%2Fpages%2FPage%202%2Fapis%2FTestApi1%2Fapi.json?hydrate=true",
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

			actual, actualRaw, err := fetcher.FetchApiByPath(context.Background(), test.request, false)

			if test.err != nil {
				assert.Error(t, err, test.name)
			} else {
				assert.NoError(t, err, test.name)
				utils.AssertProtoEqual(t, test.expectedDef, actual)
				utils.AssertProtoEqual(t, expectedRaw, actualRaw)
			}

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
		name     string
		response *http.Response
		err      error

		expectedScheduledJobs    *transportv1.FetchScheduleJobResp
		expectedRawScheduledJobs map[string]any
		expectedErr              error
	}{
		{
			name: "normal",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
				{
					"apis": [
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
						},
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
								  "data": "YXBpLXNpZ25hdHVyZQ==",
								  "publicKey": "YW55LXB1YmxpYy1rZXk=",
								  "algorithm": 1
								},
								"extraField": "extraValue"
							}
						},
						{
							"api": {
								"metadata": {
									"id": "00000000-0000-0000-0000-000000000002",
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
					]
				}
				`)),
			},
			expectedScheduledJobs: &transportv1.FetchScheduleJobResp{
				Apis: []*apiv1.Definition{
					{
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
					{
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
								KeyId:     "key-id",
								Data:      []byte("api-signature"),
								PublicKey: []byte("any-public-key"),
								Algorithm: pbutils.Signature_ALGORITHM_ED25519,
							},
						},
					},
					{
						Api: &apiv1.Api{
							Metadata: &commonv1.Metadata{
								Id:           "00000000-0000-0000-0000-000000000002",
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
				},
			},
			expectedRawScheduledJobs: map[string]any{
				"apis": []any{
					map[string]any{
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
					map[string]any{
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
								"keyId":     "key-id",
								"data":      "api-signature",
								"publicKey": "any-public-key",
								"algorithm": 1,
							},
							"extraField": "extraValue",
						},
					},
					map[string]any{
						"api": map[string]any{
							"metadata": map[string]any{
								"id":           "00000000-0000-0000-0000-000000000002",
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
				},
			},
		},
		{
			name: "empty apis",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
				{
					"apis": []
				}
				`)),
			},
			expectedScheduledJobs: &transportv1.FetchScheduleJobResp{
				Apis: []*apiv1.Definition{},
			},
			expectedRawScheduledJobs: map[string]any{
				"apis": []any{},
			},
		},
		{
			name: "empty response",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{}`)),
			},
			expectedScheduledJobs:    &transportv1.FetchScheduleJobResp{},
			expectedRawScheduledJobs: map[string]any{},
		},
		{
			name: "malformed response",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body: io.NopCloser(strings.NewReader(`
				{
					"apis": {
						"name": "Invalid top level apis type"
					}
				}
				`)),
			},
			expectedErr: &errors.InternalError{},
		},
		{
			name: "timed out, nil response",
			err: &commonv1.Error{
				Message: "context deadline exceeded",
			},
			expectedErr: &errors.InternalError{},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockHttpClient := mocks.NewHttpClient(t)
			mockHttpClient.On("Do", mock.Anything).Return(test.response, test.err)

			var expectedRaw *structpb.Struct
			if test.expectedRawScheduledJobs != nil {
				var err error
				expectedRaw, err = structpb.NewStruct(test.expectedRawScheduledJobs)
				require.NoError(t, err)
			}

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL: "https://foo.bar.com",
				Headers: map[string]string{
					"x-superblocks-agent-id": "foobar",
				},
				Client:              mockHttpClient,
				SuperblocksAgentKey: "foobar",
			})

			fetcher := New(&Options{
				Logger:       zap.NewNop(),
				ServerClient: serverClient,
			}).(*fetcher)

			actual, actualRaw, err := fetcher.FetchScheduledJobs(context.Background())

			assert.Equal(t, test.expectedErr, err)
			utils.AssertProtoEqual(t, test.expectedScheduledJobs, actual)
			utils.AssertProtoEqual(t, expectedRaw, actualRaw)

			expectedRequestHeaders := http.Header{}
			expectedRequestHeaders.Set("x-superblocks-agent-key", "foobar")
			expectedRequestHeaders.Set("x-superblocks-agent-id", "foobar")

			mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
			request := mockHttpClient.Calls[0].Arguments[0].(*http.Request)

			assert.Equal(t, http.MethodPost, request.Method)
			assert.Equal(t, expectedRequestHeaders, request.Header)
			assert.Equal(t, "https://foo.bar.com/api/v2/agents/pending-jobs", request.URL.String())
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

func TestFetchApiCode(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name            string
		applicationId   string
		entryPoint      string
		commitId        string
		branchName      string
		metadata        map[string]string
		useAgentKey     bool
		response        *http.Response
		httpErr         error
		expectedBundle  *ApiCodeBundle
		expectError     bool
		expectedURL     string
		expectedHeaders http.Header
	}{
		{
			name:          "success with commitId only",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			metadata: map[string]string{
				"authorization":               "Bearer user-token",
				"x-superblocks-authorization": "Bearer sb-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"const x = 1;"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "const x = 1;"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-123/code?commitId=commit-abc&entryPoint=main.ts",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": {"Bearer sb-token"},
			},
		},
		{
			name:          "success with branchName",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			branchName:    "feature/code-mode",
			metadata: map[string]string{
				"authorization": "Bearer user-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"const y = 2;"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "const y = 2;"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-123/branches/feature%2Fcode-mode/code?entryPoint=main.ts",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": []string(nil),
			},
		},
		{
			name:          "success with neither commitId nor branchName (live-edit default branch)",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			metadata: map[string]string{
				"authorization": "Bearer user-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"const default = 1;"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "const default = 1;"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-123/code?entryPoint=main.ts",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": []string(nil),
			},
		},
		{
			name:          "success with both commitId and branchName",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			branchName:    "feature/code-mode",
			metadata: map[string]string{
				"authorization": "Bearer user-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"const z = 3;"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "const z = 3;"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-123/code?commitId=commit-abc&entryPoint=main.ts",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": []string(nil),
			},
		},
		{
			name:          "nil response returns error",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			response:      nil,
			httpErr:       fmt.Errorf("connection refused"),
			expectError:   true,
		},
		{
			name:          "HTTP error status returns error",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			response: &http.Response{
				StatusCode: http.StatusNotFound,
				Body:       io.NopCloser(strings.NewReader(`{"error":"not found"}`)),
			},
			expectError: true,
		},
		{
			name:          "malformed JSON returns error",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`not json`)),
			},
			expectError: true,
		},
		{
			name:          "with agent key",
			applicationId: "app-456",
			entryPoint:    "index.ts",
			commitId:      "commit-xyz",
			useAgentKey:   true,
			metadata: map[string]string{
				"authorization": "Bearer user-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"agent-key-bundle"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "agent-key-bundle"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-456/code?commitId=commit-xyz&entryPoint=index.ts",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Agent-Key":     {"foobar"},
				"X-Superblocks-Authorization": []string(nil),
			},
		},
		{
			name:          "empty entryPoint omits param from URL",
			applicationId: "app-123",
			entryPoint:    "",
			commitId:      "commit-abc",
			metadata: map[string]string{
				"authorization": "Bearer user-token",
			},
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"bundle":"no-entry-point"}`)),
			},
			expectedBundle: &ApiCodeBundle{Bundle: "no-entry-point"},
			expectError:    false,
			expectedURL:    "https://api.superblocks.com/api/v3/applications/app-123/code?commitId=commit-abc",
			expectedHeaders: http.Header{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": []string(nil),
			},
		},
		{
			name:          "body read failure returns error",
			applicationId: "app-123",
			entryPoint:    "main.ts",
			commitId:      "commit-abc",
			response: &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(&errorReader{}),
			},
			expectError: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockHttpClient := mocks.NewHttpClient(t)
			mockHttpClient.On("Do", mock.Anything).Return(test.response, test.httpErr)

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL:                 "https://api.superblocks.com",
				Client:              mockHttpClient,
				SuperblocksAgentKey: "foobar",
			})

			f := New(&Options{
				Logger:       zap.NewNop(),
				ServerClient: serverClient,
			})

			md := metadata.MD{}
			for k, v := range test.metadata {
				md.Set(k, v)
			}
			ctx := metadata.NewIncomingContext(context.Background(), md)

			bundle, err := f.FetchApiCode(ctx, test.applicationId, test.entryPoint, test.commitId, test.branchName, test.useAgentKey)

			if test.expectError {
				assert.Error(t, err)
				assert.Nil(t, bundle)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, test.expectedBundle, bundle)

			mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
			req := mockHttpClient.Calls[0].Arguments[0].(*http.Request)
			assert.Equal(t, http.MethodGet, req.Method)
			assert.Equal(t, test.expectedURL, req.URL.String())
			for key, expected := range test.expectedHeaders {
				assert.Equal(t, expected, req.Header[key], "header %s", key)
			}
		})
	}
}

func TestValidateProfile(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name            string
		request         *integrationv1.ValidateProfileRequest
		metadata        metadata.MD
		response        *http.Response
		err             error
		expectError     bool
		expectedQuery   url.Values
		expectedHeaders map[string][]string
	}{
		{
			name: "successful validation with HTTP 204",
			request: &integrationv1.ValidateProfileRequest{
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
					Id:   utils.Pointer("profile-id"),
				},
				ViewMode:       "editor",
				IntegrationIds: []string{"integration-1", "integration-2"},
			},
			metadata: metadata.MD{
				"authorization":               []string{"Bearer user-token"},
				"x-superblocks-authorization": []string{"Bearer sb-token"},
			},
			response: &http.Response{
				StatusCode: http.StatusNoContent,
				Body:       io.NopCloser(strings.NewReader("")),
			},
			expectError: false,
			expectedQuery: url.Values{
				"profile":       []string{"production"},
				"profileId":     []string{"profile-id"},
				"viewMode":      []string{"editor"},
				"integrationId": []string{"integration-1", "integration-2"},
			},
			expectedHeaders: map[string][]string{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": {"Bearer sb-token"},
			},
		},
		{
			name: "successful validation without profile ID",
			request: &integrationv1.ValidateProfileRequest{
				Profile: &commonv1.Profile{
					Name: utils.Pointer("staging"),
				},
				ViewMode:       "preview",
				IntegrationIds: []string{"integration-1"},
			},
			metadata: metadata.MD{
				"authorization": []string{"Bearer user-token"},
			},
			response: &http.Response{
				StatusCode: http.StatusNoContent,
				Body:       io.NopCloser(strings.NewReader("")),
			},
			expectError: false,
			expectedQuery: url.Values{
				"profile":       []string{"staging"},
				"viewMode":      []string{"preview"},
				"integrationId": []string{"integration-1"},
			},
			expectedHeaders: map[string][]string{
				"Authorization":               {"Bearer user-token"},
				"X-Superblocks-Authorization": nil,
			},
		},
		{
			name: "validation failure - 403 forbidden",
			request: &integrationv1.ValidateProfileRequest{
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
				},
				ViewMode:       "deployed",
				IntegrationIds: []string{"integration-1"},
			},
			metadata: metadata.MD{
				"authorization": []string{"Bearer user-token"},
			},
			response: &http.Response{
				StatusCode: http.StatusForbidden,
				Body:       io.NopCloser(strings.NewReader(`{"message": "profile validation failed"}`)),
			},
			expectError: true,
		},
		{
			name: "validation failure - network error",
			request: &integrationv1.ValidateProfileRequest{
				Profile: &commonv1.Profile{
					Name: utils.Pointer("production"),
				},
				ViewMode:       "editor",
				IntegrationIds: []string{"integration-1"},
			},
			metadata: metadata.MD{
				"authorization": []string{"Bearer user-token"},
			},
			err:         &errors.InternalError{Err: fmt.Errorf("network error")},
			expectError: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockServerClient := mocks.NewServerClient(t)

			// Set up mock expectation
			mockServerClient.On("ValidateProfile",
				mock.Anything, // ctx
				mock.Anything, // timeout
				mock.Anything, // headers
				mock.Anything, // query
			).Return(test.response, test.err)

			fetcher := &fetcher{
				serverClient: mockServerClient,
				logger:       zap.NewNop(),
			}

			ctx := context.Background()
			if test.metadata != nil {
				ctx = metadata.NewIncomingContext(ctx, test.metadata)
			}

			err := fetcher.ValidateProfile(ctx, test.request)

			if test.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			// Verify the mock was called
			mockServerClient.AssertExpectations(t)
		})
	}
}
