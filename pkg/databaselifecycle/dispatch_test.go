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

func intPtr(value int) *int {
	return &value
}

func TestClaimDispatchesDecodesControlPlanePayloads(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/database-lifecycle/dispatches/claim", r.URL.Path)
		require.Equal(t, http.MethodPost, r.Method)

		var body map[string]string
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		require.Equal(t, "agent-1", body["agentId"])

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpec":{"logicalName":"Orders DB","engine":"postgres","version":"16.3","sizing":{"class":"small"},"extensions":["pgvector"],"replicaCount":1,"migrationDirectory":"db/migrations"},"desiredSpecHash":"hash-1","environment":"deployed","operation":"ensure_database","profile":"production","requestId":"request-1","resourceKey":"resource-1"}]}`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	dispatches, err := ClaimDispatches(context.Background(), client, "agent-1")

	require.NoError(t, err)
	require.Equal(t, []DispatchPayload{
		{
			BindingKey: "app:prod:orders",
			DesiredSpec: DatabaseRequirement{
				LogicalName:        "Orders DB",
				Engine:             "postgres",
				Version:            "16.3",
				Sizing:             map[string]any{"class": "small"},
				Extensions:         []string{"pgvector"},
				ReplicaCount:       intPtr(1),
				MigrationDirectory: "db/migrations",
			},
			DesiredSpecHash: "hash-1",
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
		BindingKey:              "app:prod:orders",
		DesiredSpec:             DatabaseRequirement{LogicalName: "Orders DB", Engine: "postgres", Version: "16.3", Sizing: map[string]any{"class": "small"}, Extensions: []string{"pgvector"}, ReplicaCount: intPtr(1), MigrationDirectory: "db/migrations"},
		DesiredSpecHash:         "hash-1",
		Environment:             "deployed",
		MigrationCredentialRefs: map[string]any{"username": map[string]any{"ref": "database/orders/migration"}},
		Operation:               "ensure_database",
		Profile:                 "production",
		RequestID:               "request-1",
		ResourceKey:             "resource-1",
		TerraformBackend:        map[string]any{"stateBackend": "s3"},
		TerraformModule:         TerraformModule{Source: "app.terraform.io/superblocks/postgres-managed-database/aws"},
	})

	require.NoError(t, err)
	require.JSONEq(t, `{
		"bindingKey": "app:prod:orders",
		"desiredSpec": {
			"logicalName": "Orders DB",
			"engine": "postgres",
			"version": "16.3",
			"sizing": {
				"class": "small"
			},
			"extensions": ["pgvector"],
			"replicaCount": 1,
			"migrationDirectory": "db/migrations"
		},
		"desiredSpecHash": "hash-1",
		"environment": "deployed",
		"operation": "ensure_database",
		"profile": "production",
		"requestId": "request-1",
		"resourceKey": "resource-1"
	}`, string(encoded))

	var root map[string]any
	require.NoError(t, json.Unmarshal(encoded, &root))
	for _, nestedField := range []string{"logicalName", "engine", "version", "sizing", "extensions", "replicaCount", "migrationDirectory"} {
		require.NotContains(t, root, nestedField)
	}
}

func TestClaimDispatchesDoesNotDecodeCallbackOnlyMigrationCredentialRefs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpec":{"logicalName":"Orders DB","engine":"postgres"},"desiredSpecHash":"hash-1","environment":"deployed","operation":"migrate_schema","profile":"production","requestId":"request-1","resourceKey":"resource-1","runtimeCredentialRefs":{"username":{"resolver":"aws_secrets_manager","ref":"database/orders","field":"username"}},"migrationCredentialRefs":{"username":{"resolver":"aws_secrets_manager","ref":"database/orders/migration","field":"username"}}}]}`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	dispatches, err := ClaimDispatches(context.Background(), client, "agent-1")

	require.NoError(t, err)
	require.Len(t, dispatches, 1)
	require.Equal(t, map[string]any{
		"username": map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "database/orders",
			"field":    "username",
		},
	}, dispatches[0].RuntimeCredentialRefs)
	require.Nil(t, dispatches[0].MigrationCredentialRefs)
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
