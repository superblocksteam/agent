package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
)

func claimLifecycleDispatchResponse(engine string) string {
	return fmt.Sprintf(`{"data":[{"bindingKey":"app:prod:orders","desiredSpec":{"logicalName":"Orders DB","engine":%q},"desiredSpecHash":"hash-1","environment":"deployed","profile":"production","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`, engine)
}

func claimLifecycleDispatchResponseWithoutEngine() string {
	return `{"data":[{"bindingKey":"app:prod:orders","desiredSpec":{"logicalName":"Orders DB"},"desiredSpecHash":"hash-1","environment":"deployed","profile":"production","operation":"ensure_database","requestId":"request-1","resourceKey":"resource-1"}]}`
}

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
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate"}, map[string]TerraformModule{
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					}),
				},
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
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"}, map[string]TerraformModule{
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					}),
				},
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

func TestNewWorkerFromDependenciesReservesPhysicalDatabaseInstanceForSharedPostgresEnsure(t *testing.T) {
	var callbackBody map[string]any
	var seen []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.RequestURI())
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			require.Equal(t, "deployed", r.URL.Query().Get("environment"))
			require.Equal(t, "postgres", r.URL.Query().Get("engine"))
			require.Equal(t, "us-east-1", r.URL.Query().Get("region"))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"11111111-1111-4111-8111-111111111111","region":"us-east-1","environment":"deployed","engine":"postgres","endpoint":"pool.example.com:5432","masterCredentialRef":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool","field":"password"},"capacityMax":4,"capacityUsed":0,"status":"active"}]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/progress":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"provisioning","requestId":"request-1","requestState":"provisioning"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"ready","migrationState":"pending","requestId":"request-1","requestState":"ready"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	var materializedVars map[string]any
	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			if command.Name == "plan" {
				for _, arg := range command.Args {
					if strings.HasPrefix(arg, "-var-file=") {
						require.NoError(t, readJSONFile(strings.TrimPrefix(arg, "-var-file="), &materializedVars))
					}
				}
			}
			if command.Name == "output" {
				return CommandResult{Stdout: `{"connection_metadata":{"value":{"database":"orders","host":"pool.example.com","port":5432}},"runtime_credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"runtime","field":"password"}}}}`}, nil
			}
			return CommandResult{Stdout: "ok"}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/postgres-managed-database/aws",
		},
		DSNOptions: DSNOptions{
			SSLMode:            "require",
			AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!"},
		},
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "superblocks/native-db/prod",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, PollResult{Claimed: 1, Processed: 1}, result)
	require.Contains(t, seen, "GET /api/v1/database-lifecycle/physical-database-instances?engine=postgres&environment=deployed&region=us-east-1")
	require.Contains(t, seen, "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve")
	require.Equal(t, "pool.example.com", materializedVars["host"])
	require.Equal(t, float64(5432), materializedVars["port"])
	require.Equal(t, map[string]any{
		"field":    "password",
		"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool",
		"resolver": "aws_secrets_manager",
	}, materializedVars["postgres_admin_credential_ref"])
	require.Regexp(t, `^sb_[a-f0-9]{16}$`, materializedVars["database_name"])
	require.Equal(t, "11111111-1111-4111-8111-111111111111", callbackBody["connectionMetadata"].(map[string]any)["physical_database_instance_ref"])
}

func TestNewWorkerFromDependenciesProvisionsAndRegistersPhysicalDatabaseInstanceForSharedPostgresEnsure(t *testing.T) {
	var callbackBody map[string]any
	var registeredBody map[string]any
	var seen []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.RequestURI())
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			require.Equal(t, "deployed", r.URL.Query().Get("environment"))
			require.Equal(t, "postgres", r.URL.Query().Get("engine"))
			require.Equal(t, "us-east-1", r.URL.Query().Get("region"))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&registeredBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"22222222-2222-4222-8222-222222222222","region":"us-east-1","environment":"deployed","engine":"postgres","endpoint":"new-pool.example.com:5432","masterCredentialRef":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"},"capacityMax":8,"capacityUsed":0,"status":"active","securityClass":"standard"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/22222222-2222-4222-8222-222222222222/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"22222222-2222-4222-8222-222222222222"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/progress":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"provisioning","requestId":"request-1","requestState":"provisioning"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"ready","migrationState":"pending","requestId":"request-1","requestState":"ready"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	var operations []string
	var logicalVars map[string]any
	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			var vars map[string]any
			if command.Name == "plan" || command.Name == "output" {
				require.NoError(t, readJSONFile(filepath.Join(command.Dir, "terraform.tfvars.json"), &vars))
				if command.Name == "plan" {
					operations = append(operations, vars["operation"].(string))
					if vars["operation"] == "ensure_database" {
						logicalVars = vars
					}
				}
			}
			if command.Name == "output" && vars["operation"] == "ensure_physical_database_instance" {
				return CommandResult{Stdout: `{"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}}`}, nil
			}
			if command.Name == "output" {
				return CommandResult{Stdout: `{"connection_metadata":{"value":{"database":"orders","host":"new-pool.example.com","port":5432}},"runtime_credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"runtime","field":"password"}}}}`}, nil
			}
			return CommandResult{Stdout: "ok"}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/postgres-managed-database/aws",
			testAWSRDSManagedInstanceModuleSource,
		},
		DSNOptions: DSNOptions{
			SSLMode:            "require",
			AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!"},
		},
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "logical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "superblocks/native-db/prod",
							},
						},
					}),
					"ensure_physical_database_instance": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source: testAWSRDSManagedInstanceModuleSource,
							Inputs: map[string]any{
								"capacity_max":   8,
								"security_class": "standard",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, PollResult{Claimed: 1, Processed: 1}, result)
	require.Equal(t, []string{"ensure_physical_database_instance", "ensure_database"}, operations)
	require.Contains(t, seen, "POST /api/v1/database-lifecycle/physical-database-instances")
	require.Contains(t, seen, "POST /api/v1/database-lifecycle/physical-database-instances/22222222-2222-4222-8222-222222222222/reserve")
	require.Equal(t, "new-pool.example.com", logicalVars["host"])
	require.Equal(t, float64(5432), logicalVars["port"])
	require.Equal(t, "new-pool.example.com:5432", registeredBody["endpoint"])
	require.Equal(t, float64(8), registeredBody["capacityMax"])
	require.Equal(t, "standard", registeredBody["securityClass"])
	require.Equal(t, "22222222-2222-4222-8222-222222222222", callbackBody["connectionMetadata"].(map[string]any)["physical_database_instance_ref"])
}

func TestNewWorkerFromDependenciesRejectsInvalidSharedPostgresCredentialSecretPrefixBeforeReservation(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			t.Fatal("invalid credential_secret_prefix must fail before reserving physical capacity")
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			t.Fatal("invalid credential_secret_prefix must fail before Terraform commands run")
			return CommandResult{}, nil
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, "unsupported_provider_capability", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "credential_secret_prefix must be a non-empty string")
}

func TestNewWorkerFromDependenciesReleasesPhysicalDatabaseInstanceWhenMaterializationFails(t *testing.T) {
	var callbackBody map[string]any
	var progressBodies []map[string]any
	var seen []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.RequestURI())
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"11111111-1111-4111-8111-111111111111","region":"us-east-1","environment":"deployed","engine":"postgres","endpoint":"pool.example.com:5432","masterCredentialRef":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool","field":"password"},"capacityMax":4,"capacityUsed":0,"status":"active"}]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/progress":
			var progressBody map[string]any
			require.NoError(t, json.NewDecoder(r.Body).Decode(&progressBody))
			progressBodies = append(progressBodies, progressBody)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"provisioning","requestId":"request-1","requestState":"provisioning"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/release":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			t.Fatal("materialization must fail before Terraform commands run")
			return CommandResult{}, nil
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "superblocks/native-db/prod",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Contains(t, seen, "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/release")
	require.Len(t, progressBodies, 2)
	require.Equal(t, "physical_db_reserved", progressBodies[0]["continuation"].(map[string]any)["currentState"])
	require.Equal(t, "physical_db_registered", progressBodies[1]["continuation"].(map[string]any)["currentState"])
	require.Equal(t, "terraform_failed", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE must be set explicitly")
}

func TestNewWorkerFromDependenciesRetriesPhysicalDatabaseInstanceReleaseWhenMaterializationFails(t *testing.T) {
	var callbackBody map[string]any
	releaseAttempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"11111111-1111-4111-8111-111111111111","region":"us-east-1","environment":"deployed","engine":"postgres","endpoint":"pool.example.com:5432","masterCredentialRef":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool","field":"password"},"capacityMax":4,"capacityUsed":0,"status":"active"}]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/progress":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"provisioning","requestId":"request-1","requestState":"provisioning"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/release":
			releaseAttempts++
			if releaseAttempts == 1 {
				http.Error(w, "release temporarily unavailable", http.StatusServiceUnavailable)
				return
			}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			t.Fatal("materialization must fail before Terraform commands run")
			return CommandResult{}, nil
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "superblocks/native-db/prod",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, 2, releaseAttempts)
	require.Equal(t, "terraform_failed", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE must be set explicitly")
}

func TestNewWorkerFromDependenciesFailsTerminallyWithoutLeakingReservationWhenMaterializationRollbackProgressFails(t *testing.T) {
	var progressStates []string
	var callbackBody map[string]any
	var seen []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.Path)
		switch r.Method + " " + r.URL.Path {
		case "POST /api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
		case "GET /api/v1/database-lifecycle/physical-database-instances":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"11111111-1111-4111-8111-111111111111","region":"us-east-1","environment":"deployed","engine":"postgres","endpoint":"pool.example.com:5432","masterCredentialRef":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool","field":"password"},"capacityMax":4,"capacityUsed":0,"status":"active"}]}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/progress":
			var progressBody map[string]any
			require.NoError(t, json.NewDecoder(r.Body).Decode(&progressBody))
			state, _ := progressBody["continuation"].(map[string]any)["currentState"].(string)
			progressStates = append(progressStates, state)
			// The physical_db_reserved checkpoint (during reservation) succeeds,
			// but the physical_db_registered downgrade (during materialization
			// rollback) fails while the reservation has already been released.
			if state == "physical_db_registered" {
				http.Error(w, "progress callback temporarily unavailable", http.StatusServiceUnavailable)
				return
			}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"provisioning","requestId":"request-1","requestState":"provisioning"}}`))
		case "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/release":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"id":"11111111-1111-4111-8111-111111111111"}}`))
		case "POST /api/v1/database-lifecycle/callbacks/terminal":
			require.NoError(t, json.NewDecoder(r.Body).Decode(&callbackBody))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"bindingKey":"app:prod:orders","lifecycleState":"failed","migrationState":"pending","requestId":"request-1","requestState":"failed"}}`))
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.RequestURI())
		}
	}))
	defer server.Close()

	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID: "agent-1",
		Client:  clients.NewServerClient(&clients.ServerClientOptions{URL: server.URL, SuperblocksAgentKey: "agent-key"}),
		Executor: CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			t.Fatal("materialization must fail before Terraform commands run")
			return CommandResult{}, nil
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"}, map[string]TerraformModule{
						"postgres": {
							Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
							Version: "1.2.3",
							Inputs: map[string]any{
								"credential_secret_prefix": "superblocks/native-db/prod",
							},
						},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, []string{"physical_db_reserved", "physical_db_registered"}, progressStates)
	// The reservation is released before the (failing) downgrade, so the pool
	// slot is never leaked even though the continuation stays physical_db_reserved.
	require.Contains(t, seen, "POST /api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/release")
	// A failed downgrade callback must NOT reclassify the deterministic
	// materialization failure as retryable: the binding fails terminally so no
	// retry resumes physical_db_reserved against the released slot.
	require.False(t, result.Errors[0].Retryable)
	require.Equal(t, "failed", callbackBody["lifecycleState"])
}

func TestNewWorkerFromDependenciesReportsMissingLocalLifecycleConfig(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
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
			w.Write([]byte(claimLifecycleDispatchResponse("postgres")))
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate"}, map[string]TerraformModule{
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					}),
				},
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

func TestNewWorkerFromDependenciesReportsUnsupportedShapeWhenLocalConfigCannotMaterialize(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponse("mysql")))
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
			t.Fatal("unmaterializable dispatch must fail before Terraform commands")
			return CommandResult{}, nil
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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"}, map[string]TerraformModule{
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, "unsupported_provider_capability", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], `operation "ensure_database" engine "mysql"; supported engines: [postgres]`)
}

func TestNewWorkerFromDependenciesReportsMalformedDispatchWhenDesiredSpecEngineMissing(t *testing.T) {
	var callbackBody map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/database-lifecycle/dispatches/claim":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(claimLifecycleDispatchResponseWithoutEngine()))
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
			t.Fatal("malformed dispatch must fail before Terraform commands")
			return CommandResult{}, nil
		}),
		Locker:  NewMemoryLocker(),
		RootDir: tempRoot(t),
		LifecycleConfig: LifecycleConfig{
			Entries: []LifecycleConfigEntry{{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperationWithBackend(map[string]any{"stateBackend": "s3", "bucket": "state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate"}, map[string]TerraformModule{
						"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws", Version: "1.2.3"},
					}),
				},
			}},
		},
	})
	require.NoError(t, err)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, "unsupported_provider_capability", callbackBody["error"].(map[string]any)["code"])
	require.Contains(t, callbackBody["error"].(map[string]any)["message"], "malformed database lifecycle dispatch: desiredSpec.engine is required")
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

func TestPhysicalDatabaseInstanceSelectorUsesWorkerOwnedPoolPolicy(t *testing.T) {
	selector := physicalDatabaseInstanceSelectorFromDispatch(DispatchPayload{
		BindingKey:  "binding-1",
		Environment: "deployed",
		Profile:     "production",
		RequestID:   "request-1",
		ResourceKey: "resource-1",
		DesiredSpec: DatabaseRequirement{Engine: "postgres"},
	}, ResolvedLifecycleConfig{
		Backend: map[string]any{"region": "us-east-1"},
		PhysicalDatabase: &PhysicalDatabasePolicy{
			Mode:               PhysicalDatabaseModeSharedPool,
			ProvisionOperation: operationEnsurePhysicalDatabaseInstance,
			OnExhausted:        PhysicalDatabaseOnExhaustedProvision,
			CapacityMax:        100,
			SecurityClass:      "standard",
		},
	})

	require.Equal(t, 100, selector.CapacityMax)
	require.Equal(t, "standard", selector.SecurityClass)
}
