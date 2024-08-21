import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Value } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
import { Pair } from "./store_pb";
/**
 * @generated from message store.v1.ReadRequest
 */
export declare class ReadRequest extends Message<ReadRequest> {
    /**
     * @generated from field: repeated string keys = 1;
     */
    keys: string[];
    constructor(data?: PartialMessage<ReadRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.ReadRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadRequest;
    static equals(a: ReadRequest | PlainMessage<ReadRequest> | undefined, b: ReadRequest | PlainMessage<ReadRequest> | undefined): boolean;
}
/**
 * @generated from message store.v1.ReadResponse
 */
export declare class ReadResponse extends Message<ReadResponse> {
    /**
     * @generated from field: repeated google.protobuf.Value results = 1;
     */
    results: Value[];
    /**
     * @generated from field: common.v1.Error error = 2;
     */
    error?: Error;
    constructor(data?: PartialMessage<ReadResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.ReadResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadResponse;
    static equals(a: ReadResponse | PlainMessage<ReadResponse> | undefined, b: ReadResponse | PlainMessage<ReadResponse> | undefined): boolean;
}
/**
 * @generated from message store.v1.WriteRequest
 */
export declare class WriteRequest extends Message<WriteRequest> {
    /**
     * @generated from field: repeated store.v1.Pair pairs = 1;
     */
    pairs: Pair[];
    constructor(data?: PartialMessage<WriteRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.WriteRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WriteRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WriteRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WriteRequest;
    static equals(a: WriteRequest | PlainMessage<WriteRequest> | undefined, b: WriteRequest | PlainMessage<WriteRequest> | undefined): boolean;
}
/**
 * @generated from message store.v1.WriteResponse
 */
export declare class WriteResponse extends Message<WriteResponse> {
    /**
     * @generated from field: repeated store.v1.Pair pairs = 1;
     */
    pairs: Pair[];
    /**
     * @generated from field: common.v1.Error error = 2;
     */
    error?: Error;
    constructor(data?: PartialMessage<WriteResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.WriteResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WriteResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WriteResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WriteResponse;
    static equals(a: WriteResponse | PlainMessage<WriteResponse> | undefined, b: WriteResponse | PlainMessage<WriteResponse> | undefined): boolean;
}
