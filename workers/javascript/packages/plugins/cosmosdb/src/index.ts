import { Container, CosmosClient, FeedOptions, JSONObject, PartitionKey, Resource, SqlQuerySpec } from '@azure/cosmos';
import {
  CosmosDbActionConfiguration,
  CosmosDbDatasourceConfiguration,
  CreateConnection,
  DatabasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest
} from '@superblocks/shared';
// NOTE: (joey) idk why the linter is whining about the CreateConnection import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthCommonV1, CosmosDbPluginV1 } from '@superblocksteam/types/src/plugins';

export default class CosmosDbPlugin extends DatabasePlugin {
  pluginName = 'CosmosDB';
  protected readonly parameterType = '@';
  protected readonly ignoreColumnNames = ['_attachments', '_etag', '_rid', '_self', '_ts'];

  private _getCosmosClient(datasourceConfiguration: CosmosDbDatasourceConfiguration): CosmosClient {
    let masterKey;
    let azureKey;
    switch (datasourceConfiguration.connection?.auth?.config.case) {
      case 'key':
        azureKey = datasourceConfiguration.connection?.auth?.config.value as AuthCommonV1.Azure_Key;
        masterKey = azureKey.masterKey;
        break;
      default:
        throw new IntegrationError(
          `No valid auth method received. (got '${datasourceConfiguration.connection?.auth?.config.case}')`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          { pluginName: this.pluginName }
        );
    }

    return new CosmosClient({
      endpoint: datasourceConfiguration.connection.host,
      key: masterKey
    });
  }

  @CreateConnection
  private async createConnection(datasourceConfiguration: CosmosDbDatasourceConfiguration): Promise<CosmosClient> {
    return this._getCosmosClient(datasourceConfiguration);
  }

  public async execute({
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput
  }: PluginExecutionProps<CosmosDbDatasourceConfiguration, CosmosDbActionConfiguration>): Promise<ExecutionOutput> {
    switch (actionConfiguration.cosmosdbAction?.case) {
      case 'sql':
        return await this.handleSql(
          actionConfiguration.cosmosdbAction?.value as CosmosDbPluginV1.Plugin_Sql,
          datasourceConfiguration,
          mutableOutput
        );
      case 'pointOperation':
        return await this.handlePointOperation(
          actionConfiguration.cosmosdbAction?.value as CosmosDbPluginV1.Plugin_PointOperation,
          datasourceConfiguration,
          mutableOutput
        );
      default:
        throw new IntegrationError(
          // @ts-ignore
          `No valid action received. (got '${actionConfiguration.cosmosdbAction?.case}')`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          { pluginName: this.pluginName }
        );
    }
  }

  private async handleSql(
    sql: CosmosDbPluginV1.Plugin_Sql,
    datasourceConfiguration: CosmosDbDatasourceConfiguration,
    mutableOutput: ExecutionOutput
  ): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    let query: string;
    let crossPartition: boolean;
    let partitionKey: string | undefined;
    let containerId: string;

    switch (sql.action.case) {
      case 'singleton': {
        const sqlAction = sql.action.value;

        query = sqlAction.query;
        crossPartition = sqlAction.crossPartition;
        partitionKey = sqlAction.partitionKey;
        containerId = sqlAction.containerId;
        break;
      }
      default:
        // @ts-ignore
        throw new IntegrationError(`No valid SQL action received. (got '${sql.action.case}')`, ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
    }

    if (!containerId) {
      throw new IntegrationError(`Container ID not defined.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const cosmosClient = await this.createConnection(datasourceConfiguration);
    const databaseId = datasourceConfiguration.connection?.databaseId;
    const database = cosmosClient.database(databaseId ?? '');

    const container = database.container(containerId);
    // TODO: (joey) enable parameters with parameterized sql
    const parameters = [];

    const querySpec: SqlQuerySpec = {
      query: query,
      parameters: parameters
    };

    const options: FeedOptions = {};

    if (crossPartition) {
      mutableOutput.logInfo(`Cross-partition enabled.`);
    } else {
      options['partitionKey'] = partitionKey;
      mutableOutput.logInfo(`Using partition key: ${partitionKey}`);
    }

    mutableOutput.logInfo(`Query: ${querySpec.query}`);
    if (parameters.length > 0) {
      mutableOutput.logInfo(`Parameters: ${parameters}`);
    }

    try {
      const { resources: results } = await container.items.query(querySpec, options).fetchAll();
      const normalizedData = normalizeTableColumnNames(this.convertCosmosDbRows(results));
      ret.output = normalizedData;
      return ret;
    } catch (error) {
      throw this._handleError(error, 'Error executing query');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public convertCosmosDbRows(rows: Resource[]): Record<string, any>[] {
    return rows.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredRow: Record<string, any> = {};
      for (const key in row) {
        // NOTE: (joey) do we want to remove the _ prefixed columns?
        // certain competitors *cough cough retool* keep them in
        // seems to me like they're just noise but perhaps some customers actually use them
        if (!this.ignoreColumnNames.includes(key)) {
          filteredRow[key] = row[key];
        }
      }
      return filteredRow;
    });
  }

  private async handlePointOperation(
    structured: CosmosDbPluginV1.Plugin_PointOperation,
    datasourceConfiguration: CosmosDbDatasourceConfiguration,
    mutableOutput: ExecutionOutput
  ): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    let rows: Resource[] | undefined;
    const containerId = structured.containerId;
    const client = await this.createConnection(datasourceConfiguration);
    const database = client.database(datasourceConfiguration.connection?.databaseId ?? '');
    const container = database.container(containerId);
    switch (structured.action.case) {
      case 'read': {
        const readAction = structured.action.value;
        const id = readAction.id.trim();
        const partitionKey = readAction.partitionKey?.trim() || undefined;
        try {
          const { resource } = await container.item(id, partitionKey).read();
          rows = resource === undefined ? [] : [resource];
          break;
        } catch (error) {
          throw this._handleError(error, 'Read operation failed');
        }
      }
      case 'replace': {
        const replaceAction = structured.action.value;
        const newItem = this.getValidateSingleJsonItem(replaceAction.body);
        const id = newItem.id;
        const partitionKey = replaceAction.partitionKey?.trim() || undefined;

        if (id === undefined) {
          throw new IntegrationError(
            `Replace operation failed: 'id' field not in item body.`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            { pluginName: this.pluginName }
          );
        }

        try {
          const { resource } = await container.item(id, partitionKey).replace(newItem);
          rows = resource === undefined ? [] : [resource];
          break;
        } catch (error) {
          throw this._handleError(error, 'Replace operation failed');
        }
      }
      case 'upsert': {
        const upsertAction = structured.action.value;
        const newOrUpdatedItem = this.getValidateSingleJsonItem(upsertAction.body);
        const partitionKey = upsertAction.partitionKey?.trim() || undefined;
        let resource;
        try {
          if (partitionKey === undefined) {
            const response = await container.items.upsert(newOrUpdatedItem);
            resource = response.resource;
          } else {
            resource = await this._executeSingleBatchOperation(container, newOrUpdatedItem as JSONObject, 'Upsert', partitionKey);
          }
          rows = resource === undefined ? [] : [resource as unknown as Resource];
          break;
        } catch (error) {
          throw this._handleError(error, 'Upsert operation failed');
        }
      }
      case 'delete': {
        const deleteAction = structured.action.value;
        const id = deleteAction.id.trim();
        const partitionKey = deleteAction.partitionKey?.trim() || undefined;

        try {
          await container.item(id, partitionKey).delete();
          break;
        } catch (error) {
          throw this._handleError(error, 'Delete operation failed');
        }
      }
      case 'create': {
        const createAction = structured.action.value;
        const newItem = this.getValidateSingleJsonItem(createAction.body);
        const partitionKey = createAction.partitionKey?.trim() || undefined;
        let resource;
        try {
          if (partitionKey === undefined) {
            const response = await container.items.create(newItem);
            resource = response.resource;
          } else {
            resource = await this._executeSingleBatchOperation(container, newItem as JSONObject, 'Create', partitionKey);
          }
          rows = resource === undefined ? [] : [resource as unknown as Resource];
          break;
        } catch (error) {
          throw this._handleError(error, 'Create operation failed');
        }
      }
      default:
        throw new IntegrationError(
          // @ts-ignore
          `No valid point operation action received. (got '${structured.action.case}')`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          { pluginName: this.pluginName }
        );
    }
    if (rows) {
      const normalizedData = normalizeTableColumnNames(this.convertCosmosDbRows(rows));
      ret.output = normalizedData;
    }
    return ret;
  }

  private async _executeSingleBatchOperation(
    container: Container,
    item: JSONObject,
    operationType: 'Create' | 'Upsert',
    partitionKey?: PartitionKey
  ): Promise<JSONObject> {
    // NOTE: (joey) yay Azure. have to use batch api as a workaround to support partition key for certain point operations
    // source: https://github.com/Azure/azure-sdk-for-js/issues/20824
    // NOTE: (joey) comment from person on CosmosDB eng team in this thread states that
    // if a partition key is provided, it is required to be in the object as well
    const response = await container.items.batch(
      [
        {
          operationType: operationType,
          resourceBody: item
        }
      ],
      partitionKey
    );

    if (response.result === undefined) {
      // NOTE: (joey) this should never happen, but just in case
      throw new IntegrationError(`${operationType} operation failed: no result returned`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const singleResult = response.result[0]; // since our workaround is using a batch, we only want the first result
    if (singleResult.resourceBody === undefined) {
      // failed. theres no error message in the response so we see if it's a code we know about and send codes that can help to debug
      let explanation = '';
      let code = ErrorCode.UNSPECIFIED;
      if (response.substatus) {
        [explanation, code] = this.explainCosmosDbStatus(response.substatus);
      }
      throw new IntegrationError(`${explanation} STATUS CODE: ${singleResult.statusCode}, SUBSTATUS: ${response.substatus}`, code, {
        pluginName: this.pluginName
      });
    }
    return singleResult.resourceBody;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getValidateSingleJsonItem(json: string): Record<any, any> {
    try {
      const validJson = JSON.parse(json.trim());
      if (Array.isArray(validJson)) {
        throw new IntegrationError(`Expected single JSON object, received array`, ErrorCode.INTEGRATION_LOGIC, {
          pluginName: this.pluginName
        });
      }
      return validJson;
    } catch (error) {
      throw new IntegrationError(`Validation of single JSON item failed: ${error.message}`, ErrorCode.INTEGRATION_SYNTAX, {
        pluginName: this.pluginName
      });
    }
  }

  private explainCosmosDbStatus(substatus: number): [string, ErrorCode] {
    // NOTE: (joey) Azure does not have a centralized place where it lists all substatuses and what they mean.
    // here's what I could find online:
    // https://learn.microsoft.com/en-us/rest/api/cosmos-db/http-status-codes-for-cosmosdb
    // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/troubleshoot-service-unavailable
    // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/troubleshoot-bad-request#:~:text=Solution%20The%20value%20of%20the,400%29%3B%20Substatus%3A%201001
    const substatusMap: { [key: number]: [string, ErrorCode] } = {
      1001: ["Given partition key value does not match the body's partition key value", ErrorCode.INTEGRATION_SYNTAX],
      1013: ['Collection create operation is in progress', ErrorCode.INTEGRATION_NETWORK], // TODO (jason4012) is this the correct code?
      4000: ['Failed to retrieve Azure AD token', ErrorCode.INTEGRATION_AUTHORIZATION],
      4001: ['Azure AD service is unavailable', ErrorCode.INTEGRATION_NETWORK],
      4002: ['Key Vault does not grant permission to Azure AD, or the key is disabled', ErrorCode.INTEGRATION_AUTHORIZATION],
      4003: ['Key is not found', ErrorCode.INTEGRATION_SYNTAX],
      4004: ['Key Vault service is unavailable', ErrorCode.INTEGRATION_NETWORK],
      4005: ['Unable to wrap or unwrap the key', ErrorCode.INTEGRATION_SYNTAX],
      4006: ['Key URL is invalid', ErrorCode.INTEGRATION_NETWORK],
      4007: ['Internal server error', ErrorCode.INTEGRATION_NETWORK],
      4008: ['Key Vault internal service error', ErrorCode.INTEGRATION_NETWORK],
      4009: ['Key Vault DNS name cannot be resolved', ErrorCode.INTEGRATION_NETWORK],
      20001: ['Client side connectivity issues', ErrorCode.INTEGRATION_NETWORK],
      20002: ['Client side timeouts', ErrorCode.INTEGRATION_QUERY_TIMEOUT],
      20003: ['Underlying I/O errors related to the operating system', ErrorCode.INTEGRATION_INTERNAL],
      20004: ["Client machine's CPU is overloaded", ErrorCode.INTEGRATION_RATE_LIMIT],
      20005: ["Client machine's thread pool is starved", ErrorCode.INTEGRATION_NETWORK],
      20006: ['Connection interrupted or terminated', ErrorCode.INTEGRATION_NETWORK]
    };

    // @ts-ignore
    return substatusMap[substatus] || (substatus >= 21001 ? 'Transient service condition' : '');
  }

  public getRequest(actionConfiguration: CosmosDbActionConfiguration): RawRequest {
    return undefined;
  }

  public dynamicProperties(): string[] {
    return [
      'connection.host',
      'connection.databaseId',
      'cosmosdbAction.value.action.value.containerId',
      'cosmosdbAction.value.containerId',
      'cosmosdbAction.value.action.value.partitionKey',
      'cosmosdbAction.value.action.value.query',
      'cosmosdbAction.value.action.value.id',
      'cosmosdbAction.value.action.value.partitionKey',
      'cosmosdbAction.value.action.value.body'
    ];
  }

  public async metadata(datasourceConfiguration: CosmosDbDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = await this.createConnection(datasourceConfiguration);
    const databaseId = datasourceConfiguration.connection?.databaseId;
    const database = client.database(databaseId ?? '');
    const { resources: containers } = await database.containers.readAll().fetchAll();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaContainers: any[] = [];
    for (const container of containers) {
      metaContainers.push({
        id: container.id,
        partitionKey: {
          paths: container.partitionKey?.paths as string[],
          kind: container.partitionKey?.kind as string,
          version: container.partitionKey?.version ?? null
        }
      });
    }

    const cosmosDbMetadata = CosmosDbPluginV1.Plugin_Metadata.fromJson({
      containers: metaContainers
    });
    return { cosmosdb: cosmosDbMetadata } as DatasourceMetadataDto;
  }

  public async test(datasourceConfiguration: CosmosDbDatasourceConfiguration): Promise<void> {
    const databaseId = datasourceConfiguration.connection?.databaseId;
    if (databaseId === undefined) {
      throw new IntegrationError('Test connection failed, databaseId not given.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    try {
      const cosmosClient = await this.createConnection(datasourceConfiguration);
      const database = cosmosClient.database(databaseId);
      await database.read();
    } catch (error) {
      throw this._handleError(error, 'Test connection failed');
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

    // based on https://www.bluematador.com/docs/troubleshooting/azure-cosmos-db-4xx-status-codes
    const errorCodeMap: Record<number, ErrorCode> = {
      400: ErrorCode.INTEGRATION_SYNTAX,
      401: ErrorCode.INTEGRATION_AUTHORIZATION,
      403: ErrorCode.INTEGRATION_AUTHORIZATION,
      404: ErrorCode.INTEGRATION_LOGIC,
      408: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
      409: ErrorCode.INTEGRATION_SYNTAX,
      413: ErrorCode.INTEGRATION_SYNTAX,
      429: ErrorCode.INTEGRATION_RATE_LIMIT
    };

    for (const key of Object.keys(errorCodeMap)) {
      if (((error as { code?: number })?.code ?? 0) === parseInt(key, 10)) {
        return new IntegrationError(message, errorCodeMap[parseInt(key, 10)], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { code?: number })?.code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
