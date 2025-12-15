// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_executor_transport_pb = require('../../worker/v1/sandbox_executor_transport_pb.js');

function serialize_worker_v1_ExecuteRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.ExecuteRequest)) {
    throw new Error('Expected argument of type worker.v1.ExecuteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteRequest(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.ExecuteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_ExecuteResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.ExecuteResponse)) {
    throw new Error('Expected argument of type worker.v1.ExecuteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteResponse(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.ExecuteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service for executing code in Python/JavaScript workers
var SandboxExecutorTransportServiceService = exports.SandboxExecutorTransportServiceService = {
  execute: {
    path: '/worker.v1.SandboxExecutorTransportService/Execute',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.ExecuteRequest,
    responseType: worker_v1_sandbox_executor_transport_pb.ExecuteResponse,
    requestSerialize: serialize_worker_v1_ExecuteRequest,
    requestDeserialize: deserialize_worker_v1_ExecuteRequest,
    responseSerialize: serialize_worker_v1_ExecuteResponse,
    responseDeserialize: deserialize_worker_v1_ExecuteResponse,
  },
};

exports.SandboxExecutorTransportServiceClient = grpc.makeGenericClientConstructor(SandboxExecutorTransportServiceService);
