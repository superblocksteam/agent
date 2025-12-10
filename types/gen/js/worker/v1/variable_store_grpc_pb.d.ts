// package: worker.v1
// file: worker/v1/variable_store.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_variable_store_pb from "../../worker/v1/variable_store_pb";
import * as worker_v1_sandbox_executor_transport_pb from "../../worker/v1/sandbox_executor_transport_pb";

interface IVariableStoreServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getVariable: IVariableStoreServiceService_IGetVariable;
    setVariable: IVariableStoreServiceService_ISetVariable;
    getVariables: IVariableStoreServiceService_IGetVariables;
    setVariables: IVariableStoreServiceService_ISetVariables;
}

interface IVariableStoreServiceService_IGetVariable extends grpc.MethodDefinition<worker_v1_sandbox_executor_transport_pb.GetVariableRequest, worker_v1_sandbox_executor_transport_pb.GetVariableResponse> {
    path: "/worker.v1.VariableStoreService/GetVariable";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.GetVariableRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.GetVariableRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.GetVariableResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.GetVariableResponse>;
}
interface IVariableStoreServiceService_ISetVariable extends grpc.MethodDefinition<worker_v1_sandbox_executor_transport_pb.SetVariableRequest, worker_v1_sandbox_executor_transport_pb.SetVariableResponse> {
    path: "/worker.v1.VariableStoreService/SetVariable";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.SetVariableRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.SetVariableRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.SetVariableResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.SetVariableResponse>;
}
interface IVariableStoreServiceService_IGetVariables extends grpc.MethodDefinition<worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, worker_v1_sandbox_executor_transport_pb.GetVariablesResponse> {
    path: "/worker.v1.VariableStoreService/GetVariables";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.GetVariablesRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.GetVariablesRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.GetVariablesResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.GetVariablesResponse>;
}
interface IVariableStoreServiceService_ISetVariables extends grpc.MethodDefinition<worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, worker_v1_sandbox_executor_transport_pb.SetVariablesResponse> {
    path: "/worker.v1.VariableStoreService/SetVariables";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.SetVariablesRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.SetVariablesRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_executor_transport_pb.SetVariablesResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_executor_transport_pb.SetVariablesResponse>;
}

export const VariableStoreServiceService: IVariableStoreServiceService;

export interface IVariableStoreServiceServer extends grpc.UntypedServiceImplementation {
    getVariable: grpc.handleUnaryCall<worker_v1_sandbox_executor_transport_pb.GetVariableRequest, worker_v1_sandbox_executor_transport_pb.GetVariableResponse>;
    setVariable: grpc.handleUnaryCall<worker_v1_sandbox_executor_transport_pb.SetVariableRequest, worker_v1_sandbox_executor_transport_pb.SetVariableResponse>;
    getVariables: grpc.handleUnaryCall<worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, worker_v1_sandbox_executor_transport_pb.GetVariablesResponse>;
    setVariables: grpc.handleUnaryCall<worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, worker_v1_sandbox_executor_transport_pb.SetVariablesResponse>;
}

export interface IVariableStoreServiceClient {
    getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
}

export class VariableStoreServiceClient extends grpc.Client implements IVariableStoreServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariable(request: worker_v1_sandbox_executor_transport_pb.GetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_executor_transport_pb.SetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
}
