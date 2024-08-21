import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Any, Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.snowflake.v1.MappedColumns
 */
export declare class MappedColumns extends Message<MappedColumns> {
    /**
     * @generated from field: string json = 1;
     */
    json: string;
    /**
     * @generated from field: string sql = 2;
     */
    sql: string;
    constructor(data?: PartialMessage<MappedColumns>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.snowflake.v1.MappedColumns";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MappedColumns;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MappedColumns;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MappedColumns;
    static equals(a: MappedColumns | PlainMessage<MappedColumns> | undefined, b: MappedColumns | PlainMessage<MappedColumns> | undefined): boolean;
}
/**
 * @generated from message plugins.snowflake.v1.Tuple
 */
export declare class Tuple extends Message<Tuple> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: google.protobuf.Any value = 2;
     */
    value?: Any;
    constructor(data?: PartialMessage<Tuple>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.snowflake.v1.Tuple";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Tuple;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Tuple;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Tuple;
    static equals(a: Tuple | PlainMessage<Tuple> | undefined, b: Tuple | PlainMessage<Tuple> | undefined): boolean;
}
/**
 * @generated from message plugins.snowflake.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.snowflake.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.snowflake.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: bool usePreparedSql = 2;
     */
    usePreparedSql: boolean;
    /**
     * @generated from field: optional string operation = 3;
     */
    operation?: string;
    /**
     * @generated from field: optional string useAdvancedMatching = 4;
     */
    useAdvancedMatching?: string;
    /**
     * @generated from field: optional string table = 5;
     */
    table?: string;
    /**
     * @generated from field: repeated plugins.snowflake.v1.Tuple newValues = 6;
     */
    newValues: Tuple[];
    /**
     * @generated from field: repeated plugins.snowflake.v1.Tuple oldValues = 7;
     */
    oldValues: Tuple[];
    /**
     * @generated from field: repeated string filterBy = 8;
     */
    filterBy: string[];
    /**
     * @generated from field: optional string mappingMode = 9;
     */
    mappingMode?: string;
    /**
     * @generated from field: repeated plugins.snowflake.v1.MappedColumns mappedColumns = 10;
     */
    mappedColumns: MappedColumns[];
    /**
     * @generated from field: plugins.snowflake.v1.SuperblocksMetadata superblocksMetadata = 11;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.snowflake.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
