package transport

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/stretchr/testify/require"

	"google.golang.org/protobuf/types/known/structpb"

	"github.com/stretchr/testify/assert"
	utils "github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func TestHackUntilWeHaveGoKit(t *testing.T) {
	for _, test := range []struct {
		name         string
		beforeURL    string
		afterURL     string
		method       string
		headers      map[string][]string
		body         string
		expectedBody map[string]interface{}
		expectedErr  string
	}{
		{
			name:      "v1 workflow (auth in query)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001?sb-auth=token&test=true&environment=environment&profile=profile&profileId=profileId",
			afterURL:  "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001?fetch.profile.environment=environment&fetch.profile.id=profileId&fetch.profile.name=profile&fetch.test=true&fetch.token=Bearer+token",
			headers:   map[string][]string{},
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body":   map[string]interface{}{},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"token": "Bearer token",
					"profile": map[string]interface{}{
						"environment": "environment",
						"id":          "profileId",
						"name":        "profile",
					},
					"test":     true,
					"viewMode": "VIEW_MODE_EDIT",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v2 workflow (auth in header)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?test=true&environment=environment&profile=profile&profileId=profileId",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?fetch.profile.environment=environment&fetch.profile.id=profileId&fetch.profile.name=profile&fetch.test=true&fetch.token=Bearer+token",
			headers: map[string][]string{
				"Authorization": {"Bearer token"},
				"foo":           {"bar"},
			},
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body":   map[string]interface{}{},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"token": "Bearer token",
					"profile": map[string]interface{}{
						"environment": "environment",
						"id":          "profileId",
						"name":        "profile",
					},
					"test":     true,
					"viewMode": "VIEW_MODE_EDIT",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "x-www-form-url-encoded",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/x-www-form-urlencoded"},
			},
			body: "b=2",
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						"b": "2",
					},
					"params": map[string]interface{}{
						"a": "1",
					},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v2: x-www-form-url-encoded but data is actually json (should parse incorrectly)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/x-www-form-urlencoded"},
			},
			body: `{"b": "2"}`,
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						`{"b": "2"}`: "",
					},
					"params": map[string]interface{}{
						"a": "1",
					},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v1: x-www-form-url-encoded but data is actually json (very common case)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/x-www-form-urlencoded"},
			},
			body: `{"b": "2"}`,
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						"b": "2",
					},
					"params": map[string]interface{}{
						"a": "1",
					},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v1 actually x-www-form-url-encoded",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001",
			afterURL:  "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001",
			headers: map[string][]string{
				"Content-Type": {"application/x-www-form-urlencoded"},
			},
			body: "b=2",
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						"b": "2",
					},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "application/json",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body: `{"b": "2"}`,
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						"b": "2",
					},
					"params": map[string]interface{}{
						"a": "1",
					},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "application/json with charset",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/json; charset=utf-8"},
			},
			body: `{"b": "2"}`,
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body": map[string]interface{}{
						"b": "2",
					},
					"params": map[string]interface{}{
						"a": "1",
					},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v2: application/json but data is actually x-www-form-url-encoded (should parse incorrectly)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:        `b=2`,
			expectedErr: "could not parse body with content-type 'application/json', err: invalid character 'b' looking for beginning of value\n",
		},
		{
			name:      "v1: application/json but data is actually x-www-form-url-encoded (should parse incorrectly)",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v1/workflows/00000000-0000-0000-0000-000000000001?a=1",
			afterURL:  "https://api.superblocks.com/v2/workflows/00000000-0000-0000-0000-000000000001?a=1",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:        `b=2`,
			expectedErr: "could not parse body with content-type 'application/json', err: invalid character 'b' looking for beginning of value\n",
		},
		{
			name:      "v2: url encoded empty body",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001",
			headers: map[string][]string{
				"Content-Type": {"application/x-www-form-urlencoded"},
			},
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body":   map[string]interface{}{},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "v2: json empty body",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body: "",
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body":   map[string]interface{}{},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{},
			},
		},
		{
			name:      "include events",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?options.include_event_outputs=true&options.include_events=true",
			afterURL:  "https://api.superblocks.com/v2/execute/00000000-0000-0000-0000-000000000001?options.include_event_outputs=true&options.include_events=true",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body: "",
			expectedBody: map[string]interface{}{
				"inputs": map[string]interface{}{
					"body":   map[string]interface{}{},
					"params": map[string]interface{}{},
				},
				"fetch": map[string]interface{}{
					"profile":  map[string]interface{}{},
					"viewMode": "VIEW_MODE_DEPLOYED",
				},
				"options": map[string]interface{}{
					"includeEventOutputs": true,
					"includeEvents":       true,
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			request, err := http.NewRequest(test.method, test.beforeURL, strings.NewReader(test.body))
			assert.NoError(t, err, test.name)

			request.Header = http.Header(test.headers)

			responseRecorder := httptest.NewRecorder()

			HackUntilWeHaveGoKit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, test.afterURL, r.URL.String())
				body, _ := io.ReadAll(r.Body)
				if test.expectedBody != nil {
					bs, _ := json.Marshal(test.expectedBody)
					assert.JSONEq(t, string(bs), string(body))
				}
			})).ServeHTTP(responseRecorder, request)

			body, _ := io.ReadAll(responseRecorder.Body)

			if test.expectedErr != "" {
				assert.Equal(t, test.expectedErr, string(body))
			}
		})
	}
}

func TestTransformWorkflowRequest(t *testing.T) {
	for _, tc := range []struct {
		name                   string
		httpRequest            *http.Request
		version                string
		expectedExecuteRequest *apiv1.ExecuteRequest
		expectError            bool
	}{
		{
			name: "happy path",
			httpRequest: &http.Request{
				Method: http.MethodPost,
				URL:    &url.URL{Path: "/foo/bar", RawQuery: ""},
			},
			version: "v2",
			expectedExecuteRequest: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Inputs: map[string]*structpb.Value{
					"body":   structpb.NewStructValue(&structpb.Struct{}),
					"params": structpb.NewStructValue(&structpb.Struct{}),
				},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						Profile:  &commonv1.Profile{},
					},
				},
			},
		},
		{
			name: "with query param fetch.token",
			httpRequest: &http.Request{
				Method: http.MethodPost,
				URL:    &url.URL{Path: "/foo/bar", RawQuery: "fetch.token=foo"},
			},
			version: "v2",
			expectedExecuteRequest: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Inputs: map[string]*structpb.Value{
					"body":   structpb.NewStructValue(&structpb.Struct{}),
					"params": structpb.NewStructValue(&structpb.Struct{}),
				},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						Token:    proto.String("foo"),
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						Profile:  &commonv1.Profile{},
					},
				},
			},
		},
		{
			name: "with query param fetch.profile.environment",
			httpRequest: &http.Request{
				Method: http.MethodPost,
				URL:    &url.URL{Path: "/foo/bar", RawQuery: "fetch.profile.environment=foo"},
			},
			version: "v2",
			expectedExecuteRequest: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Inputs: map[string]*structpb.Value{
					"body":   structpb.NewStructValue(&structpb.Struct{}),
					"params": structpb.NewStructValue(&structpb.Struct{}),
				},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						Profile: &commonv1.Profile{
							Environment: proto.String("foo"),
						},
					},
				},
			},
		},
		{
			name: "with header X-Superblocks-Branch",
			httpRequest: &http.Request{
				Method: http.MethodPost,
				URL:    &url.URL{Path: "/foo/bar"},
				Header: http.Header{
					"X-Superblocks-Branch": []string{"foo"},
				},
			},
			version: "v2",
			expectedExecuteRequest: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Inputs: map[string]*structpb.Value{
					"body":   structpb.NewStructValue(&structpb.Struct{}),
					"params": structpb.NewStructValue(&structpb.Struct{}),
				},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode:   apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						Profile:    &commonv1.Profile{},
						BranchName: proto.String("foo"),
					},
				},
			},
		},
		{
			name: "with multiple query params",
			httpRequest: &http.Request{
				Method: http.MethodPost,
				URL:    &url.URL{Path: "/foo/bar", RawQuery: "fetch.profile.environment=foo&fetch.profile.id=bar"},
			},
			version: "v2",
			expectedExecuteRequest: &apiv1.ExecuteRequest{
				Options: &apiv1.ExecuteRequest_Options{},
				Inputs: map[string]*structpb.Value{
					"body":   structpb.NewStructValue(&structpb.Struct{}),
					"params": structpb.NewStructValue(&structpb.Struct{}),
				},
				Request: &apiv1.ExecuteRequest_Fetch_{
					Fetch: &apiv1.ExecuteRequest_Fetch{
						ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
						Profile: &commonv1.Profile{
							Environment: proto.String("foo"),
							Id:          proto.String("bar"),
						},
					},
				},
			},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := transformWorkflowRequest(tc.httpRequest, tc.version)
			require.NoError(t, err)

			bodyBytes, err := io.ReadAll(tc.httpRequest.Body)
			require.NoError(t, err)
			defer tc.httpRequest.Body.Close()

			actualExecuteRequest := &apiv1.ExecuteRequest{}
			err = protojson.Unmarshal(bodyBytes, actualExecuteRequest)
			require.NoError(t, err)

			utils.ProtoEquals(t, tc.expectedExecuteRequest, actualExecuteRequest)
		})
	}
}
