// package: plugins.smtp.v1
// file: plugins/smtp/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as plugins_common_v1_plugin_pb from "../../../plugins/common/v1/plugin_pb";

export class Plugin extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Plugin;

    hasConnection(): boolean;
    clearConnection(): void;
    getConnection(): Plugin.SmtpConnection | undefined;
    setConnection(value?: Plugin.SmtpConnection): Plugin;
    getFrom(): string;
    setFrom(value: string): Plugin;
    getReplyTo(): string;
    setReplyTo(value: string): Plugin;
    getTo(): string;
    setTo(value: string): Plugin;
    getCc(): string;
    setCc(value: string): Plugin;
    getBcc(): string;
    setBcc(value: string): Plugin;
    getSubject(): string;
    setSubject(value: string): Plugin;
    getBody(): string;
    setBody(value: string): Plugin;
    getAttachments(): string;
    setAttachments(value: string): Plugin;

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
        name?: string,
        connection?: Plugin.SmtpConnection.AsObject,
        from: string,
        replyTo: string,
        to: string,
        cc: string,
        bcc: string,
        subject: string,
        body: string,
        attachments: string,
        dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject,
    }


    export class SmtpConnection extends jspb.Message { 
        getHost(): string;
        setHost(value: string): SmtpConnection;
        getPort(): number;
        setPort(value: number): SmtpConnection;
        getUsername(): string;
        setUsername(value: string): SmtpConnection;
        getPassword(): string;
        setPassword(value: string): SmtpConnection;

        hasSecure(): boolean;
        clearSecure(): void;
        getSecure(): boolean | undefined;
        setSecure(value: boolean): SmtpConnection;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): SmtpConnection.AsObject;
        static toObject(includeInstance: boolean, msg: SmtpConnection): SmtpConnection.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: SmtpConnection, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): SmtpConnection;
        static deserializeBinaryFromReader(message: SmtpConnection, reader: jspb.BinaryReader): SmtpConnection;
    }

    export namespace SmtpConnection {
        export type AsObject = {
            host: string,
            port: number,
            username: string,
            password: string,
            secure?: boolean,
        }
    }

}
