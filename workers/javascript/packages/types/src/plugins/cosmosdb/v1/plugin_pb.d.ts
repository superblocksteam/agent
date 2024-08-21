import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
import { Azure } from "../../common/v1/auth_pb";
/**
 * @generated from message plugins.cosmosdb.v1.Plugin
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
     * @generated from field: plugins.cosmosdb.v1.Plugin.CosmosDbConnection connection = 3;
     */
    connection?: Plugin_CosmosDbConnection;
    /**
     * ideally, this would be inside the connection_type but due to our auth flow we do this.
     *
     * @generated from oneof plugins.cosmosdb.v1.Plugin.cosmosdb_action
     */
    cosmosdbAction: {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.Sql sql = 5;
         */
        value: Plugin_Sql;
        case: "sql";
    } | {
        /**
         * these operations will only ever affect a single item
         *
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation point_operation = 6;
         */
        value: Plugin_PointOperation;
        case: "pointOperation";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.cosmosdb.v1.Plugin.CosmosDbConnection
 */
export declare class Plugin_CosmosDbConnection extends Message<Plugin_CosmosDbConnection> {
    /**
     * @generated from field: string host = 1;
     */
    host: string;
    /**
     * @generated from field: int32 port = 2;
     */
    port: number;
    /**
     * @generated from field: string database_id = 3;
     */
    databaseId: string;
    /**
     * @generated from field: plugins.common.v1.Azure auth = 4;
     */
    auth?: Azure;
    constructor(data?: PartialMessage<Plugin_CosmosDbConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.CosmosDbConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CosmosDbConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CosmosDbConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CosmosDbConnection;
    static equals(a: Plugin_CosmosDbConnection | PlainMessage<Plugin_CosmosDbConnection> | undefined, b: Plugin_CosmosDbConnection | PlainMessage<Plugin_CosmosDbConnection> | undefined): boolean;
}
/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata
 */
export declare class Plugin_Metadata extends Message<Plugin_Metadata> {
    /**
     * @generated from field: repeated plugins.cosmosdb.v1.Plugin.Metadata.Container containers = 1;
     */
    containers: Plugin_Metadata_Container[];
    constructor(data?: PartialMessage<Plugin_Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static equals(a: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined, b: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined): boolean;
}
/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata.Container
 */
export declare class Plugin_Metadata_Container extends Message<Plugin_Metadata_Container> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey partition_key = 2;
     */
    partitionKey?: Plugin_Metadata_Container_PartitionKey;
    constructor(data?: PartialMessage<Plugin_Metadata_Container>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata.Container";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Container;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container;
    static equals(a: Plugin_Metadata_Container | PlainMessage<Plugin_Metadata_Container> | undefined, b: Plugin_Metadata_Container | PlainMessage<Plugin_Metadata_Container> | undefined): boolean;
}
/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey
 */
export declare class Plugin_Metadata_Container_PartitionKey extends Message<Plugin_Metadata_Container_PartitionKey> {
    /**
     * @generated from field: repeated string paths = 1;
     */
    paths: string[];
    /**
     * @generated from field: string kind = 2;
     */
    kind: string;
    /**
     * @generated from field: optional int32 version = 3;
     */
    version?: number;
    constructor(data?: PartialMessage<Plugin_Metadata_Container_PartitionKey>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Container_PartitionKey;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container_PartitionKey;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container_PartitionKey;
    static equals(a: Plugin_Metadata_Container_PartitionKey | PlainMessage<Plugin_Metadata_Container_PartitionKey> | undefined, b: Plugin_Metadata_Container_PartitionKey | PlainMessage<Plugin_Metadata_Container_PartitionKey> | undefined): boolean;
}
/**
 * Action Fields
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.Sql
 */
export declare class Plugin_Sql extends Message<Plugin_Sql> {
    /**
     * @generated from oneof plugins.cosmosdb.v1.Plugin.Sql.action
     */
    action: {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.Sql.Singleton singleton = 1;
         */
        value: Plugin_Sql_Singleton;
        case: "singleton";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_Sql>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.Sql";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sql;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sql;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sql;
    static equals(a: Plugin_Sql | PlainMessage<Plugin_Sql> | undefined, b: Plugin_Sql | PlainMessage<Plugin_Sql> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L87
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.Sql.Singleton
 */
export declare class Plugin_Sql_Singleton extends Message<Plugin_Sql_Singleton> {
    /**
     * @generated from field: string container_id = 1;
     */
    containerId: string;
    /**
     * @generated from field: string query = 2;
     */
    query: string;
    /**
     * @generated from field: bool cross_partition = 3;
     */
    crossPartition: boolean;
    /**
     * @generated from field: optional string partition_key = 4;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_Sql_Singleton>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.Sql.Singleton";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sql_Singleton;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sql_Singleton;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sql_Singleton;
    static equals(a: Plugin_Sql_Singleton | PlainMessage<Plugin_Sql_Singleton> | undefined, b: Plugin_Sql_Singleton | PlainMessage<Plugin_Sql_Singleton> | undefined): boolean;
}
/**
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation
 */
export declare class Plugin_PointOperation extends Message<Plugin_PointOperation> {
    /**
     * @generated from field: string container_id = 1;
     */
    containerId: string;
    /**
     * @generated from oneof plugins.cosmosdb.v1.Plugin.PointOperation.action
     */
    action: {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation.Read read = 2;
         */
        value: Plugin_PointOperation_Read;
        case: "read";
    } | {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation.Replace replace = 3;
         */
        value: Plugin_PointOperation_Replace;
        case: "replace";
    } | {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation.Upsert upsert = 4;
         */
        value: Plugin_PointOperation_Upsert;
        case: "upsert";
    } | {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation.Delete delete = 5;
         */
        value: Plugin_PointOperation_Delete;
        case: "delete";
    } | {
        /**
         * @generated from field: plugins.cosmosdb.v1.Plugin.PointOperation.Create create = 6;
         */
        value: Plugin_PointOperation_Create;
        case: "create";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_PointOperation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation;
    static equals(a: Plugin_PointOperation | PlainMessage<Plugin_PointOperation> | undefined, b: Plugin_PointOperation | PlainMessage<Plugin_PointOperation> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L78
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Read
 */
export declare class Plugin_PointOperation_Read extends Message<Plugin_PointOperation_Read> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: optional string partition_key = 3;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_PointOperation_Read>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Read";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Read;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Read;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Read;
    static equals(a: Plugin_PointOperation_Read | PlainMessage<Plugin_PointOperation_Read> | undefined, b: Plugin_PointOperation_Read | PlainMessage<Plugin_PointOperation_Read> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L196
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Delete
 */
export declare class Plugin_PointOperation_Delete extends Message<Plugin_PointOperation_Delete> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: optional string partition_key = 3;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_PointOperation_Delete>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Delete";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Delete;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Delete;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Delete;
    static equals(a: Plugin_PointOperation_Delete | PlainMessage<Plugin_PointOperation_Delete> | undefined, b: Plugin_PointOperation_Delete | PlainMessage<Plugin_PointOperation_Delete> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L128
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Replace
 */
export declare class Plugin_PointOperation_Replace extends Message<Plugin_PointOperation_Replace> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: optional string partition_key = 3;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_PointOperation_Replace>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Replace";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Replace;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Replace;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Replace;
    static equals(a: Plugin_PointOperation_Replace | PlainMessage<Plugin_PointOperation_Replace> | undefined, b: Plugin_PointOperation_Replace | PlainMessage<Plugin_PointOperation_Replace> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L355
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Upsert
 */
export declare class Plugin_PointOperation_Upsert extends Message<Plugin_PointOperation_Upsert> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: optional string partition_key = 3;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_PointOperation_Upsert>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Upsert";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Upsert;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Upsert;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Upsert;
    static equals(a: Plugin_PointOperation_Upsert | PlainMessage<Plugin_PointOperation_Upsert> | undefined, b: Plugin_PointOperation_Upsert | PlainMessage<Plugin_PointOperation_Upsert> | undefined): boolean;
}
/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L295
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Create
 */
export declare class Plugin_PointOperation_Create extends Message<Plugin_PointOperation_Create> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: optional string partition_key = 3;
     */
    partitionKey?: string;
    constructor(data?: PartialMessage<Plugin_PointOperation_Create>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Create";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Create;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Create;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Create;
    static equals(a: Plugin_PointOperation_Create | PlainMessage<Plugin_PointOperation_Create> | undefined, b: Plugin_PointOperation_Create | PlainMessage<Plugin_PointOperation_Create> | undefined): boolean;
}
