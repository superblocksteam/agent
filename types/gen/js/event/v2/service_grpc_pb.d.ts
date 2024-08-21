// package: event.v2
// file: event/v2/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as event_v2_service_pb from "../../event/v2/service_pb";
import * as event_v2_cloudevent_pb from "../../event/v2/cloudevent_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

interface IEventsServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    receive: IEventsServiceService_IReceive;
    send: IEventsServiceService_ISend;
}

interface IEventsServiceService_IReceive extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, event_v2_cloudevent_pb.CloudEvent> {
    path: "/event.v2.EventsService/Receive";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<event_v2_cloudevent_pb.CloudEvent>;
    responseDeserialize: grpc.deserialize<event_v2_cloudevent_pb.CloudEvent>;
}
interface IEventsServiceService_ISend extends grpc.MethodDefinition<event_v2_cloudevent_pb.CloudEvent, google_protobuf_empty_pb.Empty> {
    path: "/event.v2.EventsService/Send";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<event_v2_cloudevent_pb.CloudEvent>;
    requestDeserialize: grpc.deserialize<event_v2_cloudevent_pb.CloudEvent>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const EventsServiceService: IEventsServiceService;

export interface IEventsServiceServer extends grpc.UntypedServiceImplementation {
    receive: grpc.handleServerStreamingCall<google_protobuf_empty_pb.Empty, event_v2_cloudevent_pb.CloudEvent>;
    send: grpc.handleUnaryCall<event_v2_cloudevent_pb.CloudEvent, google_protobuf_empty_pb.Empty>;
}

export interface IEventsServiceClient {
    receive(request: google_protobuf_empty_pb.Empty, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<event_v2_cloudevent_pb.CloudEvent>;
    receive(request: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<event_v2_cloudevent_pb.CloudEvent>;
    send(request: event_v2_cloudevent_pb.CloudEvent, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    send(request: event_v2_cloudevent_pb.CloudEvent, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    send(request: event_v2_cloudevent_pb.CloudEvent, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class EventsServiceClient extends grpc.Client implements IEventsServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public receive(request: google_protobuf_empty_pb.Empty, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<event_v2_cloudevent_pb.CloudEvent>;
    public receive(request: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<event_v2_cloudevent_pb.CloudEvent>;
    public send(request: event_v2_cloudevent_pb.CloudEvent, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public send(request: event_v2_cloudevent_pb.CloudEvent, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public send(request: event_v2_cloudevent_pb.CloudEvent, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}
