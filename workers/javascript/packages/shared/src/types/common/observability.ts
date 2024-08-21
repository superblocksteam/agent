import { AgentStatus, AgentTags } from '../organization/agent';

// Most logging drivers (and GELF) prefer snake case naming for fields
export interface AuditLogMetadata {
  user_email: string;
}

export enum AgentMessageType {
  INTEGRATION_ERROR = 'integrationError', // User errors found in plugin execution code
  INTERNAL_ERROR = 'internalError', // Agent operation errors
  UNAUTHORIZED_ERROR = 'unauthorizedError', // Agent->Cloud request authorization errors
  UNCATEGORIZED_ERROR = 'uncategorizedError' // Uncategorized errors, we should categorize them aggressively as they present themselves
}

export enum UIErrorPriority {
  P1 = 1, //Critical Error affecting user that we need to fix immediately
  P2 = 2 //Error affecting user, but no immediate action for us
}

export enum UIErrorType {
  SERVER_ERROR_5XX = 'serverError5XX',
  SERVER_ERROR_4XX = 'serverError4XX',
  SERVER_ERROR_OTHER = 'serverErrorOther',
  CRASH_APP_ERROR = 'crashAppError',
  VALIDATION_ERROR = 'validationError',
  EXECUTION_ERROR = 'executionError'
}

export const UIErrorPriorityMap = {
  [UIErrorType.CRASH_APP_ERROR]: UIErrorPriority.P1,
  [UIErrorType.VALIDATION_ERROR]: UIErrorPriority.P1,
  [UIErrorType.EXECUTION_ERROR]: UIErrorPriority.P1,
  [UIErrorType.SERVER_ERROR_5XX]: UIErrorPriority.P1,
  [UIErrorType.SERVER_ERROR_4XX]: UIErrorPriority.P2,
  [UIErrorType.SERVER_ERROR_OTHER]: UIErrorPriority.P2
};

export interface OrgMetadata {
  superblocks_org_id?: string;
  superblocks_org_name?: string;
}

export interface AgentMetadata extends OrgMetadata {
  superblocks_agent_id?: string;
  superblocks_agent_environment?: string;
  superblocks_agent_url?: string;
  superblocks_agent_version?: string;
  superblocks_agent_version_external?: string;
}

export interface WorkerMetadata extends OrgMetadata {
  superblocks_worker_id?: string;
  superblocks_worker_version?: string;
}

export interface DiagnosticMetadataTags {
  pluginId?: string;
  actionName?: string;
  actionId?: string;
  applicationId?: string;
  datasourceId?: string;
  apiId?: string;
  organizationId?: string;
  environment?: string;
  profileId?: string;
  profile?: string;
  configurationId?: string;
}

export interface DiagnosticMetadata extends DiagnosticMetadataTags {
  messageType?: AgentMessageType;
  message?: string;
  type?: string;
}

export interface UIDiagnosticMetadata {
  superblocks_action_name?: string;
  superblocks_action_id?: string;
  superblocks_application_id?: string;
  superblocks_api_id?: string;
  superblocks_page_id?: string;
  superblocks_user_id?: string;
  superblocks_user_email?: string;
  superblocks_org_id?: string;
  superblocks_org_name?: string;
  superblocks_ui_error_priority?: UIErrorPriority;
  superblocks_ui_error_type?: UIErrorType;
  superblocks_ui_error_code?: number;
  source?: 'custom';
  superblocks_environment?: string;
  superblocks_profile_id?: string;
  superblocks_profile?: string;
}

export enum DiagnosticType {
  AGENT = 'agent_diagnostics',
  WORKER = 'worker_diagnostics',
  UI = 'ui_diagnostics'
}

export type AgentDiagnosticMetadata = AgentMetadata & DiagnosticMetadata;

export type AgentError = {
  msg: string;
  ts: number;
  code?: number;
};

export interface WorkerStatus {
  id: string;
  plugins: string[];
  cordoned: boolean;
  labels: Record<string, string>;
  secure: boolean;
  created: number;
}

export interface Health {
  uptime: number;
  message: string;
  date: Date;
  id: string;
  environment: string;
  url: string;
  version: string;
  version_external: string;
  registered: boolean;
  server_errors?: AgentError[];
  workers?: WorkerStatus[];
  tags?: AgentTags;
}

export interface CommonMetrics {
  cpu?: Record<string, unknown> | number;
  memory?: Record<string, unknown> | number;
  disk?: unknown;
  io?: unknown;
  heapSizeLimitBytes?: number;
  currentHeapSizeBytes?: number;
  uptime?: number;
  reported_at?: Date;
  deployed_at?: Date;
  version?: string;
  version_external?: string;
}

export interface WorkerMetrics extends CommonMetrics {
  busyCount?: number;
  activeControllers?: number;
}

export interface Metrics extends CommonMetrics {
  apiSuccessCount?: number;
  apiFailureCount?: number;
  apiP90DurationSeconds?: number;
  workflowSuccessCount?: number;
  workflowFailureCount?: number;
  workflowP90DurationSeconds?: number;
  desiredState?: AgentStatus;
}
