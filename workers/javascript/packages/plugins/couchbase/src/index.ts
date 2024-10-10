import {
  ClientWrapper,
  CouchbaseActionConfiguration,
  CouchbaseDatasourceConfiguration,
  SSHTunnelConfig,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  safeEJSONParse
} from '@superblocks/shared';
import { CouchbasePluginV1, PluginCommonV1 } from '@superblocksteam/types';
import { Bucket, Cluster, Collection, CollectionManager, connect, Scope, ScopeSpec } from 'couchbase';
import { Client as ssh2Client } from 'ssh2';
import { getConnectionOptionsFromDatasourceConfiguration, getConnectionStringFromDatasourceConfiguration } from './utils';

export default class CouchbasePlugin extends DatabasePluginPooled<ClientWrapper<Cluster, ssh2Client>, CouchbaseDatasourceConfiguration> {
  pluginName = 'Couchbase';

  public async executePooled(
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<CouchbaseDatasourceConfiguration, CouchbaseActionConfiguration>,
    client: ClientWrapper<Cluster, ssh2Client>
  ): Promise<undefined> {
    const operation = actionConfiguration.couchbaseAction?.case;
    const executionOutput = new ExecutionOutput();
    const bucket = client.client.bucket(actionConfiguration.bucketName);
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
                (actionConfiguration?.couchbaseAction?.value as PluginCommonV1.SQLExecution)?.sqlBody,
                preparedStatementContext
              )
            )
          ).rows;
          break;
        }
        default: {
          throw new IntegrationError(`invalid operation: ${operation}`);
        }
      }
    } catch (err) {
      throw this._handleError(err, 'Operation failed');
    }
    mutableOutput.output = executionOutput.output;
    return;
  }

  public async metadata(datasourceConfiguration: CouchbaseDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (e) {
      throw this._handleError(e, 'Metadata connection failed');
    }
    try {
      const metadata = { buckets: [] };
      const buckets = await client.client.buckets().getAllBuckets();
      for (const bucket of buckets) {
        const metadataBucketObj = { name: bucket.name, scopes: [] };
        const clientBucket: Bucket = client.client.bucket(bucket.name);
        const collectionResults: CollectionManager = clientBucket.collections();
        const collectionScopes: ScopeSpec[] = await collectionResults.getAllScopes();
        for (const collectionScope of collectionScopes) {
          const metadataScopeObj = { name: collectionScope.name, collections: [] };
          for (const collection of collectionScope.collections) {
            metadataScopeObj.collections.push({ name: collection.name });
          }
          metadataBucketObj.scopes.push(metadataScopeObj);
        }
        metadata.buckets.push(metadataBucketObj);
      }

      return { couchbase: metadata as CouchbasePluginV1.Metadata };
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
      // The final endpoint might be overwritten by an SSH tunnel.
      let sshTunnelConfig: SSHTunnelConfig;
      if (datasourceConfiguration.tunnel && datasourceConfiguration.tunnel.enabled) {
        // we are using an SSH tunnel
        try {
          sshTunnelConfig = await super.createTunnel(datasourceConfiguration);
          tunnel = sshTunnelConfig?.client;
        } catch (e) {
          throw new IntegrationError(`SSH tunnel connection failed for ${this.pluginName}: ${e.message}`, e.code, {
            pluginName: this.pluginName
          });
        }
      }

      const cluster: Cluster = await connect(
        getConnectionStringFromDatasourceConfiguration(datasourceConfiguration, sshTunnelConfig),
        getConnectionOptionsFromDatasourceConfiguration(datasourceConfiguration)
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
