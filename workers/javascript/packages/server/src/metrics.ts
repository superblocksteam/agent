import { Counter, Gauge, Registry } from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ component: 'worker' });
export const prefix = 'superblocks_worker_';

export const workerIdleMillisecondsCounter = new Counter({
  name: `${prefix}idle_milliseconds`,
  help: 'Amount of time worker is waiting for a job.',
  registers: [registry]
});

export const poolConnectionsTotalGauge = new Gauge({
  name: `${prefix}pool_connections_total`,
  help: 'The total number of connections held by the connection pool.',
  registers: [registry]
});

export const poolConnectionsIdleGauge = new Gauge({
  name: `${prefix}pool_connections_idle`,
  help: 'The number of idle connections held by the connection pool.',
  registers: [registry]
});

export const poolConnectionsBusyGauge = new Gauge({
  name: `${prefix}pool_connections_busy`,
  help: 'The number of busy connections held by the connection pool.',
  registers: [registry]
});
