import { Histogram as OtelHistogram } from '@opentelemetry/api';
import { Histogram } from 'prom-client';
import { toMetricLabels } from '../observability';

export async function observe<T>(
  histogram: Histogram | OtelHistogram,
  labels: Record<string, string | number>,
  fn: () => Promise<T>,
  add: (result: T) => Record<string, string | number> = (_: T): Record<string, string | number> => {
    return {};
  }
): Promise<T> {
  const start: number = Date.now();
  const result: T = await fn();
  if (histogram instanceof Histogram) {
    histogram.observe(
      {
        ...(toMetricLabels(labels) as Record<string, string | number>),
        ...(toMetricLabels(add(result)) as Record<string, string | number>)
      },
      Date.now() - start
    );
  } else {
    histogram.record(Date.now() - start, {
      ...(toMetricLabels(labels) as Record<string, string | number>),
      ...(toMetricLabels(add(result)) as Record<string, string | number>)
    });
  }

  return result;
}
