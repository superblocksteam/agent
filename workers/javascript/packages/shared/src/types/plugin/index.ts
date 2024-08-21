import { compareSemVer } from '../organization';
import { FormItemDisplay, FormTemplate } from './form';
import { getBasePluginId } from './integration';

export interface Plugin {
  id: string; // Unique ID for the plugin
  name: string; // User friendly name for the plugin
  type: PluginType;
  moduleName: string; // The name of the code module that powers the plugin
  modulePath: string; // The location of the module at runtime
  iconLocation: string;
  openApiSpecRef?: string; // The location of the OpenAPI spec for the plugin, if applicable
  docsUrl?: string;
  actionFormDocLinks?: Array<{ url: string; name: string; display?: FormItemDisplay }>;
  responseType: PluginResponseType;
  rawRequestName?: string;
  hasRawRequest: boolean; // Temporary until all plugins support a raw response
  datasourceTemplate?: FormTemplate; // Template for generating the datasource (Integrations Page) form in the UI
  actionTemplate: FormTemplate; // Template for generating the action (API Step) form in the UI
  demoData?: Record<string, unknown>;
  hasTest?: boolean; // Specifies whether the plugin has a test connection operation; defaults to true
  hasMetadata?: boolean; // Specifies whether the plugin has metadata api implemented; defaults to false
  isStreamable?: boolean;
  kind?: IntegrationKind;
}

// TODO: Do we need this field in the FE?
export enum PluginType {
  DB = 'DB',
  API = 'API',
  JS = 'JS',
  CODE = 'CODE'
}

export enum PluginResponseType {
  TABLE = 'TABLE',
  JSON = 'JSON'
}

// This is a plugin version which is guaranteed to be earliest in any plugin.
export const VERSION_INITIAL: SemVer = '0.0.1';

export type SemVer = string;
export type SupportedPluginVersions = Record<Plugin['id'], SemVer[]>;
export type PluginExecutionVersions = Record<Plugin['id'], SemVer>;

export type PluginMetadata = {
  // Optional for backwards compatibility
  superblocksMetadata?: {
    // Optional for backwards compatibility
    pluginVersion?: SemVer;
    // This field is only used/stored in the datasource configuration,
    // and is not needed in the action configuration
    syncedFromProfileId?: string;
  };
};

// This function creates a plugin execution versions map from a supported plugin versions map
export const supportedVersionsToExecutionVersions = (supportedVersions: SupportedPluginVersions): PluginExecutionVersions => {
  const execVersions: PluginExecutionVersions = {};
  for (const [plugin, versions] of Object.entries(supportedVersions)) {
    versions.sort(compareSemVer);
    execVersions[plugin] = versions[versions.length - 1];
  }
  return execVersions;
};

export enum RestApiBodyDataType {
  JSON = 'jsonBody',
  RAW = 'rawBody',
  FORM = 'formData',
  FILE_FORM = 'fileForm'
}

export enum RestApiFields {
  HEADERS = 'headers',
  PARAMS = 'params',
  FILE_FORM_KEY = 'fileFormKey',
  FILE_NAME = 'fileName',
  BODY = 'body',
  BODY_TYPE = 'bodyType',
  FORM_DATA = 'formData',
  PATH = 'path',
  HTTP_METHOD = 'httpMethod',
  URL_BASE = 'urlBase',
  URL_PATH = 'urlPath',
  AUTH_TYPE = 'authType',
  RESPONSE_TYPE = 'responseType',
  OPENAPI_TENANT_NAME = 'openApiTenantName'
}

const restApiFieldDisplayName: Map<RestApiFields, string> = new Map([
  [RestApiFields.HEADERS, 'Headers'],
  [RestApiFields.PARAMS, 'Parameters'],
  [RestApiFields.FILE_FORM_KEY, 'File form key'],
  [RestApiFields.FILE_NAME, 'File name'],
  [RestApiFields.BODY_TYPE, 'Body content type'],
  [RestApiFields.FORM_DATA, 'Form data'],
  [RestApiFields.PATH, 'URL'],
  [RestApiFields.HTTP_METHOD, 'Method'],
  [RestApiFields.URL_BASE, 'Base URL'],
  [RestApiFields.URL_PATH, 'URL path'],
  [RestApiFields.AUTH_TYPE, 'Authentication'],
  [RestApiFields.RESPONSE_TYPE, 'Response type'],
  [RestApiFields.OPENAPI_TENANT_NAME, 'Tenant name']
]);

export const getRestApiFieldDisplayName = function (field: RestApiFields): string {
  return restApiFieldDisplayName.get(field) ?? '';
};

const restApiDataTypeDisplayName: Map<RestApiBodyDataType, string> = new Map([
  [RestApiBodyDataType.JSON, 'JSON'],
  [RestApiBodyDataType.FORM, 'Form'],
  [RestApiBodyDataType.FILE_FORM, 'File Form'],
  [RestApiBodyDataType.RAW, 'Raw']
]);

export const getRestApiDataTypeDisplayName = function (dataType: RestApiBodyDataType): string {
  return restApiDataTypeDisplayName.get(dataType) ?? '';
};

const restApiBodyLabel: Map<RestApiBodyDataType, string> = new Map([
  [RestApiBodyDataType.JSON, 'JSON Body'],
  [RestApiBodyDataType.FORM, 'Form Data'],
  [RestApiBodyDataType.FILE_FORM, 'File Contents'],
  [RestApiBodyDataType.RAW, 'Raw Data']
]);

export const getRestApiBodyLabel = function (dataType: RestApiBodyDataType): string {
  return restApiBodyLabel.get(dataType) ?? '';
};

export const getPluginExecutionVersion = (pluginExecutionVersions: PluginExecutionVersions, pluginId: string): SemVer => {
  return pluginExecutionVersions[getBasePluginId(pluginId)];
};

export const setPluginExecutionVersion = (
  pluginExecutionVersions: PluginExecutionVersions,
  pluginId: string,
  pluginVersion: SemVer
): void => {
  pluginExecutionVersions[getBasePluginId(pluginId)] = pluginVersion;
};

export enum IntegrationKind {
  SECRET = 'SECRET',
  PLUGIN = 'PLUGIN'
}

export * from './form';
export * from './language';
export * from './evaluation';
export * from './integration';
