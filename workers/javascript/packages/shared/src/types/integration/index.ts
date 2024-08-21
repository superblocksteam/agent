import { DatasourceConfiguration } from '../datasource';
import { buildCommonMetadata, ResourceMetadata } from '../metadata';
import { IntegrationKind } from '../plugin';

export class IntegrationConfigurationDto {
  id: string;
  // Created date could be used for sorting
  created: Date;
  integrationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: Record<string, any>; // DatasourceConfiguration;
  isDefault: boolean;

  // The profiles associated with this configuration.
  // This should be undefined or empty when isDefault is true.
  profileIds?: string[];
  profileNames?: string[];

  constructor({
    id,
    created,
    integrationId,
    configuration,
    isDefault,
    profileIds,
    profileNames
  }: {
    id: string;
    created: Date;
    integrationId: string;
    configuration: DatasourceConfiguration;
    isDefault: boolean;
    profileIds?: string[];
    profileNames?: string[];
  }) {
    this.id = id;
    this.created = created;
    this.integrationId = integrationId;
    this.configuration = configuration;
    this.isDefault = isDefault;
    this.profileIds = profileIds;
    this.profileNames = profileNames;
  }
}

// this is needed due to the migration from ts -> proto objects
// in this case, the configuration is less strict than the original class
export class IntegrationConfigurationDtoProtobuf {
  id: string;
  // Created date could be used for sorting
  created: Date;
  integrationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: Record<string, any>;
  isDefault: boolean;

  // The profiles associated with this configuration.
  // This should be undefined or empty when isDefault is true.
  profileIds?: string[];

  constructor({
    id,
    created,
    integrationId,
    configuration,
    isDefault,
    profileIds
  }: {
    id: string;
    created: Date;
    integrationId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configuration: Record<string, any>;
    isDefault: boolean;
    profileIds?: string[];
  }) {
    this.id = id;
    this.created = created;
    this.integrationId = integrationId;
    this.configuration = configuration;
    this.isDefault = isDefault;
    this.profileIds = profileIds;
  }
}

class IntegrationBaseDto {
  id: string;
  name: string;
  pluginId: string;
  organizationId: string;
  isUserConfigured: boolean;
  demoIntegrationId?: string;
}

export class SupersetIntegrationDto extends IntegrationBaseDto {
  kind: IntegrationKind;
  created?: Date;
  updated?: Date;
  configurations: IntegrationConfigurationDto[];
  slug?: string;
  ownerEmail?: string;
  readOnly: boolean;
  editable: boolean;
  metadata: ResourceMetadata;

  constructor({
    id,
    created,
    updated,
    deactivated,
    name,
    pluginId,
    kind,
    organizationId,
    configurations,
    demoIntegrationId,
    isUserConfigured,
    ownerEmail,
    slug,
    readOnly,
    editable
  }: {
    id: string;
    created: Date;
    updated: Date;
    deactivated: Date | null;
    name: string;
    pluginId: string;
    kind: IntegrationKind;
    organizationId: string;
    configurations: IntegrationConfigurationDto[];
    demoIntegrationId?: string;
    isUserConfigured: boolean;
    ownerEmail?: string;
    slug?: string;
    readOnly: boolean;
    editable: boolean;
  }) {
    super();
    this.id = id;
    this.created = created;
    this.updated = updated;
    this.name = name;
    this.pluginId = pluginId;
    this.kind = kind;
    this.organizationId = organizationId;
    this.configurations = configurations;
    this.demoIntegrationId = demoIntegrationId;
    this.isUserConfigured = isUserConfigured;
    this.ownerEmail = ownerEmail;
    this.slug = slug;
    this.readOnly = readOnly;
    this.editable = editable;
    this.metadata = buildCommonMetadata({
      id: id,
      organization: organizationId,
      type: 'integration',
      timestamp: {
        created: created,
        updated: updated,
        deactivated: deactivated
      }
    });
  }
}

export class IntegrationDto extends IntegrationBaseDto {
  kind: IntegrationKind;
  // Dates could be used for sorting
  created: Date;
  updated: Date;
  configurations: IntegrationConfigurationDto[];
  slug?: string;
  ownerEmail?: string;

  constructor({
    id,
    created,
    updated,
    name,
    pluginId,
    organizationId,
    configurations,
    demoIntegrationId,
    isUserConfigured,
    ownerEmail,
    kind,
    slug
  }: {
    id: string;
    created: Date;
    updated: Date;
    name: string;
    pluginId: string;
    organizationId: string;
    configurations: IntegrationConfigurationDto[];
    demoIntegrationId?: string;
    isUserConfigured: boolean;
    ownerEmail?: string;
    kind: IntegrationKind;
    slug?: string;
  }) {
    super();
    this.id = id;
    this.created = created;
    this.updated = updated;
    this.name = name;
    this.pluginId = pluginId;
    this.organizationId = organizationId;
    this.demoIntegrationId = demoIntegrationId;
    this.configurations = configurations;
    this.isUserConfigured = isUserConfigured;
    this.ownerEmail = ownerEmail;
    this.kind = kind;
    this.slug = slug;
  }
}
