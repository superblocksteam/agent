import { CouchbaseDatasourceConfiguration } from '@superblocks/shared';
import { SSHTunnelConfig } from '@superblocks/shared';

import { ConnectOptions } from 'couchbase';

export function getConnectionStringFromDatasourceConfiguration(
  datasourceConfiguration: CouchbaseDatasourceConfiguration,
  sshTunnelConfig?: SSHTunnelConfig
): string {
  if (sshTunnelConfig && sshTunnelConfig.host && sshTunnelConfig.port) {
    return `${sshTunnelConfig.host}:${sshTunnelConfig.port}`;
  }
  return datasourceConfiguration.connection?.url;
}

export function getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration: CouchbaseDatasourceConfiguration): ConnectOptions {
  return {
    username: datasourceConfiguration.connection?.user,
    password: datasourceConfiguration.connection?.password
  };
}
