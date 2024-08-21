import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.redis.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: plugins.redis.v1.Plugin.Connection connection = 2;
     */
    connection?: Plugin_Connection;
    /**
     * @generated from oneof plugins.redis.v1.Plugin.command_type
     */
    commandType: {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Raw raw = 3;
         */
        value: Plugin_Raw;
        case: "raw";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Structured structured = 4;
         */
        value: Plugin_Structured;
        case: "structured";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 5;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Raw
 */
export declare class Plugin_Raw extends Message<Plugin_Raw> {
    /**
     * @generated from oneof plugins.redis.v1.Plugin.Raw.action
     */
    action: {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Raw.Singleton singleton = 1;
         */
        value: Plugin_Raw_Singleton;
        case: "singleton";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_Raw>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Raw";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Raw;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Raw;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Raw;
    static equals(a: Plugin_Raw | PlainMessage<Plugin_Raw> | undefined, b: Plugin_Raw | PlainMessage<Plugin_Raw> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Raw.Singleton
 */
export declare class Plugin_Raw_Singleton extends Message<Plugin_Raw_Singleton> {
    /**
     * @generated from field: string query = 1;
     */
    query: string;
    constructor(data?: PartialMessage<Plugin_Raw_Singleton>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Raw.Singleton";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Raw_Singleton;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Raw_Singleton;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Raw_Singleton;
    static equals(a: Plugin_Raw_Singleton | PlainMessage<Plugin_Raw_Singleton> | undefined, b: Plugin_Raw_Singleton | PlainMessage<Plugin_Raw_Singleton> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Structured
 */
export declare class Plugin_Structured extends Message<Plugin_Structured> {
    /**
     * @generated from oneof plugins.redis.v1.Plugin.Structured.action
     */
    action: {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Get get = 6;
         */
        value: Plugin_Get;
        case: "get";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Set set = 7;
         */
        value: Plugin_Set;
        case: "set";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Del del = 8;
         */
        value: Plugin_Del;
        case: "del";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Keys keys = 9;
         */
        value: Plugin_Keys;
        case: "keys";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Mget mget = 10;
         */
        value: Plugin_Mget;
        case: "mget";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hget hget = 11;
         */
        value: Plugin_Hget;
        case: "hget";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hmget hmget = 12;
         */
        value: Plugin_Hmget;
        case: "hmget";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hgetall hgetall = 13;
         */
        value: Plugin_Hgetall;
        case: "hgetall";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hset hset = 14;
         */
        value: Plugin_Hset;
        case: "hset";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hsetnx hsetnx = 15;
         */
        value: Plugin_Hsetnx;
        case: "hsetnx";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hlen hlen = 16;
         */
        value: Plugin_Hlen;
        case: "hlen";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hdel hdel = 17;
         */
        value: Plugin_Hdel;
        case: "hdel";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hkeys hkeys = 18;
         */
        value: Plugin_Hkeys;
        case: "hkeys";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Hvals hvals = 19;
         */
        value: Plugin_Hvals;
        case: "hvals";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Lindex lindex = 20;
         */
        value: Plugin_Lindex;
        case: "lindex";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Llen llen = 21;
         */
        value: Plugin_Llen;
        case: "llen";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Lpush lpush = 22;
         */
        value: Plugin_Lpush;
        case: "lpush";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Lrem lrem = 23;
         */
        value: Plugin_Lrem;
        case: "lrem";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Lrange lrange = 24;
         */
        value: Plugin_Lrange;
        case: "lrange";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Sadd sadd = 25;
         */
        value: Plugin_Sadd;
        case: "sadd";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Scard scard = 26;
         */
        value: Plugin_Scard;
        case: "scard";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Smembers smembers = 27;
         */
        value: Plugin_Smembers;
        case: "smembers";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Sismember sismember = 28;
         */
        value: Plugin_Sismember;
        case: "sismember";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Srandmember srandmember = 29;
         */
        value: Plugin_Srandmember;
        case: "srandmember";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Srem srem = 30;
         */
        value: Plugin_Srem;
        case: "srem";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zadd zadd = 31;
         */
        value: Plugin_Zadd;
        case: "zadd";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zcard zcard = 32;
         */
        value: Plugin_Zcard;
        case: "zcard";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zcount zcount = 33;
         */
        value: Plugin_Zcount;
        case: "zcount";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zrange zrange = 34;
         */
        value: Plugin_Zrange;
        case: "zrange";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zrank zrank = 35;
         */
        value: Plugin_Zrank;
        case: "zrank";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zrem zrem = 36;
         */
        value: Plugin_Zrem;
        case: "zrem";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Zscore zscore = 37;
         */
        value: Plugin_Zscore;
        case: "zscore";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Expire expire = 38;
         */
        value: Plugin_Expire;
        case: "expire";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Ttl ttl = 39;
         */
        value: Plugin_Ttl;
        case: "ttl";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_Structured>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Structured";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Structured;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Structured;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Structured;
    static equals(a: Plugin_Structured | PlainMessage<Plugin_Structured> | undefined, b: Plugin_Structured | PlainMessage<Plugin_Structured> | undefined): boolean;
}
/**
 * NOTE: (joey) this does not have to be a separate message right now
 * 1. this follows the "connection" pattern
 * 2. this lets us easily add shared connection fields in the future
 *
 * @generated from message plugins.redis.v1.Plugin.Connection
 */
export declare class Plugin_Connection extends Message<Plugin_Connection> {
    /**
     * @generated from oneof plugins.redis.v1.Plugin.Connection.connection_type
     */
    connectionType: {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Connection.Url url = 1;
         */
        value: Plugin_Connection_Url;
        case: "url";
    } | {
        /**
         * @generated from field: plugins.redis.v1.Plugin.Connection.Fields fields = 2;
         */
        value: Plugin_Connection_Fields;
        case: "fields";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin_Connection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Connection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Connection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Connection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Connection;
    static equals(a: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined, b: Plugin_Connection | PlainMessage<Plugin_Connection> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Connection.Url
 */
export declare class Plugin_Connection_Url extends Message<Plugin_Connection_Url> {
    /**
     * @generated from field: string url_string = 1;
     */
    urlString: string;
    constructor(data?: PartialMessage<Plugin_Connection_Url>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Connection.Url";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Connection_Url;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Connection_Url;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Connection_Url;
    static equals(a: Plugin_Connection_Url | PlainMessage<Plugin_Connection_Url> | undefined, b: Plugin_Connection_Url | PlainMessage<Plugin_Connection_Url> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Connection.Fields
 */
export declare class Plugin_Connection_Fields extends Message<Plugin_Connection_Fields> {
    /**
     * @generated from field: string host = 1;
     */
    host: string;
    /**
     * @generated from field: int32 port = 2;
     */
    port: number;
    /**
     * @generated from field: optional int32 database_number = 3;
     */
    databaseNumber?: number;
    /**
     * @generated from field: optional string username = 4;
     */
    username?: string;
    /**
     * @generated from field: optional string password = 5;
     */
    password?: string;
    /**
     * @generated from field: bool enable_ssl = 6;
     */
    enableSsl: boolean;
    constructor(data?: PartialMessage<Plugin_Connection_Fields>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Connection.Fields";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Connection_Fields;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Connection_Fields;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Connection_Fields;
    static equals(a: Plugin_Connection_Fields | PlainMessage<Plugin_Connection_Fields> | undefined, b: Plugin_Connection_Fields | PlainMessage<Plugin_Connection_Fields> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Get
 */
export declare class Plugin_Get extends Message<Plugin_Get> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Get>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Get";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Get;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Get;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Get;
    static equals(a: Plugin_Get | PlainMessage<Plugin_Get> | undefined, b: Plugin_Get | PlainMessage<Plugin_Get> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Set
 */
export declare class Plugin_Set extends Message<Plugin_Set> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string value = 2;
     */
    value: string;
    /**
     * @generated from field: optional int32 expiration_ms = 3;
     */
    expirationMs?: number;
    constructor(data?: PartialMessage<Plugin_Set>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Set";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Set;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Set;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Set;
    static equals(a: Plugin_Set | PlainMessage<Plugin_Set> | undefined, b: Plugin_Set | PlainMessage<Plugin_Set> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Del
 */
export declare class Plugin_Del extends Message<Plugin_Del> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Del>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Del";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Del;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Del;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Del;
    static equals(a: Plugin_Del | PlainMessage<Plugin_Del> | undefined, b: Plugin_Del | PlainMessage<Plugin_Del> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Keys
 */
export declare class Plugin_Keys extends Message<Plugin_Keys> {
    /**
     * @generated from field: string pattern = 1;
     */
    pattern: string;
    constructor(data?: PartialMessage<Plugin_Keys>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Keys";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Keys;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Keys;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Keys;
    static equals(a: Plugin_Keys | PlainMessage<Plugin_Keys> | undefined, b: Plugin_Keys | PlainMessage<Plugin_Keys> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Mget
 */
export declare class Plugin_Mget extends Message<Plugin_Mget> {
    /**
     * comma-separated list
     *
     * @generated from field: string keys = 1;
     */
    keys: string;
    constructor(data?: PartialMessage<Plugin_Mget>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Mget";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Mget;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Mget;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Mget;
    static equals(a: Plugin_Mget | PlainMessage<Plugin_Mget> | undefined, b: Plugin_Mget | PlainMessage<Plugin_Mget> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hget
 */
export declare class Plugin_Hget extends Message<Plugin_Hget> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string field = 2;
     */
    field: string;
    constructor(data?: PartialMessage<Plugin_Hget>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hget";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hget;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hget;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hget;
    static equals(a: Plugin_Hget | PlainMessage<Plugin_Hget> | undefined, b: Plugin_Hget | PlainMessage<Plugin_Hget> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hmget
 */
export declare class Plugin_Hmget extends Message<Plugin_Hmget> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * comma-separated list
     *
     * @generated from field: string fields = 2;
     */
    fields: string;
    constructor(data?: PartialMessage<Plugin_Hmget>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hmget";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hmget;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hmget;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hmget;
    static equals(a: Plugin_Hmget | PlainMessage<Plugin_Hmget> | undefined, b: Plugin_Hmget | PlainMessage<Plugin_Hmget> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hgetall
 */
export declare class Plugin_Hgetall extends Message<Plugin_Hgetall> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Hgetall>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hgetall";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hgetall;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hgetall;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hgetall;
    static equals(a: Plugin_Hgetall | PlainMessage<Plugin_Hgetall> | undefined, b: Plugin_Hgetall | PlainMessage<Plugin_Hgetall> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hset
 */
export declare class Plugin_Hset extends Message<Plugin_Hset> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string field = 2;
     */
    field: string;
    /**
     * @generated from field: string value = 3;
     */
    value: string;
    constructor(data?: PartialMessage<Plugin_Hset>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hset";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hset;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hset;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hset;
    static equals(a: Plugin_Hset | PlainMessage<Plugin_Hset> | undefined, b: Plugin_Hset | PlainMessage<Plugin_Hset> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hsetnx
 */
export declare class Plugin_Hsetnx extends Message<Plugin_Hsetnx> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string field = 2;
     */
    field: string;
    /**
     * @generated from field: string value = 3;
     */
    value: string;
    constructor(data?: PartialMessage<Plugin_Hsetnx>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hsetnx";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hsetnx;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hsetnx;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hsetnx;
    static equals(a: Plugin_Hsetnx | PlainMessage<Plugin_Hsetnx> | undefined, b: Plugin_Hsetnx | PlainMessage<Plugin_Hsetnx> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hlen
 */
export declare class Plugin_Hlen extends Message<Plugin_Hlen> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Hlen>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hlen";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hlen;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hlen;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hlen;
    static equals(a: Plugin_Hlen | PlainMessage<Plugin_Hlen> | undefined, b: Plugin_Hlen | PlainMessage<Plugin_Hlen> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hdel
 */
export declare class Plugin_Hdel extends Message<Plugin_Hdel> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string field = 2;
     */
    field: string;
    constructor(data?: PartialMessage<Plugin_Hdel>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hdel";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hdel;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hdel;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hdel;
    static equals(a: Plugin_Hdel | PlainMessage<Plugin_Hdel> | undefined, b: Plugin_Hdel | PlainMessage<Plugin_Hdel> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hkeys
 */
export declare class Plugin_Hkeys extends Message<Plugin_Hkeys> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Hkeys>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hkeys";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hkeys;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hkeys;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hkeys;
    static equals(a: Plugin_Hkeys | PlainMessage<Plugin_Hkeys> | undefined, b: Plugin_Hkeys | PlainMessage<Plugin_Hkeys> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Hvals
 */
export declare class Plugin_Hvals extends Message<Plugin_Hvals> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Hvals>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Hvals";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Hvals;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Hvals;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Hvals;
    static equals(a: Plugin_Hvals | PlainMessage<Plugin_Hvals> | undefined, b: Plugin_Hvals | PlainMessage<Plugin_Hvals> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Lindex
 */
export declare class Plugin_Lindex extends Message<Plugin_Lindex> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 index = 2;
     */
    index: number;
    constructor(data?: PartialMessage<Plugin_Lindex>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Lindex";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Lindex;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Lindex;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Lindex;
    static equals(a: Plugin_Lindex | PlainMessage<Plugin_Lindex> | undefined, b: Plugin_Lindex | PlainMessage<Plugin_Lindex> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Llen
 */
export declare class Plugin_Llen extends Message<Plugin_Llen> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Llen>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Llen";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Llen;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Llen;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Llen;
    static equals(a: Plugin_Llen | PlainMessage<Plugin_Llen> | undefined, b: Plugin_Llen | PlainMessage<Plugin_Llen> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Lpush
 */
export declare class Plugin_Lpush extends Message<Plugin_Lpush> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string value = 2;
     */
    value: string;
    constructor(data?: PartialMessage<Plugin_Lpush>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Lpush";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Lpush;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Lpush;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Lpush;
    static equals(a: Plugin_Lpush | PlainMessage<Plugin_Lpush> | undefined, b: Plugin_Lpush | PlainMessage<Plugin_Lpush> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Lrem
 */
export declare class Plugin_Lrem extends Message<Plugin_Lrem> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 count = 2;
     */
    count: number;
    /**
     * @generated from field: string value = 3;
     */
    value: string;
    constructor(data?: PartialMessage<Plugin_Lrem>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Lrem";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Lrem;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Lrem;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Lrem;
    static equals(a: Plugin_Lrem | PlainMessage<Plugin_Lrem> | undefined, b: Plugin_Lrem | PlainMessage<Plugin_Lrem> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Lrange
 */
export declare class Plugin_Lrange extends Message<Plugin_Lrange> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 start = 2;
     */
    start: number;
    /**
     * @generated from field: int32 stop = 3;
     */
    stop: number;
    constructor(data?: PartialMessage<Plugin_Lrange>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Lrange";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Lrange;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Lrange;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Lrange;
    static equals(a: Plugin_Lrange | PlainMessage<Plugin_Lrange> | undefined, b: Plugin_Lrange | PlainMessage<Plugin_Lrange> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Sadd
 */
export declare class Plugin_Sadd extends Message<Plugin_Sadd> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Sadd>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Sadd";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sadd;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sadd;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sadd;
    static equals(a: Plugin_Sadd | PlainMessage<Plugin_Sadd> | undefined, b: Plugin_Sadd | PlainMessage<Plugin_Sadd> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Scard
 */
export declare class Plugin_Scard extends Message<Plugin_Scard> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Scard>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Scard";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Scard;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Scard;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Scard;
    static equals(a: Plugin_Scard | PlainMessage<Plugin_Scard> | undefined, b: Plugin_Scard | PlainMessage<Plugin_Scard> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Smembers
 */
export declare class Plugin_Smembers extends Message<Plugin_Smembers> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Smembers>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Smembers";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Smembers;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Smembers;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Smembers;
    static equals(a: Plugin_Smembers | PlainMessage<Plugin_Smembers> | undefined, b: Plugin_Smembers | PlainMessage<Plugin_Smembers> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Sismember
 */
export declare class Plugin_Sismember extends Message<Plugin_Sismember> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Sismember>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Sismember";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Sismember;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Sismember;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Sismember;
    static equals(a: Plugin_Sismember | PlainMessage<Plugin_Sismember> | undefined, b: Plugin_Sismember | PlainMessage<Plugin_Sismember> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Srandmember
 */
export declare class Plugin_Srandmember extends Message<Plugin_Srandmember> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: optional int32 count = 2;
     */
    count?: number;
    constructor(data?: PartialMessage<Plugin_Srandmember>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Srandmember";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Srandmember;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Srandmember;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Srandmember;
    static equals(a: Plugin_Srandmember | PlainMessage<Plugin_Srandmember> | undefined, b: Plugin_Srandmember | PlainMessage<Plugin_Srandmember> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Srem
 */
export declare class Plugin_Srem extends Message<Plugin_Srem> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Srem>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Srem";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Srem;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Srem;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Srem;
    static equals(a: Plugin_Srem | PlainMessage<Plugin_Srem> | undefined, b: Plugin_Srem | PlainMessage<Plugin_Srem> | undefined): boolean;
}
/**
 * TODO: (joey) support options as well: https://redis.io/commands/zadd/
 *
 * @generated from message plugins.redis.v1.Plugin.Zadd
 */
export declare class Plugin_Zadd extends Message<Plugin_Zadd> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: double score = 2;
     */
    score: number;
    /**
     * @generated from field: string member = 3;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Zadd>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zadd";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zadd;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zadd;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zadd;
    static equals(a: Plugin_Zadd | PlainMessage<Plugin_Zadd> | undefined, b: Plugin_Zadd | PlainMessage<Plugin_Zadd> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Zcard
 */
export declare class Plugin_Zcard extends Message<Plugin_Zcard> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Zcard>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zcard";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zcard;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zcard;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zcard;
    static equals(a: Plugin_Zcard | PlainMessage<Plugin_Zcard> | undefined, b: Plugin_Zcard | PlainMessage<Plugin_Zcard> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Zcount
 */
export declare class Plugin_Zcount extends Message<Plugin_Zcount> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: double min = 2;
     */
    min: number;
    /**
     * @generated from field: double max = 3;
     */
    max: number;
    constructor(data?: PartialMessage<Plugin_Zcount>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zcount";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zcount;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zcount;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zcount;
    static equals(a: Plugin_Zcount | PlainMessage<Plugin_Zcount> | undefined, b: Plugin_Zcount | PlainMessage<Plugin_Zcount> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Zrange
 */
export declare class Plugin_Zrange extends Message<Plugin_Zrange> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 start = 2;
     */
    start: number;
    /**
     * @generated from field: int32 stop = 3;
     */
    stop: number;
    constructor(data?: PartialMessage<Plugin_Zrange>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zrange";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zrange;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zrange;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zrange;
    static equals(a: Plugin_Zrange | PlainMessage<Plugin_Zrange> | undefined, b: Plugin_Zrange | PlainMessage<Plugin_Zrange> | undefined): boolean;
}
/**
 * TODO: (joey) add optional withscore
 *
 * @generated from message plugins.redis.v1.Plugin.Zrank
 */
export declare class Plugin_Zrank extends Message<Plugin_Zrank> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Zrank>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zrank";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zrank;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zrank;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zrank;
    static equals(a: Plugin_Zrank | PlainMessage<Plugin_Zrank> | undefined, b: Plugin_Zrank | PlainMessage<Plugin_Zrank> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Zrem
 */
export declare class Plugin_Zrem extends Message<Plugin_Zrem> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Zrem>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zrem";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zrem;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zrem;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zrem;
    static equals(a: Plugin_Zrem | PlainMessage<Plugin_Zrem> | undefined, b: Plugin_Zrem | PlainMessage<Plugin_Zrem> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Zscore
 */
export declare class Plugin_Zscore extends Message<Plugin_Zscore> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string member = 2;
     */
    member: string;
    constructor(data?: PartialMessage<Plugin_Zscore>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Zscore";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Zscore;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Zscore;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Zscore;
    static equals(a: Plugin_Zscore | PlainMessage<Plugin_Zscore> | undefined, b: Plugin_Zscore | PlainMessage<Plugin_Zscore> | undefined): boolean;
}
/**
 * @generated from message plugins.redis.v1.Plugin.Expire
 */
export declare class Plugin_Expire extends Message<Plugin_Expire> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 seconds = 2;
     */
    seconds: number;
    /**
     * @generated from field: optional plugins.redis.v1.Plugin.Expire.Option option = 3;
     */
    option?: Plugin_Expire_Option;
    constructor(data?: PartialMessage<Plugin_Expire>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Expire";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Expire;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Expire;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Expire;
    static equals(a: Plugin_Expire | PlainMessage<Plugin_Expire> | undefined, b: Plugin_Expire | PlainMessage<Plugin_Expire> | undefined): boolean;
}
/**
 * @generated from enum plugins.redis.v1.Plugin.Expire.Option
 */
export declare enum Plugin_Expire_Option {
    /**
     * @generated from enum value: OPTION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: OPTION_NX = 1;
     */
    NX = 1,
    /**
     * @generated from enum value: OPTION_XX = 2;
     */
    XX = 2,
    /**
     * @generated from enum value: OPTION_GT = 3;
     */
    GT = 3,
    /**
     * @generated from enum value: OPTION_LT = 4;
     */
    LT = 4
}
/**
 * @generated from message plugins.redis.v1.Plugin.Ttl
 */
export declare class Plugin_Ttl extends Message<Plugin_Ttl> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    constructor(data?: PartialMessage<Plugin_Ttl>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.redis.v1.Plugin.Ttl";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Ttl;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Ttl;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Ttl;
    static equals(a: Plugin_Ttl | PlainMessage<Plugin_Ttl> | undefined, b: Plugin_Ttl | PlainMessage<Plugin_Ttl> | undefined): boolean;
}
