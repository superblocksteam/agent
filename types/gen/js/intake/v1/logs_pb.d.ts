// package: intake.v1
// file: intake/v1/logs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class Logs extends jspb.Message { 
    clearLogsList(): void;
    getLogsList(): Array<google_protobuf_struct_pb.Struct>;
    setLogsList(value: Array<google_protobuf_struct_pb.Struct>): Logs;
    addLogs(value?: google_protobuf_struct_pb.Struct, index?: number): google_protobuf_struct_pb.Struct;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Logs.AsObject;
    static toObject(includeInstance: boolean, msg: Logs): Logs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Logs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Logs;
    static deserializeBinaryFromReader(message: Logs, reader: jspb.BinaryReader): Logs;
}

export namespace Logs {
    export type AsObject = {
        logsList: Array<google_protobuf_struct_pb.Struct.AsObject>,
    }
}
