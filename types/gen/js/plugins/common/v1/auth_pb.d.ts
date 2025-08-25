// package: plugins.common.v1
// file: plugins/common/v1/auth.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class OAuthCommon extends jspb.Message { 
    getClientId(): string;
    setClientId(value: string): OAuthCommon;
    getClientSecret(): string;
    setClientSecret(value: string): OAuthCommon;
    getTokenUrl(): string;
    setTokenUrl(value: string): OAuthCommon;
    getAudience(): string;
    setAudience(value: string): OAuthCommon;
    getScope(): string;
    setScope(value: string): OAuthCommon;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OAuthCommon.AsObject;
    static toObject(includeInstance: boolean, msg: OAuthCommon): OAuthCommon.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OAuthCommon, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OAuthCommon;
    static deserializeBinaryFromReader(message: OAuthCommon, reader: jspb.BinaryReader): OAuthCommon;
}

export namespace OAuthCommon {
    export type AsObject = {
        clientId: string,
        clientSecret: string,
        tokenUrl: string,
        audience: string,
        scope: string,
    }
}

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
        getAudience(): string;
        setAudience(value: string): PasswordGrantFlow;
        getScope(): string;
        setScope(value: string): PasswordGrantFlow;

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
            audience: string,
            scope: string,
        }
    }

    export class ClientCredentialsFlow extends jspb.Message { 
        getClientId(): string;
        setClientId(value: string): ClientCredentialsFlow;
        getClientSecret(): string;
        setClientSecret(value: string): ClientCredentialsFlow;
        getTokenUrl(): string;
        setTokenUrl(value: string): ClientCredentialsFlow;
        getAudience(): string;
        setAudience(value: string): ClientCredentialsFlow;
        getScope(): string;
        setScope(value: string): ClientCredentialsFlow;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ClientCredentialsFlow.AsObject;
        static toObject(includeInstance: boolean, msg: ClientCredentialsFlow): ClientCredentialsFlow.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ClientCredentialsFlow, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ClientCredentialsFlow;
        static deserializeBinaryFromReader(message: ClientCredentialsFlow, reader: jspb.BinaryReader): ClientCredentialsFlow;
    }

    export namespace ClientCredentialsFlow {
        export type AsObject = {
            clientId: string,
            clientSecret: string,
            tokenUrl: string,
            audience: string,
            scope: string,
        }
    }

    export class AuthorizationCodeFlow extends jspb.Message { 
        getClientId(): string;
        setClientId(value: string): AuthorizationCodeFlow;
        getClientSecret(): string;
        setClientSecret(value: string): AuthorizationCodeFlow;
        getTokenUrl(): string;
        setTokenUrl(value: string): AuthorizationCodeFlow;
        getAuthUrl(): string;
        setAuthUrl(value: string): AuthorizationCodeFlow;
        getAudience(): string;
        setAudience(value: string): AuthorizationCodeFlow;
        getScope(): string;
        setScope(value: string): AuthorizationCodeFlow;
        getTokenScope(): string;
        setTokenScope(value: string): AuthorizationCodeFlow;
        getRefreshTokenFromServer(): boolean;
        setRefreshTokenFromServer(value: boolean): AuthorizationCodeFlow;
        getClientAuthMethod(): string;
        setClientAuthMethod(value: string): AuthorizationCodeFlow;
        getSubjectTokenSource(): OAuth.AuthorizationCodeFlow.SubjectTokenSource;
        setSubjectTokenSource(value: OAuth.AuthorizationCodeFlow.SubjectTokenSource): AuthorizationCodeFlow;
        getSubjectTokenSourceStaticToken(): string;
        setSubjectTokenSourceStaticToken(value: string): AuthorizationCodeFlow;
        getSubjectTokenType(): string;
        setSubjectTokenType(value: string): AuthorizationCodeFlow;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): AuthorizationCodeFlow.AsObject;
        static toObject(includeInstance: boolean, msg: AuthorizationCodeFlow): AuthorizationCodeFlow.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: AuthorizationCodeFlow, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): AuthorizationCodeFlow;
        static deserializeBinaryFromReader(message: AuthorizationCodeFlow, reader: jspb.BinaryReader): AuthorizationCodeFlow;
    }

    export namespace AuthorizationCodeFlow {
        export type AsObject = {
            clientId: string,
            clientSecret: string,
            tokenUrl: string,
            authUrl: string,
            audience: string,
            scope: string,
            tokenScope: string,
            refreshTokenFromServer: boolean,
            clientAuthMethod: string,
            subjectTokenSource: OAuth.AuthorizationCodeFlow.SubjectTokenSource,
            subjectTokenSourceStaticToken: string,
            subjectTokenType: string,
        }

        export enum SubjectTokenSource {
    SUBJECT_TOKEN_SOURCE_UNSPECIFIED = 0,
    SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER = 1,
    SUBJECT_TOKEN_SOURCE_STATIC_TOKEN = 2,
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

export class Azure extends jspb.Message { 

    hasKey(): boolean;
    clearKey(): void;
    getKey(): Azure.Key | undefined;
    setKey(value?: Azure.Key): Azure;

    hasClientCredentials(): boolean;
    clearClientCredentials(): void;
    getClientCredentials(): Azure.ClientCredentials | undefined;
    setClientCredentials(value?: Azure.ClientCredentials): Azure;

    getConfigCase(): Azure.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Azure.AsObject;
    static toObject(includeInstance: boolean, msg: Azure): Azure.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Azure, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Azure;
    static deserializeBinaryFromReader(message: Azure, reader: jspb.BinaryReader): Azure;
}

export namespace Azure {
    export type AsObject = {
        key?: Azure.Key.AsObject,
        clientCredentials?: Azure.ClientCredentials.AsObject,
    }


    export class Key extends jspb.Message { 
        getMasterKey(): string;
        setMasterKey(value: string): Key;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Key.AsObject;
        static toObject(includeInstance: boolean, msg: Key): Key.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Key, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Key;
        static deserializeBinaryFromReader(message: Key, reader: jspb.BinaryReader): Key;
    }

    export namespace Key {
        export type AsObject = {
            masterKey: string,
        }
    }

    export class ClientCredentials extends jspb.Message { 
        getClientId(): string;
        setClientId(value: string): ClientCredentials;
        getClientSecret(): string;
        setClientSecret(value: string): ClientCredentials;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ClientCredentials.AsObject;
        static toObject(includeInstance: boolean, msg: ClientCredentials): ClientCredentials.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ClientCredentials, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ClientCredentials;
        static deserializeBinaryFromReader(message: ClientCredentials, reader: jspb.BinaryReader): ClientCredentials;
    }

    export namespace ClientCredentials {
        export type AsObject = {
            clientId: string,
            clientSecret: string,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        KEY = 1,
        CLIENT_CREDENTIALS = 2,
    }

}

export class AwsAuth extends jspb.Message { 

    hasStatic(): boolean;
    clearStatic(): void;
    getStatic(): AwsAuth.Static | undefined;
    setStatic(value?: AwsAuth.Static): AwsAuth;

    hasAssumeRole(): boolean;
    clearAssumeRole(): void;
    getAssumeRole(): AwsAuth.AssumeRole | undefined;
    setAssumeRole(value?: AwsAuth.AssumeRole): AwsAuth;
    getRegion(): string;
    setRegion(value: string): AwsAuth;

    getConfigCase(): AwsAuth.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AwsAuth.AsObject;
    static toObject(includeInstance: boolean, msg: AwsAuth): AwsAuth.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AwsAuth, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AwsAuth;
    static deserializeBinaryFromReader(message: AwsAuth, reader: jspb.BinaryReader): AwsAuth;
}

export namespace AwsAuth {
    export type AsObject = {
        pb_static?: AwsAuth.Static.AsObject,
        assumeRole?: AwsAuth.AssumeRole.AsObject,
        region: string,
    }


    export class Static extends jspb.Message { 
        getAccessKeyId(): string;
        setAccessKeyId(value: string): Static;
        getSecretAccessKey(): string;
        setSecretAccessKey(value: string): Static;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Static.AsObject;
        static toObject(includeInstance: boolean, msg: Static): Static.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Static, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Static;
        static deserializeBinaryFromReader(message: Static, reader: jspb.BinaryReader): Static;
    }

    export namespace Static {
        export type AsObject = {
            accessKeyId: string,
            secretAccessKey: string,
        }
    }

    export class AssumeRole extends jspb.Message { 
        getRoleArn(): string;
        setRoleArn(value: string): AssumeRole;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): AssumeRole.AsObject;
        static toObject(includeInstance: boolean, msg: AssumeRole): AssumeRole.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: AssumeRole, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): AssumeRole;
        static deserializeBinaryFromReader(message: AssumeRole, reader: jspb.BinaryReader): AssumeRole;
    }

    export namespace AssumeRole {
        export type AsObject = {
            roleArn: string,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        STATIC = 1,
        ASSUME_ROLE = 2,
    }

}

export class GcpAuth extends jspb.Message { 

    hasServiceAccount(): boolean;
    clearServiceAccount(): void;
    getServiceAccount(): Uint8Array | string;
    getServiceAccount_asU8(): Uint8Array;
    getServiceAccount_asB64(): string;
    setServiceAccount(value: Uint8Array | string): GcpAuth;

    getConfigCase(): GcpAuth.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GcpAuth.AsObject;
    static toObject(includeInstance: boolean, msg: GcpAuth): GcpAuth.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GcpAuth, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GcpAuth;
    static deserializeBinaryFromReader(message: GcpAuth, reader: jspb.BinaryReader): GcpAuth;
}

export namespace GcpAuth {
    export type AsObject = {
        serviceAccount: Uint8Array | string,
    }

    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        SERVICE_ACCOUNT = 1,
    }

}

export class AkeylessAuth extends jspb.Message { 

    hasApiKey(): boolean;
    clearApiKey(): void;
    getApiKey(): AkeylessAuth.ApiKey | undefined;
    setApiKey(value?: AkeylessAuth.ApiKey): AkeylessAuth;

    hasEmail(): boolean;
    clearEmail(): void;
    getEmail(): AkeylessAuth.Email | undefined;
    setEmail(value?: AkeylessAuth.Email): AkeylessAuth;

    getConfigCase(): AkeylessAuth.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AkeylessAuth.AsObject;
    static toObject(includeInstance: boolean, msg: AkeylessAuth): AkeylessAuth.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AkeylessAuth, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AkeylessAuth;
    static deserializeBinaryFromReader(message: AkeylessAuth, reader: jspb.BinaryReader): AkeylessAuth;
}

export namespace AkeylessAuth {
    export type AsObject = {
        apiKey?: AkeylessAuth.ApiKey.AsObject,
        email?: AkeylessAuth.Email.AsObject,
    }


    export class ApiKey extends jspb.Message { 
        getAccessId(): string;
        setAccessId(value: string): ApiKey;
        getAccessKey(): string;
        setAccessKey(value: string): ApiKey;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ApiKey.AsObject;
        static toObject(includeInstance: boolean, msg: ApiKey): ApiKey.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ApiKey, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ApiKey;
        static deserializeBinaryFromReader(message: ApiKey, reader: jspb.BinaryReader): ApiKey;
    }

    export namespace ApiKey {
        export type AsObject = {
            accessId: string,
            accessKey: string,
        }
    }

    export class Email extends jspb.Message { 
        getEmail(): string;
        setEmail(value: string): Email;
        getPassword(): string;
        setPassword(value: string): Email;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Email.AsObject;
        static toObject(includeInstance: boolean, msg: Email): Email.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Email, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Email;
        static deserializeBinaryFromReader(message: Email, reader: jspb.BinaryReader): Email;
    }

    export namespace Email {
        export type AsObject = {
            email: string,
            password: string,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        API_KEY = 1,
        EMAIL = 2,
    }

}

export class Auth extends jspb.Message { 

    hasPasswordGrantFlow(): boolean;
    clearPasswordGrantFlow(): void;
    getPasswordGrantFlow(): OAuth.PasswordGrantFlow | undefined;
    setPasswordGrantFlow(value?: OAuth.PasswordGrantFlow): Auth;

    hasAuthorizationCodeFlow(): boolean;
    clearAuthorizationCodeFlow(): void;
    getAuthorizationCodeFlow(): OAuth.AuthorizationCodeFlow | undefined;
    setAuthorizationCodeFlow(value?: OAuth.AuthorizationCodeFlow): Auth;

    hasBasic(): boolean;
    clearBasic(): void;
    getBasic(): Basic | undefined;
    setBasic(value?: Basic): Auth;

    hasClientCredentialsFlow(): boolean;
    clearClientCredentialsFlow(): void;
    getClientCredentialsFlow(): OAuth.ClientCredentialsFlow | undefined;
    setClientCredentialsFlow(value?: OAuth.ClientCredentialsFlow): Auth;

    hasKey(): boolean;
    clearKey(): void;
    getKey(): Azure.Key | undefined;
    setKey(value?: Azure.Key): Auth;

    getMethodCase(): Auth.MethodCase;

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
        authorizationCodeFlow?: OAuth.AuthorizationCodeFlow.AsObject,
        basic?: Basic.AsObject,
        clientCredentialsFlow?: OAuth.ClientCredentialsFlow.AsObject,
        key?: Azure.Key.AsObject,
    }

    export enum MethodCase {
        METHOD_NOT_SET = 0,
        PASSWORD_GRANT_FLOW = 1,
        AUTHORIZATION_CODE_FLOW = 2,
        BASIC = 3,
        CLIENT_CREDENTIALS_FLOW = 4,
        KEY = 5,
    }

}
