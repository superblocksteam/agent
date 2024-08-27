import { Api as ApiPb, Metadata, UserType as ProtoUserType, Trigger_Job, Trigger_Workflow } from '@superblocksteam/types';
import { Param } from '../common/param';
import { AuthContext, DatasourceDto, DatasourceEnvironments } from '../datasource';
import { EventEntityType } from '../event';
import { Plugin } from '../plugin';
import { Action, ActionId } from './action';
import { ExecutionParam } from './execution';
import { Global } from './global';

// ApiNotificationConfiguration configures how the UI should be informed after
// an API runs.
export type ApiNotificationConfiguration = {
  onSuccess?: {
    enabled?: boolean;
    customText?: string;
  };
  onError?: {
    enabled?: boolean;
    includeError?: boolean;
    customText?: string;
    customDescription?: string;
  };
};

export interface Api {
  id: string;
  environment: DatasourceEnvironments;
  profile: string;
  applicationId?: string | null;
  // TODO(bruce): this is deprecated and needs to be removed
  actions?: ApiDetails;
  apiPb?: ApiPb;
  triggerType: ApiTriggerType;
}

export type ApiDetails = {
  name: string;
  triggerActionId: ActionId;
  actions: {
    [key: string]: Action;
  };
  executeOnPageLoad?: boolean;
  notificationConfig?: ApiNotificationConfiguration;
  bindings?: string[];
  dynamicBindingPathList?: Param[];
  version?: string;
  deactivated?: Date;
  created?: Date;
  updated?: Date;
  supportedMethod?: 'GET' | 'POST';
  workflowParams?: ExecutionParam[];
};

// Full API definition including datasource and plugin
export type ApiDefinition = {
  api: Api;
  orgApiKey: string; // to authenticate dependent workflows
  organizationId: string; // for traces
  datasources: Record<string, DatasourceDto>;
  plugins: Record<string, Plugin>;
  global: Global;
  locationContext?: ApiLocationContext;
  metadata?: ApiDefinitionMetadata;
  authContext?: AuthContext;
};

// ApiLocationContext locates an API
export type ApiLocationContext = {
  applicationId: string;
  pageId?: string; // @deprecated orchestrator no longer uses this field
};

export type ApiDefinitionMetadata = {
  requester: string;
  requesterType?: ProtoUserType;
  organizationName?: string;
};

export enum ApiTriggerType {
  UI,
  WORKFLOW,
  SCHEDULE
}

export enum ApiTriggerTypeQuery {
  UI = 'ui',
  WORKFLOW = 'workflow',
  SCHEDULE = 'schedule'
}

export function apiTriggerTypeQueryToType(trigger: ApiTriggerTypeQuery): ApiTriggerType {
  switch (trigger) {
    case ApiTriggerTypeQuery.UI:
      return ApiTriggerType.UI;
    case ApiTriggerTypeQuery.WORKFLOW:
      return ApiTriggerType.WORKFLOW;
    case ApiTriggerTypeQuery.SCHEDULE:
      return ApiTriggerType.SCHEDULE;
  }
}

export function apiTriggerToEntity(trigger: ApiTriggerType): EventEntityType {
  switch (trigger) {
    case ApiTriggerType.UI:
      return EventEntityType.API;
    case ApiTriggerType.WORKFLOW:
      return EventEntityType.WORKFLOW;
    case ApiTriggerType.SCHEDULE:
      return EventEntityType.SCHEDULED_JOB;
  }
}

//TODO(alex): look into defining exported types in protobuf instead of deriving them here
type protoMethods = 'equals' | 'clone' | 'fromBinary' | 'fromJson' | 'fromJsonString' | 'toBinary' | 'toJson' | 'toJsonString' | 'getType';

export const EXPORTED_METADATA_EXCLUDED_FIELDS = ['description', 'folder', 'tags', 'timestamps', 'version'] as const;

type ExcludedFields = (typeof EXPORTED_METADATA_EXCLUDED_FIELDS)[number];

type ExportedApiPbMetadata = Omit<Metadata, ExcludedFields | protoMethods>;

export type ApiPbTrigger = {
  workflow?: Trigger_Workflow;
  job?: Trigger_Job;
};

export type ExportedApiPbTrigger = {
  workflow?: Omit<Trigger_Workflow, 'options' | protoMethods>;
  job?: Omit<Trigger_Job, 'options' | protoMethods>;
};

export type ExportedApiPb = Omit<ApiPb, 'metadata' | 'trigger' | protoMethods> & {
  metadata: ExportedApiPbMetadata;
  trigger: ExportedApiPbTrigger | undefined;
};

export { ViewMode as OrchestratorViewMode } from '@superblocksteam/types';
export * from './action';
export * from './control-flow';
export * from './execution';
export * from './global';
export * from './resolvedActionProp';
export * from './schedule';
