// package: api.v1
// file: api/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_api_pb from "../../api/v1/api_pb";
import * as api_v1_event_pb from "../../api/v1/event_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as common_v1_health_pb from "../../common/v1/health_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as plugins_adls_v1_plugin_pb from "../../plugins/adls/v1/plugin_pb";
import * as plugins_cosmosdb_v1_plugin_pb from "../../plugins/cosmosdb/v1/plugin_pb";
import * as plugins_couchbase_v1_plugin_pb from "../../plugins/couchbase/v1/plugin_pb";
import * as plugins_kafka_v1_plugin_pb from "../../plugins/kafka/v1/plugin_pb";
import * as plugins_kinesis_v1_plugin_pb from "../../plugins/kinesis/v1/plugin_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as store_v1_store_pb from "../../store/v1/store_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class HealthRequest extends jspb.Message { 
    getDetailed(): boolean;
    setDetailed(value: boolean): HealthRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HealthRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HealthRequest): HealthRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HealthRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HealthRequest;
    static deserializeBinaryFromReader(message: HealthRequest, reader: jspb.BinaryReader): HealthRequest;
}

export namespace HealthRequest {
    export type AsObject = {
        detailed: boolean,
    }
}

export class ValidateRequest extends jspb.Message { 

    hasApi(): boolean;
    clearApi(): void;
    getApi(): api_v1_api_pb.Api | undefined;
    setApi(value?: api_v1_api_pb.Api): ValidateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValidateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ValidateRequest): ValidateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValidateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValidateRequest;
    static deserializeBinaryFromReader(message: ValidateRequest, reader: jspb.BinaryReader): ValidateRequest;
}

export namespace ValidateRequest {
    export type AsObject = {
        api?: api_v1_api_pb.Api.AsObject,
    }
}

export class ExecuteRequest extends jspb.Message { 

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): ExecuteRequest.Options | undefined;
    setOptions(value?: ExecuteRequest.Options): ExecuteRequest;

    getInputsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearInputsMap(): void;

    hasDefinition(): boolean;
    clearDefinition(): void;
    getDefinition(): Definition | undefined;
    setDefinition(value?: Definition): ExecuteRequest;

    hasFetch(): boolean;
    clearFetch(): void;
    getFetch(): ExecuteRequest.Fetch | undefined;
    setFetch(value?: ExecuteRequest.Fetch): ExecuteRequest;

    hasFetchByPath(): boolean;
    clearFetchByPath(): void;
    getFetchByPath(): ExecuteRequest.FetchByPath | undefined;
    setFetchByPath(value?: ExecuteRequest.FetchByPath): ExecuteRequest;
    clearFilesList(): void;
    getFilesList(): Array<ExecuteRequest.File>;
    setFilesList(value: Array<ExecuteRequest.File>): ExecuteRequest;
    addFiles(value?: ExecuteRequest.File, index?: number): ExecuteRequest.File;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): ExecuteRequest;
    clearMocksList(): void;
    getMocksList(): Array<Mock>;
    setMocksList(value: Array<Mock>): ExecuteRequest;
    addMocks(value?: Mock, index?: number): Mock;

    getRequestCase(): ExecuteRequest.RequestCase;

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
        options?: ExecuteRequest.Options.AsObject,

        inputsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
        definition?: Definition.AsObject,
        fetch?: ExecuteRequest.Fetch.AsObject,
        fetchByPath?: ExecuteRequest.FetchByPath.AsObject,
        filesList: Array<ExecuteRequest.File.AsObject>,
        profile?: common_v1_common_pb.Profile.AsObject,
        mocksList: Array<Mock.AsObject>,
    }


    export class Options extends jspb.Message { 
        getExcludeOutput(): boolean;
        setExcludeOutput(value: boolean): Options;
        getIncludeEventOutputs(): boolean;
        setIncludeEventOutputs(value: boolean): Options;
        getIncludeEvents(): boolean;
        setIncludeEvents(value: boolean): Options;
        getStart(): string;
        setStart(value: string): Options;
        getStop(): string;
        setStop(value: string): Options;
        getIncludeResolved(): boolean;
        setIncludeResolved(value: boolean): Options;
        getAsync(): boolean;
        setAsync(value: boolean): Options;
        getIncludeApiEvents(): boolean;
        setIncludeApiEvents(value: boolean): Options;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Options.AsObject;
        static toObject(includeInstance: boolean, msg: Options): Options.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Options, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Options;
        static deserializeBinaryFromReader(message: Options, reader: jspb.BinaryReader): Options;
    }

    export namespace Options {
        export type AsObject = {
            excludeOutput: boolean,
            includeEventOutputs: boolean,
            includeEvents: boolean,
            start: string,
            stop: string,
            includeResolved: boolean,
            async: boolean,
            includeApiEvents: boolean,
        }
    }

    export class Fetch extends jspb.Message { 
        getId(): string;
        setId(value: string): Fetch;

        hasProfile(): boolean;
        clearProfile(): void;
        getProfile(): common_v1_common_pb.Profile | undefined;
        setProfile(value?: common_v1_common_pb.Profile): Fetch;

        hasTest(): boolean;
        clearTest(): void;
        getTest(): boolean | undefined;
        setTest(value: boolean): Fetch;

        hasToken(): boolean;
        clearToken(): void;
        getToken(): string | undefined;
        setToken(value: string): Fetch;
        getViewMode(): ViewMode;
        setViewMode(value: ViewMode): Fetch;

        hasCommitId(): boolean;
        clearCommitId(): void;
        getCommitId(): string | undefined;
        setCommitId(value: string): Fetch;

        hasBranchName(): boolean;
        clearBranchName(): void;
        getBranchName(): string | undefined;
        setBranchName(value: string): Fetch;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Fetch.AsObject;
        static toObject(includeInstance: boolean, msg: Fetch): Fetch.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Fetch, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Fetch;
        static deserializeBinaryFromReader(message: Fetch, reader: jspb.BinaryReader): Fetch;
    }

    export namespace Fetch {
        export type AsObject = {
            id: string,
            profile?: common_v1_common_pb.Profile.AsObject,
            test?: boolean,
            token?: string,
            viewMode: ViewMode,
            commitId?: string,
            branchName?: string,
        }
    }

    export class FetchByPath extends jspb.Message { 

        hasProfile(): boolean;
        clearProfile(): void;
        getProfile(): common_v1_common_pb.Profile | undefined;
        setProfile(value?: common_v1_common_pb.Profile): FetchByPath;

        hasTest(): boolean;
        clearTest(): void;
        getTest(): boolean | undefined;
        setTest(value: boolean): FetchByPath;
        getViewMode(): ViewMode;
        setViewMode(value: ViewMode): FetchByPath;
        getPath(): string;
        setPath(value: string): FetchByPath;

        hasApplicationId(): boolean;
        clearApplicationId(): void;
        getApplicationId(): string | undefined;
        setApplicationId(value: string): FetchByPath;

        hasCommitId(): boolean;
        clearCommitId(): void;
        getCommitId(): string | undefined;
        setCommitId(value: string): FetchByPath;

        hasBranchName(): boolean;
        clearBranchName(): void;
        getBranchName(): string | undefined;
        setBranchName(value: string): FetchByPath;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): FetchByPath.AsObject;
        static toObject(includeInstance: boolean, msg: FetchByPath): FetchByPath.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: FetchByPath, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): FetchByPath;
        static deserializeBinaryFromReader(message: FetchByPath, reader: jspb.BinaryReader): FetchByPath;
    }

    export namespace FetchByPath {
        export type AsObject = {
            profile?: common_v1_common_pb.Profile.AsObject,
            test?: boolean,
            viewMode: ViewMode,
            path: string,
            applicationId?: string,
            commitId?: string,
            branchName?: string,
        }
    }

    export class File extends jspb.Message { 
        getOriginalname(): string;
        setOriginalname(value: string): File;
        getBuffer(): Uint8Array | string;
        getBuffer_asU8(): Uint8Array;
        getBuffer_asB64(): string;
        setBuffer(value: Uint8Array | string): File;
        getEncoding(): string;
        setEncoding(value: string): File;
        getMimetype(): string;
        setMimetype(value: string): File;
        getSize(): string;
        setSize(value: string): File;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): File.AsObject;
        static toObject(includeInstance: boolean, msg: File): File.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: File, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): File;
        static deserializeBinaryFromReader(message: File, reader: jspb.BinaryReader): File;
    }

    export namespace File {
        export type AsObject = {
            originalname: string,
            buffer: Uint8Array | string,
            encoding: string,
            mimetype: string,
            size: string,
        }
    }


    export enum RequestCase {
        REQUEST_NOT_SET = 0,
        DEFINITION = 3,
        FETCH = 4,
        FETCH_BY_PATH = 8,
    }

}

export class Definition extends jspb.Message { 

    hasApi(): boolean;
    clearApi(): void;
    getApi(): api_v1_api_pb.Api | undefined;
    setApi(value?: api_v1_api_pb.Api): Definition;

    getIntegrationsMap(): jspb.Map<string, google_protobuf_struct_pb.Struct>;
    clearIntegrationsMap(): void;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): Definition.Metadata | undefined;
    setMetadata(value?: Definition.Metadata): Definition;

    hasStores(): boolean;
    clearStores(): void;
    getStores(): store_v1_store_pb.Stores | undefined;
    setStores(value?: store_v1_store_pb.Stores): Definition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Definition.AsObject;
    static toObject(includeInstance: boolean, msg: Definition): Definition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Definition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Definition;
    static deserializeBinaryFromReader(message: Definition, reader: jspb.BinaryReader): Definition;
}

export namespace Definition {
    export type AsObject = {
        api?: api_v1_api_pb.Api.AsObject,

        integrationsMap: Array<[string, google_protobuf_struct_pb.Struct.AsObject]>,
        metadata?: Definition.Metadata.AsObject,
        stores?: store_v1_store_pb.Stores.AsObject,
    }


    export class Metadata extends jspb.Message { 
        getRequester(): string;
        setRequester(value: string): Metadata;
        getProfile(): string;
        setProfile(value: string): Metadata;
        getOrganizationPlan(): string;
        setOrganizationPlan(value: string): Metadata;
        getOrganizationName(): string;
        setOrganizationName(value: string): Metadata;

        hasRequesterType(): boolean;
        clearRequesterType(): void;
        getRequesterType(): common_v1_common_pb.UserType | undefined;
        setRequesterType(value: common_v1_common_pb.UserType): Metadata;

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
            requester: string,
            profile: string,
            organizationPlan: string,
            organizationName: string,
            requesterType?: common_v1_common_pb.UserType,
        }
    }

}

export class StatusRequest extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): StatusRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatusRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StatusRequest): StatusRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StatusRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StatusRequest;
    static deserializeBinaryFromReader(message: StatusRequest, reader: jspb.BinaryReader): StatusRequest;
}

export namespace StatusRequest {
    export type AsObject = {
        execution: string,
    }
}

export class AwaitResponse extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): AwaitResponse;

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): api_v1_event_pb.Output | undefined;
    setOutput(value?: api_v1_event_pb.Output): AwaitResponse;
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): AwaitResponse;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;
    getStatus(): AwaitResponse.Status;
    setStatus(value: AwaitResponse.Status): AwaitResponse;

    hasPerformance(): boolean;
    clearPerformance(): void;
    getPerformance(): api_v1_event_pb.Performance | undefined;
    setPerformance(value?: api_v1_event_pb.Performance): AwaitResponse;
    clearEventsList(): void;
    getEventsList(): Array<api_v1_event_pb.Event>;
    setEventsList(value: Array<api_v1_event_pb.Event>): AwaitResponse;
    addEvents(value?: api_v1_event_pb.Event, index?: number): api_v1_event_pb.Event;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AwaitResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AwaitResponse): AwaitResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AwaitResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AwaitResponse;
    static deserializeBinaryFromReader(message: AwaitResponse, reader: jspb.BinaryReader): AwaitResponse;
}

export namespace AwaitResponse {
    export type AsObject = {
        execution: string,
        output?: api_v1_event_pb.Output.AsObject,
        errorsList: Array<common_v1_errors_pb.Error.AsObject>,
        status: AwaitResponse.Status,
        performance?: api_v1_event_pb.Performance.AsObject,
        eventsList: Array<api_v1_event_pb.Event.AsObject>,
    }

    export enum Status {
    STATUS_UNSPECIFIED = 0,
    STATUS_COMPLETED = 1,
    STATUS_EXECUTING = 2,
    }

}

export class AsyncResponse extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): AsyncResponse;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): AsyncResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AsyncResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AsyncResponse): AsyncResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AsyncResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AsyncResponse;
    static deserializeBinaryFromReader(message: AsyncResponse, reader: jspb.BinaryReader): AsyncResponse;
}

export namespace AsyncResponse {
    export type AsObject = {
        execution: string,
        error?: common_v1_errors_pb.Error.AsObject,
    }
}

export class StreamResponse extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): StreamResponse;

    hasEvent(): boolean;
    clearEvent(): void;
    getEvent(): api_v1_event_pb.Event | undefined;
    setEvent(value?: api_v1_event_pb.Event): StreamResponse;

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
        execution: string,
        event?: api_v1_event_pb.Event.AsObject,
    }
}

export class OutputRequest extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): OutputRequest;
    getBlock(): string;
    setBlock(value: string): OutputRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutputRequest.AsObject;
    static toObject(includeInstance: boolean, msg: OutputRequest): OutputRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutputRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutputRequest;
    static deserializeBinaryFromReader(message: OutputRequest, reader: jspb.BinaryReader): OutputRequest;
}

export namespace OutputRequest {
    export type AsObject = {
        execution: string,
        block: string,
    }
}

export class OutputResponse extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): common_v1_common_pb.Metadata | undefined;
    setMetadata(value?: common_v1_common_pb.Metadata): OutputResponse;

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): api_v1_event_pb.Output | undefined;
    setOutput(value?: api_v1_event_pb.Output): OutputResponse;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): OutputResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutputResponse.AsObject;
    static toObject(includeInstance: boolean, msg: OutputResponse): OutputResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutputResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutputResponse;
    static deserializeBinaryFromReader(message: OutputResponse, reader: jspb.BinaryReader): OutputResponse;
}

export namespace OutputResponse {
    export type AsObject = {
        metadata?: common_v1_common_pb.Metadata.AsObject,
        output?: api_v1_event_pb.Output.AsObject,
        error?: common_v1_errors_pb.Error.AsObject,
    }
}

export class CancelRequest extends jspb.Message { 
    getExecution(): string;
    setExecution(value: string): CancelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CancelRequest): CancelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelRequest;
    static deserializeBinaryFromReader(message: CancelRequest, reader: jspb.BinaryReader): CancelRequest;
}

export namespace CancelRequest {
    export type AsObject = {
        execution: string,
    }
}

export class CancelResponse extends jspb.Message { 

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): CancelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CancelResponse): CancelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelResponse;
    static deserializeBinaryFromReader(message: CancelResponse, reader: jspb.BinaryReader): CancelResponse;
}

export namespace CancelResponse {
    export type AsObject = {
        error?: common_v1_errors_pb.Error.AsObject,
    }
}

export class TestRequest extends jspb.Message { 

    hasDatasourceConfig(): boolean;
    clearDatasourceConfig(): void;
    getDatasourceConfig(): google_protobuf_struct_pb.Struct | undefined;
    setDatasourceConfig(value?: google_protobuf_struct_pb.Struct): TestRequest;
    getIntegrationType(): string;
    setIntegrationType(value: string): TestRequest;
    getConfigurationId(): string;
    setConfigurationId(value: string): TestRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): TestRequest;

    hasActionConfig(): boolean;
    clearActionConfig(): void;
    getActionConfig(): google_protobuf_struct_pb.Struct | undefined;
    setActionConfig(value?: google_protobuf_struct_pb.Struct): TestRequest;

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
        datasourceConfig?: google_protobuf_struct_pb.Struct.AsObject,
        integrationType: string,
        configurationId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        actionConfig?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class TestResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TestResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TestResponse): TestResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TestResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TestResponse;
    static deserializeBinaryFromReader(message: TestResponse, reader: jspb.BinaryReader): TestResponse;
}

export namespace TestResponse {
    export type AsObject = {
    }
}

export class DeleteRequest extends jspb.Message { 
    getIntegration(): string;
    setIntegration(value: string): DeleteRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): DeleteRequest;
    getConfigurationId(): string;
    setConfigurationId(value: string): DeleteRequest;
    getPluginName(): string;
    setPluginName(value: string): DeleteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRequest): DeleteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRequest;
    static deserializeBinaryFromReader(message: DeleteRequest, reader: jspb.BinaryReader): DeleteRequest;
}

export namespace DeleteRequest {
    export type AsObject = {
        integration: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        configurationId: string,
        pluginName: string,
    }
}

export class DeleteResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteResponse): DeleteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteResponse;
    static deserializeBinaryFromReader(message: DeleteResponse, reader: jspb.BinaryReader): DeleteResponse;
}

export namespace DeleteResponse {
    export type AsObject = {
    }
}

export class Function extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Function.AsObject;
    static toObject(includeInstance: boolean, msg: Function): Function.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Function, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Function;
    static deserializeBinaryFromReader(message: Function, reader: jspb.BinaryReader): Function;
}

export namespace Function {
    export type AsObject = {
    }


    export class Request extends jspb.Message { 
        getId(): string;
        setId(value: string): Request;
        getName(): string;
        setName(value: string): Request;
        clearParametersList(): void;
        getParametersList(): Array<google_protobuf_struct_pb.Value>;
        setParametersList(value: Array<google_protobuf_struct_pb.Value>): Request;
        addParameters(value?: google_protobuf_struct_pb.Value, index?: number): google_protobuf_struct_pb.Value;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Request.AsObject;
        static toObject(includeInstance: boolean, msg: Request): Request.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Request, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Request;
        static deserializeBinaryFromReader(message: Request, reader: jspb.BinaryReader): Request;
    }

    export namespace Request {
        export type AsObject = {
            id: string,
            name: string,
            parametersList: Array<google_protobuf_struct_pb.Value.AsObject>,
        }
    }

    export class Response extends jspb.Message { 
        getId(): string;
        setId(value: string): Response;

        hasValue(): boolean;
        clearValue(): void;
        getValue(): google_protobuf_struct_pb.Value | undefined;
        setValue(value?: google_protobuf_struct_pb.Value): Response;

        hasError(): boolean;
        clearError(): void;
        getError(): common_v1_errors_pb.Error | undefined;
        setError(value?: common_v1_errors_pb.Error): Response;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Response.AsObject;
        static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Response, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Response;
        static deserializeBinaryFromReader(message: Response, reader: jspb.BinaryReader): Response;
    }

    export namespace Response {
        export type AsObject = {
            id: string,
            value?: google_protobuf_struct_pb.Value.AsObject,
            error?: common_v1_errors_pb.Error.AsObject,
        }
    }

}

export class TwoWayRequest extends jspb.Message { 

    hasExecute(): boolean;
    clearExecute(): void;
    getExecute(): ExecuteRequest | undefined;
    setExecute(value?: ExecuteRequest): TwoWayRequest;

    hasFunction(): boolean;
    clearFunction(): void;
    getFunction(): Function.Response | undefined;
    setFunction(value?: Function.Response): TwoWayRequest;

    getTypeCase(): TwoWayRequest.TypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TwoWayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TwoWayRequest): TwoWayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TwoWayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TwoWayRequest;
    static deserializeBinaryFromReader(message: TwoWayRequest, reader: jspb.BinaryReader): TwoWayRequest;
}

export namespace TwoWayRequest {
    export type AsObject = {
        execute?: ExecuteRequest.AsObject,
        pb_function?: Function.Response.AsObject,
    }

    export enum TypeCase {
        TYPE_NOT_SET = 0,
        EXECUTE = 1,
        FUNCTION = 2,
    }

}

export class TwoWayResponse extends jspb.Message { 

    hasStream(): boolean;
    clearStream(): void;
    getStream(): StreamResponse | undefined;
    setStream(value?: StreamResponse): TwoWayResponse;

    hasFunction(): boolean;
    clearFunction(): void;
    getFunction(): Function.Request | undefined;
    setFunction(value?: Function.Request): TwoWayResponse;

    getTypeCase(): TwoWayResponse.TypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TwoWayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TwoWayResponse): TwoWayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TwoWayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TwoWayResponse;
    static deserializeBinaryFromReader(message: TwoWayResponse, reader: jspb.BinaryReader): TwoWayResponse;
}

export namespace TwoWayResponse {
    export type AsObject = {
        stream?: StreamResponse.AsObject,
        pb_function?: Function.Request.AsObject,
    }

    export enum TypeCase {
        TYPE_NOT_SET = 0,
        STREAM = 1,
        FUNCTION = 2,
    }

}

export class Mock extends jspb.Message { 

    hasOn(): boolean;
    clearOn(): void;
    getOn(): Mock.On | undefined;
    setOn(value?: Mock.On): Mock;

    hasReturn(): boolean;
    clearReturn(): void;
    getReturn(): Mock.Return | undefined;
    setReturn(value?: Mock.Return): Mock;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Mock.AsObject;
    static toObject(includeInstance: boolean, msg: Mock): Mock.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Mock, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Mock;
    static deserializeBinaryFromReader(message: Mock, reader: jspb.BinaryReader): Mock;
}

export namespace Mock {
    export type AsObject = {
        on?: Mock.On.AsObject,
        pb_return?: Mock.Return.AsObject,
    }


    export class Params extends jspb.Message { 

        hasIntegrationType(): boolean;
        clearIntegrationType(): void;
        getIntegrationType(): string | undefined;
        setIntegrationType(value: string): Params;

        hasStepName(): boolean;
        clearStepName(): void;
        getStepName(): string | undefined;
        setStepName(value: string): Params;

        hasInputs(): boolean;
        clearInputs(): void;
        getInputs(): google_protobuf_struct_pb.Value | undefined;
        setInputs(value?: google_protobuf_struct_pb.Value): Params;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Params.AsObject;
        static toObject(includeInstance: boolean, msg: Params): Params.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Params, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Params;
        static deserializeBinaryFromReader(message: Params, reader: jspb.BinaryReader): Params;
    }

    export namespace Params {
        export type AsObject = {
            integrationType?: string,
            stepName?: string,
            inputs?: google_protobuf_struct_pb.Value.AsObject,
        }
    }

    export class On extends jspb.Message { 

        hasStatic(): boolean;
        clearStatic(): void;
        getStatic(): Mock.Params | undefined;
        setStatic(value?: Mock.Params): On;

        hasDynamic(): boolean;
        clearDynamic(): void;
        getDynamic(): string | undefined;
        setDynamic(value: string): On;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): On.AsObject;
        static toObject(includeInstance: boolean, msg: On): On.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: On, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): On;
        static deserializeBinaryFromReader(message: On, reader: jspb.BinaryReader): On;
    }

    export namespace On {
        export type AsObject = {
            pb_static?: Mock.Params.AsObject,
            dynamic?: string,
        }
    }

    export class Return extends jspb.Message { 

        hasStatic(): boolean;
        clearStatic(): void;
        getStatic(): google_protobuf_struct_pb.Value | undefined;
        setStatic(value?: google_protobuf_struct_pb.Value): Return;

        hasDynamic(): boolean;
        clearDynamic(): void;
        getDynamic(): string;
        setDynamic(value: string): Return;

        getTypeCase(): Return.TypeCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Return.AsObject;
        static toObject(includeInstance: boolean, msg: Return): Return.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Return, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Return;
        static deserializeBinaryFromReader(message: Return, reader: jspb.BinaryReader): Return;
    }

    export namespace Return {
        export type AsObject = {
            pb_static?: google_protobuf_struct_pb.Value.AsObject,
            dynamic: string,
        }

        export enum TypeCase {
            TYPE_NOT_SET = 0,
            STATIC = 1,
            DYNAMIC = 2,
        }

    }

}

export class MetadataRequestDeprecated extends jspb.Message { 
    getIntegration(): string;
    setIntegration(value: string): MetadataRequestDeprecated;
    getApiId(): string;
    setApiId(value: string): MetadataRequestDeprecated;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): MetadataRequestDeprecated;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataRequestDeprecated.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataRequestDeprecated): MetadataRequestDeprecated.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataRequestDeprecated, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataRequestDeprecated;
    static deserializeBinaryFromReader(message: MetadataRequestDeprecated, reader: jspb.BinaryReader): MetadataRequestDeprecated;
}

export namespace MetadataRequestDeprecated {
    export type AsObject = {
        integration: string,
        apiId: string,
        profile?: common_v1_common_pb.Profile.AsObject,
    }
}

export class MetadataRequest extends jspb.Message { 
    getIntegration(): string;
    setIntegration(value: string): MetadataRequest;

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): common_v1_common_pb.Profile | undefined;
    setProfile(value?: common_v1_common_pb.Profile): MetadataRequest;

    hasStepConfiguration(): boolean;
    clearStepConfiguration(): void;
    getStepConfiguration(): google_protobuf_struct_pb.Struct | undefined;
    setStepConfiguration(value?: google_protobuf_struct_pb.Struct): MetadataRequest;

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
        integration: string,
        profile?: common_v1_common_pb.Profile.AsObject,
        stepConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class MetadataResponse extends jspb.Message { 

    hasDatabaseSchemaMetadata(): boolean;
    clearDatabaseSchemaMetadata(): void;
    getDatabaseSchemaMetadata(): MetadataResponse.DatabaseSchemaMetadata | undefined;
    setDatabaseSchemaMetadata(value?: MetadataResponse.DatabaseSchemaMetadata): MetadataResponse;

    hasBucketsMetadata(): boolean;
    clearBucketsMetadata(): void;
    getBucketsMetadata(): MetadataResponse.BucketsMetadata | undefined;
    setBucketsMetadata(value?: MetadataResponse.BucketsMetadata): MetadataResponse;

    hasCouchbase(): boolean;
    clearCouchbase(): void;
    getCouchbase(): plugins_couchbase_v1_plugin_pb.Metadata | undefined;
    setCouchbase(value?: plugins_couchbase_v1_plugin_pb.Metadata): MetadataResponse;

    hasKafka(): boolean;
    clearKafka(): void;
    getKafka(): plugins_kafka_v1_plugin_pb.Metadata | undefined;
    setKafka(value?: plugins_kafka_v1_plugin_pb.Metadata): MetadataResponse;

    hasKinesis(): boolean;
    clearKinesis(): void;
    getKinesis(): plugins_kinesis_v1_plugin_pb.Metadata | undefined;
    setKinesis(value?: plugins_kinesis_v1_plugin_pb.Metadata): MetadataResponse;

    hasCosmosdb(): boolean;
    clearCosmosdb(): void;
    getCosmosdb(): plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata | undefined;
    setCosmosdb(value?: plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata): MetadataResponse;

    hasAdls(): boolean;
    clearAdls(): void;
    getAdls(): plugins_adls_v1_plugin_pb.Plugin.Metadata | undefined;
    setAdls(value?: plugins_adls_v1_plugin_pb.Plugin.Metadata): MetadataResponse;

    hasGraphql(): boolean;
    clearGraphql(): void;
    getGraphql(): google_protobuf_struct_pb.Struct | undefined;
    setGraphql(value?: google_protobuf_struct_pb.Struct): MetadataResponse;
    getGSheetsNextPageToken(): string;
    setGSheetsNextPageToken(value: string): MetadataResponse;

    getMetadataCase(): MetadataResponse.MetadataCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataResponse): MetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataResponse;
    static deserializeBinaryFromReader(message: MetadataResponse, reader: jspb.BinaryReader): MetadataResponse;
}

export namespace MetadataResponse {
    export type AsObject = {
        databaseSchemaMetadata?: MetadataResponse.DatabaseSchemaMetadata.AsObject,
        bucketsMetadata?: MetadataResponse.BucketsMetadata.AsObject,
        couchbase?: plugins_couchbase_v1_plugin_pb.Metadata.AsObject,
        kafka?: plugins_kafka_v1_plugin_pb.Metadata.AsObject,
        kinesis?: plugins_kinesis_v1_plugin_pb.Metadata.AsObject,
        cosmosdb?: plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata.AsObject,
        adls?: plugins_adls_v1_plugin_pb.Plugin.Metadata.AsObject,
        graphql?: google_protobuf_struct_pb.Struct.AsObject,
        gSheetsNextPageToken: string,
    }


    export class DatabaseSchemaMetadata extends jspb.Message { 
        clearTablesList(): void;
        getTablesList(): Array<MetadataResponse.DatabaseSchemaMetadata.Table>;
        setTablesList(value: Array<MetadataResponse.DatabaseSchemaMetadata.Table>): DatabaseSchemaMetadata;
        addTables(value?: MetadataResponse.DatabaseSchemaMetadata.Table, index?: number): MetadataResponse.DatabaseSchemaMetadata.Table;
        clearSchemasList(): void;
        getSchemasList(): Array<MetadataResponse.DatabaseSchemaMetadata.Schema>;
        setSchemasList(value: Array<MetadataResponse.DatabaseSchemaMetadata.Schema>): DatabaseSchemaMetadata;
        addSchemas(value?: MetadataResponse.DatabaseSchemaMetadata.Schema, index?: number): MetadataResponse.DatabaseSchemaMetadata.Schema;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): DatabaseSchemaMetadata.AsObject;
        static toObject(includeInstance: boolean, msg: DatabaseSchemaMetadata): DatabaseSchemaMetadata.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: DatabaseSchemaMetadata, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): DatabaseSchemaMetadata;
        static deserializeBinaryFromReader(message: DatabaseSchemaMetadata, reader: jspb.BinaryReader): DatabaseSchemaMetadata;
    }

    export namespace DatabaseSchemaMetadata {
        export type AsObject = {
            tablesList: Array<MetadataResponse.DatabaseSchemaMetadata.Table.AsObject>,
            schemasList: Array<MetadataResponse.DatabaseSchemaMetadata.Schema.AsObject>,
        }


        export class Column extends jspb.Message { 
            getName(): string;
            setName(value: string): Column;
            getType(): string;
            setType(value: string): Column;
            getEscapedName(): string;
            setEscapedName(value: string): Column;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Column.AsObject;
            static toObject(includeInstance: boolean, msg: Column): Column.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Column, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Column;
            static deserializeBinaryFromReader(message: Column, reader: jspb.BinaryReader): Column;
        }

        export namespace Column {
            export type AsObject = {
                name: string,
                type: string,
                escapedName: string,
            }
        }

        export class Key extends jspb.Message { 
            getName(): string;
            setName(value: string): Key;
            getType(): string;
            setType(value: string): Key;
            clearColumnsList(): void;
            getColumnsList(): Array<string>;
            setColumnsList(value: Array<string>): Key;
            addColumns(value: string, index?: number): string;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Key.AsObject;
            static toObject(includeInstance: boolean, msg: Key): Key.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Key, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Key;
            static deserializeBinaryFromReader(message: Key, reader: jspb.BinaryReader): Key;
        }

        export namespace Key {
            export type AsObject = {
                name: string,
                type: string,
                columnsList: Array<string>,
            }
        }

        export class Template extends jspb.Message { 
            getTitle(): string;
            setTitle(value: string): Template;
            getBody(): string;
            setBody(value: string): Template;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Template.AsObject;
            static toObject(includeInstance: boolean, msg: Template): Template.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Template, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Template;
            static deserializeBinaryFromReader(message: Template, reader: jspb.BinaryReader): Template;
        }

        export namespace Template {
            export type AsObject = {
                title: string,
                body: string,
            }
        }

        export class Table extends jspb.Message { 
            getId(): string;
            setId(value: string): Table;
            getType(): string;
            setType(value: string): Table;
            getName(): string;
            setName(value: string): Table;
            clearColumnsList(): void;
            getColumnsList(): Array<MetadataResponse.DatabaseSchemaMetadata.Column>;
            setColumnsList(value: Array<MetadataResponse.DatabaseSchemaMetadata.Column>): Table;
            addColumns(value?: MetadataResponse.DatabaseSchemaMetadata.Column, index?: number): MetadataResponse.DatabaseSchemaMetadata.Column;
            clearKeysList(): void;
            getKeysList(): Array<MetadataResponse.DatabaseSchemaMetadata.Key>;
            setKeysList(value: Array<MetadataResponse.DatabaseSchemaMetadata.Key>): Table;
            addKeys(value?: MetadataResponse.DatabaseSchemaMetadata.Key, index?: number): MetadataResponse.DatabaseSchemaMetadata.Key;
            clearTemplatesList(): void;
            getTemplatesList(): Array<MetadataResponse.DatabaseSchemaMetadata.Template>;
            setTemplatesList(value: Array<MetadataResponse.DatabaseSchemaMetadata.Template>): Table;
            addTemplates(value?: MetadataResponse.DatabaseSchemaMetadata.Template, index?: number): MetadataResponse.DatabaseSchemaMetadata.Template;
            getSchema(): string;
            setSchema(value: string): Table;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Table.AsObject;
            static toObject(includeInstance: boolean, msg: Table): Table.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Table, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Table;
            static deserializeBinaryFromReader(message: Table, reader: jspb.BinaryReader): Table;
        }

        export namespace Table {
            export type AsObject = {
                id: string,
                type: string,
                name: string,
                columnsList: Array<MetadataResponse.DatabaseSchemaMetadata.Column.AsObject>,
                keysList: Array<MetadataResponse.DatabaseSchemaMetadata.Key.AsObject>,
                templatesList: Array<MetadataResponse.DatabaseSchemaMetadata.Template.AsObject>,
                schema: string,
            }
        }

        export class Schema extends jspb.Message { 
            getId(): string;
            setId(value: string): Schema;
            getName(): string;
            setName(value: string): Schema;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Schema.AsObject;
            static toObject(includeInstance: boolean, msg: Schema): Schema.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Schema, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Schema;
            static deserializeBinaryFromReader(message: Schema, reader: jspb.BinaryReader): Schema;
        }

        export namespace Schema {
            export type AsObject = {
                id: string,
                name: string,
            }
        }

    }

    export class BucketMetadata extends jspb.Message { 
        getName(): string;
        setName(value: string): BucketMetadata;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): BucketMetadata.AsObject;
        static toObject(includeInstance: boolean, msg: BucketMetadata): BucketMetadata.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: BucketMetadata, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): BucketMetadata;
        static deserializeBinaryFromReader(message: BucketMetadata, reader: jspb.BinaryReader): BucketMetadata;
    }

    export namespace BucketMetadata {
        export type AsObject = {
            name: string,
        }
    }

    export class BucketsMetadata extends jspb.Message { 
        clearBucketsList(): void;
        getBucketsList(): Array<MetadataResponse.BucketMetadata>;
        setBucketsList(value: Array<MetadataResponse.BucketMetadata>): BucketsMetadata;
        addBuckets(value?: MetadataResponse.BucketMetadata, index?: number): MetadataResponse.BucketMetadata;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): BucketsMetadata.AsObject;
        static toObject(includeInstance: boolean, msg: BucketsMetadata): BucketsMetadata.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: BucketsMetadata, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): BucketsMetadata;
        static deserializeBinaryFromReader(message: BucketsMetadata, reader: jspb.BinaryReader): BucketsMetadata;
    }

    export namespace BucketsMetadata {
        export type AsObject = {
            bucketsList: Array<MetadataResponse.BucketMetadata.AsObject>,
        }
    }


    export enum MetadataCase {
        METADATA_NOT_SET = 0,
        DATABASE_SCHEMA_METADATA = 1,
        BUCKETS_METADATA = 2,
        COUCHBASE = 3,
        KAFKA = 4,
        KINESIS = 5,
        COSMOSDB = 6,
        ADLS = 7,
        GRAPHQL = 9,
    }

}

export class DownloadRequest extends jspb.Message { 
    getLocation(): string;
    setLocation(value: string): DownloadRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadRequest): DownloadRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadRequest;
    static deserializeBinaryFromReader(message: DownloadRequest, reader: jspb.BinaryReader): DownloadRequest;
}

export namespace DownloadRequest {
    export type AsObject = {
        location: string,
    }
}

export class DownloadResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): DownloadResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadResponse): DownloadResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadResponse;
    static deserializeBinaryFromReader(message: DownloadResponse, reader: jspb.BinaryReader): DownloadResponse;
}

export namespace DownloadResponse {
    export type AsObject = {
        data: Uint8Array | string,
    }
}

export class WorkflowResponse extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_struct_pb.Value | undefined;
    setData(value?: google_protobuf_struct_pb.Value): WorkflowResponse;

    hasResponseMeta(): boolean;
    clearResponseMeta(): void;
    getResponseMeta(): WorkflowResponse.ResponseMeta | undefined;
    setResponseMeta(value?: WorkflowResponse.ResponseMeta): WorkflowResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WorkflowResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WorkflowResponse): WorkflowResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WorkflowResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WorkflowResponse;
    static deserializeBinaryFromReader(message: WorkflowResponse, reader: jspb.BinaryReader): WorkflowResponse;
}

export namespace WorkflowResponse {
    export type AsObject = {
        data?: google_protobuf_struct_pb.Value.AsObject,
        responseMeta?: WorkflowResponse.ResponseMeta.AsObject,
    }


    export class ResponseMeta extends jspb.Message { 
        getStatus(): number;
        setStatus(value: number): ResponseMeta;
        getMessage(): string;
        setMessage(value: string): ResponseMeta;
        getSuccess(): boolean;
        setSuccess(value: boolean): ResponseMeta;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ResponseMeta.AsObject;
        static toObject(includeInstance: boolean, msg: ResponseMeta): ResponseMeta.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ResponseMeta, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ResponseMeta;
        static deserializeBinaryFromReader(message: ResponseMeta, reader: jspb.BinaryReader): ResponseMeta;
    }

    export namespace ResponseMeta {
        export type AsObject = {
            status: number,
            message: string,
            success: boolean,
        }
    }

}

export enum ViewMode {
    VIEW_MODE_UNSPECIFIED = 0,
    VIEW_MODE_EDIT = 1,
    VIEW_MODE_PREVIEW = 2,
    VIEW_MODE_DEPLOYED = 3,
}
