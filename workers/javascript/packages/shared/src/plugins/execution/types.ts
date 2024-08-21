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
