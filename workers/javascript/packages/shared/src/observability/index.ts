import {
  SEMATTRS_HTTP_FLAVOR,
  SEMATTRS_HTTP_HOST,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_SCHEME,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL,
  SEMATTRS_HTTP_USER_AGENT,
  SEMATTRS_NET_PEER_IP
} from '@opentelemetry/semantic-conventions';

// SUPERBLOCKS METADATA
export const OBS_TAG_REMOTE = 'remote';
export const OBS_TAG_FEATURE_GROUP = 'feature-group';

// SUPERBLOCKS ORGANZIATION
export const OBS_TAG_ORG_ID = 'organization-id';
export const OBS_TAG_ORG_NAME = 'organization-name';
export const OBS_TAG_USER_EMAIL = 'user-email';
export const OBS_TAG_USER_TYPE = 'user-type';
export const OBS_TAG_BILLING_PLAN = 'billing-plan';

// SUPERBLOCKS RESOURCE
export const OBS_TAG_RESOURCE_TYPE = 'resource-type';
export const OBS_TAG_RESOURCE_ID = 'resource-id';
export const OBS_TAG_RESOURCE_NAME = 'resource-name';
export const OBS_TAG_RESOURCE_ACTION = 'resource-action';
export const OBS_TAG_EVENT_TYPE = 'event-type';
export const OBS_TAG_PARENT_ID = 'parent-id';
export const OBS_TAG_PARENT_NAME = 'parent-name';
export const OBS_TAG_PARENT_TYPE = 'parent-type';
export const OBS_TAG_PLUGIN_NAME = 'plugin-name';
export const OBS_TAG_PLUGIN_VERSION = 'plugin-version';
export const OBS_TAG_PLUGIN_EVENT = 'plugin-event';
export const OBS_TAG_INTEGRATION_ID = 'integration-id';
export const OBS_TAG_ENTITY_TYPE = 'entity-type';
export const OBS_TAG_ENTITY_ID = 'entity-id';
export const OBS_TAG_ENTITY_NAME = 'entity-name';
export const OBS_TAG_API_ID = 'api-id';
export const OBS_TAG_API_NAME = 'api-name';
export const OBS_TAG_WIDGET_TYPE = 'widget-type';
export const OBS_TAG_PROFILE_ID = 'profile-id';
export const OBS_TAG_PROFILE = 'profile';

// SUPERBLOCKS INFRA
export const OBS_TAG_ENV = 'environment';
export const OBS_TAG_CORRELATION_ID = 'correlation-id';
export const OBS_TAG_CONTROLLER_ID = 'controller-id';
export const OBS_TAG_WORKER_ID = 'worker-id';
export const OBS_TAG_AGENT_ID = 'agent-id';
export const OBS_TAG_AGENT_VERSION = 'agent-version';
export const OBS_TAG_AGENT_VERSION_EXTERNAL = 'agent-version-external';
export const OBS_TAG_AGENT_URL = 'agent-url';

// SUPERBLOCKS EXECUTION
export const OBS_TAG_ERROR = 'error';
export const OBS_TAG_ERROR_TYPE = 'error-type';
export const OBS_TAG_ERROR_STACK = 'error-stack';
export const OBS_TAG_ERROR_PRIORITY = 'error-priority';
export const OBS_TAG_VIEW_MODE = 'view-mode';
export const OBS_TAG_CACHE_REGION = 'cache-region';
// For the sole purposes of aggregating user api responses
export const OBS_TAG_RESPONSE_SIZE = 'response-size';
export const OBS_TAG_DURATION = 'duration';

// HTTP
export const OBS_TAG_HTTP_SCHEME = SEMATTRS_HTTP_SCHEME;
export const OBS_TAG_HTTP_USER_AGENT = SEMATTRS_HTTP_USER_AGENT;
export const OBS_TAG_HTTP_REQUEST_CONTENT_LENGTH = SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH;
export const OBS_TAG_HTTP_METHOD = SEMATTRS_HTTP_METHOD;
export const OBS_TAG_HTTP_FLAVOR = SEMATTRS_HTTP_FLAVOR;
export const OBS_TAG_HTTP_URL = SEMATTRS_HTTP_URL;
export const OBS_TAG_HTTP_ROUTE = SEMATTRS_HTTP_ROUTE;
export const OBS_TAG_HTTP_STATUS_CODE = SEMATTRS_HTTP_STATUS_CODE;
export const OBS_TAG_NET_PEER_IP = SEMATTRS_NET_PEER_IP;
export const OBS_TAG_HTTP_HOST = SEMATTRS_HTTP_HOST;
export const OBS_TAG_SUPERBLOCKS_ENV = 'superblocks.environment';
export const OBS_TAG_SUPERBLOCKS_REGION = 'superblocks.region';

// WS specific tags
export const OBS_TAG_APPLICATION_ID = 'application-id';
export const OBS_TAG_BRANCH = 'branch';
export const OBS_TAG_COMMIT_ID = 'commit-id';
export const OBS_SOCKET_STATUS_CODE = 'socket.status-code';

// If you don't want to import a bunch of stuff...
export const OBS_TAGS = {
  ORG_ID: OBS_TAG_ORG_ID,
  ORG_NAME: OBS_TAG_ORG_NAME,
  USER_EMAIL: OBS_TAG_USER_EMAIL,
  RESOURCE_TYPE: OBS_TAG_RESOURCE_TYPE,
  RESOURCE_ID: OBS_TAG_RESOURCE_ID,
  RESOURCE_NAME: OBS_TAG_RESOURCE_NAME,
  RESOURCE_ACTION: OBS_TAG_RESOURCE_ACTION,
  EVENT_TYPE: OBS_TAG_EVENT_TYPE,
  PARENT_ID: OBS_TAG_PARENT_ID,
  PARENT_NAME: OBS_TAG_PARENT_NAME,
  PARENT_TYPE: OBS_TAG_PARENT_TYPE,
  PLUGIN_NAME: OBS_TAG_PLUGIN_NAME,
  PLUGIN_VERSION: OBS_TAG_PLUGIN_VERSION,
  PLUGIN_EVENT: OBS_TAG_PLUGIN_EVENT,
  INTEGRATION_ID: OBS_TAG_INTEGRATION_ID
};

// It is not valid to have a dash character in Prometheus label tames.
// However, we're already committed to the dash character in our observability
// product. Hence, we're just going to use this when adding metrics.
export const toMetricLabels = (tags: string[] | Record<string, string | number>): string[] | Record<string, string | number> => {
  const replace = /(\.|-)/g;

  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.replace(replace, '_'));
  }
  Object.keys(tags).forEach((tag) => {
    if (tag.match(replace)) {
      tags[tag.replace(replace, '_')] = tags[tag];
      delete tags[tag];
    }
  });
  return tags;
};
