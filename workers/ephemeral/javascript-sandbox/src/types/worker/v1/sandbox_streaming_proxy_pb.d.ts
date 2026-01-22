// package: worker.v1
// file: worker/v1/sandbox_streaming_proxy.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class SendRequest extends jspb.Message { 
    getTopic(): string;
    setTopic(value: string): SendRequest;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_struct_pb.Value | undefined;
    setData(value?: google_protobuf_struct_pb.Value): SendRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendRequest): SendRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendRequest;
    static deserializeBinaryFromReader(message: SendRequest, reader: jspb.BinaryReader): SendRequest;
}

export namespace SendRequest {
    export type AsObject = {
        topic: string,
        data?: google_protobuf_struct_pb.Value.AsObject,
    }
}

export class UntilRequest extends jspb.Message { 
    getTopic(): string;
    setTopic(value: string): UntilRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UntilRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UntilRequest): UntilRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UntilRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UntilRequest;
    static deserializeBinaryFromReader(message: UntilRequest, reader: jspb.BinaryReader): UntilRequest;
}

export namespace UntilRequest {
    export type AsObject = {
        topic: string,
    }
}
