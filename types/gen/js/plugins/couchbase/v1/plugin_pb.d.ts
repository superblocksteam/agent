// package: plugins.couchbase.v1
// file: plugins/couchbase/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 
    getName(): string;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.CouchbaseConnection | undefined;
    setConnection(value?: Plugin.CouchbaseConnection): Plugin;

    hasEndpoint(): boolean;
    clearEndpoint(): void;
    getEndpoint(): Plugin.CouchbaseEndpoint | undefined;
    setEndpoint(value?: Plugin.CouchbaseEndpoint): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    hasTunnel(): boolean;
    clearTunnel(): void;
    getTunnel(): plugins_common_v1_plugin_pb.SSHConfiguration | undefined;
    setTunnel(value?: plugins_common_v1_plugin_pb.SSHConfiguration): Plugin;

    hasRunSql(): boolean;
    clearRunSql(): void;
    getRunSql(): plugins_common_v1_plugin_pb.SQLExecution | undefined;
    setRunSql(value?: plugins_common_v1_plugin_pb.SQLExecution): Plugin;

    hasInsert(): boolean;
    clearInsert(): void;
    getInsert(): Plugin.CouchbaseInsert | undefined;
    setInsert(value?: Plugin.CouchbaseInsert): Plugin;

    hasGet(): boolean;
    clearGet(): void;
    getGet(): Plugin.CouchbaseGet | undefined;
    setGet(value?: Plugin.CouchbaseGet): Plugin;

    hasRemove(): boolean;
    clearRemove(): void;
    getRemove(): Plugin.CouchbaseRemove | undefined;
    setRemove(value?: Plugin.CouchbaseRemove): Plugin;

    getCouchbaseActionCase(): Plugin.CouchbaseActionCase;

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
        name: string,
        connection?: Plugin.CouchbaseConnection.AsObject,
        endpoint?: Plugin.CouchbaseEndpoint.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
        tunnel?: plugins_common_v1_plugin_pb.SSHConfiguration.AsObject,
        runSql?: plugins_common_v1_plugin_pb.SQLExecution.AsObject,
        insert?: Plugin.CouchbaseInsert.AsObject,
        get?: Plugin.CouchbaseGet.AsObject,
        remove?: Plugin.CouchbaseRemove.AsObject,
    }


    export class CouchbaseEndpoint extends jspb.Message { 
        getHost(): string;
        setHost(value: string): CouchbaseEndpoint;
        getPort(): number;
        setPort(value: number): CouchbaseEndpoint;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseEndpoint.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseEndpoint): CouchbaseEndpoint.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseEndpoint, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseEndpoint;
        static deserializeBinaryFromReader(message: CouchbaseEndpoint, reader: jspb.BinaryReader): CouchbaseEndpoint;
    }

    export namespace CouchbaseEndpoint {
        export type AsObject = {
            host: string,
            port: number,
        }
    }

    export class CouchbaseIdentifier extends jspb.Message { 
        getScope(): string;
        setScope(value: string): CouchbaseIdentifier;
        getCollection(): string;
        setCollection(value: string): CouchbaseIdentifier;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseIdentifier.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseIdentifier): CouchbaseIdentifier.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseIdentifier, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseIdentifier;
        static deserializeBinaryFromReader(message: CouchbaseIdentifier, reader: jspb.BinaryReader): CouchbaseIdentifier;
    }

    export namespace CouchbaseIdentifier {
        export type AsObject = {
            scope: string,
            collection: string,
        }
    }

    export class CouchbaseConnection extends jspb.Message { 
        getUser(): string;
        setUser(value: string): CouchbaseConnection;
        getPassword(): string;
        setPassword(value: string): CouchbaseConnection;
        getBucket(): string;
        setBucket(value: string): CouchbaseConnection;
        getUseTls(): boolean;
        setUseTls(value: boolean): CouchbaseConnection;

        hasUrl(): boolean;
        clearUrl(): void;
        getUrl(): string | undefined;
        setUrl(value: string): CouchbaseConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseConnection.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseConnection): CouchbaseConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseConnection;
        static deserializeBinaryFromReader(message: CouchbaseConnection, reader: jspb.BinaryReader): CouchbaseConnection;
    }

    export namespace CouchbaseConnection {
        export type AsObject = {
            user: string,
            password: string,
            bucket: string,
            useTls: boolean,
            url?: string,
        }
    }

    export class CouchbaseInsert extends jspb.Message { 
        getKey(): string;
        setKey(value: string): CouchbaseInsert;
        getValue(): string;
        setValue(value: string): CouchbaseInsert;

        hasIdentifier(): boolean;
        clearIdentifier(): void;
        getIdentifier(): Plugin.CouchbaseIdentifier | undefined;
        setIdentifier(value?: Plugin.CouchbaseIdentifier): CouchbaseInsert;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseInsert.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseInsert): CouchbaseInsert.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseInsert, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseInsert;
        static deserializeBinaryFromReader(message: CouchbaseInsert, reader: jspb.BinaryReader): CouchbaseInsert;
    }

    export namespace CouchbaseInsert {
        export type AsObject = {
            key: string,
            value: string,
            identifier?: Plugin.CouchbaseIdentifier.AsObject,
        }
    }

    export class CouchbaseGet extends jspb.Message { 
        getKey(): string;
        setKey(value: string): CouchbaseGet;

        hasIdentifier(): boolean;
        clearIdentifier(): void;
        getIdentifier(): Plugin.CouchbaseIdentifier | undefined;
        setIdentifier(value?: Plugin.CouchbaseIdentifier): CouchbaseGet;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseGet.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseGet): CouchbaseGet.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseGet, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseGet;
        static deserializeBinaryFromReader(message: CouchbaseGet, reader: jspb.BinaryReader): CouchbaseGet;
    }

    export namespace CouchbaseGet {
        export type AsObject = {
            key: string,
            identifier?: Plugin.CouchbaseIdentifier.AsObject,
        }
    }

    export class CouchbaseRemove extends jspb.Message { 
        getKey(): string;
        setKey(value: string): CouchbaseRemove;

        hasIdentifier(): boolean;
        clearIdentifier(): void;
        getIdentifier(): Plugin.CouchbaseIdentifier | undefined;
        setIdentifier(value?: Plugin.CouchbaseIdentifier): CouchbaseRemove;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CouchbaseRemove.AsObject;
        static toObject(includeInstance: boolean, msg: CouchbaseRemove): CouchbaseRemove.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CouchbaseRemove, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CouchbaseRemove;
        static deserializeBinaryFromReader(message: CouchbaseRemove, reader: jspb.BinaryReader): CouchbaseRemove;
    }

    export namespace CouchbaseRemove {
        export type AsObject = {
            key: string,
            identifier?: Plugin.CouchbaseIdentifier.AsObject,
        }
    }


    export enum CouchbaseActionCase {
        COUCHBASE_ACTION_NOT_SET = 0,
        RUN_SQL = 6,
        INSERT = 7,
        GET = 8,
        REMOVE = 9,
    }

}
