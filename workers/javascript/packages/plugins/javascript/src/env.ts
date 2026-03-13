import { EnvStore } from '@superblocks/shared';
import dotenv from 'dotenv';

dotenv.config();

const envs = new EnvStore(process.env);

envs.addAll([
  {
    name: 'SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST',
    defaultValue: ''
  }
]);

export const SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST: Array<string> = envs
  .get('SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST')
  .split(',')
  .map((envVar: string) => envVar.trim())
  .filter((envVar: string) => envVar !== '');
