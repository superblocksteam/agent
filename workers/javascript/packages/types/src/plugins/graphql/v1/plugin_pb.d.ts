import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Property, SuperblocksMetadata } from "../../../common/v1/plugin_pb";
/**
 * @generated from message plugins.graphql.v1.Custom
 */
export declare class Custom extends Message<Custom> {
    /**
     * @generated from field: common.v1.Property variables = 1;
     */
    variables?: Property;
    /**
     * @generated from field: common.v1.Property requestFormat = 2;
     */
    requestFormat?: Property;
    constructor(data?: PartialMessage<Custom>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.graphql.v1.Custom";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Custom;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Custom;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Custom;
    static equals(a: Custom | PlainMessage<Custom> | undefined, b: Custom | PlainMessage<Custom> | undefined): boolean;
}
/**
 * @generated from message plugins.graphql.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string path = 1;
     */
    path: string;
    /**
     * @generated from field: repeated common.v1.Property headers = 2;
     */
    headers: Property[];
    /**
     * @generated from field: string body = 3;
     */
    body: string;
    /**
     * @generated from field: optional plugins.graphql.v1.Custom custom = 4;
     */
    custom?: Custom;
    /**
     * @generated from field: common.v1.SuperblocksMetadata superblocksMetadata = 5;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.graphql.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
