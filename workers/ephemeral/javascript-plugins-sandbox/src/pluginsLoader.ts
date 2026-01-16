import { trace } from '@opentelemetry/api';
import { BasePlugin, ConnectionPoolCoordinator, PluginConfiguration } from '@superblocks/shared';
import { secrets } from '@superblocks/worker.js';

import sb_adls from '@superblocksteam/adls';
import sb_athena from '@superblocksteam/athena';
import sb_bigquery from '@superblocksteam/bigquery';
import sb_cockroachdb from '@superblocksteam/cockroachdb';
import sb_cosmosdb from '@superblocksteam/cosmosdb';
import sb_couchbase from '@superblocksteam/couchbase';
import sb_databricks from '@superblocksteam/databricks';
import sb_dynamodb from '@superblocksteam/dynamodb';
import sb_email from '@superblocksteam/email';
import sb_gcs from '@superblocksteam/gcs';
import sb_graphql from '@superblocksteam/graphql';
import sb_gsheets from '@superblocksteam/gsheets';
import sb_javascript from '@superblocksteam/javascript';
import sb_kafka from '@superblocksteam/kafka';
import sb_kinesis from '@superblocksteam/kinesis';
import sb_mariadb from '@superblocksteam/mariadb';
import sb_mongodb from '@superblocksteam/mongodb';
import sb_mssql from '@superblocksteam/mssql';
import sb_mysql from '@superblocksteam/mysql';
import sb_openai from '@superblocksteam/openai';
import sb_oracledb from '@superblocksteam/oracledb';
import sb_postgres from '@superblocksteam/postgres';
import sb_redis from '@superblocksteam/redis';
import sb_redshift from '@superblocksteam/redshift';
import sb_restapi from '@superblocksteam/restapi';
import sb_restapiintegration from '@superblocksteam/restapiintegration';
import sb_rockset from '@superblocksteam/rockset';
import sb_s3 from '@superblocksteam/s3';
import sb_salesforce from '@superblocksteam/salesforce';
import sb_smtp from '@superblocksteam/smtp';
import sb_snowflake from '@superblocksteam/snowflake';
import sb_superblocks_ocr from '@superblocksteam/superblocks-ocr';
import sb_workflow from '@superblocksteam/workflow';
import { Gauge, Registry } from 'prom-client';

const kafka = new sb_kafka();
const graphql = new sb_graphql();
const restapiintegration = new sb_restapiintegration();
const redis = new sb_redis();
const secretStore = secrets();

export const ALL_PLUGINS: Record<string, BasePlugin> = {
  athena: new sb_athena(),
  bigquery: new sb_bigquery(),
  cockroachdb: new sb_cockroachdb(),
  dynamodb: new sb_dynamodb(),
  email: new sb_email(),
  gcs: new sb_gcs(),
  // graphql and graphqlintegration have same action config / datasource configs
  graphql: graphql,
  graphqlintegration: graphql,
  gsheets: new sb_gsheets(),
  kafka: kafka,
  kinesis: new sb_kinesis(),
  confluent: kafka,
  msk: kafka,
  redpanda: kafka,
  aivenkafka: kafka,
  javascript: new sb_javascript(),
  mariadb: new sb_mariadb(),
  mongodb: new sb_mongodb(),
  mssql: new sb_mssql(),
  mysql: new sb_mysql(secretStore),
  openai: new sb_openai(),
  postgres: new sb_postgres(secretStore),
  redshift: new sb_redshift(),
  restapi: new sb_restapi(),
  restapiintegration: restapiintegration,
  rockset: new sb_rockset(),
  s3: new sb_s3(),
  salesforce: new sb_salesforce(),
  smtp: new sb_smtp(),
  snowflake: new sb_snowflake(),
  ocr: new sb_superblocks_ocr(),
  workflow: new sb_workflow(),
  redis: redis,
  cosmosdb: new sb_cosmosdb(),
  adls: new sb_adls(),
  databricks: new sb_databricks(),
  couchbase: new sb_couchbase(),
  oracledb: new sb_oracledb()
};

export const LANG_PLUGINS: Record<string, BasePlugin> = {
  javascript: new sb_javascript()
};

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

export function loadPlugins(plugins: string[]): Record<string, BasePlugin> {
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
  for (const pluginId of plugins) {
    if (pluginId in ALL_PLUGINS) {
      const plugin = ALL_PLUGINS[pluginId];
      plugin.configure(configuration);

      try {
        plugin.init();
      } catch (_) {
        // Empty catch block for plugins that don't implement init
      }

      plugin.attachConnectionPool(connectionPoolCoordinator);
      loadedPlugins[pluginId] = plugin;
    }
  }

  return loadedPlugins;
}
