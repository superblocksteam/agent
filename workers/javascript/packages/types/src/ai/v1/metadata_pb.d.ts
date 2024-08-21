import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { SQLMetadata_Minified } from "../../plugins/common/v1/metadata_pb";
import { Metadata_Minified } from "../../plugins/kafka/v1/plugin_pb";
/**
 * This represents the metadata that the "AI stack" cares about. It is
 * not guaranteed to be the same as the metadata for the "plugin stack".
 * This is more than likely a minified representation of it.
 *
 * @generated from message ai.v1.Metadata
 */
export declare class Metadata extends Message<Metadata> {
    /**
     * @generated from oneof ai.v1.Metadata.config
     */
    config: {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified mariadb = 1;
         */
        value: SQLMetadata_Minified;
        case: "mariadb";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified mssql = 2;
         */
        value: SQLMetadata_Minified;
        case: "mssql";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified mysql = 3;
         */
        value: SQLMetadata_Minified;
        case: "mysql";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified postgres = 4;
         */
        value: SQLMetadata_Minified;
        case: "postgres";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified rockset = 5;
         */
        value: SQLMetadata_Minified;
        case: "rockset";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified snowflake = 6;
         */
        value: SQLMetadata_Minified;
        case: "snowflake";
    } | {
        /**
         * @generated from field: plugins.common.v1.SQLMetadata.Minified cockroachdb = 7;
         */
        value: SQLMetadata_Minified;
        case: "cockroachdb";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata.Minified kafka = 8;
         */
        value: Metadata_Minified;
        case: "kafka";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata.Minified confluent = 9;
         */
        value: Metadata_Minified;
        case: "confluent";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata.Minified msk = 10;
         */
        value: Metadata_Minified;
        case: "msk";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata.Minified redpanda = 11;
         */
        value: Metadata_Minified;
        case: "redpanda";
    } | {
        /**
         * @generated from field: plugins.kafka.v1.Metadata.Minified aivenkafka = 12;
         */
        value: Metadata_Minified;
        case: "aivenkafka";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata;
    static equals(a: Metadata | PlainMessage<Metadata> | undefined, b: Metadata | PlainMessage<Metadata> | undefined): boolean;
}
