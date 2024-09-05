// package: plugins.graphql.v1
// file: plugins/graphql/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_plugin_pb from "../../../common/v1/plugin_pb";

export class Custom extends jspb.Message { 

    hasVariables(): boolean;
    clearVariables(): void;
    getVariables(): common_v1_plugin_pb.Property | undefined;
    setVariables(value?: common_v1_plugin_pb.Property): Custom;

    hasRequestformat(): boolean;
    clearRequestformat(): void;
    getRequestformat(): common_v1_plugin_pb.Property | undefined;
    setRequestformat(value?: common_v1_plugin_pb.Property): Custom;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Custom.AsObject;
    static toObject(includeInstance: boolean, msg: Custom): Custom.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Custom, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Custom;
    static deserializeBinaryFromReader(message: Custom, reader: jspb.BinaryReader): Custom;
}

export namespace Custom {
    export type AsObject = {
        variables?: common_v1_plugin_pb.Property.AsObject,
        requestformat?: common_v1_plugin_pb.Property.AsObject,
    }
}

export class Plugin extends jspb.Message { 
    getPath(): string;
    setPath(value: string): Plugin;
    clearHeadersList(): void;
    getHeadersList(): Array<common_v1_plugin_pb.Property>;
    setHeadersList(value: Array<common_v1_plugin_pb.Property>): Plugin;
    addHeaders(value?: common_v1_plugin_pb.Property, index?: number): common_v1_plugin_pb.Property;
    getBody(): string;
    setBody(value: string): Plugin;

    hasCustom(): boolean;
    clearCustom(): void;
    getCustom(): Custom | undefined;
    setCustom(value?: Custom): Plugin;

    hasSuperblocksmetadata(): boolean;
    clearSuperblocksmetadata(): void;
    getSuperblocksmetadata(): common_v1_plugin_pb.SuperblocksMetadata | undefined;
    setSuperblocksmetadata(value?: common_v1_plugin_pb.SuperblocksMetadata): Plugin;
    getVerbosehttpoutput(): boolean;
    setVerbosehttpoutput(value: boolean): Plugin;
    getDonotfailonrequesterror(): boolean;
    setDonotfailonrequesterror(value: boolean): Plugin;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Plugin.AsObject;
    static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Plugin;
    static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
    export type AsObject = {
        path: string,
        headersList: Array<common_v1_plugin_pb.Property.AsObject>,
        body: string,
        custom?: Custom.AsObject,
        superblocksmetadata?: common_v1_plugin_pb.SuperblocksMetadata.AsObject,
        verbosehttpoutput: boolean,
        donotfailonrequesterror: boolean,
    }
}
