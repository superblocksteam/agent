import {
  CockroachDBActionConfiguration,
  CockroachDBDatasourceConfiguration,
  Column,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Table,
  TableType
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { Client, Notification } from 'pg';
import { KeysQuery, TableQuery } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;

export default class CockroachDBPlugin extends DatabasePluginPooled<Client, CockroachDBDatasourceConfiguration> {
  pluginName = 'CockroachDB';
  protected readonly parameterType = '$';
  protected readonly caseSensitivityWrapCharacter = '"';

  public async executePooled(
    { context, actionConfiguration }: PluginExecutionProps<CockroachDBDatasourceConfiguration, CockroachDBActionConfiguration>,
    client: Client
  ): Promise<ExecutionOutput> {
    const query = actionConfiguration.body;
    const ret = new ExecutionOutput();
    if (isEmpty(query)) {
      return ret;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.query(query, context.preparedStatementContext);
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    ret.output = normalizeTableColumnNames(rows.rows);
    return ret;
  }

  public getRequest(actionConfiguration: CockroachDBActionConfiguration): RawRequest {
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body'];
  }

  public async metadata(datasourceConfiguration: CockroachDBDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = await this.createConnection(datasourceConfiguration);
    try {
      // table
      const tableResult = await this.executeQuery(async () => {
        return client.query(TableQuery);
      });
      const entities = tableResult.rows.reduce((acc, attribute) => {
        const entityName = attribute['table_name'];
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [...columns, new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name))];
          return [...acc];
        }

        const table = new Table(entityName, entityType);
        table.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));

        return [...acc, table];
      }, []);

      // keys
      const keysResult = await this.executeQuery(async () => {
        return client.query(KeysQuery);
      });
      keysResult.rows.forEach((key) => {
        const table = entities.find((e) => e.name === key.self_table);
        if (table) {
          table.keys.push({
            name: key.constraint_name,
            type: key.constraint_type === 'p' ? 'primary key' : 'foreign key',
            columns: key.self_columns
          } as Key);
        }
      });
      return {
        dbSchema: { tables: entities }
      };
    } catch (err) {
      throw this._handleError(err, 'Metadata query failed');
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: CockroachDBDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<Client> {
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not found', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    let client: Client | null = null;

    switch (datasourceConfiguration.connectionType) {
      case 'url': {
        if (!datasourceConfiguration.connectionUrl) {
          throw new IntegrationError('Expected to receive connection url for connection type url');
        }
        const connectionString = datasourceConfiguration.connectionUrl;
        client = new Client(connectionString);
        break;
      }
      default: {
        const endpoint = datasourceConfiguration.endpoint;
        const auth = datasourceConfiguration.authentication;
        if (!endpoint) {
          throw new IntegrationError('Endpoint not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!auth) {
          throw new IntegrationError('Authentication not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!auth.custom?.databaseName?.value) {
          throw new IntegrationError('Database not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        let ssl_config: Record<string, unknown> | undefined;
        if (datasourceConfiguration.connection?.useSsl) {
          ssl_config = {
            rejectUnauthorized: false
          };
          if (datasourceConfiguration.connection?.useSelfSignedSsl) {
            ssl_config.ca = datasourceConfiguration.connection?.ca;
            ssl_config.key = datasourceConfiguration.connection?.key;
            ssl_config.cert = datasourceConfiguration.connection?.cert;
          }
        }

        client = new Client({
          host: endpoint.host,
          user: auth.username,
          password: auth.password,
          database: auth.custom.databaseName.value,
          port: endpoint.port,
          ssl: ssl_config,
          connectionTimeoutMillis: connectionTimeoutMillis
        });
        this.attachLoggerToClient(client, datasourceConfiguration);
        break;
      }
    }

    await client.connect();
    this.logger.debug(`CockroachDB client connected. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`);
    return client;
  }

  @DestroyConnection
  protected async destroyConnection(client: Client): Promise<void> {
    await client.end();
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: CockroachDBDatasourceConfiguration) {
    if (!datasourceConfiguration.endpoint) {
      return;
    }

    const datasourceEndpoint = `${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`CockroachDB client error. ${datasourceEndpoint} ${err.stack}`);
    });

    client.on('end', () => {
      this.logger.debug(`CockroachDB client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`CockroachDB notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`CockroachDB notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: CockroachDBDatasourceConfiguration): Promise<void> {
    let client: Client | null = null;
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
      'connection refused': ErrorCode.INTEGRATION_NETWORK,
      'node is running secure mode': ErrorCode.INTEGRATION_NETWORK,
      'context deadline exceeded': ErrorCode.INTEGRATION_NETWORK,
      'result is ambiguous': ErrorCode.INTEGRATION_SYNTAX,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX
    };

    for (const key of Object.keys(errorMap)) {
      if (error.message.includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as unknown as { code?: number }).code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
