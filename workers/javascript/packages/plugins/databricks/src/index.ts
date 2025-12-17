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

import { DatabricksPluginV1 } from '@superblocksteam/types';
import { chunk, isEmpty, merge } from 'lodash';
import { KEYS_QUERY, SQL_SINGLE_TABLE_METADATA } from './queries';
import { getConnectionOptionsFromDatasourceConfiguration } from './utils';

const TEST_CONNECTION_TIMEOUT_MS = 5000;

interface CatalogResponse {
  name: string;
}

interface SchemaResponse {
  name: string;
  catalog_name: string;
}

interface ColumnResponse {
  name: string;
  type_name?: string;
  data_type?: string;
}

interface TableResponse {
  name: string;
  table_type?: string;
  columns?: ColumnResponse[];
}

interface TablesApiResponse {
  tables?: TableResponse[];
  next_page_token?: string;
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
    [SQLQueryEnum.SQL_TABLE]: ''
  };
  protected readonly caseSensitivityWrapCharacter = '`';

  private connectionTimeoutMillis = TEST_CONNECTION_TIMEOUT_MS;
  private metadataConcurrency = parseInt(process.env.DATABRICKS_METADATA_CONCURRENCY || '4', 10);

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

  private async getM2MAccessToken(baseUrl: string, datasourceConfiguration: DatabricksDatasourceConfiguration): Promise<string> {
    const clientId = datasourceConfiguration.connection?.oauthClientId;
    const clientSecret = datasourceConfiguration.connection?.oauthClientSecret;

    if (!clientId || !clientSecret) {
      throw new IntegrationError('M2M authentication requires oauthClientId and oauthClientSecret', ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }

    const tokenUrl = `${baseUrl}/oidc/v1/token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'all-apis'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new IntegrationError(
        `Failed to get an access token for machine-to-machine, received a status: ${response.status} - ${response.statusText}`,
        ErrorCode.INTEGRATION_AUTHORIZATION,
        {
          pluginName: this.pluginName
        }
      );
    }

    const tokenData = await response.json();

    if (!tokenData.access_token) {
      throw new IntegrationError('Failed to find access token in OAuth response', ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }

    return tokenData.access_token;
  }

  public async metadata(datasourceConfiguration: DatabricksDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const startTime = Date.now();
    this.logger.debug(`[Databricks Metadata] Starting metadata fetch at ${startTime.toString()}`);
    this.logger.info(`[Databricks Metadata] Using concurrency=${this.metadataConcurrency}`);

    try {
      // Get connection config for API authentication
      const connectionOptions = getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration);
      const baseUrl = `https://${connectionOptions.host}`;

      // Extract token based on connection type
      let token: string;
      switch (datasourceConfiguration.connection?.connectionType) {
        case DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE:
          token = datasourceConfiguration.authConfig?.authToken || '';
          break;
        case DatabricksPluginV1.Plugin_ConnectionType.M2M:
          token = await this.getM2MAccessToken(baseUrl, datasourceConfiguration);
          break;
        case DatabricksPluginV1.Plugin_ConnectionType.PAT:
        default:
          token = datasourceConfiguration.connection?.token || '';
          break;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Get scoped catalog-schemas pairs from configuration
      const scopedCatalogSchemas = datasourceConfiguration.connection?.scopedCatalogSchemas || [];

      let catalogs: CatalogResponse[];
      let schemasToFetch: SchemaResponse[];

      // If scoped catalog-schemas pairs are provided, only fetch those specific catalogs/schemas
      if (scopedCatalogSchemas.length > 0) {
        this.logger.info(`[Databricks Metadata] Using ${scopedCatalogSchemas.length} scoped catalog-schema pair(s)`);

        catalogs = [];
        schemasToFetch = [];

        for (const entry of scopedCatalogSchemas) {
          const catalog = entry.catalog;
          const schemas = entry.schemas || [];

          if (!catalog) continue;

          catalogs.push({ name: catalog });

          this.logger.info(`[Databricks Metadata] Fetching schemas from catalog: ${catalog}...`);
          const allSchemasInCatalog = await this.fetchAllSchemas(baseUrl, headers, [{ name: catalog }]);

          // If specific schemas are provided for this catalog, filter to only those
          if (schemas.length > 0) {
            this.logger.info(`[Databricks Metadata] Filtering to schemas in ${catalog}: ${schemas.join(', ')}`);
            const filtered = allSchemasInCatalog.filter((schema) => schemas.includes(schema.name));
            schemasToFetch.push(...filtered);
            this.logger.info(`[Databricks Metadata] Added ${filtered.length} schemas from catalog ${catalog}`);
          } else {
            // If no specific schemas provided, include all schemas from this catalog
            schemasToFetch.push(...allSchemasInCatalog);
            this.logger.info(`[Databricks Metadata] Added all ${allSchemasInCatalog.length} schemas from catalog ${catalog}`);
          }
        }

        this.logger.info(`[Databricks Metadata] Total: ${schemasToFetch.length} schemas across ${catalogs.length} catalog(s)`);
      } else {
        // Default behavior: fetch all catalogs and their schemas
        this.logger.info(`[Databricks Metadata] Fetching catalogs...`);
        catalogs = await this.fetchAllCatalogs(baseUrl, headers);
        this.logger.info(`[Databricks Metadata] Found ${catalogs.length} catalogs`);

        this.logger.info(`[Databricks Metadata] Fetching schemas from ${catalogs.length} catalogs...`);
        schemasToFetch = await this.fetchAllSchemas(baseUrl, headers, catalogs);
        this.logger.info(`[Databricks Metadata] Found ${schemasToFetch.length} schemas`);
      }

      this.logger.info(`[Databricks Metadata] Fetching tables from ${schemasToFetch.length} schemas...`);
      const tablesWithColumns = await this.fetchAllTablesWithColumns(baseUrl, headers, schemasToFetch);
      this.logger.info(`[Databricks Metadata] Found ${tablesWithColumns.length} tables`);

      // Only include schemas that have tables after filtering
      const schemasWithTables = new Set(tablesWithColumns.map((table) => table.schema));
      const schemas = catalogs.filter((catalog) => schemasWithTables.has(catalog.name)).map((catalog) => new Schema(catalog.name));

      const totalTime = Date.now() - startTime;
      this.logger.debug(`[Databricks Metadata] SUCCESS: Total metadata fetch completed in ${totalTime}ms`);
      this.logger.debug(
        `[Databricks Metadata] Final counts: ${catalogs.length} catalogs, ${schemas.length} schemas (${schemasToFetch.length} total), ${tablesWithColumns.length} tables`
      );

      return {
        dbSchema: { tables: tablesWithColumns, schemas }
      };
    } catch (err) {
      const totalTime = Date.now() - startTime;
      this.logger.error(`[Databricks Metadata] ERROR after ${totalTime}ms: ${err.message}`);

      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    let retryDelay = 1000; // Start with 1 second
    // Use 15 minutes to prevent requests from hanging forever
    const REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // If we get a 429, retry with exponential backoff + jitter
        if (response.status === 429) {
          if (attempt < maxRetries) {
            const retryAfter = response.headers.get('Retry-After');
            let waitTime: number;
            if (retryAfter) {
              waitTime = parseInt(retryAfter, 10) * 1000;
            } else {
              // Add jitter: random value between 0.5x and 1.5x the base delay
              const jitter = 0.5 + Math.random();
              waitTime = Math.floor(retryDelay * jitter);
            }

            this.logger.warn(`[Databricks] Rate limited (429), retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            retryDelay *= 2; // Exponential backoff
            continue;
          }
          throw new IntegrationError(`Rate limit exceeded after ${maxRetries} retries`, ErrorCode.INTEGRATION_RATE_LIMIT, {
            pluginName: this.pluginName
          });
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;

        // Check if it was a timeout
        if (err.name === 'AbortError') {
          this.logger.error(`[Databricks] Request timeout after ${REQUEST_TIMEOUT_MS}ms (attempt ${attempt + 1}/${maxRetries})`);
          if (attempt < maxRetries) {
            this.logger.warn(`[Databricks] Retrying after timeout in ${retryDelay}ms`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay *= 2;
            continue;
          }
          throw new IntegrationError(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`, ErrorCode.INTEGRATION_NETWORK, {
            pluginName: this.pluginName
          });
        }

        if (attempt < maxRetries && err.message?.includes('fetch')) {
          this.logger.warn(`[Databricks] Fetch error, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries}): ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay *= 2;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async fetchAllCatalogs(baseUrl: string, headers: Record<string, string>): Promise<CatalogResponse[]> {
    const response = await this.fetchWithRetry(`${baseUrl}/api/2.1/unity-catalog/catalogs`, { method: 'GET', headers });

    if (!response.ok) {
      throw new IntegrationError(`Failed to fetch catalogs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.catalogs || [];
  }

  private async fetchAllSchemas(baseUrl: string, headers: Record<string, string>, catalogs: CatalogResponse[]): Promise<SchemaResponse[]> {
    const allSchemas: SchemaResponse[] = [];

    // Process catalogs in batches
    const catalogBatches = chunk(catalogs, this.metadataConcurrency);
    const totalBatches = catalogBatches.length;

    for (let i = 0; i < catalogBatches.length; i++) {
      const catalogBatch = catalogBatches[i];
      this.logger.info(
        `[Databricks Metadata] Fetching schemas batch ${i + 1}/${totalBatches} (${catalogBatch.map((c) => c.name).join(', ')})`
      );

      const schemaBatchPromises = catalogBatch.map(async (catalog) => {
        const response = await this.fetchWithRetry(
          `${baseUrl}/api/2.1/unity-catalog/schemas?catalog_name=${encodeURIComponent(catalog.name)}`,
          { method: 'GET', headers }
        );

        if (!response.ok) {
          throw new IntegrationError(`Failed to fetch schemas for catalog ${catalog.name}: ${response.statusText}`);
        }

        const data = await response.json();
        return (data.schemas || []).map((schema: SchemaResponse) => ({
          ...schema,
          catalog_name: catalog.name
        }));
      });

      const schemaBatches = await Promise.all(schemaBatchPromises);
      const batchSchemaCount = schemaBatches.flat().length;
      allSchemas.push(...schemaBatches.flat());
      this.logger.info(`[Databricks Metadata] Completed schemas batch ${i + 1}/${totalBatches}, found ${batchSchemaCount} schemas`);
    }

    // Filter out information_schema to avoid system tables
    const filteredSchemas = allSchemas.filter((schema) => schema.name !== 'information_schema');

    return filteredSchemas;
  }

  private async fetchAllTablesWithColumns(baseUrl: string, headers: Record<string, string>, schemas: SchemaResponse[]): Promise<Table[]> {
    const allTables: Table[] = [];

    // Process schemas in batches
    const schemaBatches = chunk(schemas, this.metadataConcurrency);
    const totalBatches = schemaBatches.length;

    for (let i = 0; i < schemaBatches.length; i++) {
      const schemaBatch = schemaBatches[i];
      this.logger.info(
        `[Databricks Metadata] Fetching tables batch ${i + 1}/${totalBatches} (${schemaBatch.map((s) => `${s.catalog_name}.${s.name}`).join(', ')})`
      );

      const tableBatchPromises = schemaBatch.map(async (schema) => {
        try {
          const allTablesForSchema: TableResponse[] = [];
          let nextPageToken: string | undefined = undefined;

          // Handle pagination - keep fetching until no more pages
          do {
            const url = new URL(`${baseUrl}/api/2.1/unity-catalog/tables`);
            url.searchParams.set('catalog_name', schema.catalog_name);
            url.searchParams.set('schema_name', schema.name);
            if (nextPageToken) {
              url.searchParams.set('page_token', nextPageToken);
            }

            const response = await this.fetchWithRetry(url.toString(), { method: 'GET', headers });

            if (!response.ok) {
              throw new IntegrationError(`Failed to fetch tables for schema ${schema.catalog_name}.${schema.name}: ${response.statusText}`);
            }

            const data: TablesApiResponse = await response.json();

            // Add tables from this page
            if (data.tables) {
              allTablesForSchema.push(...data.tables);
            }

            // Check for next page
            nextPageToken = data.next_page_token;
          } while (nextPageToken);

          // Filter tables by allowed types
          const allowedTableTypes = ['MANAGED', 'EXTERNAL', 'VIEW', 'MATERIALIZED_VIEW'];
          const filteredTables = allTablesForSchema.filter((tableData: TableResponse) => {
            return !tableData.table_type || allowedTableTypes.includes(tableData.table_type);
          });

          // Process each table and its columns from all pages
          return filteredTables.map((tableData: TableResponse) => {
            const entityName = `${schema.name}.${tableData.name}`;
            const entitySchema = schema.catalog_name;

            const table = new Table(entityName, TableType.TABLE, entitySchema);

            // Add columns if they exist in the response
            if (tableData.columns) {
              tableData.columns.forEach((column: ColumnResponse) => {
                table.columns.push(new Column(column.name, column.type_name || column.data_type));
              });
            }

            return table;
          });
        } catch (err) {
          throw new IntegrationError(`Failed to fetch tables for schema ${schema.catalog_name}.${schema.name}: ${err.message}`);
        }
      });

      const tableBatches = await Promise.all(tableBatchPromises);
      const batchTableCount = tableBatches.flat().length;
      allTables.push(...tableBatches.flat());
      this.logger.info(`[Databricks Metadata] Completed tables batch ${i + 1}/${totalBatches}, found ${batchTableCount} tables`);
    }

    return allTables;
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
      this.logger.debug('Caught error at connect: ', error.message);
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
