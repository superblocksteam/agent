import type { MessagePort } from 'worker_threads';

import { RelayDelegate } from '../../relay';
import { ExecutionContext, ExecutionParam } from '../../types/api';
import { AgentCredentials } from '../auth';
import { RequestFile, RequestFiles } from '../files';

export type ProcessInput = {
  context: ExecutionContext;
  code: string;
  files?: RequestFiles;
};

export type RecursionContext = {
  executedWorkflowsPath: Array<{ name: string; id: string }>;
  isEvaluatingDatasource: boolean;
};

export type ExecutionMeta = {
  correlationId?: string;
  // add more metadata here
};

export type FetchAndExecuteProps = {
  metadata?: ExecutionMeta;
  apiId: string;
  isPublished: boolean;
  eventType?: string;
  executionParams: ExecutionParam[];
  agentCredentials: AgentCredentials;
  files: RequestFiles;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookies?: Record<string, any>;
  recursionContext: RecursionContext;
  isWorkflow: boolean;
  relayDelegate?: RelayDelegate;
  environment?: string;
  profileId?: string;
  profile?: string;
  commitId?: string;
};

export interface VariableClient {
  read: (keys: string[]) => Promise<{ data: unknown[] }>;
  write: (key: string, value: string) => Promise<void>;
  writeBuffer: (key: string, value: unknown) => void;
  fetchFileCallback: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;
  flush: () => Promise<void>;
}

export interface FileFetcherClient {
  fetchFileCallback?: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;
}

/**
 * File fetcher configuration for workers without sandbox file fetching.
 * Uses the controller's file server with agent key authentication.
 */
export interface ControllerFileFetcher {
  type: 'controller';
  fileServerUrl: string;
  agentKey: string;
}

/**
 * File fetcher configuration for sandbox workers.
 * Uses the VariableClient to proxy file fetching through the KVStore (GrpcKvStore).
 */
export interface SandboxFileFetcher {
  type: 'sandbox';
  client: FileFetcherClient;
}

export type FileFetcher = ControllerFileFetcher | SandboxFileFetcher;

export type WorkerTaskInput = {
  context: ExecutionContext;
  code: string;
  files?: RequestFile[];
  inheritedEnv?: Array<string>;
  executionTimeout: number;
  useSandboxFileFetcher?: boolean;
};

export type WorkerInput = WorkerTaskInput & {
  port: MessagePort;
  integrationPort?: MessagePort;
};
