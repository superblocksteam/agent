// package: plugins.common.v1
// file: plugins/common/v1/common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class SQLActionConfiguration extends jspb.Message { 
    getBody(): string;
    setBody(value: string): SQLActionConfiguration;
    getUsepreparedsql(): boolean;
    setUsepreparedsql(value: boolean): SQLActionConfiguration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SQLActionConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: SQLActionConfiguration): SQLActionConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SQLActionConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SQLActionConfiguration;
    static deserializeBinaryFromReader(message: SQLActionConfiguration, reader: jspb.BinaryReader): SQLActionConfiguration;
}

export namespace SQLActionConfiguration {
    export type AsObject = {
        body: string,
        usepreparedsql: boolean,
    }
}
