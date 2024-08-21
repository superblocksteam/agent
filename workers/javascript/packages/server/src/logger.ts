import { context } from '@opentelemetry/api';
import { default as pino } from 'pino';
import { SUPERBLOCKS_WORKER_ID as id, SUPERBLOCKS_WORKER_LOG_LEVEL as level } from './env';
import { otelSpanContextToDataDog } from './otel';

export default pino({
  level,
  formatters: {
    level(level) {
      return { level };
    },
    bindings() {
      return {};
    }
  },
  mixin() {
    // https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/opentelemetry/?tab=nodejs
    return otelSpanContextToDataDog(context.active());
  },
  timestamp() {
    return `,"ts":${Date.now()}`;
  }
}).child({ id, component: 'worker.js' });
