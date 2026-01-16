// package: plugins.kafka.v1
// file: plugins/kafka/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../../buf/validate/validate_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";
import * as validate_validate_pb from "../../../validate/validate_pb";

export class Metadata extends jspb.Message { 
    clearTopicsList(): void;
    getTopicsList(): Array<Topic>;
    setTopicsList(value: Array<Topic>): Metadata;
    addTopics(value?: Topic, index?: number): Topic;
    clearBrokersList(): void;
    getBrokersList(): Array<Broker>;
    setBrokersList(value: Array<Broker>): Metadata;
    addBrokers(value?: Broker, index?: number): Broker;

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
        topicsList: Array<Topic.AsObject>,
        brokersList: Array<Broker.AsObject>,
    }


    export class Minified extends jspb.Message { 
        clearTopicsList(): void;
        getTopicsList(): Array<string>;
        setTopicsList(value: Array<string>): Minified;
        addTopics(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Minified.AsObject;
        static toObject(includeInstance: boolean, msg: Minified): Minified.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Minified, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Minified;
        static deserializeBinaryFromReader(message: Minified, reader: jspb.BinaryReader): Minified;
    }

    export namespace Minified {
        export type AsObject = {
            topicsList: Array<string>,
        }
    }

}

export class Broker extends jspb.Message { 
    getNodeId(): number;
    setNodeId(value: number): Broker;
    getAddress(): string;
    setAddress(value: string): Broker;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Broker.AsObject;
    static toObject(includeInstance: boolean, msg: Broker): Broker.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Broker, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Broker;
    static deserializeBinaryFromReader(message: Broker, reader: jspb.BinaryReader): Broker;
}

export namespace Broker {
    export type AsObject = {
        nodeId: number,
        address: string,
    }
}

export class Topic extends jspb.Message { 
    getName(): string;
    setName(value: string): Topic;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Topic.AsObject;
    static toObject(includeInstance: boolean, msg: Topic): Topic.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Topic, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Topic;
    static deserializeBinaryFromReader(message: Topic, reader: jspb.BinaryReader): Topic;
}

export namespace Topic {
    export type AsObject = {
        name: string,
    }
}

export class Messages extends jspb.Message { 
    clearMessagesList(): void;
    getMessagesList(): Array<Message>;
    setMessagesList(value: Array<Message>): Messages;
    addMessages(value?: Message, index?: number): Message;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Messages.AsObject;
    static toObject(includeInstance: boolean, msg: Messages): Messages.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Messages, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Messages;
    static deserializeBinaryFromReader(message: Messages, reader: jspb.BinaryReader): Messages;
}

export namespace Messages {
    export type AsObject = {
        messagesList: Array<Message.AsObject>,
    }
}

export class Message extends jspb.Message { 
    getTopic(): string;
    setTopic(value: string): Message;
    getPartition(): number;
    setPartition(value: number): Message;
    getOffset(): number;
    setOffset(value: number): Message;

    hasTimestamp(): boolean;
    clearTimestamp(): void;
    getTimestamp(): string | undefined;
    setTimestamp(value: string): Message;

    hasKey(): boolean;
    clearKey(): void;
    getKey(): google_protobuf_struct_pb.Value | undefined;
    setKey(value?: google_protobuf_struct_pb.Value): Message;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): google_protobuf_struct_pb.Value | undefined;
    setValue(value?: google_protobuf_struct_pb.Value): Message;
    getLength(): number;
    setLength(value: number): Message;
    getAttributes(): number;
    setAttributes(value: number): Message;

    getHeadersMap(): jspb.Map<string, string>;
    clearHeadersMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Message.AsObject;
    static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Message;
    static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
    export type AsObject = {
        topic: string,
        partition: number,
        offset: number,
        timestamp?: string,
        key?: google_protobuf_struct_pb.Value.AsObject,
        value?: google_protobuf_struct_pb.Value.AsObject,
        length: number,
        attributes: number,

        headersMap: Array<[string, string]>,
    }
}

export class SASL extends jspb.Message { 
    getMechanism(): SASL.Mechanism;
    setMechanism(value: SASL.Mechanism): SASL;

    hasUsername(): boolean;
    clearUsername(): void;
    getUsername(): string | undefined;
    setUsername(value: string): SASL;

    hasPassword(): boolean;
    clearPassword(): void;
    getPassword(): string | undefined;
    setPassword(value: string): SASL;

    hasAccessKeyId(): boolean;
    clearAccessKeyId(): void;
    getAccessKeyId(): string | undefined;
    setAccessKeyId(value: string): SASL;

    hasSecretKey(): boolean;
    clearSecretKey(): void;
    getSecretKey(): string | undefined;
    setSecretKey(value: string): SASL;

    hasSessionToken(): boolean;
    clearSessionToken(): void;
    getSessionToken(): string | undefined;
    setSessionToken(value: string): SASL;

    hasAuthorizationIdentity(): boolean;
    clearAuthorizationIdentity(): void;
    getAuthorizationIdentity(): string | undefined;
    setAuthorizationIdentity(value: string): SASL;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SASL.AsObject;
    static toObject(includeInstance: boolean, msg: SASL): SASL.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SASL, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SASL;
    static deserializeBinaryFromReader(message: SASL, reader: jspb.BinaryReader): SASL;
}

export namespace SASL {
    export type AsObject = {
        mechanism: SASL.Mechanism,
        username?: string,
        password?: string,
        accessKeyId?: string,
        secretKey?: string,
        sessionToken?: string,
        authorizationIdentity?: string,
    }

    export enum Mechanism {
    MECHANISM_UNSPECIFIED = 0,
    MECHANISM_PLAIN = 1,
    MECHANISM_SCRAM_SHA256 = 2,
    MECHANISM_SCRAM_SHA512 = 3,
    MECHANISM_AWS = 4,
    }

}

export class Cluster extends jspb.Message { 
    getBrokers(): string;
    setBrokers(value: string): Cluster;
    getSsl(): boolean;
    setSsl(value: boolean): Cluster;

    hasSasl(): boolean;
    clearSasl(): void;
    getSasl(): SASL | undefined;
    setSasl(value?: SASL): Cluster;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Cluster.AsObject;
    static toObject(includeInstance: boolean, msg: Cluster): Cluster.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Cluster, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Cluster;
    static deserializeBinaryFromReader(message: Cluster, reader: jspb.BinaryReader): Cluster;
}

export namespace Cluster {
    export type AsObject = {
        brokers: string,
        ssl: boolean,
        sasl?: SASL.AsObject,
    }
}

export class Plugin extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Plugin;
    getOperation(): Operation;
    setOperation(value: Operation): Plugin;

    hasProduce(): boolean;
    clearProduce(): void;
    getProduce(): Plugin.Produce | undefined;
    setProduce(value?: Plugin.Produce): Plugin;

    hasConsume(): boolean;
    clearConsume(): void;
    getConsume(): Plugin.Consume | undefined;
    setConsume(value?: Plugin.Consume): Plugin;

    hasCluster(): boolean;
    clearCluster(): void;
    getCluster(): Cluster | undefined;
    setCluster(value?: Cluster): Plugin;

    hasSuperblocksmetadata(): boolean;
    clearSuperblocksmetadata(): void;
    getSuperblocksmetadata(): SuperblocksMetadata | undefined;
    setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

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
        operation: Operation,
        produce?: Plugin.Produce.AsObject,
        consume?: Plugin.Consume.AsObject,
        cluster?: Cluster.AsObject,
        superblocksmetadata?: SuperblocksMetadata.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class Consume extends jspb.Message { 
        getFrom(): Plugin.Consume.From;
        setFrom(value: Plugin.Consume.From): Consume;
        getTopic(): string;
        setTopic(value: string): Consume;

        hasGroupId(): boolean;
        clearGroupId(): void;
        getGroupId(): string | undefined;
        setGroupId(value: string): Consume;

        hasClientId(): boolean;
        clearClientId(): void;
        getClientId(): string | undefined;
        setClientId(value: string): Consume;

        hasSeek(): boolean;
        clearSeek(): void;
        getSeek(): Plugin.Consume.Seek | undefined;
        setSeek(value?: Plugin.Consume.Seek): Consume;
        getReadUncommitted(): boolean;
        setReadUncommitted(value: boolean): Consume;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Consume.AsObject;
        static toObject(includeInstance: boolean, msg: Consume): Consume.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Consume, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Consume;
        static deserializeBinaryFromReader(message: Consume, reader: jspb.BinaryReader): Consume;
    }

    export namespace Consume {
        export type AsObject = {
            from: Plugin.Consume.From,
            topic: string,
            groupId?: string,
            clientId?: string,
            seek?: Plugin.Consume.Seek.AsObject,
            readUncommitted: boolean,
        }


        export class Seek extends jspb.Message { 
            getTopic(): string;
            setTopic(value: string): Seek;
            getOffset(): number;
            setOffset(value: number): Seek;
            getPartition(): number;
            setPartition(value: number): Seek;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Seek.AsObject;
            static toObject(includeInstance: boolean, msg: Seek): Seek.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Seek, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Seek;
            static deserializeBinaryFromReader(message: Seek, reader: jspb.BinaryReader): Seek;
        }

        export namespace Seek {
            export type AsObject = {
                topic: string,
                offset: number,
                partition: number,
            }
        }


        export enum From {
    FROM_UNSPECIFIED = 0,
    FROM_BEGINNING = 1,
    FROM_LATEST = 2,
    FROM_SEEK = 3,
        }

    }

    export class Produce extends jspb.Message { 
        getAcks(): Acks;
        setAcks(value: Acks): Produce;

        hasClientId(): boolean;
        clearClientId(): void;
        getClientId(): string | undefined;
        setClientId(value: string): Produce;

        hasTimeout(): boolean;
        clearTimeout(): void;
        getTimeout(): number | undefined;
        setTimeout(value: number): Produce;

        hasCompression(): boolean;
        clearCompression(): void;
        getCompression(): Compression | undefined;
        setCompression(value: Compression): Produce;

        hasTransactionId(): boolean;
        clearTransactionId(): void;
        getTransactionId(): string | undefined;
        setTransactionId(value: string): Produce;
        getAutoCreateTopic(): boolean;
        setAutoCreateTopic(value: boolean): Produce;
        getIdempotent(): boolean;
        setIdempotent(value: boolean): Produce;
        getTransaction(): boolean;
        setTransaction(value: boolean): Produce;
        getMessages(): string;
        setMessages(value: string): Produce;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Produce.AsObject;
        static toObject(includeInstance: boolean, msg: Produce): Produce.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Produce, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Produce;
        static deserializeBinaryFromReader(message: Produce, reader: jspb.BinaryReader): Produce;
    }

    export namespace Produce {
        export type AsObject = {
            acks: Acks,
            clientId?: string,
            timeout?: number,
            compression?: Compression,
            transactionId?: string,
            autoCreateTopic: boolean,
            idempotent: boolean,
            transaction: boolean,
            messages: string,
        }
    }

}

export class SuperblocksMetadata extends jspb.Message { 

    hasPluginVersion(): boolean;
    clearPluginVersion(): void;
    getPluginVersion(): string | undefined;
    setPluginVersion(value: string): SuperblocksMetadata;

    hasSyncedFromProfileId(): boolean;
    clearSyncedFromProfileId(): void;
    getSyncedFromProfileId(): string | undefined;
    setSyncedFromProfileId(value: string): SuperblocksMetadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SuperblocksMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: SuperblocksMetadata): SuperblocksMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SuperblocksMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SuperblocksMetadata;
    static deserializeBinaryFromReader(message: SuperblocksMetadata, reader: jspb.BinaryReader): SuperblocksMetadata;
}

export namespace SuperblocksMetadata {
    export type AsObject = {
        pluginVersion?: string,
        syncedFromProfileId?: string,
    }
}

export enum Operation {
    OPERATION_UNSPECIFIED = 0,
    OPERATION_CONSUME = 1,
    OPERATION_PRODUCE = 2,
}

export enum Compression {
    COMPRESSION_UNSPECIFIED = 0,
    COMPRESSION_GZIP = 1,
    COMPRESSION_SNAPPY = 2,
    COMPRESSION_LZ4 = 3,
    COMPRESSION_ZSTD = 4,
}

export enum Acks {
    ACKS_UNSPECIFIED = 0,
    ACKS_NONE = 1,
    ACKS_LEADER = 2,
    ACKS_ALL = 3,
}
