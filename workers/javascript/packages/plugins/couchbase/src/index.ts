import {
  ClientWrapper,
  CouchbaseActionConfiguration,
  CouchbaseDatasourceConfiguration,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  safeEJSONParse,
  Schema,
  TableType
} from '@superblocks/shared';
import { SQLExecution } from '@superblocksteam/types/src/plugins/common/v1/plugin_pb';
import { Bucket, Cluster, Collection, CollectionManager, connect, Scope, ScopeSpec } from 'couchbase';
import { Client as ssh2Client } from 'ssh2';

export default class CouchbasePlugin extends DatabasePluginPooled<ClientWrapper<Cluster, ssh2Client>, CouchbaseDatasourceConfiguration> {
  pluginName = 'Couchbase';

  public async executePooled(
    {
      context,
      datasourceConfiguration,
      actionConfiguration,
      mutableOutput
    }: PluginExecutionProps<CouchbaseDatasourceConfiguration, CouchbaseActionConfiguration>,
    client: ClientWrapper<Cluster, ssh2Client>
  ): Promise<undefined> {
    const bucketName = datasourceConfiguration.connection?.bucket ?? '';
    const operation = actionConfiguration.couchbaseAction?.case;
    const executionOutput = new ExecutionOutput();
    const bucket = client.client.bucket(bucketName);
    let scope: Scope;
    let collection: Collection;
    try {
      switch (operation) {
        case 'insert': {
          scope = actionConfiguration.couchbaseAction?.value?.identifier?.scope
            ? bucket.scope(actionConfiguration.couchbaseAction?.value?.identifier?.scope)
            : bucket.defaultScope();
          collection = actionConfiguration.couchbaseAction?.value?.identifier?.collection
            ? scope.collection(actionConfiguration.couchbaseAction?.value?.identifier?.collection)
            : bucket.defaultCollection();
          executionOutput.output = (
            await collection.insert(
              actionConfiguration.couchbaseAction?.value?.key ?? '',
              safeEJSONParse(actionConfiguration.couchbaseAction?.value?.value ?? '', this.logger)
            )
          ).cas;
          break;
        }
        case 'get': {
          scope = actionConfiguration.couchbaseAction?.value?.identifier?.scope
            ? bucket.scope(actionConfiguration.couchbaseAction?.value?.identifier?.scope)
            : bucket.defaultScope();
          collection = actionConfiguration.couchbaseAction?.value?.identifier?.collection
            ? scope.collection(actionConfiguration.couchbaseAction?.value?.identifier?.collection)
            : bucket.defaultCollection();
          executionOutput.output = (await collection.get(actionConfiguration.couchbaseAction?.value?.key ?? '')).value;
          break;
        }
        case 'remove': {
          scope = actionConfiguration.couchbaseAction?.value?.identifier?.scope
            ? bucket.scope(actionConfiguration.couchbaseAction?.value?.identifier?.scope)
            : bucket.defaultScope();
          collection = actionConfiguration.couchbaseAction?.value?.identifier?.collection
            ? scope.collection(actionConfiguration.couchbaseAction?.value?.identifier?.collection)
            : bucket.defaultCollection();
          executionOutput.output = (await collection.remove(actionConfiguration.couchbaseAction?.value?.key ?? '')).cas;
          break;
        }
        case 'runSql': {
          // this is compatible with positional parameters e.g. $1 $2
          const preparedStatementContext = { parameters: context.preparedStatementContext };
          executionOutput.output = (
            await this.executeQuery(() =>
              (client.client as Cluster).query(
                (actionConfiguration?.couchbaseAction?.value as SQLExecution)?.sqlBody,
                preparedStatementContext
              )
            )
          ).rows;
          break;
        }
      }
    } catch (err) {
      throw this._handleError(err, 'Operation failed');
    }
    mutableOutput.output = executionOutput.output;
    return;
  }

  public async metadata(datasourceConfiguration: CouchbaseDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const bucketName = datasourceConfiguration.connection?.bucket ?? '';
    if (!bucketName) {
      throw new IntegrationError('Bucket name missing', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (e) {
      throw this._handleError(e, 'Metadata connection failed');
    }
    try {
      const bucket: Bucket = client.client.bucket(bucketName);
      const collectionResults: CollectionManager = bucket.collections();

      // treat scope --> schema, collection --> database here
      const collectionScopes: ScopeSpec[] = await collectionResults.getAllScopes();
      const schemas: Schema[] = collectionScopes.map((collectionScope: ScopeSpec) => new Schema(collectionScope.name));
      const tables =
        collectionScopes
          .map((collectionScope: ScopeSpec) =>
            collectionScope.collections.map((collection: { name: string }) => {
              return {
                type: TableType.COLLECTION,
                schema: collectionScope.name,
                name: collection.name,
                columns: []
              };
            })
          )
          ?.flat() ?? [];
      return {
        dbSchema: {
          schemas,
          tables: tables
        }
      };
    } catch (err) {
      throw this._handleError(err, 'Metadata operation failed');
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  dynamicProperties(): string[] {
    return ['runSql.sqlBody'];
  }

  @DestroyConnection
  protected async destroyConnection(connection: ClientWrapper<Cluster, ssh2Client>): Promise<void> {
    await connection.client?.close();
    connection.tunnel?.end();
  }

  @CreateConnection
  protected async createConnection(datasourceConfiguration: CouchbaseDatasourceConfiguration): Promise<ClientWrapper<Cluster, ssh2Client>> {
    let tunnel: ssh2Client | null = null;
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not found', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    try {
      const uri = datasourceConfiguration.endpoint?.host;
      if (!uri) {
        throw new IntegrationError('Connection URL not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }

      // The final endpoint might actually be overwritten by an SSH tunnel.
      const finalEndpoint: { host?: string; port?: number } = {
        host: datasourceConfiguration.endpoint?.host,
        port: datasourceConfiguration.endpoint?.port
      };
      if (datasourceConfiguration.tunnel && datasourceConfiguration.tunnel.enabled) {
        try {
          const tunneledAddress = await super.createTunnel(datasourceConfiguration);
          finalEndpoint.host = tunneledAddress?.host;
          finalEndpoint.port = tunneledAddress?.port;
          tunnel = tunneledAddress?.client;
        } catch (e) {
          throw new IntegrationError(`SSH tunnel connection failed for ${this.pluginName}: ${e.message}`, e.code, {
            pluginName: this.pluginName
          });
        }
      }

      const options = {
        username: datasourceConfiguration.connection?.user,
        password: datasourceConfiguration.connection?.password
      };

      const cluster: Cluster = await connect(
        this.getConnectionStringFromDatasourceConfiguration(datasourceConfiguration, finalEndpoint),
        options
      );
      return { client: cluster, tunnel };
    } catch (err) {
      throw this._handleError(err, 'Failed to create Couchbase connection');
    }
  }

  public async test(datasourceConfiguration: CouchbaseDatasourceConfiguration): Promise<void> {
    const client = await this.createConnection(datasourceConfiguration);
    await client.client.buckets().getAllBuckets();
    this.destroyConnection(client).catch(() => {
      // Error handling is done in the decorator
    });
  }

  public getConnectionStringFromDatasourceConfiguration(
    datasourceConfiguration: CouchbaseDatasourceConfiguration,
    tunnelInfo: { host?: string; port?: number }
  ): string {
    if (datasourceConfiguration.connection?.url) {
      return datasourceConfiguration.connection?.url;
    }
    return `couchbase${datasourceConfiguration.connection?.useTls ? 's' : ''}://${tunnelInfo?.host}:${tunnelInfo?.port}`;
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

    // based on https://docs.couchbase.com/nodejs-sdk/current/ref/error-codes.html#shared-error-definitions
    const errorCodeMap: Record<number, ErrorCode> = {
      0: ErrorCode.INTEGRATION_INTERNAL,
      1: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
      2: ErrorCode.INTEGRATION_NETWORK,
      3: ErrorCode.INTEGRATION_SYNTAX,
      4: ErrorCode.INTEGRATION_NETWORK,
      5: ErrorCode.INTEGRATION_INTERNAL,
      6: ErrorCode.INTEGRATION_AUTHORIZATION,
      7: ErrorCode.INTEGRATION_NETWORK,
      8: ErrorCode.INTEGRATION_SYNTAX,
      9: ErrorCode.INTEGRATION_SYNTAX,
      10: ErrorCode.INTEGRATION_SYNTAX,
      11: ErrorCode.INTEGRATION_SYNTAX,
      12: ErrorCode.INTEGRATION_SYNTAX,
      13: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
      14: ErrorCode.INTEGRATION_USER_CANCELLED,
      15: ErrorCode.INTEGRATION_INTERNAL,
      16: ErrorCode.INTEGRATION_SYNTAX,
      17: ErrorCode.INTEGRATION_SYNTAX,
      18: ErrorCode.INTEGRATION_SYNTAX,
      19: ErrorCode.INTEGRATION_SYNTAX,
      20: ErrorCode.INTEGRATION_SYNTAX
    };

    for (const key of Object.keys(errorCodeMap)) {
      if (((error as { cause?: { code?: number } })?.cause?.code ?? 0) === parseInt(key, 10)) {
        return new IntegrationError(message, errorCodeMap[parseInt(key, 10)], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { cause?: { code?: number } })?.cause?.code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
