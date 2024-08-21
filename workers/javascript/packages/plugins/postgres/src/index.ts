import {
  ClientWrapper,
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  PluginExecutionProps,
  PostgresActionConfiguration,
  PostgresDatasourceConfiguration,
  RawRequest,
  Schema,
  SqlOperations,
  SQLQueryEnum,
  Table,
  TableType
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { Client, Notification } from 'pg';
import { Client as ssh2Client } from 'ssh2';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SET_SEARCH_PATH, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 20000;

export default class PostgresPlugin extends DatabasePluginPooled<ClientWrapper<Client, ssh2Client>, PostgresDatasourceConfiguration> {
  pluginName = 'Postgres';
  protected readonly parameterType = '$';
  protected readonly columnEscapeCharacter = '"';
  protected readonly sqlSingleTableMetadata = SQL_SINGLE_TABLE_METADATA;
  protected readonly sqlQueryMap: Record<SQLQueryEnum, string> = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: PRIMARY_KEY_QUERY,
    [SQLQueryEnum.SQL_SCHEMA]: DEFAULT_SCHEMA_QUERY,
    [SQLQueryEnum.SQL_SEARCH_PATH]: SET_SEARCH_PATH,
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };
  protected readonly caseSensitivityWrapCharacter = '"';

  public async executePooled(
    props: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SqlOperations.UPDATE_ROWS: {
        // make sure schema is set
        let result;
        if (!props.actionConfiguration.schema) {
          result = await this.executeQuery(() => {
            return client.client.query(DEFAULT_SCHEMA_QUERY);
          });
          if (result.rows.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
          }
          props.actionConfiguration.schema = result.rows[0].current_schema;
        }
        // validation
        this._validateActionConfigurationForUpdate(props.actionConfiguration);
        await this.executeUpdate(props, client);
        return;
      }
      default: {
        // Includes undefined & run_sql modes
        await this.executeSql(props, client);
        return;
      }
    }
  }

  private async executeSql(
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<void> {
    const query = actionConfiguration.body;
    if (isEmpty(query)) {
      return;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.client.query(query, context.preparedStatementContext);
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    mutableOutput.output = normalizeTableColumnNames(rows.rows);
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<void> {
    if (actionConfiguration.useAdvancedMatching === 'advanced') {
      await this._executeUpdateRowsByCols({ mutableOutput, actionConfiguration }, async (...args) => {
        return (await client.client.query(...args))?.rows;
      });
    } else {
      // pg_catalog is the fastest way to get table info in Postgres
      // https://dba.stackexchange.com/questions/302587/what-is-faster-pg-catalog-or-information-schema
      await this._executeUpdateRowsPrimary({ mutableOutput, actionConfiguration, primaryKeyQuery: PRIMARY_KEY_QUERY }, async (...args) => {
        return (await client.client.query(...args))?.rows;
      });
    }
  }

  public getRequest(actionConfiguration: PostgresActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SqlOperations.UPDATE_ROWS) {
      return undefined;
    }
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body', 'oldValues', 'insertedRows', 'newValues', 'deletedRows'];
  }

  public async metadata(datasourceConfiguration: PostgresDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
    try {
      // set search path
      try {
        await this.executeQuery(async () => {
          return client.client.query(SET_SEARCH_PATH);
        });
      } catch (err) {
        // don't have access to mutable output here so just log
        console.warn(`Failed to set search path: ${err.message}`);
      }
      // table
      const tableResult = await this.executeQuery(async () => {
        return client.client.query(TABLE_QUERY);
      });
      const tables = tableResult.rows.reduce((acc, attribute) => {
        const entityName = attribute['table_name'];
        const entitySchema = attribute['schema_name'];
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [...columns, new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name))];
          return [...acc];
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));

        return [...acc, table];
      }, []);
      const schemaNames = new Set();
      const schemas = tableResult.rows.reduce((acc, attribute) => {
        const entityName = attribute['schema_name'];
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, []);

      // keys
      const keysResult = await this.executeQuery(async () => {
        return client.client.query(KEYS_QUERY);
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
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
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
    datasourceConfiguration: PostgresDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<ClientWrapper<Client, ssh2Client>> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    let client: Client | null = null;
    let tunnel: ssh2Client | null = null;

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
          throw new IntegrationError(`Endpoint not specified for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!auth) {
          throw new IntegrationError(
            `Authentication not specified for ${this.pluginName} step`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            {
              pluginName: this.pluginName
            }
          );
        }
        if (!auth.custom?.databaseName?.value) {
          throw new IntegrationError(`Database not specified for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        // The final endpoint might actually be overwritten by an SSH tunnel.
        const finalEndpoint = {
          host: datasourceConfiguration.endpoint?.host,
          port: datasourceConfiguration.endpoint?.port
        };
        if (datasourceConfiguration.tunnel && datasourceConfiguration.tunnel.enabled) {
          try {
            const tunneledAddress = await super.createTunnel(datasourceConfiguration);
            finalEndpoint.host = tunneledAddress?.host;
            finalEndpoint.port = tunneledAddress?.port;
            tunnel = tunneledAddress?.client;
          } catch (e) {
            throw new IntegrationError(`SSH tunnel connection failed for ${this.pluginName}: ${e.message}`, e.code, {
              pluginName: this.pluginName
            });
          }
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
          host: finalEndpoint?.host,
          port: finalEndpoint?.port,
          user: auth.username,
          password: auth.password,
          database: auth.custom.databaseName.value,
          ssl: ssl_config,
          connectionTimeoutMillis: connectionTimeoutMillis
        });
        this.attachLoggerToClient(client, datasourceConfiguration);

        this.logger.debug(
          `Connecting to postgres, host: ${finalEndpoint?.host}, port: ${finalEndpoint?.port}, username: ${auth?.username}, database: ${auth?.custom?.databaseName?.value}, sslEnabled: ${datasourceConfiguration?.connection?.useSsl}`
        );
        break;
      }
    }

    await client.connect();
    this.logger.debug(`Postgres client connected. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`);
    return { client, tunnel };
  }

  @DestroyConnection
  protected async destroyConnection(client: ClientWrapper<Client, ssh2Client>): Promise<void> {
    await client.client.end();
    client.tunnel?.end();
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: PostgresDatasourceConfiguration) {
    if (!datasourceConfiguration.endpoint) {
      return;
    }

    const datasourceEndpoint = `${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`Postgres client error. ${datasourceEndpoint} ${err.stack}`);
    });

    client.on('end', () => {
      this.logger.debug(`Postgres client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`Postgres notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`Postgres notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: PostgresDatasourceConfiguration): Promise<void> {
    let client: ClientWrapper<Client, ssh2Client> | null = null;
    try {
      try {
        client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      } catch (err) {
        throw new IntegrationError(`Test connection failed: ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
          pluginName: this.pluginName
        });
      }

      await this.executeQuery(() => {
        return client?.client.query('SELECT NOW()');
      });
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Test connection failed: ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
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
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key in errorMap) {
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
