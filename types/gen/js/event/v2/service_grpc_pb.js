// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var event_v2_cloudevent_pb = require('../../event/v2/cloudevent_pb');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb');

function serialize_event_v2_CloudEvent(arg) {
  if (!(arg instanceof event_v2_cloudevent_pb.CloudEvent)) {
    throw new Error('Expected argument of type event.v2.CloudEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_event_v2_CloudEvent(buffer_arg) {
  return event_v2_cloudevent_pb.CloudEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var EventsServiceService = exports.EventsServiceService = {
  receive: {
    path: '/event.v2.EventsService/Receive',
    requestStream: false,
    responseStream: true,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: event_v2_cloudevent_pb.CloudEvent,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_event_v2_CloudEvent,
    responseDeserialize: deserialize_event_v2_CloudEvent,
  },
  send: {
    path: '/event.v2.EventsService/Send',
    requestStream: false,
    responseStream: false,
    requestType: event_v2_cloudevent_pb.CloudEvent,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_event_v2_CloudEvent,
    requestDeserialize: deserialize_event_v2_CloudEvent,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.EventsServiceClient = grpc.makeGenericClientConstructor(EventsServiceService);
