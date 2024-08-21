import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration, SQLBulkEdit, SQLExecution, SQLOperation } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.oracledb.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: plugins.oracledb.v1.Plugin.OracleDbConnection connection = 2;
     */
    connection?: Plugin_OracleDbConnection;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 3;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    /**
     * @generated from field: plugins.common.v1.SQLExecution run_sql = 4;
     */
    runSql?: SQLExecution;
    /**
     * @generated from field: plugins.common.v1.SQLBulkEdit bulk_edit = 5;
     */
    bulkEdit?: SQLBulkEdit;
    /**
     * @generated from field: plugins.common.v1.SQLOperation operation = 6;
     */
    operation: SQLOperation;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.oracledb.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.oracledb.v1.Plugin.OracleDbConnection
 */
export declare class Plugin_OracleDbConnection extends Message<Plugin_OracleDbConnection> {
    /**
     * @generated from field: string host_url = 1;
     */
    hostUrl: string;
    /**
     * @generated from field: int32 port = 2;
     */
    port: number;
    /**
     * @generated from field: string user = 3;
     */
    user: string;
    /**
     * @generated from field: string password = 4;
     */
    password: string;
    /**
     * @generated from field: string database_service = 5;
     */
    databaseService: string;
    /**
     * @generated from field: bool use_tcps = 6;
     */
    useTcps: boolean;
    /**
     * @generated from field: string connection_type = 7;
     */
    connectionType: string;
    /**
     * @generated from field: string connection_url = 8;
     */
    connectionUrl: string;
    constructor(data?: PartialMessage<Plugin_OracleDbConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.oracledb.v1.Plugin.OracleDbConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_OracleDbConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_OracleDbConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_OracleDbConnection;
    static equals(a: Plugin_OracleDbConnection | PlainMessage<Plugin_OracleDbConnection> | undefined, b: Plugin_OracleDbConnection | PlainMessage<Plugin_OracleDbConnection> | undefined): boolean;
}
