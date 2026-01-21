// package: plugins.common.v1
// file: plugins/common/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../../buf/validate/validate_pb";

export class DynamicWorkflowConfiguration extends jspb.Message { 

    hasEnabled(): boolean;
    clearEnabled(): void;
    getEnabled(): boolean | undefined;
    setEnabled(value: boolean): DynamicWorkflowConfiguration;

    hasWorkflowId(): boolean;
    clearWorkflowId(): void;
    getWorkflowId(): string | undefined;
    setWorkflowId(value: string): DynamicWorkflowConfiguration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DynamicWorkflowConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: DynamicWorkflowConfiguration): DynamicWorkflowConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DynamicWorkflowConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DynamicWorkflowConfiguration;
    static deserializeBinaryFromReader(message: DynamicWorkflowConfiguration, reader: jspb.BinaryReader): DynamicWorkflowConfiguration;
}

export namespace DynamicWorkflowConfiguration {
    export type AsObject = {
        enabled?: boolean,
        workflowId?: string,
    }
}

export class AWSConfig extends jspb.Message { 

    hasRegion(): boolean;
    clearRegion(): void;
    getRegion(): string | undefined;
    setRegion(value: string): AWSConfig;

    hasAuth(): boolean;
    clearAuth(): void;
    getAuth(): AWSConfig.Auth | undefined;
    setAuth(value?: AWSConfig.Auth): AWSConfig;

    hasEndpoint(): boolean;
    clearEndpoint(): void;
    getEndpoint(): string | undefined;
    setEndpoint(value: string): AWSConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AWSConfig.AsObject;
    static toObject(includeInstance: boolean, msg: AWSConfig): AWSConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AWSConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AWSConfig;
    static deserializeBinaryFromReader(message: AWSConfig, reader: jspb.BinaryReader): AWSConfig;
}

export namespace AWSConfig {
    export type AsObject = {
        region?: string,
        auth?: AWSConfig.Auth.AsObject,
        endpoint?: string,
    }


    export class Auth extends jspb.Message { 

        hasAccessKeyId(): boolean;
        clearAccessKeyId(): void;
        getAccessKeyId(): string | undefined;
        setAccessKeyId(value: string): Auth;

        hasSecretKey(): boolean;
        clearSecretKey(): void;
        getSecretKey(): string | undefined;
        setSecretKey(value: string): Auth;

        hasIamRoleArn(): boolean;
        clearIamRoleArn(): void;
        getIamRoleArn(): string | undefined;
        setIamRoleArn(value: string): Auth;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Auth.AsObject;
        static toObject(includeInstance: boolean, msg: Auth): Auth.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Auth, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Auth;
        static deserializeBinaryFromReader(message: Auth, reader: jspb.BinaryReader): Auth;
    }

    export namespace Auth {
        export type AsObject = {
            accessKeyId?: string,
            secretKey?: string,
            iamRoleArn?: string,
        }
    }

}

export class SQLExecution extends jspb.Message { 
    getSqlBody(): string;
    setSqlBody(value: string): SQLExecution;
    getUseParameterized(): boolean;
    setUseParameterized(value: boolean): SQLExecution;

    hasParameters(): boolean;
    clearParameters(): void;
    getParameters(): string | undefined;
    setParameters(value: string): SQLExecution;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SQLExecution.AsObject;
    static toObject(includeInstance: boolean, msg: SQLExecution): SQLExecution.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SQLExecution, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SQLExecution;
    static deserializeBinaryFromReader(message: SQLExecution, reader: jspb.BinaryReader): SQLExecution;
}

export namespace SQLExecution {
    export type AsObject = {
        sqlBody: string,
        useParameterized: boolean,
        parameters?: string,
    }
}

export class SQLMappedColumns extends jspb.Message { 
    getJson(): string;
    setJson(value: string): SQLMappedColumns;
    getSql(): string;
    setSql(value: string): SQLMappedColumns;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SQLMappedColumns.AsObject;
    static toObject(includeInstance: boolean, msg: SQLMappedColumns): SQLMappedColumns.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SQLMappedColumns, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SQLMappedColumns;
    static deserializeBinaryFromReader(message: SQLMappedColumns, reader: jspb.BinaryReader): SQLMappedColumns;
}

export namespace SQLMappedColumns {
    export type AsObject = {
        json: string,
        sql: string,
    }
}

export class SSHConfiguration extends jspb.Message { 

    hasAuthenticationMethod(): boolean;
    clearAuthenticationMethod(): void;
    getAuthenticationMethod(): SSHAuthMethod | undefined;
    setAuthenticationMethod(value: SSHAuthMethod): SSHConfiguration;

    hasEnabled(): boolean;
    clearEnabled(): void;
    getEnabled(): boolean | undefined;
    setEnabled(value: boolean): SSHConfiguration;

    hasHost(): boolean;
    clearHost(): void;
    getHost(): string | undefined;
    setHost(value: string): SSHConfiguration;

    hasPassphrase(): boolean;
    clearPassphrase(): void;
    getPassphrase(): string | undefined;
    setPassphrase(value: string): SSHConfiguration;

    hasPassword(): boolean;
    clearPassword(): void;
    getPassword(): string | undefined;
    setPassword(value: string): SSHConfiguration;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): number | undefined;
    setPort(value: number): SSHConfiguration;

    hasPrivateKey(): boolean;
    clearPrivateKey(): void;
    getPrivateKey(): string | undefined;
    setPrivateKey(value: string): SSHConfiguration;

    hasPublicKey(): boolean;
    clearPublicKey(): void;
    getPublicKey(): string | undefined;
    setPublicKey(value: string): SSHConfiguration;

    hasUsername(): boolean;
    clearUsername(): void;
    getUsername(): string | undefined;
    setUsername(value: string): SSHConfiguration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SSHConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: SSHConfiguration): SSHConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SSHConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SSHConfiguration;
    static deserializeBinaryFromReader(message: SSHConfiguration, reader: jspb.BinaryReader): SSHConfiguration;
}

export namespace SSHConfiguration {
    export type AsObject = {
        authenticationMethod?: SSHAuthMethod,
        enabled?: boolean,
        host?: string,
        passphrase?: string,
        password?: string,
        port?: number,
        privateKey?: string,
        publicKey?: string,
        username?: string,
    }
}

export class SQLBulkEdit extends jspb.Message { 

    hasMatchingMode(): boolean;
    clearMatchingMode(): void;
    getMatchingMode(): SQLMatchingMode | undefined;
    setMatchingMode(value: SQLMatchingMode): SQLBulkEdit;

    hasSchema(): boolean;
    clearSchema(): void;
    getSchema(): string | undefined;
    setSchema(value: string): SQLBulkEdit;

    hasTable(): boolean;
    clearTable(): void;
    getTable(): string | undefined;
    setTable(value: string): SQLBulkEdit;

    hasUpdatedRows(): boolean;
    clearUpdatedRows(): void;
    getUpdatedRows(): string | undefined;
    setUpdatedRows(value: string): SQLBulkEdit;

    hasOldRows(): boolean;
    clearOldRows(): void;
    getOldRows(): string | undefined;
    setOldRows(value: string): SQLBulkEdit;
    clearFilterByList(): void;
    getFilterByList(): Array<string>;
    setFilterByList(value: Array<string>): SQLBulkEdit;
    addFilterBy(value: string, index?: number): string;

    hasMappingMode(): boolean;
    clearMappingMode(): void;
    getMappingMode(): SQLMappingMode | undefined;
    setMappingMode(value: SQLMappingMode): SQLBulkEdit;
    clearMappedColumnsList(): void;
    getMappedColumnsList(): Array<SQLMappedColumns>;
    setMappedColumnsList(value: Array<SQLMappedColumns>): SQLBulkEdit;
    addMappedColumns(value?: SQLMappedColumns, index?: number): SQLMappedColumns;

    hasInsertedRows(): boolean;
    clearInsertedRows(): void;
    getInsertedRows(): string | undefined;
    setInsertedRows(value: string): SQLBulkEdit;

    hasDeletedRows(): boolean;
    clearDeletedRows(): void;
    getDeletedRows(): string | undefined;
    setDeletedRows(value: string): SQLBulkEdit;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SQLBulkEdit.AsObject;
    static toObject(includeInstance: boolean, msg: SQLBulkEdit): SQLBulkEdit.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SQLBulkEdit, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SQLBulkEdit;
    static deserializeBinaryFromReader(message: SQLBulkEdit, reader: jspb.BinaryReader): SQLBulkEdit;
}

export namespace SQLBulkEdit {
    export type AsObject = {
        matchingMode?: SQLMatchingMode,
        schema?: string,
        table?: string,
        updatedRows?: string,
        oldRows?: string,
        filterByList: Array<string>,
        mappingMode?: SQLMappingMode,
        mappedColumnsList: Array<SQLMappedColumns.AsObject>,
        insertedRows?: string,
        deletedRows?: string,
    }
}

export enum SSHAuthMethod {
    SSH_AUTH_METHOD_UNSPECIFIED = 0,
    SSH_AUTH_METHOD_PASSWORD = 1,
    SSH_AUTH_METHOD_PUB_KEY_RSA = 2,
    SSH_AUTH_METHOD_PUB_KEY_ED25519 = 3,
    SSH_AUTH_METHOD_USER_PRIVATE_KEY = 4,
}

export enum SQLMappingMode {
    SQL_MAPPING_MODE_UNSPECIFIED = 0,
    SQL_MAPPING_MODE_AUTO = 1,
    SQL_MAPPING_MODE_MANUAL = 2,
}

export enum SQLMatchingMode {
    SQL_MATCHING_MODE_UNSPECIFIED = 0,
    SQL_MATCHING_MODE_AUTO = 1,
    SQL_MATCHING_MODE_ADVANCED = 2,
}

export enum SQLOperation {
    SQL_OPERATION_UNSPECIFIED = 0,
    SQL_OPERATION_RUN_SQL = 1,
    SQL_OPERATION_UPDATE_ROWS = 2,
}
