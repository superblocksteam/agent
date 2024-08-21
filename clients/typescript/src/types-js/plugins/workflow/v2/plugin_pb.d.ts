// package: plugins.workflow.v2
// file: plugins/workflow/v2/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as common_v1_plugin_pb from '../../../common/v1/plugin_pb';

export class Plugin extends jspb.Message {
  getId(): string;
  setId(value: string): Plugin;

  hasParameters(): boolean;
  clearParameters(): void;
  getParameters(): common_v1_plugin_pb.HttpParameters | undefined;
  setParameters(value?: common_v1_plugin_pb.HttpParameters): Plugin;

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
    id: string;
    parameters?: common_v1_plugin_pb.HttpParameters.AsObject;
  };
}
