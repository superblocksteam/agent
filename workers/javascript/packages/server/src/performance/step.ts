import { Logger } from 'pino';
import { Wrapped } from '../types';
import { Observable, StepPerformance, StepMetricLabels, Overhead, PerformanceAPI } from './types';
import { elapsed } from './utils';

export class StepPerformanceImpl implements StepPerformance, PerformanceAPI<StepPerformance, StepMetricLabels> {
  public error = false;
  public total: Observable = {};
  public pluginExecution: Observable = {};
  public queueRequest: Observable = {};
  public queueResponse: Observable = {};
  public kvStoreFetch: Observable = {};
  public kvStorePush: Observable = {};
  public bindings: Wrapped<void, number> = { data: 0 };

  constructor(perf?: Partial<StepPerformance>) {
    this.merge(perf);
  }

  /**
   * This should no longer be used as we're not tracking any metrics in the workers themselves.
   * @deprecated
   */
  public flush(labels: StepMetricLabels, logger?: Logger): void {
    this.process();
  }

  public merge(perf?: Partial<StepPerformance>): StepPerformance {
    if (perf) {
      this.total = { ...this.total, ...perf.total };
      this.pluginExecution = { ...this.pluginExecution, ...perf.pluginExecution };
      this.queueRequest = { ...this.queueRequest, ...perf.queueRequest };
      this.queueResponse = { ...this.queueResponse, ...perf.queueResponse };
      this.kvStoreFetch = { ...this.kvStoreFetch, ...perf.kvStoreFetch };
      this.kvStorePush = { ...this.kvStorePush, ...perf.kvStorePush };
      this.bindings.data = this.bindings.data += perf.bindings?.data || 0;
      this.error = perf.error || false;
    }

    return this.process();
  }

  /**
   * TODO(frank): This could return NaN. Change the underlying type to an optional number.
   * @returns
   */
  public overhead(): Overhead {
    this.process();

    const absolute: number = (this.total.value as number) - (this.pluginExecution.value as number);

    return {
      absolute,
      percentage: absolute / (this.pluginExecution.value as number)
    };
  }

  public bytes(): number {
    return [this.kvStoreFetch, this.kvStorePush, this.queueRequest, this.queueResponse].reduce((prev: number, curr: Observable): number => {
      return prev + (curr.bytes || 0);
    }, 0);
  }

  public process(): StepPerformance {
    elapsed(this.total, this.pluginExecution, this.queueRequest, this.queueResponse, this.kvStoreFetch, this.kvStorePush);
    this.total.bytes = this.bytes();
    return this;
  }
}
