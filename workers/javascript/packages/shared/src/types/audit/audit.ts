import { UserType } from '../..';
import { ApiLocationContext } from '../api';
import { ApiResourceTiming } from '../common/timing';
import { ApiRunStatus } from './apiRunDetails';

export enum Source {
  SCHEDULED_JOB = 'Schedule'
}

export enum AuditLogEntityType {
  APPLICATION,
  WORKFLOW,
  SCHEDULED_JOB,
  DATASOURCE,
  FOLDER,
  APPLICATION_API,
  PAGE
}

export type AuditLogEntity = {
  name: string;
  id: string;
  type: AuditLogEntityType;
  applicationId?: string | null;
};

export enum AuditLogStatusFilter {
  ALL = 'All',
  SUCCESS = 'Success',
  RUNNING = 'Running',
  ABORTED = 'Aborted',
  ERROR = 'Error'
}

// After this number of minutes we consider an API run abandoned (e.g. agent
// crashed halfway through) rather than still running.
export const ABANDONED_EXECUTION_THRESH_MINUTES = 30;

export enum ApiRunEventType {
  FINISH
}

export enum AuditLogEventType {
  API_RUN
}

export interface AuditLogDetails {
  type: AuditLogEventType;
  endTime?: Date;
  target: string;
  locationContext?: ApiLocationContext;
  status?: ApiRunStatus;
  error?: string;
  timing?: ApiResourceTiming;
}

export type AuditLogDto = {
  id?: string;
  name?: string;
  entityId: string;
  entityType: AuditLogEntityType;
  organizationId?: string;
  deployed: boolean;
  startTime: Date;
  endTime?: Date | null;
  source?: string;
  type?: AuditLogEventType;
  details?: AuditLogDetails;
  steps?: StepDetail[];
  agentId?: string;
  userType?: UserType | null;
};

export interface StepDetail {
  name: string;
  id: string;
  pluginId: string;
  datasourceId: string;
  error?: string;
  startTimeUtc?: Date;
  executionTimeMs?: number;
}

// TODO(pbardea): This is a temporary limit until filtering can be pushed to the
// backend for proper pagination.
export const AUDIT_LOG_PAGINATION_LIMIT = 5000;
