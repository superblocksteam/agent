// package: worker.v1
// file: worker/v1/sandbox_transport.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_event_pb from "../../api/v1/event_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as transport_v1_transport_pb from "../../transport/v1/transport_pb";

export class RequestMetadata extends jspb.Message { 
    getPluginname(): string;
    setPluginname(value: string): RequestMetadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: RequestMetadata): RequestMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestMetadata;
    static deserializeBinaryFromReader(message: RequestMetadata, reader: jspb.BinaryReader): RequestMetadata;
}

export namespace RequestMetadata {
    export type AsObject = {
        pluginname: string,
    }
}

export class ExecuteRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): RequestMetadata | undefined;
    setMetadata(value?: RequestMetadata): ExecuteRequest;

    hasProps(): boolean;
    clearProps(): void;
    getProps(): transport_v1_transport_pb.Request.Data.Data.Props | undefined;
    setProps(value?: transport_v1_transport_pb.Request.Data.Data.Props): ExecuteRequest;

    hasQuotas(): boolean;
    clearQuotas(): void;
    getQuotas(): transport_v1_transport_pb.Request.Data.Data.Quota | undefined;
    setQuotas(value?: transport_v1_transport_pb.Request.Data.Data.Quota): ExecuteRequest;

    hasPinned(): boolean;
    clearPinned(): void;
    getPinned(): transport_v1_transport_pb.Request.Data.Pinned | undefined;
    setPinned(value?: transport_v1_transport_pb.Request.Data.Pinned): ExecuteRequest;
    getVariableStoreAddress(): string;
    setVariableStoreAddress(value: string): ExecuteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteRequest): ExecuteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteRequest;
    static deserializeBinaryFromReader(message: ExecuteRequest, reader: jspb.BinaryReader): ExecuteRequest;
}

export namespace ExecuteRequest {
    export type AsObject = {
        metadata?: RequestMetadata.AsObject,
        props?: transport_v1_transport_pb.Request.Data.Data.Props.AsObject,
        quotas?: transport_v1_transport_pb.Request.Data.Data.Quota.AsObject,
        pinned?: transport_v1_transport_pb.Request.Data.Pinned.AsObject,
        variableStoreAddress: string,
    }
}

export class ExecuteResponse extends jspb.Message { 

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): api_v1_event_pb.OutputOld | undefined;
    setOutput(value?: api_v1_event_pb.OutputOld): ExecuteResponse;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): ExecuteResponse;
    getAutherror(): boolean;
    setAutherror(value: boolean): ExecuteResponse;
    clearChildrenList(): void;
    getChildrenList(): Array<string>;
    setChildrenList(value: Array<string>): ExecuteResponse;
    addChildren(value: string, index?: number): string;

    hasStarttime(): boolean;
    clearStarttime(): void;
    getStarttime(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setStarttime(value?: google_protobuf_timestamp_pb.Timestamp): ExecuteResponse;

    hasExecutiontime(): boolean;
    clearExecutiontime(): void;
    getExecutiontime(): google_protobuf_duration_pb.Duration | undefined;
    setExecutiontime(value?: google_protobuf_duration_pb.Duration): ExecuteResponse;
    clearStructuredlogList(): void;
    getStructuredlogList(): Array<StructuredLog>;
    setStructuredlogList(value: Array<StructuredLog>): ExecuteResponse;
    addStructuredlog(value?: StructuredLog, index?: number): StructuredLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteResponse): ExecuteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteResponse;
    static deserializeBinaryFromReader(message: ExecuteResponse, reader: jspb.BinaryReader): ExecuteResponse;
}

export namespace ExecuteResponse {
    export type AsObject = {
        output?: api_v1_event_pb.OutputOld.AsObject,
        error?: common_v1_errors_pb.Error.AsObject,
        autherror: boolean,
        childrenList: Array<string>,
        starttime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        executiontime?: google_protobuf_duration_pb.Duration.AsObject,
        structuredlogList: Array<StructuredLog.AsObject>,
    }
}

export class StreamRequest extends jspb.Message { 

    hasRequest(): boolean;
    clearRequest(): void;
    getRequest(): ExecuteRequest | undefined;
    setRequest(value?: ExecuteRequest): StreamRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamRequest): StreamRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamRequest;
    static deserializeBinaryFromReader(message: StreamRequest, reader: jspb.BinaryReader): StreamRequest;
}

export namespace StreamRequest {
    export type AsObject = {
        request?: ExecuteRequest.AsObject,
    }
}

export class StreamResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): google_protobuf_empty_pb.Empty | undefined;
    setResponse(value?: google_protobuf_empty_pb.Empty): StreamResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StreamResponse): StreamResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamResponse;
    static deserializeBinaryFromReader(message: StreamResponse, reader: jspb.BinaryReader): StreamResponse;
}

export namespace StreamResponse {
    export type AsObject = {
        response?: google_protobuf_empty_pb.Empty.AsObject,
    }
}

export class MetadataRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): RequestMetadata | undefined;
    setMetadata(value?: RequestMetadata): MetadataRequest;

    hasDatasourceconfig(): boolean;
    clearDatasourceconfig(): void;
    getDatasourceconfig(): google_protobuf_struct_pb.Struct | undefined;
    setDatasourceconfig(value?: google_protobuf_struct_pb.Struct): MetadataRequest;

    hasActionconfig(): boolean;
    clearActionconfig(): void;
    getActionconfig(): google_protobuf_struct_pb.Struct | undefined;
    setActionconfig(value?: google_protobuf_struct_pb.Struct): MetadataRequest;
    getVariableStoreAddress(): string;
    setVariableStoreAddress(value: string): MetadataRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataRequest): MetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataRequest;
    static deserializeBinaryFromReader(message: MetadataRequest, reader: jspb.BinaryReader): MetadataRequest;
}

export namespace MetadataRequest {
    export type AsObject = {
        metadata?: RequestMetadata.AsObject,
        datasourceconfig?: google_protobuf_struct_pb.Struct.AsObject,
        actionconfig?: google_protobuf_struct_pb.Struct.AsObject,
        variableStoreAddress: string,
    }
}

export class TestRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): RequestMetadata | undefined;
    setMetadata(value?: RequestMetadata): TestRequest;

    hasDatasourceconfig(): boolean;
    clearDatasourceconfig(): void;
    getDatasourceconfig(): google_protobuf_struct_pb.Struct | undefined;
    setDatasourceconfig(value?: google_protobuf_struct_pb.Struct): TestRequest;

    hasActionconfig(): boolean;
    clearActionconfig(): void;
    getActionconfig(): google_protobuf_struct_pb.Struct | undefined;
    setActionconfig(value?: google_protobuf_struct_pb.Struct): TestRequest;
    getVariableStoreAddress(): string;
    setVariableStoreAddress(value: string): TestRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TestRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TestRequest): TestRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TestRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TestRequest;
    static deserializeBinaryFromReader(message: TestRequest, reader: jspb.BinaryReader): TestRequest;
}

export namespace TestRequest {
    export type AsObject = {
        metadata?: RequestMetadata.AsObject,
        datasourceconfig?: google_protobuf_struct_pb.Struct.AsObject,
        actionconfig?: google_protobuf_struct_pb.Struct.AsObject,
        variableStoreAddress: string,
    }
}

export class PreDeleteRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): RequestMetadata | undefined;
    setMetadata(value?: RequestMetadata): PreDeleteRequest;

    hasDatasourceconfig(): boolean;
    clearDatasourceconfig(): void;
    getDatasourceconfig(): google_protobuf_struct_pb.Struct | undefined;
    setDatasourceconfig(value?: google_protobuf_struct_pb.Struct): PreDeleteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PreDeleteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PreDeleteRequest): PreDeleteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PreDeleteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PreDeleteRequest;
    static deserializeBinaryFromReader(message: PreDeleteRequest, reader: jspb.BinaryReader): PreDeleteRequest;
}

export namespace PreDeleteRequest {
    export type AsObject = {
        metadata?: RequestMetadata.AsObject,
        datasourceconfig?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class StructuredLog extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): StructuredLog;
    getLevel(): StructuredLog.Level;
    setLevel(value: StructuredLog.Level): StructuredLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StructuredLog.AsObject;
    static toObject(includeInstance: boolean, msg: StructuredLog): StructuredLog.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StructuredLog, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StructuredLog;
    static deserializeBinaryFromReader(message: StructuredLog, reader: jspb.BinaryReader): StructuredLog;
}

export namespace StructuredLog {
    export type AsObject = {
        message: string,
        level: StructuredLog.Level,
    }

    export enum Level {
    LEVEL_UNSPECIFIED = 0,
    LEVEL_INFO = 1,
    LEVEL_WARN = 2,
    LEVEL_ERROR = 3,
    }

}
