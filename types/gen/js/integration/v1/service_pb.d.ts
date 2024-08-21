// package: integration.v1
// file: integration/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class GetIntegrationResponse extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): Integration | undefined;
    setData(value?: Integration): GetIntegrationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetIntegrationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetIntegrationResponse): GetIntegrationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetIntegrationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetIntegrationResponse;
    static deserializeBinaryFromReader(message: GetIntegrationResponse, reader: jspb.BinaryReader): GetIntegrationResponse;
}

export namespace GetIntegrationResponse {
    export type AsObject = {
        data?: Integration.AsObject,
    }
}

export class GetIntegrationsRequest extends jspb.Message { 

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): GetIntegrationsRequest;
    clearIdsList(): void;
    getIdsList(): Array<string>;
    setIdsList(value: Array<string>): GetIntegrationsRequest;
    addIds(value: string, index?: number): string;

    hasKind(): boolean;
    clearKind(): void;
    getKind(): Kind | undefined;
    setKind(value: Kind): GetIntegrationsRequest;

    hasSlug(): boolean;
    clearSlug(): void;
    getSlug(): string | undefined;
    setSlug(value: string): GetIntegrationsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetIntegrationsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetIntegrationsRequest): GetIntegrationsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetIntegrationsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetIntegrationsRequest;
    static deserializeBinaryFromReader(message: GetIntegrationsRequest, reader: jspb.BinaryReader): GetIntegrationsRequest;
}

export namespace GetIntegrationsRequest {
    export type AsObject = {
        profile?: common_v1_common_pb.Profile.AsObject,
        idsList: Array<string>,
        kind?: Kind,
        slug?: string,
    }
}

export class GetIntegrationsResponse extends jspb.Message { 
    clearDataList(): void;
    getDataList(): Array<Integration>;
    setDataList(value: Array<Integration>): GetIntegrationsResponse;
    addData(value?: Integration, index?: number): Integration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetIntegrationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetIntegrationsResponse): GetIntegrationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetIntegrationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetIntegrationsResponse;
    static deserializeBinaryFromReader(message: GetIntegrationsResponse, reader: jspb.BinaryReader): GetIntegrationsResponse;
}

export namespace GetIntegrationsResponse {
    export type AsObject = {
        dataList: Array<Integration.AsObject>,
    }
}

export class Configuration extends jspb.Message { 
    getId(): string;
    setId(value: string): Configuration;
    getCreated(): string;
    setCreated(value: string): Configuration;
    getIntegrationId(): string;
    setIntegrationId(value: string): Configuration;

    hasConfiguration(): boolean;
    clearConfiguration(): void;
    getConfiguration(): google_protobuf_struct_pb.Struct | undefined;
    setConfiguration(value?: google_protobuf_struct_pb.Struct): Configuration;
    getIsDefault(): boolean;
    setIsDefault(value: boolean): Configuration;
    clearProfileIdsList(): void;
    getProfileIdsList(): Array<string>;
    setProfileIdsList(value: Array<string>): Configuration;
    addProfileIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Configuration.AsObject;
    static toObject(includeInstance: boolean, msg: Configuration): Configuration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Configuration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Configuration;
    static deserializeBinaryFromReader(message: Configuration, reader: jspb.BinaryReader): Configuration;
}

export namespace Configuration {
    export type AsObject = {
        id: string,
        created: string,
        integrationId: string,
        configuration?: google_protobuf_struct_pb.Struct.AsObject,
        isDefault: boolean,
        profileIdsList: Array<string>,
    }
}

export class Integration extends jspb.Message { 
    getId(): string;
    setId(value: string): Integration;
    getCreated(): string;
    setCreated(value: string): Integration;
    getUpdated(): string;
    setUpdated(value: string): Integration;
    getName(): string;
    setName(value: string): Integration;
    getPluginId(): string;
    setPluginId(value: string): Integration;
    getOrganizationId(): string;
    setOrganizationId(value: string): Integration;
    getDemoIntegrationId(): string;
    setDemoIntegrationId(value: string): Integration;
    clearConfigurationsList(): void;
    getConfigurationsList(): Array<Configuration>;
    setConfigurationsList(value: Array<Configuration>): Integration;
    addConfigurations(value?: Configuration, index?: number): Configuration;
    getIsUserConfigured(): boolean;
    setIsUserConfigured(value: boolean): Integration;
    getSlug(): string;
    setSlug(value: string): Integration;

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
        id: string,
        created: string,
        updated: string,
        name: string,
        pluginId: string,
        organizationId: string,
        demoIntegrationId: string,
        configurationsList: Array<Configuration.AsObject>,
        isUserConfigured: boolean,
        slug: string,
    }
}

export enum Kind {
    KIND_UNSPECIFIED = 0,
    KIND_PLUGIN = 1,
    KIND_SECRET = 2,
}
