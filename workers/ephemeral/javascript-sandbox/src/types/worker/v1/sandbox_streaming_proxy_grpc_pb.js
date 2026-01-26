// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_streaming_proxy_pb = require('../../worker/v1/sandbox_streaming_proxy_pb.js');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var validate_validate_pb = require('../../validate/validate_pb.js');

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_SendRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_streaming_proxy_pb.SendRequest)) {
    throw new Error('Expected argument of type worker.v1.SendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_SendRequest(buffer_arg) {
  return worker_v1_sandbox_streaming_proxy_pb.SendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_UntilRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_streaming_proxy_pb.UntilRequest)) {
    throw new Error('Expected argument of type worker.v1.UntilRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_UntilRequest(buffer_arg) {
  return worker_v1_sandbox_streaming_proxy_pb.UntilRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var SandboxStreamingProxyServiceService = exports.SandboxStreamingProxyServiceService = {
  send: {
    path: '/worker.v1.SandboxStreamingProxyService/Send',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_streaming_proxy_pb.SendRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_worker_v1_SendRequest,
    requestDeserialize: deserialize_worker_v1_SendRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  until: {
    path: '/worker.v1.SandboxStreamingProxyService/Until',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_streaming_proxy_pb.UntilRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_worker_v1_UntilRequest,
    requestDeserialize: deserialize_worker_v1_UntilRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.SandboxStreamingProxyServiceClient = grpc.makeGenericClientConstructor(SandboxStreamingProxyServiceService);
