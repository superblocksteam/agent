// package: plugins.oracledb.v1
// file: plugins/oracledb/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 
    getName(): string;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.OracleDbConnection | undefined;
    setConnection(value?: Plugin.OracleDbConnection): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    hasRunSql(): boolean;
    clearRunSql(): void;
    getRunSql(): plugins_common_v1_plugin_pb.SQLExecution | undefined;
    setRunSql(value?: plugins_common_v1_plugin_pb.SQLExecution): Plugin;

    hasBulkEdit(): boolean;
    clearBulkEdit(): void;
    getBulkEdit(): plugins_common_v1_plugin_pb.SQLBulkEdit | undefined;
    setBulkEdit(value?: plugins_common_v1_plugin_pb.SQLBulkEdit): Plugin;
    getOperation(): plugins_common_v1_plugin_pb.SQLOperation;
    setOperation(value: plugins_common_v1_plugin_pb.SQLOperation): Plugin;

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
        connection?: Plugin.OracleDbConnection.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
        runSql?: plugins_common_v1_plugin_pb.SQLExecution.AsObject,
        bulkEdit?: plugins_common_v1_plugin_pb.SQLBulkEdit.AsObject,
        operation: plugins_common_v1_plugin_pb.SQLOperation,
    }


    export class OracleDbConnection extends jspb.Message { 
        getHostUrl(): string;
        setHostUrl(value: string): OracleDbConnection;
        getPort(): number;
        setPort(value: number): OracleDbConnection;
        getUser(): string;
        setUser(value: string): OracleDbConnection;
        getPassword(): string;
        setPassword(value: string): OracleDbConnection;
        getDatabaseService(): string;
        setDatabaseService(value: string): OracleDbConnection;
        getUseTcps(): boolean;
        setUseTcps(value: boolean): OracleDbConnection;
        getConnectionType(): string;
        setConnectionType(value: string): OracleDbConnection;
        getConnectionUrl(): string;
        setConnectionUrl(value: string): OracleDbConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): OracleDbConnection.AsObject;
        static toObject(includeInstance: boolean, msg: OracleDbConnection): OracleDbConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: OracleDbConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): OracleDbConnection;
        static deserializeBinaryFromReader(message: OracleDbConnection, reader: jspb.BinaryReader): OracleDbConnection;
    }

    export namespace OracleDbConnection {
        export type AsObject = {
            hostUrl: string,
            port: number,
            user: string,
            password: string,
            databaseService: string,
            useTcps: boolean,
            connectionType: string,
            connectionUrl: string,
        }
    }

}
