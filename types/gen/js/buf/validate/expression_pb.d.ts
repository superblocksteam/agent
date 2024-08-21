// package: buf.validate
// file: buf/validate/expression.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

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

export class Violations extends jspb.Message { 
    clearViolationsList(): void;
    getViolationsList(): Array<Violation>;
    setViolationsList(value: Array<Violation>): Violations;
    addViolations(value?: Violation, index?: number): Violation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Violations.AsObject;
    static toObject(includeInstance: boolean, msg: Violations): Violations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Violations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Violations;
    static deserializeBinaryFromReader(message: Violations, reader: jspb.BinaryReader): Violations;
}

export namespace Violations {
    export type AsObject = {
        violationsList: Array<Violation.AsObject>,
    }
}

export class Violation extends jspb.Message { 
    getFieldPath(): string;
    setFieldPath(value: string): Violation;
    getConstraintId(): string;
    setConstraintId(value: string): Violation;
    getMessage(): string;
    setMessage(value: string): Violation;
    getForKey(): boolean;
    setForKey(value: boolean): Violation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Violation.AsObject;
    static toObject(includeInstance: boolean, msg: Violation): Violation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Violation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Violation;
    static deserializeBinaryFromReader(message: Violation, reader: jspb.BinaryReader): Violation;
}

export namespace Violation {
    export type AsObject = {
        fieldPath: string,
        constraintId: string,
        message: string,
        forKey: boolean,
    }
}
