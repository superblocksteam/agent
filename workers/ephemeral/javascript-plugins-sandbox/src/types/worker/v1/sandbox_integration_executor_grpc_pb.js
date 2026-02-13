// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var worker_v1_sandbox_integration_executor_pb = require('../../worker/v1/sandbox_integration_executor_pb.js');
var api_v1_service_pb = require('../../api/v1/service_pb.js');
var common_v1_common_pb = require('../../common/v1/common_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_worker_v1_ExecuteIntegrationRequest(arg) {
  if (!(arg instanceof worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest)) {
    throw new Error('Expected argument of type worker.v1.ExecuteIntegrationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteIntegrationRequest(buffer_arg) {
  return worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_worker_v1_ExecuteIntegrationResponse(arg) {
  if (!(arg instanceof worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse)) {
    throw new Error('Expected argument of type worker.v1.ExecuteIntegrationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_worker_v1_ExecuteIntegrationResponse(buffer_arg) {
  return worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service for executing integrations from sandbox code.
// The sandbox calls this service on the task-manager (co-located in the same
// pod via localhost) to trigger integration execution. The task-manager builds
// an inline Definition and proxies the request to the orchestrator's Await
// endpoint, forwarding the stored JWT for authorization.
var SandboxIntegrationExecutorServiceService = exports.SandboxIntegrationExecutorServiceService = {
  executeIntegration: {
    path: '/worker.v1.SandboxIntegrationExecutorService/ExecuteIntegration',
    requestStream: false,
    responseStream: false,
    requestType: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationRequest,
    responseType: worker_v1_sandbox_integration_executor_pb.ExecuteIntegrationResponse,
    requestSerialize: serialize_worker_v1_ExecuteIntegrationRequest,
    requestDeserialize: deserialize_worker_v1_ExecuteIntegrationRequest,
    responseSerialize: serialize_worker_v1_ExecuteIntegrationResponse,
    responseDeserialize: deserialize_worker_v1_ExecuteIntegrationResponse,
  },
};

exports.SandboxIntegrationExecutorServiceClient = grpc.makeGenericClientConstructor(SandboxIntegrationExecutorServiceService);
