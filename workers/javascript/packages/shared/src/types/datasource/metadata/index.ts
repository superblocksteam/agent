import { AdlsPluginV1, CosmosDbPluginV1, DynamoDbV1, KafkaV1, SalesforcePluginV1 } from '@superblocksteam/types';
import { DatasourceConfiguration } from '..';
import { Plugin } from '../../plugin';
import { ConnectedUserTokenDto } from '../../userToken';
import { BucketMetadata } from './bucket';
import { DatabaseSchemaMetadata } from './database';

export interface DatasourceMetadataDto {
  // ALL KEYS SHOULD BE THE EXACT PLUGIN ID
  // NOTE(joey): each integration type should have their own field here for metadata
  dbSchema?: DatabaseSchemaMetadata;
  buckets?: BucketMetadata[];
  kafka?: KafkaV1.Metadata; // NOTE(frank): Why do we use a much different pattern here than we do for action and datasource configurations?
  integrationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openApiSpec?: any;
  dynamodb?: DynamoDbV1.Metadata;
  connectedUserTokens?: Record<string, ConnectedUserTokenDto[]>;
  salesforce?: SalesforcePluginV1.Plugin_Metadata;
  adls?: AdlsPluginV1.Plugin_Metadata;
  cosmosdb?: CosmosDbPluginV1.Plugin_Metadata;
  secrets?: Array<{
    alias: string;
    name: string;
  }>;
  // used to fetch gsheets with pagination
  gSheetsNextPageToken?: string | undefined | null;
  loadDisabled?: boolean;
}

export interface DatasourceMetadataV2Dto {
  databaseSchemaMetadata?: DatabaseSchemaMetadata;
  bucketsMetadata?: {
    buckets: BucketMetadata[];
  };
  kafka?: KafkaV1.Metadata;
  cosmosdb?: CosmosDbPluginV1.Plugin_Metadata;
  adls?: AdlsPluginV1.Plugin_Metadata;
  integrationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openApiSpec?: any;
  gSheetsNextPageToken?: string | undefined | null;
}

export interface DatasourceMetadataRequest {
  datasourceConfig: DatasourceConfiguration;
  plugin: Plugin;
}

// TODO add DatasourceMetadataResponse wrapper instead of returning DatasourceMetadata directly

export * from './bucket';
export * from './database';
