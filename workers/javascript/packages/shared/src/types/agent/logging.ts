import { BillingPlan } from '../billing';
import { EventEntityType } from '../event';
import { RequestSource, UserType } from '../user';

export type RemoteHttpLog = BaseHttpLogFields & LogFields;

export type BaseHttpLogFields = {
  level: number;
  time: number;
  remote: boolean;
  msg: string;
};

export type LogFields = {
  // Required (global)
  resourceId: string;
  resourceType: EventEntityType;
  organizationId: string;
  // Optional (global)
  remote?: string;
  organizationName?: string;
  correlationId?: string;
  eventType?: string;
  resourceName?: string;
  resourceAction?: string;
  userEmail?: string;
  userType?: UserType;
  // Optional (error)
  error?: string;
  errorType?: string;
  // Optional (local)
  controllerId?: string;
  workerId?: string;
  agentVersion?: string;
  parentId?: string;
  parentName?: string;
  parentType?: EventEntityType;
  plugin?: string;
  integrationId?: string;
  responseSize?: number;
  duration?: number;
  billingPlan?: BillingPlan;
  viewMode?: string;
  environment?: string;
  profileId?: string;
  profile?: string;
  stack?: string;
  cacheRegion?: string;
  source?: RequestSource;
};

export interface logger {
  trace(fields: LogFields, msg: string): void;

  debug(fields: LogFields, msg: string): void;

  info(fields: LogFields, msg: string): void;

  warn(fields: LogFields, msg: string): void;

  error(fields: LogFields, msg: string): void;
}
