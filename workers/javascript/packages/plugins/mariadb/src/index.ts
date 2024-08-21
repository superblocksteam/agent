import {
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DBActionConfiguration,
  DestroyConnection,
  ErrorCode,
  IntegrationError,
  Key,
  MariaDBActionConfiguration,
  MariaDBDatasourceConfiguration,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Schema,
  SqlOperations,
  SQLQueryEnum,
  Table,
  TableType
} from '@superblocks/shared';
import { groupBy, isEmpty } from 'lodash';
import { Connection, createConnection } from 'mariadb';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;

// docker run --publish 0.0.0.0:3306:3306 --env MARIADB_USER=example-user --env MARIADB_PASSWORD=password --env MARIADB_ROOT_PASSWORD=password  mariadb:latest

export default class MariaDBPlugin extends DatabasePluginPooled<Connection, MariaDBDatasourceConfiguration> {
  pluginName = 'MariaDB';
  protected readonly parameterType = '?';
  protected readonly columnEscapeCharacter = '`';
  protected readonly tableAnalyzePrefix = `ANALYZE TABLE`;
  protected readonly useSqlUpdateFromStatement = false;
  protected readonly sqlSingleTableMetadata = SQL_SINGLE_TABLE_METADATA;
  protected readonly sqlQueryMap: Record<SQLQueryEnum, string> = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: PRIMARY_KEY_QUERY,
    [SQLQueryEnum.SQL_SCHEMA]: DEFAULT_SCHEMA_QUERY,
    [SQLQueryEnum.SQL_SEARCH_PATH]: '',
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };

  public async executePooled(
    props: PluginExecutionProps<MariaDBDatasourceConfiguration, MariaDBActionConfiguration>,
    client: Connection
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SqlOperations.UPDATE_ROWS: {
        // make sure schema is set
        let result;
        if (!props.actionConfiguration.schema) {
          result = await this.executeQuery(() => {
            return client.query(DEFAULT_SCHEMA_QUERY);
          });
          if (result.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
          }
          props.actionConfiguration.schema = result[0].current_schema;
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
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<MariaDBDatasourceConfiguration, MariaDBActionConfiguration>,
    client: Connection
  ): Promise<void> {
    const query = actionConfiguration.body;
    if (!query || isEmpty(query)) {
      return;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.query(query, context.preparedStatementContext);
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    mutableOutput.output = normalizeTableColumnNames(rows);
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<MariaDBDatasourceConfiguration, MariaDBActionConfiguration>,
    client: Connection
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError('Query failed, table was empty', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    if (actionConfiguration.useAdvancedMatching === 'advanced') {
      await this._executeUpdateRowsByCols({ mutableOutput, actionConfiguration }, client.query);
    } else {
      await this._executeUpdateRowsPrimary(
        { mutableOutput, actionConfiguration, primaryKeyQuery: PRIMARY_KEY_QUERY, separateSchemaAndTableInPrimaryKeyQuery: true },
        client.query
      );
    }
  }

  getRequest(actionConfiguration: DBActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SqlOperations.UPDATE_ROWS) {
      return undefined;
    }
    return actionConfiguration?.body;
  }

  dynamicProperties(): string[] {
    return ['body', 'oldValues', 'insertedRows', 'newValues', 'deletedRows'];
  }

  async metadata(datasourceConfiguration: MariaDBDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const connection = await this.createConnection(datasourceConfiguration);
    try {
      const tableResult = await this.executeQuery(() => {
        return connection.query(TABLE_QUERY);
      });

      const tables = tableResult.reduce((acc, attribute) => {
        const entityName = attribute.table_name;
        const entitySchema = attribute.schema_name;
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [...columns, new Column(attribute.name, attribute.column_type)];
          return [...acc];
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.name, attribute.column_type));

        return [...acc, table];
      }, []);

      const schemaNames = new Set();
      const schemas = tableResult.reduce((acc, attribute) => {
        const entityName = attribute.schema_name;
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, []);

      const keysResult: Array<{ table_name: string; column_name: string }> = await this.executeQuery(() => {
        return connection.query(KEYS_QUERY);
      });

      const compoundKeys = groupBy(keysResult, (row) => row.table_name);
      Object.keys(compoundKeys).forEach((key) => {
        const table = tables.find((e) => e.name === key);
        if (table) {
          table.keys.push({
            name: key,
            type: 'primary key',
            columns: compoundKeys[key].map((row) => row.column_name)
          } as Key);
        }
      });

      return {
        dbSchema: { tables, schemas }
      };
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    } finally {
      if (connection) {
        this.destroyConnection(connection).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @DestroyConnection
  protected async destroyConnection(connection: Connection): Promise<void> {
    await connection.end();
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: MariaDBDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<Connection> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    let connection: Connection;

    switch (datasourceConfiguration.connectionType) {
      case 'url': {
        if (!datasourceConfiguration.connectionUrl) {
          throw new IntegrationError('Expected to receive connection url for connection type url');
        }
        try {
          connection = await createConnection(datasourceConfiguration.connectionUrl);
        } catch (err) {
          throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
            pluginName: this.pluginName
          });
        }
        break;
      }
      default: {
        try {
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
              { pluginName: this.pluginName }
            );
          }
          if (!auth.custom?.databaseName?.value) {
            throw new IntegrationError(`Database not specified for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          connection = await createConnection({
            host: endpoint.host,
            user: auth.username,
            password: auth.password,
            database: auth.custom.databaseName.value,
            port: endpoint.port,
            ssl: datasourceConfiguration.connection?.useSsl ? { rejectUnauthorized: false } : false,
            connectTimeout: connectionTimeoutMillis,
            allowPublicKeyRetrieval: !(datasourceConfiguration.connection?.useSsl ?? false),
            dateStrings: true // needed to get an accurate representation of dates/datetime/timestamp values
          });
          this.attachLoggerToConnection(connection, datasourceConfiguration);

          this.logger.debug(
            `${this.pluginName} connection created. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`
          );
        } catch (err) {
          throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
            pluginName: this.pluginName
          });
        }
        break;
      }
    }

    return connection;
  }

  private attachLoggerToConnection(connection: Connection, datasourceConfiguration: MariaDBDatasourceConfiguration) {
    if (!datasourceConfiguration.endpoint) {
      return;
    }

    const datasourceEndpoint = `${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`;

    connection.on('error', (err: Error) => {
      this.logger.debug(`${this.pluginName} connection error. ${datasourceEndpoint}`, err.stack);
    });

    connection.on('end', () => {
      this.logger.debug(`${this.pluginName} connection ended. ${datasourceEndpoint}`);
    });
  }

  async test(datasourceConfiguration: MariaDBDatasourceConfiguration): Promise<void> {
    let connection;
    try {
      connection = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    }
    try {
      await this.executeQuery(() => {
        return connection.query('SELECT NOW()');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    } finally {
      if (connection) {
        this.destroyConnection(connection).catch(() => {
          // Error handling is done in the destroy connection decorator
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

    // DEFER (jason4012) include more error codes
    // current set taken from https://ottomatik.io/post/understanding-common-mysql-errors
    // and https://planetscale.com/blog/common-mysql-errors-how-to-fix-them
    const authCodes: number[] = [1045];
    const syntaxCodes: number[] = [1064, 1146];
    const networkCodes: number[] = [1040, 2006, 2008, 2013];

    const errno = (error as { errno?: number })?.errno ?? 0;
    if (authCodes.includes(errno)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
    } else if (syntaxCodes.includes(errno)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (networkCodes.includes(errno)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { errno?: number })?.errno,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
