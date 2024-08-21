import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
import { Auth } from "../../common/v1/auth_pb";
/**
 * @generated from message plugins.salesforce.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * Plugin fields
     *
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: plugins.salesforce.v1.Plugin.SalesforceConnection connection = 2;
     */
    connection?: Plugin_SalesforceConnection;
    /**
     * @generated from oneof plugins.salesforce.v1.Plugin.salesforce_action
     */
    salesforceAction: {
        /**
         * @generated from field: plugins.salesforce.v1.Plugin.Soql soql = 3;
         */
        value: Plugin_Soql;
        case: "soql";
    } | {
        /**
         * @generated from field: plugins.salesforce.v1.Plugin.Crud crud = 4;
         */
        value: Plugin_Crud;
        case: "crud";
    } | {
        /**
         * @generated from field: plugins.salesforce.v1.Plugin.Bulk bulk = 5;
         */
        value: Plugin_Bulk;
        case: "bulk";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 6;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * children messages
 *
 * @generated from message plugins.salesforce.v1.Plugin.SalesforceConnection
 */
export declare class Plugin_SalesforceConnection extends Message<Plugin_SalesforceConnection> {
    /**
     * @generated from field: string instance_url = 1;
     */
    instanceUrl: string;
    /**
     * @generated from field: plugins.common.v1.Auth auth = 2;
     */
    auth?: Auth;
    constructor(data?: PartialMessage<Plugin_SalesforceConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.SalesforceConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_SalesforceConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_SalesforceConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_SalesforceConnection;
    static equals(a: Plugin_SalesforceConnection | PlainMessage<Plugin_SalesforceConnection> | undefined, b: Plugin_SalesforceConnection | PlainMessage<Plugin_SalesforceConnection> | undefined): boolean;
}
/**
 * @generated from message plugins.salesforce.v1.Plugin.Metadata
 */
export declare class Plugin_Metadata extends Message<Plugin_Metadata> {
    /**
     * @generated from field: repeated plugins.salesforce.v1.Plugin.Metadata.Object objects = 1;
     */
    objects: Plugin_Metadata_Object[];
    constructor(data?: PartialMessage<Plugin_Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata;
    static equals(a: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined, b: Plugin_Metadata | PlainMessage<Plugin_Metadata> | undefined): boolean;
}
/**
 * @generated from message plugins.salesforce.v1.Plugin.Metadata.Object
 */
export declare class Plugin_Metadata_Object extends Message<Plugin_Metadata_Object> {
    /**
     * @generated from field: repeated plugins.salesforce.v1.Plugin.Metadata.Object.Field fields = 1;
     */
    fields: Plugin_Metadata_Object_Field[];
    constructor(data?: PartialMessage<Plugin_Metadata_Object>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Metadata.Object";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Object;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Object;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Object;
    static equals(a: Plugin_Metadata_Object | PlainMessage<Plugin_Metadata_Object> | undefined, b: Plugin_Metadata_Object | PlainMessage<Plugin_Metadata_Object> | undefined): boolean;
}
/**
 * @generated from message plugins.salesforce.v1.Plugin.Metadata.Object.Field
 */
export declare class Plugin_Metadata_Object_Field extends Message<Plugin_Metadata_Object_Field> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string label = 2;
     */
    label: string;
    /**
     * @generated from field: string type = 3;
     */
    type: string;
    constructor(data?: PartialMessage<Plugin_Metadata_Object_Field>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Metadata.Object.Field";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Metadata_Object_Field;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Metadata_Object_Field;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Metadata_Object_Field;
    static equals(a: Plugin_Metadata_Object_Field | PlainMessage<Plugin_Metadata_Object_Field> | undefined, b: Plugin_Metadata_Object_Field | PlainMessage<Plugin_Metadata_Object_Field> | undefined): boolean;
}
/**
 * Action Fields
 *
 * @generated from message plugins.salesforce.v1.Plugin.Soql
 */
export declare class Plugin_Soql extends Message<Plugin_Soql> {
    /**
     * @generated from field: string sql_body = 1;
     */
    sqlBody: string;
    /**
     * @generated from field: plugins.salesforce.v1.Plugin.Soql.SoqlAction action = 2;
     */
    action: Plugin_Soql_SoqlAction;
    constructor(data?: PartialMessage<Plugin_Soql>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Soql";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Soql;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Soql;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Soql;
    static equals(a: Plugin_Soql | PlainMessage<Plugin_Soql> | undefined, b: Plugin_Soql | PlainMessage<Plugin_Soql> | undefined): boolean;
}
/**
 * Specified for singleton types.
 *
 * @generated from enum plugins.salesforce.v1.Plugin.Soql.SoqlAction
 */
export declare enum Plugin_Soql_SoqlAction {
    /**
     * @generated from enum value: SOQL_ACTION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: SOQL_ACTION_SOQL = 1;
     */
    SOQL = 1
}
/**
 * @generated from message plugins.salesforce.v1.Plugin.Crud
 */
export declare class Plugin_Crud extends Message<Plugin_Crud> {
    /**
     * @generated from field: string resource_type = 1;
     */
    resourceType: string;
    /**
     * @generated from field: plugins.salesforce.v1.Plugin.Crud.CrudAction action = 2;
     */
    action: Plugin_Crud_CrudAction;
    /**
     * delete doesn't require body, other actions do
     *
     * @generated from field: string resource_body = 3;
     */
    resourceBody: string;
    /**
     * delete requires resource_id, other actions don't
     *
     * @generated from field: string resource_id = 4;
     */
    resourceId: string;
    constructor(data?: PartialMessage<Plugin_Crud>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Crud";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Crud;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Crud;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Crud;
    static equals(a: Plugin_Crud | PlainMessage<Plugin_Crud> | undefined, b: Plugin_Crud | PlainMessage<Plugin_Crud> | undefined): boolean;
}
/**
 * @generated from enum plugins.salesforce.v1.Plugin.Crud.CrudAction
 */
export declare enum Plugin_Crud_CrudAction {
    /**
     * @generated from enum value: CRUD_ACTION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: CRUD_ACTION_CREATE = 1;
     */
    CREATE = 1,
    /**
     * @generated from enum value: CRUD_ACTION_UPDATE = 2;
     */
    UPDATE = 2,
    /**
     * @generated from enum value: CRUD_ACTION_DELETE = 3;
     */
    DELETE = 3,
    /**
     * @generated from enum value: CRUD_ACTION_READ = 4;
     */
    READ = 4
}
/**
 * @generated from message plugins.salesforce.v1.Plugin.Bulk
 */
export declare class Plugin_Bulk extends Message<Plugin_Bulk> {
    /**
     * @generated from field: string resource_type = 1;
     */
    resourceType: string;
    /**
     * @generated from field: plugins.salesforce.v1.Plugin.Bulk.BulkAction action = 2;
     */
    action: Plugin_Bulk_BulkAction;
    /**
     * delete and update require Id, which will be part of body
     *
     * @generated from field: string resource_body = 3;
     */
    resourceBody: string;
    /**
     * only used for upsert https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/walkthrough_upsert.htm
     *
     * @generated from field: string external_id = 4;
     */
    externalId: string;
    constructor(data?: PartialMessage<Plugin_Bulk>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.salesforce.v1.Plugin.Bulk";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_Bulk;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_Bulk;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_Bulk;
    static equals(a: Plugin_Bulk | PlainMessage<Plugin_Bulk> | undefined, b: Plugin_Bulk | PlainMessage<Plugin_Bulk> | undefined): boolean;
}
/**
 * @generated from enum plugins.salesforce.v1.Plugin.Bulk.BulkAction
 */
export declare enum Plugin_Bulk_BulkAction {
    /**
     * @generated from enum value: BULK_ACTION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: BULK_ACTION_CREATE = 1;
     */
    CREATE = 1,
    /**
     * @generated from enum value: BULK_ACTION_UPDATE = 2;
     */
    UPDATE = 2,
    /**
     * @generated from enum value: BULK_ACTION_DELETE = 3;
     */
    DELETE = 3,
    /**
     * @generated from enum value: BULK_ACTION_UPSERT = 4;
     */
    UPSERT = 4
}
