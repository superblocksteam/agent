export const GRAPHQL_BASE_PLUGIN_ID = 'graphql';
export const REST_API_BASE_PLUGIN_ID = 'restapi';
export const REST_API_DEFAULT_USER_AGENT = `superblocks ${REST_API_BASE_PLUGIN_ID}`;
export const SALESFORCE_PLUGIN_ID = 'salesforce';
export const SUPERBLOCKS_OPENAPI_TENANT_KEYWORD = '{SUPERBLOCKS_OPENAPI_TENANT_NAME}';

export enum ExtendedIntegrationPluginId {
  GRAPHQL = 'graphqlintegration',
  REST_API = 'restapiintegration',
  // Native OpenAPI-backed integrations
  AIRTABLE = 'airtable',
  ASANA = 'asana',
  BITBUCKET = 'bitbucket',
  BOX = 'box',
  CONFLUENCE = 'confluence',
  DROPBOX = 'dropbox',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  NOTION = 'notion',
  PAGERDUTY = 'pagerduty',
  SEGMENT = 'segment',
  SENDGRID = 'sendgrid',
  SLACK = 'slack',
  SALESFORCE = 'salesforce',
  FRONT = 'front',
  ELASTICSEARCH = 'elasticsearch',
  JIRA = 'jira',
  ZENDESK = 'zendesk',
  TWILIO = 'twilio',
  CIRCLECI = 'circleci',
  LAUNCHDARKLY = 'launchdarkly',
  DATADOG = 'datadog',
  INTERCOM = 'intercom',
  ZOOM = 'zoom',
  GOOGLE_DRIVE = 'googledrive',
  GOOGLE_ANALYTICS = 'googleanalytics',
  STRIPE = 'stripe',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
  MISTRAL = 'mistral',
  PERPLEXITY = 'perplexity',
  FIREWORKS = 'fireworks',
  STABILITYAI = 'stabilityai',
  COHERE = 'cohere',
  GEMINI = 'gemini',
  OPENAI_V2 = 'openai_v2',
  // Not native OpenAPI-backed integrations, but leveraging the same auth system
  GOOGLE_SHEETS_PLUGIN_ID = 'gsheets',
  SNOWFLAKE = 'snowflake'
}

// Note that we cannot import the plugins themselves to reference the id as
// that causes a cyclical import.
export const ExtendedIntegrationPluginMap: Record<string, string> = {
  [ExtendedIntegrationPluginId.GRAPHQL]: GRAPHQL_BASE_PLUGIN_ID,
  [ExtendedIntegrationPluginId.REST_API]: ExtendedIntegrationPluginId.REST_API,
  // Native OpenAPI-backed integrations
  [ExtendedIntegrationPluginId.AIRTABLE]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.ASANA]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.BITBUCKET]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.BOX]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.CONFLUENCE]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.DROPBOX]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.GITHUB]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.HUBSPOT]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.NOTION]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.PAGERDUTY]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.SEGMENT]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.SENDGRID]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.SLACK]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.SALESFORCE]: SALESFORCE_PLUGIN_ID,
  [ExtendedIntegrationPluginId.TWILIO]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.CIRCLECI]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.LAUNCHDARKLY]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.DATADOG]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.FRONT]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.ELASTICSEARCH]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.INTERCOM]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.ZOOM]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.GOOGLE_DRIVE]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.GOOGLE_ANALYTICS]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.JIRA]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.STRIPE]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.ZENDESK]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.ANTHROPIC]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.GROQ]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.MISTRAL]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.PERPLEXITY]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.FIREWORKS]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.STABILITYAI]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.COHERE]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.GEMINI]: ExtendedIntegrationPluginId.REST_API,
  [ExtendedIntegrationPluginId.OPENAI_V2]: ExtendedIntegrationPluginId.REST_API
};

export const EXTENDED_INTEGRATION_PLUGIN_IDS = Object.values(ExtendedIntegrationPluginId).map((val) => val as string);

export const pluginRequiresPersistedApiFetch = (pluginId = ''): boolean => {
  return !pluginId ? false : EXTENDED_INTEGRATION_PLUGIN_IDS.includes(pluginId);
};

export const isEnrichablePlugin = (pluginId = ''): boolean => {
  return EXTENDED_INTEGRATION_PLUGIN_IDS.includes(pluginId);
};

// This function returns the appropriate plugin ID to use for the
// specified plugin ID. This is done specifically to handle integrations
// that are leveraging the same plugin package as a default plugin.
// For now, this is true for GraphQLIntegrationPlugin and GraphQLPlugin, as well
// as OpenAPI plugins that are backed by RestApiIntegrationPlugin.
// DEFER TODO(taha) Eventually use restapi as the base for restapiintegration
export const getBasePluginId = (pluginId = ''): string => {
  return ExtendedIntegrationPluginMap[pluginId] ?? pluginId;
};

export const extendsRestApiIntegrationPlugin = (pluginId = ''): boolean => {
  return getBasePluginId(pluginId) === ExtendedIntegrationPluginId.REST_API;
};

export const extendsAnyApiIntegrationPlugin = (pluginId = ''): boolean => {
  return (
    getBasePluginId(pluginId) === ExtendedIntegrationPluginId.REST_API ||
    pluginId === ExtendedIntegrationPluginId.GRAPHQL ||
    pluginId === ExtendedIntegrationPluginId.SNOWFLAKE
  );
};

export const shouldInjectAuthHeaders = (pluginId = ''): boolean => {
  return (
    getBasePluginId(pluginId) === ExtendedIntegrationPluginId.REST_API &&
    pluginId !== ExtendedIntegrationPluginId.REST_API &&
    pluginId !== ExtendedIntegrationPluginId.GRAPHQL
  );
};
