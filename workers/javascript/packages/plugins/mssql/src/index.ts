import {
  ActionConfigurationResolutionContext,
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DBActionConfiguration,
  DestroyConnection,
  ErrorCode,
  extractMustacheStrings,
  IntegrationError,
  Key,
  MsSqlActionConfiguration,
  MsSqlDatasourceConfiguration,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  renderValue,
  ResolveActionConfigurationProperty,
  resolveAllBindings,
  ResolvedActionConfigurationProperty,
  Schema,
  SqlOperations,
  SQLQueryEnum,
  Table,
  TableType
} from '@superblocks/shared';
import { groupBy, isEmpty } from 'lodash';
import mssql, { ConnectionPool } from 'mssql';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';

export default class MicrosoftSQLPlugin extends DatabasePluginPooled<ConnectionPool, MsSqlDatasourceConfiguration> {
  pluginName = 'Microsoft SQL';
  protected readonly parameterType = '@';
  protected readonly columnEscapeCharacter = '[]';
  protected readonly tableAnalyzePrefix: string = `UPDATE STATISTICS`;
  protected readonly sqlSingleTableMetadata = SQL_SINGLE_TABLE_METADATA;
  protected readonly sqlQueryMap: Record<SQLQueryEnum, string> = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: PRIMARY_KEY_QUERY,
    [SQLQueryEnum.SQL_SCHEMA]: DEFAULT_SCHEMA_QUERY,
    [SQLQueryEnum.SQL_SEARCH_PATH]: '',
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };
  protected readonly stringDataTypes = ['varchar', 'nvarchar'];
  protected readonly scaleAndPrecisionDataTypes = ['numeric', 'decimal'];

  protected readonly skipTransaction = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ResolveActionConfigurationProperty
  public async resolveActionConfigurationProperty(
    resolutionContext: ActionConfigurationResolutionContext
  ): Promise<ResolvedActionConfigurationProperty> {
    if (
      !('usePreparedSql' in resolutionContext.actionConfiguration) ||
      !resolutionContext.actionConfiguration.usePreparedSql ||
      resolutionContext.property !== 'body'
    ) {
      return super.resolveActionConfigurationProperty(resolutionContext);
    }
    const propertyToResolve = resolutionContext.actionConfiguration[resolutionContext.property] ?? '';
    const bindingResolution = {};
    const bindingResolutions = await resolveAllBindings(
      propertyToResolve,
      resolutionContext.context,
      resolutionContext.files ?? {},
      resolutionContext.escapeStrings
    );
    resolutionContext.context.preparedStatementContext = [];
    let bindingCount = 1;
    for (const toEval of extractMustacheStrings(propertyToResolve)) {
      bindingResolution[toEval] = `@PARAM_${bindingCount++}`;
      resolutionContext.context.preparedStatementContext.push(bindingResolutions[toEval]);
    }
    return { resolved: renderValue(propertyToResolve, bindingResolution) };
  }

  public init(): void {
    // @ts-ignore
    mssql.on('error', (err) => {
      this.logger.error(`${this.pluginName} connection errored: ${err}`);
    });
  }

  public async executePooled(
    props: PluginExecutionProps<MsSqlDatasourceConfiguration, MsSqlActionConfiguration>,
    conn: ConnectionPool
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SqlOperations.UPDATE_ROWS: {
        // make sure schema is set
        let result;
        if (!props.actionConfiguration.schema) {
          result = await this.executeQuery(() => {
            return conn.query(DEFAULT_SCHEMA_QUERY);
          });
          if (result.recordset.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
          }
          props.actionConfiguration.schema = result.recordset[0].current_schema;
        }
        // validation
        this._validateActionConfigurationForUpdate(props.actionConfiguration);
        await this.executeUpdate(props, conn);
        return;
      }
      default: {
        // Includes undefined & run_sql modes
        await this.executeSql(props, conn);
        return;
      }
    }
  }

  private async executeSql(
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<MsSqlDatasourceConfiguration, MsSqlActionConfiguration>,
    conn: ConnectionPool
  ): Promise<void> {
    const query = actionConfiguration.body;
    if (!query || isEmpty(query)) {
      return;
    }
    let paramCount = 1;
    let result;
    try {
      result = await this.executeQuery(async () => {
        let request = conn.request();
        for (const param of context.preparedStatementContext) {
          request = request.input(`PARAM_${paramCount++}`, param);
        }
        return request.query(query);
      });
      mutableOutput.output = normalizeTableColumnNames(result.recordset);
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
  }

  private _getMaxLengthString(row: { max_length: number; data_type: string }): string {
    let max_length = row.max_length.toString();
    if (row.data_type === 'nvarchar') {
      // max_length stores the length in bytes. The following line
      // specifies the length in characters. For nvarchar we need to
      // divide by 2 since there are 2 bytes per character.
      max_length = Math.ceil(row.max_length / 2).toString();
    }
    if (row.max_length === -1) {
      max_length = 'MAX';
    }
    return max_length;
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<MsSqlDatasourceConfiguration, MsSqlActionConfiguration>,
    conn: ConnectionPool
  ): Promise<void> {
    const transaction = new mssql.Transaction(conn);
    await transaction.begin();
    if (actionConfiguration.useAdvancedMatching === 'advanced') {
      await this._executeUpdateRowsByCols({ mutableOutput, actionConfiguration }, async (query, params) => {
        let request = transaction.request();
        let paramCount = 1;
        for (const param of params ?? []) {
          request = request.input(`PARAM_${paramCount++}`, param);
        }
        const result = await request.query(query);

        if (query === this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]) {
          // SQL server defaults to varchar(1) & numeric(1) which results in "String or binary data would be truncated in table"
          // so we have to have special mappings to override
          return (result?.recordset ?? []).map((row) => {
            if (this.stringDataTypes.includes(row.data_type)) {
              return {
                ...row,
                data_type: `${row.data_type}(${this._getMaxLengthString(row)})`
              };
            }
            if (this.scaleAndPrecisionDataTypes.includes(row.data_type)) {
              return {
                ...row,
                data_type: `${row.data_type}(${row.precision},${row.scale})`
              };
            }
            return row;
          });
        }
        return result?.recordset ?? [];
      });
    } else {
      await this._executeUpdateRowsPrimary(
        { mutableOutput, actionConfiguration, primaryKeyQuery: PRIMARY_KEY_QUERY, separateSchemaAndTableInPrimaryKeyQuery: true },
        async (query, params) => {
          let request = transaction.request();
          let paramCount = 1;
          for (const param of params ?? []) {
            request = request.input(`PARAM_${paramCount++}`, param);
          }
          const result = await request.query(query);

          if (query === this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA] || query === PRIMARY_KEY_QUERY) {
            // SQL server defaults to varchar(1) & numeric(1) which results in "String or binary data would be truncated in table"
            // so we have to have special mappings to override
            return result.recordset.map((row) => {
              if (this.stringDataTypes.includes(row.data_type)) {
                return {
                  ...row,
                  data_type: `${row.data_type}(${this._getMaxLengthString(row)})`
                };
              }
              // TODO: This is duplicated above.
              if (this.scaleAndPrecisionDataTypes.includes(row.data_type)) {
                return {
                  ...row,
                  data_type: `${row.data_type}(${row.precision},${row.scale})`
                };
              }
              return row;
            });
          }

          return result?.recordset ?? [];
        }
      );
    }
    // If we get here the transaction is final
    await transaction.commit();
  }

  public getRequest(actionConfiguration: DBActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SqlOperations.UPDATE_ROWS) {
      return undefined;
    }
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body', 'oldValues', 'insertedRows', 'newValues', 'deletedRows'];
  }

  @DestroyConnection
  protected async destroyConnection(connection: ConnectionPool): Promise<void> {
    await connection.close();
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: MsSqlDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<ConnectionPool> {
    let connPool: mssql.ConnectionPool;
    switch (datasourceConfiguration.connectionType) {
      case 'url': {
        if (!datasourceConfiguration.connectionUrl) {
          throw new IntegrationError('Expected to receive connection url for connection type url');
        }
        connPool = new mssql.ConnectionPool(datasourceConfiguration.connectionUrl);
        break;
      }
      default: {
        // we default to "fields" for backwards compatibility
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
        connPool = new mssql.ConnectionPool({
          user: auth.username,
          password: auth.password,
          database: auth.custom.databaseName.value,
          server: endpoint.host ?? '',
          port: Number(endpoint.port),
          requestTimeout: connectionTimeoutMillis,
          options: {
            trustServerCertificate: true,
            encrypt: datasourceConfiguration.connection?.useSsl ? true : false,
            // For users to debug queries they issue
            appName: 'Superblocks',
            // Sets the XACT_ABORT flag on the connection
            abortTransactionOnError: true
          }
        } as mssql.config);
        break;
      }
    }
    try {
      await connPool.connect();
      return connPool;
    } catch (err) {
      throw this._handleError(err, 'Connection failure');
    }
  }

  public async metadata(datasourceConfiguration: MsSqlDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const conn = await this.createConnection(datasourceConfiguration);
    const tables: Array<Table> = [];
    const tablesMap: Record<string, Table> = {};
    let resp;
    try {
      resp = await this.executeQuery(() => {
        return conn.query(TABLE_QUERY);
      });

      for (const record of resp.recordset) {
        const key = `${record.table_name}.${record.table_schema}`;
        if (tablesMap[key]) {
          tablesMap[key].columns.push(new Column(record.column_name, record.data_type));
        } else {
          const table = new Table(record.table_name, TableType.TABLE, record.table_schema);
          table.columns.push(new Column(record.column_name, record.data_type));
          tablesMap[key] = table;
        }
      }

      for (const table of Object.values(tablesMap)) {
        tables.push(table);
      }

      const schemaNames = new Set();
      const schemas = resp.recordset.reduce((acc, attribute) => {
        const entityName = attribute.table_schema;
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, []);

      const keysResult: Array<{ table_name: string; column_name: string }> = await this.executeQuery(async () => {
        return (await conn.query(KEYS_QUERY))?.recordset;
      });

      const compoundKeys = groupBy(keysResult, (row) => row.table_name);
      Object.keys(compoundKeys).forEach((key) => {
        const table = tables.find((e) => e.name === key);
        if (table) {
          if (!table.keys?.length) table.keys = [];
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
      throw this._handleError(err, 'Metadata request failed');
    } finally {
      if (conn) {
        this.destroyConnection(conn).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  public async test(datasourceConfiguration: MsSqlDatasourceConfiguration): Promise<void> {
    let conn;
    try {
      conn = await this.createConnection(datasourceConfiguration);
      await this.executeQuery(() => {
        return conn.query('select name from sys.databases');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    } finally {
      if (conn) {
        this.destroyConnection(conn).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(
        `${initialMessage}: ${error.message} (code ${(error as { number?: number })?.number})`,
        (error as IntegrationError).code,
        (error as IntegrationError).internalCode
      );
    }

    const message = `${initialMessage}: ${error.message} (code ${(error as { number?: number })?.number})`;

    // TODO (jason4012) map these out in a more detailed fashion using error.number
    // based off https://github.com/tediousjs/node-mssql/blob/master/README.md#execute-procedure-callback
    const errorCodeMap: Record<string, ErrorCode> = {
      EREQUEST: ErrorCode.INTEGRATION_SYNTAX,
      ECANCEL: ErrorCode.INTEGRATION_USER_CANCELLED,
      ETIMEOUT: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
      ENOCONN: ErrorCode.INTEGRATION_NETWORK,
      ENOTOPEN: ErrorCode.INTEGRATION_NETWORK,
      ECONNCLOSED: ErrorCode.INTEGRATION_NETWORK,
      ENOTBEGUN: ErrorCode.INTEGRATION_NETWORK,
      EABORT: ErrorCode.INTEGRATION_USER_CANCELLED
    };

    for (const key of Object.keys(errorCodeMap)) {
      if ((error as { code?: string })?.code === key) {
        return new IntegrationError(message, errorCodeMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { code?: string })?.code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }

  // This function is mocked for testing since it relies on dates. The use of dates is because
  // using an existing table name can throw errors, especially if we're using the same DB connection
  getTempTableName(): string {
    // The # character indicates "local temporary table" which is cleared after the query
    // Double ## indicates "global temporary table" which is cleared after the entire session is done
    return `##sbwritetable${+new Date()}`;
  }
}
