import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp } from "@bufbuild/protobuf";
import { Resource } from "./service_pb";
/**
 * GET api/v1/keyrotations
 *
 * @generated from enum security.v1.KeyRotationStatus
 */
export declare enum KeyRotationStatus {
    /**
     * @generated from enum value: KEY_ROTATION_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: KEY_ROTATION_STATUS_IN_PROGRESS = 1;
     */
    IN_PROGRESS = 1,
    /**
     * @generated from enum value: KEY_ROTATION_STATUS_COMPLETED = 2;
     */
    COMPLETED = 2,
    /**
     * @generated from enum value: KEY_ROTATION_STATUS_FAILED = 3;
     */
    FAILED = 3,
    /**
     * @generated from enum value: KEY_ROTATION_STATUS_CANCELED = 4;
     */
    CANCELED = 4
}
/**
 * POST api/v1/keyrotations/claim-resources
 *
 * @generated from message security.v1.ResourcesToResignRequest
 */
export declare class ResourcesToResignRequest extends Message<ResourcesToResignRequest> {
    /**
     * Unique name for the caller for locking purposes
     *
     * @generated from field: string claimed_by = 1;
     */
    claimedBy: string;
    /**
     * @generated from field: int32 limit = 2;
     */
    limit: number;
    constructor(data?: PartialMessage<ResourcesToResignRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.ResourcesToResignRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ResourcesToResignRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ResourcesToResignRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ResourcesToResignRequest;
    static equals(a: ResourcesToResignRequest | PlainMessage<ResourcesToResignRequest> | undefined, b: ResourcesToResignRequest | PlainMessage<ResourcesToResignRequest> | undefined): boolean;
}
/**
 * @generated from message security.v1.ResourcesToResignResponse
 */
export declare class ResourcesToResignResponse extends Message<ResourcesToResignResponse> {
    /**
     * @generated from field: repeated security.v1.Resource resources = 1;
     */
    resources: Resource[];
    constructor(data?: PartialMessage<ResourcesToResignResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.ResourcesToResignResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ResourcesToResignResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ResourcesToResignResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ResourcesToResignResponse;
    static equals(a: ResourcesToResignResponse | PlainMessage<ResourcesToResignResponse> | undefined, b: ResourcesToResignResponse | PlainMessage<ResourcesToResignResponse> | undefined): boolean;
}
/**
 * @generated from message security.v1.KeyRotation
 */
export declare class KeyRotation extends Message<KeyRotation> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: security.v1.KeyRotationStatus status = 2;
     */
    status: KeyRotationStatus;
    /**
     * @generated from field: int32 resources_completed = 3;
     */
    resourcesCompleted: number;
    /**
     * @generated from field: int32 resources_total = 4;
     */
    resourcesTotal: number;
    /**
     * @generated from field: string signing_key_id = 5;
     */
    signingKeyId: string;
    /**
     * @generated from field: google.protobuf.Timestamp created = 6;
     */
    created?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp updated = 7;
     */
    updated?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp completed = 8;
     */
    completed?: Timestamp;
    constructor(data?: PartialMessage<KeyRotation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.KeyRotation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): KeyRotation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): KeyRotation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): KeyRotation;
    static equals(a: KeyRotation | PlainMessage<KeyRotation> | undefined, b: KeyRotation | PlainMessage<KeyRotation> | undefined): boolean;
}
/**
 * @generated from message security.v1.KeyRotationsResponse
 */
export declare class KeyRotationsResponse extends Message<KeyRotationsResponse> {
    /**
     * @generated from field: repeated security.v1.KeyRotation key_rotations = 1;
     */
    keyRotations: KeyRotation[];
    constructor(data?: PartialMessage<KeyRotationsResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "security.v1.KeyRotationsResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): KeyRotationsResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): KeyRotationsResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): KeyRotationsResponse;
    static equals(a: KeyRotationsResponse | PlainMessage<KeyRotationsResponse> | undefined, b: KeyRotationsResponse | PlainMessage<KeyRotationsResponse> | undefined): boolean;
}
