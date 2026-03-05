import { RelayDelegate } from '../../relay';
import { ExecutionContext, ExecutionParam } from '../../types/api';
import { AgentCredentials } from '../auth';
import { RequestFiles } from '../files';

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
