import {
  AthenaClient,
  ColumnInfo,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  GetWorkGroupCommand,
  Row,
  StartQueryExecutionCommand,
  StartQueryExecutionInput
} from '@aws-sdk/client-athena';
import { GetDatabaseCommand, GetTablesCommand, GlueClient } from '@aws-sdk/client-glue';
import {
  AthenaActionConfiguration,
  AthenaDatasourceConfiguration,
  Column,
  CreateConnection,
  DatabasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Table,
  TableType
} from '@superblocks/shared';
// NOTE: (joey) idk why the linter is whining about the CreateConnection import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AthenaPluginV1 } from '@superblocksteam/types';
import { isEmpty } from 'lodash';

enum QueryExecutionStatus {
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SUCCEEDED = 'SUCCEEDED'
}

export default class AthenaPlugin extends DatabasePlugin {
  pluginName = 'Athena';
  protected readonly parameterType = '?';
  private readonly INITIAL_QUERY_RETRY_INTERVAL_MS = 100;
  private readonly QUERY_RETRY_EXPONENTIAL_MULTIPLIER = 2;
  private readonly MAX_WAIT_TIME_MS = 4000;
  private readonly QUERY_MAX_ATTEMPTS = 60;

  private getAthenaClient(configuration: AthenaDatasourceConfiguration) {
    return new AthenaClient({
      region: configuration.connection?.awsConfig?.region,
      credentials: {
        accessKeyId: configuration.connection?.awsConfig?.auth?.accessKeyId || '',
        secretAccessKey: configuration.connection?.awsConfig?.auth?.secretKey || ''
      }
    });
  }

  private getGlueClient(configuration: AthenaDatasourceConfiguration): GlueClient {
    return new GlueClient({
      region: configuration.connection?.awsConfig?.region,
      credentials: {
        accessKeyId: configuration.connection?.awsConfig?.auth?.accessKeyId || '',
        secretAccessKey: configuration.connection?.awsConfig?.auth?.secretKey || ''
      }
    });
  }

  @CreateConnection
  private async createConnection(datasourceConfiguration: AthenaDatasourceConfiguration): Promise<AthenaClient> {
    return this.getAthenaClient(datasourceConfiguration);
  }

  public async execute({
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput,
    context
  }: PluginExecutionProps<AthenaDatasourceConfiguration, AthenaActionConfiguration>): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    const query = actionConfiguration?.runSql?.sqlBody;
    if (isEmpty(query)) {
      return ret;
    }
    const athenaClient = await this.createConnection(datasourceConfiguration);
    let queryExcecutionId;
    let queryRetryIntervalMs = this.INITIAL_QUERY_RETRY_INTERVAL_MS;
    try {
      const startQueryExecutionParams: StartQueryExecutionInput = {
        QueryString: query,
        QueryExecutionContext: {
          Database: datasourceConfiguration.connection?.databaseName
        }
      };

      mutableOutput.logInfo(`Query: ${query}`);
      // send in params (as strings) if they exist
      // this is because ExecutionParameters only takes a list of strings
      const params = context.preparedStatementContext;
      if (params.length > 0) {
        startQueryExecutionParams.ExecutionParameters = params.map(String);
        mutableOutput.logInfo(`Parameters: ${params}`);
      }

      if (datasourceConfiguration.connection?.overrideS3OutputLocation) {
        let suffix;
        switch (datasourceConfiguration.connection?.s3OutputLocationSuffix) {
          case AthenaPluginV1.Connection_DateFolderType.YYYY:
            suffix = new Date().getUTCFullYear().toString();
            break;
          case AthenaPluginV1.Connection_DateFolderType.YYYYMM: {
            const date = new Date();
            suffix = `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            break;
          }
          case AthenaPluginV1.Connection_DateFolderType.YYYYMMDD: {
            const date = new Date();
            suffix = `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1)
              .toString()
              .padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`;
            break;
          }
          default:
            break;
        }

        let s3OutputLocation = datasourceConfiguration.connection?.s3OutputLocation || '';

        if (suffix) {
          if (!s3OutputLocation.endsWith('/')) {
            s3OutputLocation += '/';
          }
          s3OutputLocation += `${suffix}/`;
        }

        // NOTE: (joey) we can define an s3 output location in the query,
        // BUT a workgroup could override client side settings
        mutableOutput.logInfo(`Querying with S3 Output Location: ${s3OutputLocation}`);
        startQueryExecutionParams.ResultConfiguration = {
          OutputLocation: s3OutputLocation
        };
      }

      const workgroupName = datasourceConfiguration.connection?.workgroupName;
      if (workgroupName) {
        mutableOutput.logInfo(`Using Workgroup: ${workgroupName}`);
        startQueryExecutionParams.WorkGroup = workgroupName;
      }

      mutableOutput.logInfo(`Running Query...`);
      const result = await athenaClient.send(new StartQueryExecutionCommand(startQueryExecutionParams));
      queryExcecutionId = result.QueryExecutionId;
      mutableOutput.logInfo(`Query started successfully. Query ID: ${queryExcecutionId}`);
    } catch (err) {
      throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }

    // poll for query status
    let queryExecutionStatus;
    let attemptNumber = 1;
    while (queryExecutionStatus !== QueryExecutionStatus.SUCCEEDED) {
      if (attemptNumber > this.QUERY_MAX_ATTEMPTS) {
        throw new IntegrationError(`Query failed, max retries exceeded`, ErrorCode.INTEGRATION_RATE_LIMIT, { pluginName: this.pluginName });
      }
      mutableOutput.logInfo(`Attempt Number: ${attemptNumber}`);
      await new Promise((resolve) => setTimeout(resolve, queryRetryIntervalMs));
      queryRetryIntervalMs = Math.min(queryRetryIntervalMs * this.QUERY_RETRY_EXPONENTIAL_MULTIPLIER, this.MAX_WAIT_TIME_MS);

      const getQueryExecutionCommand = new GetQueryExecutionCommand({
        QueryExecutionId: queryExcecutionId
      });

      try {
        const response = await athenaClient.send(getQueryExecutionCommand);
        queryExecutionStatus = response.QueryExecution?.Status?.State;
        mutableOutput.logInfo(`Query status: ${queryExecutionStatus}`);

        if (queryExecutionStatus === QueryExecutionStatus.FAILED) {
          throw new IntegrationError(`Query failed: ${response.QueryExecution?.Status?.StateChangeReason}`, ErrorCode.INTEGRATION_SYNTAX, {
            pluginName: this.pluginName
          });
        } else if (queryExecutionStatus === QueryExecutionStatus.CANCELLED) {
          throw new IntegrationError(
            `Query cancelled: ${response.QueryExecution?.Status?.StateChangeReason}`,
            ErrorCode.INTEGRATION_USER_CANCELLED,
            { pluginName: this.pluginName }
          );
        }
        // if query is still running, start loop again
        if (queryExecutionStatus !== QueryExecutionStatus.SUCCEEDED) {
          attemptNumber++;
          continue;
        }
      } catch (err) {
        throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
      }
    }

    // fetch results
    const getQueryResultsCommand = new GetQueryResultsCommand({
      QueryExecutionId: queryExcecutionId
    });

    let rows: Row[] = [];
    let columnInfo: ColumnInfo[] | undefined;
    try {
      const response = await athenaClient.send(getQueryResultsCommand);
      rows = response.ResultSet?.Rows || [];
      columnInfo = response.ResultSet?.ResultSetMetadata?.ColumnInfo;
    } catch (err) {
      throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
    }

    const normalizedData = normalizeTableColumnNames(this.convertAthenaRows(rows, columnInfo));
    mutableOutput.output = normalizedData;
    mutableOutput.logInfo(`Query retrieved ${normalizedData.length} rows`);
    ret.output = normalizedData;
    return ret;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public convertAthenaRows(rows: Row[], columnInfo: ColumnInfo[] | undefined): Record<string, any>[] {
    // NOTE: (joey) the Athena SDK is weird with how it returns data
    // for most queries (SELECT * FROM FOO), it puts the column names in the first row
    // for some less common queries (SHOW TABLES), it does not
    if (rows.length === 0) {
      return [];
    }

    // get values in first row to check if they are column names or not
    const firstRowValues: string[] = [];
    for (const key of rows[0].Data || []) {
      if (key.VarCharValue === undefined) {
        // NOTE: (joey) not sure how this would happen but this is a failsafe
        throw new IntegrationError(`Query failed, column name is undefined.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }
      firstRowValues.push(key.VarCharValue);
    }

    if (firstRowValues.length === 0) {
      return [];
    }

    // check if the first row actually contained column names
    let firstRowIsColumnNames = true;
    if (columnInfo) {
      for (const obj of columnInfo) {
        if (!obj.Name || !firstRowValues.includes(obj.Name)) {
          firstRowIsColumnNames = false;
          break;
        }
      }
    }

    const columnNames = firstRowIsColumnNames ? firstRowValues : columnInfo?.map((obj) => obj.Name ?? '') || [];
    const startIndex = firstRowIsColumnNames ? 1 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convertedRows: Record<string, any>[] = [];

    // rest of the rows contain data
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convertedRow: Record<string, any> = {};
      if (row.Data === undefined) {
        // NOTE: (joey) not sure how this would happen but this is a failsafe
        throw new IntegrationError(`Query failed, row data is undefined.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }
      for (let j = 0; j < row.Data?.length; j++) {
        const key = columnNames[j];
        const value = row.Data[j].VarCharValue;
        convertedRow[key] = value;
      }
      convertedRows.push(convertedRow);
    }
    return convertedRows;
  }

  public getRequest(actionConfiguration: AthenaActionConfiguration): RawRequest {
    return actionConfiguration?.runSql?.sqlBody;
  }

  public dynamicProperties(): string[] {
    return ['runSql.sqlBody'];
  }

  public async metadata(datasourceConfiguration: AthenaDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    // NOTE: (joey)
    // Primary/Foreign keys are not supported in Athena
    // https://docs.aws.amazon.com/athena/latest/ug/create-table.html
    const glueClient = this.getGlueClient(datasourceConfiguration);
    const getTablesRequest = {
      DatabaseName: datasourceConfiguration.connection?.databaseName
    };
    const command = new GetTablesCommand(getTablesRequest);
    const response = await glueClient.send(command);

    const tables = new Array<Table>();
    response.TableList?.forEach((t) => {
      const entityName = t.Name;
      if (entityName === undefined) {
        return;
      }
      const entityType = TableType.TABLE;

      const columns = new Array<Column>();
      t.StorageDescriptor?.Columns?.forEach((column) => {
        const columnName = column.Name;
        const columnType = column.Type;
        if (columnName !== undefined && columnType !== undefined) {
          columns.push(new Column(columnName, columnType, this.escapeAsCol(columnName)));
        }
      });
      const table = new Table(entityName, entityType);
      table.columns = columns;
      tables.push(table);
    });

    return {
      dbSchema: { tables }
    };
  }

  public async test(datasourceConfiguration: AthenaDatasourceConfiguration): Promise<void> {
    // NOTE: (joey) this does not test the S3 output location for validity
    // could maybe add some sort of check for S3 URL formatting but that could get spicy
    // valid S3 URL type 1: "https://bucket-name.s3.amazonaws.com/path/to/object"
    // valid S3 URL type 2: "s3://bucket-name/path/to/object"
    // could perhaps add regex here?
    try {
      const glueClient = this.getGlueClient(datasourceConfiguration);
      await glueClient.send(
        new GetDatabaseCommand({
          Name: datasourceConfiguration.connection?.databaseName || ''
        })
      );
      if (datasourceConfiguration.connection?.workgroupName) {
        const athenaClient = await this.createConnection(datasourceConfiguration);
        const response = await athenaClient.send(
          new GetWorkGroupCommand({
            WorkGroup: datasourceConfiguration.connection?.workgroupName || ''
          })
        );
        // if the WorkGroup doesn't have an S3 output location, make sure one was given
        if (
          !response.WorkGroup?.Configuration?.ResultConfiguration?.OutputLocation &&
          !datasourceConfiguration.connection?.s3OutputLocation
        ) {
          throw new IntegrationError(
            'WorkGroup does not have an S3 output location and none was given.',
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            { pluginName: this.pluginName }
          );
        }
      }
    } catch (error) {
      throw new IntegrationError(`Test connection failed, ${error.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
  }
}
