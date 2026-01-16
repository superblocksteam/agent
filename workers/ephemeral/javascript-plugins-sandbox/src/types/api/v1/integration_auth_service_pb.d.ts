// package: api.v1
// file: api/v1/integration_auth_service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as plugins_common_v1_auth_pb from "../../plugins/common/v1/auth_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class CheckAuthRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): CheckAuthRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): CheckAuthRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckAuthRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckAuthRequest): CheckAuthRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckAuthRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckAuthRequest;
    static deserializeBinaryFromReader(message: CheckAuthRequest, reader: jspb.BinaryReader): CheckAuthRequest;
}

export namespace CheckAuthRequest {
    export type AsObject = {
        integrationId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
    }
}

export class CheckAuthResponse extends jspb.Message { 
    getAuthenticated(): boolean;
    setAuthenticated(value: boolean): CheckAuthResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckAuthResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckAuthResponse): CheckAuthResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckAuthResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckAuthResponse;
    static deserializeBinaryFromReader(message: CheckAuthResponse, reader: jspb.BinaryReader): CheckAuthResponse;
}

export namespace CheckAuthResponse {
    export type AsObject = {
        authenticated: boolean,
    }
}

export class LoginRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): LoginRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): LoginRequest;

    hasToken(): boolean;
    clearToken(): void;
    getToken(): string | undefined;
    setToken(value: string): LoginRequest;

    hasRefreshtoken(): boolean;
    clearRefreshtoken(): void;
    getRefreshtoken(): string | undefined;
    setRefreshtoken(value: string): LoginRequest;

    hasIdtoken(): boolean;
    clearIdtoken(): void;
    getIdtoken(): string | undefined;
    setIdtoken(value: string): LoginRequest;

    hasExpirytimestamp(): boolean;
    clearExpirytimestamp(): void;
    getExpirytimestamp(): number | undefined;
    setExpirytimestamp(value: number): LoginRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoginRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LoginRequest): LoginRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoginRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoginRequest;
    static deserializeBinaryFromReader(message: LoginRequest, reader: jspb.BinaryReader): LoginRequest;
}

export namespace LoginRequest {
    export type AsObject = {
        integrationId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        token?: string,
        refreshtoken?: string,
        idtoken?: string,
        expirytimestamp?: number,
    }
}

export class LoginResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): LoginResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoginResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LoginResponse): LoginResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoginResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoginResponse;
    static deserializeBinaryFromReader(message: LoginResponse, reader: jspb.BinaryReader): LoginResponse;
}

export namespace LoginResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class ExchangeOauthCodeForTokenRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): ExchangeOauthCodeForTokenRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): ExchangeOauthCodeForTokenRequest;
    getAccessCode(): string;
    setAccessCode(value: string): ExchangeOauthCodeForTokenRequest;
    getAuthType(): string;
    setAuthType(value: string): ExchangeOauthCodeForTokenRequest;

    hasAuthConfig(): boolean;
    clearAuthConfig(): void;
    getAuthConfig(): plugins_common_v1_auth_pb.OAuth.AuthorizationCodeFlow | undefined;
    setAuthConfig(value?: plugins_common_v1_auth_pb.OAuth.AuthorizationCodeFlow): ExchangeOauthCodeForTokenRequest;
    getConfigurationId(): string;
    setConfigurationId(value: string): ExchangeOauthCodeForTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExchangeOauthCodeForTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExchangeOauthCodeForTokenRequest): ExchangeOauthCodeForTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExchangeOauthCodeForTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExchangeOauthCodeForTokenRequest;
    static deserializeBinaryFromReader(message: ExchangeOauthCodeForTokenRequest, reader: jspb.BinaryReader): ExchangeOauthCodeForTokenRequest;
}

export namespace ExchangeOauthCodeForTokenRequest {
    export type AsObject = {
        integrationId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        accessCode: string,
        authType: string,
        authConfig?: plugins_common_v1_auth_pb.OAuth.AuthorizationCodeFlow.AsObject,
        configurationId: string,
    }
}

export class RequestOauthPasswordTokenRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): RequestOauthPasswordTokenRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): RequestOauthPasswordTokenRequest;
    getUsername(): string;
    setUsername(value: string): RequestOauthPasswordTokenRequest;
    getPassword(): string;
    setPassword(value: string): RequestOauthPasswordTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestOauthPasswordTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RequestOauthPasswordTokenRequest): RequestOauthPasswordTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestOauthPasswordTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestOauthPasswordTokenRequest;
    static deserializeBinaryFromReader(message: RequestOauthPasswordTokenRequest, reader: jspb.BinaryReader): RequestOauthPasswordTokenRequest;
}

export namespace RequestOauthPasswordTokenRequest {
    export type AsObject = {
        integrationId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        username: string,
        password: string,
    }
}

export class RequestOauthPasswordTokenResponse extends jspb.Message { 
    getAccessToken(): string;
    setAccessToken(value: string): RequestOauthPasswordTokenResponse;
    getRefreshToken(): string;
    setRefreshToken(value: string): RequestOauthPasswordTokenResponse;
    getExpiryTimestamp(): number;
    setExpiryTimestamp(value: number): RequestOauthPasswordTokenResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestOauthPasswordTokenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RequestOauthPasswordTokenResponse): RequestOauthPasswordTokenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestOauthPasswordTokenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestOauthPasswordTokenResponse;
    static deserializeBinaryFromReader(message: RequestOauthPasswordTokenResponse, reader: jspb.BinaryReader): RequestOauthPasswordTokenResponse;
}

export namespace RequestOauthPasswordTokenResponse {
    export type AsObject = {
        accessToken: string,
        refreshToken: string,
        expiryTimestamp: number,
    }
}
