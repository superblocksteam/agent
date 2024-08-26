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
  SnowflakeActionConfiguration,
  SnowflakeDatasourceConfiguration,
  Table,
  TableType,
  normalizeTableColumnNames
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { Snowflake } from './Snowflake';
import { connectionOptionsFromDatasourceConfiguration } from './util';

export default class SnowflakePlugin extends DatabasePluginPooled<Snowflake, SnowflakeDatasourceConfiguration> {
  protected readonly parameterType = '?';
  protected readonly caseSensitivityWrapCharacter = '"';

  async executePooled(
    { context, actionConfiguration }: PluginExecutionProps<SnowflakeDatasourceConfiguration, SnowflakeActionConfiguration>,
    client: Snowflake
  ): Promise<ExecutionOutput> {
    try {
      const ret = new ExecutionOutput();
      const query = actionConfiguration.body ?? '';
      if (isEmpty(query)) {
        return ret;
      }
      const rows = await this.executeQuery(() => {
        return client.execute(query, context.preparedStatementContext);
      });
      ret.output = normalizeTableColumnNames(rows);
      return ret;
    } catch (err) {
      throw this._handleError(err, 'query failed');
    }
  }

  getRequest(actionConfiguration: SnowflakeActionConfiguration): RawRequest {
    return actionConfiguration.body;
  }

  dynamicProperties(): string[] {
    return ['body'];
  }

  async metadata(datasourceConfiguration: SnowflakeDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client;
    let rows;
    // Try both quoted and unquoted calls since we don't know how the identifier was set during creation
    // Ref: https://docs.snowflake.com/en/sql-reference/identifiers-syntax.html
    try {
      client = await this.createConnection(datasourceConfiguration);
      const auth = datasourceConfiguration.authentication;
      const database = auth?.custom?.databaseName?.value ?? '';
      const schema = auth?.custom?.schema?.value;
      try {
        rows = await this.executeQuery(() => {
          return client.execute(this.getMetadataQuery(database, schema));
        });
      } catch (err) {
        rows = await this.executeQuery(() => {
          return client.execute(this.getMetadataQuery(database, schema, false));
        });
      }
    } catch (err) {
      throw this._handleError(err, 'metadata query failed');
    } finally {
      if (client)
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
    }

    const entities = rows.reduce((acc, attribute) => {
      const entityName = attribute['TABLE_NAME'];
      const entityType = attribute['TABLE_TYPE'] === 'BASE TABLE' ? TableType.TABLE : TableType.VIEW;

      const entity = acc.find((o: { name: string }) => o.name === entityName);
      if (entity) {
        const columns = entity.columns;
        entity.columns = [...columns, new Column(attribute.COLUMN_NAME, attribute.DATA_TYPE)];
        return [...acc];
      }

      const table = new Table(entityName, entityType);
      table.columns.push(new Column(attribute.COLUMN_NAME, attribute.DATA_TYPE));

      return [...acc, table];
    }, []);

    return {
      dbSchema: { tables: entities }
    };
  }

  @CreateConnection
  protected async createConnection(datasourceConfiguration: SnowflakeDatasourceConfiguration): Promise<Snowflake> {
    try {
      const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);
      const client = new Snowflake(connectionOptions);
      await client.connectAsync();
      this.logger.debug(`Created connection`);
      return client;
    } catch (err) {
      throw this._handleError(err, 'create configuration failed');
    }
  }

  @DestroyConnection
  protected async destroyConnection(client: Snowflake): Promise<void> {
    await client.destroy();
  }

  private getMetadataQuery(database: string, schema?: string, dbNameQuoted = true) {
    let query: string;
    if (dbNameQuoted) {
      query = `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM "${database}"."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN "${database}"."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME `;
    } else {
      query = `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM ${database}."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN ${database}."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME `;
    }
    if (schema) {
      query += ` WHERE c.TABLE_SCHEMA ILIKE '${schema}'`;
    }
    query += ` ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION ASC`;

    return query;
  }

  private getTestQuery(database?: string, schema?: string, dbNameQuoted = true) {
    if (!database && !schema) {
      return 'SHOW TABLES LIMIT 1;';
    }
    if (dbNameQuoted) {
      return `USE "${database}"${schema ? `."${schema}"` : ''}`;
    }
    return `USE ${database}${schema ? `.${schema}` : ''}`;
  }

  public async test(datasourceConfiguration: SnowflakeDatasourceConfiguration): Promise<void> {
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    const auth = datasourceConfiguration.authentication;
    if (!auth) {
      throw new IntegrationError('Auth not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    const database = auth.custom?.databaseName?.value ?? '';
    const schema = auth.custom?.schema?.value;

    let client;

    // Try both quoted and unquoted calls since we don't know how the identifier was set during creation
    // Ref: https://docs.snowflake.com/en/sql-reference/identifiers-syntax.html
    try {
      client = await this.createConnection(datasourceConfiguration);
      await this.executeQuery(() => {
        return client.execute(this.getTestQuery(database, schema));
      });
    } catch (err) {
      if (client) {
        try {
          await this.executeQuery(() => {
            return client.execute(this.getTestQuery(database, schema, false));
          });
        } catch (err) {
          throw this._handleError(err, 'test connection failed');
        }
      } else {
        throw this._handleError(err, 'test connection failed');
      }
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
      'Network error': ErrorCode.INTEGRATION_NETWORK,
      'Syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'Incorrect username': ErrorCode.INTEGRATION_AUTHORIZATION,
      'SQL compilation error': ErrorCode.INTEGRATION_SYNTAX
    };

    for (const key of Object.keys(errorMap)) {
      if (error.message.includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: error.stack });
  }
}
