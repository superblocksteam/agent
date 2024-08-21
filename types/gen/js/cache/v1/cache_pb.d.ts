// package: cache.v1
// file: cache/v1/cache.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class Mutation extends jspb.Message { 
    getResource(): string;
    setResource(value: string): Mutation;
    getId(): string;
    setId(value: string): Mutation;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_struct_pb.Value | undefined;
    setData(value?: google_protobuf_struct_pb.Value): Mutation;
    getOrganizationId(): string;
    setOrganizationId(value: string): Mutation;
    getTombstone(): boolean;
    setTombstone(value: boolean): Mutation;
    getRbacRole(): string;
    setRbacRole(value: string): Mutation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Mutation.AsObject;
    static toObject(includeInstance: boolean, msg: Mutation): Mutation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Mutation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Mutation;
    static deserializeBinaryFromReader(message: Mutation, reader: jspb.BinaryReader): Mutation;
}

export namespace Mutation {
    export type AsObject = {
        resource: string,
        id: string,
        data?: google_protobuf_struct_pb.Value.AsObject,
        organizationId: string,
        tombstone: boolean,
        rbacRole: string,
    }
}

export class MutationBatch extends jspb.Message { 
    getOperation(): Operation;
    setOperation(value: Operation): MutationBatch;
    clearBatchList(): void;
    getBatchList(): Array<Mutation>;
    setBatchList(value: Array<Mutation>): MutationBatch;
    addBatch(value?: Mutation, index?: number): Mutation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MutationBatch.AsObject;
    static toObject(includeInstance: boolean, msg: MutationBatch): MutationBatch.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MutationBatch, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MutationBatch;
    static deserializeBinaryFromReader(message: MutationBatch, reader: jspb.BinaryReader): MutationBatch;
}

export namespace MutationBatch {
    export type AsObject = {
        operation: Operation,
        batchList: Array<Mutation.AsObject>,
    }
}

export enum Operation {
    OPERATION_UNSPECIFIED = 0,
    OPERATION_UPSERT = 1,
    OPERATION_DELETE = 2,
}
