import { ConnectionOptions } from '@databricks/sql/dist/contracts/IDBSQLClient';
import { DatabricksDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
import { DatabricksPluginV1 } from '@superblocksteam/types';
const DATABRICKS_PARTNER_CLIENT_ID = 'Superblocks';

// APPS-4459: @databricks/sql@1.10.0 defaults socketTimeout to 15 * 60 * 1000 ms when the
// connection options omit it (see DBSQLClient.getDefaultConfig). HttpConnection passes
// socketTimeout straight through to node-fetch's `timeout`, which aborts a stalled socket.
// Without it, an OBO/OAuth token that expires mid-call leaves the socket hanging for the full
// 15 minutes, which on the worker manifests as a ~600s hang and a 503 cascade.
//
// socketTimeout bounds a SINGLE HTTP round-trip, NOT total query duration: @databricks/sql runs
// long queries by polling GetOperationStatus in separate short HTTP calls (each its own
// round-trip), and the overall retry budget is governed independently by retriesTimeout in the
// client config (HttpRetryPolicy.shouldRetry), which is not settable via ConnectionOptions. So this
// bound fails fast on a stalled socket while leaving long-running customer queries (driven by many
// short polls) unaffected.
//
// 120s is chosen over a tighter bound to leave headroom for a suspended SQL warehouse to resume:
// the first round-trip after suspension can block while the warehouse cold-starts (~20-60s+), so a
// shorter timeout risks false timeouts on the first query. 120s still fails ~7x faster than the
// 15-minute default, which is what prevents the worker hang / health-probe cascade.
//
// Operators whose warehouses have consistently longer cold-starts can override the 120s default via
// the SUPERBLOCKS_DATABRICKS_SOCKET_TIMEOUT_MS env var (no code change / image rebuild needed),
// matching the env-var precedent used for DATABRICKS_METADATA_CONCURRENCY. Invalid/non-positive
// values fall back to the default.
const DEFAULT_DATABRICKS_SOCKET_TIMEOUT_MS = 120 * 1000;

// @databricks/sql's own default socketTimeout. An override at or above this is self-defeating --
// it re-introduces the ~15-minute stalled-socket hang this fix exists to prevent -- so we reject it
// and fall back to our default rather than honoring a foot-gun value.
const DATABRICKS_LIBRARY_DEFAULT_SOCKET_TIMEOUT_MS = 15 * 60 * 1000;

// Resolve the socket-timeout from an optional override string, falling back to the default for
// anything that isn't a positive integer below the library default. Uses Number() (not parseInt) so
// values like "3e5" parse as intended and partial junk like "3e5abc"/"abc" is rejected rather than
// silently truncated.
export function resolveDatabricksSocketTimeoutMs(
  raw: string | undefined = process.env.SUPERBLOCKS_DATABRICKS_SOCKET_TIMEOUT_MS
): number {
  const n = raw === undefined || raw.trim() === '' ? NaN : Number(raw);
  return Number.isInteger(n) && n > 0 && n < DATABRICKS_LIBRARY_DEFAULT_SOCKET_TIMEOUT_MS
    ? n
    : DEFAULT_DATABRICKS_SOCKET_TIMEOUT_MS;
}

export const DATABRICKS_SOCKET_TIMEOUT_MS = resolveDatabricksSocketTimeoutMs();

export function getConnectionOptionsFromDatasourceConfiguration(
  datasourceConfiguration: DatabricksDatasourceConfiguration
): ConnectionOptions {
  let connectionOptions: ConnectionOptions;

  switch (datasourceConfiguration.connection?.connectionType) {
    case DatabricksPluginV1.Plugin_ConnectionType.M2M:
      connectionOptions = {
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        authType: 'databricks-oauth',
        host: datasourceConfiguration.connection?.hostUrl,
        path: datasourceConfiguration.connection?.path,
        oauthClientId: datasourceConfiguration.connection?.oauthClientId,
        oauthClientSecret: datasourceConfiguration.connection?.oauthClientSecret
      };
      break;
    case DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE: {
      if (!datasourceConfiguration.authConfig?.authToken) {
        throw new IntegrationError('OAuth Token Exchange token expected but not present', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
      }

      connectionOptions = {
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        host: datasourceConfiguration.connection?.hostUrl as string,
        path: datasourceConfiguration.connection?.path as string,
        token: datasourceConfiguration.authConfig.authToken
      };
      break;
    }
    case DatabricksPluginV1.Plugin_ConnectionType.PAT:
    default:
      // for backwards compatibility, if we do not get a connectionType, we use ConnectionType.PAT
      connectionOptions = {
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        host: datasourceConfiguration.connection?.hostUrl as string,
        path: datasourceConfiguration.connection?.path as string,
        token: datasourceConfiguration.connection?.token as string
      };
  }
  // add the port if given
  if (datasourceConfiguration.connection?.port !== undefined) {
    connectionOptions.port = datasourceConfiguration.connection?.port;
  }
  // add the partner client id
  connectionOptions.userAgentEntry = DATABRICKS_PARTNER_CLIENT_ID;
  return connectionOptions;
}
