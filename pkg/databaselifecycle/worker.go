package databaselifecycle

import (
	"context"
	"errors"
)

type DispatchClaimer interface {
	Claim(context.Context, string) ([]DispatchPayload, error)
}

type DispatchClaimerFunc func(context.Context, string) ([]DispatchPayload, error)

func (f DispatchClaimerFunc) Claim(ctx context.Context, agentID string) ([]DispatchPayload, error) {
	return f(ctx, agentID)
}

type JobBuilder interface {
	Build(DispatchPayload) (Job, error)
}

type JobBuilderFunc func(DispatchPayload) (Job, error)

func (f JobBuilderFunc) Build(dispatch DispatchPayload) (Job, error) {
	return f(dispatch)
}

type DispatchProcessor interface {
	Process(context.Context, DispatchPayload, Job) (TerminalCallbackResult, error)
}

type DispatchProcessorFunc func(context.Context, DispatchPayload, Job) (TerminalCallbackResult, error)

func (f DispatchProcessorFunc) Process(ctx context.Context, dispatch DispatchPayload, job Job) (TerminalCallbackResult, error) {
	return f(ctx, dispatch, job)
}

type JobMaterializer interface {
	Materialize(Job, DispatchPayload) error
}

type JobMaterializerFunc func(Job, DispatchPayload) error

func (f JobMaterializerFunc) Materialize(job Job, dispatch DispatchPayload) error {
	return f(job, dispatch)
}

type Worker struct {
	claimer      DispatchClaimer
	locker       ResourceLocker
	builder      JobBuilder
	materializer JobMaterializer
	processor    DispatchProcessor
	reporter     CallbackReporter
}

type PollResult struct {
	Claimed   int
	Processed int
	Errors    []PollError
}

type PollError struct {
	BindingKey string
	Err        error
	RequestID  string
	Retryable  bool
}

func NewWorker(claimer DispatchClaimer, locker ResourceLocker, builder JobBuilder, materializer JobMaterializer, processor DispatchProcessor) *Worker {
	return &Worker{
		claimer:      claimer,
		locker:       locker,
		builder:      builder,
		materializer: materializer,
		processor:    processor,
	}
}

func (w *Worker) ReportFailuresWith(reporter CallbackReporter) {
	w.reporter = reporter
}

func (w *Worker) PollOnce(ctx context.Context, agentID string) (PollResult, error) {
	dispatches, err := w.claimer.Claim(ctx, agentID)
	if err != nil {
		return PollResult{}, err
	}

	result := PollResult{Claimed: len(dispatches)}
	for _, dispatch := range dispatches {
		if err := w.pollDispatch(ctx, dispatch); err != nil {
			result.Errors = append(result.Errors, pollError(dispatch, err))
			continue
		}
		result.Processed++
	}

	return result, nil
}

func (w *Worker) pollDispatch(ctx context.Context, dispatch DispatchPayload) error {
	dispatch = normalizeDispatchLockKey(dispatch)
	release, err := w.locker.Lock(ctx, dispatch.ResourceKey)
	if err != nil {
		if errors.Is(err, ErrResourceLocked) {
			return err
		}
		return w.reportFailure(ctx, dispatch, err)
	}
	defer release()

	return w.processLockedDispatch(ctx, dispatch)
}

func normalizeDispatchLockKey(dispatch DispatchPayload) DispatchPayload {
	if dispatch.ResourceKey == "" {
		dispatch.ResourceKey = dispatch.BindingKey
	}
	return dispatch
}

func (w *Worker) processLockedDispatch(ctx context.Context, dispatch DispatchPayload) error {
	if dispatch.Operation == "migrate_schema" {
		if _, err := w.processor.Process(ctx, dispatch, Job{BindingKey: dispatch.BindingKey}); err != nil {
			return err
		}
		return nil
	}

	job, err := w.builder.Build(dispatch)
	if err != nil {
		return w.reportFailure(ctx, dispatch, err)
	}
	if err := w.materializer.Materialize(job, dispatch); err != nil {
		return w.reportFailure(ctx, dispatch, err)
	}
	if _, err := w.processor.Process(ctx, dispatch, job); err != nil {
		return err
	}
	return nil
}

// reportFailure informs the server about a dispatch failure and ALWAYS
// returns the original error (joined with any reporter error). cursor
// r3283851696: previously returned nil on a successful report, which
// caused PollOnce to bump result.Processed for a dispatch that had
// actually failed and to leave result.Errors empty — operators saw
// "processed 1, errors 0" for a broken dispatch and the loop logger
// never surfaced the failure. The terminal callback going to the server
// is a side effect (so the control plane sees the binding move to
// `failed`); the worker-side accounting must still record it as a poll
// error.
func (w *Worker) reportFailure(ctx context.Context, dispatch DispatchPayload, err error) error {
	if w.reporter == nil {
		return err
	}
	_, reportErr := w.reporter.Report(ctx, FailedCallbackFromError(dispatch, err))
	if reportErr != nil {
		return errors.Join(err, reportErr)
	}
	return err
}

func pollError(dispatch DispatchPayload, err error) PollError {
	return PollError{
		BindingKey: dispatch.BindingKey,
		Err:        err,
		RequestID:  dispatch.RequestID,
		Retryable:  isRetryablePollError(err),
	}
}

func isRetryablePollError(err error) bool {
	if errors.Is(err, ErrResourceLocked) {
		return true
	}
	return isRetryableLifecycleError(err)
}
