import { ExecutionOutput } from '../../types';
import { ConnectionPool, ConnectionPoolCoordinator } from '../pool';
import { PluginExecutionProps } from './BasePlugin';
import { SQLDatabasePlugin } from './SQLDatabasePlugin';

type CreateConnArgs<DatasourceConfig> = [datasourceConfiguration: DatasourceConfig, connectionTimeoutMillis?: number];

/**
 * A class that makes it easier for database plugins to use a connection pool
 */
export abstract class SQLDatabasePluginPooled<Conn, DatasourceConfig> extends SQLDatabasePlugin {
  protected connectionPool: ConnectionPool<Conn, CreateConnArgs<DatasourceConfig>>;

  public attachConnectionPool(connectionPoolCoordinator: ConnectionPoolCoordinator): void {
    super.attachConnectionPool(connectionPoolCoordinator);
    this.connectionPool = new ConnectionPool(
      {
        connectionPoolCoordinator,
        idleTimeoutMs: this.pluginConfiguration.connectionPoolIdleTimeoutMs
      },
      {
        thisArg: this,
        createConnection: this.createConnection,
        destroyConnection: this.destroyConnection
      }
    );
  }

  protected abstract createConnection(...args: CreateConnArgs<DatasourceConfig>): Promise<Conn>;

  protected abstract destroyConnection(conn: Conn): Promise<void>;

  /**
   * Like execute from BasePlugin, but with a connection to the DB that has already been created.
   * Note (1): this method should not destroy the connection.
   * Note (2): if this method throws, the connection will not be returned to the pool, it will be destroyed. This is because
   * we cannot reliably tell if the connection is left in a good state (e.g. the error might have been a connectivity related error).
   */
  protected abstract executePooled(
    executionProps: PluginExecutionProps<DatasourceConfig>,
    conn: Conn
  ): Promise<undefined | ExecutionOutput>;

  // NOTE: the type of executionProps should have been PluginExecutionProps<DatasourceConfig>
  // but BasePlugin has the wrong type for it
  async execute(executionProps: PluginExecutionProps): Promise<undefined | ExecutionOutput> {
    return this.connectionPool.withConnection(
      executionProps.datasourceConfiguration,
      [(executionProps as PluginExecutionProps<DatasourceConfig>).datasourceConfiguration],
      async (conn) => {
        return this.executePooled(executionProps as PluginExecutionProps<DatasourceConfig>, conn);
      }
    );
  }
}
