import { PostgresDatasourceConfiguration } from '../../types';
import { DatabasePluginPooled } from './DatabasePluginPooled';

type TypedDatasourceConfiguration = PostgresDatasourceConfiguration & {
  poolIdentityMarker: string;
};

abstract class TypedPoolPlugin extends DatabasePluginPooled<never, TypedDatasourceConfiguration> {
  public getTypedPoolIdentity(datasourceConfiguration: TypedDatasourceConfiguration): TypedDatasourceConfiguration {
    return super.getConnectionPoolIdentity(datasourceConfiguration);
  }
}

describe('DatabasePluginPooled', () => {
  it('types the default pool identity with the plugin datasource configuration', () => {
    expect(TypedPoolPlugin).toBeDefined();
  });
});
