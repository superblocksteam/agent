package databaselifecycle

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
)

func TestClaimDispatchesDecodesControlPlanePayloads(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/database-lifecycle/dispatches/claim", r.URL.Path)
		require.Equal(t, http.MethodPost, r.Method)

		var body map[string]string
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		require.Equal(t, "agent-1", body["agentId"])

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[{"agentId":"agent-1","bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","operation":"ensure_prod_database","profileId":"profile-1","requestId":"request-1","terraformBackend":{"stateBackend":"s3","remoteState":true,"locking":true}}]}`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	dispatches, err := ClaimDispatches(context.Background(), client, "agent-1")

	require.NoError(t, err)
	require.Equal(t, []DispatchPayload{
		{
			AgentID:         "agent-1",
			BindingKey:      "app:prod:orders",
			DesiredSpecHash: "hash-1",
			Operation:       "ensure_prod_database",
			ProfileID:       "profile-1",
			RequestID:       "request-1",
			TerraformBackend: map[string]any{
				"stateBackend": "s3",
				"remoteState":  true,
				"locking":      true,
			},
		},
	}, dispatches)
}

func TestClaimDispatchesReturnsControlPlaneErrors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`database lifecycle unavailable`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	_, err := ClaimDispatches(context.Background(), client, "agent-1")

	require.ErrorContains(t, err, "database lifecycle unavailable")
}
