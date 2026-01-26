// package: worker.v1
// file: worker/v1/sandbox_transport.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_sandbox_transport_pb from "../../worker/v1/sandbox_transport_pb";
import * as api_v1_event_pb from "../../api/v1/event_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as transport_v1_transport_pb from "../../transport/v1/transport_pb";

interface ISandboxTransportServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    execute: ISandboxTransportServiceService_IExecute;
    stream: ISandboxTransportServiceService_IStream;
    metadata: ISandboxTransportServiceService_IMetadata;
    test: ISandboxTransportServiceService_ITest;
    preDelete: ISandboxTransportServiceService_IPreDelete;
}

interface ISandboxTransportServiceService_IExecute extends grpc.MethodDefinition<worker_v1_sandbox_transport_pb.ExecuteRequest, worker_v1_sandbox_transport_pb.ExecuteResponse> {
    path: "/worker.v1.SandboxTransportService/Execute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.ExecuteRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.ExecuteRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.ExecuteResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.ExecuteResponse>;
}
interface ISandboxTransportServiceService_IStream extends grpc.MethodDefinition<worker_v1_sandbox_transport_pb.StreamRequest, google_protobuf_empty_pb.Empty> {
    path: "/worker.v1.SandboxTransportService/Stream";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.StreamRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.StreamRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface ISandboxTransportServiceService_IMetadata extends grpc.MethodDefinition<worker_v1_sandbox_transport_pb.MetadataRequest, transport_v1_transport_pb.Response.Data.Data> {
    path: "/worker.v1.SandboxTransportService/Metadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.MetadataRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.MetadataRequest>;
    responseSerialize: grpc.serialize<transport_v1_transport_pb.Response.Data.Data>;
    responseDeserialize: grpc.deserialize<transport_v1_transport_pb.Response.Data.Data>;
}
interface ISandboxTransportServiceService_ITest extends grpc.MethodDefinition<worker_v1_sandbox_transport_pb.TestRequest, google_protobuf_empty_pb.Empty> {
    path: "/worker.v1.SandboxTransportService/Test";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.TestRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.TestRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface ISandboxTransportServiceService_IPreDelete extends grpc.MethodDefinition<worker_v1_sandbox_transport_pb.PreDeleteRequest, google_protobuf_empty_pb.Empty> {
    path: "/worker.v1.SandboxTransportService/PreDelete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_transport_pb.PreDeleteRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_transport_pb.PreDeleteRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const SandboxTransportServiceService: ISandboxTransportServiceService;

export interface ISandboxTransportServiceServer extends grpc.UntypedServiceImplementation {
    execute: grpc.handleUnaryCall<worker_v1_sandbox_transport_pb.ExecuteRequest, worker_v1_sandbox_transport_pb.ExecuteResponse>;
    stream: grpc.handleUnaryCall<worker_v1_sandbox_transport_pb.StreamRequest, google_protobuf_empty_pb.Empty>;
    metadata: grpc.handleUnaryCall<worker_v1_sandbox_transport_pb.MetadataRequest, transport_v1_transport_pb.Response.Data.Data>;
    test: grpc.handleUnaryCall<worker_v1_sandbox_transport_pb.TestRequest, google_protobuf_empty_pb.Empty>;
    preDelete: grpc.handleUnaryCall<worker_v1_sandbox_transport_pb.PreDeleteRequest, google_protobuf_empty_pb.Empty>;
}

export interface ISandboxTransportServiceClient {
    execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    stream(request: worker_v1_sandbox_transport_pb.StreamRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    stream(request: worker_v1_sandbox_transport_pb.StreamRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    stream(request: worker_v1_sandbox_transport_pb.StreamRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    test(request: worker_v1_sandbox_transport_pb.TestRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    test(request: worker_v1_sandbox_transport_pb.TestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    test(request: worker_v1_sandbox_transport_pb.TestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class SandboxTransportServiceClient extends grpc.Client implements ISandboxTransportServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    public execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    public execute(request: worker_v1_sandbox_transport_pb.ExecuteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_transport_pb.ExecuteResponse) => void): grpc.ClientUnaryCall;
    public stream(request: worker_v1_sandbox_transport_pb.StreamRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public stream(request: worker_v1_sandbox_transport_pb.StreamRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public stream(request: worker_v1_sandbox_transport_pb.StreamRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    public metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    public metadata(request: worker_v1_sandbox_transport_pb.MetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response.Data.Data) => void): grpc.ClientUnaryCall;
    public test(request: worker_v1_sandbox_transport_pb.TestRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public test(request: worker_v1_sandbox_transport_pb.TestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public test(request: worker_v1_sandbox_transport_pb.TestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public preDelete(request: worker_v1_sandbox_transport_pb.PreDeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}
