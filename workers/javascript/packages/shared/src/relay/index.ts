/**
 * Relay is used by browser, or any caller, to ask agents forward specific request headers,
 * request query parameters, and request body fields contained in the incoming request,
 * to all subsequent outgoing agent -> server requests (if there's any).
 *
 * Relay will always override the original outgoing requests' payload, if a conflict happens.
 *
 * In browser -> agent requests, a sample incoming request with Relay rules in its body looks like below:
 * headers: {
 *   Authorization: authorization-value,
 *   x-superblocks-agent-id: agent-id-value
 * }
 *
 * query: {
 *   environment: environment-value,
 * }
 *
 * body: {
 *  relays: {
 *   // Relay x-superblocks-agent-id to the same name. Relay Authorization to a new name x-superblocks-api-key.
 *   headers: [{Authorization: x-superblocks-api-key}, x-superblocks-agent-id],
 *
 *   // Relay environment to the same name.
 *   query: [environment],
 *
 *   // Relay isPublished to a new name viewMode.
 *   body: [{isPublished: viewMode}]
 *  },
 *  isPublished: isPublished-value,
 * }
 *
 * Now in the subsequent outgoing agent -> server requests, the relayed field will show up as
 *
 * headers: {
 *   ...existing_headers,
 *   x-superblocks-api-key: authorization-value,
 *   x-superblocks-agent-id: agent-id-value
 * }
 *
 * query: {
 *   ...existing_query,
 *   environment: environment-value
 * }
 *
 * body: {
 *   ...existing_body,
 *   viewMode: isPublished-value
 * }
 *
 */
export * from './builder';
export * from './delegate';
export * from './types';
