// package: integration.v1
// file: integration/v1/configuration.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as api_v1_service_pb from "../../api/v1/service_pb";

export class GetConfigurationsRequest extends jspb.Message { 

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): api_v1_service_pb.Profile | undefined;
    setProfile(value?: api_v1_service_pb.Profile): GetConfigurationsRequest;
    clearIntegrationIdsList(): void;
    getIntegrationIdsList(): Array<string>;
    setIntegrationIdsList(value: Array<string>): GetConfigurationsRequest;
    addIntegrationIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationsRequest): GetConfigurationsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationsRequest;
    static deserializeBinaryFromReader(message: GetConfigurationsRequest, reader: jspb.BinaryReader): GetConfigurationsRequest;
}

export namespace GetConfigurationsRequest {
    export type AsObject = {
        profile?: api_v1_service_pb.Profile.AsObject,
        integrationIdsList: Array<string>,
    }
}

export class GetConfigurationsResponse extends jspb.Message { 

    getConfigurationsMap(): jspb.Map<string, google_protobuf_struct_pb.Struct>;
    clearConfigurationsMap(): void;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): GetConfigurationsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationsResponse): GetConfigurationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationsResponse;
    static deserializeBinaryFromReader(message: GetConfigurationsResponse, reader: jspb.BinaryReader): GetConfigurationsResponse;
}

export namespace GetConfigurationsResponse {
    export type AsObject = {

        configurationsMap: Array<[string, google_protobuf_struct_pb.Struct.AsObject]>,
        error?: common_v1_errors_pb.Error.AsObject,
    }
}
