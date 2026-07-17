package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

type ErrorCode string

const (
	ErrorCodeBackendLocked    ErrorCode = "backend_locked"
	ErrorCodeInternal         ErrorCode = "internal"
	ErrorCodeMigrationFailed  ErrorCode = "migration_failed"
	ErrorCodeCallbackFailed   ErrorCode = "callback_failed"
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
	Runtime     *JobRuntime
}

type JobRuntime struct {
	MasterCredentialRef     *refresolver.Ref
	PostgresAdminConnection *PostgresAdminConnection
}

type Command struct {
	Name string
	Args []string
	Dir  string
	Env  map[string]string
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
	executor                 CommandExecutor
	masterCredentialResolver MasterCredentialResolver
	policy                   PlanPolicy
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

func NewRunnerWithPolicyAndMasterCredentials(
	executor CommandExecutor,
	policy PlanPolicy,
	masterCredentialResolver MasterCredentialResolver,
) *Runner {
	return &Runner{
		executor:                 executor,
		masterCredentialResolver: masterCredentialResolver,
		policy:                   policy,
	}
}

func (r *Runner) Run(ctx context.Context, job Job) (Result, error) {
	if err := validateIAMJobRuntime(job); err != nil {
		return Result{}, err
	}
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
		commandResult, err := r.runCommand(ctx, job, command)
		logs = appendRedacted(logs, commandResult.Stdout, commandResult.Stderr)
		if err != nil {
			return Result{Logs: logs}, classifyTerraformError(command.Name, commandResult, err)
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
	if err := validateIAMJobRuntime(job); err != nil {
		return Result{}, err
	}
	commands := []Command{
		{Name: "init", Args: []string{"-input=false", "-backend-config=" + job.BackendFile}, Dir: job.WorkingDir},
		{Name: "destroy", Args: []string{"-input=false", "-auto-approve", "-var-file=" + job.VarsFile}, Dir: job.WorkingDir},
	}

	var logs []string
	for _, command := range commands {
		commandResult, err := r.runCommand(ctx, job, command)
		logs = appendRedacted(logs, commandResult.Stdout, commandResult.Stderr)
		if err != nil {
			return Result{Logs: logs}, classifyTerraformError(command.Name, commandResult, err)
		}
	}
	return Result{Logs: logs}, nil
}

func (r *Runner) runCommand(ctx context.Context, job Job, command Command) (CommandResult, error) {
	if !commandUsesPostgresProvider(command.Name) {
		return r.executor.Run(ctx, command)
	}
	ref, ok, err := masterCredentialRefForJob(job)
	if err != nil {
		return CommandResult{}, err
	}
	if !ok {
		return r.executor.Run(ctx, command)
	}
	if r.masterCredentialResolver == nil {
		return CommandResult{}, errors.New("database lifecycle master credential resolver is required for IAM administration")
	}
	connection, err := postgresAdminConnectionForJob(job)
	if err != nil {
		return CommandResult{}, err
	}

	result, runErr := r.runCommandWithMasterCredentials(ctx, command, ref, connection)
	if runErr == nil || !isPostgresAuthenticationFailure(result, runErr) {
		return result, runErr
	}
	return r.runCommandWithMasterCredentials(ctx, command, ref, connection)
}

func (r *Runner) runCommandWithMasterCredentials(
	ctx context.Context,
	command Command,
	ref refresolver.Ref,
	connection PostgresAdminConnection,
) (CommandResult, error) {
	credentials, err := r.masterCredentialResolver.Resolve(ctx, ref)
	if err != nil {
		return CommandResult{}, err
	}
	environment := make(map[string]string, len(command.Env)+7)
	for key, value := range command.Env {
		environment[key] = value
	}
	for key, value := range connection.CommandEnvironment(credentials) {
		environment[key] = value
	}
	command.Env = environment
	result, runErr := r.executor.Run(ctx, command)
	result, runErr = redactMasterCredentials(result, runErr, credentials)
	clear(command.Env)
	credentials.Password = ""
	credentials.Username = ""
	return result, runErr
}

func validateIAMJobRuntime(job Job) error {
	_, ok, err := masterCredentialRefForJob(job)
	if err != nil || !ok {
		return err
	}
	_, err = postgresAdminConnectionForJob(job)
	return err
}

func commandUsesPostgresProvider(command string) bool {
	switch command {
	case "apply", "destroy", "plan":
		return true
	default:
		return false
	}
}

func postgresAdminConnectionForJob(job Job) (PostgresAdminConnection, error) {
	if job.Runtime != nil && job.Runtime.PostgresAdminConnection != nil {
		connection := *job.Runtime.PostgresAdminConnection
		if err := connection.Validate(); err != nil {
			return PostgresAdminConnection{}, err
		}
		return connection, nil
	}
	vars, exists, err := readJobVars(job)
	if err != nil {
		return PostgresAdminConnection{}, err
	}
	if !exists || vars["auth_mode"] != iamAuthMode {
		return PostgresAdminConnection{}, errors.New("database lifecycle IAM PostgreSQL administration connection is required")
	}
	return postgresAdminConnectionFromVars(vars)
}

func masterCredentialRefForJob(job Job) (refresolver.Ref, bool, error) {
	if job.Runtime != nil && job.Runtime.MasterCredentialRef != nil {
		return *job.Runtime.MasterCredentialRef, true, nil
	}
	vars, exists, err := readJobVars(job)
	if err != nil || !exists {
		return refresolver.Ref{}, false, err
	}
	if vars["auth_mode"] != iamAuthMode {
		return refresolver.Ref{}, false, nil
	}
	refMap, ok := vars[postgresAdminCredentialInput].(map[string]any)
	if !ok {
		return refresolver.Ref{}, false, errors.New("database lifecycle IAM vars missing postgres_admin_credential_ref")
	}
	ref, ok := refresolver.RefFromMap(refMap)
	if !ok {
		return refresolver.Ref{}, false, errors.New("database lifecycle IAM postgres_admin_credential_ref is invalid")
	}
	return ref, true, nil
}

func readJobVars(job Job) (map[string]any, bool, error) {
	if job.VarsFile == "" {
		return nil, false, nil
	}
	contents, err := os.ReadFile(job.VarsFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("read database lifecycle vars: %w", err)
	}
	var vars map[string]any
	if err := json.Unmarshal(contents, &vars); err != nil {
		return nil, false, fmt.Errorf("decode database lifecycle vars: %w", err)
	}
	return vars, true, nil
}

func isPostgresAuthenticationFailure(result CommandResult, err error) bool {
	if err == nil {
		return false
	}
	combined := strings.ToLower(result.Stdout + "\n" + result.Stderr + "\n" + err.Error())
	return strings.Contains(combined, "password authentication failed") ||
		strings.Contains(combined, "authentication failed for user") ||
		strings.Contains(combined, "sqlstate 28p01")
}

func redactMasterCredentials(result CommandResult, err error, credentials MasterCredentials) (CommandResult, error) {
	replacer := strings.NewReplacer(
		credentials.Password, "[REDACTED]",
		credentials.Username, "[REDACTED]",
	)
	result.Stdout = replacer.Replace(result.Stdout)
	result.Stderr = replacer.Replace(result.Stderr)
	if err != nil {
		err = errors.New(replacer.Replace(err.Error()))
	}
	return result, err
}

func classifyTerraformError(commandName string, result CommandResult, err error) error {
	combined := strings.ToLower(result.Stdout + "\n" + result.Stderr + "\n" + err.Error())
	safeErr := safeTerraformCommandFailure(commandName, result, err)
	switch {
	case strings.Contains(combined, "error acquiring the state lock"):
		return &LifecycleError{Code: ErrorCodeBackendLocked, Retryable: true, Err: safeErr}
	case strings.Contains(combined, "policy") && strings.Contains(combined, "blocked"):
		return &LifecycleError{Code: ErrorCodePolicyBlocked, Retryable: false, Err: safeErr}
	default:
		return &LifecycleError{Code: ErrorCodeTerraformFailed, Retryable: false, Err: safeErr}
	}
}

type safeCommandFailure struct {
	cause   error
	message string
}

func (e *safeCommandFailure) Error() string {
	return e.message
}

func (e *safeCommandFailure) Unwrap() error {
	return e.cause
}

type terraformFailureIndicator struct {
	fragments []string
	name      string
}

// Keep this list sorted by name so callback diagnostics are stable and contain
// only allowlisted labels. Raw provider output is intentionally excluded: it
// can contain credentials under arbitrary field names.
var terraformFailureIndicators = []terraformFailureIndicator{
	{name: "authentication", fragments: []string{"authentication failed", "sqlstate 28p01"}},
	{name: "backend_lock", fragments: []string{"error acquiring the state lock"}},
	{name: "certificate_file", fragments: []string{"root certificate file"}},
	{name: "certificate_hostname", fragments: []string{"does not match host name", "server certificate for"}},
	{name: "certificate_validation", fragments: []string{"certificate signed by unknown authority", "certificate verify failed", "self-signed certificate"}},
	{name: "connection_closed", fragments: []string{"eof detected", "server closed the connection unexpectedly", "unexpected eof while reading"}},
	{name: "connection_refused", fragments: []string{"connection refused"}},
	{name: "connection_reset", fragments: []string{"connection reset by peer"}},
	{name: "deadline", fragments: []string{"deadline exceeded"}},
	{name: "local_exec", fragments: []string{"local-exec provisioner error"}},
	{name: "process_killed", fragments: []string{"signal: killed"}},
	{name: "postgres_transient", fragments: []string{"database lifecycle transient postgresql connection failure"}},
	{name: "provider_crash", fragments: []string{"plugin crashed", "provider produced inconsistent result"}},
	{name: "stale_plan", fragments: []string{"saved plan is stale"}},
	{name: "tls", fragments: []string{"ssl syscall", "tls handshake", "x509:"}},
}

func safeTerraformCommandFailure(commandName string, result CommandResult, err error) error {
	details := []string{
		"phase=" + safeTerraformCommandName(commandName),
		"cause=" + safeCommandFailureCause(err),
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		details = append(details, "exit_code="+strconv.Itoa(exitErr.ExitCode()))
	}
	details = append(details,
		"stdout_bytes="+strconv.Itoa(len(result.Stdout)),
		"stderr_bytes="+strconv.Itoa(len(result.Stderr)),
	)
	if indicators := detectTerraformFailureIndicators(result, err); len(indicators) > 0 {
		details = append(details, "indicators="+strings.Join(indicators, ","))
	}
	return &safeCommandFailure{
		cause:   err,
		message: "terraform command failed (" + strings.Join(details, " ") + ")",
	}
}

func safeTerraformCommandName(commandName string) string {
	switch commandName {
	case "apply", "destroy", "init", "output", "plan", "show":
		return commandName
	default:
		return "unknown"
	}
}

func safeCommandFailureCause(err error) string {
	switch {
	case errors.Is(err, context.Canceled):
		return "context_canceled"
	case errors.Is(err, context.DeadlineExceeded):
		return "deadline_exceeded"
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		return "exit_status"
	}
	return "execution_error"
}

func detectTerraformFailureIndicators(result CommandResult, err error) []string {
	combined := strings.ToLower(result.Stdout + "\n" + result.Stderr + "\n" + err.Error())
	indicators := make([]string, 0, len(terraformFailureIndicators))
	for _, indicator := range terraformFailureIndicators {
		for _, fragment := range indicator.fragments {
			if strings.Contains(combined, fragment) {
				indicators = append(indicators, indicator.name)
				break
			}
		}
	}
	return indicators
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
