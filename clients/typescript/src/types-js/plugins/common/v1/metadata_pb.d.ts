// package: plugins.common.v1
// file: plugins/common/v1/metadata.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class SQLMetadata extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SQLMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SQLMetadata): SQLMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: SQLMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SQLMetadata;
  static deserializeBinaryFromReader(message: SQLMetadata, reader: jspb.BinaryReader): SQLMetadata;
}

export namespace SQLMetadata {
  export type AsObject = {};

  export class Minified extends jspb.Message {
    getTablesMap(): jspb.Map<string, SQLMetadata.Minified.Table>;
    clearTablesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Minified.AsObject;
    static toObject(includeInstance: boolean, msg: Minified): Minified.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Minified, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Minified;
    static deserializeBinaryFromReader(message: Minified, reader: jspb.BinaryReader): Minified;
  }

  export namespace Minified {
    export type AsObject = {
      tablesMap: Array<[string, SQLMetadata.Minified.Table.AsObject]>;
    };

    export class Table extends jspb.Message {
      getColumnsMap(): jspb.Map<string, string>;
      clearColumnsMap(): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Table.AsObject;
      static toObject(includeInstance: boolean, msg: Table): Table.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Table, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Table;
      static deserializeBinaryFromReader(message: Table, reader: jspb.BinaryReader): Table;
    }

    export namespace Table {
      export type AsObject = {
        columnsMap: Array<[string, string]>;
      };
    }
  }
}

export class BucketsMetadata extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BucketsMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: BucketsMetadata): BucketsMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: BucketsMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BucketsMetadata;
  static deserializeBinaryFromReader(message: BucketsMetadata, reader: jspb.BinaryReader): BucketsMetadata;
}

export namespace BucketsMetadata {
  export type AsObject = {};

  export class Minified extends jspb.Message {
    clearNamesList(): void;
    getNamesList(): Array<string>;
    setNamesList(value: Array<string>): Minified;
    addNames(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Minified.AsObject;
    static toObject(includeInstance: boolean, msg: Minified): Minified.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Minified, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Minified;
    static deserializeBinaryFromReader(message: Minified, reader: jspb.BinaryReader): Minified;
  }

  export namespace Minified {
    export type AsObject = {
      namesList: Array<string>;
    };
  }
}
