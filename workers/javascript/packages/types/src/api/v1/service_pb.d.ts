import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct, Value } from "@bufbuild/protobuf";
import { Api } from "./api_pb";
import { Metadata, Profile, UserType } from "../../common/v1/common_pb";
import { Stores } from "../../store/v1/store_pb";
import { Event, Output, Performance } from "./event_pb";
import { Error } from "../../common/v1/errors_pb";
import { Metadata as Metadata$1 } from "../../plugins/kafka/v1/plugin_pb";
import { Plugin_Metadata } from "../../plugins/cosmosdb/v1/plugin_pb";
import { Plugin_Metadata as Plugin_Metadata$1 } from "../../plugins/adls/v1/plugin_pb";
/**
 * @generated from enum api.v1.ViewMode
 */
export declare enum ViewMode {
    /**
     * @generated from enum value: VIEW_MODE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: VIEW_MODE_EDIT = 1;
     */
    EDIT = 1,
    /**
     * @generated from enum value: VIEW_MODE_PREVIEW = 2;
     */
    PREVIEW = 2,
    /**
     * @generated from enum value: VIEW_MODE_DEPLOYED = 3;
     */
    DEPLOYED = 3
}
/**
 * @generated from message api.v1.HealthRequest
 */
export declare class HealthRequest extends Message<HealthRequest> {
    /**
     * @generated from field: bool detailed = 1;
     */
    detailed: boolean;
    constructor(data?: PartialMessage<HealthRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.HealthRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HealthRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HealthRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HealthRequest;
    static equals(a: HealthRequest | PlainMessage<HealthRequest> | undefined, b: HealthRequest | PlainMessage<HealthRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.ValidateRequest
 */
export declare class ValidateRequest extends Message<ValidateRequest> {
    /**
     * @generated from field: api.v1.Api api = 1;
     */
    api?: Api;
    constructor(data?: PartialMessage<ValidateRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ValidateRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ValidateRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ValidateRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ValidateRequest;
    static equals(a: ValidateRequest | PlainMessage<ValidateRequest> | undefined, b: ValidateRequest | PlainMessage<ValidateRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.ExecuteRequest
 */
export declare class ExecuteRequest extends Message<ExecuteRequest> {
    /**
     *
     * Request options.
     *
     * @generated from field: api.v1.ExecuteRequest.Options options = 1;
     */
    options?: ExecuteRequest_Options;
    /**
     *
     * Inputs that can be access in steps.
     *
     * @generated from field: map<string, google.protobuf.Value> inputs = 2;
     */
    inputs: {
        [key: string]: Value;
    };
    /**
     * @generated from oneof api.v1.ExecuteRequest.request
     */
    request: {
        /**
         *
         * The literal API specification.
         *
         * @generated from field: api.v1.Definition definition = 3;
         */
        value: Definition;
        case: "definition";
    } | {
        /**
         *
         * Details on how to fetch the API specification.
         *
         * @generated from field: api.v1.ExecuteRequest.Fetch fetch = 4;
         */
        value: ExecuteRequest_Fetch;
        case: "fetch";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: repeated api.v1.ExecuteRequest.File files = 5;
     */
    files: ExecuteRequest_File[];
    /**
     * @generated from field: common.v1.Profile profile = 6;
     */
    profile?: Profile;
    /**
     * @generated from field: repeated api.v1.Mock mocks = 7;
     */
    mocks: Mock[];
    constructor(data?: PartialMessage<ExecuteRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ExecuteRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExecuteRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExecuteRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExecuteRequest;
    static equals(a: ExecuteRequest | PlainMessage<ExecuteRequest> | undefined, b: ExecuteRequest | PlainMessage<ExecuteRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.ExecuteRequest.Options
 */
export declare class ExecuteRequest_Options extends Message<ExecuteRequest_Options> {
    /**
     *
     * If true, the primary output will not be returned.
     *
     * @generated from field: bool exclude_output = 1;
     */
    excludeOutput: boolean;
    /**
     *
     * If true, all outputs will be returned. If false (default):
     *
     *       STREAM: The block output will not be returned.
     *  ASYNC/AWAIT: Only the final block's output will be returned.
     *
     * WARNING: Returning more than the final block's output may
     *          result in a significant performance regressions.
     * NOTE: If 'exclude_events' is enabled, this flag has no effect.
     *
     * @generated from field: bool include_event_outputs = 2;
     */
    includeEventOutputs: boolean;
    /**
     *
     * Include system events.
     *
     * @generated from field: bool include_events = 3;
     */
    includeEvents: boolean;
    /**
     *
     * The block ID to start execution at.
     *
     * @generated from field: string start = 4;
     */
    start: string;
    /**
     *
     * The block ID to stop execution at.
     *
     * @generated from field: string stop = 5;
     */
    stop: string;
    /**
     *
     * If true, values for resolved bindings will be included.
     *
     * @generated from field: bool include_resolved = 6;
     */
    includeResolved: boolean;
    /**
     *
     * If true, the api will immediately return and execution will continue in a detached manner.
     *
     * @generated from field: bool async = 7;
     */
    async: boolean;
    /**
     *
     * If true, the begin and complete events will be sent. This flag is need to retain backwards compatibility.
     *
     * @generated from field: bool include_api_events = 8;
     */
    includeApiEvents: boolean;
    constructor(data?: PartialMessage<ExecuteRequest_Options>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ExecuteRequest.Options";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExecuteRequest_Options;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExecuteRequest_Options;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExecuteRequest_Options;
    static equals(a: ExecuteRequest_Options | PlainMessage<ExecuteRequest_Options> | undefined, b: ExecuteRequest_Options | PlainMessage<ExecuteRequest_Options> | undefined): boolean;
}
/**
 * @generated from message api.v1.ExecuteRequest.Fetch
 */
export declare class ExecuteRequest_Fetch extends Message<ExecuteRequest_Fetch> {
    /**
     *
     * A reference to the API by ID.
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     *
     * The integration profile to use.
     *
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     *
     * Use unpublished changes.
     *
     * @generated from field: optional bool test = 3;
     */
    test?: boolean;
    /**
     *
     * The auth token to use when fetching the definition.
     * Used for workflows only.
     *
     * @generated from field: optional string token = 4;
     */
    token?: string;
    /**
     *
     * The view mode that this resource should be executed against.
     *
     * @generated from field: api.v1.ViewMode view_mode = 5;
     */
    viewMode: ViewMode;
    /**
     *
     * The commit ID to use when fetching the API.
     *
     * @generated from field: optional string commit_id = 6;
     */
    commitId?: string;
    /**
     *
     * The branch name to use when fetching the API
     *
     * @generated from field: optional string branch_name = 7;
     */
    branchName?: string;
    constructor(data?: PartialMessage<ExecuteRequest_Fetch>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ExecuteRequest.Fetch";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExecuteRequest_Fetch;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExecuteRequest_Fetch;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExecuteRequest_Fetch;
    static equals(a: ExecuteRequest_Fetch | PlainMessage<ExecuteRequest_Fetch> | undefined, b: ExecuteRequest_Fetch | PlainMessage<ExecuteRequest_Fetch> | undefined): boolean;
}
/**
 * @generated from message api.v1.ExecuteRequest.File
 */
export declare class ExecuteRequest_File extends Message<ExecuteRequest_File> {
    /**
     * @generated from field: string originalName = 1;
     */
    originalName: string;
    /**
     * @generated from field: bytes buffer = 2;
     */
    buffer: Uint8Array;
    /**
     * @generated from field: string encoding = 3;
     */
    encoding: string;
    /**
     * @generated from field: string mimeType = 4;
     */
    mimeType: string;
    /**
     * @generated from field: string size = 5;
     */
    size: string;
    constructor(data?: PartialMessage<ExecuteRequest_File>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ExecuteRequest.File";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExecuteRequest_File;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExecuteRequest_File;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExecuteRequest_File;
    static equals(a: ExecuteRequest_File | PlainMessage<ExecuteRequest_File> | undefined, b: ExecuteRequest_File | PlainMessage<ExecuteRequest_File> | undefined): boolean;
}
/**
 * @generated from message api.v1.Definition
 */
export declare class Definition extends Message<Definition> {
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
     * @generated from field: api.v1.Definition.Metadata metadata = 3;
     */
    metadata?: Definition_Metadata;
    /**
     * @generated from field: store.v1.Stores stores = 4;
     */
    stores?: Stores;
    constructor(data?: PartialMessage<Definition>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Definition";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Definition;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Definition;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Definition;
    static equals(a: Definition | PlainMessage<Definition> | undefined, b: Definition | PlainMessage<Definition> | undefined): boolean;
}
/**
 * @generated from message api.v1.Definition.Metadata
 */
export declare class Definition_Metadata extends Message<Definition_Metadata> {
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
    /**
     * @generated from field: string organization_name = 4;
     */
    organizationName: string;
    /**
     * This is requester type since the same email could be used by external user as well as by internal
     *
     * @generated from field: optional common.v1.UserType requester_type = 5;
     */
    requesterType?: UserType;
    constructor(data?: PartialMessage<Definition_Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Definition.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Definition_Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Definition_Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Definition_Metadata;
    static equals(a: Definition_Metadata | PlainMessage<Definition_Metadata> | undefined, b: Definition_Metadata | PlainMessage<Definition_Metadata> | undefined): boolean;
}
/**
 * @generated from message api.v1.StatusRequest
 */
export declare class StatusRequest extends Message<StatusRequest> {
    /**
     *
     * The execution ID of an in-progress API execution.
     *
     * @generated from field: string execution = 1;
     */
    execution: string;
    constructor(data?: PartialMessage<StatusRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.StatusRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StatusRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StatusRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StatusRequest;
    static equals(a: StatusRequest | PlainMessage<StatusRequest> | undefined, b: StatusRequest | PlainMessage<StatusRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.AwaitResponse
 */
export declare class AwaitResponse extends Message<AwaitResponse> {
    /**
     *
     * The execution ID. This can be used to retrieve outputs after the fact.
     *
     * @generated from field: string execution = 1;
     */
    execution: string;
    /**
     *
     * The block's output.
     *
     * @generated from field: api.v1.Output output = 2;
     */
    output?: Output;
    /**
     *
     * The errors, if any.
     *
     * @generated from field: repeated common.v1.Error errors = 3;
     */
    errors: Error[];
    /**
     *
     * The current status of this execution. If response orginates
     * from an AwaitRequest, the status will always be comppleted.
     *
     * @generated from field: api.v1.AwaitResponse.Status status = 4;
     */
    status: AwaitResponse_Status;
    /**
     *
     * Aggregated performance stats.
     *
     * @generated from field: api.v1.Performance performance = 5;
     */
    performance?: Performance;
    /**
     *
     * A log of the cuncurrent events that happened during this API's execution.
     *
     * @generated from field: repeated api.v1.Event events = 6;
     */
    events: Event[];
    constructor(data?: PartialMessage<AwaitResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.AwaitResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AwaitResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AwaitResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AwaitResponse;
    static equals(a: AwaitResponse | PlainMessage<AwaitResponse> | undefined, b: AwaitResponse | PlainMessage<AwaitResponse> | undefined): boolean;
}
/**
 * @generated from enum api.v1.AwaitResponse.Status
 */
export declare enum AwaitResponse_Status {
    /**
     * @generated from enum value: STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: STATUS_COMPLETED = 1;
     */
    COMPLETED = 1,
    /**
     * @generated from enum value: STATUS_EXECUTING = 2;
     */
    EXECUTING = 2
}
/**
 * @generated from message api.v1.AsyncResponse
 */
export declare class AsyncResponse extends Message<AsyncResponse> {
    /**
     *
     * The execution ID. This can be used to retrieve outputs after the fact.
     *
     * @generated from field: string execution = 1;
     */
    execution: string;
    /**
     * @generated from field: common.v1.Error error = 2;
     */
    error?: Error;
    constructor(data?: PartialMessage<AsyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.AsyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AsyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AsyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AsyncResponse;
    static equals(a: AsyncResponse | PlainMessage<AsyncResponse> | undefined, b: AsyncResponse | PlainMessage<AsyncResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.StreamResponse
 */
export declare class StreamResponse extends Message<StreamResponse> {
    /**
     *
     * The execution ID. This can be used to retrieve outputs after the fact.
     *
     * @generated from field: string execution = 1;
     */
    execution: string;
    /**
     * @generated from field: api.v1.Event event = 2;
     */
    event?: Event;
    constructor(data?: PartialMessage<StreamResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.StreamResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StreamResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StreamResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StreamResponse;
    static equals(a: StreamResponse | PlainMessage<StreamResponse> | undefined, b: StreamResponse | PlainMessage<StreamResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.OutputRequest
 */
export declare class OutputRequest extends Message<OutputRequest> {
    /**
     * @generated from field: string execution = 1;
     */
    execution: string;
    /**
     * @generated from field: string block = 2;
     */
    block: string;
    constructor(data?: PartialMessage<OutputRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.OutputRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OutputRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OutputRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OutputRequest;
    static equals(a: OutputRequest | PlainMessage<OutputRequest> | undefined, b: OutputRequest | PlainMessage<OutputRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.OutputResponse
 */
export declare class OutputResponse extends Message<OutputResponse> {
    /**
     * @generated from field: common.v1.Metadata metadata = 1;
     */
    metadata?: Metadata;
    /**
     *
     * The block's output.
     *
     * @generated from field: api.v1.Output output = 2;
     */
    output?: Output;
    /**
     *
     * The error, if any.
     *
     * @generated from field: common.v1.Error error = 3;
     */
    error?: Error;
    constructor(data?: PartialMessage<OutputResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.OutputResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OutputResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OutputResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OutputResponse;
    static equals(a: OutputResponse | PlainMessage<OutputResponse> | undefined, b: OutputResponse | PlainMessage<OutputResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.CancelRequest
 */
export declare class CancelRequest extends Message<CancelRequest> {
    /**
     * @generated from field: string execution = 1;
     */
    execution: string;
    constructor(data?: PartialMessage<CancelRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.CancelRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CancelRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CancelRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CancelRequest;
    static equals(a: CancelRequest | PlainMessage<CancelRequest> | undefined, b: CancelRequest | PlainMessage<CancelRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.CancelResponse
 */
export declare class CancelResponse extends Message<CancelResponse> {
    /**
     * @generated from field: common.v1.Error error = 1;
     */
    error?: Error;
    constructor(data?: PartialMessage<CancelResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.CancelResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CancelResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CancelResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CancelResponse;
    static equals(a: CancelResponse | PlainMessage<CancelResponse> | undefined, b: CancelResponse | PlainMessage<CancelResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.TestRequest
 */
export declare class TestRequest extends Message<TestRequest> {
    /**
     * @generated from field: google.protobuf.Struct datasource_config = 1;
     */
    datasourceConfig?: Struct;
    /**
     * @generated from field: string integration_type = 2;
     */
    integrationType: string;
    /**
     * @generated from field: string configuration_id = 3;
     */
    configurationId: string;
    /**
     * @generated from field: common.v1.Profile profile = 4;
     */
    profile?: Profile;
    /**
     * @generated from field: optional google.protobuf.Struct action_config = 5;
     */
    actionConfig?: Struct;
    constructor(data?: PartialMessage<TestRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.TestRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TestRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TestRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TestRequest;
    static equals(a: TestRequest | PlainMessage<TestRequest> | undefined, b: TestRequest | PlainMessage<TestRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.TestResponse
 */
export declare class TestResponse extends Message<TestResponse> {
    constructor(data?: PartialMessage<TestResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.TestResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TestResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TestResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TestResponse;
    static equals(a: TestResponse | PlainMessage<TestResponse> | undefined, b: TestResponse | PlainMessage<TestResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.DeleteRequest
 */
export declare class DeleteRequest extends Message<DeleteRequest> {
    /**
     * @generated from field: string integration = 1;
     */
    integration: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: string configuration_id = 3;
     */
    configurationId: string;
    /**
     * @generated from field: string plugin_name = 4;
     */
    pluginName: string;
    constructor(data?: PartialMessage<DeleteRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.DeleteRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteRequest;
    static equals(a: DeleteRequest | PlainMessage<DeleteRequest> | undefined, b: DeleteRequest | PlainMessage<DeleteRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.DeleteResponse
 */
export declare class DeleteResponse extends Message<DeleteResponse> {
    constructor(data?: PartialMessage<DeleteResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.DeleteResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteResponse;
    static equals(a: DeleteResponse | PlainMessage<DeleteResponse> | undefined, b: DeleteResponse | PlainMessage<DeleteResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.Function
 */
export declare class Function extends Message<Function> {
    constructor(data?: PartialMessage<Function>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Function";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Function;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Function;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Function;
    static equals(a: Function | PlainMessage<Function> | undefined, b: Function | PlainMessage<Function> | undefined): boolean;
}
/**
 * @generated from message api.v1.Function.Request
 */
export declare class Function_Request extends Message<Function_Request> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: repeated google.protobuf.Value parameters = 3;
     */
    parameters: Value[];
    constructor(data?: PartialMessage<Function_Request>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Function.Request";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Function_Request;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Function_Request;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Function_Request;
    static equals(a: Function_Request | PlainMessage<Function_Request> | undefined, b: Function_Request | PlainMessage<Function_Request> | undefined): boolean;
}
/**
 * @generated from message api.v1.Function.Response
 */
export declare class Function_Response extends Message<Function_Response> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: google.protobuf.Value value = 2;
     */
    value?: Value;
    /**
     * @generated from field: common.v1.Error error = 3;
     */
    error?: Error;
    constructor(data?: PartialMessage<Function_Response>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Function.Response";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Function_Response;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Function_Response;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Function_Response;
    static equals(a: Function_Response | PlainMessage<Function_Response> | undefined, b: Function_Response | PlainMessage<Function_Response> | undefined): boolean;
}
/**
 * @generated from message api.v1.TwoWayRequest
 */
export declare class TwoWayRequest extends Message<TwoWayRequest> {
    /**
     * @generated from oneof api.v1.TwoWayRequest.type
     */
    type: {
        /**
         * @generated from field: api.v1.ExecuteRequest execute = 1;
         */
        value: ExecuteRequest;
        case: "execute";
    } | {
        /**
         * @generated from field: api.v1.Function.Response function = 2;
         */
        value: Function_Response;
        case: "function";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<TwoWayRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.TwoWayRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TwoWayRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TwoWayRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TwoWayRequest;
    static equals(a: TwoWayRequest | PlainMessage<TwoWayRequest> | undefined, b: TwoWayRequest | PlainMessage<TwoWayRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.TwoWayResponse
 */
export declare class TwoWayResponse extends Message<TwoWayResponse> {
    /**
     * @generated from oneof api.v1.TwoWayResponse.type
     */
    type: {
        /**
         * @generated from field: api.v1.StreamResponse stream = 1;
         */
        value: StreamResponse;
        case: "stream";
    } | {
        /**
         * @generated from field: api.v1.Function.Request function = 2;
         */
        value: Function_Request;
        case: "function";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<TwoWayResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.TwoWayResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TwoWayResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TwoWayResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TwoWayResponse;
    static equals(a: TwoWayResponse | PlainMessage<TwoWayResponse> | undefined, b: TwoWayResponse | PlainMessage<TwoWayResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.Mock
 */
export declare class Mock extends Message<Mock> {
    /**
     * @generated from field: api.v1.Mock.On on = 1;
     */
    on?: Mock_On;
    /**
     * @generated from field: api.v1.Mock.Return return = 2;
     */
    return?: Mock_Return;
    constructor(data?: PartialMessage<Mock>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Mock";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Mock;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Mock;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Mock;
    static equals(a: Mock | PlainMessage<Mock> | undefined, b: Mock | PlainMessage<Mock> | undefined): boolean;
}
/**
 * @generated from message api.v1.Mock.Params
 */
export declare class Mock_Params extends Message<Mock_Params> {
    /**
     * @generated from field: optional string integration_type = 1;
     */
    integrationType?: string;
    /**
     * @generated from field: optional string step_name = 2;
     */
    stepName?: string;
    /**
     * @generated from field: optional google.protobuf.Value inputs = 3;
     */
    inputs?: Value;
    constructor(data?: PartialMessage<Mock_Params>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Mock.Params";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Mock_Params;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Mock_Params;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Mock_Params;
    static equals(a: Mock_Params | PlainMessage<Mock_Params> | undefined, b: Mock_Params | PlainMessage<Mock_Params> | undefined): boolean;
}
/**
 * @generated from message api.v1.Mock.On
 */
export declare class Mock_On extends Message<Mock_On> {
    /**
     * @generated from field: optional api.v1.Mock.Params static = 1;
     */
    static?: Mock_Params;
    /**
     * function name
     *
     * @generated from field: optional string dynamic = 2;
     */
    dynamic?: string;
    constructor(data?: PartialMessage<Mock_On>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Mock.On";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Mock_On;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Mock_On;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Mock_On;
    static equals(a: Mock_On | PlainMessage<Mock_On> | undefined, b: Mock_On | PlainMessage<Mock_On> | undefined): boolean;
}
/**
 * @generated from message api.v1.Mock.Return
 */
export declare class Mock_Return extends Message<Mock_Return> {
    /**
     * @generated from oneof api.v1.Mock.Return.type
     */
    type: {
        /**
         * @generated from field: google.protobuf.Value static = 1;
         */
        value: Value;
        case: "static";
    } | {
        /**
         * function name
         *
         * @generated from field: string dynamic = 2;
         */
        value: string;
        case: "dynamic";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Mock_Return>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Mock.Return";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Mock_Return;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Mock_Return;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Mock_Return;
    static equals(a: Mock_Return | PlainMessage<Mock_Return> | undefined, b: Mock_Return | PlainMessage<Mock_Return> | undefined): boolean;
}
/**
 * DEPRECATED
 *
 * @generated from message api.v1.MetadataRequestDeprecated
 */
export declare class MetadataRequestDeprecated extends Message<MetadataRequestDeprecated> {
    /**
     * This is confusing, but integration means integration id
     *
     * @generated from field: string integration = 1;
     */
    integration: string;
    /**
     * @generated from field: string api_id = 2;
     */
    apiId: string;
    /**
     * @generated from field: common.v1.Profile profile = 3;
     */
    profile?: Profile;
    constructor(data?: PartialMessage<MetadataRequestDeprecated>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataRequestDeprecated";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataRequestDeprecated;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataRequestDeprecated;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataRequestDeprecated;
    static equals(a: MetadataRequestDeprecated | PlainMessage<MetadataRequestDeprecated> | undefined, b: MetadataRequestDeprecated | PlainMessage<MetadataRequestDeprecated> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataRequest
 */
export declare class MetadataRequest extends Message<MetadataRequest> {
    /**
     * The integration id
     *
     * @generated from field: string integration = 1;
     */
    integration: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: google.protobuf.Struct step_configuration = 3;
     */
    stepConfiguration?: Struct;
    constructor(data?: PartialMessage<MetadataRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataRequest;
    static equals(a: MetadataRequest | PlainMessage<MetadataRequest> | undefined, b: MetadataRequest | PlainMessage<MetadataRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse
 */
export declare class MetadataResponse extends Message<MetadataResponse> {
    /**
     * @generated from oneof api.v1.MetadataResponse.metadata
     */
    metadata: {
        /**
         * @generated from field: api.v1.MetadataResponse.DatabaseSchemaMetadata database_schema_metadata = 1;
         */
        value: MetadataResponse_DatabaseSchemaMetadata;
        case: "databaseSchemaMetadata";
    } | {
        /**
         * @generated from field: api.v1.MetadataResponse.BucketsMetadata buckets_metadata = 2;
         */
        value: MetadataResponse_BucketsMetadata;
        case: "bucketsMetadata";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata kafka = 3;
         */
        value: Metadata$1;
        case: "kafka";
    } | {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.Metadata cosmosdb = 4;
         */
        value: Plugin_Metadata;
        case: "cosmosdb";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.Metadata adls = 5;
         */
        value: Plugin_Metadata$1;
        case: "adls";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: string g_sheets_next_page_token = 6;
     */
    gSheetsNextPageToken: string;
    constructor(data?: PartialMessage<MetadataResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse;
    static equals(a: MetadataResponse | PlainMessage<MetadataResponse> | undefined, b: MetadataResponse | PlainMessage<MetadataResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata
 */
export declare class MetadataResponse_DatabaseSchemaMetadata extends Message<MetadataResponse_DatabaseSchemaMetadata> {
    /**
     * @generated from field: repeated api.v1.MetadataResponse.DatabaseSchemaMetadata.Table tables = 1;
     */
    tables: MetadataResponse_DatabaseSchemaMetadata_Table[];
    /**
     * NOTE: (joey) this is optional in the TS version of this model. should be here as well
     *
     * @generated from field: repeated api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema schemas = 2;
     */
    schemas: MetadataResponse_DatabaseSchemaMetadata_Schema[];
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata | PlainMessage<MetadataResponse_DatabaseSchemaMetadata> | undefined, b: MetadataResponse_DatabaseSchemaMetadata | PlainMessage<MetadataResponse_DatabaseSchemaMetadata> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata.Column
 */
export declare class MetadataResponse_DatabaseSchemaMetadata_Column extends Message<MetadataResponse_DatabaseSchemaMetadata_Column> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string type = 2;
     */
    type: string;
    /**
     * @generated from field: string escaped_name = 3;
     */
    escapedName: string;
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata_Column>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata.Column";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Column;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Column;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Column;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata_Column | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Column> | undefined, b: MetadataResponse_DatabaseSchemaMetadata_Column | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Column> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata.Key
 */
export declare class MetadataResponse_DatabaseSchemaMetadata_Key extends Message<MetadataResponse_DatabaseSchemaMetadata_Key> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string type = 2;
     */
    type: string;
    /**
     * @generated from field: repeated string columns = 3;
     */
    columns: string[];
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata_Key>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata.Key";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Key;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Key;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Key;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata_Key | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Key> | undefined, b: MetadataResponse_DatabaseSchemaMetadata_Key | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Key> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata.Template
 */
export declare class MetadataResponse_DatabaseSchemaMetadata_Template extends Message<MetadataResponse_DatabaseSchemaMetadata_Template> {
    /**
     * @generated from field: string title = 1;
     */
    title: string;
    /**
     * @generated from field: string body = 2;
     */
    body: string;
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata_Template>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata.Template";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Template;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Template;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Template;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata_Template | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Template> | undefined, b: MetadataResponse_DatabaseSchemaMetadata_Template | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Template> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata.Table
 */
export declare class MetadataResponse_DatabaseSchemaMetadata_Table extends Message<MetadataResponse_DatabaseSchemaMetadata_Table> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string type = 2;
     */
    type: string;
    /**
     * @generated from field: string name = 3;
     */
    name: string;
    /**
     * @generated from field: repeated api.v1.MetadataResponse.DatabaseSchemaMetadata.Column columns = 4;
     */
    columns: MetadataResponse_DatabaseSchemaMetadata_Column[];
    /**
     * @generated from field: repeated api.v1.MetadataResponse.DatabaseSchemaMetadata.Key keys = 5;
     */
    keys: MetadataResponse_DatabaseSchemaMetadata_Key[];
    /**
     * @generated from field: repeated api.v1.MetadataResponse.DatabaseSchemaMetadata.Template templates = 6;
     */
    templates: MetadataResponse_DatabaseSchemaMetadata_Template[];
    /**
     * NOTE: (joey) this is optional in the TS version of this model. should be here as well
     *
     * @generated from field: string schema = 7;
     */
    schema: string;
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata_Table>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata.Table";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Table;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Table;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Table;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata_Table | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Table> | undefined, b: MetadataResponse_DatabaseSchemaMetadata_Table | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Table> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema
 */
export declare class MetadataResponse_DatabaseSchemaMetadata_Schema extends Message<MetadataResponse_DatabaseSchemaMetadata_Schema> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    constructor(data?: PartialMessage<MetadataResponse_DatabaseSchemaMetadata_Schema>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Schema;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Schema;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_DatabaseSchemaMetadata_Schema;
    static equals(a: MetadataResponse_DatabaseSchemaMetadata_Schema | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Schema> | undefined, b: MetadataResponse_DatabaseSchemaMetadata_Schema | PlainMessage<MetadataResponse_DatabaseSchemaMetadata_Schema> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.BucketMetadata
 */
export declare class MetadataResponse_BucketMetadata extends Message<MetadataResponse_BucketMetadata> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    constructor(data?: PartialMessage<MetadataResponse_BucketMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.BucketMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_BucketMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_BucketMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_BucketMetadata;
    static equals(a: MetadataResponse_BucketMetadata | PlainMessage<MetadataResponse_BucketMetadata> | undefined, b: MetadataResponse_BucketMetadata | PlainMessage<MetadataResponse_BucketMetadata> | undefined): boolean;
}
/**
 * @generated from message api.v1.MetadataResponse.BucketsMetadata
 */
export declare class MetadataResponse_BucketsMetadata extends Message<MetadataResponse_BucketsMetadata> {
    /**
     * @generated from field: repeated api.v1.MetadataResponse.BucketMetadata buckets = 1;
     */
    buckets: MetadataResponse_BucketMetadata[];
    constructor(data?: PartialMessage<MetadataResponse_BucketsMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.MetadataResponse.BucketsMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataResponse_BucketsMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataResponse_BucketsMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataResponse_BucketsMetadata;
    static equals(a: MetadataResponse_BucketsMetadata | PlainMessage<MetadataResponse_BucketsMetadata> | undefined, b: MetadataResponse_BucketsMetadata | PlainMessage<MetadataResponse_BucketsMetadata> | undefined): boolean;
}
/**
 * @generated from message api.v1.DownloadRequest
 */
export declare class DownloadRequest extends Message<DownloadRequest> {
    /**
     * @generated from field: string location = 1;
     */
    location: string;
    constructor(data?: PartialMessage<DownloadRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.DownloadRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DownloadRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DownloadRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DownloadRequest;
    static equals(a: DownloadRequest | PlainMessage<DownloadRequest> | undefined, b: DownloadRequest | PlainMessage<DownloadRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.DownloadResponse
 */
export declare class DownloadResponse extends Message<DownloadResponse> {
    /**
     * @generated from field: bytes data = 1;
     */
    data: Uint8Array;
    constructor(data?: PartialMessage<DownloadResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.DownloadResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DownloadResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DownloadResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DownloadResponse;
    static equals(a: DownloadResponse | PlainMessage<DownloadResponse> | undefined, b: DownloadResponse | PlainMessage<DownloadResponse> | undefined): boolean;
}
/**
 *
 * DEPRECATED
 *
 * @generated from message api.v1.WorkflowResponse
 */
export declare class WorkflowResponse extends Message<WorkflowResponse> {
    /**
     * @generated from field: google.protobuf.Value data = 1;
     */
    data?: Value;
    /**
     * @generated from field: api.v1.WorkflowResponse.ResponseMeta response_meta = 2;
     */
    responseMeta?: WorkflowResponse_ResponseMeta;
    constructor(data?: PartialMessage<WorkflowResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.WorkflowResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WorkflowResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WorkflowResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WorkflowResponse;
    static equals(a: WorkflowResponse | PlainMessage<WorkflowResponse> | undefined, b: WorkflowResponse | PlainMessage<WorkflowResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.WorkflowResponse.ResponseMeta
 */
export declare class WorkflowResponse_ResponseMeta extends Message<WorkflowResponse_ResponseMeta> {
    /**
     * @generated from field: int32 status = 1;
     */
    status: number;
    /**
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * NOTE(frank): I'm omitting the timing. This may not be good. I'll revisit.
     *
     * @generated from field: bool success = 3;
     */
    success: boolean;
    constructor(data?: PartialMessage<WorkflowResponse_ResponseMeta>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.WorkflowResponse.ResponseMeta";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WorkflowResponse_ResponseMeta;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WorkflowResponse_ResponseMeta;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WorkflowResponse_ResponseMeta;
    static equals(a: WorkflowResponse_ResponseMeta | PlainMessage<WorkflowResponse_ResponseMeta> | undefined, b: WorkflowResponse_ResponseMeta | PlainMessage<WorkflowResponse_ResponseMeta> | undefined): boolean;
}
