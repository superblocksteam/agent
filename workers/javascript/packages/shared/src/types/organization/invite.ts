import { OrganizationUserDto } from '../user';

export interface PostInviteRequestDto {
  operations: InviteOperation[];
  groupIds?: string[];
}

export interface PostInviteResponseDto {
  users: OrganizationUserDto[];
  error?: string;
}

export interface InviteOperation {
  email: string;
  action: InviteAction;
}

export enum InviteAction {
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member'
}
