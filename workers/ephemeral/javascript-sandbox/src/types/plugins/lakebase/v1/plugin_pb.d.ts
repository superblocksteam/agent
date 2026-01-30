// package: plugins.lakebase.v1
// file: plugins/lakebase/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class SuperblocksMetadata extends jspb.Message { 
    getPluginversion(): string;
    setPluginversion(value: string): SuperblocksMetadata;

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
        pluginversion: string,
    }
}

export class Plugin extends jspb.Message { 
    getName(): string;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.LakebaseConnection | undefined;
    setConnection(value?: Plugin.LakebaseConnection): Plugin;
    getBody(): string;
    setBody(value: string): Plugin;
    getUsepreparedsql(): boolean;
    setUsepreparedsql(value: boolean): Plugin;

    hasParameters(): boolean;
    clearParameters(): void;
    getParameters(): string | undefined;
    setParameters(value: string): Plugin;

    hasSuperblocksmetadata(): boolean;
    clearSuperblocksmetadata(): void;
    getSuperblocksmetadata(): SuperblocksMetadata | undefined;
    setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

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
        connection?: Plugin.LakebaseConnection.AsObject,
        body: string,
        usepreparedsql: boolean,
        parameters?: string,
        superblocksmetadata?: SuperblocksMetadata.AsObject,
    }


    export class LakebaseConnection extends jspb.Message { 
        getHost(): string;
        setHost(value: string): LakebaseConnection;
        getPort(): number;
        setPort(value: number): LakebaseConnection;
        getDatabaseName(): string;
        setDatabaseName(value: string): LakebaseConnection;
        getConnectionType(): Plugin.ConnectionType;
        setConnectionType(value: Plugin.ConnectionType): LakebaseConnection;

        hasUsername(): boolean;
        clearUsername(): void;
        getUsername(): string | undefined;
        setUsername(value: string): LakebaseConnection;

        hasPassword(): boolean;
        clearPassword(): void;
        getPassword(): string | undefined;
        setPassword(value: string): LakebaseConnection;

        hasOauthClientId(): boolean;
        clearOauthClientId(): void;
        getOauthClientId(): string | undefined;
        setOauthClientId(value: string): LakebaseConnection;

        hasOauthClientSecret(): boolean;
        clearOauthClientSecret(): void;
        getOauthClientSecret(): string | undefined;
        setOauthClientSecret(value: string): LakebaseConnection;

        hasOauthWorkspaceUrl(): boolean;
        clearOauthWorkspaceUrl(): void;
        getOauthWorkspaceUrl(): string | undefined;
        setOauthWorkspaceUrl(value: string): LakebaseConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): LakebaseConnection.AsObject;
        static toObject(includeInstance: boolean, msg: LakebaseConnection): LakebaseConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: LakebaseConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): LakebaseConnection;
        static deserializeBinaryFromReader(message: LakebaseConnection, reader: jspb.BinaryReader): LakebaseConnection;
    }

    export namespace LakebaseConnection {
        export type AsObject = {
            host: string,
            port: number,
            databaseName: string,
            connectionType: Plugin.ConnectionType,
            username?: string,
            password?: string,
            oauthClientId?: string,
            oauthClientSecret?: string,
            oauthWorkspaceUrl?: string,
        }
    }


    export enum ConnectionType {
    CONNECTION_TYPE_UNSPECIFIED = 0,
    CONNECTION_TYPE_USERNAME_PASSWORD = 1,
    CONNECTION_TYPE_OAUTH_M2M = 2,
    CONNECTION_TYPE_OAUTH_FEDERATION = 3,
    }

}
