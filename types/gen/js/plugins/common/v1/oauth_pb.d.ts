// package: plugins.common.v1
// file: plugins/common/v1/oauth.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class OAuth extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OAuth.AsObject;
    static toObject(includeInstance: boolean, msg: OAuth): OAuth.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OAuth, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OAuth;
    static deserializeBinaryFromReader(message: OAuth, reader: jspb.BinaryReader): OAuth;
}

export namespace OAuth {
    export type AsObject = {
    }


    export class PasswordGrantFlow extends jspb.Message { 
        getClientId(): string;
        setClientId(value: string): PasswordGrantFlow;
        getClientSecret(): string;
        setClientSecret(value: string): PasswordGrantFlow;
        getTokenUrl(): string;
        setTokenUrl(value: string): PasswordGrantFlow;
        getUsername(): string;
        setUsername(value: string): PasswordGrantFlow;
        getPassword(): string;
        setPassword(value: string): PasswordGrantFlow;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): PasswordGrantFlow.AsObject;
        static toObject(includeInstance: boolean, msg: PasswordGrantFlow): PasswordGrantFlow.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: PasswordGrantFlow, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): PasswordGrantFlow;
        static deserializeBinaryFromReader(message: PasswordGrantFlow, reader: jspb.BinaryReader): PasswordGrantFlow;
    }

    export namespace PasswordGrantFlow {
        export type AsObject = {
            clientId: string,
            clientSecret: string,
            tokenUrl: string,
            username: string,
            password: string,
        }
    }

    export class CodeFlow extends jspb.Message { 
        getClientId(): string;
        setClientId(value: string): CodeFlow;
        getClientSecret(): string;
        setClientSecret(value: string): CodeFlow;
        getTokenUrl(): string;
        setTokenUrl(value: string): CodeFlow;
        getAuthUrl(): string;
        setAuthUrl(value: string): CodeFlow;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): CodeFlow.AsObject;
        static toObject(includeInstance: boolean, msg: CodeFlow): CodeFlow.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: CodeFlow, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): CodeFlow;
        static deserializeBinaryFromReader(message: CodeFlow, reader: jspb.BinaryReader): CodeFlow;
    }

    export namespace CodeFlow {
        export type AsObject = {
            clientId: string,
            clientSecret: string,
            tokenUrl: string,
            authUrl: string,
        }
    }

}

export class Basic extends jspb.Message { 
    getUsername(): string;
    setUsername(value: string): Basic;
    getPassword(): string;
    setPassword(value: string): Basic;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Basic.AsObject;
    static toObject(includeInstance: boolean, msg: Basic): Basic.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Basic, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Basic;
    static deserializeBinaryFromReader(message: Basic, reader: jspb.BinaryReader): Basic;
}

export namespace Basic {
    export type AsObject = {
        username: string,
        password: string,
    }
}

export class Auth extends jspb.Message { 

    hasPasswordGrantFlow(): boolean;
    clearPasswordGrantFlow(): void;
    getPasswordGrantFlow(): OAuth.PasswordGrantFlow | undefined;
    setPasswordGrantFlow(value?: OAuth.PasswordGrantFlow): Auth;

    hasCodeFlow(): boolean;
    clearCodeFlow(): void;
    getCodeFlow(): OAuth.CodeFlow | undefined;
    setCodeFlow(value?: OAuth.CodeFlow): Auth;

    hasBasic(): boolean;
    clearBasic(): void;
    getBasic(): Basic | undefined;
    setBasic(value?: Basic): Auth;

    getAuthCase(): Auth.AuthCase;

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
        passwordGrantFlow?: OAuth.PasswordGrantFlow.AsObject,
        codeFlow?: OAuth.CodeFlow.AsObject,
        basic?: Basic.AsObject,
    }

    export enum AuthCase {
        AUTH_NOT_SET = 0,
        PASSWORD_GRANT_FLOW = 1,
        CODE_FLOW = 2,
        BASIC = 3,
    }

}
