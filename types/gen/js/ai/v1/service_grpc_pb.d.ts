// package: ai.v1
// file: ai/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as ai_v1_service_pb from "../../ai/v1/service_pb";
import * as ai_v1_ai_pb from "../../ai/v1/ai_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_health_pb from "../../common/v1/health_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface IMetadataServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    health: IMetadataServiceService_IHealth;
}

interface IMetadataServiceService_IHealth extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, common_v1_health_pb.HealthResponse> {
    path: "/ai.v1.MetadataService/Health";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<common_v1_health_pb.HealthResponse>;
    responseDeserialize: grpc.deserialize<common_v1_health_pb.HealthResponse>;
}

export const MetadataServiceService: IMetadataServiceService;

export interface IMetadataServiceServer extends grpc.UntypedServiceImplementation {
    health: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, common_v1_health_pb.HealthResponse>;
}

export interface IMetadataServiceClient {
    health(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    health(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    health(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
}

export class MetadataServiceClient extends grpc.Client implements IMetadataServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public health(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    public health(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
    public health(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_v1_health_pb.HealthResponse) => void): grpc.ClientUnaryCall;
}

interface ITaskServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    create: ITaskServiceService_ICreate;
}

interface ITaskServiceService_ICreate extends grpc.MethodDefinition<ai_v1_service_pb.CreateTaskRequest, ai_v1_service_pb.TaskEvent> {
    path: "/ai.v1.TaskService/Create";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<ai_v1_service_pb.CreateTaskRequest>;
    requestDeserialize: grpc.deserialize<ai_v1_service_pb.CreateTaskRequest>;
    responseSerialize: grpc.serialize<ai_v1_service_pb.TaskEvent>;
    responseDeserialize: grpc.deserialize<ai_v1_service_pb.TaskEvent>;
}

export const TaskServiceService: ITaskServiceService;

export interface ITaskServiceServer extends grpc.UntypedServiceImplementation {
    create: grpc.handleServerStreamingCall<ai_v1_service_pb.CreateTaskRequest, ai_v1_service_pb.TaskEvent>;
}

export interface ITaskServiceClient {
    create(request: ai_v1_service_pb.CreateTaskRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ai_v1_service_pb.TaskEvent>;
    create(request: ai_v1_service_pb.CreateTaskRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ai_v1_service_pb.TaskEvent>;
}

export class TaskServiceClient extends grpc.Client implements ITaskServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public create(request: ai_v1_service_pb.CreateTaskRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ai_v1_service_pb.TaskEvent>;
    public create(request: ai_v1_service_pb.CreateTaskRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ai_v1_service_pb.TaskEvent>;
}
