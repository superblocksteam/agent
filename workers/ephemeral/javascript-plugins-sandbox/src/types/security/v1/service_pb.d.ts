// package: security.v1
// file: security/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as utils_v1_utils_pb from "../../utils/v1/utils_pb";

export class Resource extends jspb.Message { 

    hasApi(): boolean;
    clearApi(): void;
    getApi(): google_protobuf_struct_pb.Value | undefined;
    setApi(value?: google_protobuf_struct_pb.Value): Resource;

    hasLiteral(): boolean;
    clearLiteral(): void;
    getLiteral(): Resource.Literal | undefined;
    setLiteral(value?: Resource.Literal): Resource;

    hasApiLiteral(): boolean;
    clearApiLiteral(): void;
    getApiLiteral(): Resource.ApiLiteral | undefined;
    setApiLiteral(value?: Resource.ApiLiteral): Resource;

    hasCommitId(): boolean;
    clearCommitId(): void;
    getCommitId(): string;
    setCommitId(value: string): Resource;

    hasBranchName(): boolean;
    clearBranchName(): void;
    getBranchName(): string;
    setBranchName(value: string): Resource;

    hasLastUpdated(): boolean;
    clearLastUpdated(): void;
    getLastUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setLastUpdated(value?: google_protobuf_timestamp_pb.Timestamp): Resource;

    getConfigCase(): Resource.ConfigCase;
    getGitRefCase(): Resource.GitRefCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Resource.AsObject;
    static toObject(includeInstance: boolean, msg: Resource): Resource.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Resource, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Resource;
    static deserializeBinaryFromReader(message: Resource, reader: jspb.BinaryReader): Resource;
}

export namespace Resource {
    export type AsObject = {
        api?: google_protobuf_struct_pb.Value.AsObject,
        literal?: Resource.Literal.AsObject,
        apiLiteral?: Resource.ApiLiteral.AsObject,
        commitId: string,
        branchName: string,
        lastUpdated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    }


    export class Literal extends jspb.Message { 

        hasData(): boolean;
        clearData(): void;
        getData(): google_protobuf_struct_pb.Value | undefined;
        setData(value?: google_protobuf_struct_pb.Value): Literal;

        hasSignature(): boolean;
        clearSignature(): void;
        getSignature(): utils_v1_utils_pb.Signature | undefined;
        setSignature(value?: utils_v1_utils_pb.Signature): Literal;
        getResourceId(): string;
        setResourceId(value: string): Literal;
        getOrganizationId(): string;
        setOrganizationId(value: string): Literal;

        hasLastUpdated(): boolean;
        clearLastUpdated(): void;
        getLastUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
        setLastUpdated(value?: google_protobuf_timestamp_pb.Timestamp): Literal;
        getType(): string;
        setType(value: string): Literal;
        getPageVersion(): number;
        setPageVersion(value: number): Literal;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Literal.AsObject;
        static toObject(includeInstance: boolean, msg: Literal): Literal.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Literal, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Literal;
        static deserializeBinaryFromReader(message: Literal, reader: jspb.BinaryReader): Literal;
    }

    export namespace Literal {
        export type AsObject = {
            data?: google_protobuf_struct_pb.Value.AsObject,
            signature?: utils_v1_utils_pb.Signature.AsObject,
            resourceId: string,
            organizationId: string,
            lastUpdated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
            type: string,
            pageVersion: number,
        }
    }

    export class ApiLiteral extends jspb.Message { 

        hasData(): boolean;
        clearData(): void;
        getData(): google_protobuf_struct_pb.Value | undefined;
        setData(value?: google_protobuf_struct_pb.Value): ApiLiteral;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ApiLiteral.AsObject;
        static toObject(includeInstance: boolean, msg: ApiLiteral): ApiLiteral.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ApiLiteral, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ApiLiteral;
        static deserializeBinaryFromReader(message: ApiLiteral, reader: jspb.BinaryReader): ApiLiteral;
    }

    export namespace ApiLiteral {
        export type AsObject = {
            data?: google_protobuf_struct_pb.Value.AsObject,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        API = 1,
        LITERAL = 2,
        API_LITERAL = 5,
    }

    export enum GitRefCase {
        GIT_REF_NOT_SET = 0,
        COMMIT_ID = 3,
        BRANCH_NAME = 4,
    }

}

export class SignRequest extends jspb.Message { 

    hasResource(): boolean;
    clearResource(): void;
    getResource(): Resource | undefined;
    setResource(value?: Resource): SignRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SignRequest): SignRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignRequest;
    static deserializeBinaryFromReader(message: SignRequest, reader: jspb.BinaryReader): SignRequest;
}

export namespace SignRequest {
    export type AsObject = {
        resource?: Resource.AsObject,
    }
}

export class SignResponse extends jspb.Message { 

    hasSignature(): boolean;
    clearSignature(): void;
    getSignature(): utils_v1_utils_pb.Signature | undefined;
    setSignature(value?: utils_v1_utils_pb.Signature): SignResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SignResponse): SignResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignResponse;
    static deserializeBinaryFromReader(message: SignResponse, reader: jspb.BinaryReader): SignResponse;
}

export namespace SignResponse {
    export type AsObject = {
        signature?: utils_v1_utils_pb.Signature.AsObject,
    }
}

export class VerifyRequest extends jspb.Message { 
    clearResourcesList(): void;
    getResourcesList(): Array<Resource>;
    setResourcesList(value: Array<Resource>): VerifyRequest;
    addResources(value?: Resource, index?: number): Resource;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VerifyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: VerifyRequest): VerifyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VerifyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VerifyRequest;
    static deserializeBinaryFromReader(message: VerifyRequest, reader: jspb.BinaryReader): VerifyRequest;
}

export namespace VerifyRequest {
    export type AsObject = {
        resourcesList: Array<Resource.AsObject>,
    }
}

export class VerifyResponse extends jspb.Message { 
    getKeyId(): string;
    setKeyId(value: string): VerifyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VerifyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: VerifyResponse): VerifyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VerifyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VerifyResponse;
    static deserializeBinaryFromReader(message: VerifyResponse, reader: jspb.BinaryReader): VerifyResponse;
}

export namespace VerifyResponse {
    export type AsObject = {
        keyId: string,
    }
}
