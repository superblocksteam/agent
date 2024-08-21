import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
/**
 * @generated from message ai.v1.Vector
 */
export declare class Vector extends Message<Vector> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: repeated float values = 2;
     */
    values: number[];
    /**
     * @generated from field: google.protobuf.Struct metadata = 3;
     */
    metadata?: Struct;
    /**
     * @generated from field: optional float score = 4;
     */
    score?: number;
    constructor(data?: PartialMessage<Vector>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Vector";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Vector;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Vector;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Vector;
    static equals(a: Vector | PlainMessage<Vector> | undefined, b: Vector | PlainMessage<Vector> | undefined): boolean;
}
