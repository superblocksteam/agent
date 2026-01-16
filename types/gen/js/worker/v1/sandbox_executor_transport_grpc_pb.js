// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_executor_transport_pb = require('../../worker/v1/sandbox_executor_transport_pb');

function serialize_worker_v1_ExecuteRequestV1(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1)) {
    throw new Error('Expected argument of type worker.v1.ExecuteRequestV1');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteRequestV1(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_ExecuteResponseV1(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1)) {
    throw new Error('Expected argument of type worker.v1.ExecuteResponseV1');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteResponseV1(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service for executing code in Python/JavaScript workers
var SandboxExecutorTransportServiceService = exports.SandboxExecutorTransportServiceService = {
  execute: {
    path: '/worker.v1.SandboxExecutorTransportService/Execute',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.ExecuteRequestV1,
    responseType: worker_v1_sandbox_executor_transport_pb.ExecuteResponseV1,
    requestSerialize: serialize_worker_v1_ExecuteRequestV1,
    requestDeserialize: deserialize_worker_v1_ExecuteRequestV1,
    responseSerialize: serialize_worker_v1_ExecuteResponseV1,
    responseDeserialize: deserialize_worker_v1_ExecuteResponseV1,
  },
};

exports.SandboxExecutorTransportServiceClient = grpc.makeGenericClientConstructor(SandboxExecutorTransportServiceService);
