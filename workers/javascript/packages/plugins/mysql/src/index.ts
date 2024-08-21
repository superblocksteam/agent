import {
  ClientWrapper,
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DBActionConfiguration,
  DestroyConnection,
  ErrorCode,
  IntegrationError,
  Key,
  MySQLActionConfiguration,
  MySQLDatasourceConfiguration,
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
// We are using the mariadb module because it has performance
// and feature benefits over the mysql module, and has full compatibility
// with MySQL databases
import { Connection, createConnection } from 'mariadb';
import { Client as ssh2Client } from 'ssh2';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;

// docker run -d --publish 0.0.0.0:3306:3306 --env MYSQL_ROOT_PASSWORD=password  mysql:latest

export default class MySQLPlugin extends DatabasePluginPooled<ClientWrapper<Connection, ssh2Client>, MySQLDatasourceConfiguration> {
  pluginName = 'MySQL';
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
    props: PluginExecutionProps<MySQLDatasourceConfiguration, MySQLActionConfiguration>,
    client: ClientWrapper<Connection, ssh2Client>
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SqlOperations.UPDATE_ROWS: {
        let result;
        if (!props.actionConfiguration.schema) {
          // make sure schema is set
          result = await this.executeQuery(() => {
            return client.client.query(DEFAULT_SCHEMA_QUERY);
          });
          if (result.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
          }
          props.actionConfiguration.schema = result[0]['database()'];
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
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<MySQLDatasourceConfiguration, MySQLActionConfiguration>,
    client: ClientWrapper<Connection, ssh2Client>
  ): Promise<void> {
    const query = actionConfiguration.body;
    if (!query || isEmpty(query)) {
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
    mutableOutput.output = normalizeTableColumnNames(rows);
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<MySQLDatasourceConfiguration, MySQLActionConfiguration>,
    client: ClientWrapper<Connection, ssh2Client>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.useAdvancedMatching === 'advanced') {
      await this._executeUpdateRowsByCols({ mutableOutput, actionConfiguration }, client.client.query);
    } else {
      await this._executeUpdateRowsPrimary(
        { mutableOutput, actionConfiguration, primaryKeyQuery: PRIMARY_KEY_QUERY, separateSchemaAndTableInPrimaryKeyQuery: true },
        client.client.query
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

  public async metadata(datasourceConfiguration: MySQLDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const connection = await this.createConnection(datasourceConfiguration);

    try {
      const tableResult = await this.executeQuery(() => {
        return connection.client.query(TABLE_QUERY);
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
        const entityName = attribute['schema_name'];
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, []);

      const keysResult: Array<{ table_name: string; column_name: string }> = await this.executeQuery(() => {
        return connection.client.query(KEYS_QUERY);
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
      throw this._handleError(err, 'Metadata query failed');
    } finally {
      if (connection) {
        this.destroyConnection(connection).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @DestroyConnection
  protected async destroyConnection(connection: ClientWrapper<Connection, ssh2Client>): Promise<void> {
    await connection.client.end();
    connection.tunnel?.end();
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: MySQLDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<ClientWrapper<Connection, ssh2Client>> {
    let tunnel: ssh2Client | null = null;
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    try {
      let connection: Connection;
      switch (datasourceConfiguration.connectionType) {
        case 'url': {
          if (!datasourceConfiguration.connectionUrl) {
            throw new IntegrationError('Expected to receive connection url for connection type url');
          }

          // We use mariadb parser, so we need to replace mysql:// to mariadb://
          const connectionUrl = new URL(datasourceConfiguration.connectionUrl.replace(/^mysql/, 'mariadb'));
          connectionUrl.searchParams.set('allowPublicKeyRetrieval', 'true');
          connection = await createConnection(connectionUrl.toString());
          break;
        }
        default: {
          datasourceConfiguration.connectionType;
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
              ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
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

          connection = await createConnection({
            host: finalEndpoint?.host,
            user: auth.username,
            password: auth.password,
            database: auth.custom.databaseName.value,
            port: finalEndpoint?.port,
            ssl: datasourceConfiguration.connection?.useSsl ? { rejectUnauthorized: false } : false,
            connectTimeout: connectionTimeoutMillis,
            allowPublicKeyRetrieval: !(datasourceConfiguration.connection?.useSsl ?? false),
            dateStrings: true // needed to get an accurate representation of dates/datetime/timestamp values
          });
        }
      }
      this.attachLoggerToConnection(connection, datasourceConfiguration);
      this.logger.debug(
        `${this.pluginName} connection created. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`
      );
      return { client: connection, tunnel };
    } catch (err) {
      throw this._handleError(err, 'Connection failed');
    }
  }

  private attachLoggerToConnection(connection: Connection, datasourceConfiguration: MySQLDatasourceConfiguration) {
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

  public async test(datasourceConfiguration: MySQLDatasourceConfiguration): Promise<void> {
    const connection = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
    try {
      await this.executeQuery(() => {
        return connection.client.query('SELECT NOW()');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    } finally {
      if (connection) {
        this.destroyConnection(connection).catch(() => {
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

    // TODO (jason4012) include more error codes. Also dedup code from mariadb
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

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, { code: errno, pluginName: this.pluginName, stack: error.stack });
  }
}
