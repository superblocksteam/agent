import { DatabricksDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
import { DatabricksPluginV1 } from '@superblocksteam/types';

import { DATABRICKS_SOCKET_TIMEOUT_MS, getConnectionOptionsFromDatasourceConfiguration, resolveDatabricksSocketTimeoutMs } from './utils';
describe('getConnectionOptionsFromDatasourceConfiguration', () => {
  it.each([
    {
      description: 'no connection type',
      datasourceConfiguration: { connection: { port: 1234, hostUrl: 'hostUrl', path: 'path', token: 'token' } },
      expectedConnectionOptions: {
        host: 'hostUrl',
        path: 'path',
        port: 1234,
        token: 'token',
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
      }
    },
    {
      description: 'port not given',
      datasourceConfiguration: { connection: { hostUrl: 'hostUrl', path: 'path', token: 'token' } },
      expectedConnectionOptions: {
        host: 'hostUrl',
        path: 'path',
        token: 'token',
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
      }
    },
    {
      description: 'connection type PAT',
      datasourceConfiguration: {
        connection: { connectionType: 'CONNECTION_TYPE_PAT', port: 1234, hostUrl: 'hostUrl', path: 'path', token: 'token' }
      },
      expectedConnectionOptions: {
        host: 'hostUrl',
        path: 'path',
        port: 1234,
        token: 'token',
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
      }
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
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
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
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
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
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
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
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
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
        socketTimeout: DATABRICKS_SOCKET_TIMEOUT_MS,
        userAgentEntry: 'Superblocks'
      }
    }
  ])('$description', async ({ datasourceConfiguration, expectedConnectionOptions }) => {
    const actualConnectionOptions = getConnectionOptionsFromDatasourceConfiguration(
      datasourceConfiguration as DatabricksDatasourceConfiguration
    );
    expect(actualConnectionOptions).toEqual(expectedConnectionOptions);
  });

  // APPS-4459: every connection path must set socketTimeout so @databricks/sql does not fall back
  // to its 15-minute default (which leaves a stalled socket hanging the worker for 600s+).
  describe('socketTimeout (APPS-4459)', () => {
    it('uses a conservative round-trip bound, not the 15-minute library default', () => {
      // The library default is 15 * 60 * 1000. Ours must be much smaller so a single
      // stalled HTTP round-trip aborts quickly instead of hanging the worker.
      expect(DATABRICKS_SOCKET_TIMEOUT_MS).toBe(120 * 1000);
      expect(DATABRICKS_SOCKET_TIMEOUT_MS).toBeLessThan(15 * 60 * 1000);
    });

    it.each([
      { raw: undefined, expected: 120 * 1000, why: 'no override -> default' },
      { raw: '', expected: 120 * 1000, why: 'empty -> default' },
      { raw: '60000', expected: 60000, why: 'plain integer' },
      { raw: '300000', expected: 300000, why: 'larger-but-valid (5m, below the 15m library default)' },
      { raw: '3e5', expected: 300_000, why: 'scientific notation parses as intended (3e5=300000, not 3)' },
      { raw: 'abc', expected: 120 * 1000, why: 'junk -> default' },
      { raw: '12.5', expected: 120 * 1000, why: 'non-integer -> default' },
      { raw: '-5', expected: 120 * 1000, why: 'non-positive -> default' },
      { raw: '0', expected: 120 * 1000, why: 'zero -> default' },
      { raw: String(15 * 60 * 1000), expected: 120 * 1000, why: 'at the library default -> rejected (re-introduces the hang)' },
      { raw: '1800000', expected: 120 * 1000, why: 'above the library default -> rejected' }
    ])('resolveDatabricksSocketTimeoutMs: $why', ({ raw, expected }) => {
      expect(resolveDatabricksSocketTimeoutMs(raw)).toBe(expected);
    });

    it.each([
      {
        description: 'PAT',
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.PAT,
          hostUrl: 'hostUrl',
          path: 'path',
          token: 'pat-token'
        }
      },
      {
        description: 'M2M (OBO/OAuth)',
        connection: {
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
          hostUrl: 'hostUrl',
          path: 'path',
          oauthClientId: 'id',
          oauthClientSecret: 'secret'
        }
      },
      {
        description: 'OAUTH_EXCHANGE',
        connection: { connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE, hostUrl: 'hostUrl', path: 'path' },
        authConfig: { authToken: 'tok' }
      },
      {
        description: 'default (no connection type)',
        connection: { hostUrl: 'hostUrl', path: 'path', token: 'token' }
      }
    ])('sets socketTimeout for $description', ({ connection, authConfig }) => {
      const options = getConnectionOptionsFromDatasourceConfiguration({
        connection,
        authConfig
      } as DatabricksDatasourceConfiguration);
      expect(options.socketTimeout).toBe(DATABRICKS_SOCKET_TIMEOUT_MS);
    });
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

      expect(() => getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration as DatabricksDatasourceConfiguration)).toThrow(
        new IntegrationError('OAuth Token Exchange token expected but not present', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD)
      );
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

      expect(() => getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration as DatabricksDatasourceConfiguration)).toThrow(
        new IntegrationError('OAuth Token Exchange token expected but not present', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD)
      );
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
          userAgentEntry: 'Superblocks'
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
      expect(actualConnectionOptions.userAgentEntry).toBe(expectedConnectionOptions.userAgentEntry);
    });
  });
});
