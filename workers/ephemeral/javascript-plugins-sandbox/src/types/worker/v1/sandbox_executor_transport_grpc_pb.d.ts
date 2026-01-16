// package: worker.v1
// file: worker/v1/sandbox_executor_transport.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_sandbox_executor_transport_pb from "../../worker/v1/sandbox_executor_transport_pb";

interface ISandboxExecutorTransportServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    execute: ISandboxExecutorTransportServiceService_IExecute;
}

interface ISandboxExecutorTransportServiceService_IExecute extends grpc.MethodDefinition<worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1> {
    path: "/worker.v1.SandboxExecutorTransportService/Execute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1>;
}

export const SandboxExecutorTransportServiceService: ISandboxExecutorTransportServiceService;

export interface ISandboxExecutorTransportServiceServer extends grpc.UntypedServiceImplementation {
    execute: grpc.handleUnaryCall<worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1>;
}

export interface ISandboxExecutorTransportServiceClient {
    execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
    execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
    execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
}

export class SandboxExecutorTransportServiceClient extends grpc.Client implements ISandboxExecutorTransportServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
    public execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
    public execute(request: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1) => void): grpc.ClientUnaryCall;
}
