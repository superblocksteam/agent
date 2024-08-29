import {
  AdlsPluginV1 as Adls,
  AthenaPluginV1 as Athena,
  CosmosDbPluginV1 as CosmosDb,
  CouchbasePluginV1 as Couchbase,
  DatabricksPluginV1 as Databricks,
  KafkaV1 as Kafka,
  KinesisPluginV1 as Kinesis,
  OracleDbPluginV1 as OracleDb,
  PluginCommonV1,
  RedisPluginV1 as Redis,
  SalesforcePluginV1 as Salesforce,
  SmtpPluginV1 as Smtp
} from '@superblocksteam/types';
import { GoogleSheetsActionType, GoogleSheetsDestinationType, GoogleSheetsFormatType } from '../../plugins';
import { Property } from '../common/property';
import { IntegrationAuthType } from '../datasource';
import { PluginMetadata, RestApiBodyDataType } from '../plugin';
import { ApiDetails, ApiTriggerType, ExecutionParam, ScheduleConfig } from '.';

export type ActionConfigParamIn = 'HEADER' | 'QUERY' | 'PATH';
export type ActionConfigParamValue = { in: ActionConfigParamIn; value: string };
export type ActionConfigParam = { name: string } & ActionConfigParamValue;

export type TestCase = {
  operation: string;
  description: string;
  mediaType: string;
  parameters?: ActionConfigParam[];
  body?: Record<string, unknown>;
};

export type OpenApiSpec = {
  paths: Record<string, Record<string, Record<string, unknown>>>;
};

export type Action = {
  id: ActionId;
  name: string;
  type: ActionType;
  configuration: ActionConfiguration;
  applicationId?: string;
  pluginId: string;
  datasourceId: string;
  settings?: ActionSettings;
  children?: {
    [key: string]: ActionId;
  };
};

export type Actions = {
  name: string;
  triggerActionId: ActionId;
  schedule?: ScheduleConfig;
  actions: Record<string, Action>;
  executeOnPageLoad?: boolean;
  bindings?: string[];
  dynamicBindingPathList?: ExecutionParam[];
  version?: string;
  deactivated?: Date;
  created?: Date;
  updated?: Date;
  supportedMethod?: 'GET' | 'POST';
  workflowParams?: ExecutionParam[];
  workflowQueries?: ExecutionParam[];
  triggerType?: ApiTriggerType;
};

export type GoogleSheetsActionConfiguration = {
  action?: GoogleSheetsActionType;
  spreadsheetId?: string;
  sheetTitle?: string;
  range?: string;
  /** a string containing an integer */
  rowNumber?: string;
  extractFirstRowHeader?: boolean;
  /** a string containing an integer */
  headerRowNumber?: string;
  format?: GoogleSheetsFormatType;
  data?: string;
  preserveHeaderRow?: boolean;
  includeHeaderRow?: boolean;
  writeToDestinationType?: GoogleSheetsDestinationType;
  /** used by metadata to fetch spreadsheets with pagination */
  pageToken?: string;
  /** used by metadata to fetch spreadsheets with keyword */
  keyword?: string;
};

export type DBActionConfiguration = {
  body?: string;
  usePreparedSql?: boolean;
  // When operation is undefined we assume it's RUN_SQL, otherwise it's part of the SqlOperations enum
  operation?: string;
  // When using operation UPDATE_ROWS the default behavior is to match by primary key- but
  // the user can toggle to useAdvancedMatching
  useAdvancedMatching?: 'auto' | 'advanced';
  schema?: string;
  table?: string;
  oldValues?: unknown; // old rows
  insertedRows?: unknown; // inserted rows
  newValues?: unknown; // updated rows
  deletedRows?: unknown; // deleted rows
  filterBy?: unknown;
  mappingMode?: 'auto' | 'manual';
  // Sort order matters
  mappedColumns?: Array<{ json: string; sql: string }>;
};

// DEFER(jason4012) unify these types in protobuf instead of adding them manually here
export type DBSQLActionConfiguration = {
  bulkEdit?: {
    matchingMode?: PluginCommonV1.SQLMatchingMode;
    schema?: string;
    table?: string;
    oldRows?: string; // old rows
    insertedRows?: string; // inserted rows
    updatedRows?: string; // updated rows
    deletedRows?: string; // deleted rows
    filterBy?: string[];
    mappingMode?: PluginCommonV1.SQLMappingMode;
    // Sort order matters
    mappedColumns?: Array<{ json: string; sql: string }>;
  };
  runSql?: {
    sqlBody?: string;
    useParameterized?: boolean;
  };
  operation?: PluginCommonV1.SQLOperation;
};

export type BigqueryActionConfiguration = DBActionConfiguration;

type CustomProperties = Record<string, Property>;
export type GCSActionConfiguration = {
  resource?: string;
  action?: string;
  path?: string;
  prefix?: string;
  body?: string | Buffer;
  fileObjects?: unknown;
  custom?: CustomProperties;
  responseType?: ActionResponseType;
  // TODO: deprecate me, this was a typo
  resourceType?: ActionResponseType;
};

export type DynamoDBActionConfiguration = DBActionConfiguration & {
  action?: string;
};

export type EmailActionConfiguration = {
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string;
  emailBcc?: string;
  emailSubject?: string;
  emailBody?: string;
  emailAttachments?: string;
};

type SmtpPlugin = Smtp.Plugin;
export type SmtpActionConfiguration = Partial<Omit<SmtpPlugin, 'name' | 'connection' | 'dynamicWorkflowConfiguration'>>;

type AdlsPlugin = Adls.Plugin;
export type AdlsActionConfiguration = Partial<Omit<AdlsPlugin, 'name' | 'connection'>>;

export type GraphQLActionConfiguration = {
  path?: string;
  headers?: Property[];
  body?: string;
  custom?: CustomProperties;
};

export type JavascriptActionConfiguration = {
  body?: string;
};

export type MariaDBActionConfiguration = DBActionConfiguration;

export type MongoDBActionConfiguration = {
  resource?: string;
  action?: string;
  pipeline?: string;
  projection?: string;
  query?: string;
  field?: string;
  sortby?: string;
  limit?: string;
  skip?: string;
  document?: string;
  replacement?: string;
  filter?: string;
  options?: string;
  update?: string;
  distinctKey?: string;
};

export type MySQLActionConfiguration = DBActionConfiguration;

export type OpenAiActionConfiguration = {
  action?: string;
  generateChatGptResponsePrompt?: string;
  generateChatGptResponseMessageHistory?: string;
  generateChatGptResponseSystemInstruction?: string;
  generateTextType?: string;
  generateTextNewTextPrompt?: string;
  generateTextEditTextTextToEdit?: string;
  generateTextEditTextPrompt?: string;
  generateCodeType?: string;
  generateCodeNewCodePrompt?: string;
  generateCodeEditCodeCodeToEdit?: string;
  generateCodeEditCodePrompt?: string;
  checkModerationText?: string;
  embeddingText?: string;
  generateImageMethod?: string;
  generateImageGenerateFromPromptPrompt?: string;
  generateImageGenerateFromPromptImageImageSize?: string;
  generateImageEditImagePrompt?: string;
  generateImageEditImageImageFileToEdit?: unknown;
  generateImageEditImageImageMask?: string;
  generateImageEditImageImageSizes?: string;
  generateImageVaryImageImageFile?: unknown;
  generateImageVaryImageImageSize?: string;
  transcribeAudioToTextAudioFile?: unknown;
  transcribeAudioToTextInputLanguage?: string;
  transcribeAudioToTextTranslateToEnglish?: string;

  generateChatGPTResponseAiModel?: string;
  generateTextNewTextAiModel?: string;
  generateTextEditTextAiModel?: string;
  generateCodeNewCodeAiModel?: string;
  generateCodeEditCodeAiModel?: string;
  checkModerationAiModel?: string;
  generateTextEmbeddingAiModel?: string;
  transcribeAudioToTextAiModel?: string;

  generateChatGptResponseMaxTokens?: string;
  generateTextNewTextMaxTokens?: string;

  temperature?: string;
};

export type SuperblocksOcrActionConfiguration = {
  action?: string;
  file?: unknown;
  fileUrl?: string;
};

export type PostgresActionConfiguration = DBActionConfiguration;

export type CockroachDBActionConfiguration = DBActionConfiguration;

export type MsSqlActionConfiguration = DBActionConfiguration;

export type PythonActionConfiguration = {
  body?: string;
};

export type RedshiftActionConfiguration = DBActionConfiguration;

type RestApiCommonActionConfiguration = {
  httpMethod?: HttpMethod;
  responseType?: ActionResponseType;
  headers?: Property[];
  params?: Property[];
  bodyType?: RestApiBodyDataType;
  body?: string;
  formData?: Property[];
  fileFormKey?: string;
  fileName?: string;
};

export type RestApiActionConfiguration = RestApiCommonActionConfiguration & {
  path?: string;
};

export type RestApiIntegrationActionConfiguration = RestApiCommonActionConfiguration & {
  urlBase?: string;
  urlPath?: string;
  authType?: IntegrationAuthType;
  openApiAction?: string;
  openApiSpecRef?: string;
  openApiTenantName?: string;
};

export type S3ActionConfiguration = {
  resource?: string;
  action?: string;
  path?: string;
  body?: string;
  fileObjects?: unknown;
  custom?: CustomProperties;
  responseType?: ActionResponseType;
};

export type SnowflakeActionConfiguration = DBActionConfiguration;

export type WorkflowActionConfiguration = {
  workflow?: string;
  custom?: CustomProperties;
  queryParams?: Record<string, { value: unknown }>;
};

export type RocksetActionConfiguration = {
  body?: string;
};

export type ApiActionConfiguration = GraphQLActionConfiguration & RestApiActionConfiguration & RestApiIntegrationActionConfiguration;

export type LanguageActionConfiguration = JavascriptActionConfiguration & PythonActionConfiguration;

type KafkaPlugin = Kafka.Plugin;
export type KafkaActionConfiguration = Partial<Omit<KafkaPlugin, 'cluster' | 'name' | 'superblocksMetadata'>>;

type KinesisPlugin = Kinesis.Plugin;
export type KinesisActionConfiguration = Partial<Omit<KinesisPlugin, 'name' | 'connection'>>;

type AthenaPlugin = Athena.Plugin;
export type AthenaActionConfiguration = Partial<Pick<AthenaPlugin, 'runSql'>>;

type CosmosDbPlugin = CosmosDb.Plugin;
export type CosmosDbActionConfiguration = Partial<Pick<CosmosDbPlugin, 'cosmosdbAction'>>;

type CouchbasePlugin = Couchbase.Plugin;
export type CouchbaseActionConfiguration = Partial<Omit<CouchbasePlugin, 'name' | 'endpoint' | 'connection' | 'tunnel'>>;

type DatabricksPlugin = Databricks.Plugin;
export type DatabricksActionConfiguration = Partial<Omit<DatabricksPlugin, 'name' | 'connection'>>;

type OracleDbPlugin = OracleDb.Plugin;
export type OracleDbActionConfiguration = Partial<Omit<OracleDbPlugin, 'name' | 'connection'>>;

type RedisPlugin = Redis.Plugin;
export type RedisActionConfiguration = Partial<Omit<RedisPlugin, 'name' | 'connection'>>;

type SalesforcePlugin = Salesforce.Plugin;
export type SalesforceActionConfiguration = Partial<Omit<SalesforcePlugin, 'name' | 'connection'>>;

// When updating, make sure it matches with:
// /packages/ui/src/store/slices/apis/types.ts:72
export type ActionConfiguration = PluginMetadata &
  (
    | AthenaActionConfiguration
    | BigqueryActionConfiguration
    | CockroachDBActionConfiguration
    | CosmosDbActionConfiguration
    | MsSqlActionConfiguration
    | DynamoDBActionConfiguration
    | EmailActionConfiguration
    | GCSActionConfiguration
    | GraphQLActionConfiguration
    | JavascriptActionConfiguration
    | MariaDBActionConfiguration
    | MongoDBActionConfiguration
    | MySQLActionConfiguration
    | OpenAiActionConfiguration
    | PostgresActionConfiguration
    | PythonActionConfiguration
    | RedisActionConfiguration
    | RedshiftActionConfiguration
    | RestApiActionConfiguration
    | RestApiIntegrationActionConfiguration
    | RocksetActionConfiguration
    | S3ActionConfiguration
    | SnowflakeActionConfiguration
    | SuperblocksOcrActionConfiguration
    | SalesforceActionConfiguration
    | WorkflowActionConfiguration
    | GoogleSheetsActionConfiguration
    | KafkaActionConfiguration
    | KinesisActionConfiguration
    | SmtpActionConfiguration
    | AdlsActionConfiguration
    | OracleDbActionConfiguration
    | DatabricksActionConfiguration
    | CouchbaseActionConfiguration
  );

export function getAction(actionId: string, actions: ApiDetails): Action {
  return actions.actions[actionId];
}

export function getActionIds(actions: ApiDetails): string[] {
  return Object.keys(actions.actions);
}

export function getDatasourceIds(actions: ApiDetails): string[] {
  return Object.values(actions.actions)
    .map((action: Action) => action.datasourceId)
    .filter((datasourceId): datasourceId is string => !!datasourceId);
}

export function getPluginIds(actions: ApiDetails): string[] {
  return Object.values(actions.actions).map((action: Action) => action.pluginId);
}

type ActionWithChildren = Pick<Action, Exclude<keyof Action, 'children'>> & {
  children: { [key: string]: ActionId };
};

export function actionHasChild(action: Action): action is ActionWithChildren {
  return Boolean(action.children && Object.keys(action.children).length > 0);
}

export function getChildActionIds(action: Action): ActionId[] {
  return actionHasChild(action) ? Object.values(action.children) : [];
}

export type ActionId = string;

export type ActionSettings = {
  executeOnLoad?: boolean;
  cacheResponse?: string;
  userSetOnLoad?: boolean;
  confirmBeforeExecute?: boolean;
};

export enum ActionType {
  Integration,
  Conditional,
  Loop,
  Assignment
}

export enum HttpMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE'
}

// currently, used by RestAPI and S3
export enum ActionResponseType {
  AUTO = 'auto',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary',
  RAW = 'raw'
}

export enum PaginationType {
  NONE,
  PAGE_NO,
  URL
}

export const GENERIC_HTTP_REQUEST = 'genericHttpRequest';

export const DB_SQL_INITIAL_TEXT = `-- You can use SQL to query data (ex. SELECT * FROM orders;)

`;

export function getMethodColor(method: HttpMethod): string {
  switch (method) {
    case HttpMethod.GET:
      return '#08BAA5';
    case HttpMethod.POST:
      return '#00A8F5';
    case HttpMethod.PUT:
      return '#FA8A0F';
    case HttpMethod.DELETE:
      return '#F45252';
    case HttpMethod.PATCH:
      return '#643ADF';
    default:
      return 'inherit';
  }
}
