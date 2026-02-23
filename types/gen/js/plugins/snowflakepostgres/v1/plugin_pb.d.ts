// package: plugins.snowflakepostgres.v1
// file: plugins/snowflakepostgres/v1/plugin.proto

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
    getConnection(): Plugin.SnowflakePostgresConnection | undefined;
    setConnection(value?: Plugin.SnowflakePostgresConnection): Plugin;
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
        connection?: Plugin.SnowflakePostgresConnection.AsObject,
        body: string,
        usepreparedsql: boolean,
        parameters?: string,
        superblocksmetadata?: SuperblocksMetadata.AsObject,
    }


    export class SnowflakePostgresConnection extends jspb.Message { 
        getHost(): string;
        setHost(value: string): SnowflakePostgresConnection;
        getPort(): number;
        setPort(value: number): SnowflakePostgresConnection;
        getDatabaseName(): string;
        setDatabaseName(value: string): SnowflakePostgresConnection;

        hasUsername(): boolean;
        clearUsername(): void;
        getUsername(): string | undefined;
        setUsername(value: string): SnowflakePostgresConnection;

        hasPassword(): boolean;
        clearPassword(): void;
        getPassword(): string | undefined;
        setPassword(value: string): SnowflakePostgresConnection;
        getUseSelfSignedSsl(): boolean;
        setUseSelfSignedSsl(value: boolean): SnowflakePostgresConnection;

        hasCa(): boolean;
        clearCa(): void;
        getCa(): string | undefined;
        setCa(value: string): SnowflakePostgresConnection;

        hasKey(): boolean;
        clearKey(): void;
        getKey(): string | undefined;
        setKey(value: string): SnowflakePostgresConnection;

        hasCert(): boolean;
        clearCert(): void;
        getCert(): string | undefined;
        setCert(value: string): SnowflakePostgresConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): SnowflakePostgresConnection.AsObject;
        static toObject(includeInstance: boolean, msg: SnowflakePostgresConnection): SnowflakePostgresConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: SnowflakePostgresConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): SnowflakePostgresConnection;
        static deserializeBinaryFromReader(message: SnowflakePostgresConnection, reader: jspb.BinaryReader): SnowflakePostgresConnection;
    }

    export namespace SnowflakePostgresConnection {
        export type AsObject = {
            host: string,
            port: number,
            databaseName: string,
            username?: string,
            password?: string,
            useSelfSignedSsl: boolean,
            ca?: string,
            key?: string,
            cert?: string,
        }
    }

}
