// package: plugins.custom.v1
// file: plugins/custom/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class Plugin extends jspb.Message {
  getName(): string;
  setName(value: string): Plugin;
  getVersion(): string;
  setVersion(value: string): Plugin;
  getConfig(): string;
  setConfig(value: string): Plugin;

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
    name: string;
    version: string;
    config: string;
  };
}
