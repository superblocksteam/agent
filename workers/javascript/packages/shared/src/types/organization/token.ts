import { ApiKeyScope, OrganizationUserDto } from '../..';

export class OrganizationTokenDto {
  id: string;
  name: string;
  created: Date;
  organizationId: string;
  scope: ApiKeyScope;
  key?: string;
  expiresAt?: Date;
  creator?: OrganizationUserDto;
  lastUsed?: Date;

  constructor({
    id,
    name,
    created,
    organizationId,
    scope,
    key,
    expiresAt,
    creator,
    lastUsed
  }: {
    id: string;
    name: string;
    created: Date;
    organizationId: string;
    scope: ApiKeyScope;
    key?: string;
    expiresAt?: Date;
    creator?: OrganizationUserDto;
    lastUsed?: Date;
  }) {
    this.id = id;
    this.name = name;
    this.created = created;
    this.organizationId = organizationId;
    this.scope = scope;
    this.key = key;
    this.expiresAt = expiresAt;
    this.creator = creator;
    this.lastUsed = lastUsed;
  }
}
