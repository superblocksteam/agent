// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file event/v1/service.proto (package event.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message event.v1.IngestEventRequest
 */
export class IngestEventRequest extends Message<IngestEventRequest> {
  /**
   * @generated from field: repeated bytes events = 1;
   */
  events: Uint8Array[] = [];

  constructor(data?: PartialMessage<IngestEventRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "event.v1.IngestEventRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "events", kind: "scalar", T: 12 /* ScalarType.BYTES */, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventRequest {
    return new IngestEventRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventRequest {
    return new IngestEventRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventRequest {
    return new IngestEventRequest().fromJsonString(jsonString, options);
  }

  static equals(a: IngestEventRequest | PlainMessage<IngestEventRequest> | undefined, b: IngestEventRequest | PlainMessage<IngestEventRequest> | undefined): boolean {
    return proto3.util.equals(IngestEventRequest, a, b);
  }
}

/**
 * @generated from message event.v1.IngestEventResponse
 */
export class IngestEventResponse extends Message<IngestEventResponse> {
  /**
   * @generated from field: int32 success = 1;
   */
  success = 0;

  /**
   * @generated from field: repeated event.v1.IngestEventResponse.ErrorWrapper errors = 2;
   */
  errors: IngestEventResponse_ErrorWrapper[] = [];

  constructor(data?: PartialMessage<IngestEventResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "event.v1.IngestEventResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "success", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "errors", kind: "message", T: IngestEventResponse_ErrorWrapper, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventResponse {
    return new IngestEventResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventResponse {
    return new IngestEventResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventResponse {
    return new IngestEventResponse().fromJsonString(jsonString, options);
  }

  static equals(a: IngestEventResponse | PlainMessage<IngestEventResponse> | undefined, b: IngestEventResponse | PlainMessage<IngestEventResponse> | undefined): boolean {
    return proto3.util.equals(IngestEventResponse, a, b);
  }
}

/**
 * @generated from message event.v1.IngestEventResponse.ErrorWrapper
 */
export class IngestEventResponse_ErrorWrapper extends Message<IngestEventResponse_ErrorWrapper> {
  /**
   * @generated from field: string id = 1;
   */
  id = "";

  /**
   * @generated from field: string error = 2;
   */
  error = "";

  constructor(data?: PartialMessage<IngestEventResponse_ErrorWrapper>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "event.v1.IngestEventResponse.ErrorWrapper";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "error", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventResponse_ErrorWrapper {
    return new IngestEventResponse_ErrorWrapper().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventResponse_ErrorWrapper {
    return new IngestEventResponse_ErrorWrapper().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventResponse_ErrorWrapper {
    return new IngestEventResponse_ErrorWrapper().fromJsonString(jsonString, options);
  }

  static equals(a: IngestEventResponse_ErrorWrapper | PlainMessage<IngestEventResponse_ErrorWrapper> | undefined, b: IngestEventResponse_ErrorWrapper | PlainMessage<IngestEventResponse_ErrorWrapper> | undefined): boolean {
    return proto3.util.equals(IngestEventResponse_ErrorWrapper, a, b);
  }
}

