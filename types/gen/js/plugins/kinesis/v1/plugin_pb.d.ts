// package: plugins.kinesis.v1
// file: plugins/kinesis/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.Connection | undefined;
    setConnection(value?: Plugin.Connection): Plugin;

    hasPut(): boolean;
    clearPut(): void;
    getPut(): Plugin.Put | undefined;
    setPut(value?: Plugin.Put): Plugin;

    hasGet(): boolean;
    clearGet(): void;
    getGet(): Plugin.Get | undefined;
    setGet(value?: Plugin.Get): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    getOperationCase(): Plugin.OperationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Plugin.AsObject;
    static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Plugin;
    static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
    export type AsObject = {
        name?: string,
        connection?: Plugin.Connection.AsObject,
        put?: Plugin.Put.AsObject,
        get?: Plugin.Get.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class Connection extends jspb.Message { 

        hasAwsConfig(): boolean;
        clearAwsConfig(): void;
        getAwsConfig(): plugins_common_v1_plugin_pb.AWSConfig | undefined;
        setAwsConfig(value?: plugins_common_v1_plugin_pb.AWSConfig): Connection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Connection.AsObject;
        static toObject(includeInstance: boolean, msg: Connection): Connection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Connection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Connection;
        static deserializeBinaryFromReader(message: Connection, reader: jspb.BinaryReader): Connection;
    }

    export namespace Connection {
        export type AsObject = {
            awsConfig?: plugins_common_v1_plugin_pb.AWSConfig.AsObject,
        }
    }

    export class Put extends jspb.Message { 
        getData(): string;
        setData(value: string): Put;
        getPartitionKey(): string;
        setPartitionKey(value: string): Put;

        hasStreamName(): boolean;
        clearStreamName(): void;
        getStreamName(): string;
        setStreamName(value: string): Put;

        hasStreamArn(): boolean;
        clearStreamArn(): void;
        getStreamArn(): string;
        setStreamArn(value: string): Put;

        getStreamIdentifierCase(): Put.StreamIdentifierCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Put.AsObject;
        static toObject(includeInstance: boolean, msg: Put): Put.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Put, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Put;
        static deserializeBinaryFromReader(message: Put, reader: jspb.BinaryReader): Put;
    }

    export namespace Put {
        export type AsObject = {
            data: string,
            partitionKey: string,
            streamName: string,
            streamArn: string,
        }

        export enum StreamIdentifierCase {
            STREAM_IDENTIFIER_NOT_SET = 0,
            STREAM_NAME = 3,
            STREAM_ARN = 4,
        }

    }

    export class Get extends jspb.Message { 
        getShardId(): string;
        setShardId(value: string): Get;
        getShardIteratorType(): Plugin.ShardIteratorType;
        setShardIteratorType(value: Plugin.ShardIteratorType): Get;
        getLimit(): number;
        setLimit(value: number): Get;
        getPollingCooldownMs(): number;
        setPollingCooldownMs(value: number): Get;

        hasStartingSequenceNumber(): boolean;
        clearStartingSequenceNumber(): void;
        getStartingSequenceNumber(): string | undefined;
        setStartingSequenceNumber(value: string): Get;

        hasTimestamp(): boolean;
        clearTimestamp(): void;
        getTimestamp(): string | undefined;
        setTimestamp(value: string): Get;

        hasStreamName(): boolean;
        clearStreamName(): void;
        getStreamName(): string;
        setStreamName(value: string): Get;

        hasStreamArn(): boolean;
        clearStreamArn(): void;
        getStreamArn(): string;
        setStreamArn(value: string): Get;

        getStreamIdentifierCase(): Get.StreamIdentifierCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Get.AsObject;
        static toObject(includeInstance: boolean, msg: Get): Get.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Get, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Get;
        static deserializeBinaryFromReader(message: Get, reader: jspb.BinaryReader): Get;
    }

    export namespace Get {
        export type AsObject = {
            shardId: string,
            shardIteratorType: Plugin.ShardIteratorType,
            limit: number,
            pollingCooldownMs: number,
            startingSequenceNumber?: string,
            timestamp?: string,
            streamName: string,
            streamArn: string,
        }

        export enum StreamIdentifierCase {
            STREAM_IDENTIFIER_NOT_SET = 0,
            STREAM_NAME = 8,
            STREAM_ARN = 9,
        }

    }


    export enum ShardIteratorType {
    SHARD_ITERATOR_TYPE_UNSPECIFIED = 0,
    SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER = 1,
    SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER = 2,
    SHARD_ITERATOR_TYPE_AT_TIMESTAMP = 3,
    SHARD_ITERATOR_TYPE_TRIM_HORIZON = 4,
    SHARD_ITERATOR_TYPE_LATEST = 5,
    }


    export enum OperationCase {
        OPERATION_NOT_SET = 0,
        PUT = 3,
        GET = 4,
    }

}

export class Metadata extends jspb.Message { 
    clearStreamsList(): void;
    getStreamsList(): Array<string>;
    setStreamsList(value: Array<string>): Metadata;
    addStreams(value: string, index?: number): string;

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
        streamsList: Array<string>,
    }
}
