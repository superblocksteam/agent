// package: worker.v1
// file: worker/v1/sandbox_variable_store.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as worker_v1_sandbox_variable_store_pb from "../../worker/v1/sandbox_variable_store_pb";

interface ISandboxVariableStoreServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getVariable: ISandboxVariableStoreServiceService_IGetVariable;
    setVariable: ISandboxVariableStoreServiceService_ISetVariable;
    getVariables: ISandboxVariableStoreServiceService_IGetVariables;
    setVariables: ISandboxVariableStoreServiceService_ISetVariables;
}

interface ISandboxVariableStoreServiceService_IGetVariable extends grpc.MethodDefinition<worker_v1_sandbox_variable_store_pb.GetVariableRequest, worker_v1_sandbox_variable_store_pb.GetVariableResponse> {
    path: "/worker.v1.SandboxVariableStoreService/GetVariable";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.GetVariableRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.GetVariableRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.GetVariableResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.GetVariableResponse>;
}
interface ISandboxVariableStoreServiceService_ISetVariable extends grpc.MethodDefinition<worker_v1_sandbox_variable_store_pb.SetVariableRequest, worker_v1_sandbox_variable_store_pb.SetVariableResponse> {
    path: "/worker.v1.SandboxVariableStoreService/SetVariable";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.SetVariableRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.SetVariableRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.SetVariableResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.SetVariableResponse>;
}
interface ISandboxVariableStoreServiceService_IGetVariables extends grpc.MethodDefinition<worker_v1_sandbox_variable_store_pb.GetVariablesRequest, worker_v1_sandbox_variable_store_pb.GetVariablesResponse> {
    path: "/worker.v1.SandboxVariableStoreService/GetVariables";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.GetVariablesRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.GetVariablesRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.GetVariablesResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.GetVariablesResponse>;
}
interface ISandboxVariableStoreServiceService_ISetVariables extends grpc.MethodDefinition<worker_v1_sandbox_variable_store_pb.SetVariablesRequest, worker_v1_sandbox_variable_store_pb.SetVariablesResponse> {
    path: "/worker.v1.SandboxVariableStoreService/SetVariables";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.SetVariablesRequest>;
    requestDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.SetVariablesRequest>;
    responseSerialize: grpc.serialize<worker_v1_sandbox_variable_store_pb.SetVariablesResponse>;
    responseDeserialize: grpc.deserialize<worker_v1_sandbox_variable_store_pb.SetVariablesResponse>;
}

export const SandboxVariableStoreServiceService: ISandboxVariableStoreServiceService;

export interface ISandboxVariableStoreServiceServer extends grpc.UntypedServiceImplementation {
    getVariable: grpc.handleUnaryCall<worker_v1_sandbox_variable_store_pb.GetVariableRequest, worker_v1_sandbox_variable_store_pb.GetVariableResponse>;
    setVariable: grpc.handleUnaryCall<worker_v1_sandbox_variable_store_pb.SetVariableRequest, worker_v1_sandbox_variable_store_pb.SetVariableResponse>;
    getVariables: grpc.handleUnaryCall<worker_v1_sandbox_variable_store_pb.GetVariablesRequest, worker_v1_sandbox_variable_store_pb.GetVariablesResponse>;
    setVariables: grpc.handleUnaryCall<worker_v1_sandbox_variable_store_pb.SetVariablesRequest, worker_v1_sandbox_variable_store_pb.SetVariablesResponse>;
}

export interface ISandboxVariableStoreServiceClient {
    getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
}

export class SandboxVariableStoreServiceClient extends grpc.Client implements ISandboxVariableStoreServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariable(request: worker_v1_sandbox_variable_store_pb.GetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public setVariable(request: worker_v1_sandbox_variable_store_pb.SetVariableRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariableResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public getVariables(request: worker_v1_sandbox_variable_store_pb.GetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.GetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
    public setVariables(request: worker_v1_sandbox_variable_store_pb.SetVariablesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: worker_v1_sandbox_variable_store_pb.SetVariablesResponse) => void): grpc.ClientUnaryCall;
}
