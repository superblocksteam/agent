import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.common.v1.OAuthCommon
 */
export declare class OAuthCommon extends Message<OAuthCommon> {
    /**
     * @generated from field: string client_id = 1;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 2;
     */
    clientSecret: string;
    /**
     * @generated from field: string token_url = 3;
     */
    tokenUrl: string;
    /**
     * @generated from field: string audience = 4;
     */
    audience: string;
    /**
     * @generated from field: string scope = 5;
     */
    scope: string;
    constructor(data?: PartialMessage<OAuthCommon>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuthCommon";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuthCommon;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuthCommon;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuthCommon;
    static equals(a: OAuthCommon | PlainMessage<OAuthCommon> | undefined, b: OAuthCommon | PlainMessage<OAuthCommon> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.OAuth
 */
export declare class OAuth extends Message<OAuth> {
    constructor(data?: PartialMessage<OAuth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuth;
    static equals(a: OAuth | PlainMessage<OAuth> | undefined, b: OAuth | PlainMessage<OAuth> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.OAuth.PasswordGrantFlow
 */
export declare class OAuth_PasswordGrantFlow extends Message<OAuth_PasswordGrantFlow> {
    /**
     * @generated from field: string client_id = 1;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 2;
     */
    clientSecret: string;
    /**
     * @generated from field: string token_url = 3;
     */
    tokenUrl: string;
    /**
     * @generated from field: string username = 4;
     */
    username: string;
    /**
     * @generated from field: string password = 5;
     */
    password: string;
    /**
     * @generated from field: string audience = 6;
     */
    audience: string;
    /**
     * @generated from field: string scope = 7;
     */
    scope: string;
    constructor(data?: PartialMessage<OAuth_PasswordGrantFlow>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuth.PasswordGrantFlow";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuth_PasswordGrantFlow;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuth_PasswordGrantFlow;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuth_PasswordGrantFlow;
    static equals(a: OAuth_PasswordGrantFlow | PlainMessage<OAuth_PasswordGrantFlow> | undefined, b: OAuth_PasswordGrantFlow | PlainMessage<OAuth_PasswordGrantFlow> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.OAuth.ClientCredentialsFlow
 */
export declare class OAuth_ClientCredentialsFlow extends Message<OAuth_ClientCredentialsFlow> {
    /**
     * @generated from field: string client_id = 1;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 2;
     */
    clientSecret: string;
    /**
     * @generated from field: string token_url = 3;
     */
    tokenUrl: string;
    /**
     * @generated from field: string audience = 4;
     */
    audience: string;
    /**
     * @generated from field: string scope = 5;
     */
    scope: string;
    constructor(data?: PartialMessage<OAuth_ClientCredentialsFlow>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuth.ClientCredentialsFlow";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuth_ClientCredentialsFlow;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuth_ClientCredentialsFlow;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuth_ClientCredentialsFlow;
    static equals(a: OAuth_ClientCredentialsFlow | PlainMessage<OAuth_ClientCredentialsFlow> | undefined, b: OAuth_ClientCredentialsFlow | PlainMessage<OAuth_ClientCredentialsFlow> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.OAuth.AuthorizationCodeFlow
 */
export declare class OAuth_AuthorizationCodeFlow extends Message<OAuth_AuthorizationCodeFlow> {
    /**
     * @generated from field: string client_id = 1;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 2;
     */
    clientSecret: string;
    /**
     * @generated from field: string token_url = 3;
     */
    tokenUrl: string;
    /**
     * @generated from field: string auth_url = 4;
     */
    authUrl: string;
    /**
     * @generated from field: string audience = 5;
     */
    audience: string;
    /**
     * @generated from field: string scope = 6;
     */
    scope: string;
    /**
     * @generated from field: string token_scope = 7;
     */
    tokenScope: string;
    /**
     * @generated from field: bool refresh_token_from_server = 8;
     */
    refreshTokenFromServer: boolean;
    /**
     * @generated from field: string client_auth_method = 9;
     */
    clientAuthMethod: string;
    constructor(data?: PartialMessage<OAuth_AuthorizationCodeFlow>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuth.AuthorizationCodeFlow";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuth_AuthorizationCodeFlow;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuth_AuthorizationCodeFlow;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuth_AuthorizationCodeFlow;
    static equals(a: OAuth_AuthorizationCodeFlow | PlainMessage<OAuth_AuthorizationCodeFlow> | undefined, b: OAuth_AuthorizationCodeFlow | PlainMessage<OAuth_AuthorizationCodeFlow> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.Basic
 */
export declare class Basic extends Message<Basic> {
    /**
     * @generated from field: string username = 1;
     */
    username: string;
    /**
     * @generated from field: string password = 2;
     */
    password: string;
    constructor(data?: PartialMessage<Basic>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.Basic";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Basic;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Basic;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Basic;
    static equals(a: Basic | PlainMessage<Basic> | undefined, b: Basic | PlainMessage<Basic> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.Azure
 */
export declare class Azure extends Message<Azure> {
    /**
     * @generated from oneof plugins.common.v1.Azure.config
     */
    config: {
        /**
         * @generated from field: plugins.common.v1.Azure.Key key = 1;
         */
        value: Azure_Key;
        case: "key";
    } | {
        /**
         * @generated from field: plugins.common.v1.Azure.ClientCredentials client_credentials = 2;
         */
        value: Azure_ClientCredentials;
        case: "clientCredentials";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Azure>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.Azure";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Azure;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Azure;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Azure;
    static equals(a: Azure | PlainMessage<Azure> | undefined, b: Azure | PlainMessage<Azure> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.Azure.Key
 */
export declare class Azure_Key extends Message<Azure_Key> {
    /**
     * @generated from field: string master_key = 1;
     */
    masterKey: string;
    constructor(data?: PartialMessage<Azure_Key>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.Azure.Key";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Azure_Key;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Azure_Key;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Azure_Key;
    static equals(a: Azure_Key | PlainMessage<Azure_Key> | undefined, b: Azure_Key | PlainMessage<Azure_Key> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.Azure.ClientCredentials
 */
export declare class Azure_ClientCredentials extends Message<Azure_ClientCredentials> {
    /**
     * @generated from field: string client_id = 1;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 2;
     */
    clientSecret: string;
    constructor(data?: PartialMessage<Azure_ClientCredentials>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.Azure.ClientCredentials";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Azure_ClientCredentials;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Azure_ClientCredentials;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Azure_ClientCredentials;
    static equals(a: Azure_ClientCredentials | PlainMessage<Azure_ClientCredentials> | undefined, b: Azure_ClientCredentials | PlainMessage<Azure_ClientCredentials> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AwsAuth
 */
export declare class AwsAuth extends Message<AwsAuth> {
    /**
     * @generated from oneof plugins.common.v1.AwsAuth.config
     */
    config: {
        /**
         * @generated from field: plugins.common.v1.AwsAuth.Static static = 1;
         */
        value: AwsAuth_Static;
        case: "static";
    } | {
        /**
         * @generated from field: plugins.common.v1.AwsAuth.AssumeRole assume_role = 2;
         */
        value: AwsAuth_AssumeRole;
        case: "assumeRole";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: string region = 3;
     */
    region: string;
    constructor(data?: PartialMessage<AwsAuth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AwsAuth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AwsAuth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AwsAuth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AwsAuth;
    static equals(a: AwsAuth | PlainMessage<AwsAuth> | undefined, b: AwsAuth | PlainMessage<AwsAuth> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AwsAuth.Static
 */
export declare class AwsAuth_Static extends Message<AwsAuth_Static> {
    /**
     * @generated from field: string access_key_id = 1;
     */
    accessKeyId: string;
    /**
     * @generated from field: string secret_access_key = 2;
     */
    secretAccessKey: string;
    constructor(data?: PartialMessage<AwsAuth_Static>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AwsAuth.Static";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AwsAuth_Static;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AwsAuth_Static;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AwsAuth_Static;
    static equals(a: AwsAuth_Static | PlainMessage<AwsAuth_Static> | undefined, b: AwsAuth_Static | PlainMessage<AwsAuth_Static> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AwsAuth.AssumeRole
 */
export declare class AwsAuth_AssumeRole extends Message<AwsAuth_AssumeRole> {
    /**
     * @generated from field: string role_arn = 3;
     */
    roleArn: string;
    constructor(data?: PartialMessage<AwsAuth_AssumeRole>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AwsAuth.AssumeRole";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AwsAuth_AssumeRole;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AwsAuth_AssumeRole;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AwsAuth_AssumeRole;
    static equals(a: AwsAuth_AssumeRole | PlainMessage<AwsAuth_AssumeRole> | undefined, b: AwsAuth_AssumeRole | PlainMessage<AwsAuth_AssumeRole> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.GcpAuth
 */
export declare class GcpAuth extends Message<GcpAuth> {
    /**
     * @generated from oneof plugins.common.v1.GcpAuth.config
     */
    config: {
        /**
         * @generated from field: bytes service_account = 1;
         */
        value: Uint8Array;
        case: "serviceAccount";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<GcpAuth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.GcpAuth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GcpAuth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GcpAuth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GcpAuth;
    static equals(a: GcpAuth | PlainMessage<GcpAuth> | undefined, b: GcpAuth | PlainMessage<GcpAuth> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AkeylessAuth
 */
export declare class AkeylessAuth extends Message<AkeylessAuth> {
    /**
     * @generated from oneof plugins.common.v1.AkeylessAuth.config
     */
    config: {
        /**
         * @generated from field: plugins.common.v1.AkeylessAuth.ApiKey api_key = 1;
         */
        value: AkeylessAuth_ApiKey;
        case: "apiKey";
    } | {
        /**
         * @generated from field: plugins.common.v1.AkeylessAuth.Email email = 2;
         */
        value: AkeylessAuth_Email;
        case: "email";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<AkeylessAuth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AkeylessAuth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AkeylessAuth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AkeylessAuth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AkeylessAuth;
    static equals(a: AkeylessAuth | PlainMessage<AkeylessAuth> | undefined, b: AkeylessAuth | PlainMessage<AkeylessAuth> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AkeylessAuth.ApiKey
 */
export declare class AkeylessAuth_ApiKey extends Message<AkeylessAuth_ApiKey> {
    /**
     * @generated from field: string access_id = 1;
     */
    accessId: string;
    /**
     * @generated from field: string access_key = 2;
     */
    accessKey: string;
    constructor(data?: PartialMessage<AkeylessAuth_ApiKey>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AkeylessAuth.ApiKey";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AkeylessAuth_ApiKey;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AkeylessAuth_ApiKey;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AkeylessAuth_ApiKey;
    static equals(a: AkeylessAuth_ApiKey | PlainMessage<AkeylessAuth_ApiKey> | undefined, b: AkeylessAuth_ApiKey | PlainMessage<AkeylessAuth_ApiKey> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.AkeylessAuth.Email
 */
export declare class AkeylessAuth_Email extends Message<AkeylessAuth_Email> {
    /**
     * @generated from field: string email = 1;
     */
    email: string;
    /**
     * @generated from field: string password = 2;
     */
    password: string;
    constructor(data?: PartialMessage<AkeylessAuth_Email>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.AkeylessAuth.Email";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AkeylessAuth_Email;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AkeylessAuth_Email;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AkeylessAuth_Email;
    static equals(a: AkeylessAuth_Email | PlainMessage<AkeylessAuth_Email> | undefined, b: AkeylessAuth_Email | PlainMessage<AkeylessAuth_Email> | undefined): boolean;
}
/**
 * @generated from message plugins.common.v1.Auth
 */
export declare class Auth extends Message<Auth> {
    /**
     * @generated from oneof plugins.common.v1.Auth.method
     */
    method: {
        /**
         * @generated from field: plugins.common.v1.OAuth.PasswordGrantFlow password_grant_flow = 1;
         */
        value: OAuth_PasswordGrantFlow;
        case: "passwordGrantFlow";
    } | {
        /**
         * @generated from field: plugins.common.v1.OAuth.AuthorizationCodeFlow authorization_code_flow = 2;
         */
        value: OAuth_AuthorizationCodeFlow;
        case: "authorizationCodeFlow";
    } | {
        /**
         * @generated from field: plugins.common.v1.Basic basic = 3;
         */
        value: Basic;
        case: "basic";
    } | {
        /**
         * @generated from field: plugins.common.v1.OAuth.ClientCredentialsFlow client_credentials_flow = 4;
         */
        value: OAuth_ClientCredentialsFlow;
        case: "clientCredentialsFlow";
    } | {
        /**
         * todo: remove me when cosmos updates
         *
         * @generated from field: plugins.common.v1.Azure.Key key = 5;
         */
        value: Azure_Key;
        case: "key";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Auth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.Auth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Auth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Auth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Auth;
    static equals(a: Auth | PlainMessage<Auth> | undefined, b: Auth | PlainMessage<Auth> | undefined): boolean;
}
