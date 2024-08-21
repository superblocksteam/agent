export enum VersionedEntityType {
  WORKFLOW = 'workflow',
  SCHEDULED_JOB = 'scheduled_job',
  APPLICATION = 'application'
}

// TODO(taha) Add strong typing for configuration
// For an app, this should include (published) page, and (published actions) from all apis
// For a workflow, this should include workflow configuration and (published) actions
// For a scheduled job, this should include schedule and (published) actions
export type VersionedEntityConfiguration = Record<string, unknown>;

export type VersionCreationMetadata = {
  description?: string;
};

type UserInfo = {
  name: string;
  email: string;
};

export type VersionDto = {
  id?: string;
  description?: string;

  updated?: Date;
  createdBy: UserInfo;
  created?: Date;
  deployedBy?: UserInfo;
  deployedAt?: Date;
  editedBy?: UserInfo;
  editedAt?: Date;

  entityId: string;
  entityType: VersionedEntityType;
  entityVersion: number;
  entityConfiguration?: VersionedEntityConfiguration;
  organizationId: string;
};
