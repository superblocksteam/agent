import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message superblocks.v1.Integrations
 */
export declare class Integrations extends Message<Integrations> {
    /**
     * @generated from field: bool registry = 1;
     */
    registry: boolean;
    constructor(data?: PartialMessage<Integrations>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "superblocks.v1.Integrations";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Integrations;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Integrations;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Integrations;
    static equals(a: Integrations | PlainMessage<Integrations> | undefined, b: Integrations | PlainMessage<Integrations> | undefined): boolean;
}
/**
 * @generated from message superblocks.v1.IntegrationOptions
 */
export declare class IntegrationOptions extends Message<IntegrationOptions> {
    /**
     * @generated from field: string pluginType = 2;
     */
    pluginType: string;
    constructor(data?: PartialMessage<IntegrationOptions>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "superblocks.v1.IntegrationOptions";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IntegrationOptions;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IntegrationOptions;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IntegrationOptions;
    static equals(a: IntegrationOptions | PlainMessage<IntegrationOptions> | undefined, b: IntegrationOptions | PlainMessage<IntegrationOptions> | undefined): boolean;
}
