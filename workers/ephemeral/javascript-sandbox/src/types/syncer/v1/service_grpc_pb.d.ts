// package: syncer.v1
// file: syncer/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as syncer_v1_service_pb from "../../syncer/v1/service_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as event_v1_service_pb from "../../event/v1/service_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as syncer_v1_syncer_pb from "../../syncer/v1/syncer_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

interface IIntakeServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    upsertMetadata: IIntakeServiceService_IUpsertMetadata;
    deleteMetadata: IIntakeServiceService_IDeleteMetadata;
    ingestEvent: IIntakeServiceService_IIngestEvent;
}

interface IIntakeServiceService_IUpsertMetadata extends grpc.MethodDefinition<syncer_v1_service_pb.UpsertMetadataRequest, syncer_v1_service_pb.UpsertMetadataResponse> {
    path: "/syncer.v1.IntakeService/UpsertMetadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<syncer_v1_service_pb.UpsertMetadataRequest>;
    requestDeserialize: grpc.deserialize<syncer_v1_service_pb.UpsertMetadataRequest>;
    responseSerialize: grpc.serialize<syncer_v1_service_pb.UpsertMetadataResponse>;
    responseDeserialize: grpc.deserialize<syncer_v1_service_pb.UpsertMetadataResponse>;
}
interface IIntakeServiceService_IDeleteMetadata extends grpc.MethodDefinition<syncer_v1_service_pb.DeleteMetadataRequest, syncer_v1_service_pb.DeleteMetadataResponse> {
    path: "/syncer.v1.IntakeService/DeleteMetadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<syncer_v1_service_pb.DeleteMetadataRequest>;
    requestDeserialize: grpc.deserialize<syncer_v1_service_pb.DeleteMetadataRequest>;
    responseSerialize: grpc.serialize<syncer_v1_service_pb.DeleteMetadataResponse>;
    responseDeserialize: grpc.deserialize<syncer_v1_service_pb.DeleteMetadataResponse>;
}
interface IIntakeServiceService_IIngestEvent extends grpc.MethodDefinition<event_v1_service_pb.IngestEventRequest, event_v1_service_pb.IngestEventResponse> {
    path: "/syncer.v1.IntakeService/IngestEvent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<event_v1_service_pb.IngestEventRequest>;
    requestDeserialize: grpc.deserialize<event_v1_service_pb.IngestEventRequest>;
    responseSerialize: grpc.serialize<event_v1_service_pb.IngestEventResponse>;
    responseDeserialize: grpc.deserialize<event_v1_service_pb.IngestEventResponse>;
}

export const IntakeServiceService: IIntakeServiceService;

export interface IIntakeServiceServer extends grpc.UntypedServiceImplementation {
    upsertMetadata: grpc.handleUnaryCall<syncer_v1_service_pb.UpsertMetadataRequest, syncer_v1_service_pb.UpsertMetadataResponse>;
    deleteMetadata: grpc.handleUnaryCall<syncer_v1_service_pb.DeleteMetadataRequest, syncer_v1_service_pb.DeleteMetadataResponse>;
    ingestEvent: grpc.handleUnaryCall<event_v1_service_pb.IngestEventRequest, event_v1_service_pb.IngestEventResponse>;
}

export interface IIntakeServiceClient {
    upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    ingestEvent(request: event_v1_service_pb.IngestEventRequest, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
    ingestEvent(request: event_v1_service_pb.IngestEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
    ingestEvent(request: event_v1_service_pb.IngestEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
}

export class IntakeServiceClient extends grpc.Client implements IIntakeServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    public upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    public upsertMetadata(request: syncer_v1_service_pb.UpsertMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.UpsertMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteMetadata(request: syncer_v1_service_pb.DeleteMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.DeleteMetadataResponse) => void): grpc.ClientUnaryCall;
    public ingestEvent(request: event_v1_service_pb.IngestEventRequest, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
    public ingestEvent(request: event_v1_service_pb.IngestEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
    public ingestEvent(request: event_v1_service_pb.IngestEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: event_v1_service_pb.IngestEventResponse) => void): grpc.ClientUnaryCall;
}

interface ISyncerServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    sync: ISyncerServiceService_ISync;
}

interface ISyncerServiceService_ISync extends grpc.MethodDefinition<syncer_v1_service_pb.SyncRequest, syncer_v1_service_pb.SyncResponse> {
    path: "/syncer.v1.SyncerService/Sync";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<syncer_v1_service_pb.SyncRequest>;
    requestDeserialize: grpc.deserialize<syncer_v1_service_pb.SyncRequest>;
    responseSerialize: grpc.serialize<syncer_v1_service_pb.SyncResponse>;
    responseDeserialize: grpc.deserialize<syncer_v1_service_pb.SyncResponse>;
}

export const SyncerServiceService: ISyncerServiceService;

export interface ISyncerServiceServer extends grpc.UntypedServiceImplementation {
    sync: grpc.handleUnaryCall<syncer_v1_service_pb.SyncRequest, syncer_v1_service_pb.SyncResponse>;
}

export interface ISyncerServiceClient {
    sync(request: syncer_v1_service_pb.SyncRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
    sync(request: syncer_v1_service_pb.SyncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
    sync(request: syncer_v1_service_pb.SyncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
}

export class SyncerServiceClient extends grpc.Client implements ISyncerServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public sync(request: syncer_v1_service_pb.SyncRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
    public sync(request: syncer_v1_service_pb.SyncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
    public sync(request: syncer_v1_service_pb.SyncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.SyncResponse) => void): grpc.ClientUnaryCall;
}

interface IIntegrationServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getConfigurationMetadata: IIntegrationServiceService_IGetConfigurationMetadata;
}

interface IIntegrationServiceService_IGetConfigurationMetadata extends grpc.MethodDefinition<syncer_v1_service_pb.GetConfigurationMetadataRequest, syncer_v1_service_pb.GetConfigurationMetadataResponse> {
    path: "/syncer.v1.IntegrationService/GetConfigurationMetadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<syncer_v1_service_pb.GetConfigurationMetadataRequest>;
    requestDeserialize: grpc.deserialize<syncer_v1_service_pb.GetConfigurationMetadataRequest>;
    responseSerialize: grpc.serialize<syncer_v1_service_pb.GetConfigurationMetadataResponse>;
    responseDeserialize: grpc.deserialize<syncer_v1_service_pb.GetConfigurationMetadataResponse>;
}

export const IntegrationServiceService: IIntegrationServiceService;

export interface IIntegrationServiceServer extends grpc.UntypedServiceImplementation {
    getConfigurationMetadata: grpc.handleUnaryCall<syncer_v1_service_pb.GetConfigurationMetadataRequest, syncer_v1_service_pb.GetConfigurationMetadataResponse>;
}

export interface IIntegrationServiceClient {
    getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
    getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
    getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
}

export class IntegrationServiceClient extends grpc.Client implements IIntegrationServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
    public getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
    public getConfigurationMetadata(request: syncer_v1_service_pb.GetConfigurationMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: syncer_v1_service_pb.GetConfigurationMetadataResponse) => void): grpc.ClientUnaryCall;
}
