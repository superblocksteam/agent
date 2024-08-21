import {
  BatchWriteItemCommand,
  CreateTableCommand,
  DeleteItemCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  GetItemCommand,
  ListTablesCommand,
  ListTagsOfResourceCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  TagResourceCommand,
  UpdateItemCommand,
  UpdateTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  camelCaseToDisplay,
  CreateConnection,
  DatabasePlugin,
  DatasourceMetadataDto,
  DynamoDBActionConfiguration,
  DynamoDBDatasourceConfiguration,
  ErrorCode,
  ExecutionOutput,
  getAwsClientConfig,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  safeJSONParse,
  TableType
} from '@superblocks/shared';
import { DynamoDbV1 } from '@superblocksteam/types/src/plugins';

export default class DynamoDBPlugin extends DatabasePlugin {
  pluginName = 'DynamoDB';
  protected readonly parameterType = '?';

  async execute({
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<DynamoDBDatasourceConfiguration, DynamoDBActionConfiguration>): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    try {
      let dynamoDBClient;
      try {
        dynamoDBClient = await this.createConnection(datasourceConfiguration);
      } catch (err) {
        throw this._handleError(err, 'Connection failed');
      }
      const parsedParams = safeJSONParse(actionConfiguration.body as string, this.logger) ?? {};
      ret.output = await this.executeQuery(() => {
        switch (actionConfiguration.action) {
          case 'getItem':
            return dynamoDBClient.send(new GetItemCommand(parsedParams));
          case 'updateItem':
            return dynamoDBClient.send(new UpdateItemCommand(parsedParams));
          case 'putItem':
            return dynamoDBClient.send(new PutItemCommand(parsedParams));
          case 'batchWriteItem':
            return dynamoDBClient.send(new BatchWriteItemCommand(parsedParams));
          case 'deleteItem':
            return dynamoDBClient.send(new DeleteItemCommand(parsedParams));
          case 'query':
            return dynamoDBClient.send(new QueryCommand(parsedParams));
          case 'scan':
            return dynamoDBClient.send(new ScanCommand(parsedParams));
          case 'executeStatement':
            return dynamoDBClient.send(new ExecuteStatementCommand(parsedParams));
          case 'executeTransaction':
            return dynamoDBClient.send(new ExecuteTransactionCommand(parsedParams));
          case 'listTagsOfResource':
            return dynamoDBClient.send(new ListTagsOfResourceCommand(parsedParams));
          case 'tagResource':
            return dynamoDBClient.send(new TagResourceCommand(parsedParams));
          case 'listTables':
            return dynamoDBClient.send(new ListTablesCommand(parsedParams));
          case 'describeTable':
            return dynamoDBClient.send(new DescribeTableCommand(parsedParams));
          case 'createTable':
            return dynamoDBClient.send(new CreateTableCommand(parsedParams));
          case 'updateTable':
            return dynamoDBClient.send(new UpdateTableCommand(parsedParams));
          case 'deleteTable':
            return dynamoDBClient.send(new DeleteTableCommand(parsedParams));
          default: {
            throw new IntegrationError(
              `Action ${actionConfiguration.action} is not supported`,
              ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
              { pluginName: this.pluginName }
            );
          }
        }
      });
      return ret;
    } catch (err) {
      throw this._handleError(err, 'Operation failed');
    }
  }

  dynamicProperties(): string[] {
    return ['action', 'body'];
  }

  escapeStringProperties(): string[] {
    return ['body'];
  }

  getRequest(actionConfiguration: DynamoDBActionConfiguration): RawRequest {
    const actionDisplayName = camelCaseToDisplay(actionConfiguration.action ?? '');
    return `Action: ${actionDisplayName}\n\nParams:\n${actionConfiguration.body}`;
  }

  async metadata(datasourceConfiguration: DynamoDBDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const response = {} as DatasourceMetadataDto;
    const dynamoDBClient = await this.createConnection(datasourceConfiguration);

    const processIndexes = (indexes) =>
      indexes
        ?.map((index) =>
          index.KeySchema
            ? {
                name: index.IndexName,
                partitionKey: index.KeySchema.find((key) => key.KeyType === 'HASH')?.AttributeName,
                sortKey: index.KeySchema.find((key) => key.KeyType === 'RANGE')?.AttributeName
              }
            : null
        )
        .filter(Boolean) || [];

    try {
      const data = await this.executeQuery(() => dynamoDBClient.send(new ListTablesCommand({})));

      // backwards compatability
      const oldTables =
        data.TableNames?.map((tableName: string) => {
          return {
            type: TableType.TABLE,
            name: tableName,
            columns: []
          };
        }) ?? [];
      response.dbSchema = { tables: oldTables };

      const tables: DynamoDbV1.Table[] = [];
      for (const tableName of data.TableNames ?? []) {
        try {
          const tableDetails = await this.executeQuery(() => dynamoDBClient.send(new DescribeTableCommand({ TableName: tableName })));

          const { Table } = tableDetails;
          if (Table && Table.KeySchema) {
            const secondaryIndexes = [...processIndexes(Table.LocalSecondaryIndexes), ...processIndexes(Table.GlobalSecondaryIndexes)];
            tables.push({
              name: tableName,
              partitionKey: Table.KeySchema.find((key) => key.KeyType === 'HASH')?.AttributeName,
              sortKey: Table.KeySchema.find((key) => key.KeyType === 'RANGE')?.AttributeName,
              indexes: secondaryIndexes.length ? secondaryIndexes : undefined
            } as DynamoDbV1.Table);
          }
        } catch (err) {
          this.logger.error(`Failed to get table details for ${tableName}, ${err.message}`);
        }
      }
      if (tables.length) {
        response.dynamodb = { tables } as DynamoDbV1.Metadata;
      }

      return response;
    } catch (err) {
      throw this._handleError(err, 'Metadata query failed');
    }
  }

  @CreateConnection
  protected async createConnection(datasourceConfig: DynamoDBDatasourceConfiguration): Promise<DynamoDBClient> {
    return new DynamoDBClient(await getAwsClientConfig(datasourceConfig));
  }

  async test(datasourceConfiguration: DynamoDBDatasourceConfiguration): Promise<void> {
    let dynamoDBClient: DynamoDBClient;
    try {
      dynamoDBClient = await this.createConnection(datasourceConfiguration);
      await this.executeQuery(async () => {
        return dynamoDBClient.send(new ListTablesCommand({}));
      });
    } catch (err) {
      throw this._handleError(err, 'listTables operation failed');
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

    // there are too many errors to enumerate here, so we might have to do it incrementally
    // map the first set of errors that we can find, and add cases for any INTERNAL errors we encounter later
    // reference: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/CommonErrors.html
    // reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html
    const errorCodeMap: Record<string, ErrorCode> = {
      AccessDeniedException: ErrorCode.INTEGRATION_AUTHORIZATION,
      ConditionalCheckFailedException: ErrorCode.INTEGRATION_SYNTAX,
      IncompleteSignatureException: ErrorCode.INTEGRATION_LOGIC,
      InternalServerError: ErrorCode.INTEGRATION_INTERNAL,
      InvalidClientTokenId: ErrorCode.INTEGRATION_AUTHORIZATION,
      LimitExceededException: ErrorCode.INTEGRATION_RATE_LIMIT,
      MissingAuthenticationTokenException: ErrorCode.INTEGRATION_AUTHORIZATION,
      NotAuthorized: ErrorCode.INTEGRATION_AUTHORIZATION,
      ProvisionedThroughputExceededException: ErrorCode.INTEGRATION_RATE_LIMIT,
      RequestExpired: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
      RequestLimitExceeded: ErrorCode.INTEGRATION_RATE_LIMIT,
      ResourceInUseException: ErrorCode.INTEGRATION_LOGIC,
      ResourceNotFoundException: ErrorCode.INTEGRATION_LOGIC,
      ServiceUnavailable: ErrorCode.INTEGRATION_INTERNAL,
      ThrottlingException: ErrorCode.INTEGRATION_RATE_LIMIT,
      UnrecognizedClientException: ErrorCode.INTEGRATION_AUTHORIZATION,
      ValidationException: ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
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
}
