import {
  AdlsPluginV1 as AdlsPlugin,
  CosmosDbPluginV1,
  CouchbasePluginV1,
  OracleDbPluginV1,
  RedisPluginV1,
  SalesforcePluginV1,
  KinesisPluginV1,
  SecretsV1 as Secrets
} from '@superblocksteam/types';
import type {
  AdlsActionConfiguration,
  AdlsDatasourceConfiguration,
  CosmosDbActionConfiguration,
  CosmosDbDatasourceConfiguration,
  CouchbaseActionConfiguration,
  CouchbaseDatasourceConfiguration,
  OracleDbActionConfiguration,
  OracleDbDatasourceConfiguration,
  RedisActionConfiguration,
  RedisDatasourceConfiguration,
  SalesforceActionConfiguration,
  SalesforceDatasourceConfiguration,
  KinesisActionConfiguration,
  KinesisDatasourceConfiguration
} from './types';

export const SUPERBLOCKS_REQUEST_ID_HEADER = 'x-superblocks-request-id';
export const SUPERBLOCKS_CLI_VERSION_HEADER = 'x-superblocks-cli-version';
export const SUPERBLOCKS_COMPONENT_EVENT_HEADER = 'x-superblocks-component-event';
export const SUPERBLOCKS_URL_HEADER = 'x-superblocks-url';
export const SUPERBLOCKS_AUTHORIZATION_HEADER = 'x-superblocks-authorization';
export const SUPERBLOCKS_EMBED_HEADER = 'x-superblocks-embed';

export const EMAIL_VERIFICATION_CODE_LENGTH = 6;

export const NULL_AS_STRING = 'null';

// this is needed due to the migration from ts -> proto objects
// which have different JSON representations for plugins
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLUGIN_ID_TO_PROTO_CLASS: Record<string, any> = {
  cosmosdb: CosmosDbPluginV1.Plugin,
  redis: RedisPluginV1.Plugin,
  rediscloud: RedisPluginV1.Plugin,
  awselasticache: RedisPluginV1.Plugin,
  aivenredis: RedisPluginV1.Plugin,
  salesforce: SalesforcePluginV1.Plugin,
  adls: AdlsPlugin.Plugin,
  oracledb: OracleDbPluginV1.Plugin,
  gcpsecretsmanager: Secrets.Store,
  awssecretsmanager: Secrets.Store,
  hashicorpvault: Secrets.Store,
  akeylesssecretsmanager: Secrets.Store,
  couchbase: CouchbasePluginV1.Plugin,
  kinesis: KinesisPluginV1.Plugin
};

// this is used to deserialize datasource configuration objects that contain
// proto objects
export const PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE: Record<string, CallableFunction> = {
  cosmosdb: deserializeCosmosDbDatasourceConfig,
  redis: deserializeRedisDatasourceConfig,
  rediscloud: deserializeRedisDatasourceConfig,
  awselasticache: deserializeRedisDatasourceConfig,
  aivenredis: deserializeRedisDatasourceConfig,
  salesforce: deserializeSalesforceDatasourceConfig,
  adls: deserializeAdlsDatasourceConfig,
  oracledb: deserializeOracleDbDatasourceConfig,
  couchbase: deserializeCouchbaseDatasourceConfig,
  kinesis: deserializeKinesisDatasourceConfig
};

// this is used to deserialize action configuration objects that contain proto
// objects
export const PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE: Record<string, CallableFunction> = {
  cosmosdb: deserializeCosmosDbActionConfig,
  redis: deserializeRedisActionConfig,
  rediscloud: deserializeRedisActionConfig,
  awselasticache: deserializeRedisActionConfig,
  aivenredis: deserializeRedisActionConfig,
  salesforce: deserializeSalesforceActionConfig,
  adls: deserializeAdlsActionConfig,
  oracledb: deserializeOracleDbActionConfig,
  couchbase: deserializeCouchbaseActionConfig,
  kinesis: deserializeKinesisActionConfig
};

function deserializeRedisDatasourceConfig(serialized: Record<string, unknown>): RedisDatasourceConfiguration {
  const plugin = RedisPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return { connection, name } as RedisDatasourceConfiguration;
}

function deserializeRedisActionConfig(serialized: Record<string, unknown>): RedisActionConfiguration {
  const plugin = RedisPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return rest as RedisActionConfiguration;
}

function deserializeKinesisDatasourceConfig(serialized: Record<string, unknown>): KinesisDatasourceConfiguration {
  const plugin = KinesisPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  const { name, connection } = plugin;
  return { connection, name } as KinesisDatasourceConfiguration;
}

function deserializeKinesisActionConfig(serialized: Record<string, unknown>): KinesisActionConfiguration {
  const plugin = KinesisPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return rest as KinesisActionConfiguration;
}

function deserializeSalesforceDatasourceConfig(serialized: Record<string, unknown>): SalesforceDatasourceConfiguration {
  const plugin = SalesforcePluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return { connection, name } as SalesforceDatasourceConfiguration;
}

function deserializeSalesforceActionConfig(serialized: Record<string, unknown>): SalesforceActionConfiguration {
  const plugin = SalesforcePluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return rest as SalesforceActionConfiguration;
}

function deserializeCosmosDbDatasourceConfig(serialized: Record<string, unknown>): CosmosDbDatasourceConfiguration {
  const plugin = CosmosDbPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return { connection, name } as CosmosDbDatasourceConfiguration;
}

function deserializeCosmosDbActionConfig(serialized: Record<string, unknown>): CosmosDbActionConfiguration {
  const plugin = CosmosDbPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return rest as CosmosDbActionConfiguration;
}

function deserializeOracleDbDatasourceConfig(serialized: Record<string, unknown>): OracleDbDatasourceConfiguration {
  const plugin = OracleDbPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return { connection, name } as OracleDbDatasourceConfiguration;
}

function deserializeOracleDbActionConfig(serialized: Record<string, unknown>): OracleDbActionConfiguration {
  const plugin = OracleDbPluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, ...rest } = plugin;
  return rest as OracleDbActionConfiguration;
}

function deserializeAdlsDatasourceConfig(serialized: Record<string, unknown>): AdlsDatasourceConfiguration {
  const plugin = AdlsPlugin.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, dynamicWorkflowConfiguration, ...rest } = plugin;
  return { connection, name } as AdlsDatasourceConfiguration;
}

function deserializeAdlsActionConfig(serialized: Record<string, unknown>): AdlsActionConfiguration {
  const plugin = AdlsPlugin.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, dynamicWorkflowConfiguration, ...rest } = plugin;
  return rest as AdlsActionConfiguration;
}

function deserializeCouchbaseDatasourceConfig(serialized: Record<string, unknown>): CouchbaseDatasourceConfiguration {
  const plugin = CouchbasePluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, tunnel, ...rest } = plugin;
  return { name, connection, tunnel } as CouchbaseDatasourceConfiguration;
}

function deserializeCouchbaseActionConfig(serialized: Record<string, unknown>): CouchbaseActionConfiguration {
  const plugin = CouchbasePluginV1.Plugin.fromJsonString(JSON.stringify(serialized), { ignoreUnknownFields: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, connection, tunnel, ...rest } = plugin;
  return rest as CouchbaseActionConfiguration;
}
