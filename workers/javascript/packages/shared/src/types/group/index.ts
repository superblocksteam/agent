/**
 * This enum is used in DB. DO NOT CHANGE the existing values. It is also
 * indirectly referenced in the authorization.polar file, so references there
 * need to be updated if this changes.
 */
export enum GroupType {
  /**
   * @deprecated Use `ALL_USERS` instead. This is being kept around for backwards compatibility in migrations.
   */
  EVERYONE = 0,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ALL_USERS = 0,
  ADMIN = 1,
  CUSTOM = 2,
  SUPER_USER = 3
}

export enum GroupSource {
  SUPERBLOCKS = 'SUPERBLOCKS',
  SCIM = 'SCIM'
}

export interface GroupBrief {
  id: string;
  type: GroupType;
  name: string;
  size: number;
  created: Date;
  // A way for the UI to tell if the current user is part of the group without
  // needing to fetch all of the members of the group.
  requestingUserIsMember: boolean;
}

export class DataTreeGroup {
  id: string;
  name: string;
  size: number;

  constructor(groupBrief: GroupBrief) {
    this.id = groupBrief.id;
    this.name = groupBrief.name;
    this.size = groupBrief.size;
  }
}

export interface GetGroupsResponseDto {
  groups: GroupBrief[];
}

export interface PostGroupsRequestDto {
  name: string;
  initialMemberEmails: string[];
}

export interface PostGroupsResponseDto {
  group?: GroupDetail;
  error?: string;
}

export enum GroupMemberStatus {
  UNREGISTERED = 'unregistered',
  JOINED = 'joined',
  DEACTIVATED = 'deactivated'
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  status: GroupMemberStatus;
}

export interface GroupDetail {
  id: string;
  type: GroupType;
  name: string;
  size: number;
  created: Date;
  members: GroupMember[];
}

export interface GetGroupResponseDto {
  group: GroupDetail;
}

export interface PutGroupRequestDto {
  name: string;
}

export interface PutGroupResponseDto {
  group?: GroupDetail;
  error?: string;
}

export enum GroupAction {
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member'
}

export const validGroupAction = (groupAction: GroupAction): boolean => {
  return groupAction === GroupAction.ADD_MEMBER || groupAction === GroupAction.REMOVE_MEMBER;
};

export interface GroupOperation {
  email: string;
  action: GroupAction;
}

export interface PostGroupRequestDto {
  operations: GroupOperation[];
}

export interface PostGroupResponseDto {
  group?: GroupDetail;
  error?: string;
}

export enum DefaultGroupName {
  /**
   * @deprecated Use `ALL_USERS` instead. This is being kept around for backwards compatibility in migrations.
   */
  EVERYONE = 'All Users',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ALL_USERS = 'All Users',
  ADMIN = 'Admins',
  SUPER_USER = 'Super Users'
}

export const isGroupDeletable = (type: GroupType): boolean => {
  return type !== GroupType.ADMIN && type !== GroupType.EVERYONE;
};
