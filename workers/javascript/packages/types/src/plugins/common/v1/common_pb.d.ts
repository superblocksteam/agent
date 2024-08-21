import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * SQLActionConfiguration represents the action configuration for any SQL based plugin.
 *
 * @generated from message plugins.common.v1.SQLActionConfiguration
 */
export declare class SQLActionConfiguration extends Message<SQLActionConfiguration> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: bool usePreparedSql = 2;
     */
    usePreparedSql: boolean;
    constructor(data?: PartialMessage<SQLActionConfiguration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.SQLActionConfiguration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SQLActionConfiguration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SQLActionConfiguration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SQLActionConfiguration;
    static equals(a: SQLActionConfiguration | PlainMessage<SQLActionConfiguration> | undefined, b: SQLActionConfiguration | PlainMessage<SQLActionConfiguration> | undefined): boolean;
}
