// package: api.v1
// file: api/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as api_v1_service_pb from "../../api/v1/service_pb";
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
import * as plugins_kafka_v1_plugin_pb from "../../plugins/kafka/v1/plugin_pb";
import * as plugins_kinesis_v1_plugin_pb from "../../plugins/kinesis/v1/plugin_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as store_v1_store_pb from "../../store/v1/store_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface IMetadataServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    health: IMetadataServiceService_IHealth;
}

interface IMetadataServiceService_IHealth extends grpc.MethodDefinition<api_v1_service_pb.HealthRequest, common_v1_health_pb.HealthResponse> {
    path: "/api.v1.MetadataService/Health";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.HealthRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.HealthRequest>;
    responseSerialize: grpc.serialize<common_v1_health_pb.HealthResponse>;
    responseDeserialize: grpc.deserialize<common_v1_health_pb.HealthResponse>;
}

export const MetadataServiceService: IMetadataServiceService;

export interface IMetadataServiceServer extends grpc.UntypedServiceImplementation {
    health: grpc.handleUnaryCall<api_v1_service_pb.HealthRequest, common_v1_health_pb.HealthResponse>;
}

export interface IMetadataServiceClient {
    health(request: api_v1_service_pb.HealthRequest, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    health(request: api_v1_service_pb.HealthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    health(request: api_v1_service_pb.HealthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
}

export class MetadataServiceClient extends grpc.Client implements IMetadataServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public health(request: api_v1_service_pb.HealthRequest, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    public health(request: api_v1_service_pb.HealthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    public health(request: api_v1_service_pb.HealthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
}

interface IDeprecatedServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    workflow: IDeprecatedServiceService_IWorkflow;
}

interface IDeprecatedServiceService_IWorkflow extends grpc.MethodDefinition<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.WorkflowResponse> {
    path: "/api.v1.DeprecatedService/Workflow";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.ExecuteRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.ExecuteRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.WorkflowResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.WorkflowResponse>;
}

export const DeprecatedServiceService: IDeprecatedServiceService;

export interface IDeprecatedServiceServer extends grpc.UntypedServiceImplementation {
    workflow: grpc.handleUnaryCall<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.WorkflowResponse>;
}

export interface IDeprecatedServiceClient {
    workflow(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
    workflow(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
    workflow(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
}

export class DeprecatedServiceClient extends grpc.Client implements IDeprecatedServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public workflow(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
    public workflow(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
    public workflow(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.WorkflowResponse) => void): grpc.ClientUnaryCall;
}

interface IExecutorServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    await: IExecutorServiceService_IAwait;
    twoWayStream: IExecutorServiceService_ITwoWayStream;
    metadataDeprecated: IExecutorServiceService_IMetadataDeprecated;
    metadata: IExecutorServiceService_IMetadata;
    test: IExecutorServiceService_ITest;
    delete: IExecutorServiceService_IDelete;
    async: IExecutorServiceService_IAsync;
    stream: IExecutorServiceService_IStream;
    status: IExecutorServiceService_IStatus;
    output: IExecutorServiceService_IOutput;
    download: IExecutorServiceService_IDownload;
    cancel: IExecutorServiceService_ICancel;
    validate: IExecutorServiceService_IValidate;
}

interface IExecutorServiceService_IAwait extends grpc.MethodDefinition<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.AwaitResponse> {
    path: "/api.v1.ExecutorService/Await";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.ExecuteRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.ExecuteRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.AwaitResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.AwaitResponse>;
}
interface IExecutorServiceService_ITwoWayStream extends grpc.MethodDefinition<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse> {
    path: "/api.v1.ExecutorService/TwoWayStream";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<api_v1_service_pb.TwoWayRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.TwoWayRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.TwoWayResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.TwoWayResponse>;
}
interface IExecutorServiceService_IMetadataDeprecated extends grpc.MethodDefinition<api_v1_service_pb.MetadataRequestDeprecated, api_v1_service_pb.MetadataResponse> {
    path: "/api.v1.ExecutorService/MetadataDeprecated";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.MetadataRequestDeprecated>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.MetadataRequestDeprecated>;
    responseSerialize: grpc.serialize<api_v1_service_pb.MetadataResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.MetadataResponse>;
}
interface IExecutorServiceService_IMetadata extends grpc.MethodDefinition<api_v1_service_pb.MetadataRequest, api_v1_service_pb.MetadataResponse> {
    path: "/api.v1.ExecutorService/Metadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.MetadataRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.MetadataRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.MetadataResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.MetadataResponse>;
}
interface IExecutorServiceService_ITest extends grpc.MethodDefinition<api_v1_service_pb.TestRequest, api_v1_service_pb.TestResponse> {
    path: "/api.v1.ExecutorService/Test";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.TestRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.TestRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.TestResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.TestResponse>;
}
interface IExecutorServiceService_IDelete extends grpc.MethodDefinition<api_v1_service_pb.DeleteRequest, api_v1_service_pb.DeleteResponse> {
    path: "/api.v1.ExecutorService/Delete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.DeleteRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.DeleteRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.DeleteResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.DeleteResponse>;
}
interface IExecutorServiceService_IAsync extends grpc.MethodDefinition<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.AsyncResponse> {
    path: "/api.v1.ExecutorService/Async";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.ExecuteRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.ExecuteRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.AsyncResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.AsyncResponse>;
}
interface IExecutorServiceService_IStream extends grpc.MethodDefinition<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.StreamResponse> {
    path: "/api.v1.ExecutorService/Stream";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<api_v1_service_pb.ExecuteRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.ExecuteRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.StreamResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.StreamResponse>;
}
interface IExecutorServiceService_IStatus extends grpc.MethodDefinition<api_v1_service_pb.StatusRequest, api_v1_service_pb.AwaitResponse> {
    path: "/api.v1.ExecutorService/Status";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.StatusRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.StatusRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.AwaitResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.AwaitResponse>;
}
interface IExecutorServiceService_IOutput extends grpc.MethodDefinition<api_v1_service_pb.OutputRequest, api_v1_service_pb.OutputResponse> {
    path: "/api.v1.ExecutorService/Output";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.OutputRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.OutputRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.OutputResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.OutputResponse>;
}
interface IExecutorServiceService_IDownload extends grpc.MethodDefinition<api_v1_service_pb.DownloadRequest, api_v1_service_pb.DownloadResponse> {
    path: "/api.v1.ExecutorService/Download";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<api_v1_service_pb.DownloadRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.DownloadRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.DownloadResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.DownloadResponse>;
}
interface IExecutorServiceService_ICancel extends grpc.MethodDefinition<api_v1_service_pb.CancelRequest, api_v1_service_pb.CancelResponse> {
    path: "/api.v1.ExecutorService/Cancel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.CancelRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.CancelRequest>;
    responseSerialize: grpc.serialize<api_v1_service_pb.CancelResponse>;
    responseDeserialize: grpc.deserialize<api_v1_service_pb.CancelResponse>;
}
interface IExecutorServiceService_IValidate extends grpc.MethodDefinition<api_v1_service_pb.ValidateRequest, google_protobuf_empty_pb.Empty> {
    path: "/api.v1.ExecutorService/Validate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_service_pb.ValidateRequest>;
    requestDeserialize: grpc.deserialize<api_v1_service_pb.ValidateRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const ExecutorServiceService: IExecutorServiceService;

export interface IExecutorServiceServer extends grpc.UntypedServiceImplementation {
    await: grpc.handleUnaryCall<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.AwaitResponse>;
    twoWayStream: grpc.handleBidiStreamingCall<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    metadataDeprecated: grpc.handleUnaryCall<api_v1_service_pb.MetadataRequestDeprecated, api_v1_service_pb.MetadataResponse>;
    metadata: grpc.handleUnaryCall<api_v1_service_pb.MetadataRequest, api_v1_service_pb.MetadataResponse>;
    test: grpc.handleUnaryCall<api_v1_service_pb.TestRequest, api_v1_service_pb.TestResponse>;
    delete: grpc.handleUnaryCall<api_v1_service_pb.DeleteRequest, api_v1_service_pb.DeleteResponse>;
    async: grpc.handleUnaryCall<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.AsyncResponse>;
    stream: grpc.handleServerStreamingCall<api_v1_service_pb.ExecuteRequest, api_v1_service_pb.StreamResponse>;
    status: grpc.handleUnaryCall<api_v1_service_pb.StatusRequest, api_v1_service_pb.AwaitResponse>;
    output: grpc.handleUnaryCall<api_v1_service_pb.OutputRequest, api_v1_service_pb.OutputResponse>;
    download: grpc.handleServerStreamingCall<api_v1_service_pb.DownloadRequest, api_v1_service_pb.DownloadResponse>;
    cancel: grpc.handleUnaryCall<api_v1_service_pb.CancelRequest, api_v1_service_pb.CancelResponse>;
    validate: grpc.handleUnaryCall<api_v1_service_pb.ValidateRequest, google_protobuf_empty_pb.Empty>;
}

export interface IExecutorServiceClient {
    await(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    await(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    await(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    twoWayStream(): grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    twoWayStream(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    twoWayStream(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    metadata(request: api_v1_service_pb.MetadataRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    metadata(request: api_v1_service_pb.MetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    metadata(request: api_v1_service_pb.MetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    test(request: api_v1_service_pb.TestRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    test(request: api_v1_service_pb.TestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    test(request: api_v1_service_pb.TestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    delete(request: api_v1_service_pb.DeleteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    delete(request: api_v1_service_pb.DeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    delete(request: api_v1_service_pb.DeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    async(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    async(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    async(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    stream(request: api_v1_service_pb.ExecuteRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.StreamResponse>;
    stream(request: api_v1_service_pb.ExecuteRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.StreamResponse>;
    status(request: api_v1_service_pb.StatusRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    status(request: api_v1_service_pb.StatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    status(request: api_v1_service_pb.StatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    output(request: api_v1_service_pb.OutputRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    output(request: api_v1_service_pb.OutputRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    output(request: api_v1_service_pb.OutputRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    download(request: api_v1_service_pb.DownloadRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.DownloadResponse>;
    download(request: api_v1_service_pb.DownloadRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.DownloadResponse>;
    cancel(request: api_v1_service_pb.CancelRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    cancel(request: api_v1_service_pb.CancelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    cancel(request: api_v1_service_pb.CancelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    validate(request: api_v1_service_pb.ValidateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    validate(request: api_v1_service_pb.ValidateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    validate(request: api_v1_service_pb.ValidateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class ExecutorServiceClient extends grpc.Client implements IExecutorServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public await(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public await(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public await(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public twoWayStream(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    public twoWayStream(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
    public metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public metadataDeprecated(request: api_v1_service_pb.MetadataRequestDeprecated, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public metadata(request: api_v1_service_pb.MetadataRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public metadata(request: api_v1_service_pb.MetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public metadata(request: api_v1_service_pb.MetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.MetadataResponse) => void): grpc.ClientUnaryCall;
    public test(request: api_v1_service_pb.TestRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    public test(request: api_v1_service_pb.TestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    public test(request: api_v1_service_pb.TestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.TestResponse) => void): grpc.ClientUnaryCall;
    public delete(request: api_v1_service_pb.DeleteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    public delete(request: api_v1_service_pb.DeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    public delete(request: api_v1_service_pb.DeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    public async(request: api_v1_service_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    public async(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    public async(request: api_v1_service_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AsyncResponse) => void): grpc.ClientUnaryCall;
    public stream(request: api_v1_service_pb.ExecuteRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.StreamResponse>;
    public stream(request: api_v1_service_pb.ExecuteRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.StreamResponse>;
    public status(request: api_v1_service_pb.StatusRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public status(request: api_v1_service_pb.StatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public status(request: api_v1_service_pb.StatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.AwaitResponse) => void): grpc.ClientUnaryCall;
    public output(request: api_v1_service_pb.OutputRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    public output(request: api_v1_service_pb.OutputRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    public output(request: api_v1_service_pb.OutputRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.OutputResponse) => void): grpc.ClientUnaryCall;
    public download(request: api_v1_service_pb.DownloadRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.DownloadResponse>;
    public download(request: api_v1_service_pb.DownloadRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<api_v1_service_pb.DownloadResponse>;
    public cancel(request: api_v1_service_pb.CancelRequest, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    public cancel(request: api_v1_service_pb.CancelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    public cancel(request: api_v1_service_pb.CancelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_service_pb.CancelResponse) => void): grpc.ClientUnaryCall;
    public validate(request: api_v1_service_pb.ValidateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public validate(request: api_v1_service_pb.ValidateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public validate(request: api_v1_service_pb.ValidateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}
