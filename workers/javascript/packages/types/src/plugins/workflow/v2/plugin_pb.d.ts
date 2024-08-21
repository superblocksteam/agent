import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { HttpParameters } from "../../../common/v1/plugin_pb";
/**
 * @generated from message plugins.workflow.v2.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: common.v1.HttpParameters parameters = 2;
     */
    parameters?: HttpParameters;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.workflow.v2.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
