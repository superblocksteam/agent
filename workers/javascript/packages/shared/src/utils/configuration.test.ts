import { cloneDeep } from 'lodash';
import { PostgresPlugin, RestApiIntegrationPlugin } from '../plugins';
import { PostgresDatasourceConfiguration, Property, RestApiDatasourceConfiguration } from '../types';
import { MASKED_SECRET, maskSecrets, unmaskSecrets } from './configuration';

describe('configuration', () => {
  test('can mask datasource field list secrets', () => {
    const restApiIntegrationDatasourceConfiguration: RestApiDatasourceConfiguration = {
      headers: [
        {
          key: 'Authorization',
          value: 'foobar'
        },
        {
          key: 'Content-Type',
          value: 'foobar'
        }
      ]
    };
    const restoreConfiguration = cloneDeep(restApiIntegrationDatasourceConfiguration);

    maskSecrets(restApiIntegrationDatasourceConfiguration, RestApiIntegrationPlugin);
    let headers = restApiIntegrationDatasourceConfiguration.headers as Property[];
    expect(headers[0].value).toBe(MASKED_SECRET);
    expect(headers[1].value).toBe('foobar');
    unmaskSecrets(restApiIntegrationDatasourceConfiguration, RestApiIntegrationPlugin, restoreConfiguration);
    headers = restApiIntegrationDatasourceConfiguration.headers as Property[];
    expect(headers[0].value).toBe('foobar');
  });

  test('can mask and unmask password input list secrets', () => {
    const postgresDatasourceConfiguration: PostgresDatasourceConfiguration = {
      authentication: {
        username: 'foobar',
        password: 'baz'
      }
    };
    const restoreConfiguration = cloneDeep(postgresDatasourceConfiguration);

    maskSecrets(postgresDatasourceConfiguration, PostgresPlugin);
    expect(postgresDatasourceConfiguration.authentication?.password).toBe(MASKED_SECRET);
    expect(postgresDatasourceConfiguration.authentication?.username).toBe('foobar');
    unmaskSecrets(postgresDatasourceConfiguration, PostgresPlugin, restoreConfiguration);
    expect(postgresDatasourceConfiguration.authentication?.password).toBe('baz');
  });
});
