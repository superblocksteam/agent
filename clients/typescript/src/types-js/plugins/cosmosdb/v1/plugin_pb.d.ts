// package: plugins.cosmosdb.v1
// file: plugins/cosmosdb/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as plugins_common_v1_auth_pb from '../../../plugins/common/v1/auth_pb';
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
  getConnection(): Plugin.CosmosDbConnection | undefined;
  setConnection(value?: Plugin.CosmosDbConnection): Plugin;

  hasSql(): boolean;
  clearSql(): void;
  getSql(): Plugin.Sql | undefined;
  setSql(value?: Plugin.Sql): Plugin;

  hasPointOperation(): boolean;
  clearPointOperation(): void;
  getPointOperation(): Plugin.PointOperation | undefined;
  setPointOperation(value?: Plugin.PointOperation): Plugin;

  getCosmosdbActionCase(): Plugin.CosmosdbActionCase;

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
    connection?: Plugin.CosmosDbConnection.AsObject;
    sql?: Plugin.Sql.AsObject;
    pointOperation?: Plugin.PointOperation.AsObject;
  };

  export class CosmosDbConnection extends jspb.Message {
    getHost(): string;
    setHost(value: string): CosmosDbConnection;
    getPort(): number;
    setPort(value: number): CosmosDbConnection;
    getDatabaseId(): string;
    setDatabaseId(value: string): CosmosDbConnection;

    hasAuth(): boolean;
    clearAuth(): void;
    getAuth(): plugins_common_v1_auth_pb.Azure | undefined;
    setAuth(value?: plugins_common_v1_auth_pb.Azure): CosmosDbConnection;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CosmosDbConnection.AsObject;
    static toObject(includeInstance: boolean, msg: CosmosDbConnection): CosmosDbConnection.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: CosmosDbConnection, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CosmosDbConnection;
    static deserializeBinaryFromReader(message: CosmosDbConnection, reader: jspb.BinaryReader): CosmosDbConnection;
  }

  export namespace CosmosDbConnection {
    export type AsObject = {
      host: string;
      port: number;
      databaseId: string;
      auth?: plugins_common_v1_auth_pb.Azure.AsObject;
    };
  }

  export class Metadata extends jspb.Message {
    clearContainersList(): void;
    getContainersList(): Array<Plugin.Metadata.Container>;
    setContainersList(value: Array<Plugin.Metadata.Container>): Metadata;
    addContainers(value?: Plugin.Metadata.Container, index?: number): Plugin.Metadata.Container;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Metadata.AsObject;
    static toObject(includeInstance: boolean, msg: Metadata): Metadata.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Metadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Metadata;
    static deserializeBinaryFromReader(message: Metadata, reader: jspb.BinaryReader): Metadata;
  }

  export namespace Metadata {
    export type AsObject = {
      containersList: Array<Plugin.Metadata.Container.AsObject>;
    };

    export class Container extends jspb.Message {
      getId(): string;
      setId(value: string): Container;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): Plugin.Metadata.Container.PartitionKey | undefined;
      setPartitionKey(value?: Plugin.Metadata.Container.PartitionKey): Container;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Container.AsObject;
      static toObject(includeInstance: boolean, msg: Container): Container.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Container, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Container;
      static deserializeBinaryFromReader(message: Container, reader: jspb.BinaryReader): Container;
    }

    export namespace Container {
      export type AsObject = {
        id: string;
        partitionKey?: Plugin.Metadata.Container.PartitionKey.AsObject;
      };

      export class PartitionKey extends jspb.Message {
        clearPathsList(): void;
        getPathsList(): Array<string>;
        setPathsList(value: Array<string>): PartitionKey;
        addPaths(value: string, index?: number): string;
        getKind(): string;
        setKind(value: string): PartitionKey;

        hasVersion(): boolean;
        clearVersion(): void;
        getVersion(): number | undefined;
        setVersion(value: number): PartitionKey;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): PartitionKey.AsObject;
        static toObject(includeInstance: boolean, msg: PartitionKey): PartitionKey.AsObject;
        static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
        static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
        static serializeBinaryToWriter(message: PartitionKey, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): PartitionKey;
        static deserializeBinaryFromReader(message: PartitionKey, reader: jspb.BinaryReader): PartitionKey;
      }

      export namespace PartitionKey {
        export type AsObject = {
          pathsList: Array<string>;
          kind: string;
          version?: number;
        };
      }
    }
  }

  export class Sql extends jspb.Message {
    hasSingleton(): boolean;
    clearSingleton(): void;
    getSingleton(): Plugin.Sql.Singleton | undefined;
    setSingleton(value?: Plugin.Sql.Singleton): Sql;

    getActionCase(): Sql.ActionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Sql.AsObject;
    static toObject(includeInstance: boolean, msg: Sql): Sql.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Sql, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Sql;
    static deserializeBinaryFromReader(message: Sql, reader: jspb.BinaryReader): Sql;
  }

  export namespace Sql {
    export type AsObject = {
      singleton?: Plugin.Sql.Singleton.AsObject;
    };

    export class Singleton extends jspb.Message {
      getContainerId(): string;
      setContainerId(value: string): Singleton;
      getQuery(): string;
      setQuery(value: string): Singleton;
      getCrossPartition(): boolean;
      setCrossPartition(value: boolean): Singleton;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Singleton;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Singleton.AsObject;
      static toObject(includeInstance: boolean, msg: Singleton): Singleton.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Singleton, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Singleton;
      static deserializeBinaryFromReader(message: Singleton, reader: jspb.BinaryReader): Singleton;
    }

    export namespace Singleton {
      export type AsObject = {
        containerId: string;
        query: string;
        crossPartition: boolean;
        partitionKey?: string;
      };
    }

    export enum ActionCase {
      ACTION_NOT_SET = 0,
      SINGLETON = 1
    }
  }

  export class PointOperation extends jspb.Message {
    getContainerId(): string;
    setContainerId(value: string): PointOperation;

    hasRead(): boolean;
    clearRead(): void;
    getRead(): Plugin.PointOperation.Read | undefined;
    setRead(value?: Plugin.PointOperation.Read): PointOperation;

    hasReplace(): boolean;
    clearReplace(): void;
    getReplace(): Plugin.PointOperation.Replace | undefined;
    setReplace(value?: Plugin.PointOperation.Replace): PointOperation;

    hasUpsert(): boolean;
    clearUpsert(): void;
    getUpsert(): Plugin.PointOperation.Upsert | undefined;
    setUpsert(value?: Plugin.PointOperation.Upsert): PointOperation;

    hasDelete(): boolean;
    clearDelete(): void;
    getDelete(): Plugin.PointOperation.Delete | undefined;
    setDelete(value?: Plugin.PointOperation.Delete): PointOperation;

    hasCreate(): boolean;
    clearCreate(): void;
    getCreate(): Plugin.PointOperation.Create | undefined;
    setCreate(value?: Plugin.PointOperation.Create): PointOperation;

    getActionCase(): PointOperation.ActionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PointOperation.AsObject;
    static toObject(includeInstance: boolean, msg: PointOperation): PointOperation.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: PointOperation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PointOperation;
    static deserializeBinaryFromReader(message: PointOperation, reader: jspb.BinaryReader): PointOperation;
  }

  export namespace PointOperation {
    export type AsObject = {
      containerId: string;
      read?: Plugin.PointOperation.Read.AsObject;
      replace?: Plugin.PointOperation.Replace.AsObject;
      upsert?: Plugin.PointOperation.Upsert.AsObject;
      pb_delete?: Plugin.PointOperation.Delete.AsObject;
      create?: Plugin.PointOperation.Create.AsObject;
    };

    export class Read extends jspb.Message {
      getId(): string;
      setId(value: string): Read;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Read;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Read.AsObject;
      static toObject(includeInstance: boolean, msg: Read): Read.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Read, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Read;
      static deserializeBinaryFromReader(message: Read, reader: jspb.BinaryReader): Read;
    }

    export namespace Read {
      export type AsObject = {
        id: string;
        partitionKey?: string;
      };
    }

    export class Delete extends jspb.Message {
      getId(): string;
      setId(value: string): Delete;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Delete;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Delete.AsObject;
      static toObject(includeInstance: boolean, msg: Delete): Delete.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Delete, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Delete;
      static deserializeBinaryFromReader(message: Delete, reader: jspb.BinaryReader): Delete;
    }

    export namespace Delete {
      export type AsObject = {
        id: string;
        partitionKey?: string;
      };
    }

    export class Replace extends jspb.Message {
      getBody(): string;
      setBody(value: string): Replace;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Replace;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Replace.AsObject;
      static toObject(includeInstance: boolean, msg: Replace): Replace.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Replace, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Replace;
      static deserializeBinaryFromReader(message: Replace, reader: jspb.BinaryReader): Replace;
    }

    export namespace Replace {
      export type AsObject = {
        body: string;
        partitionKey?: string;
      };
    }

    export class Upsert extends jspb.Message {
      getBody(): string;
      setBody(value: string): Upsert;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Upsert;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Upsert.AsObject;
      static toObject(includeInstance: boolean, msg: Upsert): Upsert.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Upsert, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Upsert;
      static deserializeBinaryFromReader(message: Upsert, reader: jspb.BinaryReader): Upsert;
    }

    export namespace Upsert {
      export type AsObject = {
        body: string;
        partitionKey?: string;
      };
    }

    export class Create extends jspb.Message {
      getBody(): string;
      setBody(value: string): Create;

      hasPartitionKey(): boolean;
      clearPartitionKey(): void;
      getPartitionKey(): string | undefined;
      setPartitionKey(value: string): Create;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Create.AsObject;
      static toObject(includeInstance: boolean, msg: Create): Create.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Create, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Create;
      static deserializeBinaryFromReader(message: Create, reader: jspb.BinaryReader): Create;
    }

    export namespace Create {
      export type AsObject = {
        body: string;
        partitionKey?: string;
      };
    }

    export enum ActionCase {
      ACTION_NOT_SET = 0,
      READ = 2,
      REPLACE = 3,
      UPSERT = 4,
      DELETE = 5,
      CREATE = 6
    }
  }

  export enum CosmosdbActionCase {
    COSMOSDB_ACTION_NOT_SET = 0,
    SQL = 5,
    POINT_OPERATION = 6
  }
}
