// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_step_executor_pb = require('../../worker/v1/step_executor_pb.js');
var transport_v1_transport_pb = require('../../transport/v1/transport_pb.js');

function serialize_transport_v1_Request(arg) {
  if (!(arg instanceof transport_v1_transport_pb.Request)) {
    throw new Error('Expected argument of type transport.v1.Request');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_transport_v1_Request(buffer_arg) {
  return transport_v1_transport_pb.Request.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_transport_v1_Response(arg) {
  if (!(arg instanceof transport_v1_transport_pb.Response)) {
    throw new Error('Expected argument of type transport.v1.Response');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_transport_v1_Response(buffer_arg) {
  return transport_v1_transport_pb.Response.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_StringValue(arg) {
  if (!(arg instanceof worker_v1_step_executor_pb.StringValue)) {
    throw new Error('Expected argument of type worker.v1.StringValue');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_StringValue(buffer_arg) {
  return worker_v1_step_executor_pb.StringValue.deserializeBinary(new Uint8Array(buffer_arg));
}


var StepExecutorServiceService = exports.StepExecutorServiceService = {
  stream: {
    path: '/worker.v1.StepExecutorService/Stream',
    requestStream: false,
    responseStream: true,
    requestType: transport_v1_transport_pb.Request,
    responseType: worker_v1_step_executor_pb.StringValue,
    requestSerialize: serialize_transport_v1_Request,
    requestDeserialize: deserialize_transport_v1_Request,
    responseSerialize: serialize_worker_v1_StringValue,
    responseDeserialize: deserialize_worker_v1_StringValue,
  },
  execute: {
    path: '/worker.v1.StepExecutorService/Execute',
    requestStream: false,
    responseStream: false,
    requestType: transport_v1_transport_pb.Request,
    responseType: transport_v1_transport_pb.Response,
    requestSerialize: serialize_transport_v1_Request,
    requestDeserialize: deserialize_transport_v1_Request,
    responseSerialize: serialize_transport_v1_Response,
    responseDeserialize: deserialize_transport_v1_Response,
  },
  metadata: {
    path: '/worker.v1.StepExecutorService/Metadata',
    requestStream: false,
    responseStream: false,
    requestType: transport_v1_transport_pb.Request,
    responseType: transport_v1_transport_pb.Response,
    requestSerialize: serialize_transport_v1_Request,
    requestDeserialize: deserialize_transport_v1_Request,
    responseSerialize: serialize_transport_v1_Response,
    responseDeserialize: deserialize_transport_v1_Response,
  },
  testConnection: {
    path: '/worker.v1.StepExecutorService/TestConnection',
    requestStream: false,
    responseStream: false,
    requestType: transport_v1_transport_pb.Request,
    responseType: transport_v1_transport_pb.Response,
    requestSerialize: serialize_transport_v1_Request,
    requestDeserialize: deserialize_transport_v1_Request,
    responseSerialize: serialize_transport_v1_Response,
    responseDeserialize: deserialize_transport_v1_Response,
  },
  deleteDatasource: {
    path: '/worker.v1.StepExecutorService/DeleteDatasource',
    requestStream: false,
    responseStream: false,
    requestType: transport_v1_transport_pb.Request,
    responseType: transport_v1_transport_pb.Response,
    requestSerialize: serialize_transport_v1_Request,
    requestDeserialize: deserialize_transport_v1_Request,
    responseSerialize: serialize_transport_v1_Response,
    responseDeserialize: deserialize_transport_v1_Response,
  },
};

exports.StepExecutorServiceClient = grpc.makeGenericClientConstructor(StepExecutorServiceService);
