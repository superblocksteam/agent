// package: plugins.workflow.v1
// file: plugins/workflow/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as common_v1_plugin_pb from '../../../common/v1/plugin_pb';

export class Tuple extends jspb.Message {
  getKey(): string;
  setKey(value: string): Tuple;
  getValue(): string;
  setValue(value: string): Tuple;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Tuple.AsObject;
  static toObject(includeInstance: boolean, msg: Tuple): Tuple.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Tuple, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Tuple;
  static deserializeBinaryFromReader(message: Tuple, reader: jspb.BinaryReader): Tuple;
}

export namespace Tuple {
  export type AsObject = {
    key: string;
    value: string;
  };
}

export class Plugin extends jspb.Message {
  getWorkflow(): string;
  setWorkflow(value: string): Plugin;

  getCustomMap(): jspb.Map<string, common_v1_plugin_pb.Property>;
  clearCustomMap(): void;

  getQueryparamsMap(): jspb.Map<string, common_v1_plugin_pb.Property>;
  clearQueryparamsMap(): void;

  hasSuperblocksmetadata(): boolean;
  clearSuperblocksmetadata(): void;
  getSuperblocksmetadata(): common_v1_plugin_pb.SuperblocksMetadata | undefined;
  setSuperblocksmetadata(value?: common_v1_plugin_pb.SuperblocksMetadata): Plugin;

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
    workflow: string;

    customMap: Array<[string, common_v1_plugin_pb.Property.AsObject]>;

    queryparamsMap: Array<[string, common_v1_plugin_pb.Property.AsObject]>;
    superblocksmetadata?: common_v1_plugin_pb.SuperblocksMetadata.AsObject;
  };
}
