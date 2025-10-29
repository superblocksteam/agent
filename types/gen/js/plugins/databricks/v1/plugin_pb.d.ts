// package: plugins.databricks.v1
// file: plugins/databricks/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 
    getName(): string;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.DatabricksConnection | undefined;
    setConnection(value?: Plugin.DatabricksConnection): Plugin;
    getOperation(): plugins_common_v1_plugin_pb.SQLOperation;
    setOperation(value: plugins_common_v1_plugin_pb.SQLOperation): Plugin;

    hasRunSql(): boolean;
    clearRunSql(): void;
    getRunSql(): plugins_common_v1_plugin_pb.SQLExecution | undefined;
    setRunSql(value?: plugins_common_v1_plugin_pb.SQLExecution): Plugin;

    hasBulkEdit(): boolean;
    clearBulkEdit(): void;
    getBulkEdit(): plugins_common_v1_plugin_pb.SQLBulkEdit | undefined;
    setBulkEdit(value?: plugins_common_v1_plugin_pb.SQLBulkEdit): Plugin;

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
        name: string,
        connection?: Plugin.DatabricksConnection.AsObject,
        operation: plugins_common_v1_plugin_pb.SQLOperation,
        runSql?: plugins_common_v1_plugin_pb.SQLExecution.AsObject,
        bulkEdit?: plugins_common_v1_plugin_pb.SQLBulkEdit.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class DatabricksConnection extends jspb.Message { 

        hasDefaultCatalog(): boolean;
        clearDefaultCatalog(): void;
        getDefaultCatalog(): string | undefined;
        setDefaultCatalog(value: string): DatabricksConnection;

        hasDefaultSchema(): boolean;
        clearDefaultSchema(): void;
        getDefaultSchema(): string | undefined;
        setDefaultSchema(value: string): DatabricksConnection;
        getHostUrl(): string;
        setHostUrl(value: string): DatabricksConnection;
        getPath(): string;
        setPath(value: string): DatabricksConnection;
        getPort(): number;
        setPort(value: number): DatabricksConnection;

        hasConnectionType(): boolean;
        clearConnectionType(): void;
        getConnectionType(): Plugin.ConnectionType | undefined;
        setConnectionType(value: Plugin.ConnectionType): DatabricksConnection;

        hasToken(): boolean;
        clearToken(): void;
        getToken(): string | undefined;
        setToken(value: string): DatabricksConnection;

        hasOauthClientId(): boolean;
        clearOauthClientId(): void;
        getOauthClientId(): string | undefined;
        setOauthClientId(value: string): DatabricksConnection;

        hasOauthClientSecret(): boolean;
        clearOauthClientSecret(): void;
        getOauthClientSecret(): string | undefined;
        setOauthClientSecret(value: string): DatabricksConnection;
        clearScopedCatalogSchemasList(): void;
        getScopedCatalogSchemasList(): Array<Plugin.ScopedCatalogSchemas>;
        setScopedCatalogSchemasList(value: Array<Plugin.ScopedCatalogSchemas>): DatabricksConnection;
        addScopedCatalogSchemas(value?: Plugin.ScopedCatalogSchemas, index?: number): Plugin.ScopedCatalogSchemas;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): DatabricksConnection.AsObject;
        static toObject(includeInstance: boolean, msg: DatabricksConnection): DatabricksConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: DatabricksConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): DatabricksConnection;
        static deserializeBinaryFromReader(message: DatabricksConnection, reader: jspb.BinaryReader): DatabricksConnection;
    }

    export namespace DatabricksConnection {
        export type AsObject = {
            defaultCatalog?: string,
            defaultSchema?: string,
            hostUrl: string,
            path: string,
            port: number,
            connectionType?: Plugin.ConnectionType,
            token?: string,
            oauthClientId?: string,
            oauthClientSecret?: string,
            scopedCatalogSchemasList: Array<Plugin.ScopedCatalogSchemas.AsObject>,
        }
    }

    export class ScopedCatalogSchemas extends jspb.Message { 
        getCatalog(): string;
        setCatalog(value: string): ScopedCatalogSchemas;
        clearSchemasList(): void;
        getSchemasList(): Array<string>;
        setSchemasList(value: Array<string>): ScopedCatalogSchemas;
        addSchemas(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ScopedCatalogSchemas.AsObject;
        static toObject(includeInstance: boolean, msg: ScopedCatalogSchemas): ScopedCatalogSchemas.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ScopedCatalogSchemas, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ScopedCatalogSchemas;
        static deserializeBinaryFromReader(message: ScopedCatalogSchemas, reader: jspb.BinaryReader): ScopedCatalogSchemas;
    }

    export namespace ScopedCatalogSchemas {
        export type AsObject = {
            catalog: string,
            schemasList: Array<string>,
        }
    }


    export enum ConnectionType {
    CONNECTION_TYPE_UNSPECIFIED = 0,
    CONNECTION_TYPE_PAT = 1,
    CONNECTION_TYPE_M2M = 2,
    CONNECTION_TYPE_OAUTH_EXCHANGE = 3,
    }

}
