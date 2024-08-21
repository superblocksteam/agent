import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message common.v1.Pool
 */
export declare class Pool extends Message<Pool> {
    /**
     * @generated from field: optional uint32 hits = 1;
     */
    hits?: number;
    /**
     * @generated from field: optional uint32 misses = 2;
     */
    misses?: number;
    /**
     * @generated from field: optional uint32 timeouts = 3;
     */
    timeouts?: number;
    /**
     * @generated from field: optional uint32 total = 4;
     */
    total?: number;
    /**
     * @generated from field: optional uint32 idle = 5;
     */
    idle?: number;
    /**
     * @generated from field: optional uint32 stale = 6;
     */
    stale?: number;
    constructor(data?: PartialMessage<Pool>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Pool";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Pool;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Pool;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Pool;
    static equals(a: Pool | PlainMessage<Pool> | undefined, b: Pool | PlainMessage<Pool> | undefined): boolean;
}
/**
 * @generated from message common.v1.HealthResponse
 */
export declare class HealthResponse extends Message<HealthResponse> {
    /**
     * @generated from field: string message = 1;
     */
    message: string;
    /**
     * @generated from field: int64 uptime = 2;
     */
    uptime: bigint;
    /**
     * @generated from field: string version = 3;
     */
    version: string;
    /**
     * @generated from field: common.v1.Pool store = 4;
     */
    store?: Pool;
    /**
     * @generated from field: common.v1.Pool stream = 5;
     */
    stream?: Pool;
    /**
     * @generated from field: string id = 6;
     */
    id: string;
    constructor(data?: PartialMessage<HealthResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.HealthResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HealthResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HealthResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HealthResponse;
    static equals(a: HealthResponse | PlainMessage<HealthResponse> | undefined, b: HealthResponse | PlainMessage<HealthResponse> | undefined): boolean;
}
