// package: buf.validate.priv
// file: buf/validate/priv/private.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_descriptor_pb from "google-protobuf/google/protobuf/descriptor_pb";

export class FieldConstraints extends jspb.Message { 
    clearCelList(): void;
    getCelList(): Array<Constraint>;
    setCelList(value: Array<Constraint>): FieldConstraints;
    addCel(value?: Constraint, index?: number): Constraint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FieldConstraints.AsObject;
    static toObject(includeInstance: boolean, msg: FieldConstraints): FieldConstraints.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FieldConstraints, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FieldConstraints;
    static deserializeBinaryFromReader(message: FieldConstraints, reader: jspb.BinaryReader): FieldConstraints;
}

export namespace FieldConstraints {
    export type AsObject = {
        celList: Array<Constraint.AsObject>,
    }
}

export class Constraint extends jspb.Message { 
    getId(): string;
    setId(value: string): Constraint;
    getMessage(): string;
    setMessage(value: string): Constraint;
    getExpression(): string;
    setExpression(value: string): Constraint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Constraint.AsObject;
    static toObject(includeInstance: boolean, msg: Constraint): Constraint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Constraint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Constraint;
    static deserializeBinaryFromReader(message: Constraint, reader: jspb.BinaryReader): Constraint;
}

export namespace Constraint {
    export type AsObject = {
        id: string,
        message: string,
        expression: string,
    }
}

export const field: jspb.ExtensionFieldInfo<FieldConstraints>;
