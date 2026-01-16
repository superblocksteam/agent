import { ExecutionOutput } from '@superblocks/shared';
import {
  BindingType,
  ExecuteRequest,
  MetadataRequest,
  MetadataResponse,
  PreDeleteRequest,
  StreamRequest,
  TestRequest
} from '@superblocks/worker.js';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { Variables } from './types/api/v1/blocks_pb';
import { OutputOld } from './types/api/v1/event_pb';
import { MetadataResponse as ApiMetadataResponse } from './types/api/v1/service_pb';
import { Error as ProtoError } from './types/common/v1/errors_pb';
import { Plugin as AdlsPlugin } from './types/plugins/adls/v1/plugin_pb';
import { Plugin as CosmosdbPlugin } from './types/plugins/cosmosdb/v1/plugin_pb';
import { Metadata as CouchbaseMetadata } from './types/plugins/couchbase/v1/plugin_pb';
import { Metadata as KafkaMetadata, Topic as KafkaTopic, Broker as KafkaBroker } from './types/plugins/kafka/v1/plugin_pb';
import { Metadata as KinesisMetadata } from './types/plugins/kinesis/v1/plugin_pb';
import { Plugin as SalesforcePlugin } from './types/plugins/salesforce/v1/plugin_pb';
import { Response as ProtoTransportResponse } from './types/transport/v1/transport_pb';
import {
  ExecuteRequest as ProtoExecuteRequest,
  ExecuteResponse as ProtoExecuteResponse,
  StreamRequest as ProtoStreamRequest,
  StreamResponse as ProtoStreamResponse,
  MetadataRequest as ProtoMetadataRequest,
  TestRequest as ProtoTestRequest,
  PreDeleteRequest as ProtoPreDeleteRequest,
  StructuredLog as ProtoStructuredLog
} from './types/worker/v1/sandbox_transport_pb';

export class StreamOutput {
  output: ExecutionOutput;
}

export type ProtoRequest = ProtoExecuteRequest | ProtoStreamRequest | ProtoMetadataRequest | ProtoTestRequest | ProtoPreDeleteRequest;
export type ProtoResponse = ProtoExecuteResponse | ProtoStreamResponse | ProtoTransportResponse.Data.Data;

export type NativeRequest = ExecuteRequest | StreamRequest | MetadataRequest | TestRequest | PreDeleteRequest;
export type NativeResponse = ExecutionOutput | StreamOutput | MetadataResponse;

// Convert protobuf Variable.Type enum (number) to string expected by buildVariables
function variableTypeToString(type: Variables.Type): string {
  switch (type) {
    case Variables.Type.TYPE_SIMPLE:
      return 'TYPE_SIMPLE';
    case Variables.Type.TYPE_ADVANCED:
      return 'TYPE_ADVANCED';
    case Variables.Type.TYPE_NATIVE:
      return 'TYPE_NATIVE';
    case Variables.Type.TYPE_FILEPICKER:
      return 'TYPE_FILEPICKER';
    default:
      return 'TYPE_UNSPECIFIED';
  }
}

// Convert protobuf Variable.Mode enum (number) to string expected by buildVariables
function variableModeToString(mode: Variables.Mode): string {
  switch (mode) {
    case Variables.Mode.MODE_READWRITE:
      return 'MODE_READWRITE';
    case Variables.Mode.MODE_READ:
      return 'MODE_READ';
    default:
      return 'MODE_UNSPECIFIED';
  }
}

export interface MessageTransformer {
  protoRequestToNative(request: ProtoRequest): NativeRequest;
  nativeResponseToProto(response: NativeResponse): ProtoResponse;
}

export class MessageTransformerImpl implements MessageTransformer {
  public protoRequestToNative(request: ProtoExecuteRequest): ExecuteRequest;
  public protoRequestToNative(request: ProtoStreamRequest): StreamRequest;
  public protoRequestToNative(request: ProtoMetadataRequest): MetadataRequest;
  public protoRequestToNative(request: ProtoTestRequest): TestRequest;
  public protoRequestToNative(request: ProtoPreDeleteRequest): PreDeleteRequest;
  public protoRequestToNative(request: ProtoRequest): NativeRequest {
    switch (true) {
      case request instanceof ProtoExecuteRequest:
        return this.protoToExecuteRequest(request);
      case request instanceof ProtoStreamRequest:
        return this.protoToStreamRequest(request);
      case request instanceof ProtoMetadataRequest:
        return this.protoToMetadataRequest(request);
      case request instanceof ProtoTestRequest:
        return this.protoToTestRequest(request);
      case request instanceof ProtoPreDeleteRequest:
        return this.protoToPreDeleteRequest(request);
      default:
        throw new Error('Invalid request type');
    }
  }

  public nativeResponseToProto(response: ExecutionOutput): ProtoExecuteResponse;
  public nativeResponseToProto(response: StreamOutput): ProtoStreamResponse;
  public nativeResponseToProto(response: MetadataResponse): ProtoTransportResponse.Data.Data;
  public nativeResponseToProto(response: NativeResponse): ProtoResponse {
    switch (true) {
      case response instanceof ExecutionOutput:
        return this.executionOutputToProto(response);
      case response instanceof StreamOutput:
        return this.streamOutputToProto(response);
      default:
        // MetadataResponse is a type alias (not a class), so we handle it as the default case
        return this.metadataResponseToProto(response as MetadataResponse);
    }
  }

  private protoToExecuteRequest(request: ProtoExecuteRequest): ExecuteRequest {
    const protoProps = request.getProps();
    const protoQuotas = request.getQuotas();
    const protoPinned = request.getPinned();

    return {
      props: protoProps
        ? {
            actionConfiguration: protoProps.getActionConfiguration()?.toJavaScript(),
            datasourceConfiguration: protoProps.getDatasourceConfiguration()?.toJavaScript(),
            redactedDatasourceConfiguration: protoProps.getRedactedDatasourceConfiguration()?.toJavaScript(),
            executionId: protoProps.getExecutionId(),
            stepName: protoProps.getStepName(),
            environment: protoProps.getEnvironment(),
            bindingKeys: protoProps.getBindingKeysList().map((b) => ({
              key: b.getKey(),
              type: b.getType() as BindingType
            })),
            variables: Object.fromEntries(
              [...protoProps.getVariablesMap().entries()].map(([key, variable]) => [
                key,
                {
                  key: variable.getKey(),
                  type: variableTypeToString(variable.getType()),
                  mode: variableModeToString(variable.getMode())
                }
              ])
            ),
            $fileServerUrl: protoProps.getFileserverurl(),
            files: protoProps.getFilesList().map((f) => ({
              fieldname: f.getFieldname(),
              originalname: f.getOriginalname(),
              encoding: f.getEncoding(),
              mimetype: f.getMimetype(),
              size: f.getSize(),
              destination: f.getDestination(),
              filename: f.getFilename(),
              path: f.getPath(),
              buffer: f.getBuffer_asU8()
            })),
            render: protoProps.getRender(),
            useWasmBindingsSandbox: protoProps.getUseWasmBindingsSandbox(),
            version: protoProps.getVersion()
          }
        : {},
      quotas: protoQuotas
        ? {
            size: protoQuotas.getSize(),
            duration: protoQuotas.getDuration()
          }
        : undefined,
      baggage: protoPinned
        ?.getObservability()
        ?.getBaggageMap()
        ?.toObject()
        ?.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<string, string>)
    };
  }

  private protoToStreamRequest(request: ProtoStreamRequest): StreamRequest {
    const protoExecuteRequest = request.getRequest();
    if (!protoExecuteRequest) {
      throw new Error('Invalid request type');
    }

    return {
      ...this.protoToExecuteRequest(protoExecuteRequest)
    };
  }

  private protoToMetadataRequest(request: ProtoMetadataRequest): MetadataRequest {
    return {
      dConfig: request.getDatasourceconfig()?.toJavaScript() ?? {},
      aConfig: request.getActionconfig()?.toJavaScript() ?? {}
    };
  }

  private protoToTestRequest(request: ProtoTestRequest): TestRequest {
    return {
      dConfig: request.getDatasourceconfig()?.toJavaScript() ?? {},
      aConfig: request.getActionconfig()?.toJavaScript()
    };
  }

  private protoToPreDeleteRequest(request: ProtoPreDeleteRequest): PreDeleteRequest {
    return {
      dConfig: request.getDatasourceconfig()?.toJavaScript() ?? {}
    };
  }

  private executionOutputToProto(response: ExecutionOutput): ProtoExecuteResponse {
    const protoResponse = new ProtoExecuteResponse();

    // Set error if present
    if (response.error) {
      const protoError = new ProtoError();
      protoError.setMessage(response.error);
      protoResponse.setError(protoError);
    }

    // Set auth error
    if (response.authError !== undefined) {
      protoResponse.setAutherror(response.authError);
    }

    // Set children
    if (response.children) {
      protoResponse.setChildrenList(response.children);
    }

    // Set start time
    if (response.startTimeUtc) {
      const timestamp = new Timestamp();
      timestamp.fromDate(response.startTimeUtc);
      protoResponse.setStarttime(timestamp);
    }

    // Set execution time (convert milliseconds to Duration)
    if (response.executionTime !== undefined) {
      const duration = new Duration();
      const seconds = Math.floor(response.executionTime / 1000);
      const nanos = (response.executionTime % 1000) * 1000000;
      duration.setSeconds(seconds);
      duration.setNanos(nanos);
      protoResponse.setExecutiontime(duration);
    }

    // Set structured logs
    if (response.structuredLog && response.structuredLog.length > 0) {
      const protoLogs = response.structuredLog.map((log) => {
        const protoLog = new ProtoStructuredLog();
        protoLog.setMessage(log.msg);
        switch (log.level) {
          case 'info':
            protoLog.setLevel(ProtoStructuredLog.Level.LEVEL_INFO);
            break;
          case 'warn':
            protoLog.setLevel(ProtoStructuredLog.Level.LEVEL_WARN);
            break;
          case 'error':
            protoLog.setLevel(ProtoStructuredLog.Level.LEVEL_ERROR);
            break;
          default:
            protoLog.setLevel(ProtoStructuredLog.Level.LEVEL_UNSPECIFIED);
        }
        return protoLog;
      });
      protoResponse.setStructuredlogList(protoLogs);
    }

    // Set output (OutputOld message)
    const outputOld = new OutputOld();

    // Set the output value
    if (response.output !== undefined) {
      const outputValue = google_protobuf_struct_pb.Value.fromJavaScript(response.output);
      outputOld.setOutput(outputValue);
    }

    // Set the log list
    if (response.log && response.log.length > 0) {
      outputOld.setLogList(response.log);
    }

    // Set the request
    if (response.request) {
      outputOld.setRequest(response.request);
    }

    // Set placeholders info
    if (response.placeholdersInfo) {
      const placeholdersValue = google_protobuf_struct_pb.Value.fromJavaScript(response.placeholdersInfo);
      outputOld.setPlaceHoldersInfo(placeholdersValue);
    }

    protoResponse.setOutput(outputOld);

    return protoResponse;
  }

  private streamOutputToProto(response: StreamOutput): ProtoStreamResponse {
    return new ProtoStreamResponse();
  }

  private metadataResponseToProto(response: MetadataResponse): ProtoTransportResponse.Data.Data {
    const protoResponse = new ProtoTransportResponse.Data.Data();

    if (response.dbSchema) {
      protoResponse.setDbSchema(this.buildDbSchema(response.dbSchema));
    }

    if (response.buckets) {
      protoResponse.setBucketsList(
        response.buckets.map((b) => {
          const bucket = new ApiMetadataResponse.BucketMetadata();
          if (b.name) {
            bucket.setName(b.name);
          }
          return bucket;
        })
      );
    }

    if (response.couchbase) {
      protoResponse.setCouchbase(this.buildCouchbaseMetadata(response.couchbase));
    }

    if (response.kafka) {
      protoResponse.setKafka(this.buildKafkaMetadata(response.kafka));
    }

    if (response.kinesis) {
      protoResponse.setKinesis(this.buildKinesisMetadata(response.kinesis));
    }

    if (response.cosmosdb) {
      protoResponse.setCosmosdb(this.buildCosmosdbMetadata(response.cosmosdb));
    }

    if (response.adls) {
      protoResponse.setAdls(this.buildAdlsMetadata(response.adls));
    }

    if (response.dynamodb) {
      // Cast to plain object since DynamoDbV1.Metadata is created as a plain object at runtime
      const dynamodbStruct = google_protobuf_struct_pb.Struct.fromJavaScript(
        response.dynamodb as unknown as { [key: string]: google_protobuf_struct_pb.JavaScriptValue }
      );
      const any = new Any();
      any.pack(dynamodbStruct.serializeBinary(), 'google.protobuf.Struct');
      protoResponse.setDynamodb(any);
    }

    if (response.graphql !== undefined) {
      protoResponse.setGraphql(google_protobuf_struct_pb.Struct.fromJavaScript(response.graphql));
    }

    if (response.openApiSpec !== undefined) {
      protoResponse.setOpenApiSpec(google_protobuf_struct_pb.Struct.fromJavaScript(response.openApiSpec));
    }

    if (response.salesforce) {
      protoResponse.setSalesforce(this.buildSalesforceMetadata(response.salesforce));
    }

    if (response.gSheetsNextPageToken) {
      protoResponse.setGSheetsNextPageToken(response.gSheetsNextPageToken);
    }

    if (response.loadDisabled !== undefined) {
      protoResponse.setLoadDisabled(response.loadDisabled);
    }

    return protoResponse;
  }

  private buildDbSchema(dbSchema: MetadataResponse['dbSchema']): ApiMetadataResponse.DatabaseSchemaMetadata {
    const proto = new ApiMetadataResponse.DatabaseSchemaMetadata();

    if (dbSchema?.tables) {
      proto.setTablesList(
        dbSchema.tables.map((table) => {
          const protoTable = new ApiMetadataResponse.DatabaseSchemaMetadata.Table();
          protoTable.setName(table.name);
          protoTable.setType(table.type);
          if (table.id) protoTable.setId(table.id);
          if (table.schema) protoTable.setSchema(table.schema);

          if (table.columns) {
            protoTable.setColumnsList(
              table.columns.map((col) => {
                const protoCol = new ApiMetadataResponse.DatabaseSchemaMetadata.Column();
                protoCol.setName(col.name);
                protoCol.setType(col.type);
                if (col.escapedName) protoCol.setEscapedName(col.escapedName);
                return protoCol;
              })
            );
          }

          if (table.keys) {
            protoTable.setKeysList(
              table.keys.map((key) => {
                const protoKey = new ApiMetadataResponse.DatabaseSchemaMetadata.Key();
                protoKey.setName(key.name);
                protoKey.setType(key.type);
                if (key.type === 'primary key' && key.columns) {
                  protoKey.setColumnsList(key.columns);
                }
                return protoKey;
              })
            );
          }

          if (table.templates) {
            protoTable.setTemplatesList(
              table.templates.map((tmpl) => {
                const protoTmpl = new ApiMetadataResponse.DatabaseSchemaMetadata.Template();
                protoTmpl.setTitle(tmpl.title);
                protoTmpl.setBody(tmpl.body);
                return protoTmpl;
              })
            );
          }

          return protoTable;
        })
      );
    }

    if (dbSchema?.schemas) {
      proto.setSchemasList(
        dbSchema.schemas.map((schema) => {
          const protoSchema = new ApiMetadataResponse.DatabaseSchemaMetadata.Schema();
          protoSchema.setName(schema.name);
          if (schema.id) protoSchema.setId(schema.id);
          return protoSchema;
        })
      );
    }

    return proto;
  }

  private buildCouchbaseMetadata(couchbase: NonNullable<MetadataResponse['couchbase']>): CouchbaseMetadata {
    const proto = new CouchbaseMetadata();
    if (couchbase.buckets) {
      proto.setBucketsList(
        couchbase.buckets.map((bucket) => {
          const protoBucket = new CouchbaseMetadata.Bucket();
          if (bucket.name) {
            protoBucket.setName(bucket.name);
          }
          if (bucket.scopes) {
            protoBucket.setScopesList(
              bucket.scopes.map((scope) => {
                const protoScope = new CouchbaseMetadata.Scope();
                if (scope.name) {
                  protoScope.setName(scope.name);
                }
                if (scope.collections) {
                  protoScope.setCollectionsList(
                    scope.collections.map((col) => {
                      const protoCol = new CouchbaseMetadata.Collection();
                      if (col.name) {
                        protoCol.setName(col.name);
                      }
                      return protoCol;
                    })
                  );
                }
                return protoScope;
              })
            );
          }
          return protoBucket;
        })
      );
    }
    return proto;
  }

  private buildKafkaMetadata(kafka: NonNullable<MetadataResponse['kafka']>): KafkaMetadata {
    const proto = new KafkaMetadata();
    if (kafka.topics) {
      proto.setTopicsList(
        kafka.topics.map((t) => {
          const topic = new KafkaTopic();
          topic.setName(t.name);
          return topic;
        })
      );
    }
    if (kafka.brokers) {
      proto.setBrokersList(
        kafka.brokers.map((b) => {
          const broker = new KafkaBroker();
          broker.setNodeId(b.nodeId);
          broker.setAddress(b.address);
          return broker;
        })
      );
    }
    return proto;
  }

  private buildKinesisMetadata(kinesis: NonNullable<MetadataResponse['kinesis']>): KinesisMetadata {
    const proto = new KinesisMetadata();
    if (kinesis.streams) {
      proto.setStreamsList(kinesis.streams);
    }
    return proto;
  }

  private buildCosmosdbMetadata(cosmosdb: NonNullable<MetadataResponse['cosmosdb']>): CosmosdbPlugin.Metadata {
    const proto = new CosmosdbPlugin.Metadata();
    if (cosmosdb.containers) {
      proto.setContainersList(
        cosmosdb.containers.map((container) => {
          const protoContainer = new CosmosdbPlugin.Metadata.Container();
          if (container.id) {
            protoContainer.setId(container.id);
          }
          if (container.partitionKey) {
            const protoPartitionKey = new CosmosdbPlugin.Metadata.Container.PartitionKey();
            if (container.partitionKey.paths) {
              protoPartitionKey.setPathsList(container.partitionKey.paths);
            }
            if (container.partitionKey.kind) {
              protoPartitionKey.setKind(container.partitionKey.kind);
            }
            if (container.partitionKey.version !== undefined) {
              protoPartitionKey.setVersion(container.partitionKey.version);
            }
            protoContainer.setPartitionKey(protoPartitionKey);
          }
          return protoContainer;
        })
      );
    }
    return proto;
  }

  private buildAdlsMetadata(adls: NonNullable<MetadataResponse['adls']>): AdlsPlugin.Metadata {
    const proto = new AdlsPlugin.Metadata();
    if (adls.fileSystems) {
      proto.setFileSystemsList(adls.fileSystems);
    }
    return proto;
  }

  private buildSalesforceMetadata(salesforce: NonNullable<MetadataResponse['salesforce']>): SalesforcePlugin.Metadata {
    const proto = new SalesforcePlugin.Metadata();
    if (salesforce.objects) {
      proto.setObjectsList(
        salesforce.objects.map((obj) => {
          const protoObj = new SalesforcePlugin.Metadata.Object();
          if (obj.fields) {
            protoObj.setFieldsList(
              obj.fields.map((field) => {
                const protoField = new SalesforcePlugin.Metadata.Object.Field();
                if (field.name) {
                  protoField.setName(field.name);
                }
                if (field.label) {
                  protoField.setLabel(field.label);
                }
                if (field.type) {
                  protoField.setType(field.type);
                }
                return protoField;
              })
            );
          }
          return protoObj;
        })
      );
    }
    return proto;
  }
}
