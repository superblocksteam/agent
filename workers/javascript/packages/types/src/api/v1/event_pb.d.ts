import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct, Timestamp, Value } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
/**
 * @generated from enum api.v1.BlockStatus
 */
export declare enum BlockStatus {
    /**
     * @generated from enum value: BLOCK_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: BLOCK_STATUS_SUCCEEDED = 1;
     */
    SUCCEEDED = 1,
    /**
     * @generated from enum value: BLOCK_STATUS_ERRORED = 2;
     */
    ERRORED = 2
}
/**
 * @generated from enum api.v1.BlockType
 */
export declare enum BlockType {
    /**
     * @generated from enum value: BLOCK_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: BLOCK_TYPE_BREAK = 1;
     */
    BREAK = 1,
    /**
     * @generated from enum value: BLOCK_TYPE_RETURN = 2;
     */
    RETURN = 2,
    /**
     * @generated from enum value: BLOCK_TYPE_WAIT = 3;
     */
    WAIT = 3,
    /**
     * @generated from enum value: BLOCK_TYPE_PARALLEL = 4;
     */
    PARALLEL = 4,
    /**
     * @generated from enum value: BLOCK_TYPE_CONDITIONAL = 5;
     */
    CONDITIONAL = 5,
    /**
     * @generated from enum value: BLOCK_TYPE_LOOP = 6;
     */
    LOOP = 6,
    /**
     * @generated from enum value: BLOCK_TYPE_TRYCATCH = 7;
     */
    TRYCATCH = 7,
    /**
     * @generated from enum value: BLOCK_TYPE_STEP = 8;
     */
    STEP = 8,
    /**
     * @generated from enum value: BLOCK_TYPE_VARIABLES = 9;
     */
    VARIABLES = 9,
    /**
     * @generated from enum value: BLOCK_TYPE_THROW = 10;
     */
    THROW = 10,
    /**
     * @generated from enum value: BLOCK_TYPE_SEND = 11;
     */
    SEND = 11,
    /**
     * @generated from enum value: BLOCK_TYPE_STREAM = 12;
     */
    STREAM = 12
}
/**
 * @generated from message api.v1.Resolved
 */
export declare class Resolved extends Message<Resolved> {
    /**
     * @generated from field: google.protobuf.Value value = 1;
     */
    value?: Value;
    /**
     *
     * If the value was comprised of more than one bindings, the individual resolutions will be here.
     *
     * @generated from field: repeated google.protobuf.Value bindings = 2;
     */
    bindings: Value[];
    constructor(data?: PartialMessage<Resolved>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Resolved";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Resolved;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Resolved;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Resolved;
    static equals(a: Resolved | PlainMessage<Resolved> | undefined, b: Resolved | PlainMessage<Resolved> | undefined): boolean;
}
/**
 * @generated from message api.v1.Event
 */
export declare class Event extends Message<Event> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: api.v1.BlockType type = 2;
     */
    type: BlockType;
    /**
     * @generated from field: google.protobuf.Timestamp timestamp = 3;
     */
    timestamp?: Timestamp;
    /**
     * @generated from oneof api.v1.Event.event
     */
    event: {
        /**
         * @generated from field: api.v1.Event.Start start = 4;
         */
        value: Event_Start;
        case: "start";
    } | {
        /**
         * @generated from field: api.v1.Event.End end = 5;
         */
        value: Event_End;
        case: "end";
    } | {
        /**
         * @generated from field: api.v1.Event.Data data = 7;
         */
        value: Event_Data;
        case: "data";
    } | {
        /**
         * @generated from field: api.v1.Event.Request request = 9;
         */
        value: Event_Request;
        case: "request";
    } | {
        /**
         * TODO(frank): Whoops; move function requests here.
         *
         * @generated from field: api.v1.Event.Response response = 10;
         */
        value: Event_Response;
        case: "response";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     *
     * The name of the parent block, if any.
     *
     * @generated from field: optional string parent = 6;
     */
    parent?: string;
    /**
     * *
     * The execution index if this is child step of parallels and loops.
     *
     * @generated from field: optional string execution_index = 8;
     */
    executionIndex?: string;
    constructor(data?: PartialMessage<Event>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event;
    static equals(a: Event | PlainMessage<Event> | undefined, b: Event | PlainMessage<Event> | undefined): boolean;
}
/**
 * @generated from message api.v1.Event.Data
 */
export declare class Event_Data extends Message<Event_Data> {
    /**
     * @generated from field: google.protobuf.Value value = 1;
     */
    value?: Value;
    constructor(data?: PartialMessage<Event_Data>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event.Data";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event_Data;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event_Data;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event_Data;
    static equals(a: Event_Data | PlainMessage<Event_Data> | undefined, b: Event_Data | PlainMessage<Event_Data> | undefined): boolean;
}
/**
 *
 * Represents the start of an Api.
 *
 * @generated from message api.v1.Event.Request
 */
export declare class Event_Request extends Message<Event_Request> {
    constructor(data?: PartialMessage<Event_Request>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event.Request";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event_Request;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event_Request;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event_Request;
    static equals(a: Event_Request | PlainMessage<Event_Request> | undefined, b: Event_Request | PlainMessage<Event_Request> | undefined): boolean;
}
/**
 *
 * Represents the completion of an Api.
 *
 * @generated from message api.v1.Event.Response
 */
export declare class Event_Response extends Message<Event_Response> {
    /**
     *
     * The name of the block that represents the response of the Api.
     *
     * @generated from field: string last = 1;
     */
    last: string;
    /**
     *
     * The errors, if any.
     *
     * @generated from field: repeated common.v1.Error errors = 3;
     */
    errors: Error[];
    constructor(data?: PartialMessage<Event_Response>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event.Response";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event_Response;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event_Response;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event_Response;
    static equals(a: Event_Response | PlainMessage<Event_Response> | undefined, b: Event_Response | PlainMessage<Event_Response> | undefined): boolean;
}
/**
 * @generated from message api.v1.Event.Start
 */
export declare class Event_Start extends Message<Event_Start> {
    constructor(data?: PartialMessage<Event_Start>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event.Start";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event_Start;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event_Start;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event_Start;
    static equals(a: Event_Start | PlainMessage<Event_Start> | undefined, b: Event_Start | PlainMessage<Event_Start> | undefined): boolean;
}
/**
 * @generated from message api.v1.Event.End
 */
export declare class Event_End extends Message<Event_End> {
    /**
     *
     * Performance data for the block that just ended.
     *
     * @generated from field: api.v1.Performance performance = 1;
     */
    performance?: Performance;
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
    /**
     * @generated from field: api.v1.BlockStatus status = 4;
     */
    status: BlockStatus;
    /**
     *
     * Any resolved bindings.
     *
     * @generated from field: map<string, api.v1.Resolved> resolved = 5;
     */
    resolved: {
        [key: string]: Resolved;
    };
    constructor(data?: PartialMessage<Event_End>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Event.End";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Event_End;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Event_End;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Event_End;
    static equals(a: Event_End | PlainMessage<Event_End> | undefined, b: Event_End | PlainMessage<Event_End> | undefined): boolean;
}
/**
 * @generated from message api.v1.Performance
 */
export declare class Performance extends Message<Performance> {
    /**
     * @generated from field: int64 start = 1;
     */
    start: bigint;
    /**
     * @generated from field: int64 finish = 2;
     */
    finish: bigint;
    /**
     * @generated from field: int64 total = 3;
     */
    total: bigint;
    /**
     * @generated from field: int64 execution = 4;
     */
    execution: bigint;
    /**
     * @generated from field: int64 overhead = 5;
     */
    overhead: bigint;
    /**
     * @generated from field: map<string, int64> custom = 6;
     */
    custom: {
        [key: string]: bigint;
    };
    constructor(data?: PartialMessage<Performance>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Performance";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Performance;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Performance;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Performance;
    static equals(a: Performance | PlainMessage<Performance> | undefined, b: Performance | PlainMessage<Performance> | undefined): boolean;
}
/**
 * @generated from message api.v1.Output
 */
export declare class Output extends Message<Output> {
    /**
     *
     * The JSON encoded response.
     *
     * @generated from field: google.protobuf.Value result = 1;
     */
    result?: Value;
    /**
     *
     * The original request.
     *
     * @generated from field: string request = 2;
     */
    request: string;
    /**
     * @generated from field: repeated string stdout = 3;
     */
    stdout: string[];
    /**
     * @generated from field: repeated string stderr = 4;
     */
    stderr: string[];
    /**
     * @generated from field: api.v1.Output.Request request_v2 = 5;
     */
    requestV2?: Output_Request;
    constructor(data?: PartialMessage<Output>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Output";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Output;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Output;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Output;
    static equals(a: Output | PlainMessage<Output> | undefined, b: Output | PlainMessage<Output> | undefined): boolean;
}
/**
 * @generated from message api.v1.Output.Request
 */
export declare class Output_Request extends Message<Output_Request> {
    /**
     * @generated from field: string summary = 1;
     */
    summary: string;
    /**
     * @generated from field: optional google.protobuf.Struct metadata = 5;
     */
    metadata?: Struct;
    constructor(data?: PartialMessage<Output_Request>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Output.Request";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Output_Request;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Output_Request;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Output_Request;
    static equals(a: Output_Request | PlainMessage<Output_Request> | undefined, b: Output_Request | PlainMessage<Output_Request> | undefined): boolean;
}
/**
 * @generated from message api.v1.OutputOld
 */
export declare class OutputOld extends Message<OutputOld> {
    /**
     * @generated from field: google.protobuf.Value output = 1;
     */
    output?: Value;
    /**
     * @generated from field: repeated string log = 2;
     */
    log: string[];
    /**
     * @generated from field: string request = 3;
     */
    request: string;
    /**
     * @generated from field: google.protobuf.Value place_holders_info = 4;
     */
    placeHoldersInfo?: Value;
    constructor(data?: PartialMessage<OutputOld>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.OutputOld";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OutputOld;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OutputOld;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OutputOld;
    static equals(a: OutputOld | PlainMessage<OutputOld> | undefined, b: OutputOld | PlainMessage<OutputOld> | undefined): boolean;
}
