export const API_KEY_HEADER = 'x-superblocks-api-key';
export const AGENT_ENVIRONMENT_HEADER = 'x-superblocks-agent-environment';
export const AGENT_HOST_URL_HEADER = 'x-superblocks-agent-host-url';
export const AGENT_ID_HEADER = 'x-superblocks-agent-id';
export const AGENT_KEY_HEADER = 'x-superblocks-agent-key';
export const AGENT_VERSION_HEADER = 'x-superblocks-agent-version';
export const AGENT_VERSION_EXTERNAL_HEADER = 'x-superblocks-agent-version-external';
export const AGENT_INTERNAL_HOST_URL_HEADER = 'x-superblocks-agent-internal-host-url';
export const CORRELATION_ID = 'X-Superblocks-Correlation-Id';
export const DATA_DOMAIN_HEADER = 'x-superblocks-data-domain';

export const FORWARDED_COOKIE_PREFIX = 'sb_fwd_';
export const FORWARDED_COOKIE_DELIMITER = '_$$_';
export type ForwardedCookies = Record<string, { domain: string; value: string }>;

export * from './agent';
export * from './controller';
export * from './logging';
export * from './request';
