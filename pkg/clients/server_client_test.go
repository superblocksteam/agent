package clients

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetApplicationCode(t *testing.T) {
	for _, test := range []struct {
		name          string
		applicationId string
		branchName    string
		commitId      string
		query         url.Values
		expectedPath  string
	}{
		{
			name:          "commitId only uses base path",
			applicationId: "app-123",
			commitId:      "commit-abc",
			branchName:    "",
			query:         url.Values{"entryPoint": []string{"main.ts"}},
			expectedPath:  "/api/v3/applications/app-123/code",
		},
		{
			name:          "branchName only uses branch path",
			applicationId: "app-123",
			commitId:      "",
			branchName:    "feature/code-mode",
			query:         url.Values{"entryPoint": []string{"main.ts"}},
			expectedPath:  "/api/v3/applications/app-123/branches/feature%2Fcode-mode/code",
		},
		{
			name:          "both commitId and branchName uses base path",
			applicationId: "app-123",
			commitId:      "commit-abc",
			branchName:    "feature/code-mode",
			query:         url.Values{"entryPoint": []string{"main.ts"}},
			expectedPath:  "/api/v3/applications/app-123/code",
		},
		{
			name:          "no branchName no commitId uses base path",
			applicationId: "app-456",
			commitId:      "",
			branchName:    "",
			query:         url.Values{"entryPoint": []string{"index.ts"}},
			expectedPath:  "/api/v3/applications/app-456/code",
		},
		{
			name:          "branch name with slash is escaped",
			applicationId: "app-789",
			commitId:      "",
			branchName:    "ts/my-branch",
			query:         url.Values{},
			expectedPath:  "/api/v3/applications/app-789/branches/ts%2Fmy-branch/code",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// RawPath is only set when the path contains encoded chars; fall back to Path.
				actualPath := r.URL.RawPath
				if actualPath == "" {
					actualPath = r.URL.Path
				}
				assert.Equal(t, test.expectedPath, actualPath)
				assert.Equal(t, http.MethodGet, r.Method)
				for k, v := range test.query {
					assert.Equal(t, v, r.URL.Query()[k], "query param %s", k)
				}
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"bundle":"ok"}`))
			}))
			defer server.Close()

			client := NewServerClient(&ServerClientOptions{URL: server.URL})
			resp, err := client.GetApplicationCode(
				context.Background(), nil, http.Header{}, test.query,
				test.applicationId, test.branchName, test.commitId, false,
			)

			require.NoError(t, err)
			require.NotNil(t, resp)
			assert.Equal(t, http.StatusOK, resp.StatusCode)
			resp.Body.Close()
		})
	}
}

func TestValidateProfile(t *testing.T) {
	tests := []struct {
		name               string
		query              url.Values
		expectedPath       string
		expectedStatusCode int
		serverResponse     func(w http.ResponseWriter, r *http.Request)
	}{
		{
			name: "successful validation",
			query: url.Values{
				"profile":       []string{"production"},
				"viewMode":      []string{"editor"},
				"integrationId": []string{"integration-1", "integration-2"},
			},
			expectedPath:       "/api/v3/profiles/validate",
			expectedStatusCode: http.StatusNoContent,
			serverResponse: func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/api/v3/profiles/validate", r.URL.Path)
				assert.Equal(t, http.MethodPost, r.Method)
				assert.Equal(t, "production", r.URL.Query().Get("profile"))
				assert.Equal(t, "editor", r.URL.Query().Get("viewMode"))
				assert.ElementsMatch(t, []string{"integration-1", "integration-2"}, r.URL.Query()["integrationId"])
				w.WriteHeader(http.StatusNoContent)
			},
		},
		{
			name: "validation with profile ID",
			query: url.Values{
				"profile":       []string{"staging"},
				"profileId":     []string{"profile-id-123"},
				"viewMode":      []string{"deployed"},
				"integrationId": []string{"integration-1"},
			},
			expectedPath:       "/api/v3/profiles/validate",
			expectedStatusCode: http.StatusNoContent,
			serverResponse: func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/api/v3/profiles/validate", r.URL.Path)
				assert.Equal(t, "staging", r.URL.Query().Get("profile"))
				assert.Equal(t, "profile-id-123", r.URL.Query().Get("profileId"))
				assert.Equal(t, "deployed", r.URL.Query().Get("viewMode"))
				w.WriteHeader(http.StatusNoContent)
			},
		},
		{
			name: "validation failure",
			query: url.Values{
				"profile":       []string{"production"},
				"viewMode":      []string{"editor"},
				"integrationId": []string{"integration-1"},
			},
			expectedPath:       "/api/v3/profiles/validate",
			expectedStatusCode: http.StatusForbidden,
			serverResponse: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(`{"message": "profile validation failed"}`))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test server
			server := httptest.NewServer(http.HandlerFunc(tt.serverResponse))
			defer server.Close()

			// Create the server client
			client := NewServerClient(&ServerClientOptions{
				URL: server.URL,
			})

			// Call ValidateProfile
			resp, err := client.ValidateProfile(context.Background(), nil, http.Header{}, tt.query)

			// Verify response
			require.NoError(t, err)
			require.NotNil(t, resp)
			assert.Equal(t, tt.expectedStatusCode, resp.StatusCode)
			resp.Body.Close()
		})
	}
}
