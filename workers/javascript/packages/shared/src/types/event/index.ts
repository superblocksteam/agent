import { RegionEnum } from '../common';
import { RequestSource } from '../user';

export enum EventEntityType {
  APPLICATION = 'application',
  PAGE = 'page',
  WORKFLOW = 'workflow',
  SCHEDULED_JOB = 'scheduled_job',
  DATASOURCE = 'datasource',
  FOLDER = 'folder',
  USER = 'user',
  ORGANIZATION = 'organization',
  API = 'api',
  STEP = 'step',
  AGENT = 'agent',
  CONTROLLER = 'controller',
  WORKER = 'worker',
  SURVEY = 'survey',
  ACCOUNT = 'account',
  BILLING = 'billing',
  OBSERVABILITY = 'observability',
  GROUP = 'group',
  ORGANIZATION_INVITES = 'organization_invites',
  PROFILE = 'profile',
  INTEGRATION = 'integration',
  COMMIT = 'commit',
  CUSTOM_COMPONENT = 'custom_component',
  BRANCH = 'branch',
  ACCESS_TOKEN = 'access_token'
}

// This is currently used for application profiles
export enum ViewMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
  DEPLOYED = 'deployed'
}

export enum ExportViewMode {
  EXPORT_DEPLOYED = 'export-deployed',
  EXPORT_LATEST = 'export-latest',
  EXPORT_LIVE = 'export-live',
  EXPORT_COMMIT = 'export-commit'
}

export const CombinedViewMode = { ...ViewMode, ...ExportViewMode };
export type CombinedViewMode = ViewMode | ExportViewMode;

export enum EventAction {
  CREATED = 'created',
  CLONED = 'cloned',
  DELETED = 'deleted',
  SHARED = 'shared',
  PERMISSION_REMOVED = 'permission_removed',
  DEPLOYED = 'deployed',
  IMPORTED = 'imported',
  EXECUTED = 'executed',
  EXPORTED = 'exported',
  VIEWED = 'viewed',
  STARTED = 'started',
  FINISHED = 'finished',
  ADDED = 'added',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  UPDATED = 'updated',
  PATCHED = 'patched',
  METADATA_UPDATED = 'metadata_updated',
  SETTINGS_UPDATED = 'settings_updated',
  REGISTERED = 'registered',
  DEREGISTERED = 'deregistered',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  ACCESS_REQUESTED = 'access_requested',
  ACCESS_ACCEPTED = 'access_accepted',
  TRIAL_EXTENDED = 'trial_extended',
  PLAN_UPGRADED = 'plan_upgraded',
  PLAN_DOWNGRADED = 'plan_downgraded',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  AGENT_TYPE_UPDATED = 'agent_type_updated',
  COMMITTED = 'committed',
  BRANCH_CREATED = 'branch_created',
  RESET = 'reset',
  PULLED = 'pulled',
  PUSHED = 'pushed',
  LOGGED_IN = 'logged_in',
  SESSION_STARTED = 'session_started'
}

export interface UserEvent {
  userId?: string;
  userType?: string;
  email?: string;
  organizationId?: string;
  type: string;
  entityId?: string;
  entityType?: EventEntityType;
  entityName?: string;
  // properties is a field for event specific fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: Record<string, any>;
  createdAt: Date;
  region?: RegionEnum;
  source?: RequestSource;
}

export interface EventEntity {
  id: string;
  name: string | undefined;
}
