import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.email.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.email.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.email.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string emailFrom = 1;
     */
    emailFrom: string;
    /**
     * @generated from field: string emailTo = 2;
     */
    emailTo: string;
    /**
     * @generated from field: string emailCc = 3;
     */
    emailCc: string;
    /**
     * @generated from field: string emailBcc = 4;
     */
    emailBcc: string;
    /**
     * @generated from field: string emailSubject = 5;
     */
    emailSubject: string;
    /**
     * @generated from field: string emailBody = 6;
     */
    emailBody: string;
    /**
     * @generated from field: string emailAttachments = 7;
     */
    emailAttachments: string;
    /**
     * @generated from field: plugins.email.v1.SuperblocksMetadata superblocksMetadata = 8;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.email.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
