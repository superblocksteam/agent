package databaselifecycle

import (
	"context"
	"errors"
	"fmt"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

type WorkerDependencies struct {
	AgentID                  string
	Client                   clients.ServerClient
	Executor                 CommandExecutor
	Locker                   ResourceLocker
	MasterCredentialResolver MasterCredentialResolver
	MigrationRunner          migrations.Runner
	Policy                   PlanPolicy
	RootDir                  string
	AllowedModuleSources     []string
	DSNOptions               DSNOptions
	LifecycleConfig          LifecycleConfig
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

	runner := NewRunnerWithPolicyAndMasterCredentials(deps.Executor, deps.Policy, deps.MasterCredentialResolver)
	reporter := CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		return ReportTerminalCallback(ctx, deps.Client, callback)
	})
	progressReporter := ProgressReporterFunc(func(ctx context.Context, callback ProgressCallback) (ProgressCallbackResult, error) {
		return ReportProgressCallback(ctx, deps.Client, callback)
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
	physicalDatabaseInstanceLifecycle.ReportProgressWith(progressReporter)
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
		var physicalDatabaseInstance PhysicalDatabaseInstance
		var physicalDatabaseInstanceSelector PhysicalDatabaseInstanceSelector
		releaseAfterMaterializationFailure := func(materializationErr error) error {
			// Retire attaches a physical instance ID without reserving capacity.
			// Only reserved ensure paths may release pool slots on materialization
			// failure (cursor Bugbot / David Zhang on #2806).
			if !dispatch.PhysicalDatabaseInstanceReserved || dispatch.PhysicalDatabaseInstanceID == "" {
				return materializationErr
			}
			if releaseErr := releaseReservedPhysicalDatabaseInstance(ctx, physicalDatabaseInstanceClient, dispatch.PhysicalDatabaseInstanceID); releaseErr != nil {
				return errors.Join(materializationErr, releaseErr)
			}
			// The reservation is released above, so the pool slot is never
			// leaked. The physical_db_registered downgrade is best-effort
			// cleanup: materialization failures are deterministic, so this
			// dispatch will not succeed on retry, and the downgrade callback
			// failing (a retryable LifecycleError) must NOT reclassify the
			// terminal materialization failure as retryable — a retry would
			// otherwise resume physical_db_reserved without a live
			// reservation. Fold the callback failure in with %v so it is
			// surfaced without contributing a retryable error to the tree.
			if progressErr := physicalDatabaseInstanceLifecycle.reportPhysicalDatabaseInstanceProgress(ctx, physicalDatabaseInstanceSelector, physicalDatabaseInstance, "physical_db_registered"); progressErr != nil {
				return fmt.Errorf("%w; physical_db_registered progress callback also failed: %v", materializationErr, progressErr)
			}
			return materializationErr
		}
		if shouldReservePhysicalDatabaseInstance(dispatch, resolved) {
			physicalDatabaseInstanceSelector = physicalDatabaseInstanceSelectorFromDispatch(dispatch, resolved)
			instance, err := physicalDatabaseInstanceLifecycle.ReserveForEnsure(ctx, physicalDatabaseInstanceSelector)
			if err != nil {
				return dispatch, err
			}
			physicalDatabaseInstance = instance
			dispatch.PhysicalDatabaseInstanceID = instance.ID
			dispatch.PhysicalDatabaseInstanceReserved = true
			resolved, err = ResolveWithPhysicalDatabaseInstance(resolved, instance)
			if err != nil {
				return dispatch, releaseAfterMaterializationFailure(err)
			}
		}
		if err := attachPhysicalDatabaseInstanceForDeprovision(ctx, physicalDatabaseInstanceClient, &dispatch, &resolved); err != nil {
			return dispatch, err
		}
		if err := MaterializeResolvedJob(job, dispatch, resolved, sslOpts); err != nil {
			return dispatch, releaseAfterMaterializationFailure(err)
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
	if resolved.PhysicalDatabase != nil {
		return dispatch.Operation == "ensure_database" && (resolved.PhysicalDatabase.Mode == PhysicalDatabaseModeSharedPool || resolved.PhysicalDatabase.Mode == PhysicalDatabaseModeDedicated)
	}
	credentialSecretPrefix, hasCredentialSecretPrefix := resolved.Module.Inputs[credentialSecretPrefixInput].(string)
	return dispatch.Operation == "ensure_database" &&
		isPostgresManagedDatabaseSource(resolved.Module.Source) &&
		(isIAMAuthModule(resolved.Module.Inputs) || (hasCredentialSecretPrefix && credentialSecretPrefix != ""))
}

const physicalDatabaseInstanceRefMetadataKey = "physical_database_instance_ref"

func physicalDatabaseInstanceIDFromDispatch(dispatch DispatchPayload) string {
	if dispatch.PhysicalDatabaseInstanceID != "" {
		return dispatch.PhysicalDatabaseInstanceID
	}
	ref, _ := dispatch.ConnectionMetadata[physicalDatabaseInstanceRefMetadataKey].(string)
	return ref
}

func shouldAttachPhysicalDatabaseInstanceForDeprovision(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) bool {
	credentialSecretPrefix, hasCredentialSecretPrefix := resolved.Module.Inputs[credentialSecretPrefixInput].(string)
	return dispatch.Operation == operationRetireDatabase &&
		isPostgresManagedDatabaseSource(resolved.Module.Source) &&
		(isIAMAuthModule(resolved.Module.Inputs) || (hasCredentialSecretPrefix && credentialSecretPrefix != "")) &&
		physicalDatabaseInstanceIDFromDispatch(dispatch) != ""
}

func attachPhysicalDatabaseInstanceForDeprovision(
	ctx context.Context,
	client PhysicalDatabaseInstanceLifecycleClient,
	dispatch *DispatchPayload,
	resolved *ResolvedLifecycleConfig,
) error {
	if !shouldAttachPhysicalDatabaseInstanceForDeprovision(*dispatch, *resolved) {
		return nil
	}
	instanceID := physicalDatabaseInstanceIDFromDispatch(*dispatch)
	// Lookup by id — not listAccepting. A pool that already holds this binding
	// is commonly full (capacity_used == capacity_max) or draining; those
	// instances are invisible to the allocation list.
	instance, err := client.GetPhysicalDatabaseInstance(ctx, instanceID)
	if err != nil {
		// Unclassified errors become terraform_failed in FailedCallbackFromError.
		// Attach is a control-plane lookup, not tofu destroy — wrap as internal
		// so a missing/invalid physical_database_instance_ref is not reported as
		// a destroy failure (cursor r3582030573).
		var lifecycleErr *LifecycleError
		if errors.As(err, &lifecycleErr) {
			return err
		}
		return &LifecycleError{Code: ErrorCodeInternal, Retryable: false, Err: err}
	}
	dispatch.PhysicalDatabaseInstanceID = instance.ID
	updated, err := ResolveWithPhysicalDatabaseInstance(*resolved, instance)
	if err != nil {
		return err
	}
	*resolved = updated
	return nil
}

func validateSharedPostgresEnsureCredentialSecretPrefix(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) error {
	if dispatch.Operation != "ensure_database" || !isPostgresManagedDatabaseSource(resolved.Module.Source) {
		return nil
	}
	if _, exists := resolved.Module.Inputs[credentialSecretPrefixInput]; !exists {
		return nil
	}
	if isIAMAuthModule(resolved.Module.Inputs) {
		return nil
	}
	return validateSharedModeCredentialSecretPrefix(resolved.Module.Inputs)
}

func physicalDatabaseInstanceSelectorFromDispatch(dispatch DispatchPayload, resolved ResolvedLifecycleConfig) PhysicalDatabaseInstanceSelector {
	provisionOperation := operationEnsurePhysicalDatabaseInstance
	mode := PhysicalDatabaseMode("")
	capacityMax := 0
	securityClass := ""
	if resolved.PhysicalDatabase != nil && resolved.PhysicalDatabase.ProvisionOperation != "" {
		provisionOperation = resolved.PhysicalDatabase.ProvisionOperation
	}
	if resolved.PhysicalDatabase != nil {
		mode = resolved.PhysicalDatabase.Mode
		capacityMax = resolved.PhysicalDatabase.CapacityMax
		securityClass = resolved.PhysicalDatabase.SecurityClass
	}
	return PhysicalDatabaseInstanceSelector{
		BindingKey:                   dispatch.BindingKey,
		RequestID:                    dispatch.RequestID,
		Region:                       stringBackendValue(resolved.Backend, "region"),
		Environment:                  dispatch.Environment,
		Profile:                      dispatch.Profile,
		Engine:                       dispatch.DesiredSpec.Engine,
		Mode:                         mode,
		ProvisionOperation:           provisionOperation,
		CapacityMax:                  capacityMax,
		SecurityClass:                securityClass,
		ParentResourceKey:            dispatch.ResourceKey,
		CurrentState:                 dispatch.Continuation.CurrentState,
		PhysicalDatabaseInstanceID:   dispatch.Continuation.PhysicalDatabaseInstanceID,
		PhysicalTerraformResourceKey: dispatch.Continuation.PhysicalTerraformResourceKey,
		RequireIAMPhysicalMetadata:   isIAMAuthModule(resolved.Module.Inputs),
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
