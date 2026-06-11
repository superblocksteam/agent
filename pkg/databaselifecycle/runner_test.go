package databaselifecycle

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
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
			err := classifyTerraformError(tc.result, tc.err)
			var lifecycleErr *LifecycleError
			require.ErrorAs(t, err, &lifecycleErr)
			require.Equal(t, tc.wantCode, lifecycleErr.Code)
			require.Equal(t, tc.wantRetry, lifecycleErr.Retryable)
		})
	}
}
