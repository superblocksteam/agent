import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message utils.v1.Signature
 */
export declare class Signature extends Message<Signature> {
    /**
     * @generated from field: string key_id = 1;
     */
    keyId: string;
    /**
     * @generated from field: bytes data = 2;
     */
    data: Uint8Array;
    constructor(data?: PartialMessage<Signature>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "utils.v1.Signature";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Signature;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Signature;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Signature;
    static equals(a: Signature | PlainMessage<Signature> | undefined, b: Signature | PlainMessage<Signature> | undefined): boolean;
}
