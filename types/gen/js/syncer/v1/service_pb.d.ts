// package: syncer.v1
// file: syncer/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as event_v1_service_pb from "../../event/v1/service_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as syncer_v1_syncer_pb from "../../syncer/v1/syncer_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class GetConfigurationMetadataRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): GetConfigurationMetadataRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationMetadataRequest): GetConfigurationMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationMetadataRequest;
    static deserializeBinaryFromReader(message: GetConfigurationMetadataRequest, reader: jspb.BinaryReader): GetConfigurationMetadataRequest;
}

export namespace GetConfigurationMetadataRequest {
    export type AsObject = {
        integrationId: string,
    }
}

export class GetConfigurationMetadataResponse extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): GetConfigurationMetadataResponse;

    getConfigurationsMap(): jspb.Map<string, google_protobuf_struct_pb.Struct>;
    clearConfigurationsMap(): void;
    getIntegrationType(): string;
    setIntegrationType(value: string): GetConfigurationMetadataResponse;
    getOrganizationId(): string;
    setOrganizationId(value: string): GetConfigurationMetadataResponse;
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): GetConfigurationMetadataResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationMetadataResponse): GetConfigurationMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationMetadataResponse;
    static deserializeBinaryFromReader(message: GetConfigurationMetadataResponse, reader: jspb.BinaryReader): GetConfigurationMetadataResponse;
}

export namespace GetConfigurationMetadataResponse {
    export type AsObject = {
        integrationId: string,

        configurationsMap: Array<[string, google_protobuf_struct_pb.Struct.AsObject]>,
        integrationType: string,
        organizationId: string,
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
    }
}

export class SyncRequest extends jspb.Message { 
    clearIntegrationIdsList(): void;
    getIntegrationIdsList(): Array<string>;
    setIntegrationIdsList(value: Array<string>): SyncRequest;
    addIntegrationIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SyncRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SyncRequest): SyncRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SyncRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SyncRequest;
    static deserializeBinaryFromReader(message: SyncRequest, reader: jspb.BinaryReader): SyncRequest;
}

export namespace SyncRequest {
    export type AsObject = {
        integrationIdsList: Array<string>,
    }
}

export class SyncResponse extends jspb.Message { 

    getIntegrationsSyncedMap(): jspb.Map<string, SyncResponse.Integration>;
    clearIntegrationsSyncedMap(): void;
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): SyncResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SyncResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SyncResponse): SyncResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SyncResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SyncResponse;
    static deserializeBinaryFromReader(message: SyncResponse, reader: jspb.BinaryReader): SyncResponse;
}

export namespace SyncResponse {
    export type AsObject = {

        integrationsSyncedMap: Array<[string, SyncResponse.Integration.AsObject]>,
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
    }


    export class Integration extends jspb.Message { 
        clearConfigurationidsList(): void;
        getConfigurationidsList(): Array<string>;
        setConfigurationidsList(value: Array<string>): Integration;
        addConfigurationids(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Integration.AsObject;
        static toObject(includeInstance: boolean, msg: Integration): Integration.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Integration, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Integration;
        static deserializeBinaryFromReader(message: Integration, reader: jspb.BinaryReader): Integration;
    }

    export namespace Integration {
        export type AsObject = {
            configurationidsList: Array<string>,
        }
    }

}

export class UpsertMetadataRequest extends jspb.Message { 
    clearMetadataList(): void;
    getMetadataList(): Array<syncer_v1_syncer_pb.Metadata>;
    setMetadataList(value: Array<syncer_v1_syncer_pb.Metadata>): UpsertMetadataRequest;
    addMetadata(value?: syncer_v1_syncer_pb.Metadata, index?: number): syncer_v1_syncer_pb.Metadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpsertMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpsertMetadataRequest): UpsertMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpsertMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpsertMetadataRequest;
    static deserializeBinaryFromReader(message: UpsertMetadataRequest, reader: jspb.BinaryReader): UpsertMetadataRequest;
}

export namespace UpsertMetadataRequest {
    export type AsObject = {
        metadataList: Array<syncer_v1_syncer_pb.Metadata.AsObject>,
    }
}

export class UpsertMetadataResponse extends jspb.Message { 
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): UpsertMetadataResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpsertMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpsertMetadataResponse): UpsertMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpsertMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpsertMetadataResponse;
    static deserializeBinaryFromReader(message: UpsertMetadataResponse, reader: jspb.BinaryReader): UpsertMetadataResponse;
}

export namespace UpsertMetadataResponse {
    export type AsObject = {
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
    }
}

export class DeleteMetadataRequest extends jspb.Message { 
    getIntegrationId(): string;
    setIntegrationId(value: string): DeleteMetadataRequest;
    clearConfigurationIdsList(): void;
    getConfigurationIdsList(): Array<string>;
    setConfigurationIdsList(value: Array<string>): DeleteMetadataRequest;
    addConfigurationIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteMetadataRequest): DeleteMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteMetadataRequest;
    static deserializeBinaryFromReader(message: DeleteMetadataRequest, reader: jspb.BinaryReader): DeleteMetadataRequest;
}

export namespace DeleteMetadataRequest {
    export type AsObject = {
        integrationId: string,
        configurationIdsList: Array<string>,
    }
}

export class DeleteMetadataResponse extends jspb.Message { 
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): DeleteMetadataResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteMetadataResponse): DeleteMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteMetadataResponse;
    static deserializeBinaryFromReader(message: DeleteMetadataResponse, reader: jspb.BinaryReader): DeleteMetadataResponse;
}

export namespace DeleteMetadataResponse {
    export type AsObject = {
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
    }
}
