import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.common.v1.PluginFieldMeta
 */
export declare class PluginFieldMeta extends Message<PluginFieldMeta> {
    /**
     * @generated from field: bool is_public = 1;
     */
    isPublic: boolean;
    /**
     * @generated from field: bool is_secret = 2;
     */
    isSecret: boolean;
    constructor(data?: PartialMessage<PluginFieldMeta>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.PluginFieldMeta";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PluginFieldMeta;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PluginFieldMeta;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PluginFieldMeta;
    static equals(a: PluginFieldMeta | PlainMessage<PluginFieldMeta> | undefined, b: PluginFieldMeta | PlainMessage<PluginFieldMeta> | undefined): boolean;
}
