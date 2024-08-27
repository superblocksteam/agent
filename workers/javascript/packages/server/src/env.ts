import { EnvStore } from '@superblocks/shared';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { filter, unmarshalExcludableList } from './plugin';

dotenv.config();

const envs = new EnvStore(process.env);

envs.addAll([
  {
    name: '__SUPERBLOCKS_AGENT_DOMAIN',
    defaultValue: 'superblocks.com'
  },
  {
    name: '__SUPERBLOCKS_WORKER_ID',
    defaultValue: null
  },
  {
    name: '__SUPERBLOCKS_AGENT_VERSION',
    defaultValue: 'v0.0.0'
  },
  {
    name: 'SUPERBLOCKS_AGENT_KEY'
  },
  {
    name: 'SUPERBLOCKS_AGENT_TLS_INSECURE',
    defaultValue: 'true'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_HOST',
    defaultValue: '127.0.0.1'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_SERVERNAME',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_GROUP',
    defaultValue: 'main'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_TOKEN',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_MAX_SIZE_BYTES',
    defaultValue: '500000000'
  },
  {
    name: 'SUPERBLOCKS_AGENT_LOG_LEVEL',
    defaultValue: 'info'
  },
  {
    name: 'SUPERBLOCKS_AGENT_PLUGIN_EVENTS',
    defaultValue: 'execute,metadata,test,pre_delete'
  },
  {
    name: 'SUPERBLOCKS_AGENT_BUCKET',
    defaultValue: 'BA'
  },
  {
    name: 'SUPERBLOCKS_AGENT_PROCESS_ASYNC',
    defaultValue: 'true'
  },
  {
    name: 'SUPERBLOCKS_AGENT_HEALTH_PORT',
    defaultValue: '8080'
  },
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS',
    defaultValue: '1200000'
  },
  {
    name: 'SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS',
    defaultValue: '3600' // -1 means no expiration
  },
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_REST_API_TIMEOUT_MS',
    defaultValue: '300000'
  },
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE',
    defaultValue: '8'
  },
  {
    name: 'SUPERBLOCKS_CONNECTION_CACHE_MAX_CONCURRENT_CONNECTIONS',
    defaultValue: '1000'
  },
  {
    name: 'SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_DEFAULT',
    defaultValue: '60000'
  },
  // a comma delimited list assigning a value to a plugin name, e.g.
  // postgres=120000,mariadb=45000,snowflake=90000
  {
    name: 'SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_PLUGINS',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_CONNECTION_CACHE_MAX_CONNECTIONS_PER_DATASOURCE',
    defaultValue: '5'
  },
  // This represents the max size of the http response content in bytes
  // allowed in the REST API plugins (~50MB)
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_REST_API_MAX_CONTENT_LENGTH_BYTES',
    defaultValue: '50000000'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE',
    defaultValue: '10'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_QUEUE_BLOCK_MS',
    defaultValue: '5000'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_SLOW_CLIENT_THRESHOLD_BYTES',
    defaultValue: '100000000'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MIN',
    defaultValue: '10'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MAX',
    defaultValue: '50'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MIN',
    defaultValue: '10'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MAX',
    defaultValue: '50'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MIN',
    defaultValue: '10'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MAX',
    defaultValue: '50'
  },
  {
    name: 'SUPERBLOCKS_WORKER_NODE_USER_ID',
    defaultValue: '1000'
  },
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST',
    defaultValue: ''
  },
  {
    // This needs to match the orchestrator intake settings
    name: 'SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE',
    defaultValue: 'https://logs.intake.superblocks.com'
  },
  {
    name: 'SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA'
  },
  {
    name: 'SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519'
  }
]);

export const SUPERBLOCKS_AGENT_HEALTH_PORT = Number(envs.get('SUPERBLOCKS_AGENT_HEALTH_PORT'));

// ******** BEGIN QUEUE STUFF ********
export const SUPERBLOCKS_AGENT_REDIS_HOST: string = envs.get('SUPERBLOCKS_AGENT_REDIS_HOST');
export const SUPERBLOCKS_AGENT_REDIS_SERVERNAME: string = envs.get('SUPERBLOCKS_AGENT_REDIS_SERVERNAME');
export const SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS = parseInt(envs.get('SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS'));
export const SUPERBLOCKS_AGENT_REDIS_TOKEN: string = envs.get('SUPERBLOCKS_AGENT_REDIS_TOKEN');
export const SUPERBLOCKS_AGENT_REDIS_GROUP: string = envs.get('SUPERBLOCKS_AGENT_REDIS_GROUP');
export const SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE'));
export const SUPERBLOCKS_AGENT_REDIS_QUEUE_BLOCK_MS = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_QUEUE_BLOCK_MS'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MIN = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MIN'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MAX = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MAX'));
// ********* END QUEUE STUFF *********

// ******** BEGIN KV STORE STUFF ********
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST: string =
  envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST') !== '' ? envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST') : SUPERBLOCKS_AGENT_REDIS_HOST;
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME: string =
  envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME') !== ''
    ? envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME')
    : SUPERBLOCKS_AGENT_REDIS_SERVERNAME;
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN: string =
  envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN') !== ''
    ? envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN')
    : SUPERBLOCKS_AGENT_REDIS_TOKEN;
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_MAX_SIZE_BYTES = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_MAX_SIZE_BYTES'));
export const SUPERBLOCKS_AGENT_REDIS_SLOW_CLIENT_THRESHOLD_BYTES = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_SLOW_CLIENT_THRESHOLD_BYTES'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MIN = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MIN'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MAX = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MAX'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MIN = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MIN'));
export const SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MAX = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MAX'));
// ********* END KV STORE STUFF *********

// ******** BEGIN PLUGIN STUFF ********
export const SUPERBLOCKS_AGENT_PLUGIN_EVENTS: string[] = filter<string>(
  unmarshalExcludableList(envs.get('SUPERBLOCKS_AGENT_PLUGIN_EVENTS')),
  ['execute', 'metadata', 'test', 'pre_delete']
);
// ********* END PLUGIN STUFF *********

export const SUPERBLOCKS_WORKER_VERSION: string = envs.get('__SUPERBLOCKS_AGENT_VERSION');
export const SUPERBLOCKS_WORKER_ID: string = envs.get('__SUPERBLOCKS_WORKER_ID') ?? randomUUID();
export const SUPERBLOCKS_WORKER_NODE_USER_ID = Number(envs.get('SUPERBLOCKS_WORKER_NODE_USER_ID'));
export const SUPERBLOCKS_CONTROLLER_KEY: string = envs.get('SUPERBLOCKS_AGENT_KEY');
export const SUPERBLOCKS_WORKER_TLS_INSECURE: boolean = envs.get('SUPERBLOCKS_AGENT_TLS_INSECURE') == 'true';
export const SUPERBLOCKS_WORKER_LOG_LEVEL: string = envs.get('SUPERBLOCKS_AGENT_LOG_LEVEL');
export const SUPERBLOCKS_AGENT_PROCESS_ASYNC: boolean = envs.get('SUPERBLOCKS_AGENT_PROCESS_ASYNC') === 'true';
export const SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS: string = envs.get('SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS');
export const SUPERBLOCKS_WORKER_EXECUTION_REST_API_TIMEOUT_MS = Number(envs.get('SUPERBLOCKS_WORKER_EXECUTION_REST_API_TIMEOUT_MS'));
export const SUPERBLOCKS_WORKER_EXECUTION_REST_API_MAX_CONTENT_LENGTH_BYTES = envs.get(
  'SUPERBLOCKS_WORKER_EXECUTION_REST_API_MAX_CONTENT_LENGTH_BYTES'
);
export const SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE = Number(envs.get('SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE'));
export const SUPERBLOCKS_AGENT_DOMAIN: string = envs.get('__SUPERBLOCKS_AGENT_DOMAIN');
export const SUPERBLOCKS_AGENT_BUCKET: string = envs.get('SUPERBLOCKS_AGENT_BUCKET');
export const SUPERBLOCKS_CONNECTION_CACHE_MAX_CONCURRENT_CONNECTIONS = Number(
  envs.get('SUPERBLOCKS_CONNECTION_CACHE_MAX_CONCURRENT_CONNECTIONS')
);
export const SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_DEFAULT = Number(envs.get('SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_DEFAULT'));
export const SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_PLUGINS: Record<string, number> = parseConnectionCacheTTLs(
  envs.get('SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_PLUGINS')
);
export const SUPERBLOCKS_CONNECTION_CACHE_MAX_CONNECTIONS_PER_DATASOURCE = Number(
  envs.get('SUPERBLOCKS_CONNECTION_CACHE_MAX_CONNECTIONS_PER_DATASOURCE')
);
export const SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST: string = envs.get('SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST');

export const SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE = envs.get('SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE');

// SSH tunnel keys
export const SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA: string = envs.get('SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA');
export const SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519: string = envs.get('SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519');

export function parseConnectionCacheTTLs(serialized: string | undefined): Record<string, number> {
  if (!serialized) return {};
  return Object.fromEntries(serialized.split(',').map((s) => s.split('=')));
}

export default envs;
