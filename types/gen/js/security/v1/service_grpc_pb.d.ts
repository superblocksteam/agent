// package: security.v1
// file: security/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as security_v1_service_pb from "../../security/v1/service_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as utils_v1_utils_pb from "../../utils/v1/utils_pb";

interface ISignatureServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    sign: ISignatureServiceService_ISign;
    verify: ISignatureServiceService_IVerify;
}

interface ISignatureServiceService_ISign extends grpc.MethodDefinition<security_v1_service_pb.SignRequest, security_v1_service_pb.SignResponse> {
    path: "/security.v1.SignatureService/Sign";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<security_v1_service_pb.SignRequest>;
    requestDeserialize: grpc.deserialize<security_v1_service_pb.SignRequest>;
    responseSerialize: grpc.serialize<security_v1_service_pb.SignResponse>;
    responseDeserialize: grpc.deserialize<security_v1_service_pb.SignResponse>;
}
interface ISignatureServiceService_IVerify extends grpc.MethodDefinition<security_v1_service_pb.VerifyRequest, security_v1_service_pb.VerifyResponse> {
    path: "/security.v1.SignatureService/Verify";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<security_v1_service_pb.VerifyRequest>;
    requestDeserialize: grpc.deserialize<security_v1_service_pb.VerifyRequest>;
    responseSerialize: grpc.serialize<security_v1_service_pb.VerifyResponse>;
    responseDeserialize: grpc.deserialize<security_v1_service_pb.VerifyResponse>;
}

export const SignatureServiceService: ISignatureServiceService;

export interface ISignatureServiceServer extends grpc.UntypedServiceImplementation {
    sign: grpc.handleUnaryCall<security_v1_service_pb.SignRequest, security_v1_service_pb.SignResponse>;
    verify: grpc.handleUnaryCall<security_v1_service_pb.VerifyRequest, security_v1_service_pb.VerifyResponse>;
}

export interface ISignatureServiceClient {
    sign(request: security_v1_service_pb.SignRequest, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    sign(request: security_v1_service_pb.SignRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    sign(request: security_v1_service_pb.SignRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    verify(request: security_v1_service_pb.VerifyRequest, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
    verify(request: security_v1_service_pb.VerifyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
    verify(request: security_v1_service_pb.VerifyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
}

export class SignatureServiceClient extends grpc.Client implements ISignatureServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public sign(request: security_v1_service_pb.SignRequest, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    public sign(request: security_v1_service_pb.SignRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    public sign(request: security_v1_service_pb.SignRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.SignResponse) => void): grpc.ClientUnaryCall;
    public verify(request: security_v1_service_pb.VerifyRequest, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
    public verify(request: security_v1_service_pb.VerifyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
    public verify(request: security_v1_service_pb.VerifyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: security_v1_service_pb.VerifyResponse) => void): grpc.ClientUnaryCall;
}
