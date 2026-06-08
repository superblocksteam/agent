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
		w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpec":{"databaseName":"orders"},"desiredSpecHash":"hash-1","engine":"postgres","environment":"deployed","operation":"ensure_database","profile":"production","requestId":"request-1","resourceKey":"resource-1"}]}`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	dispatches, err := ClaimDispatches(context.Background(), client, "agent-1")

	require.NoError(t, err)
	require.Equal(t, []DispatchPayload{
		{
			BindingKey: "app:prod:orders",
			DesiredSpec: map[string]any{
				"databaseName": "orders",
			},
			DesiredSpecHash: "hash-1",
			Engine:          "postgres",
			Environment:     "deployed",
			Operation:       "ensure_database",
			Profile:         "production",
			RequestID:       "request-1",
			ResourceKey:     "resource-1",
		},
	}, dispatches)
}

func TestDispatchPayloadOmitsWorkerResolvedFieldsFromWire(t *testing.T) {
	encoded, err := json.Marshal(DispatchPayload{
		BindingKey:      "app:prod:orders",
		DesiredSpecHash: "hash-1",
		Engine:          "postgres",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-1",
		ResourceKey:     "resource-1",
	})

	require.NoError(t, err)
	require.JSONEq(t, `{
		"bindingKey": "app:prod:orders",
		"desiredSpecHash": "hash-1",
		"engine": "postgres",
		"environment": "deployed",
		"operation": "ensure_database",
		"profile": "production",
		"requestId": "request-1",
		"resourceKey": "resource-1"
	}`, string(encoded))
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
