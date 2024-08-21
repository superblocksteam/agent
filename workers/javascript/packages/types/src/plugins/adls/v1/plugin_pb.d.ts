import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
import { Azure } from "../../common/v1/auth_pb";
/**
 * @generated from message plugins.adls.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 2;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    /**
     * @generated from field: plugins.adls.v1.Plugin.AdlsConnection connection = 3;
     */
    connection?: Plugin_AdlsConnection;
    /**
     * @generated from oneof plugins.adls.v1.Plugin.adls_action
     */
    adlsAction: {
        /**
         * @generated from field: plugins.adls.v1.Plugin.CreateContainer create_container = 4;
         */
        value: Plugin_CreateContainer;
        case: "createContainer";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.CreateDirectory create_directory = 5;
         */
        value: Plugin_CreateDirectory;
        case: "createDirectory";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.RenameDirectory rename_directory = 6;
         */
        value: Plugin_RenameDirectory;
        case: "renameDirectory";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.DeleteDirectory delete_directory = 7;
         */
        value: Plugin_DeleteDirectory;
        case: "deleteDirectory";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.ListDirectoryContents list_directory_contents = 8;
         */
        value: Plugin_ListDirectoryContents;
        case: "listDirectoryContents";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.UploadFile upload_file = 9;
         */
        value: Plugin_UploadFile;
        case: "uploadFile";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.DownloadFile download_file = 10;
         */
        value: Plugin_DownloadFile;
        case: "downloadFile";
    } | {
        /**
         * @generated from field: plugins.adls.v1.Plugin.DeleteFile delete_file = 11;
         */
        value: Plugin_DeleteFile;
        case: "deleteFile";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * We need to repeat that it's Adls because of the schema checker that's built
 * based off of these types. It errors out when there is a duplicate type
 * name.
 *
 * @generated from message plugins.adls.v1.Plugin.AdlsConnection
 */
export declare class Plugin_AdlsConnection extends Message<Plugin_AdlsConnection> {
    /**
     * @generated from field: string account_name = 1;
     */
    accountName: string;
    /**
     * @generated from field: string tenant = 2;
     */
    tenant: string;
    /**
     * @generated from field: plugins.common.v1.Azure auth = 3;
     */
    auth?: Azure;
    constructor(data?: PartialMessage<Plugin_AdlsConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.AdlsConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_AdlsConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_AdlsConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_AdlsConnection;
    static equals(a: Plugin_AdlsConnection | PlainMessage<Plugin_AdlsConnection> | undefined, b: Plugin_AdlsConnection | PlainMessage<Plugin_AdlsConnection> | undefined): boolean;
}
/**
 * Actions
 *
 * @generated from message plugins.adls.v1.Plugin.CreateContainer
 */
export declare class Plugin_CreateContainer extends Message<Plugin_CreateContainer> {
    /**
     * @generated from field: string file_system = 2;
     */
    fileSystem: string;
    constructor(data?: PartialMessage<Plugin_CreateContainer>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.CreateContainer";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CreateContainer;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CreateContainer;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CreateContainer;
    static equals(a: Plugin_CreateContainer | PlainMessage<Plugin_CreateContainer> | undefined, b: Plugin_CreateContainer | PlainMessage<Plugin_CreateContainer> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.CreateDirectory
 */
export declare class Plugin_CreateDirectory extends Message<Plugin_CreateDirectory> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    constructor(data?: PartialMessage<Plugin_CreateDirectory>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.CreateDirectory";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_CreateDirectory;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_CreateDirectory;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_CreateDirectory;
    static equals(a: Plugin_CreateDirectory | PlainMessage<Plugin_CreateDirectory> | undefined, b: Plugin_CreateDirectory | PlainMessage<Plugin_CreateDirectory> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.RenameDirectory
 */
export declare class Plugin_RenameDirectory extends Message<Plugin_RenameDirectory> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    /**
     * @generated from field: string new_path = 3;
     */
    newPath: string;
    constructor(data?: PartialMessage<Plugin_RenameDirectory>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.RenameDirectory";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_RenameDirectory;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_RenameDirectory;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_RenameDirectory;
    static equals(a: Plugin_RenameDirectory | PlainMessage<Plugin_RenameDirectory> | undefined, b: Plugin_RenameDirectory | PlainMessage<Plugin_RenameDirectory> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.DeleteDirectory
 */
export declare class Plugin_DeleteDirectory extends Message<Plugin_DeleteDirectory> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    constructor(data?: PartialMessage<Plugin_DeleteDirectory>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.DeleteDirectory";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_DeleteDirectory;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_DeleteDirectory;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_DeleteDirectory;
    static equals(a: Plugin_DeleteDirectory | PlainMessage<Plugin_DeleteDirectory> | undefined, b: Plugin_DeleteDirectory | PlainMessage<Plugin_DeleteDirectory> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.ListDirectoryContents
 */
export declare class Plugin_ListDirectoryContents extends Message<Plugin_ListDirectoryContents> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    constructor(data?: PartialMessage<Plugin_ListDirectoryContents>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.ListDirectoryContents";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_ListDirectoryContents;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_ListDirectoryContents;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_ListDirectoryContents;
    static equals(a: Plugin_ListDirectoryContents | PlainMessage<Plugin_ListDirectoryContents> | undefined, b: Plugin_ListDirectoryContents | PlainMessage<Plugin_ListDirectoryContents> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.UploadFile
 */
export declare class Plugin_UploadFile extends Message<Plugin_UploadFile> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    /**
     * @generated from field: string content = 3;
     */
    content: string;
    constructor(data?: PartialMessage<Plugin_UploadFile>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.UploadFile";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_UploadFile;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_UploadFile;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_UploadFile;
    static equals(a: Plugin_UploadFile | PlainMessage<Plugin_UploadFile> | undefined, b: Plugin_UploadFile | PlainMessage<Plugin_UploadFile> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.DownloadFile
 */
export declare class Plugin_DownloadFile extends Message<Plugin_DownloadFile> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    constructor(data?: PartialMessage<Plugin_DownloadFile>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.DownloadFile";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_DownloadFile;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_DownloadFile;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_DownloadFile;
    static equals(a: Plugin_DownloadFile | PlainMessage<Plugin_DownloadFile> | undefined, b: Plugin_DownloadFile | PlainMessage<Plugin_DownloadFile> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.DeleteFile
 */
export declare class Plugin_DeleteFile extends Message<Plugin_DeleteFile> {
    /**
     * @generated from field: string file_system = 1;
     */
    fileSystem: string;
    /**
     * @generated from field: string path = 2;
     */
    path: string;
    constructor(data?: PartialMessage<Plugin_DeleteFile>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.DeleteFile";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_DeleteFile;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_DeleteFile;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_DeleteFile;
    static equals(a: Plugin_DeleteFile | PlainMessage<Plugin_DeleteFile> | undefined, b: Plugin_DeleteFile | PlainMessage<Plugin_DeleteFile> | undefined): boolean;
}
/**
 * @generated from message plugins.adls.v1.Plugin.Metadata
 */
export declare class Plugin_Metadata extends Message<Plugin_Metadata> {
    /**
     * @generated from field: repeated string file_systems = 1;
     */
    fileSystems: string[];
    constructor(data?: PartialMessage<Plugin_Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.adls.v1.Plugin.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static equals(a: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined, b: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined): boolean;
}
