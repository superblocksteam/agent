// package: worker.v1
// file: worker/v1/sandbox_integration_executor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_service_pb from "../../api/v1/service_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class ExecuteIntegrationRequest extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): ExecuteIntegrationRequest;
    getIntegrationId(): string;
    setIntegrationId(value: string): ExecuteIntegrationRequest;
    getPluginId(): string;
    setPluginId(value: string): ExecuteIntegrationRequest;

    hasActionConfiguration(): boolean;
    clearActionConfiguration(): void;
    getActionConfiguration(): google_protobuf_struct_pb.Struct | undefined;
    setActionConfiguration(value?: google_protobuf_struct_pb.Struct): ExecuteIntegrationRequest;
    getViewMode(): api_v1_service_pb.ViewMode;
    setViewMode(value: api_v1_service_pb.ViewMode): ExecuteIntegrationRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): ExecuteIntegrationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteIntegrationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteIntegrationRequest): ExecuteIntegrationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteIntegrationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteIntegrationRequest;
    static deserializeBinaryFromReader(message: ExecuteIntegrationRequest, reader: jspb.BinaryReader): ExecuteIntegrationRequest;
}

export namespace ExecuteIntegrationRequest {
    export type AsObject = {
        executionId: string,
        integrationId: string,
        pluginId: string,
        actionConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
        viewMode: api_v1_service_pb.ViewMode,
        profile?: common_v1_common_pb.Profile.AsObject,
    }
}

export class ExecuteIntegrationResponse extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): ExecuteIntegrationResponse;

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): google_protobuf_struct_pb.Value | undefined;
    setOutput(value?: google_protobuf_struct_pb.Value): ExecuteIntegrationResponse;
    getError(): string;
    setError(value: string): ExecuteIntegrationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteIntegrationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteIntegrationResponse): ExecuteIntegrationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteIntegrationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteIntegrationResponse;
    static deserializeBinaryFromReader(message: ExecuteIntegrationResponse, reader: jspb.BinaryReader): ExecuteIntegrationResponse;
}

export namespace ExecuteIntegrationResponse {
    export type AsObject = {
        executionId: string,
        output?: google_protobuf_struct_pb.Value.AsObject,
        error: string,
    }
}
