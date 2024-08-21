import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { AWSConfig, DynamicWorkflowConfiguration, SQLExecution } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.athena.v1.Connection
 */
export declare class Connection extends Message<Connection> {
    /**
     * @generated from field: optional string workgroup_name = 1;
     */
    workgroupName?: string;
    /**
     * @generated from field: bool override_s3_output_location = 2;
     */
    overrideS3OutputLocation: boolean;
    /**
     * @generated from field: optional string s3_output_location = 3;
     */
    s3OutputLocation?: string;
    /**
     * @generated from field: optional plugins.athena.v1.Connection.DateFolderType s3_output_location_suffix = 4;
     */
    s3OutputLocationSuffix?: Connection_DateFolderType;
    /**
     * @generated from field: string database_name = 5;
     */
    databaseName: string;
    /**
     * @generated from field: plugins.common.v1.AWSConfig aws_config = 6;
     */
    awsConfig?: AWSConfig;
    constructor(data?: PartialMessage<Connection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.athena.v1.Connection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Connection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Connection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Connection;
    static equals(a: Connection | PlainMessage<Connection> | undefined, b: Connection | PlainMessage<Connection> | undefined): boolean;
}
/**
 * @generated from enum plugins.athena.v1.Connection.DateFolderType
 */
export declare enum Connection_DateFolderType {
    /**
     * @generated from enum value: DATE_FOLDER_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: DATE_FOLDER_TYPE_YYYY = 1;
     */
    YYYY = 1,
    /**
     * @generated from enum value: DATE_FOLDER_TYPE_YYYYMM = 2;
     */
    YYYYMM = 2,
    /**
     * @generated from enum value: DATE_FOLDER_TYPE_YYYYMMDD = 3;
     */
    YYYYMMDD = 3
}
/**
 * @generated from message plugins.athena.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: plugins.athena.v1.Connection connection = 2;
     */
    connection?: Connection;
    /**
     * @generated from field: plugins.common.v1.SQLExecution run_sql = 3;
     */
    runSql?: SQLExecution;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 4;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.athena.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
