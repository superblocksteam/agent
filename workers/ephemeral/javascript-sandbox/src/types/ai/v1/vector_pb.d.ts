// package: ai.v1
// file: ai/v1/vector.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class Vector extends jspb.Message { 
    getId(): string;
    setId(value: string): Vector;
    clearValuesList(): void;
    getValuesList(): Array<number>;
    setValuesList(value: Array<number>): Vector;
    addValues(value: number, index?: number): number;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): Vector;

    hasScore(): boolean;
    clearScore(): void;
    getScore(): number | undefined;
    setScore(value: number): Vector;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Vector.AsObject;
    static toObject(includeInstance: boolean, msg: Vector): Vector.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Vector, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Vector;
    static deserializeBinaryFromReader(message: Vector, reader: jspb.BinaryReader): Vector;
}

export namespace Vector {
    export type AsObject = {
        id: string,
        valuesList: Array<number>,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
        score?: number,
    }
}
