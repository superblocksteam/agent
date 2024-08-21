import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration, SQLExecution, SSHConfiguration } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.couchbase.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseConnection connection = 2;
     */
    connection?: Plugin_CouchbaseConnection;
    /**
     * TODO (jason4012) we should unify the interface
     * so that endpoint doesn't have to be always be set here for SSH tunneling
     *
     * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseEndpoint endpoint = 3;
     */
    endpoint?: Plugin_CouchbaseEndpoint;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 4;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    /**
     * @generated from field: plugins.common.v1.SSHConfiguration tunnel = 5;
     */
    tunnel?: SSHConfiguration;
    /**
     * @generated from oneof plugins.couchbase.v1.Plugin.couchbase_action
     */
    couchbaseAction: {
        /**
         * @generated from field: plugins.common.v1.SQLExecution run_sql = 6;
         */
        value: SQLExecution;
        case: "runSql";
    } | {
        /**
         * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseInsert insert = 7;
         */
        value: Plugin_CouchbaseInsert;
        case: "insert";
    } | {
        /**
         * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseGet get = 8;
         */
        value: Plugin_CouchbaseGet;
        case: "get";
    } | {
        /**
         * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseRemove remove = 9;
         */
        value: Plugin_CouchbaseRemove;
        case: "remove";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseEndpoint
 */
export declare class Plugin_CouchbaseEndpoint extends Message<Plugin_CouchbaseEndpoint> {
    /**
     * @generated from field: string host = 1;
     */
    host: string;
    /**
     * @generated from field: int32 port = 2;
     */
    port: number;
    constructor(data?: PartialMessage<Plugin_CouchbaseEndpoint>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseEndpoint";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseEndpoint;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseEndpoint;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseEndpoint;
    static equals(a: Plugin_CouchbaseEndpoint | PlainMessage<Plugin_CouchbaseEndpoint> | undefined, b: Plugin_CouchbaseEndpoint | PlainMessage<Plugin_CouchbaseEndpoint> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseIdentifier
 */
export declare class Plugin_CouchbaseIdentifier extends Message<Plugin_CouchbaseIdentifier> {
    /**
     * @generated from field: string scope = 1;
     */
    scope: string;
    /**
     * @generated from field: string collection = 2;
     */
    collection: string;
    constructor(data?: PartialMessage<Plugin_CouchbaseIdentifier>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseIdentifier";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseIdentifier;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseIdentifier;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseIdentifier;
    static equals(a: Plugin_CouchbaseIdentifier | PlainMessage<Plugin_CouchbaseIdentifier> | undefined, b: Plugin_CouchbaseIdentifier | PlainMessage<Plugin_CouchbaseIdentifier> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseConnection
 */
export declare class Plugin_CouchbaseConnection extends Message<Plugin_CouchbaseConnection> {
    /**
     * @generated from field: string user = 2;
     */
    user: string;
    /**
     * @generated from field: string password = 3;
     */
    password: string;
    /**
     * @generated from field: string bucket = 4;
     */
    bucket: string;
    /**
     * @generated from field: bool use_tls = 5;
     */
    useTls: boolean;
    /**
     * @generated from field: optional string url = 6;
     */
    url?: string;
    constructor(data?: PartialMessage<Plugin_CouchbaseConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseConnection;
    static equals(a: Plugin_CouchbaseConnection | PlainMessage<Plugin_CouchbaseConnection> | undefined, b: Plugin_CouchbaseConnection | PlainMessage<Plugin_CouchbaseConnection> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseInsert
 */
export declare class Plugin_CouchbaseInsert extends Message<Plugin_CouchbaseInsert> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: string value = 2;
     */
    value: string;
    /**
     * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseIdentifier identifier = 3;
     */
    identifier?: Plugin_CouchbaseIdentifier;
    constructor(data?: PartialMessage<Plugin_CouchbaseInsert>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseInsert";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseInsert;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseInsert;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseInsert;
    static equals(a: Plugin_CouchbaseInsert | PlainMessage<Plugin_CouchbaseInsert> | undefined, b: Plugin_CouchbaseInsert | PlainMessage<Plugin_CouchbaseInsert> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseGet
 */
export declare class Plugin_CouchbaseGet extends Message<Plugin_CouchbaseGet> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseIdentifier identifier = 2;
     */
    identifier?: Plugin_CouchbaseIdentifier;
    constructor(data?: PartialMessage<Plugin_CouchbaseGet>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseGet";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseGet;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseGet;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseGet;
    static equals(a: Plugin_CouchbaseGet | PlainMessage<Plugin_CouchbaseGet> | undefined, b: Plugin_CouchbaseGet | PlainMessage<Plugin_CouchbaseGet> | undefined): boolean;
}
/**
 * @generated from message plugins.couchbase.v1.Plugin.CouchbaseRemove
 */
export declare class Plugin_CouchbaseRemove extends Message<Plugin_CouchbaseRemove> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: plugins.couchbase.v1.Plugin.CouchbaseIdentifier identifier = 2;
     */
    identifier?: Plugin_CouchbaseIdentifier;
    constructor(data?: PartialMessage<Plugin_CouchbaseRemove>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.couchbase.v1.Plugin.CouchbaseRemove";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CouchbaseRemove;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CouchbaseRemove;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CouchbaseRemove;
    static equals(a: Plugin_CouchbaseRemove | PlainMessage<Plugin_CouchbaseRemove> | undefined, b: Plugin_CouchbaseRemove | PlainMessage<Plugin_CouchbaseRemove> | undefined): boolean;
}
