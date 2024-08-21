import { DataTreeGroup } from '../group';

export interface User {
  id: string;
  email: string;
  currentOrganizationId: string;
  organizationIds: string[];
  isAnonymous: boolean;
}

export enum ApplicationUserStatus {
  EDITOR_PENDING_JOIN = 0,
  EDITOR_JOINED = 1
}

export interface ApplicationUserDto {
  name: string;
  email: string;
  id: string;
  status: ApplicationUserStatus;
}

export enum OrganizationUserStatus {
  PENDING = 0,
  ACTIVE = 1,
  INACTIVE = 2
}

export interface OrganizationUserDto {
  name: string;
  email: string;
  id: string;
  status: OrganizationUserStatus;
  type?: UserType;
  lastJwtIssuedAt?: Date;
}

export interface Invitee {
  email: string;
}

export type DataTreeUser = {
  name: string;
  email: string;
  id: string;
  groups: DataTreeGroup[];
  username: string;
  metadata: Record<string, unknown>;
};

export enum AccessMode {
  VISITOR = 'visitor',
  AUTH_USER = 'auth_user',
  EXTERNAL_USER = 'external_user'
}

export interface VisitorInfo {
  visitorId: string;
  referrer?: string;
}

export enum UserSource {
  SUPERBLOCKS = 'SUPERBLOCKS',
  SCIM = 'SCIM'
}

export enum UserType {
  SUPERBLOCKS = 'SUPERBLOCKS',
  EXTERNAL = 'EXTERNAL'
}

export type UserAuthSource = 'Superblocks' | 'Auth0' | 'Anonymous';

export enum RequestSource {
  SUPERBLOCKS = 'superblocks',
  EMBED = 'embed'
}

export * from './analytics';
export * from './emailVerification';
export * from './permission';
export * from './survey';
