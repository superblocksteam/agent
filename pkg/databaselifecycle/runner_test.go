package databaselifecycle

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

func TestRunnerSequencesTerraformCommandsAndRedactsLogs(t *testing.T) {
	var commands []Command
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		commands = append(commands, command)
		if command.Name == "output" {
			return CommandResult{Stdout: `{"password":"secret","runtime_credential_refs":{"password":{"resolver":"vault","ref":"database/orders","field":"password"}}}`}, nil
		}
		return CommandResult{Stdout: "ok token=secret"}, nil
	})

	result, err := NewRunner(executor).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	require.NoError(t, err)
	// cursor r3237338511: when no plan policy is configured, the `show`
	// command must be skipped — its only consumer is policy.Check, so
	// running it unconditionally costs a tofu invocation per dispatch on
	// every deployment that hasn't opted into plan-policy enforcement.
	// The dedicated TestRunnerIncludesShowWhenPlanPolicyIsConfigured below
	// pins the policy-configured branch.
	require.Equal(t, []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=backend.tfbackend"}, Dir: "/tmp/orders"},
		{Name: "plan", Args: []string{"-input=false", "-out=tfplan", "-var-file=terraform.tfvars.json"}, Dir: "/tmp/orders"},
		{Name: "apply", Args: []string{"-input=false", "tfplan"}, Dir: "/tmp/orders"},
		{Name: "output", Args: []string{"-json"}, Dir: "/tmp/orders"},
	}, commands)
	require.JSONEq(t, `{"password":"secret","runtime_credential_refs":{"password":{"resolver":"vault","ref":"database/orders","field":"password"}}}`, result.OutputJSON)
	for _, line := range result.Logs {
		require.NotContains(t, line, "secret")
	}
}

func TestRunnerIncludesShowWhenPlanPolicyIsConfigured(t *testing.T) {
	// cursor r3237338511 (paired): a plan policy installs `tofu show -json
	// tfplan` between plan and apply so the policy sees the planned diff.
	// Skipping show in the no-policy case must NOT skip it here.
	var commands []Command
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		commands = append(commands, command)
		return CommandResult{Stdout: ""}, nil
	})
	policy := PlanPolicyFunc(func(ctx context.Context, planJSON string) error { return nil })

	_, err := NewRunnerWithPolicy(executor, policy).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	require.NoError(t, err)
	require.Equal(t, []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=backend.tfbackend"}, Dir: "/tmp/orders"},
		{Name: "plan", Args: []string{"-input=false", "-out=tfplan", "-var-file=terraform.tfvars.json"}, Dir: "/tmp/orders"},
		{Name: "show", Args: []string{"-json", "tfplan"}, Dir: "/tmp/orders"},
		{Name: "apply", Args: []string{"-input=false", "tfplan"}, Dir: "/tmp/orders"},
		{Name: "output", Args: []string{"-json"}, Dir: "/tmp/orders"},
	}, commands)
}

func TestRunnerDestroySequencesTerraformCommandsAndRedactsLogs(t *testing.T) {
	var commands []Command
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		commands = append(commands, command)
		return CommandResult{Stdout: "destroyed password=secret"}, nil
	})

	result, err := NewRunner(executor).Destroy(context.Background(), Job{
		BindingKey:  "physical-database-instance",
		WorkingDir:  "/tmp/physical",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	require.NoError(t, err)
	require.Equal(t, []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=backend.tfbackend"}, Dir: "/tmp/physical"},
		{Name: "destroy", Args: []string{"-input=false", "-auto-approve", "-var-file=terraform.tfvars.json"}, Dir: "/tmp/physical"},
	}, commands)
	for _, line := range result.Logs {
		require.NotContains(t, line, "secret")
	}
}

func TestTerraformFailureDiagnosticReportsAllowlistedDetailsWithoutRawOutput(t *testing.T) {
	commandErr := exec.Command("sh", "-c", "exit 23").Run()
	result := CommandResult{
		Stdout: "provider output api_key=top-secret",
		Stderr: "Error: local-exec provisioner error: SSL SYSCALL error: EOF detected password=top-secret",
	}

	err := classifyTerraformError("apply", result, commandErr)

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeTerraformFailed, lifecycleErr.Code)
	require.ErrorContains(t, err, "phase=apply")
	require.ErrorContains(t, err, "cause=exit_status")
	require.ErrorContains(t, err, "exit_code=23")
	require.ErrorContains(t, err, fmt.Sprintf("stdout_bytes=%d", len(result.Stdout)))
	require.ErrorContains(t, err, fmt.Sprintf("stderr_bytes=%d", len(result.Stderr)))
	require.ErrorContains(t, err, "indicators=connection_closed,local_exec,tls")
	require.NotContains(t, err.Error(), "top-secret")
	require.NotContains(t, err.Error(), "SSL SYSCALL")
}

func TestTerraformFailureDiagnosticClassifiesSpecificTLSFailures(t *testing.T) {
	tests := []struct {
		name      string
		rawError  string
		indicator string
	}{
		{
			name:      "certificate file",
			rawError:  `root certificate file "/private/rds-ca.pem" does not exist`,
			indicator: "certificate_file",
		},
		{
			name:      "certificate hostname",
			rawError:  `server certificate for "*.rds.amazonaws.com" does not match host name "private.example.com"`,
			indicator: "certificate_hostname",
		},
		{
			name:      "certificate validation",
			rawError:  "SSL error: certificate verify failed",
			indicator: "certificate_validation",
		},
		{
			name:      "connection closed during TLS",
			rawError:  "SSL error: unexpected EOF while reading",
			indicator: "connection_closed",
		},
		{
			name:      "postgres retries exhausted",
			rawError:  "database lifecycle transient PostgreSQL connection failure after 3 attempts",
			indicator: "postgres_transient",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := classifyTerraformError("apply", CommandResult{Stderr: test.rawError}, errors.New("exit status 1"))

			require.ErrorContains(t, err, "indicators="+test.indicator)
			require.NotContains(t, err.Error(), test.rawError)
		})
	}
}

func TestTerraformFailureDiagnosticDoesNotExposeArbitraryExecutorErrors(t *testing.T) {
	const secret = "private-provider-token"

	err := classifyTerraformError("custom-command", CommandResult{}, errors.New("request failed with "+secret))

	require.ErrorContains(t, err, "phase=unknown")
	require.ErrorContains(t, err, "cause=execution_error")
	require.NotContains(t, err.Error(), secret)
}

func TestTerraformFailureDiagnosticPreservesContextCancellation(t *testing.T) {
	err := classifyTerraformError("plan", CommandResult{}, context.Canceled)

	require.ErrorContains(t, err, "phase=plan")
	require.ErrorContains(t, err, "cause=context_canceled")
	require.ErrorIs(t, err, context.Canceled)
}

func TestRunnerInjectsTransientMasterCredentialsAndRefetchesOnceOnAuthenticationFailure(t *testing.T) {
	const (
		masterPassword = "rotated-master-password"
		masterUsername = "cluster_master"
	)
	resolveCalls := 0
	resolver := MasterCredentialResolverFunc(func(ctx context.Context, ref refresolver.Ref) (MasterCredentials, error) {
		resolveCalls++
		require.Equal(t, "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!cluster", ref.Ref)
		return MasterCredentials{Username: masterUsername, Password: masterPassword}, nil
	})
	var commands []Command
	planAttempts := 0
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		command.Env = copyStringMap(command.Env)
		commands = append(commands, command)
		if command.Name == "plan" {
			planAttempts++
			require.Equal(t, expectedIAMCommandEnvironment(masterUsername, masterPassword), command.Env)
			if planAttempts == 1 {
				return CommandResult{
					Stderr: fmt.Sprintf(`password authentication failed for user "%s" with password %s`, masterUsername, masterPassword),
				}, fmt.Errorf("provider failed for %s", masterUsername)
			}
			return CommandResult{Stdout: "planned"}, nil
		}
		if command.Name == "apply" {
			require.Equal(t, expectedIAMCommandEnvironment(masterUsername, masterPassword), command.Env)
			return CommandResult{Stdout: "applied"}, nil
		}
		if command.Name == "output" {
			return CommandResult{Stdout: `{"connection_metadata":{"value":{"auth_mode":"aws_iam_role"}}}`}, nil
		}
		require.Empty(t, command.Env, "credentials must not be attached to non-provider commands")
		return CommandResult{Stdout: "ok"}, nil
	})
	job := Job{
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
		Runtime:     testIAMJobRuntime(),
	}

	result, err := NewRunnerWithPolicyAndMasterCredentials(executor, nil, resolver).Run(context.Background(), job)

	require.NoError(t, err)
	require.Equal(t, 3, resolveCalls, "plan retry and apply must each fetch the current secret")
	require.Equal(t, []string{"init", "plan", "plan", "apply", "output"}, commandNames(commands))
	for _, line := range result.Logs {
		require.NotContains(t, line, masterUsername)
		require.NotContains(t, line, masterPassword)
	}
}

func TestRunnerDestroyInjectsTransientMasterCredentials(t *testing.T) {
	const (
		masterPassword = "destroy-master-password"
		masterUsername = "destroy_master"
	)
	resolveCalls := 0
	resolver := MasterCredentialResolverFunc(func(ctx context.Context, ref refresolver.Ref) (MasterCredentials, error) {
		resolveCalls++
		return MasterCredentials{Username: masterUsername, Password: masterPassword}, nil
	})
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		if command.Name == "destroy" {
			require.Equal(t, expectedIAMCommandEnvironment(masterUsername, masterPassword), command.Env)
			return CommandResult{Stderr: masterUsername + ":" + masterPassword}, nil
		}
		require.Empty(t, command.Env)
		return CommandResult{}, nil
	})
	job := Job{
		WorkingDir: "/tmp/orders",
		Runtime:    testIAMJobRuntime(),
	}

	result, err := NewRunnerWithPolicyAndMasterCredentials(executor, nil, resolver).Destroy(context.Background(), job)

	require.NoError(t, err)
	require.Equal(t, 1, resolveCalls)
	require.Equal(t, []string{"[REDACTED]:[REDACTED]"}, result.Logs)
}

func TestRunnerRejectsIncompleteIAMEnvironmentBeforeExecuting(t *testing.T) {
	tests := []struct {
		name          string
		mutateRuntime func(*JobRuntime)
		wantError     string
	}{
		{
			name: "missing host",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.Host = ""
			},
			wantError: "PGHOST",
		},
		{
			name: "invalid port",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.Port = 70000
			},
			wantError: "PGPORT",
		},
		{
			name: "unsafe admin database",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.Database = "postgres;drop"
			},
			wantError: "PGDATABASE",
		},
		{
			name: "admin database matches target",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.Database = runtime.PostgresAdminConnection.TargetDatabase
			},
			wantError: "distinct",
		},
		{
			name: "missing root cert",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.SSLRootCert = ""
			},
			wantError: "PGSSLROOTCERT",
		},
		{
			name: "non-verifying TLS",
			mutateRuntime: func(runtime *JobRuntime) {
				runtime.PostgresAdminConnection.SSLMode = sslModeRequire
			},
			wantError: "verify-full",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			runtime := testIAMJobRuntime()
			test.mutateRuntime(runtime)
			executorCalls := 0
			runner := NewRunnerWithPolicyAndMasterCredentials(
				CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
					executorCalls++
					return CommandResult{}, nil
				}),
				nil,
				MasterCredentialResolverFunc(func(ctx context.Context, ref refresolver.Ref) (MasterCredentials, error) {
					return MasterCredentials{Username: "cluster_master", Password: "master-password"}, nil
				}),
			)

			_, err := runner.Run(context.Background(), Job{
				WorkingDir: "/tmp/orders",
				Runtime:    runtime,
			})

			require.ErrorContains(t, err, test.wantError)
			require.Zero(t, executorCalls)
		})
	}
}

func expectedIAMCommandEnvironment(username, password string) map[string]string {
	return map[string]string{
		"PGDATABASE":    "postgres",
		"PGHOST":        "pool.cluster-abc.us-east-1.rds.amazonaws.com",
		"PGPASSWORD":    password,
		"PGPORT":        "5432",
		"PGSSLMODE":     sslModeVerifyFull,
		"PGSSLROOTCERT": "/etc/ssl/certs/rds-global-bundle.pem",
		"PGUSER":        username,
	}
}

func testIAMJobRuntime() *JobRuntime {
	return &JobRuntime{
		MasterCredentialRef: &refresolver.Ref{
			Resolver: refresolver.ResolverAWSSecretsManager,
			Ref:      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!cluster",
		},
		PostgresAdminConnection: &PostgresAdminConnection{
			Database:       "postgres",
			Host:           "pool.cluster-abc.us-east-1.rds.amazonaws.com",
			Port:           5432,
			SSLMode:        sslModeVerifyFull,
			SSLRootCert:    "/etc/ssl/certs/rds-global-bundle.pem",
			TargetDatabase: "sbndb_012345abcdef_27142541a26fd86ba68a5073",
		},
	}
}

func copyStringMap(values map[string]string) map[string]string {
	if values == nil {
		return nil
	}
	copied := make(map[string]string, len(values))
	for key, value := range values {
		copied[key] = value
	}
	return copied
}

func TestRunnerClassifiesBackendLockContention(t *testing.T) {
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		return CommandResult{Stderr: "Error acquiring the state lock"}, errors.New("exit status 1")
	})

	_, err := NewRunner(executor).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeBackendLocked, lifecycleErr.Code)
	require.True(t, lifecycleErr.Retryable)
}

func TestRunnerBlocksApplyWhenPlanPolicyRejects(t *testing.T) {
	var commands []Command
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		commands = append(commands, command)
		if command.Name == "show" {
			return CommandResult{Stdout: `{"resource_changes":[{"type":"aws_db_instance"}]}`}, nil
		}
		return CommandResult{Stdout: "ok"}, nil
	})
	policy := PlanPolicyFunc(func(ctx context.Context, planJSON string) error {
		require.JSONEq(t, `{"resource_changes":[{"type":"aws_db_instance"}]}`, planJSON)
		return &LifecycleError{Code: ErrorCodePolicyBlocked, Retryable: false, Err: errors.New("policy rejected public database")}
	})

	_, err := NewRunnerWithPolicy(executor, policy).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodePolicyBlocked, lifecycleErr.Code)
	require.False(t, lifecycleErr.Retryable)
	require.Equal(t, []string{"init", "plan", "show"}, commandNames(commands))
}

func TestRunnerClassifiesUntypedPolicyErrorsAsInternal(t *testing.T) {
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		if command.Name == "show" {
			return CommandResult{Stdout: `{"resource_changes":[{"type":"aws_db_instance"}]}`}, nil
		}
		return CommandResult{Stdout: "ok"}, nil
	})
	policy := PlanPolicyFunc(func(ctx context.Context, planJSON string) error {
		return errors.New("decode plan JSON: unexpected EOF")
	})

	_, err := NewRunnerWithPolicy(executor, policy).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeInternal, lifecycleErr.Code)
	require.False(t, lifecycleErr.Retryable)
}

func TestRunnerPreservesTypedPlanPolicyErrors(t *testing.T) {
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
		if command.Name == "show" {
			return CommandResult{Stdout: `{"resource_changes":[{"type":"aws_iam_role"}]}`}, nil
		}
		return CommandResult{Stdout: "ok"}, nil
	})

	_, err := NewRunnerWithPolicy(executor, NewResourceTypePolicy([]string{"aws_db_instance"})).Run(context.Background(), Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  "/tmp/orders",
		BackendFile: "backend.tfbackend",
		VarsFile:    "terraform.tfvars.json",
	})

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeUnsupportedShape, lifecycleErr.Code)
	require.False(t, lifecycleErr.Retryable)
}

func commandNames(commands []Command) []string {
	names := make([]string, len(commands))
	for i, command := range commands {
		names[i] = command.Name
	}
	return names
}

func TestRedactStringScrubsURIUserinfo(t *testing.T) {
	// Cursor 2026-05-20 MEDIUM: a tofu/terraform provider that emits a
	// DSN-style URI in its stderr would leak the password through the
	// terminal callback log tail without this URI userinfo redaction.
	// The previous RedactString only caught `key=value` assignments
	// and JSON secret keys, neither of which fires on `postgres://...`.
	cases := []struct {
		name   string
		in     string
		expect string
	}{
		{
			name:   "postgres DSN with userinfo",
			in:     "Error: failed to connect to postgres://app_user:hunter2@db.local:5432/orders",
			expect: "Error: failed to connect to postgres://app_user:[REDACTED]@db.local:5432/orders",
		},
		{
			name:   "https URL with basic-auth-style userinfo",
			in:     "module download from https://ci:token123@example.com/mod.zip failed",
			expect: "module download from https://ci:[REDACTED]@example.com/mod.zip failed",
		},
		{
			name:   "URI without password is untouched",
			in:     "downloading from https://user@example.com/x — ok",
			expect: "downloading from https://user@example.com/x — ok",
		},
		{
			name:   "plain URL without userinfo is untouched",
			in:     "downloading from https://example.com/x — ok",
			expect: "downloading from https://example.com/x — ok",
		},
		{
			name: "key=value assignment still redacted",
			in:   "DATABASE_URL=postgres://x password=hunter2 token=zzz",
			// The assignment regex keys (password, secret, token, dsn,
			// private_key) catch the explicit password / token forms.
			// DATABASE_URL is intentionally not in the key list — that
			// flow is normalized into env-var processing elsewhere.
			expect: "DATABASE_URL=postgres://x password=[REDACTED] token=[REDACTED]",
		},
		{
			name:   "JSON shape still redacted via redactValue",
			in:     `{"password":"hunter2","host":"db.local"}`,
			expect: `{"host":"db.local","password":"[REDACTED]"}`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.expect, RedactString(tc.in))
		})
	}
}

func TestClassifyTerraformErrorMatches(t *testing.T) {
	// classifyTerraformError is a string-match dispatcher. Pin every
	// branch so future tofu output drift (capitalization, wrapping) gets
	// caught in unit tests rather than at the dispatch callback layer.
	cases := []struct {
		name      string
		result    CommandResult
		err       error
		wantCode  ErrorCode
		wantRetry bool
	}{
		{
			name:      "backend lock contention is retryable",
			result:    CommandResult{Stderr: "Error acquiring the state lock\nLock Info:\n  ID: 1234"},
			err:       errors.New("exit status 1"),
			wantCode:  ErrorCodeBackendLocked,
			wantRetry: true,
		},
		{
			name:      "policy blocked is non-retryable",
			result:    CommandResult{Stderr: "policy decision: blocked"},
			err:       errors.New("plan rejected"),
			wantCode:  ErrorCodePolicyBlocked,
			wantRetry: false,
		},
		{
			name:      "default branch falls through to terraform_failed",
			result:    CommandResult{Stderr: "Error: ResourceNotFoundException"},
			err:       errors.New("exit status 1"),
			wantCode:  ErrorCodeTerraformFailed,
			wantRetry: false,
		},
		{
			name:      "stdout content also matches (lowercased and combined)",
			result:    CommandResult{Stdout: "ERROR ACQUIRING THE STATE LOCK"},
			err:       errors.New("oops"),
			wantCode:  ErrorCodeBackendLocked,
			wantRetry: true,
		},
		{
			name:      "policy match requires both terms",
			result:    CommandResult{Stderr: "policy did something"},
			err:       errors.New("exit"),
			wantCode:  ErrorCodeTerraformFailed,
			wantRetry: false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := classifyTerraformError("plan", tc.result, tc.err)
			var lifecycleErr *LifecycleError
			require.ErrorAs(t, err, &lifecycleErr)
			require.Equal(t, tc.wantCode, lifecycleErr.Code)
			require.Equal(t, tc.wantRetry, lifecycleErr.Retryable)
		})
	}
}
