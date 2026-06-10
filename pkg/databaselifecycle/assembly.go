package databaselifecycle

import (
	"context"
	"errors"
	"fmt"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

type WorkerDependencies struct {
	AgentID              string
	Client               clients.ServerClient
	Executor             CommandExecutor
	Locker               ResourceLocker
	MigrationRunner      migrations.Runner
	Policy               PlanPolicy
	RootDir              string
	AllowedModuleSources []string
	DSNOptions           DSNOptions
	LifecycleConfig      LifecycleConfig
}

func NewWorkerFromDependencies(deps WorkerDependencies) (*Worker, error) {
	if deps.AgentID == "" {
		return nil, errors.New("database lifecycle agent id is required")
	}
	if deps.Client == nil {
		return nil, errors.New("database lifecycle server client is required")
	}
	if deps.Executor == nil {
		return nil, errors.New("database lifecycle command executor is required")
	}
	if deps.Locker == nil {
		return nil, errors.New("database lifecycle resource locker is required")
	}

	runner := NewRunnerWithPolicy(deps.Executor, deps.Policy)
	reporter := CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		return ReportTerminalCallback(ctx, deps.Client, callback)
	})
	// SSL options forwarded into the materializer so the shared-mode
	// `provider "postgresql"` block uses the same posture (sslmode +
	// optional sslrootcert) as DSNOptions, keeping the terraform apply
	// and the subsequent migration run on the same root CA pinning.
	// cursor r3284281726.
	sslOpts := ProviderSSLOptions{
		Mode:               deps.DSNOptions.SSLMode,
		RootCert:           deps.DSNOptions.SSLRootCert,
		AllowedRefPrefixes: deps.DSNOptions.AllowedRefPrefixes,
	}
	materializer := JobMaterializerFunc(func(job Job, dispatch DispatchPayload) error {
		if len(deps.LifecycleConfig.Entries) == 0 {
			return unsupportedShapeError(errors.New("database lifecycle local config is required: set SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG with at least one entry"))
		}
		if dispatch.DesiredSpec.Engine == "" {
			return unsupportedShapeError(errors.New("malformed database lifecycle dispatch: desiredSpec.engine is required"))
		}
		resolved, err := deps.LifecycleConfig.Resolve(dispatch.Environment, dispatch.Profile, dispatch.Operation, dispatch.DesiredSpec.Engine)
		if err != nil {
			return unsupportedShapeError(err)
		}
		if err := ValidateTerraformModuleSource(resolved.Module, deps.AllowedModuleSources); err != nil {
			return unsupportedShapeError(fmt.Errorf("config entry %s/%s: %w", dispatch.Environment, dispatch.Profile, err))
		}
		return MaterializeResolvedJob(job, dispatch, resolved, sslOpts)
	})
	dsnBuilder := NewDSNBuilder(deps.DSNOptions)
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return ClaimDispatches(ctx, deps.Client, agentID)
		}),
		deps.Locker,
		NewPathJobBuilder(deps.RootDir),
		materializer,
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return ProcessDispatch(ctx, runner, deps.MigrationRunner, dsnBuilder, reporter, dispatch, job)
		}),
	)
	worker.ReportFailuresWith(reporter)
	return worker, nil
}

func unsupportedShapeError(err error) error {
	return &LifecycleError{Code: ErrorCodeUnsupportedShape, Retryable: false, Err: err}
}
