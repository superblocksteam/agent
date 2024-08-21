import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Profile } from "../../common/v1/common_pb";
import { OAuth_AuthorizationCodeFlow } from "../../plugins/common/v1/auth_pb";
/**
 * @generated from message api.v1.CheckAuthRequest
 */
export declare class CheckAuthRequest extends Message<CheckAuthRequest> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    constructor(data?: PartialMessage<CheckAuthRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.CheckAuthRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CheckAuthRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CheckAuthRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CheckAuthRequest;
    static equals(a: CheckAuthRequest | PlainMessage<CheckAuthRequest> | undefined, b: CheckAuthRequest | PlainMessage<CheckAuthRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.CheckAuthResponse
 */
export declare class CheckAuthResponse extends Message<CheckAuthResponse> {
    /**
     * @generated from field: bool authenticated = 1;
     */
    authenticated: boolean;
    constructor(data?: PartialMessage<CheckAuthResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.CheckAuthResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CheckAuthResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CheckAuthResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CheckAuthResponse;
    static equals(a: CheckAuthResponse | PlainMessage<CheckAuthResponse> | undefined, b: CheckAuthResponse | PlainMessage<CheckAuthResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.LoginRequest
 */
export declare class LoginRequest extends Message<LoginRequest> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: optional string token = 3;
     */
    token?: string;
    /**
     * @generated from field: optional string refreshToken = 4;
     */
    refreshToken?: string;
    /**
     * firebase
     *
     * @generated from field: optional string idToken = 5;
     */
    idToken?: string;
    /**
     * @generated from field: optional int64 expiryTimestamp = 6;
     */
    expiryTimestamp?: bigint;
    constructor(data?: PartialMessage<LoginRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.LoginRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): LoginRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): LoginRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): LoginRequest;
    static equals(a: LoginRequest | PlainMessage<LoginRequest> | undefined, b: LoginRequest | PlainMessage<LoginRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.LoginResponse
 */
export declare class LoginResponse extends Message<LoginResponse> {
    /**
     * @generated from field: bool success = 1;
     */
    success: boolean;
    constructor(data?: PartialMessage<LoginResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.LoginResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): LoginResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): LoginResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): LoginResponse;
    static equals(a: LoginResponse | PlainMessage<LoginResponse> | undefined, b: LoginResponse | PlainMessage<LoginResponse> | undefined): boolean;
}
/**
 * @generated from message api.v1.ExchangeOauthCodeForTokenRequest
 */
export declare class ExchangeOauthCodeForTokenRequest extends Message<ExchangeOauthCodeForTokenRequest> {
    /**
     * this is deprecated, use auth_type/auth_config/configuration_id instead
     *
     * @generated from field: string integration_id = 1 [deprecated = true];
     * @deprecated
     */
    integrationId: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: string access_code = 3;
     */
    accessCode: string;
    /**
     * @generated from field: string auth_type = 4;
     */
    authType: string;
    /**
     * @generated from field: plugins.common.v1.OAuth.AuthorizationCodeFlow auth_config = 5;
     */
    authConfig?: OAuth_AuthorizationCodeFlow;
    /**
     * this is needed to construct authId for access/refresh token(s)
     *
     * @generated from field: string configuration_id = 6;
     */
    configurationId: string;
    constructor(data?: PartialMessage<ExchangeOauthCodeForTokenRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.ExchangeOauthCodeForTokenRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExchangeOauthCodeForTokenRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExchangeOauthCodeForTokenRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExchangeOauthCodeForTokenRequest;
    static equals(a: ExchangeOauthCodeForTokenRequest | PlainMessage<ExchangeOauthCodeForTokenRequest> | undefined, b: ExchangeOauthCodeForTokenRequest | PlainMessage<ExchangeOauthCodeForTokenRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.RequestOauthPasswordTokenRequest
 */
export declare class RequestOauthPasswordTokenRequest extends Message<RequestOauthPasswordTokenRequest> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    /**
     * @generated from field: common.v1.Profile profile = 2;
     */
    profile?: Profile;
    /**
     * @generated from field: string username = 3;
     */
    username: string;
    /**
     * @generated from field: string password = 4;
     */
    password: string;
    constructor(data?: PartialMessage<RequestOauthPasswordTokenRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.RequestOauthPasswordTokenRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RequestOauthPasswordTokenRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RequestOauthPasswordTokenRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RequestOauthPasswordTokenRequest;
    static equals(a: RequestOauthPasswordTokenRequest | PlainMessage<RequestOauthPasswordTokenRequest> | undefined, b: RequestOauthPasswordTokenRequest | PlainMessage<RequestOauthPasswordTokenRequest> | undefined): boolean;
}
/**
 * @generated from message api.v1.RequestOauthPasswordTokenResponse
 */
export declare class RequestOauthPasswordTokenResponse extends Message<RequestOauthPasswordTokenResponse> {
    /**
     * @generated from field: string access_token = 1;
     */
    accessToken: string;
    /**
     * @generated from field: string refresh_token = 2;
     */
    refreshToken: string;
    /**
     * @generated from field: int64 expiry_timestamp = 3;
     */
    expiryTimestamp: bigint;
    constructor(data?: PartialMessage<RequestOauthPasswordTokenResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.RequestOauthPasswordTokenResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RequestOauthPasswordTokenResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RequestOauthPasswordTokenResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RequestOauthPasswordTokenResponse;
    static equals(a: RequestOauthPasswordTokenResponse | PlainMessage<RequestOauthPasswordTokenResponse> | undefined, b: RequestOauthPasswordTokenResponse | PlainMessage<RequestOauthPasswordTokenResponse> | undefined): boolean;
}
