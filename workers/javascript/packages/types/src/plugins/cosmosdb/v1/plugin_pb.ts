// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file plugins/cosmosdb/v1/plugin.proto (package plugins.cosmosdb.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
import { Azure } from "../../common/v1/auth_pb";

/**
 * @generated from message plugins.cosmosdb.v1.Plugin
 */
export class Plugin extends Message<Plugin> {
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
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Plugin>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 2, name: "dynamic_workflow_configuration", kind: "message", T: DynamicWorkflowConfiguration, opt: true },
    { no: 3, name: "connection", kind: "message", T: Plugin_CosmosDbConnection },
    { no: 5, name: "sql", kind: "message", T: Plugin_Sql, oneof: "cosmosdb_action" },
    { no: 6, name: "point_operation", kind: "message", T: Plugin_PointOperation, oneof: "cosmosdb_action" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin {
    return new Plugin().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin {
    return new Plugin().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin {
    return new Plugin().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean {
    return proto3.util.equals(Plugin, a, b);
  }
}

/**
 * @generated from message plugins.cosmosdb.v1.Plugin.CosmosDbConnection
 */
export class Plugin_CosmosDbConnection extends Message<Plugin_CosmosDbConnection> {
  /**
   * @generated from field: string host = 1;
   */
  host = "";

  /**
   * @generated from field: int32 port = 2;
   */
  port = 0;

  /**
   * @generated from field: string database_id = 3;
   */
  databaseId = "";

  /**
   * @generated from field: plugins.common.v1.Azure auth = 4;
   */
  auth?: Azure;

  constructor(data?: PartialMessage<Plugin_CosmosDbConnection>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.CosmosDbConnection";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "host", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "port", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 3, name: "database_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "auth", kind: "message", T: Azure },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CosmosDbConnection {
    return new Plugin_CosmosDbConnection().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CosmosDbConnection {
    return new Plugin_CosmosDbConnection().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CosmosDbConnection {
    return new Plugin_CosmosDbConnection().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_CosmosDbConnection | PlainMessage<Plugin_CosmosDbConnection> | undefined, b: Plugin_CosmosDbConnection | PlainMessage<Plugin_CosmosDbConnection> | undefined): boolean {
    return proto3.util.equals(Plugin_CosmosDbConnection, a, b);
  }
}

/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata
 */
export class Plugin_Metadata extends Message<Plugin_Metadata> {
  /**
   * @generated from field: repeated plugins.cosmosdb.v1.Plugin.Metadata.Container containers = 1;
   */
  containers: Plugin_Metadata_Container[] = [];

  constructor(data?: PartialMessage<Plugin_Metadata>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "containers", kind: "message", T: Plugin_Metadata_Container, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata {
    return new Plugin_Metadata().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata {
    return new Plugin_Metadata().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata {
    return new Plugin_Metadata().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined, b: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined): boolean {
    return proto3.util.equals(Plugin_Metadata, a, b);
  }
}

/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata.Container
 */
export class Plugin_Metadata_Container extends Message<Plugin_Metadata_Container> {
  /**
   * @generated from field: string id = 1;
   */
  id = "";

  /**
   * @generated from field: plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey partition_key = 2;
   */
  partitionKey?: Plugin_Metadata_Container_PartitionKey;

  constructor(data?: PartialMessage<Plugin_Metadata_Container>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata.Container";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "partition_key", kind: "message", T: Plugin_Metadata_Container_PartitionKey },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Container {
    return new Plugin_Metadata_Container().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container {
    return new Plugin_Metadata_Container().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container {
    return new Plugin_Metadata_Container().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Metadata_Container | PlainMessage<Plugin_Metadata_Container> | undefined, b: Plugin_Metadata_Container | PlainMessage<Plugin_Metadata_Container> | undefined): boolean {
    return proto3.util.equals(Plugin_Metadata_Container, a, b);
  }
}

/**
 * @generated from message plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey
 */
export class Plugin_Metadata_Container_PartitionKey extends Message<Plugin_Metadata_Container_PartitionKey> {
  /**
   * @generated from field: repeated string paths = 1;
   */
  paths: string[] = [];

  /**
   * @generated from field: string kind = 2;
   */
  kind = "";

  /**
   * @generated from field: optional int32 version = 3;
   */
  version?: number;

  constructor(data?: PartialMessage<Plugin_Metadata_Container_PartitionKey>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.Metadata.Container.PartitionKey";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "paths", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 2, name: "kind", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "version", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Container_PartitionKey {
    return new Plugin_Metadata_Container_PartitionKey().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container_PartitionKey {
    return new Plugin_Metadata_Container_PartitionKey().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Container_PartitionKey {
    return new Plugin_Metadata_Container_PartitionKey().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Metadata_Container_PartitionKey | PlainMessage<Plugin_Metadata_Container_PartitionKey> | undefined, b: Plugin_Metadata_Container_PartitionKey | PlainMessage<Plugin_Metadata_Container_PartitionKey> | undefined): boolean {
    return proto3.util.equals(Plugin_Metadata_Container_PartitionKey, a, b);
  }
}

/**
 * Action Fields
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.Sql
 */
export class Plugin_Sql extends Message<Plugin_Sql> {
  /**
   * @generated from oneof plugins.cosmosdb.v1.Plugin.Sql.action
   */
  action: {
    /**
     * @generated from field: plugins.cosmosdb.v1.Plugin.Sql.Singleton singleton = 1;
     */
    value: Plugin_Sql_Singleton;
    case: "singleton";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Plugin_Sql>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.Sql";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "singleton", kind: "message", T: Plugin_Sql_Singleton, oneof: "action" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sql {
    return new Plugin_Sql().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sql {
    return new Plugin_Sql().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sql {
    return new Plugin_Sql().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Sql | PlainMessage<Plugin_Sql> | undefined, b: Plugin_Sql | PlainMessage<Plugin_Sql> | undefined): boolean {
    return proto3.util.equals(Plugin_Sql, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L87
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.Sql.Singleton
 */
export class Plugin_Sql_Singleton extends Message<Plugin_Sql_Singleton> {
  /**
   * @generated from field: string container_id = 1;
   */
  containerId = "";

  /**
   * @generated from field: string query = 2;
   */
  query = "";

  /**
   * @generated from field: bool cross_partition = 3;
   */
  crossPartition = false;

  /**
   * @generated from field: optional string partition_key = 4;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_Sql_Singleton>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.Sql.Singleton";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "container_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "query", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "cross_partition", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 4, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sql_Singleton {
    return new Plugin_Sql_Singleton().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sql_Singleton {
    return new Plugin_Sql_Singleton().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sql_Singleton {
    return new Plugin_Sql_Singleton().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Sql_Singleton | PlainMessage<Plugin_Sql_Singleton> | undefined, b: Plugin_Sql_Singleton | PlainMessage<Plugin_Sql_Singleton> | undefined): boolean {
    return proto3.util.equals(Plugin_Sql_Singleton, a, b);
  }
}

/**
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation
 */
export class Plugin_PointOperation extends Message<Plugin_PointOperation> {
  /**
   * @generated from field: string container_id = 1;
   */
  containerId = "";

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
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Plugin_PointOperation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "container_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "read", kind: "message", T: Plugin_PointOperation_Read, oneof: "action" },
    { no: 3, name: "replace", kind: "message", T: Plugin_PointOperation_Replace, oneof: "action" },
    { no: 4, name: "upsert", kind: "message", T: Plugin_PointOperation_Upsert, oneof: "action" },
    { no: 5, name: "delete", kind: "message", T: Plugin_PointOperation_Delete, oneof: "action" },
    { no: 6, name: "create", kind: "message", T: Plugin_PointOperation_Create, oneof: "action" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation {
    return new Plugin_PointOperation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation {
    return new Plugin_PointOperation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation {
    return new Plugin_PointOperation().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation | PlainMessage<Plugin_PointOperation> | undefined, b: Plugin_PointOperation | PlainMessage<Plugin_PointOperation> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L78
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Read
 */
export class Plugin_PointOperation_Read extends Message<Plugin_PointOperation_Read> {
  /**
   * @generated from field: string id = 1;
   */
  id = "";

  /**
   * @generated from field: optional string partition_key = 3;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_PointOperation_Read>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Read";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Read {
    return new Plugin_PointOperation_Read().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Read {
    return new Plugin_PointOperation_Read().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Read {
    return new Plugin_PointOperation_Read().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation_Read | PlainMessage<Plugin_PointOperation_Read> | undefined, b: Plugin_PointOperation_Read | PlainMessage<Plugin_PointOperation_Read> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation_Read, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L196
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Delete
 */
export class Plugin_PointOperation_Delete extends Message<Plugin_PointOperation_Delete> {
  /**
   * @generated from field: string id = 1;
   */
  id = "";

  /**
   * @generated from field: optional string partition_key = 3;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_PointOperation_Delete>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Delete";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Delete {
    return new Plugin_PointOperation_Delete().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Delete {
    return new Plugin_PointOperation_Delete().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Delete {
    return new Plugin_PointOperation_Delete().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation_Delete | PlainMessage<Plugin_PointOperation_Delete> | undefined, b: Plugin_PointOperation_Delete | PlainMessage<Plugin_PointOperation_Delete> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation_Delete, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L128
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Replace
 */
export class Plugin_PointOperation_Replace extends Message<Plugin_PointOperation_Replace> {
  /**
   * @generated from field: string body = 1;
   */
  body = "";

  /**
   * @generated from field: optional string partition_key = 3;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_PointOperation_Replace>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Replace";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "body", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Replace {
    return new Plugin_PointOperation_Replace().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Replace {
    return new Plugin_PointOperation_Replace().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Replace {
    return new Plugin_PointOperation_Replace().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation_Replace | PlainMessage<Plugin_PointOperation_Replace> | undefined, b: Plugin_PointOperation_Replace | PlainMessage<Plugin_PointOperation_Replace> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation_Replace, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L355
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Upsert
 */
export class Plugin_PointOperation_Upsert extends Message<Plugin_PointOperation_Upsert> {
  /**
   * @generated from field: string body = 1;
   */
  body = "";

  /**
   * @generated from field: optional string partition_key = 3;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_PointOperation_Upsert>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Upsert";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "body", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Upsert {
    return new Plugin_PointOperation_Upsert().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Upsert {
    return new Plugin_PointOperation_Upsert().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Upsert {
    return new Plugin_PointOperation_Upsert().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation_Upsert | PlainMessage<Plugin_PointOperation_Upsert> | undefined, b: Plugin_PointOperation_Upsert | PlainMessage<Plugin_PointOperation_Upsert> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation_Upsert, a, b);
  }
}

/**
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L295
 *
 * @generated from message plugins.cosmosdb.v1.Plugin.PointOperation.Create
 */
export class Plugin_PointOperation_Create extends Message<Plugin_PointOperation_Create> {
  /**
   * @generated from field: string body = 1;
   */
  body = "";

  /**
   * @generated from field: optional string partition_key = 3;
   */
  partitionKey?: string;

  constructor(data?: PartialMessage<Plugin_PointOperation_Create>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.cosmosdb.v1.Plugin.PointOperation.Create";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "body", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "partition_key", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_PointOperation_Create {
    return new Plugin_PointOperation_Create().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Create {
    return new Plugin_PointOperation_Create().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_PointOperation_Create {
    return new Plugin_PointOperation_Create().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_PointOperation_Create | PlainMessage<Plugin_PointOperation_Create> | undefined, b: Plugin_PointOperation_Create | PlainMessage<Plugin_PointOperation_Create> | undefined): boolean {
    return proto3.util.equals(Plugin_PointOperation_Create, a, b);
  }
}
