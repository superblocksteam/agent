import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message common.v1.StringList
 */
export declare class StringList extends Message<StringList> {
    /**
     * @generated from field: repeated string items = 1;
     */
    items: string[];
    constructor(data?: PartialMessage<StringList>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.StringList";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StringList;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StringList;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StringList;
    static equals(a: StringList | PlainMessage<StringList> | undefined, b: StringList | PlainMessage<StringList> | undefined): boolean;
}
