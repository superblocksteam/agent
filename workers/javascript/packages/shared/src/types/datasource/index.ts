import {
  AdlsPluginV1 as AdlsPlugin,
  AthenaPluginV1 as AthenaPlugin,
  CosmosDbPluginV1 as CosmosDbPlugin,
  CouchbasePluginV1 as CouchbasePlugin,
  DatabricksPluginV1 as DatabricksPlugin,
  KafkaV1 as KafkaPlugin,
  KinesisPluginV1 as KinesisPlugin,
  OracleDbPluginV1 as OracleDbPlugin,
  PluginCommonV1 as PluginCommon,
  RedisPluginV1 as RedisPlugin,
  SalesforcePluginV1 as SalesforcePlugin,
  SecretsV1 as Secrets,
  SmtpPluginV1 as SmtpPlugin
} from '@superblocksteam/types';
import { Property } from '../common/property';
import { Plugin, PluginMetadata } from '../plugin';
import {
  AUTH_TYPE_OAUTH_TOKEN_EXCHANGE,
  AWSAuthType,
  AuthConfig,
  AuthContext,
  AuthId,
  AuthType,
  IntegrationAuthType,
  PublicAuthConfig,
  getAuthId
} from './auth';
export { PluginCommonV1 as PluginCommon } from '@superblocksteam/types';

// The DTO for the full datasource (ie all fields). This should only be visible
// to users that can configure the datasource.
export class DatasourceDto {
  id: string;
  name: string;
  pluginId: string;
  pluginName?: string;
  organizationId?: string;
  configuration?: DatasourceConfiguration;
  //TODO(alex): delete configurationProd, configurationStaging once we change an interface between UI and server
  // @deprecated use configurationProfiles instead
  configurationProd?: DatasourceConfiguration;
  // @deprecated use configurationProfiles instead
  configurationStaging?: DatasourceConfiguration;
  configurationProfiles?: Record<string, DatasourceConfiguration>;
  isDefault?: boolean;
  // TODO clean up this field from the FE
  invalids?: string[];
  authContext?: AuthContext;
  creator?: {
    id: string;
    name: string;
  };
  demoIntegrationId?: string;
  ownerEmail?: string;
  error?: string;

  constructor(datasource: DatasourceDto, ownerEmail?: string, configurationProfiles?: Record<string, DatasourceConfiguration>) {
    this.id = datasource.id;
    this.name = datasource.name;
    this.pluginId = datasource.pluginId;
    this.organizationId = datasource.organizationId;
    this.demoIntegrationId = datasource.demoIntegrationId;
    this.configuration = datasource.configurationProd;
    this.configurationProd = datasource.configurationProd;
    this.configurationStaging = datasource.configurationStaging;
    this.configurationProfiles = configurationProfiles;
    this.isDefault = datasource.isDefault;
    this.ownerEmail = ownerEmail;
    this.invalids = [];
  }
}

// ViewDatasourceDto is just the information needed to use a datasource to
// create steps of that type. Credentials are explicitly excluded - those should
// only be needed to execute the step.
export class ViewDatasourceDto {
  id: string;
  name: string;
  pluginId: string;
  organizationId?: string;
  isDefault?: boolean;
  readOnly: boolean;
  ownerEmail?: string;

  constructor(datasource: DatasourceDto, readOnly: boolean, ownerEmail?: string) {
    this.id = datasource.id;
    this.name = datasource.name;
    this.pluginId = datasource.pluginId;
    this.organizationId = datasource.organizationId;
    this.isDefault = datasource.isDefault;
    this.readOnly = readOnly;
    this.ownerEmail = ownerEmail;
  }
}

// AuthDatasourceDto is just the information that's needed to authenticate with
// a datasource on the front-end. Sensitive secrets that the browser cannot be
// trusted with should not be present. All users that can run a datasource will
// be able to see the values of this DTO via the Network tab in their browser
// debug console for example.
export class AuthDatasourceDto extends ViewDatasourceDto {
  //TODO(alex): Remove configurationProd and configurationStaging once UI is updated to use configurationProfiles
  configurationProd?: PublicRestApiDatasourceConfiguration;
  configurationStaging?: PublicRestApiDatasourceConfiguration;
  configurationProfiles?: Record<string, PublicRestApiDatasourceConfiguration>;

  constructor(
    datasource: DatasourceDto,
    configurationProd: DatasourceConfiguration,
    configurationStaging: DatasourceConfiguration,
    configurationProfiles?: Record<string, DatasourceConfiguration>
  ) {
    // We don't care about read only status here.
    super(datasource, true /* isReadOnly */);
    this.configurationProd = configurationProd as PublicRestApiDatasourceConfiguration;
    this.configurationStaging = configurationStaging as PublicRestApiDatasourceConfiguration;
    this.configurationProfiles = (configurationProfiles ?? {}) as Record<string, PublicRestApiDatasourceConfiguration>;
  }
}

export function getAuthIdFromConfig(integrationId: string, config: RestApiIntegrationDatasourceConfiguration): AuthId {
  if (config.authType) {
    return getAuthId(config.authType, config.authConfig, integrationId);
  }

  return 'empty-auth-type';
}

export type DynamicWorkflowConfig = {
  enabled?: boolean;
  workflowId?: string;
};

export type BaseDatasourceConfiguration = PluginMetadata & {
  name?: string;
  dynamicWorkflowConfiguration?: DynamicWorkflowConfig;
  id?: string;
};

// Use this aliased typed for default datasources only. For all other
// datasources, use BaseDatasourceConfiguration.
export type DefaultDatasourceConfiguration = BaseDatasourceConfiguration;

export type LanguageDatasourceConfiguration = DefaultDatasourceConfiguration;

export interface DBAuthentication {
  authentication?: {
    custom?: {
      databaseName?: Property;
    };
    username?: string;
    password?: string;
  };
}

export type DBDatasourceConfiguration = BaseDatasourceConfiguration & {
  endpoint?: {
    host?: string;
    /**
     * @type integer
     * @minimum 0
     * @maximum 65536
     */
    port?: number;
  };
};

export interface DBConnection {
  connection?: {
    useSsl?: FakeBoolean;
    useSelfSignedSsl?: FakeBoolean;
    ca?: string;
    key?: string;
    cert?: string;
    // This field is set on the demo postgres
    mode?: 0;
  };
}

export interface ClientWrapper<T, U> {
  client: T;
  tunnel?: U;
}

export interface SSHTunnel {
  tunnel?: SSHAuthConfiguration;
}

export enum SharedSSHAuthMethod {
  PASSWORD = 0,
  PUB_KEY_RSA = 1,
  PUB_KEY_ED25519 = 2,
  USER_PRIVATE_KEY = 3
}

export type SSHAuthConfiguration = PluginCommon.SSHConfiguration & { authMethod?: SharedSSHAuthMethod };

export type AWSDatasourceConfiguration = BaseDatasourceConfiguration & {
  awsAuthType?: AWSAuthType;
  authentication?: {
    [key: string]: unknown;
    custom?: {
      region?: Property;
      accessKeyID?: Property;
      secretKey?: Property;
      iamRoleArn?: Property;
    };
  };
};

export type BigqueryDatasourceConfiguration = BaseDatasourceConfiguration & {
  authentication?: {
    custom?: {
      googleServiceAccount?: Property;
    };
  };
};

export type GCSDatasourceConfiguration = BaseDatasourceConfiguration & {
  authentication?: {
    custom?: {
      googleServiceAccount?: Property;
    };
  };
};

export type DynamoDBDatasourceConfiguration = AWSDatasourceConfiguration;

export type EmailDatasourceConfiguration = BaseDatasourceConfiguration & {
  authentication?: {
    custom?: {
      apiKey?: Property;
      senderEmail?: Property;
      senderName?: Property;
    };
  };
  // Having the template ID in the datasource config would allow us to
  // potentially serve different templates for different organizations.
  sendgridTemplateId?: string;
};

export type SmtpDatasourceConfiguration = Pick<SmtpPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

export type AdlsDatasourceConfiguration = Pick<AdlsPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

export type AzureAuthenticator = {
  value: { clientId: string; clientSecret: string };
  case: 'clientCreds';
};

export type SuperblocksOcrDatasourceConfiguration = BaseDatasourceConfiguration & {
  microsoftComputerVisionApiKey?: string;
  microsoftComputerVisionResourceBaseUrl?: string;
};

//TODO: move all auth methods to this type(service account, API key, DB user/pass etc)
export type AuthenticatedDatasourceConfig = BaseDatasourceConfiguration & {
  authConfig?: AuthConfig;
  authType?: AuthType;
};

export function isAuthenticatedDatasourceConfig(dc: DatasourceConfiguration): dc is AuthenticatedDatasourceConfig {
  return 'authConfig' in dc && 'authType' in dc;
}

export type GraphQLDatasourceConfiguration = AuthenticatedHttpDatasourceConfig & {
  path?: string;
};

export type JavascriptDatasourceConfiguration = LanguageDatasourceConfiguration;

export type MariaDBDatasourceConfiguration = DBDatasourceConfiguration &
  DBConnection &
  DBAuthentication & {
    connectionType?: 'fields' | 'url';
    connectionUrl?: string;
  };

export type MongoDBDatasourceConfiguration = DBDatasourceConfiguration & DBConnection & DBAuthentication & SSHTunnel;

export type MySQLDatasourceConfiguration = DBDatasourceConfiguration &
  DBConnection &
  DBAuthentication &
  SSHTunnel & {
    connectionType?: 'fields' | 'url';
    connectionUrl?: string;
  };

// This type exists for two reasons:
// 1. Integration forms sometimes use "checked" instead of a boolean
// 2. Our schema generator requires a named type for unions like this
type FakeBoolean = boolean | string;

export type DBTunnelDatasourceConfiguration = {
  endpoint?: {
    host?: string;
    /**
     * @type integer
     * @minimum 0
     * @maximum 65536
     */
    port?: number;
  };
} & SSHTunnel;

export type PostgresDatasourceConfiguration = DBDatasourceConfiguration &
  DBConnection &
  DBAuthentication &
  SSHTunnel & {
    connectionType?: 'fields' | 'url';
    connectionUrl?: string;
  };

export type CockroachDBDatasourceConfiguration = PostgresDatasourceConfiguration;

export type PythonDatasourceConfiguration = LanguageDatasourceConfiguration;

export type RedshiftDatasourceConfiguration = DBDatasourceConfiguration &
  DBConnection & {
    authentication?: {
      custom?: {
        databaseName?: Property;
        databaseSchema?: Property;
      };
      username?: string;
      password?: string;
    };
  } & {
    connectionType?: 'fields' | 'url';
    connectionUrl?: string;
  };

// This is the only datasource config for now that's supported for FE auth.
export type PublicRestApiDatasourceConfiguration = {
  authType?: IntegrationAuthType;
  publicAuthConfig?: PublicAuthConfig;
};

export type AuthenticatedHttpDatasourceConfig = AuthenticatedDatasourceConfig & {
  headers?: Property[];
  params?: Property[];
};

export type RestApiDatasourceConfiguration = AuthenticatedHttpDatasourceConfig & {
  urlBase?: string;
  // This is part of the in-memory form, not persisted
  AuthCodeExplanation?: string;
  FirebaseAlert?: string;
  HTTPBasicAlert?: string;
  'oauth-callback-alert'?: string;
  'oauth-connect-button'?: string;
  'oauth-revoke-shared-tokens-button'?: string;
  OAuth2PasswordAlert?: string;
  openApiSpecRef?: string;
  openApiTenantName?: string;
};

export type OpenAiDatasourceConfiguration = BaseDatasourceConfiguration & {
  bearerToken: string;
  organizationId?: string;
};

export type RestApiIntegrationDatasourceConfiguration = RestApiDatasourceConfiguration;

export type S3DatasourceConfiguration = AWSDatasourceConfiguration & { endpoint?: string };

export type SnowflakeDatasourceConfiguration = AuthenticatedDatasourceConfig &
  DBDatasourceConfiguration &
  DBConnection & {
    // okta: https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#use-native-sso-through-okta
    // key-pair: https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#label-nodejs-key-pair-authentication
    // oauth token exchange: https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#label-nodejs-oauth
    connectionType?: 'fields' | 'okta' | 'key-pair' | typeof AUTH_TYPE_OAUTH_TOKEN_EXCHANGE;
    // if set, will be "connectionType"
    authTypeField?: string;
    okta?: {
      authenticatorUrl?: string;
    };
    keyPair?: {
      privateKey: string;
      password?: string;
    };
    authentication?: {
      username?: string;
      password?: string;
      custom?: {
        databaseName?: Property;
        account?: Property;
        warehouse?: Property;
        schema?: Property;
        role?: Property;
      };
    };
  };

export type MsSqlDatasourceConfiguration = DBDatasourceConfiguration &
  DBConnection &
  DBAuthentication & {
    connectionType?: 'fields' | 'url';
    connectionUrl?: string;
  };

export type RocksetDatasourceConfiguration = BaseDatasourceConfiguration & {
  apiKey: string;
  baseURL?: string;
};

export type WorkflowDatasourceConfiguration = BaseDatasourceConfiguration;

export type GoogleSheetsDatasourceConfiguration = RestApiDatasourceConfiguration;

// NOTE(frank): Trying to keep these all Protobuf types.
// The reason I can't do  Pick<KafkaPlugin.Plugin, 'name' | 'cluster' | 'superblocksMetadata'> is because
// it wants the class methods to be defined on the type that is defined in this file.
// This shoulbe easily fixiable by migrating every instance of PluginMetadata to the Protobuf type.
export type KafkaDatasourceConfiguration = {
  superblocksMetadata?: Partial<Pick<KafkaPlugin.SuperblocksMetadata, 'pluginVersion' | 'syncedFromProfileId'>>;
} & Pick<KafkaPlugin.Plugin, 'name' | 'cluster' | 'dynamicWorkflowConfiguration'>;

export type AthenaDatasourceConfiguration = Pick<AthenaPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

export type RedisDatasourceConfiguration = Pick<RedisPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

export type KinesisDatasourceConfiguration = Pick<KinesisPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

// NOTE(frank): We should just be using `SecretV1.Store`. However, ts-json-schema-generator does not
// support `bigint`. So you'd think I can just do `Omit<Secretv1.Store, 'metadata'>`. However, it doesn't
// respect Pick, Omit, or Exclude.... Hence, this workaround where we literally dupe the type....
export type SecretStore = {
  provider?: Secrets.Provider;
  ttl?: number;
  configurationId: string;
};

export type CosmosDbDatasourceConfiguration = Pick<CosmosDbPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>;

export type CouchbaseDatasourceConfiguration = Pick<
  CouchbasePlugin.Plugin,
  'name' | 'connection' | 'tunnel' | 'dynamicWorkflowConfiguration'
>;

export type DatabricksDatasourceConfiguration = 
  Pick<DatabricksPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'> & 
  AuthenticatedDatasourceConfig & {
    authTypeField?: string;
    oauthType?: IntegrationAuthType.OAUTH2_TOKEN_EXCHANGE;
  };

export type OracleDbDatasourceConfiguration = Pick<OracleDbPlugin.Plugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'> & {
  connectionType?: 'fields' | 'url';
  connectionUrl?: string;
};

// authType and authToken is also defined in salesforce template
// this will be populated by orchestrator, and it will be used by plugin.execute | metadata | test
// so the plugin will get ready-to-use oauth token. This is needed until we figure out a way to pass token
// to plugin.metadata and plugin.test
export type SalesforceDatasourceConfiguration = AuthenticatedDatasourceConfig & {
  // if set, will be set to 'authTypeOnBehalfOfToken'
  authTypeField?: string;
  authTypeOnBehalfOfToken?: string;
} & Pick<SalesforcePlugin.Plugin, 'name' | 'connection'>;

export type DatasourceConfiguration =
  | AthenaDatasourceConfiguration
  | BigqueryDatasourceConfiguration
  | CockroachDBDatasourceConfiguration
  | CosmosDbDatasourceConfiguration
  | DynamoDBDatasourceConfiguration
  | EmailDatasourceConfiguration
  | GCSDatasourceConfiguration
  | GraphQLDatasourceConfiguration
  | JavascriptDatasourceConfiguration
  | MariaDBDatasourceConfiguration
  | MongoDBDatasourceConfiguration
  | MySQLDatasourceConfiguration
  | OpenAiDatasourceConfiguration
  | PostgresDatasourceConfiguration
  | PythonDatasourceConfiguration
  | RedisDatasourceConfiguration
  | RedshiftDatasourceConfiguration
  | RestApiDatasourceConfiguration
  | RestApiIntegrationDatasourceConfiguration
  | S3DatasourceConfiguration
  | SnowflakeDatasourceConfiguration
  | SuperblocksOcrDatasourceConfiguration
  | WorkflowDatasourceConfiguration
  | MsSqlDatasourceConfiguration
  | RocksetDatasourceConfiguration
  | GoogleSheetsDatasourceConfiguration
  | KafkaDatasourceConfiguration
  | KinesisDatasourceConfiguration
  | SalesforceDatasourceConfiguration
  | SmtpDatasourceConfiguration
  | AdlsDatasourceConfiguration
  | OracleDbDatasourceConfiguration
  | DatabricksDatasourceConfiguration
  | CouchbaseDatasourceConfiguration
  | SecretStore;

export type DatasourceConfigurationByType = {
  adls?: AdlsDatasourceConfiguration;
  aivenkafka?: KafkaDatasourceConfiguration;
  athena?: AthenaDatasourceConfiguration;
  bigquery?: BigqueryDatasourceConfiguration;
  cockroachdb?: CockroachDBDatasourceConfiguration;
  confluent?: KafkaDatasourceConfiguration;
  couchbase?: CouchbaseDatasourceConfiguration;
  databricks?: DatabricksDatasourceConfiguration;
  dynamodb?: DynamoDBDatasourceConfiguration;
  email?: EmailDatasourceConfiguration;
  gcs?: GCSDatasourceConfiguration;
  graphqlintegration?: GraphQLDatasourceConfiguration;
  graphql?: GraphQLDatasourceConfiguration;
  javascript?: JavascriptDatasourceConfiguration;
  kinesis?: KinesisDatasourceConfiguration;
  mariadb?: MariaDBDatasourceConfiguration;
  mongodb?: MongoDBDatasourceConfiguration;
  msk?: KafkaDatasourceConfiguration;
  mysql?: MySQLDatasourceConfiguration;
  openai?: OpenAiDatasourceConfiguration;
  oracledb?: OracleDbDatasourceConfiguration;
  postgres?: PostgresDatasourceConfiguration;
  python?: PythonDatasourceConfiguration;
  redpanda?: KafkaDatasourceConfiguration;
  redshift?: RedshiftDatasourceConfiguration;
  restapi?: RestApiDatasourceConfiguration;
  restapiintegration?: RestApiIntegrationDatasourceConfiguration;
  s3?: S3DatasourceConfiguration;
  smtp?: SmtpDatasourceConfiguration;
  snowflake?: SnowflakeDatasourceConfiguration;
  salesforce?: SalesforceDatasourceConfiguration;
  'superblocks-ocr'?: SuperblocksOcrDatasourceConfiguration;
  workflow?: WorkflowDatasourceConfiguration;
  mssql?: MsSqlDatasourceConfiguration;
  rockset?: RocksetDatasourceConfiguration;
  gsheets?: GoogleSheetsDatasourceConfiguration;
  kafka?: KafkaDatasourceConfiguration;
};

export enum DatasourceEnvironments {
  PRODUCTION = 'Production',
  STAGING = 'Staging'
}

export const ENVIRONMENT_PRODUCTION = 'production';
export const ENVIRONMENT_STAGING = 'staging';
export const ENVIRONMENT_ALL = '*';

export const VALID_DATASOURCE_ENVIRONMENTS = [ENVIRONMENT_PRODUCTION, ENVIRONMENT_STAGING, ENVIRONMENT_ALL];

export type Integration = {
  datasource: DatasourceDto;
  plugin: Plugin;
};

export * from './auth';
export * from './metadata';
export * from './test';
