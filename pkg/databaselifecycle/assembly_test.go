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
			var body map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			require.Equal(t, "agent-1", body["agentId"])
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","environment":"deployed","profile":"production","engine":"postgres","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`))
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
			"app.terraform.io/superblocks/postgres-managed-database/aws",
		},
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Backend:     map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate"},
				ModuleSelectors: map[string]map[string]TerraformModule{
					"ensure_database": {
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					},
				},
				CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
			}},
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

func TestNewWorkerFromDependenciesResolvesModuleFromLocalLifecycleConfig(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","environment":"deployed","profile":"production","engine":"postgres","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`))
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
			"app.terraform.io/superblocks/postgres-managed-database/aws",
		},
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Backend:     map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"},
				ModuleSelectors: map[string]map[string]TerraformModule{
					"ensure_database": {
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					},
				},
				CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
			}},
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

func TestNewWorkerFromDependenciesReportsMissingLocalLifecycleConfig(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","environment":"deployed","profile":"production","engine":"postgres","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`))
		case "/api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			t.Fatal("missing lifecycle config must fail before Terraform runs")
			return CommandResult{}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, "unsupported_provider_capability", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG")
}

func TestNewWorkerFromDependenciesReportsConfigEntryForUnallowedModuleSource(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"bindingKey":"app:prod:orders","desiredSpecHash":"hash-1","environment":"deployed","profile":"production","engine":"postgres","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`))
		case "/api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			return CommandResult{Stdout: "ok"}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/aurora-postgres/aws",
		},
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Backend:     map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate"},
				ModuleSelectors: map[string]map[string]TerraformModule{
					"ensure_database": {
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					},
				},
				CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Equal(t, "unsupported_provider_capability", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "config entry deployed/production")
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "unsupported Terraform module source app.terraform.io/superblocks/postgres-managed-database/aws")
}

func TestNewWorkerFromDependenciesRejectsMissingDependencies(t *testing.T) {
	valid := WorkerDependencies{
		AgentID:  "agent-1",
		Client:   clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) { return CommandResult{}, nil }),
		Locker:   NewMemoryLocker(),
		RootDir:  tempRoot(t),
	}
	tests := []struct {
		name      string
		deps      WorkerDependencies
		wantError string
	}{
		{
			name:      "missing agent id",
			deps:      WorkerDependencies{Client: valid.Client, Executor: valid.Executor, Locker: valid.Locker},
			wantError: "agent id is required",
		},
		{
			name:      "missing server client",
			deps:      WorkerDependencies{AgentID: valid.AgentID, Executor: valid.Executor, Locker: valid.Locker},
			wantError: "server client is required",
		},
		{
			name:      "missing command executor",
			deps:      WorkerDependencies{AgentID: valid.AgentID, Client: valid.Client, Locker: valid.Locker},
			wantError: "command executor is required",
		},
		{
			name:      "missing resource locker",
			deps:      WorkerDependencies{AgentID: valid.AgentID, Client: valid.Client, Executor: valid.Executor},
			wantError: "resource locker is required",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NewWorkerFromDependencies(test.deps)

			require.ErrorContains(t, err, test.wantError)
		})
	}
}
