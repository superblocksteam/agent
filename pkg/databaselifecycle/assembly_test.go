package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
)

func TestNewWorkerFromDependenciesAssemblesLifecycleWorker(t *testing.T) {
	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID:  "agent-1",
		Client:   clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) { return CommandResult{}, nil }),
		Locker:   NewMemoryLocker(),
		RootDir:  tempRoot(t),
	})

	require.NoError(t, err)
	require.NotNil(t, worker)
}

func TestNewWorkerFromDependenciesThreadsPlanPolicy(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"agentId":"agent-1","bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","operation":"ensure_prod_database","profileId":"profile-1","requestId":"request-1","resourceKey":"resource-1","terraformBackend":{"stateBackend":"s3","bucket":"state"},"terraformModule":{"source":"app.terraform.io/superblocks/rds-postgres/aws","version":"1.2.3","inputs":{}}}]}`))
		case "/api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
	defer server.Close()

	var commands []string
	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			commands = append(commands, command.Name)
			if command.Name == "show" {
				return CommandResult{Stdout: `{"resource_changes":[{"type":"aws_db_instance"}]}`}, nil
			}
			return CommandResult{Stdout: "ok"}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/rds-postgres/aws",
		},
		Policy: PlanPolicyFunc(func(ctx context.Context, planJSON string) error {
			require.JSONEq(t, `{"resource_changes":[{"type":"aws_db_instance"}]}`, planJSON)
			return &LifecycleError{Code: ErrorCodePolicyBlocked, Retryable: false, Err: errors.New("policy rejected plan")}
		}),
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 1, result.Processed)
	require.Equal(t, []string{"init", "plan", "show"}, commands)
	require.Equal(t, "policy_blocked", callbackBody["error"].(map[string]any)["code"])
}

func TestNewWorkerFromDependenciesRejectsMissingDependencies(t *testing.T) {
	_, err := NewWorkerFromDependencies(WorkerDependencies{})

	require.ErrorContains(t, err, "agent id is required")
}
