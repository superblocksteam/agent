import {
  BasePlugin,
  DatasourceMetadataDto,
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
import { isEmpty } from 'lodash';
import { Document, FindCursor, MongoClient } from 'mongodb';

interface ParamNameValue {
  paramName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paramValue: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class BaseDBPlugin extends BasePlugin {
  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput
  }: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration>): Promise<undefined> {
    const client = await this.createClient(datasourceConfiguration);
    try {
      await client.connect();

      const databaseName = datasourceConfiguration.authentication?.custom?.databaseName?.value;
      if (!databaseName) {
        throw new IntegrationError(`Database name missing`);
      }
      const operation = actionConfiguration.action as MongoDBOperationType;
      const mdb = client.db(databaseName);
      const collection = actionConfiguration.resource ?? '';

      const params = this.getOpParams(operation, actionConfiguration).map((param) => param.paramValue);
      if ([MongoDBOperationType.find].includes(operation)) {
        const findCursor = this.runOperation(mdb.collection(collection), operation, params) as unknown as FindCursor<Document>;
        mutableOutput.output = await findCursor.toArray();
      } else {
        mutableOutput.output = await this.runOperation(mdb.collection(collection), operation, params);
      }
      return;
    } catch (err) {
      throw new IntegrationError(`MongoDB operation failed, ${err.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  getRequest(actionConfiguration: MongoDBActionConfiguration): RawRequest {
    const operation = actionConfiguration.action as MongoDBOperationType;
    const collection = actionConfiguration.resource ?? '';
    const opParams = this.getOpParams(operation, actionConfiguration);

    return this.formatRequest(operation, collection, opParams);
  }

  // The MongoDB client expects unspecified properties to be undefined rather than an empty string.
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
      const queryOptions = {
        sort: sortby,
        limit: limit,
        skip: skip,
        projection: projection
      };
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

  dynamicProperties(): string[] {
    return ['pipeline', 'projection', 'query', 'filter', 'sortby', 'field', 'document', 'replacement', 'options', 'update'];
  }

  escapeStringProperties(): string[] {
    return ['pipeline', 'projection', 'query', 'filter', 'sortby', 'field', 'document', 'replacement', 'options', 'update'];
  }

  async metadata(datasourceConfiguration: MongoDBDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = await this.createClient(datasourceConfiguration);
    try {
      await client.connect();

      const databaseName = datasourceConfiguration.authentication?.custom?.databaseName?.value;
      if (!databaseName) {
        throw new IntegrationError(`Database name missing`);
      }
      const mdb = client.db(databaseName);
      const collectionResults = mdb.listCollections();
      const collections = await collectionResults.toArray();
      const tables =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collections.map((collection: any) => {
          return {
            type: TableType.TABLE,
            name: collection.name,
            columns: []
          };
        }) ?? [];
      return {
        dbSchema: {
          tables: tables
        }
      };
    } catch (err) {
      throw new IntegrationError(`MongoDB listCollections operation failed, ${err.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  private async createClient(datasourceConfiguration: MongoDBDatasourceConfiguration): Promise<MongoClient> {
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not found for MongoDB');
    }
    try {
      const uri = datasourceConfiguration.endpoint?.host;
      if (!uri) {
        throw new IntegrationError('MongoDB connection URI not specified');
      }

      const client = new MongoClient(uri);
      return client;
    } catch (err) {
      throw new IntegrationError(`Failed to created MongoDB client, ${err.message}`);
    }
  }

  async test(datasourceConfiguration: MongoDBDatasourceConfiguration): Promise<void> {
    const client = await this.createClient(datasourceConfiguration);
    try {
      await client.connect();
    } catch (err) {
      throw new IntegrationError(`Test MongoDB connection failed, ${err.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private runOperation(mongoResource: any, operation: string | undefined, params: any[]): Promise<any> {
    if (!operation) {
      throw new IntegrationError(`No MongoDB operation specified`);
    }
    const fn = mongoResource[operation];
    if (typeof fn !== 'function') {
      throw new IntegrationError(`Invalid MongoDB operation ${operation}`);
    }

    return fn.apply(mongoResource, params);
  }
}
