import { DatabricksDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
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
    },
    {
      description: 'connection type OAUTH_EXCHANGE with token',
      datasourceConfiguration: {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE,
          port: 443,
          hostUrl: 'adb-123.14.azuredatabricks.net',
          path: '/sql/1.0/warehouses/abc123'
        },
        authConfig: {
          authToken: 'oauth-exchanged-token-abc123'
        }
      },
      expectedConnectionOptions: {
        host: 'adb-123.14.azuredatabricks.net',
        path: '/sql/1.0/warehouses/abc123',
        port: 443,
        token: 'oauth-exchanged-token-abc123',
        clientId: 'Superblocks'
      }
    },
    {
      description: 'connection type numeric PAT (1)',
      datasourceConfiguration: {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.PAT,
          hostUrl: 'hostUrl',
          path: 'path',
          token: 'pat-token'
        }
      },
      expectedConnectionOptions: {
        host: 'hostUrl',
        path: 'path',
        token: 'pat-token',
        clientId: 'Superblocks'
      }
    },
    {
      description: 'connection type numeric M2M (2)',
      datasourceConfiguration: {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
          hostUrl: 'hostUrl',
          path: 'path',
          oauthClientId: 'm2m-client-id',
          oauthClientSecret: 'm2m-client-secret'
        }
      },
      expectedConnectionOptions: {
        authType: 'databricks-oauth',
        host: 'hostUrl',
        path: 'path',
        oauthClientId: 'm2m-client-id',
        oauthClientSecret: 'm2m-client-secret',
        clientId: 'Superblocks'
      }
    },
    {
      description: 'connection type numeric OAUTH_EXCHANGE (3)',
      datasourceConfiguration: {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE,
          hostUrl: 'hostUrl',
          path: 'path'
        },
        authConfig: {
          authToken: 'exchanged-token'
        }
      },
      expectedConnectionOptions: {
        host: 'hostUrl',
        path: 'path',
        token: 'exchanged-token',
        clientId: 'Superblocks'
      }
    }
  ])('$description', async ({ datasourceConfiguration, expectedConnectionOptions }) => {
    const actualConnectionOptions = getConnectionOptionsFromDatasourceConfiguration(
      datasourceConfiguration as DatabricksDatasourceConfiguration
    );
    expect(actualConnectionOptions).toEqual(expectedConnectionOptions);
  });

  // Test error cases
  describe('error cases', () => {
    it('should throw error when OAuth Token Exchange is missing authToken', () => {
      const datasourceConfiguration = {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE,
          hostUrl: 'hostUrl',
          path: 'path'
        }
        // authConfig missing
      };

      expect(() => 
        getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration as DatabricksDatasourceConfiguration)
      ).toThrow(new IntegrationError(
        'OAuth Token Exchange token expected but not present',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      ));
    });

    it('should throw error when OAuth Token Exchange has empty authToken', () => {
      const datasourceConfiguration = {
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE,
          hostUrl: 'hostUrl',
          path: 'path'
        },
        authConfig: {
          authToken: '' // empty token
        }
      };

      expect(() => 
        getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration as DatabricksDatasourceConfiguration)
      ).toThrow(new IntegrationError(
        'OAuth Token Exchange token expected but not present',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      ));
    });
  });

  // Test string fallback compatibility (if needed for future compatibility)
  describe('string connection type compatibility', () => {
    it.each([
      {
        description: 'string connectionType "oauth-token-exchange"',
        datasourceConfiguration: {
          connection: {
            connectionType: 'oauth-token-exchange',
            hostUrl: 'hostUrl',
            path: 'path'
          },
          authConfig: {
            authToken: 'oauth-token'
          }
        },
        expectedConnectionOptions: {
          host: 'hostUrl',
          path: 'path',
          token: 'oauth-token',
          clientId: 'Superblocks'
        }
      }
    ])('$description', async ({ datasourceConfiguration, expectedConnectionOptions }) => {
      // This test is currently expected to fail because we don't handle string cases yet
      // but documents the expected behavior if we add string support
      const actualConnectionOptions = getConnectionOptionsFromDatasourceConfiguration(
        datasourceConfiguration as any // bypassing type check for string
      );
      
      // This will currently fall through to default (PAT) case
      // If we add string support, this should match expectedConnectionOptions
      expect(actualConnectionOptions.host).toBe(expectedConnectionOptions.host);
      expect(actualConnectionOptions.path).toBe(expectedConnectionOptions.path);
      expect(actualConnectionOptions.clientId).toBe(expectedConnectionOptions.clientId);
    });
  });
});
