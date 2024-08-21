import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration, SQLBulkEdit, SQLExecution, SQLOperation } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.databricks.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: plugins.databricks.v1.Plugin.DatabricksConnection connection = 2;
     */
    connection?: Plugin_DatabricksConnection;
    /**
     * @generated from field: plugins.common.v1.SQLOperation operation = 3;
     */
    operation: SQLOperation;
    /**
     * @generated from field: plugins.common.v1.SQLExecution run_sql = 4;
     */
    runSql?: SQLExecution;
    /**
     * @generated from field: plugins.common.v1.SQLBulkEdit bulk_edit = 5;
     */
    bulkEdit?: SQLBulkEdit;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 6;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.databricks.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.databricks.v1.Plugin.DatabricksConnection
 */
export declare class Plugin_DatabricksConnection extends Message<Plugin_DatabricksConnection> {
    /**
     * @generated from field: optional string default_catalog = 1;
     */
    defaultCatalog?: string;
    /**
     * @generated from field: optional string default_schema = 2;
     */
    defaultSchema?: string;
    /**
     * @generated from field: string host_url = 3;
     */
    hostUrl: string;
    /**
     * @generated from field: string path = 4;
     */
    path: string;
    /**
     * @generated from field: int32 port = 5;
     */
    port: number;
    /**
     * @generated from field: string token = 6;
     */
    token: string;
    constructor(data?: PartialMessage<Plugin_DatabricksConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.databricks.v1.Plugin.DatabricksConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_DatabricksConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_DatabricksConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_DatabricksConnection;
    static equals(a: Plugin_DatabricksConnection | PlainMessage<Plugin_DatabricksConnection> | undefined, b: Plugin_DatabricksConnection | PlainMessage<Plugin_DatabricksConnection> | undefined): boolean;
}
