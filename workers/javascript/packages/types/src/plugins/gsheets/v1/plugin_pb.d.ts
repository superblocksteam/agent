import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.gsheets.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gsheets.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.gsheets.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string spreadsheetId = 1;
     */
    spreadsheetId: string;
    /**
     * @generated from field: string sheetTitle = 2;
     */
    sheetTitle: string;
    /**
     * @generated from field: optional string range = 3;
     */
    range?: string;
    /**
     * Super confusing but these are potentially bindings. Or stringified int
     * If this was not a binding, it would be best to keep it int32 here
     *
     * @generated from field: optional string rowNumber = 4;
     */
    rowNumber?: string;
    /**
     * @generated from field: bool extractFirstRowHeader = 5;
     */
    extractFirstRowHeader: boolean;
    /**
     * Same as above comment
     *
     * @generated from field: optional string headerRowNumber = 6;
     */
    headerRowNumber?: string;
    /**
     * @generated from field: optional string format = 7;
     */
    format?: string;
    /**
     * @generated from field: optional string data = 8;
     */
    data?: string;
    /**
     * @generated from field: bool preserveHeaderRow = 9;
     */
    preserveHeaderRow: boolean;
    /**
     * @generated from field: bool includeHeaderRow = 10;
     */
    includeHeaderRow: boolean;
    /**
     * @generated from field: optional string action = 11;
     */
    action?: string;
    /**
     * @generated from field: optional string writeToDestinationType = 12;
     */
    writeToDestinationType?: string;
    /**
     * @generated from field: optional string body = 13;
     */
    body?: string;
    /**
     * @generated from field: plugins.gsheets.v1.SuperblocksMetadata superblocksMetadata = 14;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.gsheets.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
