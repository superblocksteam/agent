// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file plugins/pinecone/v1/plugin.proto (package plugins.pinecone.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";

/**
 * @generated from message plugins.pinecone.v1.Plugin
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
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Plugin>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 2, name: "dynamic_workflow_configuration", kind: "message", T: DynamicWorkflowConfiguration, opt: true },
    { no: 3, name: "connection", kind: "message", T: Plugin_Connection },
    { no: 4, name: "list_indexes", kind: "message", T: Plugin_ListIndexes, oneof: "action" },
    { no: 5, name: "create_index", kind: "message", T: Plugin_CreateIndex, oneof: "action" },
    { no: 6, name: "upsert_vector", kind: "message", T: Plugin_UpsertVector, oneof: "action" },
    { no: 7, name: "query", kind: "message", T: Plugin_Query, oneof: "action" },
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
 * @generated from message plugins.pinecone.v1.Plugin.Connection
 */
export class Plugin_Connection extends Message<Plugin_Connection> {
  /**
   * @generated from field: string environment = 1;
   */
  environment = "";

  /**
   * @generated from field: string api_key = 2;
   */
  apiKey = "";

  constructor(data?: PartialMessage<Plugin_Connection>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin.Connection";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "environment", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "api_key", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Connection {
    return new Plugin_Connection().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Connection {
    return new Plugin_Connection().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Connection {
    return new Plugin_Connection().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined, b: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined): boolean {
    return proto3.util.equals(Plugin_Connection, a, b);
  }
}

/**
 * @generated from message plugins.pinecone.v1.Plugin.ListIndexes
 */
export class Plugin_ListIndexes extends Message<Plugin_ListIndexes> {
  constructor(data?: PartialMessage<Plugin_ListIndexes>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin.ListIndexes";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_ListIndexes {
    return new Plugin_ListIndexes().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_ListIndexes {
    return new Plugin_ListIndexes().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_ListIndexes {
    return new Plugin_ListIndexes().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_ListIndexes | PlainMessage<Plugin_ListIndexes> | undefined, b: Plugin_ListIndexes | PlainMessage<Plugin_ListIndexes> | undefined): boolean {
    return proto3.util.equals(Plugin_ListIndexes, a, b);
  }
}

/**
 * @generated from message plugins.pinecone.v1.Plugin.CreateIndex
 */
export class Plugin_CreateIndex extends Message<Plugin_CreateIndex> {
  /**
   * @generated from field: string name = 1;
   */
  name = "";

  constructor(data?: PartialMessage<Plugin_CreateIndex>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin.CreateIndex";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CreateIndex {
    return new Plugin_CreateIndex().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CreateIndex {
    return new Plugin_CreateIndex().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CreateIndex {
    return new Plugin_CreateIndex().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_CreateIndex | PlainMessage<Plugin_CreateIndex> | undefined, b: Plugin_CreateIndex | PlainMessage<Plugin_CreateIndex> | undefined): boolean {
    return proto3.util.equals(Plugin_CreateIndex, a, b);
  }
}

/**
 * @generated from message plugins.pinecone.v1.Plugin.UpsertVector
 */
export class Plugin_UpsertVector extends Message<Plugin_UpsertVector> {
  /**
   * @generated from oneof plugins.pinecone.v1.Plugin.UpsertVector.data
   */
  data: {
    /**
     * @generated from field: string raw = 1;
     */
    value: string;
    case: "raw";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Plugin_UpsertVector>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin.UpsertVector";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "raw", kind: "scalar", T: 9 /* ScalarType.STRING */, oneof: "data" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_UpsertVector {
    return new Plugin_UpsertVector().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_UpsertVector {
    return new Plugin_UpsertVector().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_UpsertVector {
    return new Plugin_UpsertVector().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_UpsertVector | PlainMessage<Plugin_UpsertVector> | undefined, b: Plugin_UpsertVector | PlainMessage<Plugin_UpsertVector> | undefined): boolean {
    return proto3.util.equals(Plugin_UpsertVector, a, b);
  }
}

/**
 * @generated from message plugins.pinecone.v1.Plugin.Query
 */
export class Plugin_Query extends Message<Plugin_Query> {
  /**
   * @generated from field: string vector = 1;
   */
  vector = "";

  /**
   * @generated from field: optional string top_k = 2;
   */
  topK?: string;

  constructor(data?: PartialMessage<Plugin_Query>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.pinecone.v1.Plugin.Query";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "vector", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "top_k", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Query {
    return new Plugin_Query().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Query {
    return new Plugin_Query().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Query {
    return new Plugin_Query().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_Query | PlainMessage<Plugin_Query> | undefined, b: Plugin_Query | PlainMessage<Plugin_Query> | undefined): boolean {
    return proto3.util.equals(Plugin_Query, a, b);
  }
}

