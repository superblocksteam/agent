import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp, Value } from "@bufbuild/protobuf";
import { Api } from "../../api/v1/api_pb";
import { Signature } from "../../utils/v1/utils_pb";
/**
 * @generated from message security.v1.Resource
 */
export declare class Resource extends Message<Resource> {
    /**
     * @generated from oneof security.v1.Resource.config
     */
    config: {
        /**
         * @generated from field: api.v1.Api api = 1 [deprecated = true];
         * @deprecated
         */
        value: Api;
        case: "api";
    } | {
        /**
         * @generated from field: security.v1.Resource.Literal literal = 2;
         */
        value: Resource_Literal;
        case: "literal";
    } | {
        /**
         * @generated from field: security.v1.Resource.ApiLiteral api_literal = 5;
         */
        value: Resource_ApiLiteral;
        case: "apiLiteral";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof security.v1.Resource.git_ref
     */
    gitRef: {
        /**
         * @generated from field: string commit_id = 3;
         */
        value: string;
        case: "commitId";
    } | {
        /**
         * @generated from field: string branch_name = 4;
         */
        value: string;
        case: "branchName";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Resource>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.Resource";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Resource;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Resource;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Resource;
    static equals(a: Resource | PlainMessage<Resource> | undefined, b: Resource | PlainMessage<Resource> | undefined): boolean;
}
/**
 * @generated from message security.v1.Resource.Literal
 */
export declare class Resource_Literal extends Message<Resource_Literal> {
    /**
     * @generated from field: google.protobuf.Value data = 1;
     */
    data?: Value;
    /**
     * @generated from field: optional utils.v1.Signature signature = 2;
     */
    signature?: Signature;
    /**
     * @generated from field: string resource_id = 3;
     */
    resourceId: string;
    /**
     * @generated from field: string organization_id = 4;
     */
    organizationId: string;
    /**
     * @generated from field: google.protobuf.Timestamp last_updated = 5;
     */
    lastUpdated?: Timestamp;
    /**
     * @generated from field: string type = 6;
     */
    type: string;
    /**
     * @generated from field: int32 page_version = 7;
     */
    pageVersion: number;
    constructor(data?: PartialMessage<Resource_Literal>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.Resource.Literal";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Resource_Literal;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Resource_Literal;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Resource_Literal;
    static equals(a: Resource_Literal | PlainMessage<Resource_Literal> | undefined, b: Resource_Literal | PlainMessage<Resource_Literal> | undefined): boolean;
}
/**
 * @generated from message security.v1.Resource.ApiLiteral
 */
export declare class Resource_ApiLiteral extends Message<Resource_ApiLiteral> {
    /**
     * @generated from field: google.protobuf.Value data = 1;
     */
    data?: Value;
    constructor(data?: PartialMessage<Resource_ApiLiteral>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.Resource.ApiLiteral";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Resource_ApiLiteral;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Resource_ApiLiteral;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Resource_ApiLiteral;
    static equals(a: Resource_ApiLiteral | PlainMessage<Resource_ApiLiteral> | undefined, b: Resource_ApiLiteral | PlainMessage<Resource_ApiLiteral> | undefined): boolean;
}
/**
 * @generated from message security.v1.SignRequest
 */
export declare class SignRequest extends Message<SignRequest> {
    /**
     * @generated from field: security.v1.Resource resource = 1;
     */
    resource?: Resource;
    constructor(data?: PartialMessage<SignRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.SignRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SignRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SignRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SignRequest;
    static equals(a: SignRequest | PlainMessage<SignRequest> | undefined, b: SignRequest | PlainMessage<SignRequest> | undefined): boolean;
}
/**
 * @generated from message security.v1.SignResponse
 */
export declare class SignResponse extends Message<SignResponse> {
    /**
     * @generated from field: utils.v1.Signature signature = 1;
     */
    signature?: Signature;
    constructor(data?: PartialMessage<SignResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.SignResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SignResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SignResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SignResponse;
    static equals(a: SignResponse | PlainMessage<SignResponse> | undefined, b: SignResponse | PlainMessage<SignResponse> | undefined): boolean;
}
/**
 * @generated from message security.v1.VerifyRequest
 */
export declare class VerifyRequest extends Message<VerifyRequest> {
    /**
     * @generated from field: repeated security.v1.Resource resources = 1;
     */
    resources: Resource[];
    constructor(data?: PartialMessage<VerifyRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.VerifyRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): VerifyRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): VerifyRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): VerifyRequest;
    static equals(a: VerifyRequest | PlainMessage<VerifyRequest> | undefined, b: VerifyRequest | PlainMessage<VerifyRequest> | undefined): boolean;
}
/**
 * @generated from message security.v1.VerifyResponse
 */
export declare class VerifyResponse extends Message<VerifyResponse> {
    /**
     * @generated from field: string key_id = 1;
     */
    keyId: string;
    constructor(data?: PartialMessage<VerifyResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.VerifyResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): VerifyResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): VerifyResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): VerifyResponse;
    static equals(a: VerifyResponse | PlainMessage<VerifyResponse> | undefined, b: VerifyResponse | PlainMessage<VerifyResponse> | undefined): boolean;
}
