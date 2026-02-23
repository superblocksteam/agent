import {
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Schema,
  SnowflakePostgresActionConfiguration,
  SnowflakePostgresDatasourceConfiguration,
  Table,
  TableType
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { Client, Notification } from 'pg';
import { KEYS_QUERY, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;

const SNOWFLAKE_APPLICATION_NAME = 'Superblocks';

export default class SnowflakePostgresPlugin extends DatabasePluginPooled<Client, SnowflakePostgresDatasourceConfiguration> {
  pluginName = 'SnowflakePostgres';
  protected readonly parameterType = '$';
  protected readonly caseSensitivityWrapCharacter = '"';

  public async executePooled(
    { context, actionConfiguration }: PluginExecutionProps<SnowflakePostgresDatasourceConfiguration, SnowflakePostgresActionConfiguration>,
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

  public getRequest(actionConfiguration: SnowflakePostgresActionConfiguration): RawRequest {
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body'];
  }

  public async metadata(datasourceConfiguration: SnowflakePostgresDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client: Client | null = null;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
    try {
      const tableResult = await this.executeQuery(async () => {
        return client!.query(TABLE_QUERY);
      });

      const schemaNames = new Set<string>();
      const tables = tableResult.rows.reduce((acc: Table[], attribute) => {
        const entityName = attribute['table_name'];
        const entitySchema = attribute['schema_name'];
        const entityType = TableType.TABLE;

        schemaNames.add(entitySchema);

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          entity.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));
          return acc;
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));
        return [...acc, table];
      }, []);

      const schemas = Array.from(schemaNames).map((name) => new Schema(name));

      const keysResult = await this.executeQuery(async () => {
        return client!.query(KEYS_QUERY);
      });
      keysResult.rows.forEach((key) => {
        const table = tables.find((e) => e.name === key.self_table);
        if (table) {
          table.keys.push({
            name: key.constraint_name,
            type: key.constraint_type === 'p' ? 'primary key' : 'foreign key',
            columns: key.self_columns
          } as Key);
        }
      });

      return {
        dbSchema: { tables, schemas }
      };
    } catch (err) {
      throw new IntegrationError(`Failed to fetch metadata from ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
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
    datasourceConfiguration: SnowflakePostgresDatasourceConfiguration,
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
          throw new IntegrationError('Expected to receive connection URL for connection type url');
        }
        let connectionString = datasourceConfiguration.connectionUrl;
        // Ensure application_name is always set
        const separator = connectionString.includes('?') ? '&' : '?';
        if (!connectionString.includes('application_name=')) {
          connectionString = `${connectionString}${separator}application_name=${SNOWFLAKE_APPLICATION_NAME}`;
        }
        // Remove any sslmode from the URL — we control SSL via the ssl option
        connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?&/, '?').replace(/\?$/, '');
        client = new Client({
          connectionString,
          ssl: { rejectUnauthorized: false }
        });
        break;
      }
      default: {
        const connection = datasourceConfiguration.connection;
        if (!connection) {
          throw new IntegrationError('Connection configuration not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        const host = connection.host;
        const port = connection.port ?? 5432;
        const databaseName = connection.databaseName;

        if (!host) {
          throw new IntegrationError('Host not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!databaseName) {
          throw new IntegrationError('Database name not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        // Snowflake always requires SSL
        const ssl_config: Record<string, unknown> = {
          rejectUnauthorized: false
        };
        if (connection.useSelfSignedSsl) {
          if (connection.ca) ssl_config.ca = connection.ca;
          if (connection.key) ssl_config.key = connection.key;
          if (connection.cert) ssl_config.cert = connection.cert;
        }

        client = new Client({
          host,
          port,
          user: connection.username,
          password: connection.password,
          database: databaseName,
          ssl: ssl_config,
          connectionTimeoutMillis,
          application_name: SNOWFLAKE_APPLICATION_NAME
        });

        this.attachLoggerToClient(client, datasourceConfiguration);
        break;
      }
    }

    await client.connect();
    this.logger.debug(
      `SnowflakePostgres client connected. ${datasourceConfiguration.connection?.host}:${datasourceConfiguration.connection?.port}`
    );
    return client;
  }

  @DestroyConnection
  protected async destroyConnection(client: Client): Promise<void> {
    await client.end();
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: SnowflakePostgresDatasourceConfiguration) {
    const host = datasourceConfiguration.connection?.host ?? 'unknown';
    const port = datasourceConfiguration.connection?.port ?? 5432;
    const datasourceEndpoint = `${host}:${port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`SnowflakePostgres client error. ${datasourceEndpoint} ${err.stack}`);
    });

    client.on('end', () => {
      this.logger.debug(`SnowflakePostgres client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`SnowflakePostgres notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`SnowflakePostgres notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: SnowflakePostgresDatasourceConfiguration): Promise<void> {
    let client: Client | null = null;
    try {
      client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      await this.executeQuery(() => {
        return client!.query('SELECT NOW()');
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
      'client was closed and is not queryable': ErrorCode.INTEGRATION_NETWORK,
      'connection closed': ErrorCode.INTEGRATION_NETWORK,
      'connection refused': ErrorCode.INTEGRATION_NETWORK,
      'connection terminated': ErrorCode.INTEGRATION_NETWORK,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key of Object.keys(errorMap)) {
      if (error.message.toLowerCase().includes(key)) {
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
