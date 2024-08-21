// package: store.v1
// file: store/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as store_v1_store_pb from "../../store/v1/store_pb";

export class ReadRequest extends jspb.Message { 
    clearKeysList(): void;
    getKeysList(): Array<string>;
    setKeysList(value: Array<string>): ReadRequest;
    addKeys(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadRequest): ReadRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadRequest;
    static deserializeBinaryFromReader(message: ReadRequest, reader: jspb.BinaryReader): ReadRequest;
}

export namespace ReadRequest {
    export type AsObject = {
        keysList: Array<string>,
    }
}

export class ReadResponse extends jspb.Message { 
    clearResultsList(): void;
    getResultsList(): Array<google_protobuf_struct_pb.Value>;
    setResultsList(value: Array<google_protobuf_struct_pb.Value>): ReadResponse;
    addResults(value?: google_protobuf_struct_pb.Value, index?: number): google_protobuf_struct_pb.Value;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): ReadResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadResponse): ReadResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadResponse;
    static deserializeBinaryFromReader(message: ReadResponse, reader: jspb.BinaryReader): ReadResponse;
}

export namespace ReadResponse {
    export type AsObject = {
        resultsList: Array<google_protobuf_struct_pb.Value.AsObject>,
        error?: common_v1_errors_pb.Error.AsObject,
    }
}

export class WriteRequest extends jspb.Message { 
    clearPairsList(): void;
    getPairsList(): Array<store_v1_store_pb.Pair>;
    setPairsList(value: Array<store_v1_store_pb.Pair>): WriteRequest;
    addPairs(value?: store_v1_store_pb.Pair, index?: number): store_v1_store_pb.Pair;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WriteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WriteRequest): WriteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WriteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WriteRequest;
    static deserializeBinaryFromReader(message: WriteRequest, reader: jspb.BinaryReader): WriteRequest;
}

export namespace WriteRequest {
    export type AsObject = {
        pairsList: Array<store_v1_store_pb.Pair.AsObject>,
    }
}

export class WriteResponse extends jspb.Message { 
    clearPairsList(): void;
    getPairsList(): Array<store_v1_store_pb.Pair>;
    setPairsList(value: Array<store_v1_store_pb.Pair>): WriteResponse;
    addPairs(value?: store_v1_store_pb.Pair, index?: number): store_v1_store_pb.Pair;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): WriteResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WriteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WriteResponse): WriteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WriteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WriteResponse;
    static deserializeBinaryFromReader(message: WriteResponse, reader: jspb.BinaryReader): WriteResponse;
}

export namespace WriteResponse {
    export type AsObject = {
        pairsList: Array<store_v1_store_pb.Pair.AsObject>,
        error?: common_v1_errors_pb.Error.AsObject,
    }
}
