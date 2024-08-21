import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.pinecone.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 2;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    /**
     * @generated from field: plugins.pinecone.v1.Plugin.Connection connection = 3;
     */
    connection?: Plugin_Connection;
    /**
     * @generated from oneof plugins.pinecone.v1.Plugin.action
     */
    action: {
        /**
         * @generated from field: plugins.pinecone.v1.Plugin.ListIndexes list_indexes = 4;
         */
        value: Plugin_ListIndexes;
        case: "listIndexes";
    } | {
        /**
         * @generated from field: plugins.pinecone.v1.Plugin.CreateIndex create_index = 5;
         */
        value: Plugin_CreateIndex;
        case: "createIndex";
    } | {
        /**
         * @generated from field: plugins.pinecone.v1.Plugin.UpsertVector upsert_vector = 6;
         */
        value: Plugin_UpsertVector;
        case: "upsertVector";
    } | {
        /**
         * @generated from field: plugins.pinecone.v1.Plugin.Query query = 7;
         */
        value: Plugin_Query;
        case: "query";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.pinecone.v1.Plugin.Connection
 */
export declare class Plugin_Connection extends Message<Plugin_Connection> {
    /**
     * @generated from field: string environment = 1;
     */
    environment: string;
    /**
     * @generated from field: string api_key = 2;
     */
    apiKey: string;
    constructor(data?: PartialMessage<Plugin_Connection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin.Connection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Connection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Connection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Connection;
    static equals(a: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined, b: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined): boolean;
}
/**
 * @generated from message plugins.pinecone.v1.Plugin.ListIndexes
 */
export declare class Plugin_ListIndexes extends Message<Plugin_ListIndexes> {
    constructor(data?: PartialMessage<Plugin_ListIndexes>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin.ListIndexes";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_ListIndexes;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_ListIndexes;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_ListIndexes;
    static equals(a: Plugin_ListIndexes | PlainMessage<Plugin_ListIndexes> | undefined, b: Plugin_ListIndexes | PlainMessage<Plugin_ListIndexes> | undefined): boolean;
}
/**
 * @generated from message plugins.pinecone.v1.Plugin.CreateIndex
 */
export declare class Plugin_CreateIndex extends Message<Plugin_CreateIndex> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    constructor(data?: PartialMessage<Plugin_CreateIndex>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin.CreateIndex";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CreateIndex;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CreateIndex;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CreateIndex;
    static equals(a: Plugin_CreateIndex | PlainMessage<Plugin_CreateIndex> | undefined, b: Plugin_CreateIndex | PlainMessage<Plugin_CreateIndex> | undefined): boolean;
}
/**
 * @generated from message plugins.pinecone.v1.Plugin.UpsertVector
 */
export declare class Plugin_UpsertVector extends Message<Plugin_UpsertVector> {
    /**
     * @generated from oneof plugins.pinecone.v1.Plugin.UpsertVector.data
     */
    data: {
        /**
         * @generated from field: string raw = 1;
         */
        value: string;
        case: "raw";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_UpsertVector>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin.UpsertVector";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_UpsertVector;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_UpsertVector;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_UpsertVector;
    static equals(a: Plugin_UpsertVector | PlainMessage<Plugin_UpsertVector> | undefined, b: Plugin_UpsertVector | PlainMessage<Plugin_UpsertVector> | undefined): boolean;
}
/**
 * @generated from message plugins.pinecone.v1.Plugin.Query
 */
export declare class Plugin_Query extends Message<Plugin_Query> {
    /**
     * @generated from field: string vector = 1;
     */
    vector: string;
    /**
     * @generated from field: optional string top_k = 2;
     */
    topK?: string;
    constructor(data?: PartialMessage<Plugin_Query>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.pinecone.v1.Plugin.Query";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Query;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Query;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Query;
    static equals(a: Plugin_Query | PlainMessage<Plugin_Query> | undefined, b: Plugin_Query | PlainMessage<Plugin_Query> | undefined): boolean;
}
