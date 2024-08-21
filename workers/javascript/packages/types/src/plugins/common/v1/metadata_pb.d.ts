import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * SQLMetadata represents metadata for any SQL based plugin.
 *
 * @generated from message plugins.common.v1.SQLMetadata
 */
export declare class SQLMetadata extends Message<SQLMetadata> {
    constructor(data?: PartialMessage<SQLMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLMetadata;
    static equals(a: SQLMetadata | PlainMessage<SQLMetadata> | undefined, b: SQLMetadata | PlainMessage<SQLMetadata> | undefined): boolean;
}
/**
 * This is nested so we can intuitively access it (i.e. plugins.common.v1.SQLMetadata.Minified).
 *
 * @generated from message plugins.common.v1.SQLMetadata.Minified
 */
export declare class SQLMetadata_Minified extends Message<SQLMetadata_Minified> {
    /**
     * If applicable, place the schema name here as well (i.e. my_schema.table_name).
     *
     * @generated from field: map<string, plugins.common.v1.SQLMetadata.Minified.Table> tables = 1;
     */
    tables: {
        [key: string]: SQLMetadata_Minified_Table;
    };
    constructor(data?: PartialMessage<SQLMetadata_Minified>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLMetadata.Minified";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLMetadata_Minified;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLMetadata_Minified;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLMetadata_Minified;
    static equals(a: SQLMetadata_Minified | PlainMessage<SQLMetadata_Minified> | undefined, b: SQLMetadata_Minified | PlainMessage<SQLMetadata_Minified> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.SQLMetadata.Minified.Table
 */
export declare class SQLMetadata_Minified_Table extends Message<SQLMetadata_Minified_Table> {
    /**
     * <column_name>:<column_type>
     *
     * @generated from field: map<string, string> columns = 1;
     */
    columns: {
        [key: string]: string;
    };
    constructor(data?: PartialMessage<SQLMetadata_Minified_Table>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLMetadata.Minified.Table";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLMetadata_Minified_Table;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLMetadata_Minified_Table;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLMetadata_Minified_Table;
    static equals(a: SQLMetadata_Minified_Table | PlainMessage<SQLMetadata_Minified_Table> | undefined, b: SQLMetadata_Minified_Table | PlainMessage<SQLMetadata_Minified_Table> | undefined): boolean;
}
/**
 * BucketsMetadata represents metadata for any Bucket based plugin.
 *
 * @generated from message plugins.common.v1.BucketsMetadata
 */
export declare class BucketsMetadata extends Message<BucketsMetadata> {
    constructor(data?: PartialMessage<BucketsMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.BucketsMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BucketsMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BucketsMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BucketsMetadata;
    static equals(a: BucketsMetadata | PlainMessage<BucketsMetadata> | undefined, b: BucketsMetadata | PlainMessage<BucketsMetadata> | undefined): boolean;
}
/**
 * This is nested so we can intuitively access it (i.e. plugins.common.v1.BucketsMetadata.Minified).
 *
 * @generated from message plugins.common.v1.BucketsMetadata.Minified
 */
export declare class BucketsMetadata_Minified extends Message<BucketsMetadata_Minified> {
    /**
     * @generated from field: repeated string names = 1;
     */
    names: string[];
    constructor(data?: PartialMessage<BucketsMetadata_Minified>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.BucketsMetadata.Minified";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BucketsMetadata_Minified;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BucketsMetadata_Minified;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BucketsMetadata_Minified;
    static equals(a: BucketsMetadata_Minified | PlainMessage<BucketsMetadata_Minified> | undefined, b: BucketsMetadata_Minified | PlainMessage<BucketsMetadata_Minified> | undefined): boolean;
}
