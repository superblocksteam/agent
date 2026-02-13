// package: worker.v1
// file: worker/v1/sandbox_integration_executor.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_sandbox_integration_executor_pb from "../../worker/v1/sandbox_integration_executor_pb";
import * as api_v1_service_pb from "../../api/v1/service_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface ISandboxIntegrationExecutorServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    executeIntegration: ISandboxIntegrationExecutorServiceService_IExecuteIntegration;
}

interface ISandboxIntegrationExecutorServiceService_IExecuteIntegration extends grpc.MethodDefinition<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse> {
    path: "/worker.v1.SandboxIntegrationExecutorService/ExecuteIntegration";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse>;
}

export const SandboxIntegrationExecutorServiceService: ISandboxIntegrationExecutorServiceService;

export interface ISandboxIntegrationExecutorServiceServer extends grpc.UntypedServiceImplementation {
    executeIntegration: grpc.handleUnaryCall<worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse>;
}

export interface ISandboxIntegrationExecutorServiceClient {
    executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
    executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
    executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
}

export class SandboxIntegrationExecutorServiceClient extends grpc.Client implements ISandboxIntegrationExecutorServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
    public executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
    public executeIntegration(request: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse) => void): grpc.ClientUnaryCall;
}
