// package: plugins.adls.v1
// file: plugins/adls/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_auth_pb from "../../../plugins/common/v1/auth_pb";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.AdlsConnection | undefined;
    setConnection(value?: Plugin.AdlsConnection): Plugin;

    hasCreateContainer(): boolean;
    clearCreateContainer(): void;
    getCreateContainer(): Plugin.CreateContainer | undefined;
    setCreateContainer(value?: Plugin.CreateContainer): Plugin;

    hasCreateDirectory(): boolean;
    clearCreateDirectory(): void;
    getCreateDirectory(): Plugin.CreateDirectory | undefined;
    setCreateDirectory(value?: Plugin.CreateDirectory): Plugin;

    hasRenameDirectory(): boolean;
    clearRenameDirectory(): void;
    getRenameDirectory(): Plugin.RenameDirectory | undefined;
    setRenameDirectory(value?: Plugin.RenameDirectory): Plugin;

    hasDeleteDirectory(): boolean;
    clearDeleteDirectory(): void;
    getDeleteDirectory(): Plugin.DeleteDirectory | undefined;
    setDeleteDirectory(value?: Plugin.DeleteDirectory): Plugin;

    hasListDirectoryContents(): boolean;
    clearListDirectoryContents(): void;
    getListDirectoryContents(): Plugin.ListDirectoryContents | undefined;
    setListDirectoryContents(value?: Plugin.ListDirectoryContents): Plugin;

    hasUploadFile(): boolean;
    clearUploadFile(): void;
    getUploadFile(): Plugin.UploadFile | undefined;
    setUploadFile(value?: Plugin.UploadFile): Plugin;

    hasDownloadFile(): boolean;
    clearDownloadFile(): void;
    getDownloadFile(): Plugin.DownloadFile | undefined;
    setDownloadFile(value?: Plugin.DownloadFile): Plugin;

    hasDeleteFile(): boolean;
    clearDeleteFile(): void;
    getDeleteFile(): Plugin.DeleteFile | undefined;
    setDeleteFile(value?: Plugin.DeleteFile): Plugin;

    getAdlsActionCase(): Plugin.AdlsActionCase;

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
        name?: string,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
        connection?: Plugin.AdlsConnection.AsObject,
        createContainer?: Plugin.CreateContainer.AsObject,
        createDirectory?: Plugin.CreateDirectory.AsObject,
        renameDirectory?: Plugin.RenameDirectory.AsObject,
        deleteDirectory?: Plugin.DeleteDirectory.AsObject,
        listDirectoryContents?: Plugin.ListDirectoryContents.AsObject,
        uploadFile?: Plugin.UploadFile.AsObject,
        downloadFile?: Plugin.DownloadFile.AsObject,
        deleteFile?: Plugin.DeleteFile.AsObject,
    }


    export class AdlsConnection extends jspb.Message { 
        getAccountName(): string;
        setAccountName(value: string): AdlsConnection;
        getTenant(): string;
        setTenant(value: string): AdlsConnection;

        hasAuth(): boolean;
        clearAuth(): void;
        getAuth(): plugins_common_v1_auth_pb.Azure | undefined;
        setAuth(value?: plugins_common_v1_auth_pb.Azure): AdlsConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): AdlsConnection.AsObject;
        static toObject(includeInstance: boolean, msg: AdlsConnection): AdlsConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: AdlsConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): AdlsConnection;
        static deserializeBinaryFromReader(message: AdlsConnection, reader: jspb.BinaryReader): AdlsConnection;
    }

    export namespace AdlsConnection {
        export type AsObject = {
            accountName: string,
            tenant: string,
            auth?: plugins_common_v1_auth_pb.Azure.AsObject,
        }
    }

    export class CreateContainer extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): CreateContainer;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CreateContainer.AsObject;
        static toObject(includeInstance: boolean, msg: CreateContainer): CreateContainer.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CreateContainer, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CreateContainer;
        static deserializeBinaryFromReader(message: CreateContainer, reader: jspb.BinaryReader): CreateContainer;
    }

    export namespace CreateContainer {
        export type AsObject = {
            fileSystem: string,
        }
    }

    export class CreateDirectory extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): CreateDirectory;
        getPath(): string;
        setPath(value: string): CreateDirectory;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CreateDirectory.AsObject;
        static toObject(includeInstance: boolean, msg: CreateDirectory): CreateDirectory.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CreateDirectory, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CreateDirectory;
        static deserializeBinaryFromReader(message: CreateDirectory, reader: jspb.BinaryReader): CreateDirectory;
    }

    export namespace CreateDirectory {
        export type AsObject = {
            fileSystem: string,
            path: string,
        }
    }

    export class RenameDirectory extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): RenameDirectory;
        getPath(): string;
        setPath(value: string): RenameDirectory;
        getNewPath(): string;
        setNewPath(value: string): RenameDirectory;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): RenameDirectory.AsObject;
        static toObject(includeInstance: boolean, msg: RenameDirectory): RenameDirectory.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: RenameDirectory, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): RenameDirectory;
        static deserializeBinaryFromReader(message: RenameDirectory, reader: jspb.BinaryReader): RenameDirectory;
    }

    export namespace RenameDirectory {
        export type AsObject = {
            fileSystem: string,
            path: string,
            newPath: string,
        }
    }

    export class DeleteDirectory extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): DeleteDirectory;
        getPath(): string;
        setPath(value: string): DeleteDirectory;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): DeleteDirectory.AsObject;
        static toObject(includeInstance: boolean, msg: DeleteDirectory): DeleteDirectory.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: DeleteDirectory, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): DeleteDirectory;
        static deserializeBinaryFromReader(message: DeleteDirectory, reader: jspb.BinaryReader): DeleteDirectory;
    }

    export namespace DeleteDirectory {
        export type AsObject = {
            fileSystem: string,
            path: string,
        }
    }

    export class ListDirectoryContents extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): ListDirectoryContents;
        getPath(): string;
        setPath(value: string): ListDirectoryContents;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ListDirectoryContents.AsObject;
        static toObject(includeInstance: boolean, msg: ListDirectoryContents): ListDirectoryContents.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ListDirectoryContents, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ListDirectoryContents;
        static deserializeBinaryFromReader(message: ListDirectoryContents, reader: jspb.BinaryReader): ListDirectoryContents;
    }

    export namespace ListDirectoryContents {
        export type AsObject = {
            fileSystem: string,
            path: string,
        }
    }

    export class UploadFile extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): UploadFile;
        getPath(): string;
        setPath(value: string): UploadFile;
        getContent(): string;
        setContent(value: string): UploadFile;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): UploadFile.AsObject;
        static toObject(includeInstance: boolean, msg: UploadFile): UploadFile.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: UploadFile, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): UploadFile;
        static deserializeBinaryFromReader(message: UploadFile, reader: jspb.BinaryReader): UploadFile;
    }

    export namespace UploadFile {
        export type AsObject = {
            fileSystem: string,
            path: string,
            content: string,
        }
    }

    export class DownloadFile extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): DownloadFile;
        getPath(): string;
        setPath(value: string): DownloadFile;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): DownloadFile.AsObject;
        static toObject(includeInstance: boolean, msg: DownloadFile): DownloadFile.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: DownloadFile, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): DownloadFile;
        static deserializeBinaryFromReader(message: DownloadFile, reader: jspb.BinaryReader): DownloadFile;
    }

    export namespace DownloadFile {
        export type AsObject = {
            fileSystem: string,
            path: string,
        }
    }

    export class DeleteFile extends jspb.Message { 
        getFileSystem(): string;
        setFileSystem(value: string): DeleteFile;
        getPath(): string;
        setPath(value: string): DeleteFile;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): DeleteFile.AsObject;
        static toObject(includeInstance: boolean, msg: DeleteFile): DeleteFile.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: DeleteFile, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): DeleteFile;
        static deserializeBinaryFromReader(message: DeleteFile, reader: jspb.BinaryReader): DeleteFile;
    }

    export namespace DeleteFile {
        export type AsObject = {
            fileSystem: string,
            path: string,
        }
    }

    export class Metadata extends jspb.Message { 
        clearFileSystemsList(): void;
        getFileSystemsList(): Array<string>;
        setFileSystemsList(value: Array<string>): Metadata;
        addFileSystems(value: string, index?: number): string;

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
            fileSystemsList: Array<string>,
        }
    }


    export enum AdlsActionCase {
        ADLS_ACTION_NOT_SET = 0,
        CREATE_CONTAINER = 4,
        CREATE_DIRECTORY = 5,
        RENAME_DIRECTORY = 6,
        DELETE_DIRECTORY = 7,
        LIST_DIRECTORY_CONTENTS = 8,
        UPLOAD_FILE = 9,
        DOWNLOAD_FILE = 10,
        DELETE_FILE = 11,
    }

}
