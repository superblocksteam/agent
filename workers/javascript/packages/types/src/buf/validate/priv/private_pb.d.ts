import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * Do not use. Internal to protovalidate library
 *
 * @generated from message buf.validate.priv.FieldConstraints
 */
export declare class FieldConstraints extends Message<FieldConstraints> {
    /**
     * @generated from field: repeated buf.validate.priv.Constraint cel = 1;
     */
    cel: Constraint[];
    constructor(data?: PartialMessage<FieldConstraints>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.priv.FieldConstraints";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FieldConstraints;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FieldConstraints;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FieldConstraints;
    static equals(a: FieldConstraints | PlainMessage<FieldConstraints> | undefined, b: FieldConstraints | PlainMessage<FieldConstraints> | undefined): boolean;
}
/**
 * Do not use. Internal to protovalidate library
 *
 * @generated from message buf.validate.priv.Constraint
 */
export declare class Constraint extends Message<Constraint> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * @generated from field: string expression = 3;
     */
    expression: string;
    constructor(data?: PartialMessage<Constraint>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.priv.Constraint";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Constraint;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Constraint;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Constraint;
    static equals(a: Constraint | PlainMessage<Constraint> | undefined, b: Constraint | PlainMessage<Constraint> | undefined): boolean;
}
