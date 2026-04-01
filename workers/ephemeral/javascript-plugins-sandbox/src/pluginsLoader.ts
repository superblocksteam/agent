/**
 * Lazy plugin loader.
 *
 * Plugins are loaded on demand via dynamic `import()` so that only the
 * modules required by the configured `SUPERBLOCKS_WORKER_SANDBOX_WORKER_PLUGINS`
 * are ever resolved.  This avoids paying the startup cost of heavy native
 * modules (mongodb, mssql, oracledb, …) when the sandbox only needs a
 * small subset of plugins.
 */

import { trace } from '@opentelemetry/api';
import { BasePlugin, ConnectionPoolCoordinator, PluginConfiguration } from '@superblocks/shared';
import { secrets } from '@superblocks/worker.js';
import { Gauge, Registry } from 'prom-client';

// ---------------------------------------------------------------------------
// Plugin factory registry
// ---------------------------------------------------------------------------

type PluginFactory = () => Promise<BasePlugin>;

/**
 * Returns a factory that lazily creates a shared singleton.
 * Multiple plugin IDs that share the same underlying instance (e.g. kafka,
 * confluent, msk, redpanda, aivenkafka) all point to the same shared factory
 * so the module is imported and constructed at most once.
 */
function shared(factory: () => Promise<BasePlugin>): PluginFactory {
  let pending: Promise<BasePlugin> | undefined;
  return () => {
    if (!pending) {
      pending = factory();
    }
    return pending;
  };
}

const sharedKafka = shared(async () => {
  const mod = await import('@superblocksteam/kafka');
  return new mod.default();
});

const sharedGraphql = shared(async () => {
  const mod = await import('@superblocksteam/graphql');
  return new mod.default();
});

const sharedRestapiintegration = shared(async () => {
  const mod = await import('@superblocksteam/restapiintegration');
  return new mod.default();
});

const sharedRedis = shared(async () => {
  const mod = await import('@superblocksteam/redis');
  return new mod.default();
});

const sharedJavascriptsdkapi = shared(async () => {
  const mod = await import('@superblocksteam/javascript-sdk-api');
  return new mod.default();
});

/**
 * Registry mapping every known plugin ID to a lazy factory.
 * The factory is only called for plugins that are actually selected.
 */
const PLUGIN_FACTORIES: Record<string, PluginFactory> = {
  athena: async () => {
    const m = await import('@superblocksteam/athena');
    return new m.default();
  },
  bigquery: async () => {
    const m = await import('@superblocksteam/bigquery');
    return new m.default();
  },
  cockroachdb: async () => {
    const m = await import('@superblocksteam/cockroachdb');
    return new m.default();
  },
  dynamodb: async () => {
    const m = await import('@superblocksteam/dynamodb');
    return new m.default();
  },
  email: async () => {
    const m = await import('@superblocksteam/email');
    return new m.default();
  },
  gcs: async () => {
    const m = await import('@superblocksteam/gcs');
    return new m.default();
  },
  graphql: sharedGraphql,
  graphqlintegration: sharedGraphql,
  gsheets: async () => {
    const m = await import('@superblocksteam/gsheets');
    return new m.default();
  },
  kafka: sharedKafka,
  kinesis: async () => {
    const m = await import('@superblocksteam/kinesis');
    return new m.default();
  },
  lakebase: async () => {
    const m = await import('@superblocksteam/lakebase');
    return new m.default();
  },
  confluent: sharedKafka,
  msk: sharedKafka,
  redpanda: sharedKafka,
  aivenkafka: sharedKafka,
  javascript: async () => {
    const m = await import('@superblocksteam/javascript');
    return new m.default();
  },
  javascriptwasm: async () => {
    const m = await import('@superblocksteam/javascript-wasm');
    return new m.default();
  },
  mariadb: async () => {
    const m = await import('@superblocksteam/mariadb');
    return new m.default();
  },
  mongodb: async () => {
    const m = await import('@superblocksteam/mongodb');
    return new m.default();
  },
  mssql: async () => {
    const m = await import('@superblocksteam/mssql');
    return new m.default();
  },
  mysql: async () => {
    const m = await import('@superblocksteam/mysql');
    const secretStore = secrets();
    return new m.default(secretStore);
  },
  openai: async () => {
    const m = await import('@superblocksteam/openai');
    return new m.default();
  },
  postgres: async () => {
    const m = await import('@superblocksteam/postgres');
    const secretStore = secrets();
    return new m.default(secretStore);
  },
  redshift: async () => {
    const m = await import('@superblocksteam/redshift');
    return new m.default();
  },
  restapi: async () => {
    const m = await import('@superblocksteam/restapi');
    return new m.default();
  },
  restapiintegration: sharedRestapiintegration,
  rockset: async () => {
    const m = await import('@superblocksteam/rockset');
    return new m.default();
  },
  s3: async () => {
    const m = await import('@superblocksteam/s3');
    return new m.default();
  },
  salesforce: async () => {
    const m = await import('@superblocksteam/salesforce');
    return new m.default();
  },
  javascriptsdkapi: sharedJavascriptsdkapi,
  javascriptsdkapiwasm: async () => {
    const m = await import('@superblocksteam/javascript-sdk-api-wasm');
    return new m.default();
  },
  smtp: async () => {
    const m = await import('@superblocksteam/smtp');
    return new m.default();
  },
  snowflake: async () => {
    const m = await import('@superblocksteam/snowflake');
    return new m.default();
  },
  snowflakepostgres: async () => {
    const m = await import('@superblocksteam/snowflakepostgres');
    return new m.default();
  },
  ocr: async () => {
    const m = await import('@superblocksteam/superblocks-ocr');
    return new m.default();
  },
  workflow: async () => {
    const m = await import('@superblocksteam/workflow');
    return new m.default();
  },
  redis: sharedRedis,
  cosmosdb: async () => {
    const m = await import('@superblocksteam/cosmosdb');
    return new m.default();
  },
  adls: async () => {
    const m = await import('@superblocksteam/adls');
    return new m.default();
  },
  databricks: async () => {
    const m = await import('@superblocksteam/databricks');
    return new m.default();
  },
  couchbase: async () => {
    const m = await import('@superblocksteam/couchbase');
    return new m.default();
  },
  oracledb: async () => {
    const m = await import('@superblocksteam/oracledb');
    return new m.default();
  }
};

/** All known plugin IDs. Used to validate selections without importing any plugin module. */
export const ALL_PLUGIN_IDS: string[] = Object.keys(PLUGIN_FACTORIES);

// ---------------------------------------------------------------------------
// Metrics (lightweight — no plugin imports)
// ---------------------------------------------------------------------------

const tracer = trace.getTracer('sandbox-javascript', '0.0.1');

const prefix = 'sandbox_javascript_';
const registry = new Registry();
registry.setDefaultLabels({ component: 'sandbox-javascript' });
const poolConnectionsTotalGauge = new Gauge({
  name: `${prefix}pool_connections_total`,
  help: 'The total number of connections held by the connection pool.',
  registers: [registry]
});
const poolConnectionsIdleGauge = new Gauge({
  name: `${prefix}pool_connections_idle`,
  help: 'The number of idle connections held by the connection pool.',
  registers: [registry]
});
const poolConnectionsBusyGauge = new Gauge({
  name: `${prefix}pool_connections_busy`,
  help: 'The number of busy connections held by the connection pool.',
  registers: [registry]
});

// ---------------------------------------------------------------------------
// Plugin loader
// ---------------------------------------------------------------------------

/**
 * Dynamically imports and initialises only the requested plugins.
 *
 * @param pluginIds - IDs to load (output of {@link parsePluginSelection}).
 * @returns Map of plugin ID to configured, initialised plugin instance.
 */
export async function loadPlugins(pluginIds: string[]): Promise<Record<string, BasePlugin>> {
  const connectionPoolCoordinator = new ConnectionPoolCoordinator({
    maxConnections: 1000,
    maxConnectionsPerKey: 5,
    tracer,
    metrics: {
      poolConnectionsTotalGauge,
      poolConnectionsIdleGauge,
      poolConnectionsBusyGauge
    }
  });

  const configuration: PluginConfiguration = {
    pythonExecutionTimeoutMs: '',
    javascriptExecutionTimeoutMs: '1_200_000',
    restApiExecutionTimeoutMs: 300_000,
    restApiMaxContentLengthBytes: 50_000_000,
    connectionPoolIdleTimeoutMs: 60_000,
    workflowFetchAndExecuteFunc: null
  };

  const loadedPlugins: Record<string, BasePlugin> = {};

  // Group plugin IDs by their underlying factory so that shared instances
  // (e.g. kafka/confluent/msk) are only imported, configured, and
  // initialised once.
  const factoryToIds = new Map<PluginFactory, string[]>();
  for (const pluginId of pluginIds) {
    if (pluginId in PLUGIN_FACTORIES) {
      const factory = PLUGIN_FACTORIES[pluginId];
      const ids = factoryToIds.get(factory);
      if (ids) {
        ids.push(pluginId);
      } else {
        factoryToIds.set(factory, [pluginId]);
      }
    }
  }

  await Promise.all(
    Array.from(factoryToIds.entries()).map(async ([factory, ids]) => {
      const plugin = await factory();
      plugin.configure(configuration);

      try {
        plugin.init();
      } catch (_) {
        // Some plugins don't implement init
      }

      plugin.attachConnectionPool(connectionPoolCoordinator);
      for (const id of ids) {
        loadedPlugins[id] = plugin;
      }
    })
  );

  return loadedPlugins;
}
