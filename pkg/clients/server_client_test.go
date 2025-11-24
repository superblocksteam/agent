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
