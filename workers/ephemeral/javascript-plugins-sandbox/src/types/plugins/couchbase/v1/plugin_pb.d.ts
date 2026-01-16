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

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    hasTunnel(): boolean;
    clearTunnel(): void;
    getTunnel(): plugins_common_v1_plugin_pb.SSHConfiguration | undefined;
    setTunnel(value?: plugins_common_v1_plugin_pb.SSHConfiguration): Plugin;
    getBucketName(): string;
    setBucketName(value: string): Plugin;

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
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
        tunnel?: plugins_common_v1_plugin_pb.SSHConfiguration.AsObject,
        bucketName: string,
        runSql?: plugins_common_v1_plugin_pb.SQLExecution.AsObject,
        insert?: Plugin.CouchbaseInsert.AsObject,
        get?: Plugin.CouchbaseGet.AsObject,
        remove?: Plugin.CouchbaseRemove.AsObject,
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
        getUrl(): string;
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
            url: string,
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

export class Metadata extends jspb.Message { 
    clearBucketsList(): void;
    getBucketsList(): Array<Metadata.Bucket>;
    setBucketsList(value: Array<Metadata.Bucket>): Metadata;
    addBuckets(value?: Metadata.Bucket, index?: number): Metadata.Bucket;

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
        bucketsList: Array<Metadata.Bucket.AsObject>,
    }


    export class Collection extends jspb.Message { 
        getName(): string;
        setName(value: string): Collection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Collection.AsObject;
        static toObject(includeInstance: boolean, msg: Collection): Collection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Collection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Collection;
        static deserializeBinaryFromReader(message: Collection, reader: jspb.BinaryReader): Collection;
    }

    export namespace Collection {
        export type AsObject = {
            name: string,
        }
    }

    export class Scope extends jspb.Message { 
        getName(): string;
        setName(value: string): Scope;
        clearCollectionsList(): void;
        getCollectionsList(): Array<Metadata.Collection>;
        setCollectionsList(value: Array<Metadata.Collection>): Scope;
        addCollections(value?: Metadata.Collection, index?: number): Metadata.Collection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Scope.AsObject;
        static toObject(includeInstance: boolean, msg: Scope): Scope.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Scope, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Scope;
        static deserializeBinaryFromReader(message: Scope, reader: jspb.BinaryReader): Scope;
    }

    export namespace Scope {
        export type AsObject = {
            name: string,
            collectionsList: Array<Metadata.Collection.AsObject>,
        }
    }

    export class Bucket extends jspb.Message { 
        getName(): string;
        setName(value: string): Bucket;
        clearScopesList(): void;
        getScopesList(): Array<Metadata.Scope>;
        setScopesList(value: Array<Metadata.Scope>): Bucket;
        addScopes(value?: Metadata.Scope, index?: number): Metadata.Scope;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Bucket.AsObject;
        static toObject(includeInstance: boolean, msg: Bucket): Bucket.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Bucket, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Bucket;
        static deserializeBinaryFromReader(message: Bucket, reader: jspb.BinaryReader): Bucket;
    }

    export namespace Bucket {
        export type AsObject = {
            name: string,
            scopesList: Array<Metadata.Scope.AsObject>,
        }
    }

}
