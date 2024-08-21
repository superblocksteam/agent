import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.ocr.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string action = 1;
     */
    action: string;
    /**
     * @generated from field: string file = 2;
     */
    file: string;
    /**
     * @generated from field: string fileUrl = 3;
     */
    fileUrl: string;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.ocr.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
