import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message common.v1.Links
 */
export declare class Links extends Message<Links> {
    /**
     * @generated from field: map<string, common.v1.Link> links = 1;
     */
    links: {
        [key: string]: Link;
    };
    constructor(data?: PartialMessage<Links>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Links";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Links;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Links;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Links;
    static equals(a: Links | PlainMessage<Links> | undefined, b: Links | PlainMessage<Links> | undefined): boolean;
}
/**
 * @generated from message common.v1.Link
 */
export declare class Link extends Message<Link> {
    /**
     * @generated from field: string url = 1;
     */
    url: string;
    constructor(data?: PartialMessage<Link>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Link";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Link;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Link;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Link;
    static equals(a: Link | PlainMessage<Link> | undefined, b: Link | PlainMessage<Link> | undefined): boolean;
}
