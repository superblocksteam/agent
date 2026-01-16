// package: ai.v1
// file: ai/v1/metadata.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as plugins_common_v1_metadata_pb from "../../plugins/common/v1/metadata_pb";
import * as plugins_kafka_v1_plugin_pb from "../../plugins/kafka/v1/plugin_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Metadata extends jspb.Message { 

    hasMariadb(): boolean;
    clearMariadb(): void;
    getMariadb(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setMariadb(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasMssql(): boolean;
    clearMssql(): void;
    getMssql(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setMssql(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasMysql(): boolean;
    clearMysql(): void;
    getMysql(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setMysql(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasPostgres(): boolean;
    clearPostgres(): void;
    getPostgres(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setPostgres(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasRockset(): boolean;
    clearRockset(): void;
    getRockset(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setRockset(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasSnowflake(): boolean;
    clearSnowflake(): void;
    getSnowflake(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setSnowflake(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasCockroachdb(): boolean;
    clearCockroachdb(): void;
    getCockroachdb(): plugins_common_v1_metadata_pb.SQLMetadata.Minified | undefined;
    setCockroachdb(value?: plugins_common_v1_metadata_pb.SQLMetadata.Minified): Metadata;

    hasKafka(): boolean;
    clearKafka(): void;
    getKafka(): plugins_kafka_v1_plugin_pb.Metadata.Minified | undefined;
    setKafka(value?: plugins_kafka_v1_plugin_pb.Metadata.Minified): Metadata;

    hasConfluent(): boolean;
    clearConfluent(): void;
    getConfluent(): plugins_kafka_v1_plugin_pb.Metadata.Minified | undefined;
    setConfluent(value?: plugins_kafka_v1_plugin_pb.Metadata.Minified): Metadata;

    hasMsk(): boolean;
    clearMsk(): void;
    getMsk(): plugins_kafka_v1_plugin_pb.Metadata.Minified | undefined;
    setMsk(value?: plugins_kafka_v1_plugin_pb.Metadata.Minified): Metadata;

    hasRedpanda(): boolean;
    clearRedpanda(): void;
    getRedpanda(): plugins_kafka_v1_plugin_pb.Metadata.Minified | undefined;
    setRedpanda(value?: plugins_kafka_v1_plugin_pb.Metadata.Minified): Metadata;

    hasAivenkafka(): boolean;
    clearAivenkafka(): void;
    getAivenkafka(): plugins_kafka_v1_plugin_pb.Metadata.Minified | undefined;
    setAivenkafka(value?: plugins_kafka_v1_plugin_pb.Metadata.Minified): Metadata;

    getConfigCase(): Metadata.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Metadata.AsObject;
    static toObject(includeInstance: boolean, msg: Metadata): Metadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Metadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Metadata;
    static deserializeBinaryFromReader(message: Metadata, reader: jspb.BinaryReader): Metadata;
}

export namespace Metadata {
    export type AsObject = {
        mariadb?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        mssql?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        mysql?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        postgres?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        rockset?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        snowflake?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        cockroachdb?: plugins_common_v1_metadata_pb.SQLMetadata.Minified.AsObject,
        kafka?: plugins_kafka_v1_plugin_pb.Metadata.Minified.AsObject,
        confluent?: plugins_kafka_v1_plugin_pb.Metadata.Minified.AsObject,
        msk?: plugins_kafka_v1_plugin_pb.Metadata.Minified.AsObject,
        redpanda?: plugins_kafka_v1_plugin_pb.Metadata.Minified.AsObject,
        aivenkafka?: plugins_kafka_v1_plugin_pb.Metadata.Minified.AsObject,
    }

    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        MARIADB = 1,
        MSSQL = 2,
        MYSQL = 3,
        POSTGRES = 4,
        ROCKSET = 5,
        SNOWFLAKE = 6,
        COCKROACHDB = 7,
        KAFKA = 8,
        CONFLUENT = 9,
        MSK = 10,
        REDPANDA = 11,
        AIVENKAFKA = 12,
    }

}
