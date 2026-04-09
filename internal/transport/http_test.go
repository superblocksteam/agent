package transport

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/superblocksteam/agent/pkg/testutils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

type executeV3CaptureServer struct {
	apiv1.UnimplementedExecutorServiceServer
	req *apiv1.ExecuteV3Request
}

func (s *executeV3CaptureServer) ExecuteV3(_ context.Context, req *apiv1.ExecuteV3Request) (*apiv1.AwaitResponse, error) {
	s.req = req
	return &apiv1.AwaitResponse{}, nil
}

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
		{
			name:      "viewMode query param transformation - editor",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute?viewMode=editor",
			afterURL:  "https://api.superblocks.com/v2/execute?fetch.view_mode=1&fetch_by_path.view_mode=1&view_mode=1",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:         "",
			expectedBody: nil, // grpc-gateway handles this, not our middleware
		},
		{
			name:      "viewMode query param transformation - preview",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute?viewMode=preview",
			afterURL:  "https://api.superblocks.com/v2/execute?fetch.view_mode=2&fetch_by_path.view_mode=2&view_mode=2",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:         "",
			expectedBody: nil,
		},
		{
			name:      "viewMode query param transformation - deployed",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute?viewMode=deployed",
			afterURL:  "https://api.superblocks.com/v2/execute?fetch.view_mode=3&fetch_by_path.view_mode=3&view_mode=3",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:         "",
			expectedBody: nil,
		},
		{
			name:      "viewMode with integrationId query params",
			method:    http.MethodPost,
			beforeURL: "https://api.superblocks.com/v2/execute?viewMode=editor&integrationId=int-1&integrationId=int-2",
			afterURL:  "https://api.superblocks.com/v2/execute?fetch.view_mode=1&fetch_by_path.view_mode=1&integrationId=int-1&integrationId=int-2&view_mode=1",
			headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
			body:         "",
			expectedBody: nil,
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

func TestGrpcGatewayExecuteV3PreservesExportNameFromJsonBody(t *testing.T) {
	server := &executeV3CaptureServer{}
	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.HTTPBodyMarshaler{
			Marshaler: &runtime.JSONPb{
				MarshalOptions: protojson.MarshalOptions{
					UseProtoNames:   false,
					EmitUnpopulated: false,
					AllowPartial:    true,
				},
				UnmarshalOptions: protojson.UnmarshalOptions{
					DiscardUnknown: true,
				},
			},
		}),
	)
	require.NoError(t, apiv1.RegisterExecutorServiceHandlerServer(context.Background(), mux, server))

	body := `{"applicationId":"c25dd4d6-789e-40c9-a480-af09dee0c0c3","inputs":{"status":null},"viewMode":"editor","entryPoint":"server/apis/mock.ts","exportName":"ListOrders","profile":{"id":"861212e5-45ec-4f82-8881-79653b4baab5","name":"Staging"},"includeDiagnostics":true}`
	req := httptest.NewRequest(http.MethodPost, "http://localhost/v3/execute", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
	require.NotNil(t, server.req)
	assert.Equal(t, "c25dd4d6-789e-40c9-a480-af09dee0c0c3", server.req.GetApplicationId())
	assert.Equal(t, "server/apis/mock.ts", server.req.GetEntryPoint())
	assert.Equal(t, "ListOrders", server.req.GetExportName())
	assert.Equal(t, "861212e5-45ec-4f82-8881-79653b4baab5", server.req.GetProfile().GetId())
	assert.Equal(t, "Staging", server.req.GetProfile().GetName())
	assert.True(t, server.req.GetIncludeDiagnostics())
}

func TestExecuteV3ProtojsonUnmarshalIncludesExportName(t *testing.T) {
	var req apiv1.ExecuteV3Request
	body := `{"applicationId":"c25dd4d6-789e-40c9-a480-af09dee0c0c3","inputs":{"status":null},"viewMode":"VIEW_MODE_EDIT","entryPoint":"server/apis/mock.ts","exportName":"ListOrders","profile":{"id":"861212e5-45ec-4f82-8881-79653b4baab5","name":"Staging"},"includeDiagnostics":true}`

	err := protojson.UnmarshalOptions{
		DiscardUnknown: true,
	}.Unmarshal([]byte(body), &req)

	require.NoError(t, err)
	assert.Equal(t, "server/apis/mock.ts", req.GetEntryPoint())
	assert.Equal(t, "ListOrders", req.GetExportName())
}

func TestExecuteV3ProtojsonMarshalIncludesExportName(t *testing.T) {
	exportName := "ListOrders"
	entryPoint := "server/apis/mock.ts"
	req := &apiv1.ExecuteV3Request{
		ApplicationId: "c25dd4d6-789e-40c9-a480-af09dee0c0c3",
		ViewMode:      apiv1.ViewMode_VIEW_MODE_EDIT,
		EntryPoint:    &entryPoint,
		ExportName:    &exportName,
	}

	data, err := protojson.Marshal(req)

	require.NoError(t, err)
	assert.Contains(t, string(data), `"entryPoint":"server/apis/mock.ts"`)
	assert.Contains(t, string(data), `"exportName":"ListOrders"`)
}

func TestInjectViewModeIntoBody(t *testing.T) {
	tests := []struct {
		name          string
		url           string
		body          string
		expectedBody  map[string]interface{}
		expectedError string
	}{
		{
			name: "no view_mode query param - no injection",
			url:  "/v2/execute",
			body: `{"definition": {"api": {"metadata": {"id": "test"}}}}`,
			expectedBody: map[string]interface{}{
				"definition": map[string]interface{}{
					"api": map[string]interface{}{
						"metadata": map[string]interface{}{
							"id": "test",
						},
					},
				},
			},
		},
		{
			name: "view_mode with inline definition - inject",
			url:  "/v2/execute?view_mode=1",
			body: `{"definition": {"api": {"metadata": {"id": "test"}}}}`,
			expectedBody: map[string]interface{}{
				"definition": map[string]interface{}{
					"api": map[string]interface{}{
						"metadata": map[string]interface{}{
							"id": "test",
						},
					},
				},
				"view_mode": float64(1),
			},
		},
		{
			name: "view_mode without definition - no injection",
			url:  "/v2/execute?view_mode=1",
			body: `{"fetch": {"id": "test"}}`,
			expectedBody: map[string]interface{}{
				"fetch": map[string]interface{}{
					"id": "test",
				},
			},
		},
		{
			name: "view_mode with null definition - no injection",
			url:  "/v2/execute?view_mode=1",
			body: `{"definition": null}`,
			expectedBody: map[string]interface{}{
				"definition": nil,
			},
		},
		{
			name:         "view_mode with empty body",
			url:          "/v2/execute?view_mode=1",
			body:         "",
			expectedBody: nil, // empty body is left untouched
		},
		{
			name:          "invalid view_mode value",
			url:           "/v2/execute?view_mode=invalid",
			body:          `{"definition": {"api": {"metadata": {"id": "test"}}}}`,
			expectedError: "invalid view_mode value",
		},
		{
			name:         "invalid JSON body",
			url:          "/v2/execute?view_mode=1",
			body:         `{invalid json}`,
			expectedBody: nil, // invalid JSON is left untouched so downstream returns a proper error
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodPost, tt.url, strings.NewReader(tt.body))
			require.NoError(t, err)

			err = injectViewModeIntoBody(req)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				return
			}

			require.NoError(t, err)

			if tt.expectedBody != nil {
				bodyBytes, err := io.ReadAll(req.Body)
				require.NoError(t, err)

				var actualBody map[string]interface{}
				err = json.Unmarshal(bodyBytes, &actualBody)
				require.NoError(t, err)

				assert.Equal(t, tt.expectedBody, actualBody)
			}
		})
	}
}

func TestInjectViewModeIntoBody_NormalizesStringViewMode(t *testing.T) {
	tests := []struct {
		name         string
		body         string
		expectedBody map[string]interface{}
	}{
		{
			name:         "string 'deployed' is converted to numeric 3",
			body:         `{"applicationId":"app-1","viewMode":"deployed","entryPoint":"server/apis/test.ts"}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1", "viewMode": float64(3), "entryPoint": "server/apis/test.ts"},
		},
		{
			name:         "string 'editor' is converted to numeric 1",
			body:         `{"applicationId":"app-1","viewMode":"editor"}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1", "viewMode": float64(1)},
		},
		{
			name:         "string 'preview' is converted to numeric 2",
			body:         `{"applicationId":"app-1","viewMode":"preview"}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1", "viewMode": float64(2)},
		},
		{
			name:         "numeric viewMode is left unchanged",
			body:         `{"applicationId":"app-1","viewMode":3}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1", "viewMode": float64(3)},
		},
		{
			name:         "missing viewMode is left unchanged",
			body:         `{"applicationId":"app-1"}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1"},
		},
		{
			name:         "empty body is left unchanged",
			body:         "",
			expectedBody: nil,
		},
		{
			name:         "unknown string viewMode is left as-is",
			body:         `{"applicationId":"app-1","viewMode":"unknown"}`,
			expectedBody: map[string]interface{}{"applicationId": "app-1", "viewMode": "unknown"},
		},
		{
			name:         "invalid JSON body is left untouched",
			body:         `{not valid json}`,
			expectedBody: nil, // can't parse, so just check no error
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodPost, "/v3/execute", strings.NewReader(tt.body))
			require.NoError(t, err)

			err = injectViewModeIntoBody(req)
			require.NoError(t, err)

			bodyBytes, err := io.ReadAll(req.Body)
			require.NoError(t, err)

			if tt.expectedBody != nil {
				var actualBody map[string]interface{}
				err = json.Unmarshal(bodyBytes, &actualBody)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedBody, actualBody)
			}
		})
	}
}

func TestHackUntilWeHaveGoKit_V3NormalizesStringViewMode(t *testing.T) {
	for _, tc := range []struct {
		name             string
		body             string
		expectedViewMode float64
	}{
		{
			name:             "string 'deployed' normalized to 3",
			body:             `{"applicationId":"app-1","viewMode":"deployed","entryPoint":"server/apis/test.ts"}`,
			expectedViewMode: 3,
		},
		{
			name:             "string 'editor' normalized to 1",
			body:             `{"applicationId":"app-1","viewMode":"editor","entryPoint":"server/apis/test.ts"}`,
			expectedViewMode: 1,
		},
		{
			name:             "string 'preview' normalized to 2",
			body:             `{"applicationId":"app-1","viewMode":"preview","entryPoint":"server/apis/test.ts"}`,
			expectedViewMode: 2,
		},
		{
			name:             "numeric 3 left unchanged",
			body:             `{"applicationId":"app-1","viewMode":3,"entryPoint":"server/apis/test.ts"}`,
			expectedViewMode: 3,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			request, err := http.NewRequest(http.MethodPost, "https://api.superblocks.com/v3/execute", strings.NewReader(tc.body))
			require.NoError(t, err)
			request.Header.Set("Content-Type", "application/json")

			responseRecorder := httptest.NewRecorder()

			HackUntilWeHaveGoKit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				var bodyMap map[string]interface{}
				err := json.Unmarshal(body, &bodyMap)
				require.NoError(t, err)
				assert.Equal(t, tc.expectedViewMode, bodyMap["viewMode"])
			})).ServeHTTP(responseRecorder, request)
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

			testutils.ProtoEquals(t, tc.expectedExecuteRequest, actualExecuteRequest)
		})
	}
}
