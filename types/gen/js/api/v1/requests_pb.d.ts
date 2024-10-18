// package: api.v1
// file: api/v1/requests.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_api_pb from "../../api/v1/api_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_api_pb from "../../common/v1/api_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as utils_v1_utils_pb from "../../utils/v1/utils_pb";

export class PatchApi extends jspb.Message { 

    hasApi(): boolean;
    clearApi(): void;
    getApi(): api_v1_api_pb.Api | undefined;
    setApi(value?: api_v1_api_pb.Api): PatchApi;

    hasCommitId(): boolean;
    clearCommitId(): void;
    getCommitId(): string;
    setCommitId(value: string): PatchApi;

    hasBranchName(): boolean;
    clearBranchName(): void;
    getBranchName(): string;
    setBranchName(value: string): PatchApi;

    getGitRefCase(): PatchApi.GitRefCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PatchApi.AsObject;
    static toObject(includeInstance: boolean, msg: PatchApi): PatchApi.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PatchApi, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PatchApi;
    static deserializeBinaryFromReader(message: PatchApi, reader: jspb.BinaryReader): PatchApi;
}

export namespace PatchApi {
    export type AsObject = {
        api?: api_v1_api_pb.Api.AsObject,
        commitId: string,
        branchName: string,
    }

    export enum GitRefCase {
        GIT_REF_NOT_SET = 0,
        COMMIT_ID = 2,
        BRANCH_NAME = 3,
    }

}

export class PatchApisRequest extends jspb.Message { 
    clearPatchesList(): void;
    getPatchesList(): Array<PatchApi>;
    setPatchesList(value: Array<PatchApi>): PatchApisRequest;
    addPatches(value?: PatchApi, index?: number): PatchApi;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PatchApisRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PatchApisRequest): PatchApisRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PatchApisRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PatchApisRequest;
    static deserializeBinaryFromReader(message: PatchApisRequest, reader: jspb.BinaryReader): PatchApisRequest;
}

export namespace PatchApisRequest {
    export type AsObject = {
        patchesList: Array<PatchApi.AsObject>,
    }
}

export class PatchApisResponse extends jspb.Message { 
    clearStatusesList(): void;
    getStatusesList(): Array<PatchApisResponse.Status>;
    setStatusesList(value: Array<PatchApisResponse.Status>): PatchApisResponse;
    addStatuses(value?: PatchApisResponse.Status, index?: number): PatchApisResponse.Status;

    getLinksMap(): jspb.Map<string, common_v1_api_pb.Link>;
    clearLinksMap(): void;
    clearLinksV2List(): void;
    getLinksV2List(): Array<common_v1_api_pb.Links>;
    setLinksV2List(value: Array<common_v1_api_pb.Links>): PatchApisResponse;
    addLinksV2(value?: common_v1_api_pb.Links, index?: number): common_v1_api_pb.Links;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PatchApisResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PatchApisResponse): PatchApisResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PatchApisResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PatchApisResponse;
    static deserializeBinaryFromReader(message: PatchApisResponse, reader: jspb.BinaryReader): PatchApisResponse;
}

export namespace PatchApisResponse {
    export type AsObject = {
        statusesList: Array<PatchApisResponse.Status.AsObject>,

        linksMap: Array<[string, common_v1_api_pb.Link.AsObject]>,
        linksV2List: Array<common_v1_api_pb.Links.AsObject>,
    }


    export class Status extends jspb.Message { 
        getApiId(): string;
        setApiId(value: string): Status;
        getCode(): number;
        setCode(value: number): Status;
        getMessage(): string;
        setMessage(value: string): Status;

        hasError(): boolean;
        clearError(): void;
        getError(): common_v1_errors_pb.Error | undefined;
        setError(value?: common_v1_errors_pb.Error): Status;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Status.AsObject;
        static toObject(includeInstance: boolean, msg: Status): Status.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Status, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Status;
        static deserializeBinaryFromReader(message: Status, reader: jspb.BinaryReader): Status;
    }

    export namespace Status {
        export type AsObject = {
            apiId: string,
            code: number,
            message: string,
            error?: common_v1_errors_pb.Error.AsObject,
        }
    }

}

export class UpdateApiSignature extends jspb.Message { 
    getApiId(): string;
    setApiId(value: string): UpdateApiSignature;

    hasCommitId(): boolean;
    clearCommitId(): void;
    getCommitId(): string;
    setCommitId(value: string): UpdateApiSignature;

    hasBranchName(): boolean;
    clearBranchName(): void;
    getBranchName(): string;
    setBranchName(value: string): UpdateApiSignature;

    hasSignature(): boolean;
    clearSignature(): void;
    getSignature(): utils_v1_utils_pb.Signature | undefined;
    setSignature(value?: utils_v1_utils_pb.Signature): UpdateApiSignature;

    hasErrors(): boolean;
    clearErrors(): void;
    getErrors(): SignatureRotationErrors | undefined;
    setErrors(value?: SignatureRotationErrors): UpdateApiSignature;

    hasUpdated(): boolean;
    clearUpdated(): void;
    getUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setUpdated(value?: google_protobuf_timestamp_pb.Timestamp): UpdateApiSignature;

    getGitRefCase(): UpdateApiSignature.GitRefCase;
    getResultCase(): UpdateApiSignature.ResultCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApiSignature.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApiSignature): UpdateApiSignature.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApiSignature, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApiSignature;
    static deserializeBinaryFromReader(message: UpdateApiSignature, reader: jspb.BinaryReader): UpdateApiSignature;
}

export namespace UpdateApiSignature {
    export type AsObject = {
        apiId: string,
        commitId: string,
        branchName: string,
        signature?: utils_v1_utils_pb.Signature.AsObject,
        errors?: SignatureRotationErrors.AsObject,
        updated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    }

    export enum GitRefCase {
        GIT_REF_NOT_SET = 0,
        COMMIT_ID = 2,
        BRANCH_NAME = 3,
    }

    export enum ResultCase {
        RESULT_NOT_SET = 0,
        SIGNATURE = 4,
        ERRORS = 6,
    }

}

export class UpdateApplicationSignature extends jspb.Message { 
    getApplicationId(): string;
    setApplicationId(value: string): UpdateApplicationSignature;

    hasCommitId(): boolean;
    clearCommitId(): void;
    getCommitId(): string;
    setCommitId(value: string): UpdateApplicationSignature;

    hasBranchName(): boolean;
    clearBranchName(): void;
    getBranchName(): string;
    setBranchName(value: string): UpdateApplicationSignature;

    hasSignature(): boolean;
    clearSignature(): void;
    getSignature(): utils_v1_utils_pb.Signature | undefined;
    setSignature(value?: utils_v1_utils_pb.Signature): UpdateApplicationSignature;

    hasErrors(): boolean;
    clearErrors(): void;
    getErrors(): SignatureRotationErrors | undefined;
    setErrors(value?: SignatureRotationErrors): UpdateApplicationSignature;

    hasUpdated(): boolean;
    clearUpdated(): void;
    getUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setUpdated(value?: google_protobuf_timestamp_pb.Timestamp): UpdateApplicationSignature;
    getPageVersion(): number;
    setPageVersion(value: number): UpdateApplicationSignature;

    getGitRefCase(): UpdateApplicationSignature.GitRefCase;
    getResultCase(): UpdateApplicationSignature.ResultCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApplicationSignature.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApplicationSignature): UpdateApplicationSignature.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApplicationSignature, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApplicationSignature;
    static deserializeBinaryFromReader(message: UpdateApplicationSignature, reader: jspb.BinaryReader): UpdateApplicationSignature;
}

export namespace UpdateApplicationSignature {
    export type AsObject = {
        applicationId: string,
        commitId: string,
        branchName: string,
        signature?: utils_v1_utils_pb.Signature.AsObject,
        errors?: SignatureRotationErrors.AsObject,
        updated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        pageVersion: number,
    }

    export enum GitRefCase {
        GIT_REF_NOT_SET = 0,
        COMMIT_ID = 2,
        BRANCH_NAME = 3,
    }

    export enum ResultCase {
        RESULT_NOT_SET = 0,
        SIGNATURE = 4,
        ERRORS = 7,
    }

}

export class SignatureRotationErrors extends jspb.Message { 
    clearErrorsList(): void;
    getErrorsList(): Array<SignatureRotationError>;
    setErrorsList(value: Array<SignatureRotationError>): SignatureRotationErrors;
    addErrors(value?: SignatureRotationError, index?: number): SignatureRotationError;
    getKeyId(): string;
    setKeyId(value: string): SignatureRotationErrors;
    getPublicKey(): Uint8Array | string;
    getPublicKey_asU8(): Uint8Array;
    getPublicKey_asB64(): string;
    setPublicKey(value: Uint8Array | string): SignatureRotationErrors;
    getAlgorithm(): utils_v1_utils_pb.Signature.Algorithm;
    setAlgorithm(value: utils_v1_utils_pb.Signature.Algorithm): SignatureRotationErrors;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignatureRotationErrors.AsObject;
    static toObject(includeInstance: boolean, msg: SignatureRotationErrors): SignatureRotationErrors.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignatureRotationErrors, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignatureRotationErrors;
    static deserializeBinaryFromReader(message: SignatureRotationErrors, reader: jspb.BinaryReader): SignatureRotationErrors;
}

export namespace SignatureRotationErrors {
    export type AsObject = {
        errorsList: Array<SignatureRotationError.AsObject>,
        keyId: string,
        publicKey: Uint8Array | string,
        algorithm: utils_v1_utils_pb.Signature.Algorithm,
    }
}

export class SignatureRotationError extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): SignatureRotationError;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignatureRotationError.AsObject;
    static toObject(includeInstance: boolean, msg: SignatureRotationError): SignatureRotationError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignatureRotationError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignatureRotationError;
    static deserializeBinaryFromReader(message: SignatureRotationError, reader: jspb.BinaryReader): SignatureRotationError;
}

export namespace SignatureRotationError {
    export type AsObject = {
        message: string,
    }
}

export class UpdateApiSignaturesRequest extends jspb.Message { 
    clearUpdatesList(): void;
    getUpdatesList(): Array<UpdateApiSignature>;
    setUpdatesList(value: Array<UpdateApiSignature>): UpdateApiSignaturesRequest;
    addUpdates(value?: UpdateApiSignature, index?: number): UpdateApiSignature;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApiSignaturesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApiSignaturesRequest): UpdateApiSignaturesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApiSignaturesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApiSignaturesRequest;
    static deserializeBinaryFromReader(message: UpdateApiSignaturesRequest, reader: jspb.BinaryReader): UpdateApiSignaturesRequest;
}

export namespace UpdateApiSignaturesRequest {
    export type AsObject = {
        updatesList: Array<UpdateApiSignature.AsObject>,
    }
}

export class UpdateApplicationSignaturesRequest extends jspb.Message { 
    clearUpdatesList(): void;
    getUpdatesList(): Array<UpdateApplicationSignature>;
    setUpdatesList(value: Array<UpdateApplicationSignature>): UpdateApplicationSignaturesRequest;
    addUpdates(value?: UpdateApplicationSignature, index?: number): UpdateApplicationSignature;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApplicationSignaturesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApplicationSignaturesRequest): UpdateApplicationSignaturesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApplicationSignaturesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApplicationSignaturesRequest;
    static deserializeBinaryFromReader(message: UpdateApplicationSignaturesRequest, reader: jspb.BinaryReader): UpdateApplicationSignaturesRequest;
}

export namespace UpdateApplicationSignaturesRequest {
    export type AsObject = {
        updatesList: Array<UpdateApplicationSignature.AsObject>,
    }
}

export class UpdateApplicationSignaturesResponse extends jspb.Message { 
    clearStatusesList(): void;
    getStatusesList(): Array<UpdateApplicationSignaturesResponse.Status>;
    setStatusesList(value: Array<UpdateApplicationSignaturesResponse.Status>): UpdateApplicationSignaturesResponse;
    addStatuses(value?: UpdateApplicationSignaturesResponse.Status, index?: number): UpdateApplicationSignaturesResponse.Status;

    getLinksMap(): jspb.Map<string, common_v1_api_pb.Link>;
    clearLinksMap(): void;
    clearLinksV2List(): void;
    getLinksV2List(): Array<common_v1_api_pb.Links>;
    setLinksV2List(value: Array<common_v1_api_pb.Links>): UpdateApplicationSignaturesResponse;
    addLinksV2(value?: common_v1_api_pb.Links, index?: number): common_v1_api_pb.Links;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApplicationSignaturesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApplicationSignaturesResponse): UpdateApplicationSignaturesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApplicationSignaturesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApplicationSignaturesResponse;
    static deserializeBinaryFromReader(message: UpdateApplicationSignaturesResponse, reader: jspb.BinaryReader): UpdateApplicationSignaturesResponse;
}

export namespace UpdateApplicationSignaturesResponse {
    export type AsObject = {
        statusesList: Array<UpdateApplicationSignaturesResponse.Status.AsObject>,

        linksMap: Array<[string, common_v1_api_pb.Link.AsObject]>,
        linksV2List: Array<common_v1_api_pb.Links.AsObject>,
    }


    export class Status extends jspb.Message { 
        getApplicationId(): string;
        setApplicationId(value: string): Status;

        hasCommitId(): boolean;
        clearCommitId(): void;
        getCommitId(): string;
        setCommitId(value: string): Status;

        hasBranchName(): boolean;
        clearBranchName(): void;
        getBranchName(): string;
        setBranchName(value: string): Status;
        getCode(): number;
        setCode(value: number): Status;
        getMessage(): string;
        setMessage(value: string): Status;

        hasError(): boolean;
        clearError(): void;
        getError(): common_v1_errors_pb.Error | undefined;
        setError(value?: common_v1_errors_pb.Error): Status;

        getGitRefCase(): Status.GitRefCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Status.AsObject;
        static toObject(includeInstance: boolean, msg: Status): Status.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Status, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Status;
        static deserializeBinaryFromReader(message: Status, reader: jspb.BinaryReader): Status;
    }

    export namespace Status {
        export type AsObject = {
            applicationId: string,
            commitId: string,
            branchName: string,
            code: number,
            message: string,
            error?: common_v1_errors_pb.Error.AsObject,
        }

        export enum GitRefCase {
            GIT_REF_NOT_SET = 0,
            COMMIT_ID = 2,
            BRANCH_NAME = 3,
        }

    }

}

export class UpdateApiSignaturesResponse extends jspb.Message { 
    clearStatusesList(): void;
    getStatusesList(): Array<UpdateApiSignaturesResponse.Status>;
    setStatusesList(value: Array<UpdateApiSignaturesResponse.Status>): UpdateApiSignaturesResponse;
    addStatuses(value?: UpdateApiSignaturesResponse.Status, index?: number): UpdateApiSignaturesResponse.Status;

    getLinksMap(): jspb.Map<string, common_v1_api_pb.Link>;
    clearLinksMap(): void;
    clearLinksV2List(): void;
    getLinksV2List(): Array<common_v1_api_pb.Links>;
    setLinksV2List(value: Array<common_v1_api_pb.Links>): UpdateApiSignaturesResponse;
    addLinksV2(value?: common_v1_api_pb.Links, index?: number): common_v1_api_pb.Links;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateApiSignaturesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateApiSignaturesResponse): UpdateApiSignaturesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateApiSignaturesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateApiSignaturesResponse;
    static deserializeBinaryFromReader(message: UpdateApiSignaturesResponse, reader: jspb.BinaryReader): UpdateApiSignaturesResponse;
}

export namespace UpdateApiSignaturesResponse {
    export type AsObject = {
        statusesList: Array<UpdateApiSignaturesResponse.Status.AsObject>,

        linksMap: Array<[string, common_v1_api_pb.Link.AsObject]>,
        linksV2List: Array<common_v1_api_pb.Links.AsObject>,
    }


    export class Status extends jspb.Message { 
        getApiId(): string;
        setApiId(value: string): Status;

        hasCommitId(): boolean;
        clearCommitId(): void;
        getCommitId(): string;
        setCommitId(value: string): Status;

        hasBranchName(): boolean;
        clearBranchName(): void;
        getBranchName(): string;
        setBranchName(value: string): Status;
        getCode(): number;
        setCode(value: number): Status;
        getMessage(): string;
        setMessage(value: string): Status;

        hasError(): boolean;
        clearError(): void;
        getError(): common_v1_errors_pb.Error | undefined;
        setError(value?: common_v1_errors_pb.Error): Status;

        getGitRefCase(): Status.GitRefCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Status.AsObject;
        static toObject(includeInstance: boolean, msg: Status): Status.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Status, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Status;
        static deserializeBinaryFromReader(message: Status, reader: jspb.BinaryReader): Status;
    }

    export namespace Status {
        export type AsObject = {
            apiId: string,
            commitId: string,
            branchName: string,
            code: number,
            message: string,
            error?: common_v1_errors_pb.Error.AsObject,
        }

        export enum GitRefCase {
            GIT_REF_NOT_SET = 0,
            COMMIT_ID = 2,
            BRANCH_NAME = 3,
        }

    }

}

export class GenericBatch extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): GenericBatch.Items | undefined;
    setData(value?: GenericBatch.Items): GenericBatch;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GenericBatch.AsObject;
    static toObject(includeInstance: boolean, msg: GenericBatch): GenericBatch.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GenericBatch, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GenericBatch;
    static deserializeBinaryFromReader(message: GenericBatch, reader: jspb.BinaryReader): GenericBatch;
}

export namespace GenericBatch {
    export type AsObject = {
        data?: GenericBatch.Items.AsObject,
    }


    export class Items extends jspb.Message { 
        clearItemsList(): void;
        getItemsList(): Array<google_protobuf_struct_pb.Struct>;
        setItemsList(value: Array<google_protobuf_struct_pb.Struct>): Items;
        addItems(value?: google_protobuf_struct_pb.Struct, index?: number): google_protobuf_struct_pb.Struct;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Items.AsObject;
        static toObject(includeInstance: boolean, msg: Items): Items.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Items, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Items;
        static deserializeBinaryFromReader(message: Items, reader: jspb.BinaryReader): Items;
    }

    export namespace Items {
        export type AsObject = {
            itemsList: Array<google_protobuf_struct_pb.Struct.AsObject>,
        }
    }

}

export class GenericBatchResponse extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): GenericBatch | undefined;
    setData(value?: GenericBatch): GenericBatchResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GenericBatchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GenericBatchResponse): GenericBatchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GenericBatchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GenericBatchResponse;
    static deserializeBinaryFromReader(message: GenericBatchResponse, reader: jspb.BinaryReader): GenericBatchResponse;
}

export namespace GenericBatchResponse {
    export type AsObject = {
        data?: GenericBatch.AsObject,
    }
}
