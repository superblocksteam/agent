import {
  Column,
  CreateConnectionSQL,
  DatasourceMetadataDto,
  DestroyConnectionSQL,
  ErrorCode,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  OracleDbActionConfiguration,
  OracleDbDatasourceConfiguration,
  PluginExecutionProps,
  RawRequest,
  Schema,
  SQLDatabasePluginPooled,
  SQLMatchingModeEnum,
  SQLOperationEnum,
  Table,
  TableType
} from '@superblocks/shared';

import { isEmpty } from 'lodash';
import OracleDB, { BindParameters } from 'oracledb';
import { OracleDbBulkEditProvider } from './bulkEdit';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;
const MAX_ROWS = 0;

interface KeyQueryEntity {
  column_name: string;
  constraint_name: string;
  constraint_type: string;
  schema_name: string;
  table_name: string;
}
interface TableQueryEntity {
  column_name: string;
  column_type: string;
  schema_name: string;
  table_name: string;
}

export default class OracleDbPlugin extends SQLDatabasePluginPooled<OracleDB.Connection, OracleDbDatasourceConfiguration> {
  parameterType = ':' as const;
  pluginName = 'OracleDB';
  protected readonly provider = new OracleDbBulkEditProvider({
    parameterType: this.parameterType
  });

  public async executePooled(
    props: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration>,
    client: OracleDB.Connection
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS: {
        // make sure schema is set
        let result;
        if (!props.actionConfiguration.bulkEdit?.schema) {
          result = await this.executeQuery(() => {
            return client.execute(DEFAULT_SCHEMA_QUERY, [], { maxRows: MAX_ROWS, outFormat: OracleDB.OUT_FORMAT_OBJECT, autoCommit: true });
          });
          if (result.rows.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (props.actionConfiguration.bulkEdit) {
            props.actionConfiguration.bulkEdit.schema = result.rows[0].current_schema;
          }
        }
        // validation
        this._validateSQLActionConfigurationForUpdate(props.actionConfiguration);
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
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration>,
    client: OracleDB.Connection
  ): Promise<void> {
    const query = actionConfiguration.runSql?.sqlBody;
    if (isEmpty(query)) {
      return;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.execute(query as string, context.preparedStatementContext, {
          maxRows: MAX_ROWS,
          outFormat: OracleDB.OUT_FORMAT_OBJECT,
          autoCommit: true
        });
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    mutableOutput.output = normalizeTableColumnNames(rows.rows);
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration>,
    client: OracleDB.Connection
  ): Promise<void> {
    if (actionConfiguration.bulkEdit?.matchingMode === SQLMatchingModeEnum.SQL_MATCHING_MODE_ADVANCED) {
      await this.provider.executeSQLUpdateRowsByCols(
        { provider: this.provider, mutableOutput, actionConfiguration, capitalizeSchemaOrTable: true },
        this.executeQuery.bind(this),
        async (query: string, args: unknown[]) => {
          if (args == null) {
            args = [];
          }
          return (
            (await client.execute(query, args, {
              maxRows: MAX_ROWS,
              outFormat: OracleDB.OUT_FORMAT_OBJECT,
              autoCommit: true
            })) as Record<string, unknown>
          ).rows as Record<string, unknown>[];
        },
        async (query: string, args: unknown[]) => {
          if (args == null) {
            args = [];
          }
          /* eslint-disable */
          return (
            (
              // @ts-ignore
              (await client.executeMany(query, args as BindParameters[], {
                maxRows: MAX_ROWS,
                outFormat: OracleDB.OUT_FORMAT_OBJECT,
                autoCommit: true
              })) as Record<string, unknown>
            ).rows as Record<string, unknown>[]
          );
        }
      );
    } else {
      await this.provider.executeSQLUpdateRowsPrimary(
        {
          provider: this.provider,
          mutableOutput,
          actionConfiguration,
          onlyTableInPrimaryKeyQuery: true,
          capitalizeSchemaOrTable: true
        },
        async (query: string, args: unknown[]) => {
          if (args == null) {
            args = [];
          }
          return (
            (await client.execute(query, args, {
              maxRows: MAX_ROWS,
              outFormat: OracleDB.OUT_FORMAT_OBJECT,
              autoCommit: true
            })) as Record<string, unknown>
          ).rows as Record<string, unknown>[];
        },
        async (query: string, args: unknown[]) => {
          if (args == null) {
            args = [];
          }

          /* eslint-disable */
          return (
            (
              // @ts-ignore
              (await client.executeMany(query, args as BindParameters[], {
                maxRows: MAX_ROWS,
                outFormat: OracleDB.OUT_FORMAT_OBJECT,
                autoCommit: true
              })) as Record<string, unknown>
            ).rows as Record<string, unknown>[]
          );
        }
      );
    }
  }

  public getRequest(actionConfiguration: OracleDbActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS) {
      return undefined;
    }
    return actionConfiguration?.runSql?.sqlBody;
  }

  public dynamicProperties(): string[] {
    return ['runSql.sqlBody', 'bulkEdit.oldRows', 'bulkEdit.insertedRows', 'bulkEdit.updatedRows', 'bulkEdit.deletedRows'];
  }

  public async metadata(datasourceConfiguration: OracleDbDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = await this.createConnection(datasourceConfiguration);
    try {
      const tableResult = await this.executeQuery(async () => {
        return client.execute(TABLE_QUERY, [], { maxRows: MAX_ROWS, outFormat: OracleDB.OUT_FORMAT_OBJECT, autoCommit: true });
      });
      const tables = (tableResult.rows as TableQueryEntity[]).reduce((acc, attribute) => {
        const entityName = attribute.table_name;
        const entitySchema = attribute.schema_name;
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [
            ...columns,
            new Column(attribute.column_name, attribute.column_type, this.provider.escapeAsCol(attribute.column_name))
          ];
          return [...acc];
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.column_name, attribute.column_type, this.provider.escapeAsCol(attribute.column_name)));

        return [...acc, table];
      }, [] as Table[]);
      const schemaNames = new Set();
      const schemas = (tableResult.rows as TableQueryEntity[]).reduce((acc, attribute) => {
        const entityName = attribute['schema_name'];
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, [] as Schema[]);

      // keys
      const keysResult = await this.executeQuery(async () => {
        return client.execute(KEYS_QUERY, [], { maxRows: MAX_ROWS, outFormat: OracleDB.OUT_FORMAT_OBJECT, autoCommit: true });
      });

      // TODO(jason4012) this doesn't handle foreign keys correctly yet
      const compoundKeys: Record<string, { name: string; type: string; columns: string[] }> = {};
      (keysResult.rows as KeyQueryEntity[]).forEach((keysResult: KeyQueryEntity) => {
        if (!(keysResult.table_name in compoundKeys)) {
          compoundKeys[keysResult.table_name] = {
            name: keysResult.table_name,
            type: 'primary key',
            columns: []
          };
        }
        compoundKeys[keysResult.table_name].columns.push(keysResult.column_name);
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
      throw this._handleError(err, 'Metadata query failed');
    }
  }

  @CreateConnectionSQL
  protected async createConnection(
    datasourceConfiguration: OracleDbDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<OracleDB.Connection> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    // create pooled connection
    const poolConfig = this.getConnectionPoolFromDatasourceConfiguration(datasourceConfiguration);
    // TODO(jason4012) we decided not to use pools for now as the connection is being persisted across connections for each worker
    // await OracleDB.createPool(poolConfig);
    const client = await OracleDB.getConnection(poolConfig);
    client.callTimeout = connectionTimeoutMillis;

    this.attachLoggerToClient(client, datasourceConfiguration);

    this.logger.debug(
      `OracleDB client connected. ${datasourceConfiguration.connection?.hostUrl}:${datasourceConfiguration.connection?.port}`
    );
    return client;
  }

  @DestroyConnectionSQL
  protected async destroyConnection(client: OracleDB.Connection): Promise<void> {
    try {
      await client.close();
      await OracleDB.getPool().close(0);
    } catch (err) {
      throw this._handleError(err, 'Failed to close connection');
    }
  }

  private attachLoggerToClient(client: OracleDB.Connection, datasourceConfiguration: OracleDbDatasourceConfiguration) {
    if (!datasourceConfiguration.connection) {
      return;
    }

    // const datasourceEndpoint = `${datasourceConfiguration.connection?.hostUrl}:${datasourceConfiguration.connection?.port}`;

    // TODO(jason4012) map subscribed events from oracledb.Connection to this format
    // client.on('error', (err: Error) => {
    //   this.logger.error(`OracleDB client error. ${datasourceEndpoint} ${err.stack}`);
    // });

    // client.on('end', () => {
    //   this.logger.debug(`OracleDB client disconnected from server. ${datasourceEndpoint}`);
    // });

    // client.on('notification', (message: Notification): void => {
    //   this.logger.debug(`OracleDB notification ${message}. ${datasourceEndpoint}`);
    // });

    // client.on('notice', (notice: NoticeMessage) => {
    //   this.logger.debug(`OracleDB notice: ${notice.message}. ${datasourceEndpoint}`);
    // });
  }

  private _validateSQLActionConfigurationForUpdate(actionConfiguration: OracleDbActionConfiguration): void {
    if (!actionConfiguration.bulkEdit?.table) {
      throw new IntegrationError('Table is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    if (!actionConfiguration.bulkEdit?.schema) {
      throw new IntegrationError('Schema is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    if (
      !actionConfiguration.bulkEdit.insertedRows &&
      !actionConfiguration.bulkEdit.updatedRows &&
      !actionConfiguration.bulkEdit.deletedRows
    ) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        { pluginName: this.pluginName }
      );
    }
  }

  private getConnectionPoolFromDatasourceConfiguration(datasourceConfiguration: OracleDbDatasourceConfiguration) {
    if (datasourceConfiguration.connection?.connectionType === 'url') {
      if (!datasourceConfiguration.connection?.connectionUrl) {
        throw new IntegrationError('Expected to receive connection url for connection type url');
      }
      return {
        user: datasourceConfiguration.connection?.user,
        password: datasourceConfiguration.connection?.password,
        connectString: datasourceConfiguration.connection?.connectionUrl
      };
    }

    return {
      user: datasourceConfiguration.connection?.user,
      password: datasourceConfiguration.connection?.password,
      connectString: `tcp${datasourceConfiguration.connection?.useTcps ? 's' : ''}://${datasourceConfiguration.connection?.hostUrl}:${
        datasourceConfiguration.connection?.port ?? 1521
      }/${datasourceConfiguration.connection?.databaseService}?ssl_server_dn_match=yes`
    };
  }

  public async test(datasourceConfiguration: OracleDbDatasourceConfiguration): Promise<void> {
    let client: OracleDB.Connection | null = null;
    try {
      client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      await this.executeQuery(() => {
        return (client as OracleDB.Connection).execute('SELECT CURRENT_TIMESTAMP FROM dual');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
    }
  }

  protected escapeAsCol(str: string): string {
    if (this.columnEscapeCharacter.length === 2) {
      // Some SQL engines use [] for identifier references, such as [tablename].[column]
      // In this case we need to escape using [[ or ]]
      let newStr = str;
      for (const char of this.columnEscapeCharacter) {
        // Escape the special characters [ and ]
        newStr = newStr.replace(new RegExp('\\' + char, 'g'), `${char}${char}`);
      }
      return this.columnEscapeCharacter[0] + newStr + this.columnEscapeCharacter[1];
    }

    // Typical SQL engines use " or ` for identifier references, such as "tablename". To escape a quote inside the identifier, most engines
    // support doubling.
    return (
      this.columnEscapeCharacter +
      str.replace(new RegExp(this.columnEscapeCharacter, 'g'), `${this.columnEscapeCharacter}${this.columnEscapeCharacter}`) +
      this.columnEscapeCharacter
    );
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(`${initialMessage}: ${error.message}`, (error as IntegrationError).code);
    }

    const message = `${initialMessage}: ${error.message}`;

    // TODO (jason4012) include more error codes
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
      code: errno,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }

  // // if needed, this will format a string if it is mixed case
  // protected wrapForCaseIfNeeded(originalString: string): string {
  //   // check if we have a wrap character and this is a mixed case string
  //   let newString = originalString;
  //   if (this.caseSensitivityWrapCharacter) {
  //     newString = `${this.caseSensitivityWrapCharacter}${originalString}${this.caseSensitivityWrapCharacter}`;
  //   }
  //   return newString;
  // }
}
