import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Value } from "@bufbuild/protobuf";
/**
 * @generated from message common.v1.Property
 */
export declare class Property extends Message<Property> {
    /**
     * @generated from field: optional string key = 1;
     */
    key?: string;
    /**
     * @generated from field: optional string value = 2;
     */
    value?: string;
    /**
     * @generated from field: optional bool editable = 3;
     */
    editable?: boolean;
    /**
     * @generated from field: optional bool internal = 4;
     */
    internal?: boolean;
    /**
     * @generated from field: optional string description = 5;
     */
    description?: string;
    /**
     * @generated from field: optional bool mandatory = 6;
     */
    mandatory?: boolean;
    /**
     * @generated from field: optional string type = 7;
     */
    type?: string;
    /**
     * @generated from field: optional string defaultValue = 8;
     */
    defaultValue?: string;
    /**
     * @generated from field: optional string minRange = 9;
     */
    minRange?: string;
    /**
     * @generated from field: optional string maxRange = 10;
     */
    maxRange?: string;
    /**
     * @generated from field: repeated string valueOptions = 11;
     */
    valueOptions: string[];
    /**
     * system properties are ones injected by the system
     *
     * @generated from field: optional bool system = 12;
     */
    system?: boolean;
    /**
     * @generated from field: optional common.v1.FileMetadata file = 13;
     */
    file?: FileMetadata;
    constructor(data?: PartialMessage<Property>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Property";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Property;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Property;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Property;
    static equals(a: Property | PlainMessage<Property> | undefined, b: Property | PlainMessage<Property> | undefined): boolean;
}
/**
 * @generated from message common.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message common.v1.HttpParameters
 */
export declare class HttpParameters extends Message<HttpParameters> {
    /**
     * NOTE(frank): I originally was using `google.protobuf.Value`.bool
     * However, we actually take these in as a string. If it's json,
     * it will be passed in as an escaped value. I don't think this is
     * the right way to do this as for API inputs, we take those in as
     * real encoded JSON.
     *
     * @generated from field: map<string, google.protobuf.Value> query = 1;
     */
    query: {
        [key: string]: Value;
    };
    /**
     * @generated from field: map<string, google.protobuf.Value> body = 2;
     */
    body: {
        [key: string]: Value;
    };
    constructor(data?: PartialMessage<HttpParameters>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.HttpParameters";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HttpParameters;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HttpParameters;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HttpParameters;
    static equals(a: HttpParameters | PlainMessage<HttpParameters> | undefined, b: HttpParameters | PlainMessage<HttpParameters> | undefined): boolean;
}
/**
 * @generated from message common.v1.FileMetadata
 */
export declare class FileMetadata extends Message<FileMetadata> {
    /**
     * @generated from field: string filename = 1;
     */
    filename: string;
    constructor(data?: PartialMessage<FileMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.FileMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FileMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FileMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FileMetadata;
    static equals(a: FileMetadata | PlainMessage<FileMetadata> | undefined, b: FileMetadata | PlainMessage<FileMetadata> | undefined): boolean;
}
