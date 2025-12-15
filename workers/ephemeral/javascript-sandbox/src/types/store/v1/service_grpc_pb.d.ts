// package: store.v1
// file: store/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as store_v1_service_pb from "../../store/v1/service_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as store_v1_store_pb from "../../store/v1/store_pb";

interface IStoreServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    read: IStoreServiceService_IRead;
    write: IStoreServiceService_IWrite;
}

interface IStoreServiceService_IRead extends grpc.MethodDefinition<store_v1_service_pb.ReadRequest, store_v1_service_pb.ReadResponse> {
    path: "/store.v1.StoreService/Read";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<store_v1_service_pb.ReadRequest>;
    requestDeserialize: grpc.deserialize<store_v1_service_pb.ReadRequest>;
    responseSerialize: grpc.serialize<store_v1_service_pb.ReadResponse>;
    responseDeserialize: grpc.deserialize<store_v1_service_pb.ReadResponse>;
}
interface IStoreServiceService_IWrite extends grpc.MethodDefinition<store_v1_service_pb.WriteRequest, store_v1_service_pb.WriteResponse> {
    path: "/store.v1.StoreService/Write";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<store_v1_service_pb.WriteRequest>;
    requestDeserialize: grpc.deserialize<store_v1_service_pb.WriteRequest>;
    responseSerialize: grpc.serialize<store_v1_service_pb.WriteResponse>;
    responseDeserialize: grpc.deserialize<store_v1_service_pb.WriteResponse>;
}

export const StoreServiceService: IStoreServiceService;

export interface IStoreServiceServer extends grpc.UntypedServiceImplementation {
    read: grpc.handleUnaryCall<store_v1_service_pb.ReadRequest, store_v1_service_pb.ReadResponse>;
    write: grpc.handleUnaryCall<store_v1_service_pb.WriteRequest, store_v1_service_pb.WriteResponse>;
}

export interface IStoreServiceClient {
    read(request: store_v1_service_pb.ReadRequest, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    read(request: store_v1_service_pb.ReadRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    read(request: store_v1_service_pb.ReadRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    write(request: store_v1_service_pb.WriteRequest, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    write(request: store_v1_service_pb.WriteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    write(request: store_v1_service_pb.WriteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
}

export class StoreServiceClient extends grpc.Client implements IStoreServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public read(request: store_v1_service_pb.ReadRequest, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    public read(request: store_v1_service_pb.ReadRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    public read(request: store_v1_service_pb.ReadRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.ReadResponse) => void): grpc.ClientUnaryCall;
    public write(request: store_v1_service_pb.WriteRequest, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    public write(request: store_v1_service_pb.WriteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    public write(request: store_v1_service_pb.WriteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: store_v1_service_pb.WriteResponse) => void): grpc.ClientUnaryCall;
}
