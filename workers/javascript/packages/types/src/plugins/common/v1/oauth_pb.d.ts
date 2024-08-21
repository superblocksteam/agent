import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
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
     * @generated from field: string client_id = 2;
     */
    clientId: string;
    /**
     * @generated from field: string client_secret = 3;
     */
    clientSecret: string;
    /**
     * @generated from field: string token_url = 4;
     */
    tokenUrl: string;
    /**
     * @generated from field: string username = 5;
     */
    username: string;
    /**
     * @generated from field: string password = 6;
     */
    password: string;
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
 * @generated from message plugins.common.v1.OAuth.CodeFlow
 */
export declare class OAuth_CodeFlow extends Message<OAuth_CodeFlow> {
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
    constructor(data?: PartialMessage<OAuth_CodeFlow>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.common.v1.OAuth.CodeFlow";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OAuth_CodeFlow;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OAuth_CodeFlow;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OAuth_CodeFlow;
    static equals(a: OAuth_CodeFlow | PlainMessage<OAuth_CodeFlow> | undefined, b: OAuth_CodeFlow | PlainMessage<OAuth_CodeFlow> | undefined): boolean;
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
 * @generated from message plugins.common.v1.Auth
 */
export declare class Auth extends Message<Auth> {
    /**
     * @generated from oneof plugins.common.v1.Auth.auth
     */
    auth: {
        /**
         * @generated from field: plugins.common.v1.OAuth.PasswordGrantFlow password_grant_flow = 1;
         */
        value: OAuth_PasswordGrantFlow;
        case: "passwordGrantFlow";
    } | {
        /**
         * @generated from field: plugins.common.v1.OAuth.CodeFlow code_flow = 2;
         */
        value: OAuth_CodeFlow;
        case: "codeFlow";
    } | {
        /**
         * @generated from field: plugins.common.v1.Basic basic = 3;
         */
        value: Basic;
        case: "basic";
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
