import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.gcs.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gcs.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.gcs.v1.Property
 */
export declare class Property extends Message<Property> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 value = 2;
     */
    value: number;
    /**
     * @generated from field: bool editable = 3;
     */
    editable: boolean;
    /**
     * @generated from field: bool internal = 4;
     */
    internal: boolean;
    /**
     * @generated from field: string description = 5;
     */
    description: string;
    /**
     * @generated from field: bool mandatory = 6;
     */
    mandatory: boolean;
    /**
     * @generated from field: string type = 7;
     */
    type: string;
    /**
     * @generated from field: string defaultValue = 8;
     */
    defaultValue: string;
    /**
     * @generated from field: string minRange = 9;
     */
    minRange: string;
    /**
     * @generated from field: string maxRange = 10;
     */
    maxRange: string;
    /**
     * @generated from field: repeated string valueOptions = 11;
     */
    valueOptions: string[];
    constructor(data?: PartialMessage<Property>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gcs.v1.Property";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Property;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Property;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Property;
    static equals(a: Property | PlainMessage<Property> | undefined, b: Property | PlainMessage<Property> | undefined): boolean;
}
/**
 * @generated from message plugins.gcs.v1.Custom
 */
export declare class Custom extends Message<Custom> {
    /**
     * @generated from field: plugins.gcs.v1.Property presignedExpiration = 1;
     */
    presignedExpiration?: Property;
    constructor(data?: PartialMessage<Custom>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gcs.v1.Custom";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Custom;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Custom;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Custom;
    static equals(a: Custom | PlainMessage<Custom> | undefined, b: Custom | PlainMessage<Custom> | undefined): boolean;
}
/**
 * @generated from message plugins.gcs.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string resource = 1;
     */
    resource: string;
    /**
     * @generated from field: string resourceType = 2;
     */
    resourceType: string;
    /**
     * @generated from field: string action = 3;
     */
    action: string;
    /**
     * @generated from field: string path = 4;
     */
    path: string;
    /**
     * @generated from field: string prefix = 5;
     */
    prefix: string;
    /**
     * @generated from field: string body = 6;
     */
    body: string;
    /**
     * @generated from field: string fileObjects = 7;
     */
    fileObjects: string;
    /**
     * @generated from field: string responseType = 8;
     */
    responseType: string;
    /**
     * @generated from field: plugins.gcs.v1.Custom custom = 9;
     */
    custom?: Custom;
    /**
     * @generated from field: plugins.gcs.v1.SuperblocksMetadata superblocksMetadata = 10;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gcs.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
