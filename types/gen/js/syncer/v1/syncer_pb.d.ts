// package: syncer.v1
// file: syncer/v1/syncer.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as ai_v1_metadata_pb from "../../ai/v1/metadata_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Metadata extends jspb.Message { 
    getConfigurationId(): string;
    setConfigurationId(value: string): Metadata;
    getIntegrationId(): string;
    setIntegrationId(value: string): Metadata;

    hasRawMetadata(): boolean;
    clearRawMetadata(): void;
    getRawMetadata(): ai_v1_metadata_pb.Metadata | undefined;
    setRawMetadata(value?: ai_v1_metadata_pb.Metadata): Metadata;

    hasUpdatedDatetimeUtc(): boolean;
    clearUpdatedDatetimeUtc(): void;
    getUpdatedDatetimeUtc(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setUpdatedDatetimeUtc(value?: google_protobuf_timestamp_pb.Timestamp): Metadata;
    getIntegrationType(): string;
    setIntegrationType(value: string): Metadata;
    getOrganizationId(): string;
    setOrganizationId(value: string): Metadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Metadata.AsObject;
    static toObject(includeInstance: boolean, msg: Metadata): Metadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Metadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Metadata;
    static deserializeBinaryFromReader(message: Metadata, reader: jspb.BinaryReader): Metadata;
}

export namespace Metadata {
    export type AsObject = {
        configurationId: string,
        integrationId: string,
        rawMetadata?: ai_v1_metadata_pb.Metadata.AsObject,
        updatedDatetimeUtc?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        integrationType: string,
        organizationId: string,
    }
}
