import { DBSQLClient } from '@databricks/sql';
import { ExecuteStatementOptions } from '@databricks/sql/dist/contracts/IDBSQLSession';
import {
  Column,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CreateConnection,
  DatabasePluginPooled,
  DatabricksActionConfiguration,
  DatabricksDatasourceConfiguration,
  DatasourceMetadataDto,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DestroyConnection,
  ErrorCode,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Schema,
  SQLOperationEnum,
  SqlOperations,
  SQLQueryEnum,
  Table,
  TableType
} from '@superblocks/shared';

import { isEmpty, merge } from 'lodash';
import { KEYS_QUERY, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';
import { getConnectionOptionsFromDatasourceConfiguration } from './utils';

const TEST_CONNECTION_TIMEOUT_MS = 5000;

interface KeyQueryEntity {
  column_name: string;
  constraint_name: string;
  constraint_type: string;
  database_name?: string;
  schema_name: string;
  table_name: string;
}
interface TableQueryEntity {
  column_name: string;
  column_type: string;
  database_name?: string;
  schema_name: string;
  table_name: string;
}

export default class DatabricksPlugin extends DatabasePluginPooled<DBSQLClient, DatabricksDatasourceConfiguration> {
  // This is a NON SECRET id that identifies Superblocks to Databricks for partnership purposes.
  private readonly DATABRICKS_PARTNER_CLIENT_ID = 'Superblocks';
  pluginName = 'Databricks';
  protected readonly parameterType = ':PARAM';
  protected readonly columnEscapeCharacter = '`';
  protected readonly sqlSingleTableMetadata = SQL_SINGLE_TABLE_METADATA;
  protected readonly sqlQueryMap: Record<SQLQueryEnum, string> = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: '',
    [SQLQueryEnum.SQL_SCHEMA]: '',
    [SQLQueryEnum.SQL_SEARCH_PATH]: '',
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };
  protected readonly caseSensitivityWrapCharacter = '`';

  private connectionTimeoutMillis = TEST_CONNECTION_TIMEOUT_MS;

  public async executePooled(
    props: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration>,
    client: DBSQLClient
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS: {
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
    {
      context,
      datasourceConfiguration,
      actionConfiguration,
      mutableOutput
    }: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration>,
    client: DBSQLClient
  ): Promise<void> {
    const query = actionConfiguration.runSql?.sqlBody;
    if (isEmpty(query)) {
      return;
    }
    let rows;
    const namedParameters = merge(
      {},
      ...context.preparedStatementContext.map((param, ind) => {
        return { [`PARAM_${ind + 1}`]: param };
      })
    );
    try {
      rows = await this.executeQuery(() => {
        return this._executeStatement(client, datasourceConfiguration, query as string, {
          namedParameters
        });
      });
    } catch (err) {
      throw this._handleError(err, 'SQL query failed');
    }
    mutableOutput.output = normalizeTableColumnNames(rows);
  }

  public getRequest(actionConfiguration: DatabricksActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SQLOperationEnum[SqlOperations.UPDATE_ROWS]) {
      return undefined;
    }
    return actionConfiguration?.runSql?.sqlBody;
  }

  public dynamicProperties(): string[] {
    return ['runSql.sqlBody', 'bulkEdit.oldRows', 'bulkEdit.insertedRows', 'bulkEdit.updatedRows', 'bulkEdit.deletedRows'];
  }

  public async metadata(datasourceConfiguration: DatabricksDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    try {
      const client = await this.createConnection(datasourceConfiguration);
      const tableResult = (
        await this.executeQuery(async () => {
          return this._executeStatement(client, datasourceConfiguration, TABLE_QUERY);
        })
      ).map((row: unknown) => row as TableQueryEntity);

      const tables = (tableResult as TableQueryEntity[]).reduce((acc, attribute) => {
        const entityName = `${attribute.schema_name}.${attribute.table_name}`;
        const entitySchema = attribute.database_name;
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [...columns, new Column(attribute.column_name, attribute.column_type, this.escapeAsCol(attribute.column_name))];
          return [...acc];
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.column_name, attribute.column_type, this.escapeAsCol(attribute.column_name)));

        return [...acc, table];
      }, [] as Table[]);
      const schemaNames = new Set();
      const schemas = (tableResult as TableQueryEntity[]).reduce((acc, attribute) => {
        const entityName = attribute.database_name ?? '';
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, [] as Schema[]);

      // keys
      const keysResult = (
        await this.executeQuery(async () => {
          return this._executeStatement(client, datasourceConfiguration, KEYS_QUERY);
        })
      ).map((row: unknown) => row as KeyQueryEntity);

      // TODO(jason4012) this doesn't handle foreign keys correctly yet
      const compoundKeys: Record<string, { name: string; type: string; columns: string[] }> = {};
      (keysResult as KeyQueryEntity[]).forEach((keysResult: KeyQueryEntity) => {
        const schemaAndTableName = `${keysResult.schema_name ?? ''}.${keysResult.table_name}`;
        if (!(schemaAndTableName in compoundKeys)) {
          compoundKeys[schemaAndTableName] = {
            name: schemaAndTableName,
            type: 'primary key',
            columns: []
          };
        }
        compoundKeys[schemaAndTableName].columns.push(keysResult.column_name);
      });

      Object.keys(compoundKeys).forEach((key) => {
        const table = tables.find((e) => e.name === key);
        if (table) {
          if (!table.keys) {
            table.keys = [];
          }
          table.keys.push(compoundKeys[key] as Key);
        }
      });
      return {
        dbSchema: { tables, schemas }
      };
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    }
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: DatabricksDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<DBSQLClient> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    this.connectionTimeoutMillis = connectionTimeoutMillis;
    // TODO(jason4012) we decided not to use pools for now as the connection is being persisted across connections for each worker
    const client = new DBSQLClient();
    client.on('error', (error) => {
      console.log('Caught error at connect: ', error.message);
    });

    const connectionOptions = getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration);
    await client.connect(connectionOptions);

    this.logger.debug(`Databricks client connected. ${datasourceConfiguration.connection?.hostUrl}`);
    return client;
  }

  @DestroyConnection
  protected async destroyConnection(client: DBSQLClient): Promise<void> {
    try {
      await client.close();
    } catch (err) {
      throw new IntegrationError(`Failed to close connection to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    }
  }

  public async test(datasourceConfiguration: DatabricksDatasourceConfiguration): Promise<void> {
    // wrap the entire test in a timeout
    const testTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`IntegrationTimeoutError: Failed to connect to warehouse. Connection timeout after ${TEST_CONNECTION_TIMEOUT_MS}ms`)
        );
      }, TEST_CONNECTION_TIMEOUT_MS);
    });

    const testExecution = async () => {
      let client: DBSQLClient | null = null;
      try {
        client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT_MS);

        await this.executeQuery(() => {
          return this._executeStatement(client as DBSQLClient, datasourceConfiguration, 'SELECT 1;', {
            queryTimeout: TEST_CONNECTION_TIMEOUT_MS
          });
        });
      } catch (err) {
        throw this._handleError(err, `Test ${this.pluginName} connection failed`);
      } finally {
        if (client) {
          await client.close();
        }
      }
    };

    await Promise.race([testExecution(), testTimeout]);
  }

  private async _executeStatement(
    client: DBSQLClient,
    datasourceConfiguration: DatabricksDatasourceConfiguration,
    statement: string,
    args?: ExecuteStatementOptions
  ): Promise<Record<string, unknown>[]> {
    // TODO (jason4012) investigate whether we need to open a session per query, or whether we can persist it for the connection (timeouts?)
    const sessionArgs: { initialCatalog?: string; initialSchema?: string } = {};
    if (!isEmpty(datasourceConfiguration.connection?.defaultCatalog)) {
      sessionArgs.initialCatalog = datasourceConfiguration.connection?.defaultCatalog;
    }
    if (!isEmpty(datasourceConfiguration.connection?.defaultSchema)) {
      sessionArgs.initialSchema = datasourceConfiguration.connection?.defaultSchema;
    }
    const session = await client.openSession(sessionArgs);
    let result: Record<string, unknown>[] = [];
    try {
      if (isEmpty(args)) {
        args = {} as ExecuteStatementOptions;
      }
      args.queryTimeout = this.connectionTimeoutMillis;

      const queryOperation = await session.executeStatement(statement, args);
      result = (await queryOperation.fetchAll()) as Record<string, unknown>[];
      await queryOperation.close();
      await session.close();
    } catch (e) {
      await session.close();
      throw this._handleError(e, 'Failed to execute statement');
    }
    return Promise.resolve(result);
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
    const errorNameMap: Record<string, ErrorCode> = {
      'Authentication Error': ErrorCode.INTEGRATION_AUTHORIZATION,
      'Parameter Error': ErrorCode.INTEGRATION_SYNTAX,
      'Hive Driver Error': ErrorCode.INTEGRATION_NETWORK
    };

    for (const key of Object.keys(errorNameMap)) {
      if (error.name === key) {
        return new IntegrationError(message, errorNameMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as unknown as { code: number }).code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
