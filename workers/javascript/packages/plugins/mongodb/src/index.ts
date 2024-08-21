import {
  ClientWrapper,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  jsonPrettyPrint,
  MongoDBActionConfiguration,
  MongoDBDatasourceConfiguration,
  MongoDBOperationType,
  PluginExecutionProps,
  RawRequest,
  safeEJSONParse,
  TableType
} from '@superblocks/shared';
import { cloneDeep, isEmpty } from 'lodash';
import { Document, FindCursor, MongoClient, MongoClientOptions } from 'mongodb';
import { Client as ssh2Client } from 'ssh2';

interface ParamNameValue {
  paramName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paramValue: any;
}

export default class MongoDBPlugin extends DatabasePluginPooled<ClientWrapper<MongoClient, ssh2Client>, MongoDBDatasourceConfiguration> {
  pluginName = 'MongoDB';

  async execute(
    executionProps: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration>
  ): Promise<ExecutionOutput | undefined> {
    const databaseName = executionProps.datasourceConfiguration.authentication?.custom?.databaseName?.value;
    if (!databaseName) {
      throw new IntegrationError('Database name missing', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    return super.execute(executionProps);
  }

  public async executePooled(
    {
      context,
      datasourceConfiguration,
      actionConfiguration
    }: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration>,
    client: ClientWrapper<MongoClient, ssh2Client>
  ): Promise<ExecutionOutput> {
    const databaseName = datasourceConfiguration.authentication?.custom?.databaseName?.value;
    const operation = actionConfiguration.action as MongoDBOperationType;
    const ret = new ExecutionOutput();
    const collection = actionConfiguration.resource ?? '';
    const params = this.getOpParams(operation, actionConfiguration).map((param) => param.paramValue);

    try {
      const mdb = client.client.db(databaseName);
      ret.output = await this.executeQuery(() => {
        if (operation === MongoDBOperationType.listCollections) {
          return mdb.listCollections().toArray();
        } else if ([MongoDBOperationType.find, MongoDBOperationType.aggregate].includes(operation)) {
          const findCursor = this.runOperation(mdb.collection(collection), operation, params) as unknown as FindCursor<Document>;
          return findCursor.toArray();
        } else {
          return this.runOperation(mdb.collection(collection), operation, params);
        }
      });
      return ret;
    } catch (err) {
      throw this._handleError(err, 'Operation failed');
    }
  }

  public getRequest(actionConfiguration: MongoDBActionConfiguration): RawRequest {
    const operation = actionConfiguration.action as MongoDBOperationType;
    const collection = actionConfiguration.resource ?? '';
    const opParams = this.getOpParams(operation, actionConfiguration);

    return this.formatRequest(operation, collection, opParams);
  }

  // The MongoDB client expects unspecified properties to be undefined rather
  // than an empty string.
  private safeJSONParse(json: string | undefined): Record<string, unknown> | string | undefined {
    if (!json || isEmpty(json)) {
      return undefined;
    }
    return safeEJSONParse(json, this.logger);
  }

  private formatRequest(operation: string, collection: string, opParams: ParamNameValue[]): string {
    const params = opParams.reduce((accString: string, curParam: ParamNameValue) => {
      const opValue = jsonPrettyPrint(curParam.paramValue);
      return `${accString}\n${curParam.paramName}: ${opValue}`;
    }, '');
    return `Operation: ${operation}\n\nCollection: ${collection}\n\nParameters:${params}`;
  }

  private getOpParams(operation: MongoDBOperationType, actionConfiguration: MongoDBActionConfiguration): ParamNameValue[] {
    // TODO: Convert to switch.
    if ([MongoDBOperationType.aggregate].includes(operation)) {
      const pipeline = this.safeJSONParse(actionConfiguration.pipeline);
      const options = this.safeJSONParse(actionConfiguration.options);
      return [
        { paramName: 'Pipeline', paramValue: pipeline },
        { paramName: 'Options', paramValue: options }
      ];
    } else if ([MongoDBOperationType.count].includes(operation)) {
      const query = this.safeJSONParse(actionConfiguration.query);
      const options = this.safeJSONParse(actionConfiguration.options);
      return [
        { paramName: 'Query', paramValue: query },
        { paramName: 'Options', paramValue: options }
      ];
    } else if ([MongoDBOperationType.deleteOne, MongoDBOperationType.deleteMany].includes(operation)) {
      const filter = this.safeJSONParse(actionConfiguration.filter);
      return [{ paramName: 'Filter', paramValue: filter }];
    } else if ([MongoDBOperationType.distinct].includes(operation)) {
      const field = actionConfiguration.field;
      const query = this.safeJSONParse(actionConfiguration.query);
      const options = this.safeJSONParse(actionConfiguration.options);
      return [
        { paramName: 'Field', paramValue: field },
        { paramName: 'Query', paramValue: query },
        { paramName: 'Options', paramValue: options }
      ];
    } else if ([MongoDBOperationType.find].includes(operation)) {
      const query = this.safeJSONParse(actionConfiguration.query);
      const projection = this.safeJSONParse(actionConfiguration.projection);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sortby = this.safeJSONParse(actionConfiguration.sortby) as any;
      const limit = actionConfiguration.limit && Number(actionConfiguration.limit);
      const skip = actionConfiguration.skip && Number(actionConfiguration.skip);
      const queryOptions = { sort: sortby, limit: limit, skip: skip, projection: projection };
      return [
        { paramName: 'Query', paramValue: query },
        { paramName: 'Query options', paramValue: queryOptions }
      ];
    } else if ([MongoDBOperationType.findOne].includes(operation)) {
      const query = this.safeJSONParse(actionConfiguration.query);
      const projection = this.safeJSONParse(actionConfiguration.projection);
      return [
        { paramName: 'Query', paramValue: query },
        { paramName: 'Projection', paramValue: projection }
      ];
    } else if ([MongoDBOperationType.insertOne, MongoDBOperationType.insertMany].includes(operation)) {
      const document = this.safeJSONParse(actionConfiguration.document);
      return [{ paramName: 'Document', paramValue: document }];
    } else if ([MongoDBOperationType.listCollections].includes(operation)) {
      const filter = this.safeJSONParse(actionConfiguration.filter);
      return [{ paramName: 'Filter', paramValue: filter }];
    } else if ([MongoDBOperationType.replaceOne].includes(operation)) {
      const filter = this.safeJSONParse(actionConfiguration.filter);
      const replacement = this.safeJSONParse(actionConfiguration.replacement);
      const options = this.safeJSONParse(actionConfiguration.options);
      return [
        { paramName: 'Filter', paramValue: filter },
        { paramName: 'Replacement', paramValue: replacement },
        { paramName: 'Options', paramValue: options }
      ];
    } else if ([MongoDBOperationType.updateOne, MongoDBOperationType.updateMany].includes(operation)) {
      const filter = this.safeJSONParse(actionConfiguration.filter);
      const update = this.safeJSONParse(actionConfiguration.update);
      const options = this.safeJSONParse(actionConfiguration.options);
      return [
        { paramName: 'Filter', paramValue: filter },
        { paramName: 'Update', paramValue: update },
        { paramName: 'Options', paramValue: options }
      ];
    }

    return [];
  }

  public dynamicProperties(): string[] {
    return [
      'pipeline',
      'projection',
      'query',
      'filter',
      'sortby',
      'field',
      'document',
      'replacement',
      'options',
      'update',
      'skip',
      'limit',
      'resource'
    ];
  }

  escapeStringProperties(): string[] {
    return ['pipeline', 'projection', 'query', 'filter', 'sortby', 'field', 'document', 'replacement', 'options', 'update'];
  }

  public async metadata(datasourceConfiguration: MongoDBDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const databaseName = datasourceConfiguration.authentication?.custom?.databaseName?.value;
    if (!databaseName) {
      throw new IntegrationError('Database name missing', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    const client = await this.createConnection(datasourceConfiguration);
    try {
      const mdb = client.client.db(databaseName);

      const collectionResults = await this.executeQuery(async () => {
        return mdb.listCollections();
      });
      const collections = await this.executeQuery(async () => {
        return collectionResults.toArray();
      });
      const tables =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collections.map((collection: any) => {
          return {
            type: TableType.TABLE,
            name: collection.name,
            columns: []
          };
        }) ?? [];
      return { dbSchema: { tables: tables } };
    } catch (err) {
      throw this._handleError(err, 'listCollections operation failed');
    } finally {
      if (client.client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @DestroyConnection
  protected async destroyConnection(connection: ClientWrapper<MongoClient, ssh2Client>): Promise<void> {
    await connection.client.close();
    connection.tunnel?.end();
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: MongoDBDatasourceConfiguration
  ): Promise<ClientWrapper<MongoClient, ssh2Client>> {
    let tunnel: ssh2Client | null = null;
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not found for MongoDB', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    try {
      if (!datasourceConfiguration.endpoint?.host) {
        throw new IntegrationError('Connection URI not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }

      const databaseName = datasourceConfiguration?.authentication?.custom?.databaseName?.value;
      if (!databaseName) {
        throw new IntegrationError('database name not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }
      // The final endpoint might actually be overwritten by an SSH tunnel.
      // attempt to extract the port from the host connection string, otherwise
      // default to 27017 (MongoDB default port)

      const finalEndpoint = {
        host: datasourceConfiguration.endpoint?.host,
        port: 27017
      };
      if (datasourceConfiguration.tunnel && datasourceConfiguration.tunnel.enabled) {
        try {
          const clonedDatasourceConfig = cloneDeep(datasourceConfiguration);
          if (clonedDatasourceConfig.endpoint) {
            clonedDatasourceConfig.endpoint.host = this.extractUrlFromConnectionString(datasourceConfiguration.endpoint?.host);
            clonedDatasourceConfig.endpoint.port = this.extractPortFromConnectionString(datasourceConfiguration.endpoint?.host);
          }
          const tunneledAddress = await super.createTunnel(clonedDatasourceConfig);
          finalEndpoint.host = this.injectUrlAndPortIntoConnectionString(
            datasourceConfiguration.endpoint?.host,
            tunneledAddress?.host as string,
            tunneledAddress?.port as number
          );
          tunnel = tunneledAddress?.client;
        } catch (e) {
          throw this._handleError(e, 'SSH tunnel connection failed');
        }
      }

      const options = {} as MongoClientOptions;
      if (datasourceConfiguration.connection?.useSelfSignedSsl) {
        options.tls = true;
        options.ca = datasourceConfiguration.connection?.ca;
        options.cert = datasourceConfiguration.connection?.cert;
        options.key = datasourceConfiguration.connection?.key;
      }
      const client = new MongoClient(finalEndpoint.host, options);
      await client.connect();
      // ensure the given database exists
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases();
      if (!databases.some((item) => item.name === databaseName)) {
        await client.close();
        throw this._handleError(new IntegrationError('db does not exist', ErrorCode.INTEGRATION_AUTHORIZATION), 'db does not exist');
      }
      return { client, tunnel };
    } catch (err) {
      throw this._handleError(err, 'Failed to created client');
    }
  }

  public async test(datasourceConfiguration: MongoDBDatasourceConfiguration): Promise<void> {
    const client = await this.createConnection(datasourceConfiguration);
    this.destroyConnection(client).catch(() => {
      // Error handling is done in the decorator
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private runOperation(mongoResource: any, operation: string | undefined, params: any[]): Promise<any> {
    if (!operation) {
      throw new IntegrationError('No operation specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    const fn = mongoResource[operation];
    if (typeof fn !== 'function') {
      throw new IntegrationError(`Invalid operation ${operation}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    return fn.apply(mongoResource, params);
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

    // TODO (jason4012) include more error codes
    // taken from
    // https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.yml
    // and https://www.mongodb.com/docs/manual/reference/error-codes/
    const authCodes: number[] = [11, 13];
    const syntaxCodes: number[] = [2, 4, 5, 9, 12];
    const networkCodes: number[] = [6];
    const internalCodes: number[] = [1, 8];

    const code = (error as { code?: number })?.code ?? -1;
    if (authCodes.includes(code)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
    } else if (syntaxCodes.includes(code)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (networkCodes.includes(code)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
    } else if (internalCodes.includes(code)) {
      return new IntegrationError(message, ErrorCode.INTEGRATION_INTERNAL, { pluginName: this.pluginName });
    }

    // there was no code, try matching using error message matching
    const errorCodeMap: Record<string, ErrorCode> = {
      MongoParseError: ErrorCode.INTEGRATION_AUTHORIZATION
    };

    for (const key of Object.keys(errorCodeMap)) {
      if ((error as { stack?: string })?.stack?.includes(key)) {
        return new IntegrationError(message, errorCodeMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { stack?: string })?.stack,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }

  public extractPortFromConnectionString(connectionString: string): number {
    // assume that the connection string is in the format:
    // mongodb+srv://user:pass@subdomain.url<OPTIONAL [:27017]>/?param1&param2
    const urlAndRest = connectionString.substring(connectionString.indexOf('@') + 1);
    const domainAndPort = urlAndRest.substring(0, urlAndRest.indexOf('/'));

    if (!domainAndPort.includes(':')) {
      return 27017;
    }

    const parsedPort = parseInt(domainAndPort.substring(domainAndPort.indexOf(':') + 1), 10);
    if (!isNaN(parsedPort)) {
      return parsedPort;
    }

    throw new IntegrationError('Invalid connection string, could not extract port', ErrorCode.INTEGRATION_SYNTAX, {
      pluginName: this.pluginName
    });
  }

  public extractUrlFromConnectionString(connectionString: string): string {
    // assume that the connection string is in the format:
    // mongodb+srv://user:pass@subdomain.url<OPTIONAL [:27017]>/?param1&param2
    const urlAndRest = connectionString.substring(connectionString.indexOf('@') + 1);
    const domainAndPort = urlAndRest.substring(0, urlAndRest.indexOf('/'));

    if (!domainAndPort.includes(':')) {
      return domainAndPort;
    }

    return domainAndPort.split(':')[0];
  }

  public injectUrlAndPortIntoConnectionString(connectionString: string, newUrl: string, newPort: number): string {
    // assume that the connection string is in the format:
    // mongodb+srv://user:pass@subdomain.url<OPTIONAL [:27017]>/?param1&param2
    let upToAt = connectionString.substring(0, connectionString.indexOf('@') + 1);
    if (upToAt.startsWith('mongodb+srv')) {
      upToAt = `mongodb${upToAt.substring(11)}`;
    }
    const afterAt = connectionString.substring(connectionString.indexOf('@') + 1);
    const afterPort = afterAt.substring(afterAt.indexOf('/'));
    return `${upToAt}${newUrl}:${newPort}${afterPort}`;
  }
}
