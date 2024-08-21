import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { DynamicWorkflowConfiguration } from "../../common/v1/plugin_pb";
/**
 * @generated from message plugins.smtp.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: optional string name = 1;
     */
    name?: string;
    /**
     * @generated from field: plugins.smtp.v1.Plugin.SmtpConnection connection = 2;
     */
    connection?: Plugin_SmtpConnection;
    /**
     * @generated from field: string from = 3;
     */
    from: string;
    /**
     * @generated from field: string reply_to = 4;
     */
    replyTo: string;
    /**
     * @generated from field: string to = 5;
     */
    to: string;
    /**
     * @generated from field: string cc = 6;
     */
    cc: string;
    /**
     * @generated from field: string bcc = 7;
     */
    bcc: string;
    /**
     * @generated from field: string subject = 8;
     */
    subject: string;
    /**
     * @generated from field: string body = 9;
     */
    body: string;
    /**
     * stringified representation of a JSON array of objects with fields content, name, and type
     *
     * @generated from field: string attachments = 10;
     */
    attachments: string;
    /**
     * @generated from field: optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 11;
     */
    dynamicWorkflowConfiguration?: DynamicWorkflowConfiguration;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.smtp.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
/**
 * @generated from message plugins.smtp.v1.Plugin.SmtpConnection
 */
export declare class Plugin_SmtpConnection extends Message<Plugin_SmtpConnection> {
    /**
     * @generated from field: string host = 1;
     */
    host: string;
    /**
     * @generated from field: int32 port = 2;
     */
    port: number;
    /**
     * @generated from field: string username = 3;
     */
    username: string;
    /**
     * @generated from field: string password = 4;
     */
    password: string;
    /**
     * @generated from field: optional bool secure = 5;
     */
    secure?: boolean;
    constructor(data?: PartialMessage<Plugin_SmtpConnection>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.smtp.v1.Plugin.SmtpConnection";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_SmtpConnection;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_SmtpConnection;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_SmtpConnection;
    static equals(a: Plugin_SmtpConnection | PlainMessage<Plugin_SmtpConnection> | undefined, b: Plugin_SmtpConnection | PlainMessage<Plugin_SmtpConnection> | undefined): boolean;
}
