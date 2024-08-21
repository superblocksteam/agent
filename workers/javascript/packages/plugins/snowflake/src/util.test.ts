import { SnowflakeDatasourceConfiguration } from '@superblocks/shared';

import { connectionOptionsFromDatasourceConfiguration } from './util';

describe('connectionOptionsFromDatasourceConfiguration', () => {
  it('works for fields when connectionType is not given (backwards compatible)', async () => {
    const datasourceConfiguration = {
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      database: 'databaseName',
      warehouse: 'warehouse',
      role: 'role',
      schema: 'schema'
    });
  });

  it('works for fields when connectionType is given', async () => {
    const datasourceConfiguration = {
      connectionType: 'fields',
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      database: 'databaseName',
      warehouse: 'warehouse',
      role: 'role',
      schema: 'schema'
    });
  });

  it('works for okta', async () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' }
        }
      },
      okta: {
        authenticatorUrl: 'foo.com'
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      authenticator: 'foo.com'
    });
  });

  it('fails when authentication is not present', () => {
    expect(() => connectionOptionsFromDatasourceConfiguration({})).toThrow('authentication expected but not present');
  });

  it('fails with missing fields listed for connection type fields', () => {
    const datasourceConfiguration = {
      connectionType: 'fields',
      authentication: {}
    } as SnowflakeDatasourceConfiguration;
    expect(() => connectionOptionsFromDatasourceConfiguration(datasourceConfiguration)).toThrow(
      'Missing required fields: username,password,account,databaseName'
    );
  });

  it('fails with missing fields listed for connection type okta', () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {}
    } as SnowflakeDatasourceConfiguration;
    expect(() => connectionOptionsFromDatasourceConfiguration(datasourceConfiguration)).toThrow(
      'Missing required fields: username,password,account,authenticatorUr'
    );
  });
});
