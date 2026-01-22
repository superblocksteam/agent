// package: worker.v1
// file: worker/v1/sandbox_streaming_proxy.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_sandbox_streaming_proxy_pb from "../../worker/v1/sandbox_streaming_proxy_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface ISandboxStreamingProxyServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    send: ISandboxStreamingProxyServiceService_ISend;
    until: ISandboxStreamingProxyServiceService_IUntil;
}

interface ISandboxStreamingProxyServiceService_ISend extends grpc.MethodDefinition<worker_v1_sandbox_streaming_proxy_pb.SendRequest, google_protobuf_empty_pb.Empty> {
    path: "/worker.v1.SandboxStreamingProxyService/Send";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_streaming_proxy_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_streaming_proxy_pb.SendRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface ISandboxStreamingProxyServiceService_IUntil extends grpc.MethodDefinition<worker_v1_sandbox_streaming_proxy_pb.UntilRequest, google_protobuf_empty_pb.Empty> {
    path: "/worker.v1.SandboxStreamingProxyService/Until";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_streaming_proxy_pb.UntilRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_streaming_proxy_pb.UntilRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const SandboxStreamingProxyServiceService: ISandboxStreamingProxyServiceService;

export interface ISandboxStreamingProxyServiceServer extends grpc.UntypedServiceImplementation {
    send: grpc.handleUnaryCall<worker_v1_sandbox_streaming_proxy_pb.SendRequest, google_protobuf_empty_pb.Empty>;
    until: grpc.handleUnaryCall<worker_v1_sandbox_streaming_proxy_pb.UntilRequest, google_protobuf_empty_pb.Empty>;
}

export interface ISandboxStreamingProxyServiceClient {
    send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class SandboxStreamingProxyServiceClient extends grpc.Client implements ISandboxStreamingProxyServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public send(request: worker_v1_sandbox_streaming_proxy_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public until(request: worker_v1_sandbox_streaming_proxy_pb.UntilRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}
