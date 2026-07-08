package databaselifecycle

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestWorkerPollOnceClaimsAndProcessesDispatches(t *testing.T) {
	var claimedAgentID string
	var materialized []string
	var processed []string
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			claimedAgentID = agentID
			return []DispatchPayload{
				{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"},
				{BindingKey: "app:prod:billing", RequestID: "request-2", ResourceKey: "resource-2"},
			}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey, WorkingDir: "/tmp/" + dispatch.RequestID}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			materialized = append(materialized, dispatch.RequestID+":"+job.WorkingDir)
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			processed = append(processed, job.BindingKey+":"+job.WorkingDir)
			return TerminalCallbackResult{RequestID: dispatch.RequestID, RequestState: "ready"}, nil
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, "agent-1", claimedAgentID)
	require.Equal(t, []string{
		"app:prod:orders:/tmp/request-1",
		"app:prod:billing:/tmp/request-2",
	}, processed)
	require.Equal(t, []string{"request-1:/tmp/request-1", "request-2:/tmp/request-2"}, materialized)
	require.Equal(t, PollResult{Claimed: 2, Processed: 2}, result)
}

func TestWorkerPollOnceMigrateSchemaSkipsTerraformJobSetup(t *testing.T) {
	var processed []string
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", Operation: "migrate_schema", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			t.Fatal("migrate_schema must not build a Terraform job")
			return Job{}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			t.Fatal("migrate_schema must not materialize Terraform files")
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			processed = append(processed, job.BindingKey+":"+job.WorkingDir)
			return TerminalCallbackResult{RequestID: dispatch.RequestID, RequestState: "ready"}, nil
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, []string{"app:prod:orders:"}, processed)
	require.Equal(t, PollResult{Claimed: 1, Processed: 1}, result)
}

func TestWorkerPollOnceContinuesAfterDispatchErrors(t *testing.T) {
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{
				{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"},
				{BindingKey: "app:prod:billing", RequestID: "request-2", ResourceKey: "resource-2"},
			}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			if dispatch.RequestID == "request-1" {
				return Job{}, errors.New("missing workspace")
			}
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{RequestID: dispatch.RequestID, RequestState: "ready"}, nil
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 2, result.Claimed)
	require.Equal(t, 1, result.Processed)
	require.Len(t, result.Errors, 1)
	require.Equal(t, "request-1", result.Errors[0].RequestID)
	require.False(t, result.Errors[0].Retryable)
	require.ErrorContains(t, result.Errors[0].Err, "missing workspace")
}

func TestWorkerPollOnceReturnsClaimErrors(t *testing.T) {
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return nil, errors.New("claim unavailable")
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{}, nil
		}),
	)

	_, err := worker.PollOnce(context.Background(), "agent-1")

	require.ErrorContains(t, err, "claim unavailable")
}

func TestWorkerPollOnceDoesNotProcessMaterializationErrors(t *testing.T) {
	processed := false
	var reported []TerminalCallback
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, errors.New("write backend")
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			processed = true
			return TerminalCallbackResult{}, nil
		}),
	)
	worker.ReportFailuresWith(CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		reported = append(reported, callback)
		return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.False(t, processed)
	// cursor r3283851696: reporting the failure to the server is a side
	// effect; the worker-side accounting must still record the dispatch
	// as a poll error, not as Processed. Operators looking at
	// "processed=1, errors=0" would otherwise miss broken dispatches
	// entirely and the loop logger would never surface the failure.
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.ErrorContains(t, result.Errors[0].Err, "write backend")
	require.Len(t, reported, 1)
	require.Equal(t, "request-1", reported[0].RequestID)
	require.Equal(t, "failed", reported[0].LifecycleState)
	require.Equal(t, "terraform_failed", reported[0].Error.Code)
	require.Contains(t, reported[0].Error.Message, "write backend")
}

func TestWorkerPollOnceDoesNotReportRetryableMaterializationErrorsAsTerminalFailures(t *testing.T) {
	var reported []TerminalCallback
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, &LifecycleError{Code: ErrorCodeCallbackFailed, Retryable: true, Err: errors.New("progress callback unavailable")}
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			t.Fatal("retryable materialization errors must not process the dispatch")
			return TerminalCallbackResult{}, nil
		}),
	)
	worker.ReportFailuresWith(CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		reported = append(reported, callback)
		return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.True(t, result.Errors[0].Retryable)
	require.ErrorContains(t, result.Errors[0].Err, "progress callback unavailable")
	require.Empty(t, reported)
}

func TestWorkerPollOnceUsesBindingKeyWhenResourceKeyIsMissing(t *testing.T) {
	var lockRelease ReleaseFunc
	var materialized []DispatchPayload
	locker := NewMemoryLocker()
	release, err := locker.Lock(context.Background(), "app:prod:orders")
	require.NoError(t, err)
	lockRelease = release
	lockRelease()

	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1"}}, nil
		}),
		locker,
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			materialized = append(materialized, dispatch)
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			lockRelease, err = locker.Lock(ctx, "app:prod:orders")
			require.ErrorIs(t, err, ErrResourceLocked)
			return TerminalCallbackResult{RequestID: dispatch.RequestID, RequestState: "ready"}, nil
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, PollResult{Claimed: 1, Processed: 1}, result)
	require.Len(t, materialized, 1)
	require.Equal(t, "app:prod:orders", materialized[0].ResourceKey)
}

func TestWorkerPollOncePreservesOriginalFailureWhenReportingFails(t *testing.T) {
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{}, errors.New("missing workspace")
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{}, nil
		}),
	)
	worker.ReportFailuresWith(CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		return TerminalCallbackResult{}, errors.New("callback failed")
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Len(t, result.Errors, 1)
	require.ErrorContains(t, result.Errors[0].Err, "missing workspace")
	require.ErrorContains(t, result.Errors[0].Err, "callback failed")
}

func TestWorkerPollOnceReportsNonRetryableLockFailures(t *testing.T) {
	var built bool
	var reported []TerminalCallback
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{RequestID: "request-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			built = true
			return Job{}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{}, nil
		}),
	)
	worker.ReportFailuresWith(CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
		reported = append(reported, callback)
		return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.False(t, built)
	// cursor r3283851696: the reported-but-failed dispatch still belongs
	// in result.Errors (so operators and the loop logger see it) — the
	// terminal callback to the server is the side effect of recording the
	// failure, not a signal that the dispatch processed cleanly.
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.ErrorContains(t, result.Errors[0].Err, "database lifecycle resource key is required")
	require.Len(t, reported, 1)
	require.Equal(t, "request-1", reported[0].RequestID)
	require.Equal(t, "failed", reported[0].LifecycleState)
	require.Equal(t, "terraform_failed", reported[0].Error.Code)
	require.Contains(t, reported[0].Error.Message, "database lifecycle resource key is required")
}

func TestWorkerPollOnceSkipsLockedResources(t *testing.T) {
	locker := NewMemoryLocker()
	release, err := locker.Lock(context.Background(), "resource-1")
	require.NoError(t, err)
	defer release()
	processed := false
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		locker,
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			processed = true
			return TerminalCallbackResult{}, nil
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.False(t, processed)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.True(t, result.Errors[0].Retryable)
	require.ErrorIs(t, result.Errors[0].Err, ErrResourceLocked)
}

func TestWorkerPollOnceMarksRetryableLifecycleErrors(t *testing.T) {
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{}, &LifecycleError{Code: ErrorCodeBackendLocked, Retryable: true, Err: errors.New("state lock")}
		}),
	)

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.True(t, result.Errors[0].Retryable)
}

func TestWorkerPollOnceReleasesReservedPhysicalDatabaseInstanceAfterTerminalFailure(t *testing.T) {
	var released []string
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", Operation: "ensure_database", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			dispatch.PhysicalDatabaseInstanceID = "11111111-1111-4111-8111-111111111111"
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			require.Equal(t, "11111111-1111-4111-8111-111111111111", dispatch.PhysicalDatabaseInstanceID)
			return TerminalCallbackResult{LifecycleState: "failed", RequestID: dispatch.RequestID, RequestState: "failed"}, nil
		}),
	)
	worker.ReleaseReservedPhysicalDatabaseInstancesWith(PhysicalDatabaseInstanceReleaserFunc(func(ctx context.Context, instanceID string) error {
		released = append(released, instanceID)
		return nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, PollResult{Claimed: 1, Processed: 1}, result)
	require.Equal(t, []string{"11111111-1111-4111-8111-111111111111"}, released)
}

func TestWorkerPollOnceSurfacesReleaseErrorAfterTerminalFailure(t *testing.T) {
	releaseErr := errors.New("release failed")
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", Operation: "ensure_database", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			dispatch.PhysicalDatabaseInstanceID = "11111111-1111-4111-8111-111111111111"
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{LifecycleState: "failed", RequestID: dispatch.RequestID, RequestState: "failed"}, nil
		}),
	)
	worker.ReleaseReservedPhysicalDatabaseInstancesWith(PhysicalDatabaseInstanceReleaserFunc(func(ctx context.Context, instanceID string) error {
		return releaseErr
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.ErrorIs(t, result.Errors[0].Err, releaseErr)
	require.ErrorContains(t, result.Errors[0].Err, "release reserved physical database instance 11111111-1111-4111-8111-111111111111")
	require.False(t, result.Errors[0].Retryable)
}

func TestWorkerPollOnceKeepsReservedPhysicalDatabaseInstanceAfterRetryableProcessorError(t *testing.T) {
	var released []string
	processorErr := &LifecycleError{Code: ErrorCodeBackendLocked, Retryable: true, Err: errors.New("state lock")}
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", Operation: "ensure_database", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			dispatch.PhysicalDatabaseInstanceID = "11111111-1111-4111-8111-111111111111"
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{}, processorErr
		}),
	)
	worker.ReleaseReservedPhysicalDatabaseInstancesWith(PhysicalDatabaseInstanceReleaserFunc(func(ctx context.Context, instanceID string) error {
		released = append(released, instanceID)
		return nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.ErrorIs(t, result.Errors[0].Err, processorErr)
	require.True(t, result.Errors[0].Retryable)
	// A retryable processor error keeps the reservation so the retry resumes
	// physical_db_reserved with a live reservation; releasing it here would
	// strand the retry against a pool slot the worker no longer holds.
	require.Empty(t, released)
}

func TestWorkerPollOnceKeepsReservedPhysicalDatabaseInstanceAfterReadyCallbackError(t *testing.T) {
	var released []string
	callbackErr := errors.New("callback failed")
	worker := NewWorker(
		DispatchClaimerFunc(func(ctx context.Context, agentID string) ([]DispatchPayload, error) {
			return []DispatchPayload{{BindingKey: "app:prod:orders", Operation: "ensure_database", RequestID: "request-1", ResourceKey: "resource-1"}}, nil
		}),
		NewMemoryLocker(),
		JobBuilderFunc(func(dispatch DispatchPayload) (Job, error) {
			return Job{BindingKey: dispatch.BindingKey}, nil
		}),
		JobMaterializerFunc(func(ctx context.Context, job Job, dispatch DispatchPayload) (DispatchPayload, error) {
			dispatch.PhysicalDatabaseInstanceID = "11111111-1111-4111-8111-111111111111"
			return dispatch, nil
		}),
		DispatchProcessorFunc(func(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{LifecycleState: "ready", RequestID: dispatch.RequestID, RequestState: "ready"}, callbackErr
		}),
	)
	worker.ReleaseReservedPhysicalDatabaseInstancesWith(PhysicalDatabaseInstanceReleaserFunc(func(ctx context.Context, instanceID string) error {
		released = append(released, instanceID)
		return nil
	}))

	result, err := worker.PollOnce(context.Background(), "agent-1")

	require.NoError(t, err)
	require.Equal(t, 0, result.Processed)
	require.Len(t, result.Errors, 1)
	require.ErrorIs(t, result.Errors[0].Err, callbackErr)
	require.False(t, result.Errors[0].Retryable)
	require.Empty(t, released)
}
