export type RequestTiming = {
  requestStart?: number;
  requestEnd?: number;
  requestDurationMs?: number;
};

export type ApiResourceTiming = RequestTiming & {
  fetchStart?: number;
  fetchEnd?: number;
  fetchDurationMs?: number;

  executeStart?: number;
  executeEnd?: number;
  executeDurationMs?: number;

  fetchAndExecuteStart?: number;
  fetchAndExecuteEnd?: number;
  fetchAndExecuteDurationMs?: number;

  // DEFER TODO(taha) Add step specific timings for datasource bindings resolution, action bindings
  // resolution, and action execution times. Eventually replace the use of the action-specific
  // execution times available in the ExecutionOutput object.
  steps?: {
    [key: string]: {
      resolveDatasourceBindingsStart?: number;
      resolveDatasourceBindingsEnd?: number;
      resolveDatasourceBindingsDurationMs?: number;

      resolveActionBindingsStart?: number;
      resolveActionBindingsEnd?: number;
      resolveActionBindingsDurationMs?: number;

      executeStart?: number;
      executeEnd?: number;
      executeDurationMs?: number;
    };
  };
};

export type Timing = RequestTiming | ApiResourceTiming;
