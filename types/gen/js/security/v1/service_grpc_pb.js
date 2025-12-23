// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var security_v1_service_pb = require('../../security/v1/service_pb');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
var google_api_annotations_pb = require('../../google/api/annotations_pb');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var utils_v1_utils_pb = require('../../utils/v1/utils_pb');

function serialize_security_v1_SignRequest(arg) {
  if (!(arg instanceof security_v1_service_pb.SignRequest)) {
    throw new Error('Expected argument of type security.v1.SignRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_security_v1_SignRequest(buffer_arg) {
  return security_v1_service_pb.SignRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_security_v1_SignResponse(arg) {
  if (!(arg instanceof security_v1_service_pb.SignResponse)) {
    throw new Error('Expected argument of type security.v1.SignResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_security_v1_SignResponse(buffer_arg) {
  return security_v1_service_pb.SignResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_security_v1_VerifyRequest(arg) {
  if (!(arg instanceof security_v1_service_pb.VerifyRequest)) {
    throw new Error('Expected argument of type security.v1.VerifyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_security_v1_VerifyRequest(buffer_arg) {
  return security_v1_service_pb.VerifyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_security_v1_VerifyResponse(arg) {
  if (!(arg instanceof security_v1_service_pb.VerifyResponse)) {
    throw new Error('Expected argument of type security.v1.VerifyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_security_v1_VerifyResponse(buffer_arg) {
  return security_v1_service_pb.VerifyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var SignatureServiceService = exports.SignatureServiceService = {
  sign: {
    path: '/security.v1.SignatureService/Sign',
    requestStream: false,
    responseStream: false,
    requestType: security_v1_service_pb.SignRequest,
    responseType: security_v1_service_pb.SignResponse,
    requestSerialize: serialize_security_v1_SignRequest,
    requestDeserialize: deserialize_security_v1_SignRequest,
    responseSerialize: serialize_security_v1_SignResponse,
    responseDeserialize: deserialize_security_v1_SignResponse,
  },
  verify: {
    path: '/security.v1.SignatureService/Verify',
    requestStream: false,
    responseStream: false,
    requestType: security_v1_service_pb.VerifyRequest,
    responseType: security_v1_service_pb.VerifyResponse,
    requestSerialize: serialize_security_v1_VerifyRequest,
    requestDeserialize: deserialize_security_v1_VerifyRequest,
    responseSerialize: serialize_security_v1_VerifyResponse,
    responseDeserialize: deserialize_security_v1_VerifyResponse,
  },
};

exports.SignatureServiceClient = grpc.makeGenericClientConstructor(SignatureServiceService);
