import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Property, SuperblocksMetadata } from "../../../common/v1/plugin_pb";
/**
 * @generated from message plugins.workflow.v1.Tuple
 */
export declare class Tuple extends Message<Tuple> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string value = 2;
     */
    value: string;
    constructor(data?: PartialMessage<Tuple>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.workflow.v1.Tuple";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Tuple;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Tuple;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Tuple;
    static equals(a: Tuple | PlainMessage<Tuple> | undefined, b: Tuple | PlainMessage<Tuple> | undefined): boolean;
}
/**
 * @generated from message plugins.workflow.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string workflow = 1;
     */
    workflow: string;
    /**
     * @generated from field: map<string, common.v1.Property> custom = 2;
     */
    custom: {
        [key: string]: Property;
    };
    /**
     * @generated from field: map<string, common.v1.Property> queryParams = 3;
     */
    queryParams: {
        [key: string]: Property;
    };
    /**
     * @generated from field: common.v1.SuperblocksMetadata superblocksMetadata = 12;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.workflow.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
