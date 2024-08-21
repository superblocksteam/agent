import { EnvStore } from '@superblocks/shared';
import dotenv from 'dotenv';

dotenv.config();

const envs = new EnvStore(process.env);

envs.addAll([
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_TOKEN',
    defaultValue: 'dev-agent-key'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN',
    defaultValue: 'dev-agent-key'
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
    name: 'SUPERBLOCKS_AGENT_REDIS_PORT',
    defaultValue: '6379'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT',
    defaultValue: '6379'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_SERVERNAME',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST',
    defaultValue: '127.0.0.1'
  },
  {
    name: 'SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_AGENT_LOAD_CONCURRENCY',
    defaultValue: '25'
  },
  {
    name: 'SUPERBLOCKS_AGENT_LOAD_REQUESTS',
    defaultValue: '5000'
  },
  {
    name: 'SUPERBLOCKS_EXCLUDE_TESTS',
    defaultValue: 'false'
  },
  {
    name: 'SUPERBLOCKS_PYTHON_TESTS',
    defaultValue: 'false'
  },
  {
    name: 'SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA',
    defaultValue: 'dev-private-rsa'
  },
  {
    name: 'SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519',
    defaultValue: 'dev-private-ed25519'
  }
]);

export const SUPERBLOCKS_AGENT_REDIS_HOST: string = envs.get('SUPERBLOCKS_AGENT_REDIS_HOST');
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST: string = envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST');
export const SUPERBLOCKS_AGENT_REDIS_TOKEN: string = envs.get('SUPERBLOCKS_AGENT_REDIS_TOKEN');
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN: string = envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN');
export const SUPERBLOCKS_AGENT_REDIS_SERVERNAME: string = envs.get('SUPERBLOCKS_AGENT_REDIS_SERVERNAME');
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME: string = envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME');
export const SUPERBLOCKS_AGENT_TLS_INSECURE: boolean = envs.get('SUPERBLOCKS_AGENT_TLS_INSECURE') === 'true';
export const SUPERBLOCKS_AGENT_LOAD_CONCURRENCY = Number(envs.get('SUPERBLOCKS_AGENT_LOAD_CONCURRENCY'));
export const SUPERBLOCKS_AGENT_LOAD_REQUESTS = Number(envs.get('SUPERBLOCKS_AGENT_LOAD_REQUESTS'));
export const SUPERBLOCKS_EXCLUDE_TESTS: boolean = envs.get('SUPERBLOCKS_EXCLUDE_TESTS') === 'true';
export const SUPERBLOCKS_PYTHON_TESTS: boolean = envs.get('SUPERBLOCKS_PYTHON_TESTS') === 'true';
export const SUPERBLOCKS_AGENT_REDIS_PORT = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_PORT'));
export const SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT = Number(envs.get('SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT'));

export default envs;
