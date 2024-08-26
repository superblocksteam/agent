// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file secrets/v1/store.proto (package secrets.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
import { Details, Invalidation, Provider } from "./secrets_pb";
import { Profile } from "../../common/v1/common_pb";

/**
 * @generated from message secrets.v1.InvalidateRequest
 */
export class InvalidateRequest extends Message<InvalidateRequest> {
  /**
   * @generated from field: string store = 1;
   */
  store = "";

  /**
   * @generated from field: string secret = 2;
   */
  secret = "";

  /**
   * @generated from field: string configuration_id = 3;
   */
  configurationId = "";

  constructor(data?: PartialMessage<InvalidateRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "secrets.v1.InvalidateRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "store", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "secret", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "configuration_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InvalidateRequest {
    return new InvalidateRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InvalidateRequest {
    return new InvalidateRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InvalidateRequest {
    return new InvalidateRequest().fromJsonString(jsonString, options);
  }

  static equals(a: InvalidateRequest | PlainMessage<InvalidateRequest> | undefined, b: InvalidateRequest | PlainMessage<InvalidateRequest> | undefined): boolean {
    return proto3.util.equals(InvalidateRequest, a, b);
  }
}

/**
 * @generated from message secrets.v1.InvalidateResponse
 */
export class InvalidateResponse extends Message<InvalidateResponse> {
  /**
   * @generated from field: repeated common.v1.Error errors = 1;
   */
  errors: Error[] = [];

  /**
   * @generated from field: repeated secrets.v1.Invalidation invalidations = 2;
   */
  invalidations: Invalidation[] = [];

  /**
   * @generated from field: string message = 3;
   */
  message = "";

  constructor(data?: PartialMessage<InvalidateResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "secrets.v1.InvalidateResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "errors", kind: "message", T: Error, repeated: true },
    { no: 2, name: "invalidations", kind: "message", T: Invalidation, repeated: true },
    { no: 3, name: "message", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InvalidateResponse {
    return new InvalidateResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InvalidateResponse {
    return new InvalidateResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InvalidateResponse {
    return new InvalidateResponse().fromJsonString(jsonString, options);
  }

  static equals(a: InvalidateResponse | PlainMessage<InvalidateResponse> | undefined, b: InvalidateResponse | PlainMessage<InvalidateResponse> | undefined): boolean {
    return proto3.util.equals(InvalidateResponse, a, b);
  }
}

/**
 * @generated from message secrets.v1.ListSecretsRequest
 */
export class ListSecretsRequest extends Message<ListSecretsRequest> {
  /**
   * @generated from field: string store = 1;
   */
  store = "";

  /**
   * @generated from field: common.v1.Profile profile = 2;
   */
  profile?: Profile;

  /**
   * @generated from field: optional secrets.v1.Provider provider = 3;
   */
  provider?: Provider;

  constructor(data?: PartialMessage<ListSecretsRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "secrets.v1.ListSecretsRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "store", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "profile", kind: "message", T: Profile },
    { no: 3, name: "provider", kind: "message", T: Provider, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListSecretsRequest {
    return new ListSecretsRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListSecretsRequest {
    return new ListSecretsRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListSecretsRequest {
    return new ListSecretsRequest().fromJsonString(jsonString, options);
  }

  static equals(a: ListSecretsRequest | PlainMessage<ListSecretsRequest> | undefined, b: ListSecretsRequest | PlainMessage<ListSecretsRequest> | undefined): boolean {
    return proto3.util.equals(ListSecretsRequest, a, b);
  }
}

/**
 * @generated from message secrets.v1.ListSecretsResponse
 */
export class ListSecretsResponse extends Message<ListSecretsResponse> {
  /**
   * @generated from field: repeated secrets.v1.Details secrets = 1;
   */
  secrets: Details[] = [];

  constructor(data?: PartialMessage<ListSecretsResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "secrets.v1.ListSecretsResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "secrets", kind: "message", T: Details, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListSecretsResponse {
    return new ListSecretsResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListSecretsResponse {
    return new ListSecretsResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListSecretsResponse {
    return new ListSecretsResponse().fromJsonString(jsonString, options);
  }

  static equals(a: ListSecretsResponse | PlainMessage<ListSecretsResponse> | undefined, b: ListSecretsResponse | PlainMessage<ListSecretsResponse> | undefined): boolean {
    return proto3.util.equals(ListSecretsResponse, a, b);
  }
}
