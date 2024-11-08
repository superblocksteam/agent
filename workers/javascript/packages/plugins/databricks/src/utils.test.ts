import { DatabricksDatasourceConfiguration } from '@superblocks/shared';
import { getConnectionOptionsFromDatasourceConfiguration } from './utils';

import { DatabricksPluginV1 } from '@superblocksteam/types';
describe('getConnectionOptionsFromDatasourceConfiguration', () => {
  it.each([
    {
      description: 'no connection type',
      datasourceConfiguration: { connection: { port: 1234, hostUrl: 'hostUrl', path: 'path', token: 'token' } },
      expectedConnectionOptions: { host: 'hostUrl', path: 'path', port: 1234, token: 'token', clientId: 'Superblocks' }
    },
    {
      description: 'port not given',
      datasourceConfiguration: { connection: { hostUrl: 'hostUrl', path: 'path', token: 'token' } },
      expectedConnectionOptions: { host: 'hostUrl', path: 'path', token: 'token', clientId: 'Superblocks' }
    },
    {
      description: 'connection type PAT',
      datasourceConfiguration: {
        connection: { connectionType: 'CONNECTION_TYPE_PAT', port: 1234, hostUrl: 'hostUrl', path: 'path', token: 'token' }
      },
      expectedConnectionOptions: { host: 'hostUrl', path: 'path', port: 1234, token: 'token', clientId: 'Superblocks' }
    },
    {
      description: 'connection type M2M',
      datasourceConfiguration: {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
          port: 1234,
          hostUrl: 'hostUrl',
          path: 'path',
          oauthClientId: 'oauthClientId',
          oauthClientSecret: 'oauthClientSecret'
        }
      },
      expectedConnectionOptions: {
        authType: 'databricks-oauth',
        host: 'hostUrl',
        path: 'path',
        port: 1234,
        oauthClientId: 'oauthClientId',
        oauthClientSecret: 'oauthClientSecret',
        clientId: 'Superblocks'
      }
    }
  ])('$description', async ({ datasourceConfiguration, expectedConnectionOptions }) => {
    const actualConnectionOptions = getConnectionOptionsFromDatasourceConfiguration(
      datasourceConfiguration as DatabricksDatasourceConfiguration
    );
    expect(actualConnectionOptions).toEqual(expectedConnectionOptions);
  });
});
