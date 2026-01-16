// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_transport_pb = require('../../worker/v1/sandbox_transport_pb');
var api_v1_event_pb = require('../../api/v1/event_pb');
var common_v1_errors_pb = require('../../common/v1/errors_pb');
var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var transport_v1_transport_pb = require('../../transport/v1/transport_pb');

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_transport_v1_Response_Data_Data(arg) {
  if (!(arg instanceof transport_v1_transport_pb.Response.Data.Data)) {
    throw new Error('Expected argument of type transport.v1.Response.Data.Data');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_transport_v1_Response_Data_Data(buffer_arg) {
  return transport_v1_transport_pb.Response.Data.Data.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_ExecuteRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.ExecuteRequest)) {
    throw new Error('Expected argument of type worker.v1.ExecuteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteRequest(buffer_arg) {
  return worker_v1_sandbox_transport_pb.ExecuteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_ExecuteResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.ExecuteResponse)) {
    throw new Error('Expected argument of type worker.v1.ExecuteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteResponse(buffer_arg) {
  return worker_v1_sandbox_transport_pb.ExecuteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_MetadataRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.MetadataRequest)) {
    throw new Error('Expected argument of type worker.v1.MetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_MetadataRequest(buffer_arg) {
  return worker_v1_sandbox_transport_pb.MetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_PreDeleteRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.PreDeleteRequest)) {
    throw new Error('Expected argument of type worker.v1.PreDeleteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_PreDeleteRequest(buffer_arg) {
  return worker_v1_sandbox_transport_pb.PreDeleteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_StreamRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.StreamRequest)) {
    throw new Error('Expected argument of type worker.v1.StreamRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_StreamRequest(buffer_arg) {
  return worker_v1_sandbox_transport_pb.StreamRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_StreamResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.StreamResponse)) {
    throw new Error('Expected argument of type worker.v1.StreamResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_StreamResponse(buffer_arg) {
  return worker_v1_sandbox_transport_pb.StreamResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_TestRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_transport_pb.TestRequest)) {
    throw new Error('Expected argument of type worker.v1.TestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_TestRequest(buffer_arg) {
  return worker_v1_sandbox_transport_pb.TestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service for executing code in Python/JavaScript workers
var SandboxTransportServiceService = exports.SandboxTransportServiceService = {
  execute: {
    path: '/worker.v1.SandboxTransportService/Execute',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_transport_pb.ExecuteRequest,
    responseType: worker_v1_sandbox_transport_pb.ExecuteResponse,
    requestSerialize: serialize_worker_v1_ExecuteRequest,
    requestDeserialize: deserialize_worker_v1_ExecuteRequest,
    responseSerialize: serialize_worker_v1_ExecuteResponse,
    responseDeserialize: deserialize_worker_v1_ExecuteResponse,
  },
  stream: {
    path: '/worker.v1.SandboxTransportService/Stream',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_transport_pb.StreamRequest,
    responseType: worker_v1_sandbox_transport_pb.StreamResponse,
    requestSerialize: serialize_worker_v1_StreamRequest,
    requestDeserialize: deserialize_worker_v1_StreamRequest,
    responseSerialize: serialize_worker_v1_StreamResponse,
    responseDeserialize: deserialize_worker_v1_StreamResponse,
  },
  metadata: {
    path: '/worker.v1.SandboxTransportService/Metadata',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_transport_pb.MetadataRequest,
    responseType: transport_v1_transport_pb.Response.Data.Data,
    requestSerialize: serialize_worker_v1_MetadataRequest,
    requestDeserialize: deserialize_worker_v1_MetadataRequest,
    responseSerialize: serialize_transport_v1_Response_Data_Data,
    responseDeserialize: deserialize_transport_v1_Response_Data_Data,
  },
  test: {
    path: '/worker.v1.SandboxTransportService/Test',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_transport_pb.TestRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_worker_v1_TestRequest,
    requestDeserialize: deserialize_worker_v1_TestRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  preDelete: {
    path: '/worker.v1.SandboxTransportService/PreDelete',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_transport_pb.PreDeleteRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_worker_v1_PreDeleteRequest,
    requestDeserialize: deserialize_worker_v1_PreDeleteRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.SandboxTransportServiceClient = grpc.makeGenericClientConstructor(SandboxTransportServiceService);
