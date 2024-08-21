// package: superblocks.v1
// file: superblocks/v1/options.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_descriptor_pb from "google-protobuf/google/protobuf/descriptor_pb";

export class Integrations extends jspb.Message { 
    getRegistry(): boolean;
    setRegistry(value: boolean): Integrations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Integrations.AsObject;
    static toObject(includeInstance: boolean, msg: Integrations): Integrations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Integrations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Integrations;
    static deserializeBinaryFromReader(message: Integrations, reader: jspb.BinaryReader): Integrations;
}

export namespace Integrations {
    export type AsObject = {
        registry: boolean,
    }
}

export class IntegrationOptions extends jspb.Message { 
    getPlugintype(): string;
    setPlugintype(value: string): IntegrationOptions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IntegrationOptions.AsObject;
    static toObject(includeInstance: boolean, msg: IntegrationOptions): IntegrationOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IntegrationOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IntegrationOptions;
    static deserializeBinaryFromReader(message: IntegrationOptions, reader: jspb.BinaryReader): IntegrationOptions;
}

export namespace IntegrationOptions {
    export type AsObject = {
        plugintype: string,
    }
}

export const integrations: jspb.ExtensionFieldInfo<Integrations>;

export const integrationOptions: jspb.ExtensionFieldInfo<IntegrationOptions>;
