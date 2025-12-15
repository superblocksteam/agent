// package: secrets.v1
// file: secrets/v1/store.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as secrets_v1_store_pb from "../../secrets/v1/store_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as secrets_v1_secrets_pb from "../../secrets/v1/secrets_pb";

interface IStoreServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    invalidate: IStoreServiceService_IInvalidate;
    listSecrets: IStoreServiceService_IListSecrets;
}

interface IStoreServiceService_IInvalidate extends grpc.MethodDefinition<secrets_v1_store_pb.InvalidateRequest, secrets_v1_store_pb.InvalidateResponse> {
    path: "/secrets.v1.StoreService/Invalidate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_v1_store_pb.InvalidateRequest>;
    requestDeserialize: grpc.deserialize<secrets_v1_store_pb.InvalidateRequest>;
    responseSerialize: grpc.serialize<secrets_v1_store_pb.InvalidateResponse>;
    responseDeserialize: grpc.deserialize<secrets_v1_store_pb.InvalidateResponse>;
}
interface IStoreServiceService_IListSecrets extends grpc.MethodDefinition<secrets_v1_store_pb.ListSecretsRequest, secrets_v1_store_pb.ListSecretsResponse> {
    path: "/secrets.v1.StoreService/ListSecrets";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_v1_store_pb.ListSecretsRequest>;
    requestDeserialize: grpc.deserialize<secrets_v1_store_pb.ListSecretsRequest>;
    responseSerialize: grpc.serialize<secrets_v1_store_pb.ListSecretsResponse>;
    responseDeserialize: grpc.deserialize<secrets_v1_store_pb.ListSecretsResponse>;
}

export const StoreServiceService: IStoreServiceService;

export interface IStoreServiceServer extends grpc.UntypedServiceImplementation {
    invalidate: grpc.handleUnaryCall<secrets_v1_store_pb.InvalidateRequest, secrets_v1_store_pb.InvalidateResponse>;
    listSecrets: grpc.handleUnaryCall<secrets_v1_store_pb.ListSecretsRequest, secrets_v1_store_pb.ListSecretsResponse>;
}

export interface IStoreServiceClient {
    invalidate(request: secrets_v1_store_pb.InvalidateRequest, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    invalidate(request: secrets_v1_store_pb.InvalidateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    invalidate(request: secrets_v1_store_pb.InvalidateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
    listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
    listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
}

export class StoreServiceClient extends grpc.Client implements IStoreServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public invalidate(request: secrets_v1_store_pb.InvalidateRequest, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    public invalidate(request: secrets_v1_store_pb.InvalidateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    public invalidate(request: secrets_v1_store_pb.InvalidateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.InvalidateResponse) => void): grpc.ClientUnaryCall;
    public listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
    public listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
    public listSecrets(request: secrets_v1_store_pb.ListSecretsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_v1_store_pb.ListSecretsResponse) => void): grpc.ClientUnaryCall;
}
