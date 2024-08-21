import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct, Timestamp } from "@bufbuild/protobuf";
import { Api } from "./api_pb";
import { Link } from "../../common/v1/api_pb";
import { Error } from "../../common/v1/errors_pb";
import { Signature } from "../../utils/v1/utils_pb";
/**
 * @generated from message api.v1.PatchApi
 */
export declare class PatchApi extends Message<PatchApi> {
    /**
     * @generated from field: api.v1.Api api = 1;
     */
    api?: Api;
    /**
     * @generated from oneof api.v1.PatchApi.git_ref
     */
    gitRef: {
        /**
         * @generated from field: string commit_id = 2;
         */
        value: string;
        case: "commitId";
    } | {
        /**
         * @generated from field: string branch_name = 3;
         */
        value: string;
        case: "branchName";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<PatchApi>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.PatchApi";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PatchApi;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PatchApi;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PatchApi;
    static equals(a: PatchApi | PlainMessage<PatchApi> | undefined, b: PatchApi | PlainMessage<PatchApi> | undefined): boolean;
}
/**
 * PATCH api/v3/apis
 *
 * @generated from message api.v1.PatchApisRequest
 */
export declare class PatchApisRequest extends Message<PatchApisRequest> {
    /**
     * @generated from field: repeated api.v1.PatchApi patches = 1;
     */
    patches: PatchApi[];
    constructor(data?: PartialMessage<PatchApisRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.PatchApisRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PatchApisRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PatchApisRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PatchApisRequest;
    static equals(a: PatchApisRequest | PlainMessage<PatchApisRequest> | undefined, b: PatchApisRequest | PlainMessage<PatchApisRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.PatchApisResponse
 */
export declare class PatchApisResponse extends Message<PatchApisResponse> {
    /**
     * @generated from field: repeated api.v1.PatchApisResponse.Status statuses = 1;
     */
    statuses: PatchApisResponse_Status[];
    /**
     * @generated from field: map<string, common.v1.Link> links = 2;
     */
    links: {
        [key: string]: Link;
    };
    constructor(data?: PartialMessage<PatchApisResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.PatchApisResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PatchApisResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PatchApisResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PatchApisResponse;
    static equals(a: PatchApisResponse | PlainMessage<PatchApisResponse> | undefined, b: PatchApisResponse | PlainMessage<PatchApisResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.PatchApisResponse.Status
 */
export declare class PatchApisResponse_Status extends Message<PatchApisResponse_Status> {
    /**
     * @generated from field: string api_id = 1;
     */
    apiId: string;
    /**
     * @generated from field: int32 code = 2;
     */
    code: number;
    /**
     * @generated from field: string message = 3;
     */
    message: string;
    /**
     * @generated from field: common.v1.Error error = 4;
     */
    error?: Error;
    constructor(data?: PartialMessage<PatchApisResponse_Status>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.PatchApisResponse.Status";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PatchApisResponse_Status;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PatchApisResponse_Status;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PatchApisResponse_Status;
    static equals(a: PatchApisResponse_Status | PlainMessage<PatchApisResponse_Status> | undefined, b: PatchApisResponse_Status | PlainMessage<PatchApisResponse_Status> | undefined): boolean;
}
/**
 * @generated from message api.v1.UpdateApplicationSignature
 */
export declare class UpdateApplicationSignature extends Message<UpdateApplicationSignature> {
    /**
     * @generated from field: string application_id = 1;
     */
    applicationId: string;
    /**
     * @generated from oneof api.v1.UpdateApplicationSignature.git_ref
     */
    gitRef: {
        /**
         * @generated from field: string commit_id = 2;
         */
        value: string;
        case: "commitId";
    } | {
        /**
         * @generated from field: string branch_name = 3;
         */
        value: string;
        case: "branchName";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: utils.v1.Signature signature = 4;
     */
    signature?: Signature;
    /**
     * @generated from field: google.protobuf.Timestamp updated = 5;
     */
    updated?: Timestamp;
    /**
     * @generated from field: int32 page_version = 6;
     */
    pageVersion: number;
    constructor(data?: PartialMessage<UpdateApplicationSignature>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.UpdateApplicationSignature";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateApplicationSignature;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateApplicationSignature;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateApplicationSignature;
    static equals(a: UpdateApplicationSignature | PlainMessage<UpdateApplicationSignature> | undefined, b: UpdateApplicationSignature | PlainMessage<UpdateApplicationSignature> | undefined): boolean;
}
/**
 * PUT api/v2/application/signatures
 *
 * @generated from message api.v1.UpdateApplicationSignaturesRequest
 */
export declare class UpdateApplicationSignaturesRequest extends Message<UpdateApplicationSignaturesRequest> {
    /**
     * @generated from field: repeated api.v1.UpdateApplicationSignature updates = 1;
     */
    updates: UpdateApplicationSignature[];
    constructor(data?: PartialMessage<UpdateApplicationSignaturesRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.UpdateApplicationSignaturesRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateApplicationSignaturesRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesRequest;
    static equals(a: UpdateApplicationSignaturesRequest | PlainMessage<UpdateApplicationSignaturesRequest> | undefined, b: UpdateApplicationSignaturesRequest | PlainMessage<UpdateApplicationSignaturesRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.UpdateApplicationSignaturesResponse
 */
export declare class UpdateApplicationSignaturesResponse extends Message<UpdateApplicationSignaturesResponse> {
    /**
     * @generated from field: repeated api.v1.UpdateApplicationSignaturesResponse.Status statuses = 1;
     */
    statuses: UpdateApplicationSignaturesResponse_Status[];
    /**
     * @generated from field: map<string, common.v1.Link> links = 2;
     */
    links: {
        [key: string]: Link;
    };
    constructor(data?: PartialMessage<UpdateApplicationSignaturesResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.UpdateApplicationSignaturesResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateApplicationSignaturesResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesResponse;
    static equals(a: UpdateApplicationSignaturesResponse | PlainMessage<UpdateApplicationSignaturesResponse> | undefined, b: UpdateApplicationSignaturesResponse | PlainMessage<UpdateApplicationSignaturesResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.UpdateApplicationSignaturesResponse.Status
 */
export declare class UpdateApplicationSignaturesResponse_Status extends Message<UpdateApplicationSignaturesResponse_Status> {
    /**
     * @generated from field: string application_id = 1;
     */
    applicationId: string;
    /**
     * @generated from oneof api.v1.UpdateApplicationSignaturesResponse.Status.git_ref
     */
    gitRef: {
        /**
         * @generated from field: string commit_id = 2;
         */
        value: string;
        case: "commitId";
    } | {
        /**
         * @generated from field: string branch_name = 3;
         */
        value: string;
        case: "branchName";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: int32 code = 4;
     */
    code: number;
    /**
     * @generated from field: string message = 5;
     */
    message: string;
    /**
     * @generated from field: common.v1.Error error = 6;
     */
    error?: Error;
    constructor(data?: PartialMessage<UpdateApplicationSignaturesResponse_Status>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.UpdateApplicationSignaturesResponse.Status";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateApplicationSignaturesResponse_Status;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesResponse_Status;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateApplicationSignaturesResponse_Status;
    static equals(a: UpdateApplicationSignaturesResponse_Status | PlainMessage<UpdateApplicationSignaturesResponse_Status> | undefined, b: UpdateApplicationSignaturesResponse_Status | PlainMessage<UpdateApplicationSignaturesResponse_Status> | undefined): boolean;
}
/**
 * @generated from message api.v1.GenericBatch
 */
export declare class GenericBatch extends Message<GenericBatch> {
    /**
     * @generated from field: api.v1.GenericBatch.Items data = 1;
     */
    data?: GenericBatch_Items;
    constructor(data?: PartialMessage<GenericBatch>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.GenericBatch";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GenericBatch;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GenericBatch;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GenericBatch;
    static equals(a: GenericBatch | PlainMessage<GenericBatch> | undefined, b: GenericBatch | PlainMessage<GenericBatch> | undefined): boolean;
}
/**
 * @generated from message api.v1.GenericBatch.Items
 */
export declare class GenericBatch_Items extends Message<GenericBatch_Items> {
    /**
     * @generated from field: repeated google.protobuf.Struct items = 1;
     */
    items: Struct[];
    constructor(data?: PartialMessage<GenericBatch_Items>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.GenericBatch.Items";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GenericBatch_Items;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GenericBatch_Items;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GenericBatch_Items;
    static equals(a: GenericBatch_Items | PlainMessage<GenericBatch_Items> | undefined, b: GenericBatch_Items | PlainMessage<GenericBatch_Items> | undefined): boolean;
}
/**
 * @generated from message api.v1.GenericBatchResponse
 */
export declare class GenericBatchResponse extends Message<GenericBatchResponse> {
    /**
     * @generated from field: api.v1.GenericBatch data = 1;
     */
    data?: GenericBatch;
    constructor(data?: PartialMessage<GenericBatchResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.GenericBatchResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GenericBatchResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GenericBatchResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GenericBatchResponse;
    static equals(a: GenericBatchResponse | PlainMessage<GenericBatchResponse> | undefined, b: GenericBatchResponse | PlainMessage<GenericBatchResponse> | undefined): boolean;
}
