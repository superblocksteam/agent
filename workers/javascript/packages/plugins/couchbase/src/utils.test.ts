import { CouchbaseDatasourceConfiguration, SSHTunnelConfig } from '@superblocks/shared';
import { expect, it } from '@jest/globals';

import { getConnectionOptionsFromDatasourceConfiguration, getConnectionStringFromDatasourceConfiguration } from './utils';

describe('getConnectionStringFromDatasourceConfiguration', () => {
  describe('happy path', () => {
    it.each([
      {
        description: 'with ssh tunnel',
        datasourceConfiguration: {},
        sshTunnelConfig: { host: 'foo', port: 1234 },
        expectedConnectionString: 'foo:1234'
      },
      {
        description: 'connection string',
        datasourceConfiguration: { connection: { connectionType: 2, url: 'baz:9012' } },
        expectedConnectionString: 'baz:9012'
      }
    ])('$description', ({ datasourceConfiguration, sshTunnelConfig, expectedConnectionString }) => {
      expect(
        getConnectionStringFromDatasourceConfiguration(
          datasourceConfiguration as CouchbaseDatasourceConfiguration,
          sshTunnelConfig as SSHTunnelConfig
        )
      ).toEqual(expectedConnectionString);
    });
  });
});

describe('getConnectionOptionsFromDatasourceConfiguration', () => {
  describe('happy path', () => {
    it.each([
      {
        description: 'happy path',
        datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
        expectedConnectOptions: { username: 'user', password: 'password' }
      }
    ])('$description', ({ datasourceConfiguration, expectedConnectOptions }) => {
      expect(getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration as CouchbaseDatasourceConfiguration)).toEqual(
        expectedConnectOptions
      );
    });
  });
});
