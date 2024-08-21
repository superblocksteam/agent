import {
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  RedshiftActionConfiguration,
  RedshiftDatasourceConfiguration,
  Table,
  TableType,
  normalizeTableColumnNames
} from '@superblocks/shared';
import { groupBy, isEmpty } from 'lodash';
import { Client, Notification } from 'pg';

const TEST_CONNECTION_TIMEOUT = 5000;
const DEFAULT_SCHEMA = 'public';

export default class RedshiftPlugin extends DatabasePluginPooled<Client, RedshiftDatasourceConfiguration> {
  pluginName = 'Redshift';

  protected readonly parameterType = '$';
  protected async executePooled(
    { context, actionConfiguration }: PluginExecutionProps<RedshiftDatasourceConfiguration, RedshiftActionConfiguration>,
    client: Client
  ): Promise<ExecutionOutput> {
    try {
      const ret = new ExecutionOutput();
      const query = actionConfiguration.body;
      if (!query || isEmpty(query)) {
        return ret;
      }
      const rows = await this.executeQuery(() => {
        return client.query(query, context.preparedStatementContext);
      });
      ret.output = normalizeTableColumnNames(rows.rows);
      return ret;
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
  }

  public getRequest(actionConfiguration: RedshiftActionConfiguration): RawRequest {
    return actionConfiguration.body;
  }

  public dynamicProperties(): string[] {
    return ['body'];
  }

  public async metadata(datasourceConfiguration: RedshiftDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = await this.createConnection(datasourceConfiguration);
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource configuration not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    const schema = datasourceConfiguration.authentication?.custom?.databaseSchema?.value ?? DEFAULT_SCHEMA;
    try {
      const schemaQuery = `SELECT * FROM pg_table_def WHERE schemaname = '${schema}'`;
      const schemaResult = await this.executeQuery(() => {
        return client.query(schemaQuery);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableMapping = groupBy(schemaResult.rows, (result: any) => result.tablename);
      const tables = Object.keys(tableMapping).map((tableName): Table => {
        return {
          name: tableName,
          type: TableType.TABLE,
          columns: tableMapping[tableName].map((column): Column => {
            return { name: column.column, type: column.type };
          })
        };
      });
      return {
        dbSchema: {
          tables: tables
        }
      };
    } catch (err) {
      throw this._handleError(err, 'Failed to connect to Redshift');
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @DestroyConnection
  protected async destroyConnection(connection: Client): Promise<void> {
    await connection.end();
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: RedshiftDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<Client> {
    try {
      let client: Client;
      switch (datasourceConfiguration.connectionType) {
        case 'url': {
          if (!datasourceConfiguration.connectionUrl) {
            throw new IntegrationError('Expected to receive connection url for connection type url');
          }
          client = new Client(datasourceConfiguration.connectionUrl);
          break;
        }
        default: {
          const endpoint = datasourceConfiguration.endpoint;
          if (!endpoint) {
            throw new IntegrationError('Endpoint not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          const auth = datasourceConfiguration.authentication;
          if (!auth) {
            throw new IntegrationError('Auth not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!auth.custom?.databaseName?.value) {
            throw new IntegrationError('Database name not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }

          client = new Client({
            host: endpoint.host,
            user: auth.username,
            password: auth.password,
            database: auth.custom.databaseName.value,
            port: endpoint.port,
            ssl: datasourceConfiguration.connection?.useSsl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: connectionTimeoutMillis
          });
        }
      }
      this.attachLoggerToClient(client, datasourceConfiguration);

      await client.connect();
      this.logger.debug(`Redshift client connected. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`);
      return client;
    } catch (err) {
      throw this._handleError(err, 'Failed to connect to Redshift');
    }
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: RedshiftDatasourceConfiguration) {
    if (!datasourceConfiguration) {
      return;
    }
    const datasourceEndpoint = `${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`Redshift client error. ${datasourceEndpoint} err.stack`);
    });

    client.on('end', () => {
      this.logger.debug(`Redshift client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`Redshift notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`Redshift notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: RedshiftDatasourceConfiguration): Promise<void> {
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      await this.executeQuery(() => {
        return client.query('SELECT NOW()');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(
        `${initialMessage}: ${error.message}`,
        (error as IntegrationError).code,
        (error as IntegrationError).internalCode
      );
    }

    const message = `${initialMessage}: ${error.message}`;
    const errorMap: Record<string, ErrorCode> = {
      'Client was closed and is not queryable': ErrorCode.INTEGRATION_NETWORK,
      'Connection closed': ErrorCode.INTEGRATION_NETWORK,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'Query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key in errorMap) {
      if (error.message.includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as unknown as { code?: string }).code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
