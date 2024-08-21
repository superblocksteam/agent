import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * NOTE(frank): We are running into so many issues using google.protobuf.StringValue
 * between go and javascript.
 *
 * @generated from message worker.v1.StringValue
 */
export declare class StringValue extends Message<StringValue> {
    /**
     * @generated from field: string value = 1;
     */
    value: string;
    constructor(data?: PartialMessage<StringValue>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "worker.v1.StringValue";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StringValue;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StringValue;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StringValue;
    static equals(a: StringValue | PlainMessage<StringValue> | undefined, b: StringValue | PlainMessage<StringValue> | undefined): boolean;
}
