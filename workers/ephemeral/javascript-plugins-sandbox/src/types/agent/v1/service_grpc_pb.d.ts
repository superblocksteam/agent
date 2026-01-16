// package: agent.v1
// file: agent/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as agent_v1_service_pb from "../../agent/v1/service_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface IAgentServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    register: IAgentServiceService_IRegister;
    audit: IAgentServiceService_IAudit;
}

interface IAgentServiceService_IRegister extends grpc.MethodDefinition<agent_v1_service_pb.RegistrationRequest, agent_v1_service_pb.RegistrationResponse> {
    path: "/agent.v1.AgentService/Register";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agent_v1_service_pb.RegistrationRequest>;
    requestDeserialize: grpc.deserialize<agent_v1_service_pb.RegistrationRequest>;
    responseSerialize: grpc.serialize<agent_v1_service_pb.RegistrationResponse>;
    responseDeserialize: grpc.deserialize<agent_v1_service_pb.RegistrationResponse>;
}
interface IAgentServiceService_IAudit extends grpc.MethodDefinition<agent_v1_service_pb.AuditLogRequest, google_protobuf_empty_pb.Empty> {
    path: "/agent.v1.AgentService/Audit";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agent_v1_service_pb.AuditLogRequest>;
    requestDeserialize: grpc.deserialize<agent_v1_service_pb.AuditLogRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const AgentServiceService: IAgentServiceService;

export interface IAgentServiceServer extends grpc.UntypedServiceImplementation {
    register: grpc.handleUnaryCall<agent_v1_service_pb.RegistrationRequest, agent_v1_service_pb.RegistrationResponse>;
    audit: grpc.handleUnaryCall<agent_v1_service_pb.AuditLogRequest, google_protobuf_empty_pb.Empty>;
}

export interface IAgentServiceClient {
    register(request: agent_v1_service_pb.RegistrationRequest, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    register(request: agent_v1_service_pb.RegistrationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    register(request: agent_v1_service_pb.RegistrationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    audit(request: agent_v1_service_pb.AuditLogRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    audit(request: agent_v1_service_pb.AuditLogRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    audit(request: agent_v1_service_pb.AuditLogRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class AgentServiceClient extends grpc.Client implements IAgentServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public register(request: agent_v1_service_pb.RegistrationRequest, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    public register(request: agent_v1_service_pb.RegistrationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    public register(request: agent_v1_service_pb.RegistrationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agent_v1_service_pb.RegistrationResponse) => void): grpc.ClientUnaryCall;
    public audit(request: agent_v1_service_pb.AuditLogRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public audit(request: agent_v1_service_pb.AuditLogRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public audit(request: agent_v1_service_pb.AuditLogRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}
