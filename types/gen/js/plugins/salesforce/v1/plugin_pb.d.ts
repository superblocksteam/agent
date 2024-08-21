// package: plugins.salesforce.v1
// file: plugins/salesforce/v1/plugin.proto

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

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.SalesforceConnection | undefined;
    setConnection(value?: Plugin.SalesforceConnection): Plugin;

    hasSoql(): boolean;
    clearSoql(): void;
    getSoql(): Plugin.Soql | undefined;
    setSoql(value?: Plugin.Soql): Plugin;

    hasCrud(): boolean;
    clearCrud(): void;
    getCrud(): Plugin.Crud | undefined;
    setCrud(value?: Plugin.Crud): Plugin;

    hasBulk(): boolean;
    clearBulk(): void;
    getBulk(): Plugin.Bulk | undefined;
    setBulk(value?: Plugin.Bulk): Plugin;

    hasDynamicWorkflowConfiguration(): boolean;
    clearDynamicWorkflowConfiguration(): void;
    getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
    setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

    getSalesforceActionCase(): Plugin.SalesforceActionCase;

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
        connection?: Plugin.SalesforceConnection.AsObject,
        soql?: Plugin.Soql.AsObject,
        crud?: Plugin.Crud.AsObject,
        bulk?: Plugin.Bulk.AsObject,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class SalesforceConnection extends jspb.Message { 
        getInstanceUrl(): string;
        setInstanceUrl(value: string): SalesforceConnection;

        hasAuth(): boolean;
        clearAuth(): void;
        getAuth(): plugins_common_v1_auth_pb.Auth | undefined;
        setAuth(value?: plugins_common_v1_auth_pb.Auth): SalesforceConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): SalesforceConnection.AsObject;
        static toObject(includeInstance: boolean, msg: SalesforceConnection): SalesforceConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: SalesforceConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): SalesforceConnection;
        static deserializeBinaryFromReader(message: SalesforceConnection, reader: jspb.BinaryReader): SalesforceConnection;
    }

    export namespace SalesforceConnection {
        export type AsObject = {
            instanceUrl: string,
            auth?: plugins_common_v1_auth_pb.Auth.AsObject,
        }
    }

    export class Metadata extends jspb.Message { 
        clearObjectsList(): void;
        getObjectsList(): Array<Plugin.Metadata.Object>;
        setObjectsList(value: Array<Plugin.Metadata.Object>): Metadata;
        addObjects(value?: Plugin.Metadata.Object, index?: number): Plugin.Metadata.Object;

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
            objectsList: Array<Plugin.Metadata.Object.AsObject>,
        }


        export class Object extends jspb.Message { 
            clearFieldsList(): void;
            getFieldsList(): Array<Plugin.Metadata.Object.Field>;
            setFieldsList(value: Array<Plugin.Metadata.Object.Field>): Object;
            addFields(value?: Plugin.Metadata.Object.Field, index?: number): Plugin.Metadata.Object.Field;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Object.AsObject;
            static toObject(includeInstance: boolean, msg: Object): Object.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Object, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Object;
            static deserializeBinaryFromReader(message: Object, reader: jspb.BinaryReader): Object;
        }

        export namespace Object {
            export type AsObject = {
                fieldsList: Array<Plugin.Metadata.Object.Field.AsObject>,
            }


            export class Field extends jspb.Message { 
                getName(): string;
                setName(value: string): Field;
                getLabel(): string;
                setLabel(value: string): Field;
                getType(): string;
                setType(value: string): Field;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): Field.AsObject;
                static toObject(includeInstance: boolean, msg: Field): Field.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: Field, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): Field;
                static deserializeBinaryFromReader(message: Field, reader: jspb.BinaryReader): Field;
            }

            export namespace Field {
                export type AsObject = {
                    name: string,
                    label: string,
                    type: string,
                }
            }

        }

    }

    export class Soql extends jspb.Message { 
        getSqlBody(): string;
        setSqlBody(value: string): Soql;
        getAction(): Plugin.Soql.SoqlAction;
        setAction(value: Plugin.Soql.SoqlAction): Soql;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Soql.AsObject;
        static toObject(includeInstance: boolean, msg: Soql): Soql.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Soql, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Soql;
        static deserializeBinaryFromReader(message: Soql, reader: jspb.BinaryReader): Soql;
    }

    export namespace Soql {
        export type AsObject = {
            sqlBody: string,
            action: Plugin.Soql.SoqlAction,
        }

        export enum SoqlAction {
    SOQL_ACTION_UNSPECIFIED = 0,
    SOQL_ACTION_SOQL = 1,
        }

    }

    export class Crud extends jspb.Message { 
        getResourceType(): string;
        setResourceType(value: string): Crud;
        getAction(): Plugin.Crud.CrudAction;
        setAction(value: Plugin.Crud.CrudAction): Crud;
        getResourceBody(): string;
        setResourceBody(value: string): Crud;
        getResourceId(): string;
        setResourceId(value: string): Crud;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Crud.AsObject;
        static toObject(includeInstance: boolean, msg: Crud): Crud.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Crud, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Crud;
        static deserializeBinaryFromReader(message: Crud, reader: jspb.BinaryReader): Crud;
    }

    export namespace Crud {
        export type AsObject = {
            resourceType: string,
            action: Plugin.Crud.CrudAction,
            resourceBody: string,
            resourceId: string,
        }

        export enum CrudAction {
    CRUD_ACTION_UNSPECIFIED = 0,
    CRUD_ACTION_CREATE = 1,
    CRUD_ACTION_UPDATE = 2,
    CRUD_ACTION_DELETE = 3,
    CRUD_ACTION_READ = 4,
        }

    }

    export class Bulk extends jspb.Message { 
        getResourceType(): string;
        setResourceType(value: string): Bulk;
        getAction(): Plugin.Bulk.BulkAction;
        setAction(value: Plugin.Bulk.BulkAction): Bulk;
        getResourceBody(): string;
        setResourceBody(value: string): Bulk;
        getExternalId(): string;
        setExternalId(value: string): Bulk;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Bulk.AsObject;
        static toObject(includeInstance: boolean, msg: Bulk): Bulk.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Bulk, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Bulk;
        static deserializeBinaryFromReader(message: Bulk, reader: jspb.BinaryReader): Bulk;
    }

    export namespace Bulk {
        export type AsObject = {
            resourceType: string,
            action: Plugin.Bulk.BulkAction,
            resourceBody: string,
            externalId: string,
        }

        export enum BulkAction {
    BULK_ACTION_UNSPECIFIED = 0,
    BULK_ACTION_CREATE = 1,
    BULK_ACTION_UPDATE = 2,
    BULK_ACTION_DELETE = 3,
    BULK_ACTION_UPSERT = 4,
        }

    }


    export enum SalesforceActionCase {
        SALESFORCE_ACTION_NOT_SET = 0,
        SOQL = 3,
        CRUD = 4,
        BULK = 5,
    }

}
