// package: plugins.restapi.v1
// file: plugins/restapi/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_plugin_pb from "../../../common/v1/plugin_pb";

export class Plugin extends jspb.Message { 
    getHttpmethod(): string;
    setHttpmethod(value: string): Plugin;
    getResponsetype(): string;
    setResponsetype(value: string): Plugin;
    clearHeadersList(): void;
    getHeadersList(): Array<common_v1_plugin_pb.Property>;
    setHeadersList(value: Array<common_v1_plugin_pb.Property>): Plugin;
    addHeaders(value?: common_v1_plugin_pb.Property, index?: number): common_v1_plugin_pb.Property;
    clearParamsList(): void;
    getParamsList(): Array<common_v1_plugin_pb.Property>;
    setParamsList(value: Array<common_v1_plugin_pb.Property>): Plugin;
    addParams(value?: common_v1_plugin_pb.Property, index?: number): common_v1_plugin_pb.Property;
    getBodytype(): string;
    setBodytype(value: string): Plugin;
    getBody(): string;
    setBody(value: string): Plugin;
    clearFormdataList(): void;
    getFormdataList(): Array<common_v1_plugin_pb.Property>;
    setFormdataList(value: Array<common_v1_plugin_pb.Property>): Plugin;
    addFormdata(value?: common_v1_plugin_pb.Property, index?: number): common_v1_plugin_pb.Property;
    getFileformkey(): string;
    setFileformkey(value: string): Plugin;
    getFilename(): string;
    setFilename(value: string): Plugin;
    getPath(): string;
    setPath(value: string): Plugin;
    getJsonbody(): string;
    setJsonbody(value: string): Plugin;

    hasSuperblocksmetadata(): boolean;
    clearSuperblocksmetadata(): void;
    getSuperblocksmetadata(): common_v1_plugin_pb.SuperblocksMetadata | undefined;
    setSuperblocksmetadata(value?: common_v1_plugin_pb.SuperblocksMetadata): Plugin;

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
        httpmethod: string,
        responsetype: string,
        headersList: Array<common_v1_plugin_pb.Property.AsObject>,
        paramsList: Array<common_v1_plugin_pb.Property.AsObject>,
        bodytype: string,
        body: string,
        formdataList: Array<common_v1_plugin_pb.Property.AsObject>,
        fileformkey: string,
        filename: string,
        path: string,
        jsonbody: string,
        superblocksmetadata?: common_v1_plugin_pb.SuperblocksMetadata.AsObject,
    }
}
