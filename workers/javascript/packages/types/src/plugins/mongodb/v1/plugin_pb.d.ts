import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.mongodb.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.mongodb.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.mongodb.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string resource = 1;
     */
    resource: string;
    /**
     * @generated from field: string action = 2;
     */
    action: string;
    /**
     * @generated from field: string pipeline = 3;
     */
    pipeline: string;
    /**
     * @generated from field: string projection = 4;
     */
    projection: string;
    /**
     * @generated from field: string query = 5;
     */
    query: string;
    /**
     * @generated from field: string field = 6;
     */
    field: string;
    /**
     * @generated from field: string sortby = 7;
     */
    sortby: string;
    /**
     * Super confusing, but these could be bindings or string ints
     * If they were not potential bindings, we should let them be int32s instead
     *
     * @generated from field: string limit = 8;
     */
    limit: string;
    /**
     * @generated from field: string skip = 9;
     */
    skip: string;
    /**
     * @generated from field: string document = 10;
     */
    document: string;
    /**
     * @generated from field: string replacement = 11;
     */
    replacement: string;
    /**
     * @generated from field: string filter = 12;
     */
    filter: string;
    /**
     * @generated from field: string options = 13;
     */
    options: string;
    /**
     * @generated from field: string update = 14;
     */
    update: string;
    /**
     * @generated from field: string distinctKey = 15;
     */
    distinctKey: string;
    /**
     * @generated from field: plugins.mongodb.v1.SuperblocksMetadata superblocksMetadata = 16;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.mongodb.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
