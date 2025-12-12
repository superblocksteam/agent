// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_executor_transport_pb = require('../../worker/v1/sandbox_executor_transport_pb');

function serialize_worker_v1_GetVariableRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.GetVariableRequest)) {
    throw new Error('Expected argument of type worker.v1.GetVariableRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_GetVariableRequest(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.GetVariableRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_GetVariableResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.GetVariableResponse)) {
    throw new Error('Expected argument of type worker.v1.GetVariableResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_GetVariableResponse(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.GetVariableResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_GetVariablesRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.GetVariablesRequest)) {
    throw new Error('Expected argument of type worker.v1.GetVariablesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_GetVariablesRequest(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.GetVariablesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_GetVariablesResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.GetVariablesResponse)) {
    throw new Error('Expected argument of type worker.v1.GetVariablesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_GetVariablesResponse(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.GetVariablesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_SetVariableRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.SetVariableRequest)) {
    throw new Error('Expected argument of type worker.v1.SetVariableRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_SetVariableRequest(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.SetVariableRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_SetVariableResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.SetVariableResponse)) {
    throw new Error('Expected argument of type worker.v1.SetVariableResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_SetVariableResponse(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.SetVariableResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_SetVariablesRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.SetVariablesRequest)) {
    throw new Error('Expected argument of type worker.v1.SetVariablesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_SetVariablesRequest(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.SetVariablesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_SetVariablesResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_executor_transport_pb.SetVariablesResponse)) {
    throw new Error('Expected argument of type worker.v1.SetVariablesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_SetVariablesResponse(buffer_arg) {
  return worker_v1_sandbox_executor_transport_pb.SetVariablesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var SandboxVariableStoreServiceService = exports.SandboxVariableStoreServiceService = {
  getVariable: {
    path: '/worker.v1.SandboxVariableStoreService/GetVariable',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.GetVariableRequest,
    responseType: worker_v1_sandbox_executor_transport_pb.GetVariableResponse,
    requestSerialize: serialize_worker_v1_GetVariableRequest,
    requestDeserialize: deserialize_worker_v1_GetVariableRequest,
    responseSerialize: serialize_worker_v1_GetVariableResponse,
    responseDeserialize: deserialize_worker_v1_GetVariableResponse,
  },
  setVariable: {
    path: '/worker.v1.SandboxVariableStoreService/SetVariable',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.SetVariableRequest,
    responseType: worker_v1_sandbox_executor_transport_pb.SetVariableResponse,
    requestSerialize: serialize_worker_v1_SetVariableRequest,
    requestDeserialize: deserialize_worker_v1_SetVariableRequest,
    responseSerialize: serialize_worker_v1_SetVariableResponse,
    responseDeserialize: deserialize_worker_v1_SetVariableResponse,
  },
  getVariables: {
    path: '/worker.v1.SandboxVariableStoreService/GetVariables',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.GetVariablesRequest,
    responseType: worker_v1_sandbox_executor_transport_pb.GetVariablesResponse,
    requestSerialize: serialize_worker_v1_GetVariablesRequest,
    requestDeserialize: deserialize_worker_v1_GetVariablesRequest,
    responseSerialize: serialize_worker_v1_GetVariablesResponse,
    responseDeserialize: deserialize_worker_v1_GetVariablesResponse,
  },
  setVariables: {
    path: '/worker.v1.SandboxVariableStoreService/SetVariables',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_executor_transport_pb.SetVariablesRequest,
    responseType: worker_v1_sandbox_executor_transport_pb.SetVariablesResponse,
    requestSerialize: serialize_worker_v1_SetVariablesRequest,
    requestDeserialize: deserialize_worker_v1_SetVariablesRequest,
    responseSerialize: serialize_worker_v1_SetVariablesResponse,
    responseDeserialize: deserialize_worker_v1_SetVariablesResponse,
  },
};

exports.SandboxVariableStoreServiceClient = grpc.makeGenericClientConstructor(SandboxVariableStoreServiceService);
