// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file store/v1/service.proto (package store.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Value } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
import { Pair } from "./store_pb";

/**
 * @generated from message store.v1.ReadRequest
 */
export class ReadRequest extends Message<ReadRequest> {
  /**
   * @generated from field: repeated string keys = 1;
   */
  keys: string[] = [];

  constructor(data?: PartialMessage<ReadRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "store.v1.ReadRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "keys", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadRequest {
    return new ReadRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadRequest {
    return new ReadRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadRequest {
    return new ReadRequest().fromJsonString(jsonString, options);
  }

  static equals(a: ReadRequest | PlainMessage<ReadRequest> | undefined, b: ReadRequest | PlainMessage<ReadRequest> | undefined): boolean {
    return proto3.util.equals(ReadRequest, a, b);
  }
}

/**
 * @generated from message store.v1.ReadResponse
 */
export class ReadResponse extends Message<ReadResponse> {
  /**
   * @generated from field: repeated google.protobuf.Value results = 1;
   */
  results: Value[] = [];

  /**
   * @generated from field: common.v1.Error error = 2;
   */
  error?: Error;

  constructor(data?: PartialMessage<ReadResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "store.v1.ReadResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "results", kind: "message", T: Value, repeated: true },
    { no: 2, name: "error", kind: "message", T: Error },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadResponse {
    return new ReadResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadResponse {
    return new ReadResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadResponse {
    return new ReadResponse().fromJsonString(jsonString, options);
  }

  static equals(a: ReadResponse | PlainMessage<ReadResponse> | undefined, b: ReadResponse | PlainMessage<ReadResponse> | undefined): boolean {
    return proto3.util.equals(ReadResponse, a, b);
  }
}

/**
 * @generated from message store.v1.WriteRequest
 */
export class WriteRequest extends Message<WriteRequest> {
  /**
   * @generated from field: repeated store.v1.Pair pairs = 1;
   */
  pairs: Pair[] = [];

  constructor(data?: PartialMessage<WriteRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "store.v1.WriteRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "pairs", kind: "message", T: Pair, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WriteRequest {
    return new WriteRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WriteRequest {
    return new WriteRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WriteRequest {
    return new WriteRequest().fromJsonString(jsonString, options);
  }

  static equals(a: WriteRequest | PlainMessage<WriteRequest> | undefined, b: WriteRequest | PlainMessage<WriteRequest> | undefined): boolean {
    return proto3.util.equals(WriteRequest, a, b);
  }
}

/**
 * @generated from message store.v1.WriteResponse
 */
export class WriteResponse extends Message<WriteResponse> {
  /**
   * @generated from field: repeated store.v1.Pair pairs = 1;
   */
  pairs: Pair[] = [];

  /**
   * @generated from field: common.v1.Error error = 2;
   */
  error?: Error;

  constructor(data?: PartialMessage<WriteResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "store.v1.WriteResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "pairs", kind: "message", T: Pair, repeated: true },
    { no: 2, name: "error", kind: "message", T: Error },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WriteResponse {
    return new WriteResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WriteResponse {
    return new WriteResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WriteResponse {
    return new WriteResponse().fromJsonString(jsonString, options);
  }

  static equals(a: WriteResponse | PlainMessage<WriteResponse> | undefined, b: WriteResponse | PlainMessage<WriteResponse> | undefined): boolean {
    return proto3.util.equals(WriteResponse, a, b);
  }
}

