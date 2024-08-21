// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var ai_v1_service_pb = require('../../ai/v1/service_pb');
var ai_v1_ai_pb = require('../../ai/v1/ai_pb');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
var common_v1_health_pb = require('../../common/v1/health_pb');
var google_api_annotations_pb = require('../../google/api/annotations_pb');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb');
var validate_validate_pb = require('../../validate/validate_pb');

function serialize_ai_v1_CreateTaskRequest(arg) {
  if (!(arg instanceof ai_v1_service_pb.CreateTaskRequest)) {
    throw new Error('Expected argument of type ai.v1.CreateTaskRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ai_v1_CreateTaskRequest(buffer_arg) {
  return ai_v1_service_pb.CreateTaskRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_ai_v1_TaskEvent(arg) {
  if (!(arg instanceof ai_v1_service_pb.TaskEvent)) {
    throw new Error('Expected argument of type ai.v1.TaskEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ai_v1_TaskEvent(buffer_arg) {
  return ai_v1_service_pb.TaskEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_common_v1_HealthResponse(arg) {
  if (!(arg instanceof common_v1_health_pb.HealthResponse)) {
    throw new Error('Expected argument of type common.v1.HealthResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_common_v1_HealthResponse(buffer_arg) {
  return common_v1_health_pb.HealthResponse.deserializeBinary(new Uint8Array(buffer_arg));
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


var MetadataServiceService = exports.MetadataServiceService = {
  health: {
    path: '/ai.v1.MetadataService/Health',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: common_v1_health_pb.HealthResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_common_v1_HealthResponse,
    responseDeserialize: deserialize_common_v1_HealthResponse,
  },
};

exports.MetadataServiceClient = grpc.makeGenericClientConstructor(MetadataServiceService);
var TaskServiceService = exports.TaskServiceService = {
  create: {
    path: '/ai.v1.TaskService/Create',
    requestStream: false,
    responseStream: true,
    requestType: ai_v1_service_pb.CreateTaskRequest,
    responseType: ai_v1_service_pb.TaskEvent,
    requestSerialize: serialize_ai_v1_CreateTaskRequest,
    requestDeserialize: deserialize_ai_v1_CreateTaskRequest,
    responseSerialize: serialize_ai_v1_TaskEvent,
    responseDeserialize: deserialize_ai_v1_TaskEvent,
  },
};

exports.TaskServiceClient = grpc.makeGenericClientConstructor(TaskServiceService);
