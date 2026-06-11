package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
)

type ErrorCode string

const (
	ErrorCodeBackendLocked    ErrorCode = "backend_locked"
	ErrorCodeInternal         ErrorCode = "internal"
	ErrorCodeMigrationFailed  ErrorCode = "migration_failed"
	ErrorCodePolicyBlocked    ErrorCode = "policy_blocked"
	ErrorCodeTerraformFailed  ErrorCode = "terraform_failed"
	ErrorCodeUnsupportedShape ErrorCode = "unsupported_provider_capability"
)

type LifecycleError struct {
	Code      ErrorCode
	Retryable bool
	Err       error
}

func (e *LifecycleError) Error() string {
	return fmt.Sprintf("%s: %v", e.Code, e.Err)
}

func (e *LifecycleError) Unwrap() error {
	return e.Err
}

type Job struct {
	BindingKey  string
	WorkingDir  string
	MainFile    string
	BackendFile string
	VarsFile    string
}

type Command struct {
	Name string
	Args []string
	Dir  string
}

type CommandResult struct {
	Stdout string
	Stderr string
}

type CommandExecutor interface {
	Run(context.Context, Command) (CommandResult, error)
}

type CommandExecutorFunc func(context.Context, Command) (CommandResult, error)

func (f CommandExecutorFunc) Run(ctx context.Context, command Command) (CommandResult, error) {
	return f(ctx, command)
}

type PlanPolicy interface {
	Check(context.Context, string) error
}

type PlanPolicyFunc func(context.Context, string) error

func (f PlanPolicyFunc) Check(ctx context.Context, planJSON string) error {
	return f(ctx, planJSON)
}

type Runner struct {
	executor CommandExecutor
	policy   PlanPolicy
}

type Result struct {
	OutputJSON string
	Logs       []string
}

func NewRunner(executor CommandExecutor) *Runner {
	return &Runner{executor: executor}
}

func NewRunnerWithPolicy(executor CommandExecutor, policy PlanPolicy) *Runner {
	return &Runner{executor: executor, policy: policy}
}

func (r *Runner) Run(ctx context.Context, job Job) (Result, error) {
	var logs []string
	// `show` is skipped unless a plan policy is configured because its only
	// consumer is policy.Check.
	commands := []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=" + job.BackendFile}, Dir: job.WorkingDir},
		{Name: "plan", Args: []string{"-input=false", "-out=tfplan", "-var-file=" + job.VarsFile}, Dir: job.WorkingDir},
	}
	if r.policy != nil {
		commands = append(commands, Command{Name: "show", Args: []string{"-json", "tfplan"}, Dir: job.WorkingDir})
	}
	commands = append(commands,
		Command{Name: "apply", Args: []string{"-input=false", "tfplan"}, Dir: job.WorkingDir},
		Command{Name: "output", Args: []string{"-json"}, Dir: job.WorkingDir},
	)

	var output string
	for _, command := range commands {
		commandResult, err := r.executor.Run(ctx, command)
		logs = appendRedacted(logs, commandResult.Stdout, commandResult.Stderr)
		if err != nil {
			return Result{Logs: logs}, classifyTerraformError(commandResult, err)
		}
		if command.Name == "show" && r.policy != nil {
			if err := r.policy.Check(ctx, commandResult.Stdout); err != nil {
				var lifecycleErr *LifecycleError
				if errors.As(err, &lifecycleErr) {
					return Result{Logs: logs}, err
				}
				// Non-LifecycleError returns from policy.Check are infrastructure
				// failures (corrupt `tofu show -json` output, context.Canceled,
				// etc.), not policy rejections. Surface them as internal so
				// operators investigate the actual cause rather than their
				// policy configuration.
				return Result{Logs: logs}, &LifecycleError{Code: ErrorCodeInternal, Retryable: false, Err: err}
			}
		}
		if command.Name == "output" {
			output = commandResult.Stdout
		}
	}

	return Result{OutputJSON: output, Logs: logs}, nil
}

func (r *Runner) Destroy(ctx context.Context, job Job) (Result, error) {
	commands := []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=" + job.BackendFile}, Dir: job.WorkingDir},
		{Name: "destroy", Args: []string{"-input=false", "-auto-approve", "-var-file=" + job.VarsFile}, Dir: job.WorkingDir},
	}

	var logs []string
	for _, command := range commands {
		commandResult, err := r.executor.Run(ctx, command)
		logs = appendRedacted(logs, commandResult.Stdout, commandResult.Stderr)
		if err != nil {
			return Result{Logs: logs}, classifyTerraformError(commandResult, err)
		}
	}
	return Result{Logs: logs}, nil
}

func classifyTerraformError(result CommandResult, err error) error {
	combined := strings.ToLower(result.Stdout + "\n" + result.Stderr + "\n" + err.Error())
	switch {
	case strings.Contains(combined, "error acquiring the state lock"):
		return &LifecycleError{Code: ErrorCodeBackendLocked, Retryable: true, Err: err}
	case strings.Contains(combined, "policy") && strings.Contains(combined, "blocked"):
		return &LifecycleError{Code: ErrorCodePolicyBlocked, Retryable: false, Err: err}
	default:
		return &LifecycleError{Code: ErrorCodeTerraformFailed, Retryable: false, Err: err}
	}
}

func appendRedacted(logs []string, values ...string) []string {
	for _, value := range values {
		if value != "" {
			logs = append(logs, RedactString(value))
		}
	}
	return logs
}

func redactValue(value any, preserveCredentialRefs bool) any {
	switch typed := value.(type) {
	case []any:
		redacted := make([]any, len(typed))
		for i, entry := range typed {
			redacted[i] = redactValue(entry, preserveCredentialRefs)
		}
		return redacted
	case map[string]any:
		redacted := make(map[string]any, len(typed))
		for key, entry := range typed {
			if isCredentialRefKey(key) {
				redacted[key] = redactValue(entry, true)
				continue
			}
			if !preserveCredentialRefs && isSecretKey(key) {
				redacted[key] = "[REDACTED]"
				continue
			}
			redacted[key] = redactValue(entry, preserveCredentialRefs)
		}
		return redacted
	default:
		return value
	}
}

var assignmentSecretPattern = regexp.MustCompile(`(?i)(password|secret|token|private[_-]?key|dsn)=\S+`)

// uriUserinfoPattern matches the userinfo portion of a URI in the
// shape `<scheme>://<user>:<password>@` and captures groups so the
// password (group 2) can be replaced with [REDACTED] while preserving
// the scheme and username for debuggability. Without this, a tofu /
// terraform provider that emits a DSN-style URI in stderr leaks
// plaintext credentials into the terminal callback log tail that the
// orchestrator forwards to the control plane.
//
// Scheme charset matches RFC 3986 minus non-printables; userinfo
// charset excludes `@`, `:`, `/`, and whitespace so the regex
// terminates at the host. Both `user:password@` and `user@` are
// common; the password group is non-empty so `user@` (no password)
// doesn't match — there's nothing to redact in that case.
var uriUserinfoPattern = regexp.MustCompile(`([a-zA-Z][a-zA-Z0-9+.\-]*://[^:/@\s]+):([^@/\s]+)@`)

func RedactString(value string) string {
	var decoded any
	if err := json.Unmarshal([]byte(value), &decoded); err == nil {
		encoded, marshalErr := json.Marshal(redactValue(decoded, false))
		if marshalErr == nil {
			return string(encoded)
		}
	}
	redacted := assignmentSecretPattern.ReplaceAllStringFunc(value, func(match string) string {
		parts := strings.SplitN(match, "=", 2)
		return parts[0] + "=[REDACTED]"
	})
	return uriUserinfoPattern.ReplaceAllString(redacted, "${1}:[REDACTED]@")
}

func isSecretKey(key string) bool {
	lower := strings.ToLower(key)
	return strings.Contains(lower, "password") ||
		strings.Contains(lower, "secret") ||
		strings.Contains(lower, "token") ||
		strings.Contains(lower, "private_key") ||
		strings.Contains(lower, "private-key") ||
		strings.Contains(lower, "dsn")
}

func isCredentialRefKey(key string) bool {
	normalized := strings.ReplaceAll(strings.ToLower(key), "-", "_")
	return strings.Contains(normalized, "credential_ref")
}
