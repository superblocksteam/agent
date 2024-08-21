// package: plugins.gsheets.v1
// file: plugins/gsheets/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

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
  getSpreadsheetid(): string;
  setSpreadsheetid(value: string): Plugin;
  getSheettitle(): string;
  setSheettitle(value: string): Plugin;

  hasRange(): boolean;
  clearRange(): void;
  getRange(): string | undefined;
  setRange(value: string): Plugin;

  hasRownumber(): boolean;
  clearRownumber(): void;
  getRownumber(): string | undefined;
  setRownumber(value: string): Plugin;
  getExtractfirstrowheader(): boolean;
  setExtractfirstrowheader(value: boolean): Plugin;

  hasHeaderrownumber(): boolean;
  clearHeaderrownumber(): void;
  getHeaderrownumber(): string | undefined;
  setHeaderrownumber(value: string): Plugin;

  hasFormat(): boolean;
  clearFormat(): void;
  getFormat(): string | undefined;
  setFormat(value: string): Plugin;

  hasData(): boolean;
  clearData(): void;
  getData(): string | undefined;
  setData(value: string): Plugin;
  getPreserveheaderrow(): boolean;
  setPreserveheaderrow(value: boolean): Plugin;
  getIncludeheaderrow(): boolean;
  setIncludeheaderrow(value: boolean): Plugin;

  hasAction(): boolean;
  clearAction(): void;
  getAction(): string | undefined;
  setAction(value: string): Plugin;

  hasWritetodestinationtype(): boolean;
  clearWritetodestinationtype(): void;
  getWritetodestinationtype(): string | undefined;
  setWritetodestinationtype(value: string): Plugin;

  hasBody(): boolean;
  clearBody(): void;
  getBody(): string | undefined;
  setBody(value: string): Plugin;

  hasSuperblocksmetadata(): boolean;
  clearSuperblocksmetadata(): void;
  getSuperblocksmetadata(): SuperblocksMetadata | undefined;
  setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

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
    spreadsheetid: string;
    sheettitle: string;
    range?: string;
    rownumber?: string;
    extractfirstrowheader: boolean;
    headerrownumber?: string;
    format?: string;
    data?: string;
    preserveheaderrow: boolean;
    includeheaderrow: boolean;
    action?: string;
    writetodestinationtype?: string;
    body?: string;
    superblocksmetadata?: SuperblocksMetadata.AsObject;
  };
}
