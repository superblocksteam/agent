// package: secrets.v1
// file: secrets/v1/store.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as secrets_v1_secrets_pb from "../../secrets/v1/secrets_pb";

export class InvalidateRequest extends jspb.Message { 
    getStore(): string;
    setStore(value: string): InvalidateRequest;
    getSecret(): string;
    setSecret(value: string): InvalidateRequest;
    getConfigurationId(): string;
    setConfigurationId(value: string): InvalidateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvalidateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvalidateRequest): InvalidateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvalidateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvalidateRequest;
    static deserializeBinaryFromReader(message: InvalidateRequest, reader: jspb.BinaryReader): InvalidateRequest;
}

export namespace InvalidateRequest {
    export type AsObject = {
        store: string,
        secret: string,
        configurationId: string,
    }
}

export class InvalidateResponse extends jspb.Message { 
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): InvalidateResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;
    clearInvalidationsList(): void;
    getInvalidationsList(): Array<secrets_v1_secrets_pb.Invalidation>;
    setInvalidationsList(value: Array<secrets_v1_secrets_pb.Invalidation>): InvalidateResponse;
    addInvalidations(value?: secrets_v1_secrets_pb.Invalidation, index?: number): secrets_v1_secrets_pb.Invalidation;
    getMessage(): string;
    setMessage(value: string): InvalidateResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvalidateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InvalidateResponse): InvalidateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvalidateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvalidateResponse;
    static deserializeBinaryFromReader(message: InvalidateResponse, reader: jspb.BinaryReader): InvalidateResponse;
}

export namespace InvalidateResponse {
    export type AsObject = {
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
        invalidationsList: Array<secrets_v1_secrets_pb.Invalidation.AsObject>,
        message: string,
    }
}

export class ListSecretsRequest extends jspb.Message { 
    getStore(): string;
    setStore(value: string): ListSecretsRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): ListSecretsRequest;

    hasProvider(): boolean;
    clearProvider(): void;
    getProvider(): secrets_v1_secrets_pb.Provider | undefined;
    setProvider(value?: secrets_v1_secrets_pb.Provider): ListSecretsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretsRequest): ListSecretsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretsRequest;
    static deserializeBinaryFromReader(message: ListSecretsRequest, reader: jspb.BinaryReader): ListSecretsRequest;
}

export namespace ListSecretsRequest {
    export type AsObject = {
        store: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        provider?: secrets_v1_secrets_pb.Provider.AsObject,
    }
}

export class ListSecretsResponse extends jspb.Message { 
    clearSecretsList(): void;
    getSecretsList(): Array<secrets_v1_secrets_pb.Details>;
    setSecretsList(value: Array<secrets_v1_secrets_pb.Details>): ListSecretsResponse;
    addSecrets(value?: secrets_v1_secrets_pb.Details, index?: number): secrets_v1_secrets_pb.Details;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretsResponse): ListSecretsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretsResponse;
    static deserializeBinaryFromReader(message: ListSecretsResponse, reader: jspb.BinaryReader): ListSecretsResponse;
}

export namespace ListSecretsResponse {
    export type AsObject = {
        secretsList: Array<secrets_v1_secrets_pb.Details.AsObject>,
    }
}
