import { EnvStore } from '@superblocks/shared';
import dotenv from 'dotenv';

dotenv.config();

const envs = new EnvStore(process.env);

envs.addAll([
  {
    name: 'SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT',
    defaultValue: '50051'
  },
  {
    name: 'SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE',
    defaultValue: '30000000' // ~30MB
  },
  {
    name: 'SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE',
    defaultValue: '100000000' // ~100MB
  },
  // Network proxy configuration (mocked http/https modules in vm2)
  {
    name: 'SUPERBLOCKS_WORKER_PROXY_ENABLED',
    defaultValue: 'false'
  },
  {
    name: 'SUPERBLOCKS_WORKER_PROXY_HOST',
    defaultValue: ''
  },
  {
    name: 'SUPERBLOCKS_WORKER_PROXY_PORT',
    defaultValue: '8080'
  }
]);

export const SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT = Number(
  envs.get('SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT')
);

export const SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE = Number(
  envs.get('SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE')
);

export const SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE = Number(
  envs.get('SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE')
);

// Network proxy configuration
export const SUPERBLOCKS_WORKER_PROXY_ENABLED = envs.get('SUPERBLOCKS_WORKER_PROXY_ENABLED') === 'true';
export const SUPERBLOCKS_WORKER_PROXY_HOST = envs.get('SUPERBLOCKS_WORKER_PROXY_HOST');
export const SUPERBLOCKS_WORKER_PROXY_PORT = Number(envs.get('SUPERBLOCKS_WORKER_PROXY_PORT'));

export default envs;
