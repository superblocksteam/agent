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
    getConnection(): Plugin.KinesisConnection | undefined;
    setConnection(value?: Plugin.KinesisConnection): Plugin;
    getOperationType(): Plugin.OperationType;
    setOperationType(value: Plugin.OperationType): Plugin;

    hasPut(): boolean;
    clearPut(): void;
    getPut(): Plugin.KinesisPut | undefined;
    setPut(value?: Plugin.KinesisPut): Plugin;

    hasGet(): boolean;
    clearGet(): void;
    getGet(): Plugin.KinesisGet | undefined;
    setGet(value?: Plugin.KinesisGet): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

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
        connection?: Plugin.KinesisConnection.AsObject,
        operationType: Plugin.OperationType,
        put?: Plugin.KinesisPut.AsObject,
        get?: Plugin.KinesisGet.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class KinesisConnection extends jspb.Message { 

        hasAwsConfig(): boolean;
        clearAwsConfig(): void;
        getAwsConfig(): plugins_common_v1_plugin_pb.AWSConfig | undefined;
        setAwsConfig(value?: plugins_common_v1_plugin_pb.AWSConfig): KinesisConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): KinesisConnection.AsObject;
        static toObject(includeInstance: boolean, msg: KinesisConnection): KinesisConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: KinesisConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): KinesisConnection;
        static deserializeBinaryFromReader(message: KinesisConnection, reader: jspb.BinaryReader): KinesisConnection;
    }

    export namespace KinesisConnection {
        export type AsObject = {
            awsConfig?: plugins_common_v1_plugin_pb.AWSConfig.AsObject,
        }
    }

    export class KinesisPut extends jspb.Message { 
        getData(): string;
        setData(value: string): KinesisPut;
        getPartitionKey(): string;
        setPartitionKey(value: string): KinesisPut;
        getStreamIdentifierType(): Plugin.StreamIdentifier;
        setStreamIdentifierType(value: Plugin.StreamIdentifier): KinesisPut;

        hasStreamName(): boolean;
        clearStreamName(): void;
        getStreamName(): string | undefined;
        setStreamName(value: string): KinesisPut;

        hasStreamArn(): boolean;
        clearStreamArn(): void;
        getStreamArn(): string | undefined;
        setStreamArn(value: string): KinesisPut;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): KinesisPut.AsObject;
        static toObject(includeInstance: boolean, msg: KinesisPut): KinesisPut.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: KinesisPut, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): KinesisPut;
        static deserializeBinaryFromReader(message: KinesisPut, reader: jspb.BinaryReader): KinesisPut;
    }

    export namespace KinesisPut {
        export type AsObject = {
            data: string,
            partitionKey: string,
            streamIdentifierType: Plugin.StreamIdentifier,
            streamName?: string,
            streamArn?: string,
        }
    }

    export class KinesisGet extends jspb.Message { 
        getShardId(): string;
        setShardId(value: string): KinesisGet;
        getShardIteratorType(): Plugin.ShardIteratorType;
        setShardIteratorType(value: Plugin.ShardIteratorType): KinesisGet;
        getLimit(): number;
        setLimit(value: number): KinesisGet;
        getPollingCooldownMs(): number;
        setPollingCooldownMs(value: number): KinesisGet;

        hasStartingSequenceNumber(): boolean;
        clearStartingSequenceNumber(): void;
        getStartingSequenceNumber(): string | undefined;
        setStartingSequenceNumber(value: string): KinesisGet;

        hasTimestamp(): boolean;
        clearTimestamp(): void;
        getTimestamp(): string | undefined;
        setTimestamp(value: string): KinesisGet;
        getStreamIdentifierType(): Plugin.StreamIdentifier;
        setStreamIdentifierType(value: Plugin.StreamIdentifier): KinesisGet;

        hasStreamName(): boolean;
        clearStreamName(): void;
        getStreamName(): string | undefined;
        setStreamName(value: string): KinesisGet;

        hasStreamArn(): boolean;
        clearStreamArn(): void;
        getStreamArn(): string | undefined;
        setStreamArn(value: string): KinesisGet;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): KinesisGet.AsObject;
        static toObject(includeInstance: boolean, msg: KinesisGet): KinesisGet.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: KinesisGet, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): KinesisGet;
        static deserializeBinaryFromReader(message: KinesisGet, reader: jspb.BinaryReader): KinesisGet;
    }

    export namespace KinesisGet {
        export type AsObject = {
            shardId: string,
            shardIteratorType: Plugin.ShardIteratorType,
            limit: number,
            pollingCooldownMs: number,
            startingSequenceNumber?: string,
            timestamp?: string,
            streamIdentifierType: Plugin.StreamIdentifier,
            streamName?: string,
            streamArn?: string,
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

    export enum OperationType {
    OPERATION_TYPE_UNSPECIFIED = 0,
    OPERATION_TYPE_GET = 1,
    OPERATION_TYPE_PUT = 2,
    }

    export enum StreamIdentifier {
    STREAM_IDENTIFIER_UNSPECIFIED = 0,
    STREAM_IDENTIFIER_STREAM_NAME = 1,
    STREAM_IDENTIFIER_STREAM_ARN = 2,
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
