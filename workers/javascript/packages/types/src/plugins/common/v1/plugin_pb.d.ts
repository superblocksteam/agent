import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from enum plugins.common.v1.SSHAuthMethod
 */
export declare enum SSHAuthMethod {
    /**
     * @generated from enum value: SSH_AUTH_METHOD_UNSPECIFIED = 0;
     */
    SSH_AUTH_METHOD_UNSPECIFIED = 0,
    /**
     * @generated from enum value: SSH_AUTH_METHOD_PASSWORD = 1;
     */
    SSH_AUTH_METHOD_PASSWORD = 1,
    /**
     * @generated from enum value: SSH_AUTH_METHOD_PUB_KEY_RSA = 2;
     */
    SSH_AUTH_METHOD_PUB_KEY_RSA = 2,
    /**
     * @generated from enum value: SSH_AUTH_METHOD_PUB_KEY_ED25519 = 3;
     */
    SSH_AUTH_METHOD_PUB_KEY_ED25519 = 3,
    /**
     * @generated from enum value: SSH_AUTH_METHOD_USER_PRIVATE_KEY = 4;
     */
    SSH_AUTH_METHOD_USER_PRIVATE_KEY = 4
}
/**
 * @generated from enum plugins.common.v1.SQLMappingMode
 */
export declare enum SQLMappingMode {
    /**
     * @generated from enum value: SQL_MAPPING_MODE_UNSPECIFIED = 0;
     */
    SQL_MAPPING_MODE_UNSPECIFIED = 0,
    /**
     * @generated from enum value: SQL_MAPPING_MODE_AUTO = 1;
     */
    SQL_MAPPING_MODE_AUTO = 1,
    /**
     * @generated from enum value: SQL_MAPPING_MODE_MANUAL = 2;
     */
    SQL_MAPPING_MODE_MANUAL = 2
}
/**
 * @generated from enum plugins.common.v1.SQLMatchingMode
 */
export declare enum SQLMatchingMode {
    /**
     * @generated from enum value: SQL_MATCHING_MODE_UNSPECIFIED = 0;
     */
    SQL_MATCHING_MODE_UNSPECIFIED = 0,
    /**
     * @generated from enum value: SQL_MATCHING_MODE_AUTO = 1;
     */
    SQL_MATCHING_MODE_AUTO = 1,
    /**
     * @generated from enum value: SQL_MATCHING_MODE_ADVANCED = 2;
     */
    SQL_MATCHING_MODE_ADVANCED = 2
}
/**
 * @generated from enum plugins.common.v1.SQLOperation
 */
export declare enum SQLOperation {
    /**
     * @generated from enum value: SQL_OPERATION_UNSPECIFIED = 0;
     */
    SQL_OPERATION_UNSPECIFIED = 0,
    /**
     * @generated from enum value: SQL_OPERATION_RUN_SQL = 1;
     */
    SQL_OPERATION_RUN_SQL = 1,
    /**
     * @generated from enum value: SQL_OPERATION_UPDATE_ROWS = 2;
     */
    SQL_OPERATION_UPDATE_ROWS = 2
}
/**
 * @generated from message plugins.common.v1.DynamicWorkflowConfiguration
 */
export declare class DynamicWorkflowConfiguration extends Message<DynamicWorkflowConfiguration> {
    /**
     * @generated from field: optional bool enabled = 1;
     */
    enabled?: boolean;
    /**
     * @generated from field: optional string workflow_id = 2;
     */
    workflowId?: string;
    constructor(data?: PartialMessage<DynamicWorkflowConfiguration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.DynamicWorkflowConfiguration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DynamicWorkflowConfiguration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DynamicWorkflowConfiguration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DynamicWorkflowConfiguration;
    static equals(a: DynamicWorkflowConfiguration | PlainMessage<DynamicWorkflowConfiguration> | undefined, b: DynamicWorkflowConfiguration | PlainMessage<DynamicWorkflowConfiguration> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AWSConfig
 */
export declare class AWSConfig extends Message<AWSConfig> {
    /**
     * @generated from field: optional string region = 1;
     */
    region?: string;
    /**
     * @generated from field: optional plugins.common.v1.AWSConfig.Auth auth = 2;
     */
    auth?: AWSConfig_Auth;
    constructor(data?: PartialMessage<AWSConfig>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AWSConfig";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AWSConfig;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AWSConfig;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AWSConfig;
    static equals(a: AWSConfig | PlainMessage<AWSConfig> | undefined, b: AWSConfig | PlainMessage<AWSConfig> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AWSConfig.Auth
 */
export declare class AWSConfig_Auth extends Message<AWSConfig_Auth> {
    /**
     * @generated from field: optional string access_key_id = 1;
     */
    accessKeyId?: string;
    /**
     * @generated from field: optional string secret_key = 2;
     */
    secretKey?: string;
    /**
     * @generated from field: optional string iam_role_arn = 3;
     */
    iamRoleArn?: string;
    constructor(data?: PartialMessage<AWSConfig_Auth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AWSConfig.Auth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AWSConfig_Auth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AWSConfig_Auth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AWSConfig_Auth;
    static equals(a: AWSConfig_Auth | PlainMessage<AWSConfig_Auth> | undefined, b: AWSConfig_Auth | PlainMessage<AWSConfig_Auth> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.SQLExecution
 */
export declare class SQLExecution extends Message<SQLExecution> {
    /**
     * @generated from field: string sql_body = 1;
     */
    sqlBody: string;
    /**
     * @generated from field: bool use_parameterized = 2;
     */
    useParameterized: boolean;
    constructor(data?: PartialMessage<SQLExecution>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLExecution";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLExecution;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLExecution;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLExecution;
    static equals(a: SQLExecution | PlainMessage<SQLExecution> | undefined, b: SQLExecution | PlainMessage<SQLExecution> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.SQLMappedColumns
 */
export declare class SQLMappedColumns extends Message<SQLMappedColumns> {
    /**
     * @generated from field: string json = 1;
     */
    json: string;
    /**
     * @generated from field: string sql = 2;
     */
    sql: string;
    constructor(data?: PartialMessage<SQLMappedColumns>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLMappedColumns";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLMappedColumns;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLMappedColumns;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLMappedColumns;
    static equals(a: SQLMappedColumns | PlainMessage<SQLMappedColumns> | undefined, b: SQLMappedColumns | PlainMessage<SQLMappedColumns> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.SSHConfiguration
 */
export declare class SSHConfiguration extends Message<SSHConfiguration> {
    /**
     * @generated from field: optional plugins.common.v1.SSHAuthMethod authentication_method = 1;
     */
    authenticationMethod?: SSHAuthMethod;
    /**
     * @generated from field: optional bool enabled = 2;
     */
    enabled?: boolean;
    /**
     * @generated from field: optional string host = 3;
     */
    host?: string;
    /**
     * @generated from field: optional string passphrase = 4;
     */
    passphrase?: string;
    /**
     * @generated from field: optional string password = 5;
     */
    password?: string;
    /**
     * @generated from field: optional int32 port = 6;
     */
    port?: number;
    /**
     * @generated from field: optional string private_key = 7;
     */
    privateKey?: string;
    /**
     * @generated from field: optional string public_key = 8;
     */
    publicKey?: string;
    /**
     * @generated from field: optional string username = 9;
     */
    username?: string;
    constructor(data?: PartialMessage<SSHConfiguration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SSHConfiguration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SSHConfiguration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SSHConfiguration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SSHConfiguration;
    static equals(a: SSHConfiguration | PlainMessage<SSHConfiguration> | undefined, b: SSHConfiguration | PlainMessage<SSHConfiguration> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.SQLBulkEdit
 */
export declare class SQLBulkEdit extends Message<SQLBulkEdit> {
    /**
     * @generated from field: optional plugins.common.v1.SQLMatchingMode matching_mode = 1;
     */
    matchingMode?: SQLMatchingMode;
    /**
     * @generated from field: optional string schema = 2;
     */
    schema?: string;
    /**
     * @generated from field: optional string table = 3;
     */
    table?: string;
    /**
     * @generated from field: optional string updated_rows = 4;
     */
    updatedRows?: string;
    /**
     * @generated from field: optional string old_rows = 5;
     */
    oldRows?: string;
    /**
     * @generated from field: repeated string filter_by = 6;
     */
    filterBy: string[];
    /**
     * @generated from field: optional plugins.common.v1.SQLMappingMode mapping_mode = 7;
     */
    mappingMode?: SQLMappingMode;
    /**
     * @generated from field: repeated plugins.common.v1.SQLMappedColumns mapped_columns = 8;
     */
    mappedColumns: SQLMappedColumns[];
    /**
     * @generated from field: optional string inserted_rows = 9;
     */
    insertedRows?: string;
    /**
     * @generated from field: optional string deleted_rows = 10;
     */
    deletedRows?: string;
    constructor(data?: PartialMessage<SQLBulkEdit>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLBulkEdit";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLBulkEdit;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLBulkEdit;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLBulkEdit;
    static equals(a: SQLBulkEdit | PlainMessage<SQLBulkEdit> | undefined, b: SQLBulkEdit | PlainMessage<SQLBulkEdit> | undefined): boolean;
}
