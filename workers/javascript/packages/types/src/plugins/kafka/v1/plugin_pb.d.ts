import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message as Message$1, proto3, Value } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
/**
 * @generated from enum plugins.kafka.v1.Operation
 */
export declare enum Operation {
    /**
     * @generated from enum value: OPERATION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: OPERATION_CONSUME = 1;
     */
    CONSUME = 1,
    /**
     * @generated from enum value: OPERATION_PRODUCE = 2;
     */
    PRODUCE = 2
}
/**
 * @generated from enum plugins.kafka.v1.Compression
 */
export declare enum Compression {
    /**
     * @generated from enum value: COMPRESSION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: COMPRESSION_GZIP = 1;
     */
    GZIP = 1,
    /**
     * @generated from enum value: COMPRESSION_SNAPPY = 2;
     */
    SNAPPY = 2,
    /**
     * @generated from enum value: COMPRESSION_LZ4 = 3;
     */
    LZ4 = 3,
    /**
     * @generated from enum value: COMPRESSION_ZSTD = 4;
     */
    ZSTD = 4
}
/**
 * @generated from enum plugins.kafka.v1.Acks
 */
export declare enum Acks {
    /**
     * @generated from enum value: ACKS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: ACKS_NONE = 1;
     */
    NONE = 1,
    /**
     * @generated from enum value: ACKS_LEADER = 2;
     */
    LEADER = 2,
    /**
     * @generated from enum value: ACKS_ALL = 3;
     */
    ALL = 3
}
/**
 * @generated from message plugins.kafka.v1.Metadata
 */
export declare class Metadata extends Message$1<Metadata> {
    /**
     * @generated from field: repeated plugins.kafka.v1.Topic topics = 1;
     */
    topics: Topic[];
    /**
     * @generated from field: repeated plugins.kafka.v1.Broker brokers = 2;
     */
    brokers: Broker[];
    constructor(data?: PartialMessage<Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata;
    static equals(a: Metadata | PlainMessage<Metadata> | undefined, b: Metadata | PlainMessage<Metadata> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Metadata.Minified
 */
export declare class Metadata_Minified extends Message$1<Metadata_Minified> {
    /**
     * @generated from field: repeated string topics = 1;
     */
    topics: string[];
    constructor(data?: PartialMessage<Metadata_Minified>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Metadata.Minified";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata_Minified;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata_Minified;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata_Minified;
    static equals(a: Metadata_Minified | PlainMessage<Metadata_Minified> | undefined, b: Metadata_Minified | PlainMessage<Metadata_Minified> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Broker
 */
export declare class Broker extends Message$1<Broker> {
    /**
     * @generated from field: int32 node_id = 1;
     */
    nodeId: number;
    /**
     * @generated from field: string address = 2;
     */
    address: string;
    constructor(data?: PartialMessage<Broker>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Broker";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Broker;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Broker;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Broker;
    static equals(a: Broker | PlainMessage<Broker> | undefined, b: Broker | PlainMessage<Broker> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Topic
 */
export declare class Topic extends Message$1<Topic> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    constructor(data?: PartialMessage<Topic>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Topic";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Topic;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Topic;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Topic;
    static equals(a: Topic | PlainMessage<Topic> | undefined, b: Topic | PlainMessage<Topic> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Messages
 */
export declare class Messages extends Message$1<Messages> {
    /**
     * @generated from field: repeated plugins.kafka.v1.Message messages = 1;
     */
    messages: Message[];
    constructor(data?: PartialMessage<Messages>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Messages";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Messages;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Messages;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Messages;
    static equals(a: Messages | PlainMessage<Messages> | undefined, b: Messages | PlainMessage<Messages> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Message
 */
export declare class Message extends Message$1<Message> {
    /**
     * @generated from field: string topic = 1;
     */
    topic: string;
    /**
     * @generated from field: int32 partition = 2;
     */
    partition: number;
    /**
     * @generated from field: int32 offset = 4;
     */
    offset: number;
    /**
     * NOTE(frank): Need to use google.protobuf.Timestamp here but our json schema library doesn't support bigint.
     * Because of this, we can't use the google.protobuf.Timestamp type OR int64..... Since int32 isn't big enough
     * we have to use a string... // rant over.
     *
     * @generated from field: optional string timestamp = 3;
     */
    timestamp?: string;
    /**
     * @generated from field: optional google.protobuf.Value key = 5;
     */
    key?: Value;
    /**
     * @generated from field: optional google.protobuf.Value value = 6;
     */
    value?: Value;
    /**
     * NOTE(frank): We could use int64 but some Kafka clients (notably the one we're using) only supports int32.
     *
     * @generated from field: int32 length = 7;
     */
    length: number;
    /**
     * NOTE(frank): Protobuf doesn't have an int8 type.
     *
     * @generated from field: int32 attributes = 8;
     */
    attributes: number;
    /**
     * @generated from field: map<string, string> headers = 9;
     */
    headers: {
        [key: string]: string;
    };
    constructor(data?: PartialMessage<Message>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Message";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Message;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Message;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Message;
    static equals(a: Message | PlainMessage<Message> | undefined, b: Message | PlainMessage<Message> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.SASL
 */
export declare class SASL extends Message$1<SASL> {
    /**
     * @generated from field: plugins.kafka.v1.SASL.Mechanism mechanism = 1;
     */
    mechanism: SASL_Mechanism;
    /**
     * non-aws fields
     *
     * @generated from field: optional string username = 2;
     */
    username?: string;
    /**
     * @generated from field: optional string password = 3;
     */
    password?: string;
    /**
     * aws fields
     *
     * @generated from field: optional string access_key_id = 4;
     */
    accessKeyId?: string;
    /**
     * @generated from field: optional string secret_key = 5;
     */
    secretKey?: string;
    /**
     * @generated from field: optional string session_token = 6;
     */
    sessionToken?: string;
    /**
     * @generated from field: optional string authorization_identity = 7;
     */
    authorizationIdentity?: string;
    constructor(data?: PartialMessage<SASL>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.SASL";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SASL;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SASL;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SASL;
    static equals(a: SASL | PlainMessage<SASL> | undefined, b: SASL | PlainMessage<SASL> | undefined): boolean;
}
/**
 * @generated from enum plugins.kafka.v1.SASL.Mechanism
 */
export declare enum SASL_Mechanism {
    /**
     * @generated from enum value: MECHANISM_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: MECHANISM_PLAIN = 1;
     */
    PLAIN = 1,
    /**
     * @generated from enum value: MECHANISM_SCRAM_SHA256 = 2;
     */
    SCRAM_SHA256 = 2,
    /**
     * @generated from enum value: MECHANISM_SCRAM_SHA512 = 3;
     */
    SCRAM_SHA512 = 3,
    /**
     * @generated from enum value: MECHANISM_AWS = 4;
     */
    AWS = 4
}
/**
 * @generated from message plugins.kafka.v1.Cluster
 */
export declare class Cluster extends Message$1<Cluster> {
    /**
     * NOTE(frank): Due to limitations in our plugin template system, we can't use an array.....
     *
     * @generated from field: string brokers = 1;
     */
    brokers: string;
    /**
     * @generated from field: bool ssl = 2;
     */
    ssl: boolean;
    /**
     * @generated from field: plugins.kafka.v1.SASL sasl = 3;
     */
    sasl?: SASL;
    constructor(data?: PartialMessage<Cluster>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Cluster";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Cluster;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Cluster;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Cluster;
    static equals(a: Cluster | PlainMessage<Cluster> | undefined, b: Cluster | PlainMessage<Cluster> | undefined): boolean;
}
/**
 * NOTE(frank): Since it's Kafka, there's a zillion options. We'll start with the basics for now.
 *
 * @generated from message plugins.kafka.v1.Plugin
 */
export declare class Plugin extends Message$1<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: plugins.kafka.v1.Operation operation = 2;
     */
    operation: Operation;
    /**
     * @generated from field: plugins.kafka.v1.Plugin.Produce produce = 3;
     */
    produce?: Plugin_Produce;
    /**
     * @generated from field: plugins.kafka.v1.Plugin.Consume consume = 4;
     */
    consume?: Plugin_Consume;
    /**
     * @generated from field: plugins.kafka.v1.Cluster cluster = 5;
     */
    cluster?: Cluster;
    /**
     * DEPRECATED
     *
     * @generated from field: plugins.kafka.v1.SuperblocksMetadata superblocksMetadata = 6;
     */
    superblocksMetadata?: SuperblocksMetadata;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 7;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Plugin.Consume
 */
export declare class Plugin_Consume extends Message$1<Plugin_Consume> {
    /**
     * @generated from field: plugins.kafka.v1.Plugin.Consume.From from = 1;
     */
    from: Plugin_Consume_From;
    /**
     * NOTE(frank): SMH. Because our form template system if VERY limited,
     * there no way to send an array to the backend if we take in one topic in the UI.
     *
     * @generated from field: string topic = 2;
     */
    topic: string;
    /**
     * @generated from field: optional string group_id = 3;
     */
    groupId?: string;
    /**
     * @generated from field: optional string client_id = 4;
     */
    clientId?: string;
    /**
     * NOTE(frank): Another instance of template system limitations...
     *
     * @generated from field: plugins.kafka.v1.Plugin.Consume.Seek seek = 5;
     */
    seek?: Plugin_Consume_Seek;
    /**
     * @generated from field: bool read_uncommitted = 6;
     */
    readUncommitted: boolean;
    constructor(data?: PartialMessage<Plugin_Consume>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Plugin.Consume";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Consume;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Consume;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Consume;
    static equals(a: Plugin_Consume | PlainMessage<Plugin_Consume> | undefined, b: Plugin_Consume | PlainMessage<Plugin_Consume> | undefined): boolean;
}
/**
 * @generated from enum plugins.kafka.v1.Plugin.Consume.From
 */
export declare enum Plugin_Consume_From {
    /**
     * @generated from enum value: FROM_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: FROM_BEGINNING = 1;
     */
    BEGINNING = 1,
    /**
     * @generated from enum value: FROM_LATEST = 2;
     */
    LATEST = 2,
    /**
     * @generated from enum value: FROM_SEEK = 3;
     */
    SEEK = 3
}
/**
 * @generated from message plugins.kafka.v1.Plugin.Consume.Seek
 */
export declare class Plugin_Consume_Seek extends Message$1<Plugin_Consume_Seek> {
    /**
     * @generated from field: string topic = 1;
     */
    topic: string;
    /**
     * @generated from field: int32 offset = 2;
     */
    offset: number;
    /**
     * @generated from field: int32 partition = 3;
     */
    partition: number;
    constructor(data?: PartialMessage<Plugin_Consume_Seek>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Plugin.Consume.Seek";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Consume_Seek;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Consume_Seek;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Consume_Seek;
    static equals(a: Plugin_Consume_Seek | PlainMessage<Plugin_Consume_Seek> | undefined, b: Plugin_Consume_Seek | PlainMessage<Plugin_Consume_Seek> | undefined): boolean;
}
/**
 * @generated from message plugins.kafka.v1.Plugin.Produce
 */
export declare class Plugin_Produce extends Message$1<Plugin_Produce> {
    /**
     * @generated from field: plugins.kafka.v1.Acks acks = 1;
     */
    acks: Acks;
    /**
     * @generated from field: optional string client_id = 2;
     */
    clientId?: string;
    /**
     * @generated from field: optional int32 timeout = 3;
     */
    timeout?: number;
    /**
     * @generated from field: optional plugins.kafka.v1.Compression compression = 4;
     */
    compression?: Compression;
    /**
     * @generated from field: optional string transaction_id = 5;
     */
    transactionId?: string;
    /**
     * @generated from field: bool auto_create_topic = 6;
     */
    autoCreateTopic: boolean;
    /**
     * @generated from field: bool idempotent = 7;
     */
    idempotent: boolean;
    /**
     * @generated from field: bool transaction = 8;
     */
    transaction: boolean;
    /**
     * @generated from field: string messages = 9;
     */
    messages: string;
    constructor(data?: PartialMessage<Plugin_Produce>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.Plugin.Produce";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Produce;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Produce;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Produce;
    static equals(a: Plugin_Produce | PlainMessage<Plugin_Produce> | undefined, b: Plugin_Produce | PlainMessage<Plugin_Produce> | undefined): boolean;
}
/**
 * DEPRECATED
 *
 * @generated from message plugins.kafka.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message$1<SuperblocksMetadata> {
    /**
     * @generated from field: optional string plugin_version = 1;
     */
    pluginVersion?: string;
    /**
     * @generated from field: optional string synced_from_profile_id = 2;
     */
    syncedFromProfileId?: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.kafka.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
