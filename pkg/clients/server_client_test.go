package clients

import (
	"context"
	"encoding/json"
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

func TestPostClaimDatabaseLifecycleDispatches(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api/v1/database-lifecycle/dispatches/claim", r.URL.Path)
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "agent-key", r.Header.Get("x-superblocks-agent-key"))
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))

		var body map[string]string
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		assert.Equal(t, "agent-1", body["agentId"])
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[]}`))
	}))
	defer server.Close()

	client := NewServerClient(&ServerClientOptions{
		URL:                 server.URL,
		SuperblocksAgentKey: "agent-key",
	})

	resp, err := client.PostClaimDatabaseLifecycleDispatches(
		context.Background(),
		nil,
		http.Header{},
		DatabaseLifecycleDispatchClaimRequest{AgentID: "agent-1"},
	)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func TestPostDatabaseLifecycleTerminalCallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api/v1/database-lifecycle/callbacks/terminal", r.URL.Path)
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "agent-key", r.Header.Get("x-superblocks-agent-key"))
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))

		var body map[string]any
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		assert.Equal(t, "request-1", body["requestId"])
		assert.Equal(t, "app:prod:orders", body["bindingKey"])
		assert.Equal(t, "ready", body["lifecycleState"])
		assert.Equal(t, "migrated", body["migrationState"])
		assert.Equal(t, "orders.internal", body["connectionMetadata"].(map[string]any)["host"])
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":{"requestId":"request-1","requestState":"ready"}}`))
	}))
	defer server.Close()

	client := NewServerClient(&ServerClientOptions{
		URL:                 server.URL,
		SuperblocksAgentKey: "agent-key",
	})

	resp, err := client.PostDatabaseLifecycleTerminalCallback(
		context.Background(),
		nil,
		http.Header{},
		DatabaseLifecycleTerminalCallbackRequest{
			BindingKey:     "app:prod:orders",
			LifecycleState: "ready",
			MigrationState: "migrated",
			RequestID:      "request-1",
			ConnectionMetadata: map[string]any{
				"host": "orders.internal",
			},
		},
	)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func TestGetIntegrationsSecretStoresUsesAgentEndpointWithFallback(t *testing.T) {
	for _, test := range []struct {
		name          string
		query         url.Values
		useAgentKey   bool
		firstStatus   int
		expectedPaths []string
	}{
		{
			name:          "agent key secret stores use agent endpoint",
			query:         url.Values{"kind": []string{"SECRET"}, "profile": []string{"production"}},
			useAgentKey:   true,
			firstStatus:   http.StatusOK,
			expectedPaths: []string{"/api/v1/agents/secret-stores"},
		},
		{
			name:          "agent key secret stores fall back for older servers",
			query:         url.Values{"kind": []string{"SECRET"}, "profile": []string{"production"}},
			useAgentKey:   true,
			firstStatus:   http.StatusNotFound,
			expectedPaths: []string{"/api/v1/agents/secret-stores", "/api/v1/integrations"},
		},
		{
			name:          "non secret integrations use integration endpoint",
			query:         url.Values{"kind": []string{"PLUGIN"}, "profile": []string{"production"}},
			useAgentKey:   true,
			firstStatus:   http.StatusOK,
			expectedPaths: []string{"/api/v1/integrations"},
		},
		{
			name:          "user secret stores use integration endpoint",
			query:         url.Values{"kind": []string{"SECRET"}, "profile": []string{"production"}},
			useAgentKey:   false,
			firstStatus:   http.StatusOK,
			expectedPaths: []string{"/api/v1/integrations"},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			requestCount := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				require.Less(t, requestCount, len(test.expectedPaths))
				assert.Equal(t, test.expectedPaths[requestCount], r.URL.Path)
				assert.Equal(t, http.MethodGet, r.Method)
				for k, v := range test.query {
					assert.Equal(t, v, r.URL.Query()[k], "query param %s", k)
				}

				requestCount++
				if requestCount == 1 && test.firstStatus == http.StatusNotFound {
					w.WriteHeader(http.StatusNotFound)
					w.Write([]byte(`{"error":"not found"}`))
					return
				}

				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"data":[]}`))
			}))
			defer server.Close()

			client := NewServerClient(&ServerClientOptions{
				URL:                 server.URL,
				SuperblocksAgentKey: "agent-key",
			})

			resp, err := client.GetIntegrations(context.Background(), nil, http.Header{}, test.query, test.useAgentKey)

			require.NoError(t, err)
			require.NotNil(t, resp)
			assert.Equal(t, http.StatusOK, resp.StatusCode)
			assert.Equal(t, len(test.expectedPaths), requestCount)
			resp.Body.Close()
		})
	}
}

func TestDatabaseLifecyclePhysicalDatabaseInstanceClientMethods(t *testing.T) {
	var seen []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.RequestURI())
		assert.Equal(t, "agent-key", r.Header.Get("x-superblocks-agent-key"))
		switch r.Method + " " + r.URL.Path {
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			assert.Equal(t, "deployed", r.URL.Query().Get("environment"))
			assert.Equal(t, "postgres", r.URL.Query().Get("engine"))
			assert.Equal(t, "us-east-1", r.URL.Query().Get("region"))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"instance-1","region":"us-east-1","capacityUsed":1,"capacityMax":4}]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/instance-1/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"instance-1"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/instance-1/release":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"instance-1"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances":
			var body map[string]any
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			assert.Equal(t, "us-east-1", body["region"])
			assert.Equal(t, "deployed", body["environment"])
			assert.Equal(t, "postgres", body["engine"])
			assert.Equal(t, "rds.internal:5432", body["endpoint"])
			assert.EqualValues(t, 25, body["capacityMax"])
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"instance-2"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	client := NewServerClient(&ServerClientOptions{
		URL:                 server.URL,
		SuperblocksAgentKey: "agent-key",
	})

	resp, err := client.GetDatabaseLifecyclePhysicalDatabaseInstances(context.Background(), nil, http.Header{}, DatabaseLifecyclePhysicalDatabaseInstanceListRequest{
		Environment: "deployed",
		Engine:      "postgres",
		Region:      "us-east-1",
	})
	require.NoError(t, err)
	resp.Body.Close()
	resp, err = client.PostDatabaseLifecyclePhysicalDatabaseInstanceReserve(context.Background(), nil, http.Header{}, "instance-1")
	require.NoError(t, err)
	resp.Body.Close()
	resp, err = client.PostDatabaseLifecyclePhysicalDatabaseInstanceRelease(context.Background(), nil, http.Header{}, "instance-1")
	require.NoError(t, err)
	resp.Body.Close()
	resp, err = client.PostDatabaseLifecyclePhysicalDatabaseInstance(context.Background(), nil, http.Header{}, DatabaseLifecyclePhysicalDatabaseInstance{
		Region:              "us-east-1",
		Environment:         "deployed",
		Engine:              "postgres",
		Endpoint:            "rds.internal:5432",
		MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "physical/master", "field": "password"},
		CapacityMax:         25,
	})
	require.NoError(t, err)
	resp.Body.Close()

	require.Equal(t, []string{
		"GET /api/v1/database-lifecycle/physical-database-instances?engine=postgres&environment=deployed&region=us-east-1",
		"POST /api/v1/database-lifecycle/physical-database-instances/instance-1/reserve",
		"POST /api/v1/database-lifecycle/physical-database-instances/instance-1/release",
		"POST /api/v1/database-lifecycle/physical-database-instances",
	}, seen)
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
