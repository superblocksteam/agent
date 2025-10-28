import { ConnectionOptions } from '@databricks/sql/dist/contracts/IDBSQLClient';
import { DatabricksDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
import { DatabricksPluginV1 } from '@superblocksteam/types';
const DATABRICKS_PARTNER_CLIENT_ID = 'Superblocks';

export function getConnectionOptionsFromDatasourceConfiguration(
  datasourceConfiguration: DatabricksDatasourceConfiguration
): ConnectionOptions {
  let connectionOptions: ConnectionOptions;

  switch (datasourceConfiguration.connection?.connectionType) {
    case DatabricksPluginV1.Plugin_ConnectionType.M2M:
      connectionOptions = {
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
