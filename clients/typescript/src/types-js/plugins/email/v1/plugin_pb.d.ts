// package: plugins.email.v1
// file: plugins/email/v1/plugin.proto

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
  getEmailfrom(): string;
  setEmailfrom(value: string): Plugin;
  getEmailto(): string;
  setEmailto(value: string): Plugin;
  getEmailcc(): string;
  setEmailcc(value: string): Plugin;
  getEmailbcc(): string;
  setEmailbcc(value: string): Plugin;
  getEmailsubject(): string;
  setEmailsubject(value: string): Plugin;
  getEmailbody(): string;
  setEmailbody(value: string): Plugin;
  getEmailattachments(): string;
  setEmailattachments(value: string): Plugin;

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
    emailfrom: string;
    emailto: string;
    emailcc: string;
    emailbcc: string;
    emailsubject: string;
    emailbody: string;
    emailattachments: string;
    superblocksmetadata?: SuperblocksMetadata.AsObject;
  };
}
