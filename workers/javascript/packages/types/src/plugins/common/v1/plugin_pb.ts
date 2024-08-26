// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file plugins/common/v1/plugin.proto (package plugins.common.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from enum plugins.common.v1.SSHAuthMethod
 */
export enum SSHAuthMethod {
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
  SSH_AUTH_METHOD_USER_PRIVATE_KEY = 4,
}
// Retrieve enum metadata with: proto3.getEnumType(SSHAuthMethod)
proto3.util.setEnumType(SSHAuthMethod, "plugins.common.v1.SSHAuthMethod", [
  { no: 0, name: "SSH_AUTH_METHOD_UNSPECIFIED" },
  { no: 1, name: "SSH_AUTH_METHOD_PASSWORD" },
  { no: 2, name: "SSH_AUTH_METHOD_PUB_KEY_RSA" },
  { no: 3, name: "SSH_AUTH_METHOD_PUB_KEY_ED25519" },
  { no: 4, name: "SSH_AUTH_METHOD_USER_PRIVATE_KEY" },
]);

/**
 * @generated from enum plugins.common.v1.SQLMappingMode
 */
export enum SQLMappingMode {
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
  SQL_MAPPING_MODE_MANUAL = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(SQLMappingMode)
proto3.util.setEnumType(SQLMappingMode, "plugins.common.v1.SQLMappingMode", [
  { no: 0, name: "SQL_MAPPING_MODE_UNSPECIFIED" },
  { no: 1, name: "SQL_MAPPING_MODE_AUTO" },
  { no: 2, name: "SQL_MAPPING_MODE_MANUAL" },
]);

/**
 * @generated from enum plugins.common.v1.SQLMatchingMode
 */
export enum SQLMatchingMode {
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
  SQL_MATCHING_MODE_ADVANCED = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(SQLMatchingMode)
proto3.util.setEnumType(SQLMatchingMode, "plugins.common.v1.SQLMatchingMode", [
  { no: 0, name: "SQL_MATCHING_MODE_UNSPECIFIED" },
  { no: 1, name: "SQL_MATCHING_MODE_AUTO" },
  { no: 2, name: "SQL_MATCHING_MODE_ADVANCED" },
]);

/**
 * @generated from enum plugins.common.v1.SQLOperation
 */
export enum SQLOperation {
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
  SQL_OPERATION_UPDATE_ROWS = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(SQLOperation)
proto3.util.setEnumType(SQLOperation, "plugins.common.v1.SQLOperation", [
  { no: 0, name: "SQL_OPERATION_UNSPECIFIED" },
  { no: 1, name: "SQL_OPERATION_RUN_SQL" },
  { no: 2, name: "SQL_OPERATION_UPDATE_ROWS" },
]);

/**
 * @generated from message plugins.common.v1.DynamicWorkflowConfiguration
 */
export class DynamicWorkflowConfiguration extends Message<DynamicWorkflowConfiguration> {
  /**
   * @generated from field: optional bool enabled = 1;
   */
  enabled?: boolean;

  /**
   * @generated from field: optional string workflow_id = 2;
   */
  workflowId?: string;

  constructor(data?: PartialMessage<DynamicWorkflowConfiguration>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.DynamicWorkflowConfiguration";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "enabled", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    { no: 2, name: "workflow_id", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DynamicWorkflowConfiguration {
    return new DynamicWorkflowConfiguration().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DynamicWorkflowConfiguration {
    return new DynamicWorkflowConfiguration().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DynamicWorkflowConfiguration {
    return new DynamicWorkflowConfiguration().fromJsonString(jsonString, options);
  }

  static equals(a: DynamicWorkflowConfiguration | PlainMessage<DynamicWorkflowConfiguration> | undefined, b: DynamicWorkflowConfiguration | PlainMessage<DynamicWorkflowConfiguration> | undefined): boolean {
    return proto3.util.equals(DynamicWorkflowConfiguration, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.AWSConfig
 */
export class AWSConfig extends Message<AWSConfig> {
  /**
   * @generated from field: optional string region = 1;
   */
  region?: string;

  /**
   * @generated from field: optional plugins.common.v1.AWSConfig.Auth auth = 2;
   */
  auth?: AWSConfig_Auth;

  constructor(data?: PartialMessage<AWSConfig>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.AWSConfig";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "region", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 2, name: "auth", kind: "message", T: AWSConfig_Auth, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AWSConfig {
    return new AWSConfig().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AWSConfig {
    return new AWSConfig().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AWSConfig {
    return new AWSConfig().fromJsonString(jsonString, options);
  }

  static equals(a: AWSConfig | PlainMessage<AWSConfig> | undefined, b: AWSConfig | PlainMessage<AWSConfig> | undefined): boolean {
    return proto3.util.equals(AWSConfig, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.AWSConfig.Auth
 */
export class AWSConfig_Auth extends Message<AWSConfig_Auth> {
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

  constructor(data?: PartialMessage<AWSConfig_Auth>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.AWSConfig.Auth";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "access_key_id", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 2, name: "secret_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 3, name: "iam_role_arn", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AWSConfig_Auth {
    return new AWSConfig_Auth().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AWSConfig_Auth {
    return new AWSConfig_Auth().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AWSConfig_Auth {
    return new AWSConfig_Auth().fromJsonString(jsonString, options);
  }

  static equals(a: AWSConfig_Auth | PlainMessage<AWSConfig_Auth> | undefined, b: AWSConfig_Auth | PlainMessage<AWSConfig_Auth> | undefined): boolean {
    return proto3.util.equals(AWSConfig_Auth, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.SQLExecution
 */
export class SQLExecution extends Message<SQLExecution> {
  /**
   * @generated from field: string sql_body = 1;
   */
  sqlBody = "";

  /**
   * @generated from field: bool use_parameterized = 2;
   */
  useParameterized = false;

  constructor(data?: PartialMessage<SQLExecution>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.SQLExecution";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "sql_body", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "use_parameterized", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLExecution {
    return new SQLExecution().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLExecution {
    return new SQLExecution().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLExecution {
    return new SQLExecution().fromJsonString(jsonString, options);
  }

  static equals(a: SQLExecution | PlainMessage<SQLExecution> | undefined, b: SQLExecution | PlainMessage<SQLExecution> | undefined): boolean {
    return proto3.util.equals(SQLExecution, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.SQLMappedColumns
 */
export class SQLMappedColumns extends Message<SQLMappedColumns> {
  /**
   * @generated from field: string json = 1;
   */
  json = "";

  /**
   * @generated from field: string sql = 2;
   */
  sql = "";

  constructor(data?: PartialMessage<SQLMappedColumns>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.SQLMappedColumns";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "json", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "sql", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLMappedColumns {
    return new SQLMappedColumns().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLMappedColumns {
    return new SQLMappedColumns().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLMappedColumns {
    return new SQLMappedColumns().fromJsonString(jsonString, options);
  }

  static equals(a: SQLMappedColumns | PlainMessage<SQLMappedColumns> | undefined, b: SQLMappedColumns | PlainMessage<SQLMappedColumns> | undefined): boolean {
    return proto3.util.equals(SQLMappedColumns, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.SSHConfiguration
 */
export class SSHConfiguration extends Message<SSHConfiguration> {
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

  constructor(data?: PartialMessage<SSHConfiguration>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.SSHConfiguration";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "authentication_method", kind: "enum", T: proto3.getEnumType(SSHAuthMethod), opt: true },
    { no: 2, name: "enabled", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    { no: 3, name: "host", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 4, name: "passphrase", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 5, name: "password", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 6, name: "port", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
    { no: 7, name: "private_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 8, name: "public_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 9, name: "username", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SSHConfiguration {
    return new SSHConfiguration().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SSHConfiguration {
    return new SSHConfiguration().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SSHConfiguration {
    return new SSHConfiguration().fromJsonString(jsonString, options);
  }

  static equals(a: SSHConfiguration | PlainMessage<SSHConfiguration> | undefined, b: SSHConfiguration | PlainMessage<SSHConfiguration> | undefined): boolean {
    return proto3.util.equals(SSHConfiguration, a, b);
  }
}

/**
 * @generated from message plugins.common.v1.SQLBulkEdit
 */
export class SQLBulkEdit extends Message<SQLBulkEdit> {
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
  filterBy: string[] = [];

  /**
   * @generated from field: optional plugins.common.v1.SQLMappingMode mapping_mode = 7;
   */
  mappingMode?: SQLMappingMode;

  /**
   * @generated from field: repeated plugins.common.v1.SQLMappedColumns mapped_columns = 8;
   */
  mappedColumns: SQLMappedColumns[] = [];

  /**
   * @generated from field: optional string inserted_rows = 9;
   */
  insertedRows?: string;

  /**
   * @generated from field: optional string deleted_rows = 10;
   */
  deletedRows?: string;

  constructor(data?: PartialMessage<SQLBulkEdit>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.common.v1.SQLBulkEdit";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "matching_mode", kind: "enum", T: proto3.getEnumType(SQLMatchingMode), opt: true },
    { no: 2, name: "schema", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 3, name: "table", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 4, name: "updated_rows", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 5, name: "old_rows", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 6, name: "filter_by", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 7, name: "mapping_mode", kind: "enum", T: proto3.getEnumType(SQLMappingMode), opt: true },
    { no: 8, name: "mapped_columns", kind: "message", T: SQLMappedColumns, repeated: true },
    { no: 9, name: "inserted_rows", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 10, name: "deleted_rows", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLBulkEdit {
    return new SQLBulkEdit().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLBulkEdit {
    return new SQLBulkEdit().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLBulkEdit {
    return new SQLBulkEdit().fromJsonString(jsonString, options);
  }

  static equals(a: SQLBulkEdit | PlainMessage<SQLBulkEdit> | undefined, b: SQLBulkEdit | PlainMessage<SQLBulkEdit> | undefined): boolean {
    return proto3.util.equals(SQLBulkEdit, a, b);
  }
}
