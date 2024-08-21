// package: plugins.pinecone.v1
// file: plugins/pinecone/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as plugins_common_v1_plugin_pb from '../../../plugins/common/v1/plugin_pb';

export class Plugin extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): Plugin;

  hasDynamicWorkflowConfiguration(): boolean;
  clearDynamicWorkflowConfiguration(): void;
  getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
  setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

  hasConnection(): boolean;
  clearConnection(): void;
  getConnection(): Plugin.Connection | undefined;
  setConnection(value?: Plugin.Connection): Plugin;

  hasListIndexes(): boolean;
  clearListIndexes(): void;
  getListIndexes(): Plugin.ListIndexes | undefined;
  setListIndexes(value?: Plugin.ListIndexes): Plugin;

  hasCreateIndex(): boolean;
  clearCreateIndex(): void;
  getCreateIndex(): Plugin.CreateIndex | undefined;
  setCreateIndex(value?: Plugin.CreateIndex): Plugin;

  hasUpsertVector(): boolean;
  clearUpsertVector(): void;
  getUpsertVector(): Plugin.UpsertVector | undefined;
  setUpsertVector(value?: Plugin.UpsertVector): Plugin;

  hasQuery(): boolean;
  clearQuery(): void;
  getQuery(): Plugin.Query | undefined;
  setQuery(value?: Plugin.Query): Plugin;

  getActionCase(): Plugin.ActionCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Plugin.AsObject;
  static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Plugin;
  static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
  export type AsObject = {
    name?: string;
    dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject;
    connection?: Plugin.Connection.AsObject;
    listIndexes?: Plugin.ListIndexes.AsObject;
    createIndex?: Plugin.CreateIndex.AsObject;
    upsertVector?: Plugin.UpsertVector.AsObject;
    query?: Plugin.Query.AsObject;
  };

  export class Connection extends jspb.Message {
    getEnvironment(): string;
    setEnvironment(value: string): Connection;
    getApiKey(): string;
    setApiKey(value: string): Connection;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Connection.AsObject;
    static toObject(includeInstance: boolean, msg: Connection): Connection.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Connection, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Connection;
    static deserializeBinaryFromReader(message: Connection, reader: jspb.BinaryReader): Connection;
  }

  export namespace Connection {
    export type AsObject = {
      environment: string;
      apiKey: string;
    };
  }

  export class ListIndexes extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListIndexes.AsObject;
    static toObject(includeInstance: boolean, msg: ListIndexes): ListIndexes.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: ListIndexes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListIndexes;
    static deserializeBinaryFromReader(message: ListIndexes, reader: jspb.BinaryReader): ListIndexes;
  }

  export namespace ListIndexes {
    export type AsObject = {};
  }

  export class CreateIndex extends jspb.Message {
    getName(): string;
    setName(value: string): CreateIndex;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateIndex.AsObject;
    static toObject(includeInstance: boolean, msg: CreateIndex): CreateIndex.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: CreateIndex, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateIndex;
    static deserializeBinaryFromReader(message: CreateIndex, reader: jspb.BinaryReader): CreateIndex;
  }

  export namespace CreateIndex {
    export type AsObject = {
      name: string;
    };
  }

  export class UpsertVector extends jspb.Message {
    hasRaw(): boolean;
    clearRaw(): void;
    getRaw(): string;
    setRaw(value: string): UpsertVector;

    getDataCase(): UpsertVector.DataCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpsertVector.AsObject;
    static toObject(includeInstance: boolean, msg: UpsertVector): UpsertVector.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: UpsertVector, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpsertVector;
    static deserializeBinaryFromReader(message: UpsertVector, reader: jspb.BinaryReader): UpsertVector;
  }

  export namespace UpsertVector {
    export type AsObject = {
      raw: string;
    };

    export enum DataCase {
      DATA_NOT_SET = 0,
      RAW = 1
    }
  }

  export class Query extends jspb.Message {
    getVector(): string;
    setVector(value: string): Query;

    hasTopK(): boolean;
    clearTopK(): void;
    getTopK(): string | undefined;
    setTopK(value: string): Query;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Query.AsObject;
    static toObject(includeInstance: boolean, msg: Query): Query.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Query, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Query;
    static deserializeBinaryFromReader(message: Query, reader: jspb.BinaryReader): Query;
  }

  export namespace Query {
    export type AsObject = {
      vector: string;
      topK?: string;
    };
  }

  export enum ActionCase {
    ACTION_NOT_SET = 0,
    LIST_INDEXES = 4,
    CREATE_INDEX = 5,
    UPSERT_VECTOR = 6,
    QUERY = 7
  }
}
