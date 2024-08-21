import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
import { Details, Invalidation, Provider } from "./secrets_pb";
import { Profile } from "../../common/v1/common_pb";
/**
 * @generated from message secrets.v1.InvalidateRequest
 */
export declare class InvalidateRequest extends Message<InvalidateRequest> {
    /**
     * @generated from field: string store = 1;
     */
    store: string;
    /**
     * @generated from field: string secret = 2;
     */
    secret: string;
    /**
     * @generated from field: string configuration_id = 3;
     */
    configurationId: string;
    constructor(data?: PartialMessage<InvalidateRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.InvalidateRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InvalidateRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InvalidateRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InvalidateRequest;
    static equals(a: InvalidateRequest | PlainMessage<InvalidateRequest> | undefined, b: InvalidateRequest | PlainMessage<InvalidateRequest> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.InvalidateResponse
 */
export declare class InvalidateResponse extends Message<InvalidateResponse> {
    /**
     * @generated from field: repeated common.v1.Error errors = 1;
     */
    errors: Error[];
    /**
     * @generated from field: repeated secrets.v1.Invalidation invalidations = 2;
     */
    invalidations: Invalidation[];
    /**
     * @generated from field: string message = 3;
     */
    message: string;
    constructor(data?: PartialMessage<InvalidateResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.InvalidateResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InvalidateResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InvalidateResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InvalidateResponse;
    static equals(a: InvalidateResponse | PlainMessage<InvalidateResponse> | undefined, b: InvalidateResponse | PlainMessage<InvalidateResponse> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.ListSecretsRequest
 */
export declare class ListSecretsRequest extends Message<ListSecretsRequest> {
    /**
     * @generated from field: string store = 1;
     */
    store: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: optional secrets.v1.Provider provider = 3;
     */
    provider?: Provider;
    constructor(data?: PartialMessage<ListSecretsRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.ListSecretsRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListSecretsRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListSecretsRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListSecretsRequest;
    static equals(a: ListSecretsRequest | PlainMessage<ListSecretsRequest> | undefined, b: ListSecretsRequest | PlainMessage<ListSecretsRequest> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.ListSecretsResponse
 */
export declare class ListSecretsResponse extends Message<ListSecretsResponse> {
    /**
     * @generated from field: repeated secrets.v1.Details secrets = 1;
     */
    secrets: Details[];
    constructor(data?: PartialMessage<ListSecretsResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.ListSecretsResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListSecretsResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListSecretsResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListSecretsResponse;
    static equals(a: ListSecretsResponse | PlainMessage<ListSecretsResponse> | undefined, b: ListSecretsResponse | PlainMessage<ListSecretsResponse> | undefined): boolean;
}
