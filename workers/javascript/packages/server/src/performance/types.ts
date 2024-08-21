import { OBS_TAG_EVENT_TYPE, OBS_TAG_PLUGIN_EVENT, OBS_TAG_PLUGIN_NAME, OBS_TAG_RESOURCE_TYPE } from '@superblocks/shared';
import { Logger } from 'pino';
import { KVStore, KVStoreTx, TxProcessFunc, Wrapped } from '../types';

/**
 * Wraps an observed value.
 */
export interface Observable {
  /**
   * How long we think this step will take.
   */
  estimate?: number;
  /**
   * The observed value.
   */
  value?: number;
  /**
   * The epoch start time.
   */
  start?: number;
  /**
   * The epoch end time.
   */
  end?: number;
  /**
   * The payload size in bytes.
   */
  bytes?: number;
}

export interface ApiPerformance extends PerformanceAPI<ApiPerformance, ApiMetricLabels> {
  /**
   * The duration of an API.
   */
  total: Observable;
  /**
   * The time it takes to fetch the following (performed in a single transaction):
   *
   *    1. Write the shared execution context.
   *    2. Write the datasource and action configurations for each step.
   *    3. Read the submitted execution time estimations for each step.
   *
   *    NOTE: Execution estimates will only be read for language steps.
   */
  kvStoreInit: Observable;
  /**
   * The performance results for each step.
   */
  steps: Record<string, StepPerformance>;
  /**
   * The time it takes to fetch the following (performed in a single transaction):
   *
   *    1. Read the output for the final step.
   *    2. Write the updated execution estimates.
   *
   *    NOTE: Execution estimates will only be written for language steps.
   */
  kvStoreResult: Observable;
  /**
   * The number of steps that were binpacked.
   * As an exmaple is provided below.
   *
   * [1, 2] [3] [4] [5, 6, 7] = 3;
   */
  binpacked: number;
}

/**
 * A store for every space and time metric we want to track during a step's
 * execution. Every metric except {@link total} is mutually exclusive.
 */
export interface StepPerformance extends PerformanceAPI<StepPerformance, StepMetricLabels> {
  /**
   * Records whether there's an error.
   *
   * NOTE(frank): I don't think I like the biz logic I'm hiding behind this. I think it'd
   *              be better to extend an Estimator interface that has a purge field.
   */
  error?: boolean;
  /**
   * The duration of a {@link WorkerAPI} method call.
   */
  total: Observable;
  /**
   * The duration of a {@link BasePlugin} method call.
   */
  pluginExecution: Observable;
  /**
   * Time spent in queue including network I/O duration.
   */
  queueRequest: Observable;
  /**
   * Time spent in queue including network I/O duration.
   */
  queueResponse: Observable;
  /**
   * The time it takes to fetch the following (performed in a single transaction):
   *
   *    1. The execution context shared by all steps in an API.
   *    2. The datasource configuration.
   *    3. The action configuration.
   */
  kvStoreFetch: Observable;
  /**
   * The time it takes to write the output of this step.
   */
  kvStorePush: Observable;
  /**
   * The number of referenced bindings.
   */
  bindings: Wrapped<void, number>;
}

export interface PerformanceAPI<T extends ApiPerformance | StepPerformance, U extends ApiMetricLabels | StepMetricLabels> {
  /**
   * Merges two partially populated performance samples together.
   *
   * @param data
   */
  merge(data: Partial<T>): T;
  /**
   * Computes the total overhead in milliseconds.
   */
  overhead(): Overhead;
  /**
   * Computes all derivable properties from submitted properties.
   */
  process(): T;
  /**
   * The total number of bytes transmitted
   */
  bytes(): number;
  /**
   * Flush metrics;
   *
   * @param labels
   */
  flush(labels: U, logger?: Logger): void;
}

export interface Estimate {
  /**
   * Reports the execution times to the KV store.
   * @param store
   * @return The number of bytes flushed.
   */
  report(store: KVStore, expiration?: number): Promise<void>;
  /**
   * Retrieve execution estimates from the store.
   * @param store
   */
  estimate(store: KVStore | KVStoreTx): Promise<void | TxProcessFunc>;
}

export interface Overhead {
  absolute: number;
  percentage: number;
}

export type StepMetricLabels = CommonMetricLabels & {
  [OBS_TAG_PLUGIN_NAME]: string;
  [OBS_TAG_PLUGIN_EVENT]: string;
  bucket: string;
};

export type ApiMetricLabels = CommonMetricLabels;

export type CommonMetricLabels = {
  [OBS_TAG_RESOURCE_TYPE]: string;
  [OBS_TAG_EVENT_TYPE]: string;

  result: string;
};
