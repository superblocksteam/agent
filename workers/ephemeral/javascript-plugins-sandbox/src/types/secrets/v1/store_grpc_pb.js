// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var secrets_v1_store_pb = require('../../secrets/v1/store_pb.js');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb.js');
var common_v1_common_pb = require('../../common/v1/common_pb.js');
var common_v1_errors_pb = require('../../common/v1/errors_pb.js');
var google_api_annotations_pb = require('../../google/api/annotations_pb.js');
var secrets_v1_secrets_pb = require('../../secrets/v1/secrets_pb.js');

function serialize_secrets_v1_InvalidateRequest(arg) {
  if (!(arg instanceof secrets_v1_store_pb.InvalidateRequest)) {
    throw new Error('Expected argument of type secrets.v1.InvalidateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_secrets_v1_InvalidateRequest(buffer_arg) {
  return secrets_v1_store_pb.InvalidateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_secrets_v1_InvalidateResponse(arg) {
  if (!(arg instanceof secrets_v1_store_pb.InvalidateResponse)) {
    throw new Error('Expected argument of type secrets.v1.InvalidateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_secrets_v1_InvalidateResponse(buffer_arg) {
  return secrets_v1_store_pb.InvalidateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_secrets_v1_ListSecretsRequest(arg) {
  if (!(arg instanceof secrets_v1_store_pb.ListSecretsRequest)) {
    throw new Error('Expected argument of type secrets.v1.ListSecretsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_secrets_v1_ListSecretsRequest(buffer_arg) {
  return secrets_v1_store_pb.ListSecretsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_secrets_v1_ListSecretsResponse(arg) {
  if (!(arg instanceof secrets_v1_store_pb.ListSecretsResponse)) {
    throw new Error('Expected argument of type secrets.v1.ListSecretsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_secrets_v1_ListSecretsResponse(buffer_arg) {
  return secrets_v1_store_pb.ListSecretsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var StoreServiceService = exports.StoreServiceService = {
  invalidate: {
    path: '/secrets.v1.StoreService/Invalidate',
    requestStream: false,
    responseStream: false,
    requestType: secrets_v1_store_pb.InvalidateRequest,
    responseType: secrets_v1_store_pb.InvalidateResponse,
    requestSerialize: serialize_secrets_v1_InvalidateRequest,
    requestDeserialize: deserialize_secrets_v1_InvalidateRequest,
    responseSerialize: serialize_secrets_v1_InvalidateResponse,
    responseDeserialize: deserialize_secrets_v1_InvalidateResponse,
  },
  listSecrets: {
    path: '/secrets.v1.StoreService/ListSecrets',
    requestStream: false,
    responseStream: false,
    requestType: secrets_v1_store_pb.ListSecretsRequest,
    responseType: secrets_v1_store_pb.ListSecretsResponse,
    requestSerialize: serialize_secrets_v1_ListSecretsRequest,
    requestDeserialize: deserialize_secrets_v1_ListSecretsRequest,
    responseSerialize: serialize_secrets_v1_ListSecretsResponse,
    responseDeserialize: deserialize_secrets_v1_ListSecretsResponse,
  },
};

exports.StoreServiceClient = grpc.makeGenericClientConstructor(StoreServiceService);
