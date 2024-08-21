// package: worker.v1
// file: worker/v1/step_executor.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_step_executor_pb from "../../worker/v1/step_executor_pb";
import * as transport_v1_transport_pb from "../../transport/v1/transport_pb";

interface IStepExecutorServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    stream: IStepExecutorServiceService_IStream;
    execute: IStepExecutorServiceService_IExecute;
    metadata: IStepExecutorServiceService_IMetadata;
    testConnection: IStepExecutorServiceService_ITestConnection;
    deleteDatasource: IStepExecutorServiceService_IDeleteDatasource;
}

interface IStepExecutorServiceService_IStream extends grpc.MethodDefinition<transport_v1_transport_pb.Request, worker_v1_step_executor_pb.StringValue> {
    path: "/worker.v1.StepExecutorService/Stream";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<transport_v1_transport_pb.Request>;
    requestDeserialize: grpc.deserialize<transport_v1_transport_pb.Request>;
    responseSerialize: grpc.serialize<worker_v1_step_executor_pb.StringValue>;
    responseDeserialize: grpc.deserialize<worker_v1_step_executor_pb.StringValue>;
}
interface IStepExecutorServiceService_IExecute extends grpc.MethodDefinition<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response> {
    path: "/worker.v1.StepExecutorService/Execute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<transport_v1_transport_pb.Request>;
    requestDeserialize: grpc.deserialize<transport_v1_transport_pb.Request>;
    responseSerialize: grpc.serialize<transport_v1_transport_pb.Response>;
    responseDeserialize: grpc.deserialize<transport_v1_transport_pb.Response>;
}
interface IStepExecutorServiceService_IMetadata extends grpc.MethodDefinition<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response> {
    path: "/worker.v1.StepExecutorService/Metadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<transport_v1_transport_pb.Request>;
    requestDeserialize: grpc.deserialize<transport_v1_transport_pb.Request>;
    responseSerialize: grpc.serialize<transport_v1_transport_pb.Response>;
    responseDeserialize: grpc.deserialize<transport_v1_transport_pb.Response>;
}
interface IStepExecutorServiceService_ITestConnection extends grpc.MethodDefinition<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response> {
    path: "/worker.v1.StepExecutorService/TestConnection";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<transport_v1_transport_pb.Request>;
    requestDeserialize: grpc.deserialize<transport_v1_transport_pb.Request>;
    responseSerialize: grpc.serialize<transport_v1_transport_pb.Response>;
    responseDeserialize: grpc.deserialize<transport_v1_transport_pb.Response>;
}
interface IStepExecutorServiceService_IDeleteDatasource extends grpc.MethodDefinition<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response> {
    path: "/worker.v1.StepExecutorService/DeleteDatasource";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<transport_v1_transport_pb.Request>;
    requestDeserialize: grpc.deserialize<transport_v1_transport_pb.Request>;
    responseSerialize: grpc.serialize<transport_v1_transport_pb.Response>;
    responseDeserialize: grpc.deserialize<transport_v1_transport_pb.Response>;
}

export const StepExecutorServiceService: IStepExecutorServiceService;

export interface IStepExecutorServiceServer extends grpc.UntypedServiceImplementation {
    stream: grpc.handleServerStreamingCall<transport_v1_transport_pb.Request, worker_v1_step_executor_pb.StringValue>;
    execute: grpc.handleUnaryCall<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response>;
    metadata: grpc.handleUnaryCall<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response>;
    testConnection: grpc.handleUnaryCall<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response>;
    deleteDatasource: grpc.handleUnaryCall<transport_v1_transport_pb.Request, transport_v1_transport_pb.Response>;
}

export interface IStepExecutorServiceClient {
    stream(request: transport_v1_transport_pb.Request, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<worker_v1_step_executor_pb.StringValue>;
    stream(request: transport_v1_transport_pb.Request, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<worker_v1_step_executor_pb.StringValue>;
    execute(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    execute(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    execute(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    metadata(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    metadata(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    metadata(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    testConnection(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    testConnection(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    testConnection(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    deleteDatasource(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    deleteDatasource(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    deleteDatasource(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
}

export class StepExecutorServiceClient extends grpc.Client implements IStepExecutorServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public stream(request: transport_v1_transport_pb.Request, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<worker_v1_step_executor_pb.StringValue>;
    public stream(request: transport_v1_transport_pb.Request, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<worker_v1_step_executor_pb.StringValue>;
    public execute(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public execute(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public execute(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public metadata(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public metadata(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public metadata(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public testConnection(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public testConnection(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public testConnection(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public deleteDatasource(request: transport_v1_transport_pb.Request, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public deleteDatasource(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
    public deleteDatasource(request: transport_v1_transport_pb.Request, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: transport_v1_transport_pb.Response) => void): grpc.ClientUnaryCall;
}
