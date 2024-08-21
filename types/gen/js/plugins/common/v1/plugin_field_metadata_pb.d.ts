// package: plugins.common.v1
// file: plugins/common/v1/plugin_field_metadata.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_descriptor_pb from "google-protobuf/google/protobuf/descriptor_pb";

export class PluginFieldMeta extends jspb.Message { 
    getIsPublic(): boolean;
    setIsPublic(value: boolean): PluginFieldMeta;
    getIsSecret(): boolean;
    setIsSecret(value: boolean): PluginFieldMeta;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PluginFieldMeta.AsObject;
    static toObject(includeInstance: boolean, msg: PluginFieldMeta): PluginFieldMeta.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PluginFieldMeta, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PluginFieldMeta;
    static deserializeBinaryFromReader(message: PluginFieldMeta, reader: jspb.BinaryReader): PluginFieldMeta;
}

export namespace PluginFieldMeta {
    export type AsObject = {
        isPublic: boolean,
        isSecret: boolean,
    }
}

export const pluginFieldMeta: jspb.ExtensionFieldInfo<PluginFieldMeta>;
