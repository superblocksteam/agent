import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Any, Message, proto3, Struct } from "@bufbuild/protobuf";
import { Variables_Mode, Variables_Type } from "../../api/v1/blocks_pb";
import { Error } from "../../common/v1/errors_pb";
import { Definition, MetadataResponse_BucketMetadata, MetadataResponse_DatabaseSchemaMetadata } from "../../api/v1/service_pb";
import { Metadata } from "../../plugins/kafka/v1/plugin_pb";
import { Plugin_Metadata } from "../../plugins/cosmosdb/v1/plugin_pb";
import { Plugin_Metadata as Plugin_Metadata$1 } from "../../plugins/adls/v1/plugin_pb";
import { Api } from "../../api/v1/api_pb";
import { Stores } from "../../store/v1/store_pb";
/**
 * @generated from message transport.v1.Performance
 */
export declare class Performance extends Message<Performance> {
    /**
     * @generated from field: bool error = 1;
     */
    error: boolean;
    /**
     * @generated from field: transport.v1.Performance.Observable plugin_execution = 2;
     */
    pluginExecution?: Performance_Observable;
    /**
     * @generated from field: transport.v1.Performance.Observable queue_request = 3;
     */
    queueRequest?: Performance_Observable;
    /**
     * @generated from field: transport.v1.Performance.Observable queue_response = 4;
     */
    queueResponse?: Performance_Observable;
    /**
     * @generated from field: transport.v1.Performance.Observable kv_store_fetch = 5;
     */
    kvStoreFetch?: Performance_Observable;
    /**
     * @generated from field: transport.v1.Performance.Observable kv_store_push = 6;
     */
    kvStorePush?: Performance_Observable;
    /**
     * @generated from field: transport.v1.Performance.Observable total = 7;
     */
    total?: Performance_Observable;
    constructor(data?: PartialMessage<Performance>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Performance";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Performance;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Performance;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Performance;
    static equals(a: Performance | PlainMessage<Performance> | undefined, b: Performance | PlainMessage<Performance> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Performance.Observable
 */
export declare class Performance_Observable extends Message<Performance_Observable> {
    /**
     * @generated from field: double start = 1;
     */
    start: number;
    /**
     * @generated from field: double end = 2;
     */
    end: number;
    /**
     * @generated from field: double value = 3;
     */
    value: number;
    /**
     * @generated from field: double bytes = 4;
     */
    bytes: number;
    /**
     * @generated from field: double estimate = 5;
     */
    estimate: number;
    constructor(data?: PartialMessage<Performance_Observable>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Performance.Observable";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Performance_Observable;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Performance_Observable;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Performance_Observable;
    static equals(a: Performance_Observable | PlainMessage<Performance_Observable> | undefined, b: Performance_Observable | PlainMessage<Performance_Observable> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Variable
 */
export declare class Variable extends Message<Variable> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: api.v1.Variables.Type type = 2;
     */
    type: Variables_Type;
    /**
     * @generated from field: api.v1.Variables.Mode mode = 3;
     */
    mode: Variables_Mode;
    constructor(data?: PartialMessage<Variable>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Variable";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Variable;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Variable;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Variable;
    static equals(a: Variable | PlainMessage<Variable> | undefined, b: Variable | PlainMessage<Variable> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Observability
 */
export declare class Observability extends Message<Observability> {
    /**
     * @generated from field: string trace_id = 1;
     */
    traceId: string;
    /**
     * @generated from field: string span_id = 2;
     */
    spanId: string;
    /**
     * @generated from field: map<string, string> baggage = 3;
     */
    baggage: {
        [key: string]: string;
    };
    /**
     * @generated from field: bytes trace_flags = 4;
     */
    traceFlags: Uint8Array;
    constructor(data?: PartialMessage<Observability>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Observability";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Observability;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Observability;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Observability;
    static equals(a: Observability | PlainMessage<Observability> | undefined, b: Observability | PlainMessage<Observability> | undefined): boolean;
}
/**
 * NOTE(frank): Gross. I'm not spending any time trying to make this look pretty
 * because it needs to be re-done at some point after control flow. This is a raw
 * port of the existing interface.
 *
 * @generated from message transport.v1.Request
 */
export declare class Request extends Message<Request> {
    /**
     * @generated from field: string inbox = 1;
     */
    inbox: string;
    /**
     * @generated from field: transport.v1.Request.Data data = 2;
     */
    data?: Request_Data;
    /**
     * @generated from field: string topic = 3;
     */
    topic: string;
    constructor(data?: PartialMessage<Request>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request;
    static equals(a: Request | PlainMessage<Request> | undefined, b: Request | PlainMessage<Request> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data
 */
export declare class Request_Data extends Message<Request_Data> {
    /**
     * @generated from field: transport.v1.Request.Data.Pinned pinned = 1;
     */
    pinned?: Request_Data_Pinned;
    /**
     * @generated from field: transport.v1.Request.Data.Data data = 2;
     */
    data?: Request_Data_Data;
    constructor(data?: PartialMessage<Request_Data>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data;
    static equals(a: Request_Data | PlainMessage<Request_Data> | undefined, b: Request_Data | PlainMessage<Request_Data> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Pinned
 */
export declare class Request_Data_Pinned extends Message<Request_Data_Pinned> {
    /**
     * @generated from field: string bucket = 1;
     */
    bucket: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: string version = 3;
     */
    version: string;
    /**
     * @generated from field: string event = 4;
     */
    event: string;
    /**
     * Deprecated, use observability instead
     *
     * @generated from field: map<string, string> carrier = 5 [deprecated = true];
     * @deprecated
     */
    carrier: {
        [key: string]: string;
    };
    /**
     * @generated from field: transport.v1.Observability observability = 6;
     */
    observability?: Observability;
    constructor(data?: PartialMessage<Request_Data_Pinned>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Pinned";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Pinned;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Pinned;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Pinned;
    static equals(a: Request_Data_Pinned | PlainMessage<Request_Data_Pinned> | undefined, b: Request_Data_Pinned | PlainMessage<Request_Data_Pinned> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Data
 */
export declare class Request_Data_Data extends Message<Request_Data_Data> {
    /**
     * @generated from field: transport.v1.Request.Data.Data.Props props = 1;
     */
    props?: Request_Data_Data_Props;
    /**
     * d_config stands for datasource configuration - necessary to match the fields used
     * in the existing worker interface
     *
     * @generated from field: optional google.protobuf.Struct d_config = 2;
     */
    dConfig?: Struct;
    /**
     * @generated from field: optional google.protobuf.Struct a_config = 3;
     */
    aConfig?: Struct;
    /**
     * @generated from field: transport.v1.Request.Data.Data.Quota quotas = 4;
     */
    quotas?: Request_Data_Data_Quota;
    constructor(data?: PartialMessage<Request_Data_Data>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Data";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Data;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Data;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Data;
    static equals(a: Request_Data_Data | PlainMessage<Request_Data_Data> | undefined, b: Request_Data_Data | PlainMessage<Request_Data_Data> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Data.Props
 */
export declare class Request_Data_Data_Props extends Message<Request_Data_Data_Props> {
    /**
     * @generated from field: google.protobuf.Struct action_configuration = 1;
     */
    actionConfiguration?: Struct;
    /**
     * @generated from field: google.protobuf.Struct datasource_configuration = 2;
     */
    datasourceConfiguration?: Struct;
    /**
     * @generated from field: google.protobuf.Struct redacted_datasource_configuration = 3;
     */
    redactedDatasourceConfiguration?: Struct;
    /**
     * @generated from field: string execution_id = 4;
     */
    executionId: string;
    /**
     * @generated from field: string step_name = 5;
     */
    stepName: string;
    /**
     * @generated from field: string environment = 6;
     */
    environment: string;
    /**
     * DEPRECATED
     *
     * @generated from field: repeated transport.v1.Request.Data.Data.Props.Binding binding_keys = 7;
     */
    bindingKeys: Request_Data_Data_Props_Binding[];
    /**
     * @generated from field: map<string, transport.v1.Variable> variables = 8;
     */
    variables: {
        [key: string]: Variable;
    };
    /**
     * @generated from field: string fileServerUrl = 9 [json_name = "$fileServerUrl"];
     */
    fileServerUrl: string;
    /**
     * @generated from field: repeated transport.v1.Request.Data.Data.Props.File files = 10;
     */
    files: Request_Data_Data_Props_File[];
    /**
     * If true, the worker will render the action configuration.
     *
     * @generated from field: bool render = 11;
     */
    render: boolean;
    /**
     * @generated from field: string version = 12;
     */
    version: string;
    constructor(data?: PartialMessage<Request_Data_Data_Props>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Data.Props";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Data_Props;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Data_Props;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Data_Props;
    static equals(a: Request_Data_Data_Props | PlainMessage<Request_Data_Data_Props> | undefined, b: Request_Data_Data_Props | PlainMessage<Request_Data_Data_Props> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Data.Props.Binding
 */
export declare class Request_Data_Data_Props_Binding extends Message<Request_Data_Data_Props_Binding> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string type = 2;
     */
    type: string;
    constructor(data?: PartialMessage<Request_Data_Data_Props_Binding>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Data.Props.Binding";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Data_Props_Binding;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Data_Props_Binding;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Data_Props_Binding;
    static equals(a: Request_Data_Data_Props_Binding | PlainMessage<Request_Data_Data_Props_Binding> | undefined, b: Request_Data_Data_Props_Binding | PlainMessage<Request_Data_Data_Props_Binding> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Data.Props.File
 */
export declare class Request_Data_Data_Props_File extends Message<Request_Data_Data_Props_File> {
    /**
     * @generated from field: string fieldname = 1;
     */
    fieldname: string;
    /**
     * @generated from field: string originalname = 2;
     */
    originalname: string;
    /**
     * @generated from field: string encoding = 3;
     */
    encoding: string;
    /**
     * @generated from field: string mimetype = 4;
     */
    mimetype: string;
    /**
     * @generated from field: int64 size = 5;
     */
    size: bigint;
    /**
     * @generated from field: string destination = 6;
     */
    destination: string;
    /**
     * @generated from field: string filename = 7;
     */
    filename: string;
    /**
     * @generated from field: string path = 8;
     */
    path: string;
    /**
     * @generated from field: bytes buffer = 9;
     */
    buffer: Uint8Array;
    constructor(data?: PartialMessage<Request_Data_Data_Props_File>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Data.Props.File";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Data_Props_File;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Data_Props_File;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Data_Props_File;
    static equals(a: Request_Data_Data_Props_File | PlainMessage<Request_Data_Data_Props_File> | undefined, b: Request_Data_Data_Props_File | PlainMessage<Request_Data_Data_Props_File> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Request.Data.Data.Quota
 */
export declare class Request_Data_Data_Quota extends Message<Request_Data_Data_Quota> {
    /**
     * @generated from field: int32 size = 1;
     */
    size: number;
    /**
     * @generated from field: int32 duration = 2;
     */
    duration: number;
    constructor(data?: PartialMessage<Request_Data_Data_Quota>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Request.Data.Data.Quota";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Request_Data_Data_Quota;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Request_Data_Data_Quota;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Request_Data_Data_Quota;
    static equals(a: Request_Data_Data_Quota | PlainMessage<Request_Data_Data_Quota> | undefined, b: Request_Data_Data_Quota | PlainMessage<Request_Data_Data_Quota> | undefined): boolean;
}
/**
 * NOTE(frank): We don't have control over this type. We have
 * to work with the existing controller <-> worker interface.
 * Usually it's not a best practice to inline nested structs
 * like this but I think it's okay in this case.
 *
 * @generated from message transport.v1.Response
 */
export declare class Response extends Message<Response> {
    /**
     * @generated from field: transport.v1.Response.Data data = 1;
     */
    data?: Response_Data;
    /**
     * @generated from field: common.v1.Error pinned = 2;
     */
    pinned?: Error;
    constructor(data?: PartialMessage<Response>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Response";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Response;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Response;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Response;
    static equals(a: Response | PlainMessage<Response> | undefined, b: Response | PlainMessage<Response> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Response.Data
 */
export declare class Response_Data extends Message<Response_Data> {
    /**
     * @generated from field: transport.v1.Performance pinned = 1;
     */
    pinned?: Performance;
    /**
     * @generated from field: transport.v1.Response.Data.Data data = 2;
     */
    data?: Response_Data_Data;
    constructor(data?: PartialMessage<Response_Data>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Response.Data";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Response_Data;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Response_Data;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Response_Data;
    static equals(a: Response_Data | PlainMessage<Response_Data> | undefined, b: Response_Data | PlainMessage<Response_Data> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Response.Data.Data
 */
export declare class Response_Data_Data extends Message<Response_Data_Data> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: common.v1.Error err = 2;
     */
    err?: Error;
    /**
     * Metadata response fields - necessary to match fields used in the existing worker interface
     * https://github.com/superblocksteam/superblocks/blob/f75d3a80745253458865b66a885cb7f8eb258229/packages/shared/src/types/datasource/metadata/index.ts#L6-L9
     *
     * @generated from field: optional api.v1.MetadataResponse.DatabaseSchemaMetadata db_schema = 3;
     */
    dbSchema?: MetadataResponse_DatabaseSchemaMetadata;
    /**
     * @generated from field: repeated api.v1.MetadataResponse.BucketMetadata buckets = 4;
     */
    buckets: MetadataResponse_BucketMetadata[];
    /**
     * NOTE(frank): I think we'll need a transport/v2 for this but ideally
     * we don't have duplcate types like this.
     *
     * @generated from field: optional plugins.kafka.v1.Metadata kafka = 5;
     */
    kafka?: Metadata;
    /**
     * @generated from field: optional plugins.cosmosdb.v1.Plugin.Metadata cosmosdb = 6;
     */
    cosmosdb?: Plugin_Metadata;
    /**
     * @generated from field: optional plugins.adls.v1.Plugin.Metadata adls = 7;
     */
    adls?: Plugin_Metadata$1;
    /**
     * @generated from field: optional google.protobuf.Any dynamodb = 8;
     */
    dynamodb?: Any;
    /**
     * @generated from field: optional string g_sheets_next_page_token = 9;
     */
    gSheetsNextPageToken?: string;
    constructor(data?: PartialMessage<Response_Data_Data>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Response.Data.Data";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Response_Data_Data;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Response_Data_Data;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Response_Data_Data;
    static equals(a: Response_Data_Data | PlainMessage<Response_Data_Data> | undefined, b: Response_Data_Data | PlainMessage<Response_Data_Data> | undefined): boolean;
}
/**
 * DEPRECATED: use api.v1.Definition instead
 *
 * @generated from message transport.v1.Fetch
 */
export declare class Fetch extends Message<Fetch> {
    /**
     * @generated from field: api.v1.Api api = 1;
     */
    api?: Api;
    /**
     * @generated from field: map<string, google.protobuf.Struct> integrations = 2;
     */
    integrations: {
        [key: string]: Struct;
    };
    /**
     * @generated from field: transport.v1.Fetch.Metadata metadata = 3;
     */
    metadata?: Fetch_Metadata;
    /**
     * @generated from field: store.v1.Stores stores = 4;
     */
    stores?: Stores;
    constructor(data?: PartialMessage<Fetch>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Fetch";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fetch;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fetch;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fetch;
    static equals(a: Fetch | PlainMessage<Fetch> | undefined, b: Fetch | PlainMessage<Fetch> | undefined): boolean;
}
/**
 * @generated from message transport.v1.Fetch.Metadata
 */
export declare class Fetch_Metadata extends Message<Fetch_Metadata> {
    /**
     * This is the email
     *
     * @generated from field: string requester = 1;
     */
    requester: string;
    /**
     * Because profile isn't a required execution parameter, the default will be different per org.
     *
     * @generated from field: string profile = 2;
     */
    profile: string;
    /**
     * @generated from field: string organization_plan = 3;
     */
    organizationPlan: string;
    constructor(data?: PartialMessage<Fetch_Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.Fetch.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fetch_Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fetch_Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fetch_Metadata;
    static equals(a: Fetch_Metadata | PlainMessage<Fetch_Metadata> | undefined, b: Fetch_Metadata | PlainMessage<Fetch_Metadata> | undefined): boolean;
}
/**
 * @generated from message transport.v1.FetchScheduleJobResp
 */
export declare class FetchScheduleJobResp extends Message<FetchScheduleJobResp> {
    /**
     * @generated from field: repeated api.v1.Definition apis = 1;
     */
    apis: Definition[];
    constructor(data?: PartialMessage<FetchScheduleJobResp>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "transport.v1.FetchScheduleJobResp";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FetchScheduleJobResp;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FetchScheduleJobResp;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FetchScheduleJobResp;
    static equals(a: FetchScheduleJobResp | PlainMessage<FetchScheduleJobResp> | undefined, b: FetchScheduleJobResp | PlainMessage<FetchScheduleJobResp> | undefined): boolean;
}
