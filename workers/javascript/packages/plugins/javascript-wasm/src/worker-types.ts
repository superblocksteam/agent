import type { ExecutionContext, RequestFile } from '@superblocks/shared';
import type { MessagePort } from 'worker_threads';

export type WorkerTaskInput = {
  context: ExecutionContext;
  code: string;
  files?: RequestFile[];
  executionTimeout: number;
  useSandboxFileFetcher?: boolean;
};

export type WorkerInput = WorkerTaskInput & {
  port: MessagePort;
};
