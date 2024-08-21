package transport

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
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
