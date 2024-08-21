// package: plugins.mariadb.v1
// file: plugins/mariadb/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class MappedColumns extends jspb.Message {
  getJson(): string;
  setJson(value: string): MappedColumns;
  getSql(): string;
  setSql(value: string): MappedColumns;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MappedColumns.AsObject;
  static toObject(includeInstance: boolean, msg: MappedColumns): MappedColumns.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: MappedColumns, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MappedColumns;
  static deserializeBinaryFromReader(message: MappedColumns, reader: jspb.BinaryReader): MappedColumns;
}

export namespace MappedColumns {
  export type AsObject = {
    json: string;
    sql: string;
  };
}

export class SuperblocksMetadata extends jspb.Message {
  getPluginversion(): string;
  setPluginversion(value: string): SuperblocksMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SuperblocksMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SuperblocksMetadata): SuperblocksMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: SuperblocksMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SuperblocksMetadata;
  static deserializeBinaryFromReader(message: SuperblocksMetadata, reader: jspb.BinaryReader): SuperblocksMetadata;
}

export namespace SuperblocksMetadata {
  export type AsObject = {
    pluginversion: string;
  };
}

export class Plugin extends jspb.Message {
  getBody(): string;
  setBody(value: string): Plugin;
  getUsepreparedsql(): boolean;
  setUsepreparedsql(value: boolean): Plugin;

  hasOperation(): boolean;
  clearOperation(): void;
  getOperation(): string | undefined;
  setOperation(value: string): Plugin;

  hasUseadvancedmatching(): boolean;
  clearUseadvancedmatching(): void;
  getUseadvancedmatching(): string | undefined;
  setUseadvancedmatching(value: string): Plugin;

  hasTable(): boolean;
  clearTable(): void;
  getTable(): string | undefined;
  setTable(value: string): Plugin;

  hasNewvalues(): boolean;
  clearNewvalues(): void;
  getNewvalues(): string | undefined;
  setNewvalues(value: string): Plugin;

  hasOldvalues(): boolean;
  clearOldvalues(): void;
  getOldvalues(): string | undefined;
  setOldvalues(value: string): Plugin;
  clearFilterbyList(): void;
  getFilterbyList(): Array<string>;
  setFilterbyList(value: Array<string>): Plugin;
  addFilterby(value: string, index?: number): string;

  hasMappingmode(): boolean;
  clearMappingmode(): void;
  getMappingmode(): string | undefined;
  setMappingmode(value: string): Plugin;
  clearMappedcolumnsList(): void;
  getMappedcolumnsList(): Array<MappedColumns>;
  setMappedcolumnsList(value: Array<MappedColumns>): Plugin;
  addMappedcolumns(value?: MappedColumns, index?: number): MappedColumns;

  hasSuperblocksmetadata(): boolean;
  clearSuperblocksmetadata(): void;
  getSuperblocksmetadata(): SuperblocksMetadata | undefined;
  setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

  hasInsertedrows(): boolean;
  clearInsertedrows(): void;
  getInsertedrows(): string | undefined;
  setInsertedrows(value: string): Plugin;

  hasDeletedrows(): boolean;
  clearDeletedrows(): void;
  getDeletedrows(): string | undefined;
  setDeletedrows(value: string): Plugin;

  hasSchema(): boolean;
  clearSchema(): void;
  getSchema(): string | undefined;
  setSchema(value: string): Plugin;

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
    body: string;
    usepreparedsql: boolean;
    operation?: string;
    useadvancedmatching?: string;
    table?: string;
    newvalues?: string;
    oldvalues?: string;
    filterbyList: Array<string>;
    mappingmode?: string;
    mappedcolumnsList: Array<MappedColumns.AsObject>;
    superblocksmetadata?: SuperblocksMetadata.AsObject;
    insertedrows?: string;
    deletedrows?: string;
    schema?: string;
  };
}
