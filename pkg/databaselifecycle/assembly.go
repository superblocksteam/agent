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
	physicalDatabaseInstanceClient := NewServerPhysicalDatabaseInstanceLifecycleClient(deps.Client)
	physicalDatabaseInstanceProvisioner := newTerraformPhysicalDatabaseInstanceProvisioner(deps.LifecycleConfig, deps.AllowedModuleSources, deps.RootDir, runner, sslOpts)
	physicalDatabaseInstanceLifecycle := NewPhysicalDatabaseInstanceLifecycle(physicalDatabaseInstanceClient, physicalDatabaseInstanceProvisioner)
	materializer := JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
		if len(deps.LifecycleConfig.Entries) == 0 {
			return dispatch, unsupportedShapeError(errors.New("database lifecycle local config is required: set SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG with at least one entry"))
		}
		if dispatch.DesiredSpec.Engine == "" {
			return dispatch, unsupportedShapeError(errors.New("malformed database lifecycle dispatch: desiredSpec.engine is required"))
		}
		resolved, err := deps.LifecycleConfig.Resolve(dispatch.Environment, dispatch.Profile, dispatch.Operation, dispatch.DesiredSpec.Engine)
		if err != nil {
			return dispatch, unsupportedShapeError(err)
		}
		if err := ValidateTerraformModuleSource(resolved.Module, deps.AllowedModuleSources); err != nil {
			return dispatch, unsupportedShapeError(fmt.Errorf("config entry %s/%s: %w", dispatch.Environment, dispatch.Profile, err))
		}
		if err := validateSharedPostgresEnsureCredentialSecretPrefix(dispatch, resolved); err != nil {
			return dispatch, err
		}
		if shouldReservePhysicalDatabaseInstance(dispatch, resolved) {
			instance, err := physicalDatabaseInstanceLifecycle.ReserveForEnsure(ctx, physicalDatabaseInstanceSelector(dispatch, resolved))
			if err != nil {
				return dispatch, err
			}
			dispatch.PhysicalDatabaseInstanceID = instance.ID
			resolved = ResolveWithPhysicalDatabaseInstance(resolved, instance)
		}
		if err := MaterializeResolvedJob(job, dispatch, resolved, sslOpts); err != nil {
			if dispatch.PhysicalDatabaseInstanceID != "" {
				if releaseErr := releaseReservedPhysicalDatabaseInstance(ctx, physicalDatabaseInstanceClient, dispatch.PhysicalDatabaseInstanceID); releaseErr != nil {
					return dispatch, errors.Join(err, releaseErr)
				}
			}
			return dispatch, err
		}
		return dispatch, nil
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
	worker.ReleaseReservedPhysicalDatabaseInstancesWith(physicalDatabaseInstanceClient)
	return worker, nil
}

func unsupportedShapeError(err error) error {
	return &LifecycleError{Code: ErrorCodeUnsupportedShape, Retryable: false, Err: err}
}

func shouldReservePhysicalDatabaseInstance(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) bool {
	credentialSecretPrefix, hasCredentialSecretPrefix := resolved.Module.Inputs[credentialSecretPrefixInput].(string)
	return dispatch.Operation == "ensure_database" &&
		isPostgresManagedDatabaseSource(resolved.Module.Source) &&
		hasCredentialSecretPrefix &&
		credentialSecretPrefix != ""
}

func validateSharedPostgresEnsureCredentialSecretPrefix(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) error {
	if dispatch.Operation != "ensure_database" || !isPostgresManagedDatabaseSource(resolved.Module.Source) {
		return nil
	}
	if _, exists := resolved.Module.Inputs[credentialSecretPrefixInput]; !exists {
		return nil
	}
	return validateSharedModeCredentialSecretPrefix(resolved.Module.Inputs)
}

func physicalDatabaseInstanceSelector(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) PhysicalDatabaseInstanceSelector {
	return PhysicalDatabaseInstanceSelector{
		Region:      stringBackendValue(resolved.Backend, "region"),
		Environment: dispatch.Environment,
		Profile:     dispatch.Profile,
		Engine:      dispatch.DesiredSpec.Engine,
	}
}

func stringBackendValue(backend map[string]any, key string) string {
	value, _ := backend[key].(string)
	return value
}

const physicalDatabaseInstanceReleaseAttempts = 3

func releaseReservedPhysicalDatabaseInstance(ctx context.Context, releaser PhysicalDatabaseInstanceReleaser, instanceID string) error {
	if releaser == nil || instanceID == "" {
		return nil
	}

	var lastErr error
	for attempt := 0; attempt < physicalDatabaseInstanceReleaseAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := releaser.ReleasePhysicalDatabaseInstance(ctx, instanceID); err != nil {
			lastErr = err
			continue
		}
		return nil
	}

	return fmt.Errorf("release reserved physical database instance %s: %w", instanceID, lastErr)
}
