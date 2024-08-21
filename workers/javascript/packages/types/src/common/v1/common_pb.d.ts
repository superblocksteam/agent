import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp } from "@bufbuild/protobuf";
/**
 * @generated from enum common.v1.UserType
 */
export declare enum UserType {
    /**
     * @generated from enum value: USER_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: USER_TYPE_SUPERBLOCKS = 1;
     */
    SUPERBLOCKS = 1,
    /**
     * @generated from enum value: USER_TYPE_EXTERNAL = 2;
     */
    EXTERNAL = 2
}
/**
 * @generated from message common.v1.Timestamps
 */
export declare class Timestamps extends Message<Timestamps> {
    /**
     * @generated from field: google.protobuf.Timestamp created = 1;
     */
    created?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp updated = 2;
     */
    updated?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp deactivated = 3;
     */
    deactivated?: Timestamp;
    constructor(data?: PartialMessage<Timestamps>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Timestamps";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Timestamps;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Timestamps;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Timestamps;
    static equals(a: Timestamps | PlainMessage<Timestamps> | undefined, b: Timestamps | PlainMessage<Timestamps> | undefined): boolean;
}
/**
 * @generated from message common.v1.Metadata
 */
export declare class Metadata extends Message<Metadata> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: optional string description = 2;
     */
    description?: string;
    /**
     * @generated from field: string name = 3;
     */
    name: string;
    /**
     * @generated from field: string organization = 4;
     */
    organization: string;
    /**
     * @generated from field: optional string folder = 5;
     */
    folder?: string;
    /**
     * @generated from field: common.v1.Timestamps timestamps = 6;
     */
    timestamps?: Timestamps;
    /**
     * @generated from field: optional string version = 7;
     */
    version?: string;
    /**
     * @generated from field: map<string, string> tags = 8;
     */
    tags: {
        [key: string]: string;
    };
    /**
     * @generated from field: optional string type = 9;
     */
    type?: string;
    constructor(data?: PartialMessage<Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata;
    static equals(a: Metadata | PlainMessage<Metadata> | undefined, b: Metadata | PlainMessage<Metadata> | undefined): boolean;
}
/**
 * @generated from message common.v1.Profile
 */
export declare class Profile extends Message<Profile> {
    /**
     * @generated from field: optional string id = 1;
     */
    id?: string;
    /**
     * @generated from field: optional string name = 2;
     */
    name?: string;
    /**
     *
     * DEPRECATED
     *
     * @generated from field: optional string environment = 3;
     */
    environment?: string;
    constructor(data?: PartialMessage<Profile>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Profile";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Profile;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Profile;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Profile;
    static equals(a: Profile | PlainMessage<Profile> | undefined, b: Profile | PlainMessage<Profile> | undefined): boolean;
}
