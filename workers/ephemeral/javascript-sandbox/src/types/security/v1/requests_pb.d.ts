// package: security.v1
// file: security/v1/requests.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as security_v1_service_pb from "../../security/v1/service_pb";

export class ResourcesToResignRequest extends jspb.Message { 
    getClaimedBy(): string;
    setClaimedBy(value: string): ResourcesToResignRequest;
    getLimit(): number;
    setLimit(value: number): ResourcesToResignRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResourcesToResignRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ResourcesToResignRequest): ResourcesToResignRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResourcesToResignRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResourcesToResignRequest;
    static deserializeBinaryFromReader(message: ResourcesToResignRequest, reader: jspb.BinaryReader): ResourcesToResignRequest;
}

export namespace ResourcesToResignRequest {
    export type AsObject = {
        claimedBy: string,
        limit: number,
    }
}

export class ResourcesToResignResponse extends jspb.Message { 
    clearResourcesList(): void;
    getResourcesList(): Array<security_v1_service_pb.Resource>;
    setResourcesList(value: Array<security_v1_service_pb.Resource>): ResourcesToResignResponse;
    addResources(value?: security_v1_service_pb.Resource, index?: number): security_v1_service_pb.Resource;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResourcesToResignResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ResourcesToResignResponse): ResourcesToResignResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResourcesToResignResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResourcesToResignResponse;
    static deserializeBinaryFromReader(message: ResourcesToResignResponse, reader: jspb.BinaryReader): ResourcesToResignResponse;
}

export namespace ResourcesToResignResponse {
    export type AsObject = {
        resourcesList: Array<security_v1_service_pb.Resource.AsObject>,
    }
}

export class KeyRotation extends jspb.Message { 
    getId(): string;
    setId(value: string): KeyRotation;
    getStatus(): KeyRotationStatus;
    setStatus(value: KeyRotationStatus): KeyRotation;
    getResourcesCompleted(): number;
    setResourcesCompleted(value: number): KeyRotation;
    getResourcesTotal(): number;
    setResourcesTotal(value: number): KeyRotation;
    getSigningKeyId(): string;
    setSigningKeyId(value: string): KeyRotation;

    hasCreated(): boolean;
    clearCreated(): void;
    getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCreated(value?: google_protobuf_timestamp_pb.Timestamp): KeyRotation;

    hasUpdated(): boolean;
    clearUpdated(): void;
    getUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setUpdated(value?: google_protobuf_timestamp_pb.Timestamp): KeyRotation;

    hasCompleted(): boolean;
    clearCompleted(): void;
    getCompleted(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCompleted(value?: google_protobuf_timestamp_pb.Timestamp): KeyRotation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyRotation.AsObject;
    static toObject(includeInstance: boolean, msg: KeyRotation): KeyRotation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeyRotation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeyRotation;
    static deserializeBinaryFromReader(message: KeyRotation, reader: jspb.BinaryReader): KeyRotation;
}

export namespace KeyRotation {
    export type AsObject = {
        id: string,
        status: KeyRotationStatus,
        resourcesCompleted: number,
        resourcesTotal: number,
        signingKeyId: string,
        created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        updated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        completed?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    }
}

export class KeyRotationsResponse extends jspb.Message { 
    clearKeyRotationsList(): void;
    getKeyRotationsList(): Array<KeyRotation>;
    setKeyRotationsList(value: Array<KeyRotation>): KeyRotationsResponse;
    addKeyRotations(value?: KeyRotation, index?: number): KeyRotation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyRotationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: KeyRotationsResponse): KeyRotationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeyRotationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeyRotationsResponse;
    static deserializeBinaryFromReader(message: KeyRotationsResponse, reader: jspb.BinaryReader): KeyRotationsResponse;
}

export namespace KeyRotationsResponse {
    export type AsObject = {
        keyRotationsList: Array<KeyRotation.AsObject>,
    }
}

export enum KeyRotationStatus {
    KEY_ROTATION_STATUS_UNSPECIFIED = 0,
    KEY_ROTATION_STATUS_IN_PROGRESS = 1,
    KEY_ROTATION_STATUS_COMPLETED = 2,
    KEY_ROTATION_STATUS_FAILED = 3,
    KEY_ROTATION_STATUS_CANCELED = 4,
}
