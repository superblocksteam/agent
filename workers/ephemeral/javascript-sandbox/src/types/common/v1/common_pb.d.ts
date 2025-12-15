// package: common.v1
// file: common/v1/common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Timestamps extends jspb.Message { 

    hasCreated(): boolean;
    clearCreated(): void;
    getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Timestamps;

    hasUpdated(): boolean;
    clearUpdated(): void;
    getUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setUpdated(value?: google_protobuf_timestamp_pb.Timestamp): Timestamps;

    hasDeactivated(): boolean;
    clearDeactivated(): void;
    getDeactivated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setDeactivated(value?: google_protobuf_timestamp_pb.Timestamp): Timestamps;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Timestamps.AsObject;
    static toObject(includeInstance: boolean, msg: Timestamps): Timestamps.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Timestamps, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Timestamps;
    static deserializeBinaryFromReader(message: Timestamps, reader: jspb.BinaryReader): Timestamps;
}

export namespace Timestamps {
    export type AsObject = {
        created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        updated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        deactivated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    }
}

export class Metadata extends jspb.Message { 
    getId(): string;
    setId(value: string): Metadata;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): Metadata;
    getName(): string;
    setName(value: string): Metadata;
    getOrganization(): string;
    setOrganization(value: string): Metadata;

    hasFolder(): boolean;
    clearFolder(): void;
    getFolder(): string | undefined;
    setFolder(value: string): Metadata;

    hasTimestamps(): boolean;
    clearTimestamps(): void;
    getTimestamps(): Timestamps | undefined;
    setTimestamps(value?: Timestamps): Metadata;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): string | undefined;
    setVersion(value: string): Metadata;

    getTagsMap(): jspb.Map<string, string>;
    clearTagsMap(): void;

    hasType(): boolean;
    clearType(): void;
    getType(): string | undefined;
    setType(value: string): Metadata;

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
        id: string,
        description?: string,
        name: string,
        organization: string,
        folder?: string,
        timestamps?: Timestamps.AsObject,
        version?: string,

        tagsMap: Array<[string, string]>,
        type?: string,
    }
}

export class Profile extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): string | undefined;
    setId(value: string): Profile;

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Profile;

    hasEnvironment(): boolean;
    clearEnvironment(): void;
    getEnvironment(): string | undefined;
    setEnvironment(value: string): Profile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Profile.AsObject;
    static toObject(includeInstance: boolean, msg: Profile): Profile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Profile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Profile;
    static deserializeBinaryFromReader(message: Profile, reader: jspb.BinaryReader): Profile;
}

export namespace Profile {
    export type AsObject = {
        id?: string,
        name?: string,
        environment?: string,
    }
}

export enum UserType {
    USER_TYPE_UNSPECIFIED = 0,
    USER_TYPE_SUPERBLOCKS = 1,
    USER_TYPE_EXTERNAL = 2,
}
