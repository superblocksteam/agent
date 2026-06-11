package databaselifecycle

import (
	"context"
	"errors"

	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

type LifecycleRunner interface {
	Run(context.Context, Job) (Result, error)
}

type LifecycleDestroyer interface {
	Destroy(context.Context, Job) (Result, error)
}

type RunnerFunc func(context.Context, Job) (Result, error)

func (f RunnerFunc) Run(ctx context.Context, job Job) (Result, error) {
	return f(ctx, job)
}

type CallbackReporter interface {
	Report(context.Context, TerminalCallback) (TerminalCallbackResult, error)
}

type CallbackReporterFunc func(context.Context, TerminalCallback) (TerminalCallbackResult, error)

func (f CallbackReporterFunc) Report(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
	return f(ctx, callback)
}

// DSNBuilder derives a postgres DSN from a terminal callback's
// connection_metadata + runtime/migration credential refs. Injected so tests can swap in
// a fake without touching AWS Secrets Manager.
type DSNBuilder func(context.Context, TerminalCallback) (string, error)

func ProcessDispatch(
	ctx context.Context,
	runner LifecycleRunner,
	migrationRunner migrations.Runner,
	buildDSN DSNBuilder,
	reporter CallbackReporter,
	dispatch DispatchPayload,
	job Job,
) (TerminalCallbackResult, error) {
	if dispatch.Operation == "migrate_schema" {
		callback := TerminalCallback{
			BindingKey:              dispatch.BindingKey,
			ConnectionMetadata:      dispatch.ConnectionMetadata,
			RuntimeCredentialRefs:   dispatch.RuntimeCredentialRefs,
			MigrationCredentialRefs: dispatch.MigrationCredentialRefs,
			LifecycleState:          "ready",
			MigrationState:          "pending",
			RequestID:               dispatch.RequestID,
		}
		return applyMigrationsAndReport(ctx, migrationRunner, buildDSN, reporter, dispatch, callback)
	}

	result, err := runner.Run(ctx, job)
	if err != nil {
		if isRetryableLifecycleError(err) {
			return TerminalCallbackResult{}, err
		}
		return reportTerminalCallback(ctx, reporter, FailedCallbackFromErrorWithLogs(dispatch, err, result.Logs))
	}

	callback, err := ReadyCallbackFromTerraformOutput(dispatch, result)
	if err != nil {
		return reportTerminalCallback(ctx, reporter, FailedCallbackFromErrorWithLogs(dispatch, err, result.Logs))
	}

	return applyMigrationsAndReport(ctx, migrationRunner, buildDSN, reporter, dispatch, callback)
}

func applyMigrationsAndReport(
	ctx context.Context,
	migrationRunner migrations.Runner,
	buildDSN DSNBuilder,
	reporter CallbackReporter,
	dispatch DispatchPayload,
	callback TerminalCallback,
) (TerminalCallbackResult, error) {
	// Apply migrations before reporting. MigrationState is the contract of
	// "did the explicit migration step complete". Provisioning operations
	// omit the slice and stay pending; migrate_schema with an empty slice is
	// a successful no-op and must unblock the deploy gate.
	if dispatch.Operation == "migrate_schema" && len(dispatch.Migrations) == 0 {
		callback.MigrationState = "migrated"
		return reportTerminalCallback(ctx, reporter, callback)
	}
	if migrationRunner != nil && len(dispatch.Migrations) > 0 {
		dsn, dsnErr := buildDSN(ctx, callback)
		if dsnErr != nil {
			return reportTerminalCallback(ctx, reporter, FailedCallbackFromError(dispatch,
				&LifecycleError{Code: ErrorCodeMigrationFailed, Retryable: false, Err: dsnErr}))
		}
		if _, migErr := migrationRunner.Apply(ctx, dsn, dispatch.Migrations); migErr != nil {
			return reportTerminalCallback(ctx, reporter, FailedCallbackFromError(dispatch,
				&LifecycleError{Code: ErrorCodeMigrationFailed, Retryable: false, Err: migErr}))
		}
		callback.MigrationState = "migrated"
	}
	return reportTerminalCallback(ctx, reporter, callback)
}

func reportTerminalCallback(ctx context.Context, reporter CallbackReporter, callback TerminalCallback) (TerminalCallbackResult, error) {
	result, err := reporter.Report(ctx, callback)
	if err != nil && result == (TerminalCallbackResult{}) {
		result = resultFromTerminalCallback(callback)
	}
	return result, err
}

func resultFromTerminalCallback(callback TerminalCallback) TerminalCallbackResult {
	return TerminalCallbackResult{
		BindingKey:     callback.BindingKey,
		LifecycleState: callback.LifecycleState,
		MigrationState: callback.MigrationState,
		RequestID:      callback.RequestID,
		RequestState:   requestStateFromTerminalCallback(callback),
	}
}

func requestStateFromTerminalCallback(callback TerminalCallback) string {
	if callback.Error != nil || callback.LifecycleState == "failed" {
		return "failed"
	}
	return callback.LifecycleState
}

func isRetryableLifecycleError(err error) bool {
	var lifecycleErr *LifecycleError
	return errors.As(err, &lifecycleErr) && lifecycleErr.Retryable
}
