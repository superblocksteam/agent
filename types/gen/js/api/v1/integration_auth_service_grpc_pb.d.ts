// package: api.v1
// file: api/v1/integration_auth_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as api_v1_integration_auth_service_pb from "../../api/v1/integration_auth_service_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as plugins_common_v1_auth_pb from "../../plugins/common/v1/auth_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface IIntegrationAuthServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    checkAuth: IIntegrationAuthServiceService_ICheckAuth;
    login: IIntegrationAuthServiceService_ILogin;
    logout: IIntegrationAuthServiceService_ILogout;
    exchangeOauthCodeForToken: IIntegrationAuthServiceService_IExchangeOauthCodeForToken;
    requestOauthPasswordToken: IIntegrationAuthServiceService_IRequestOauthPasswordToken;
}

interface IIntegrationAuthServiceService_ICheckAuth extends grpc.MethodDefinition<api_v1_integration_auth_service_pb.CheckAuthRequest, api_v1_integration_auth_service_pb.CheckAuthResponse> {
    path: "/api.v1.IntegrationAuthService/CheckAuth";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_integration_auth_service_pb.CheckAuthRequest>;
    requestDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.CheckAuthRequest>;
    responseSerialize: grpc.serialize<api_v1_integration_auth_service_pb.CheckAuthResponse>;
    responseDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.CheckAuthResponse>;
}
interface IIntegrationAuthServiceService_ILogin extends grpc.MethodDefinition<api_v1_integration_auth_service_pb.LoginRequest, api_v1_integration_auth_service_pb.LoginResponse> {
    path: "/api.v1.IntegrationAuthService/Login";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_integration_auth_service_pb.LoginRequest>;
    requestDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.LoginRequest>;
    responseSerialize: grpc.serialize<api_v1_integration_auth_service_pb.LoginResponse>;
    responseDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.LoginResponse>;
}
interface IIntegrationAuthServiceService_ILogout extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, google_protobuf_empty_pb.Empty> {
    path: "/api.v1.IntegrationAuthService/Logout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IIntegrationAuthServiceService_IExchangeOauthCodeForToken extends grpc.MethodDefinition<api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, google_protobuf_empty_pb.Empty> {
    path: "/api.v1.IntegrationAuthService/ExchangeOauthCodeForToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest>;
    requestDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IIntegrationAuthServiceService_IRequestOauthPasswordToken extends grpc.MethodDefinition<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse> {
    path: "/api.v1.IntegrationAuthService/RequestOauthPasswordToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest>;
    requestDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest>;
    responseSerialize: grpc.serialize<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse>;
    responseDeserialize: grpc.deserialize<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse>;
}

export const IntegrationAuthServiceService: IIntegrationAuthServiceService;

export interface IIntegrationAuthServiceServer extends grpc.UntypedServiceImplementation {
    checkAuth: grpc.handleUnaryCall<api_v1_integration_auth_service_pb.CheckAuthRequest, api_v1_integration_auth_service_pb.CheckAuthResponse>;
    login: grpc.handleUnaryCall<api_v1_integration_auth_service_pb.LoginRequest, api_v1_integration_auth_service_pb.LoginResponse>;
    logout: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, google_protobuf_empty_pb.Empty>;
    exchangeOauthCodeForToken: grpc.handleUnaryCall<api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, google_protobuf_empty_pb.Empty>;
    requestOauthPasswordToken: grpc.handleUnaryCall<api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse>;
}

export interface IIntegrationAuthServiceClient {
    checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    login(request: api_v1_integration_auth_service_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: api_v1_integration_auth_service_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: api_v1_integration_auth_service_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    logout(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    logout(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    logout(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
    requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
    requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
}

export class IntegrationAuthServiceClient extends grpc.Client implements IIntegrationAuthServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    public checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    public checkAuth(request: api_v1_integration_auth_service_pb.CheckAuthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.CheckAuthResponse) => void): grpc.ClientUnaryCall;
    public login(request: api_v1_integration_auth_service_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: api_v1_integration_auth_service_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: api_v1_integration_auth_service_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public logout(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public logout(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public logout(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public exchangeOauthCodeForToken(request: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
    public requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
    public requestOauthPasswordToken(request: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse) => void): grpc.ClientUnaryCall;
}
