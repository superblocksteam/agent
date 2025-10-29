// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var agent_v1_service_pb = require('../../agent/v1/service_pb.js');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb.js');
var common_v1_common_pb = require('../../common/v1/common_pb.js');
var google_api_annotations_pb = require('../../google/api/annotations_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb.js');
var validate_validate_pb = require('../../validate/validate_pb.js');

function serialize_agent_v1_AuditLogRequest(arg) {
  if (!(arg instanceof agent_v1_service_pb.AuditLogRequest)) {
    throw new Error('Expected argument of type agent.v1.AuditLogRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_agent_v1_AuditLogRequest(buffer_arg) {
  return agent_v1_service_pb.AuditLogRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_agent_v1_RegistrationRequest(arg) {
  if (!(arg instanceof agent_v1_service_pb.RegistrationRequest)) {
    throw new Error('Expected argument of type agent.v1.RegistrationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_agent_v1_RegistrationRequest(buffer_arg) {
  return agent_v1_service_pb.RegistrationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_agent_v1_RegistrationResponse(arg) {
  if (!(arg instanceof agent_v1_service_pb.RegistrationResponse)) {
    throw new Error('Expected argument of type agent.v1.RegistrationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_agent_v1_RegistrationResponse(buffer_arg) {
  return agent_v1_service_pb.RegistrationResponse.deserializeBinary(new Uint8Array(buffer_arg));
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


var AgentServiceService = exports.AgentServiceService = {
  register: {
    path: '/agent.v1.AgentService/Register',
    requestStream: false,
    responseStream: false,
    requestType: agent_v1_service_pb.RegistrationRequest,
    responseType: agent_v1_service_pb.RegistrationResponse,
    requestSerialize: serialize_agent_v1_RegistrationRequest,
    requestDeserialize: deserialize_agent_v1_RegistrationRequest,
    responseSerialize: serialize_agent_v1_RegistrationResponse,
    responseDeserialize: deserialize_agent_v1_RegistrationResponse,
  },
  audit: {
    path: '/agent.v1.AgentService/Audit',
    requestStream: false,
    responseStream: false,
    requestType: agent_v1_service_pb.AuditLogRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_agent_v1_AuditLogRequest,
    requestDeserialize: deserialize_agent_v1_AuditLogRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.AgentServiceClient = grpc.makeGenericClientConstructor(AgentServiceService);
