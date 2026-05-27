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

func TestReportTerminalCallbackPostsLifecycleResult(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/database-lifecycle/callbacks/terminal", r.URL.Path)
		require.Equal(t, http.MethodPost, r.Method)

		var body map[string]any
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		require.Equal(t, "request-1", body["requestId"])
		require.Equal(t, "app:prod:orders", body["bindingKey"])
		require.Equal(t, "ready", body["lifecycleState"])
		require.Equal(t, "migrated", body["migrationState"])
		require.Equal(t, map[string]any{
			"username": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:runtime",
				"field":    "username",
			},
		}, body["runtimeCredentialRefs"])
		require.Equal(t, map[string]any{
			"username": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:migration",
				"field":    "username",
			},
		}, body["migrationCredentialRefs"])
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","integrationId":"integration-1","lifecycleState":"ready","migrationState":"migrated","requestId":"request-1","requestState":"ready"}}`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	result, err := ReportTerminalCallback(context.Background(), client, TerminalCallback{
		BindingKey:     "app:prod:orders",
		LifecycleState: "ready",
		MigrationState: "migrated",
		RequestID:      "request-1",
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:runtime",
				"field":    "username",
			},
		},
		MigrationCredentialRefs: map[string]any{
			"username": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:migration",
				"field":    "username",
			},
		},
	})

	require.NoError(t, err)
	require.Equal(t, TerminalCallbackResult{
		BindingKey:     "app:prod:orders",
		IntegrationID:  "integration-1",
		LifecycleState: "ready",
		MigrationState: "migrated",
		RequestID:      "request-1",
		RequestState:   "ready",
	}, result)
}

func TestReportTerminalCallbackReturnsControlPlaneErrors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`callback unavailable`))
	}))
	defer server.Close()

	client := clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"})

	_, err := ReportTerminalCallback(context.Background(), client, TerminalCallback{
		BindingKey:     "app:prod:orders",
		LifecycleState: "failed",
		RequestID:      "request-1",
	})

	require.ErrorContains(t, err, "callback unavailable")
}
