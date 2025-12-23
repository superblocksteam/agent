// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var store_v1_service_pb = require('../../store/v1/service_pb');
var common_v1_errors_pb = require('../../common/v1/errors_pb');
var google_api_annotations_pb = require('../../google/api/annotations_pb');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb');
var store_v1_store_pb = require('../../store/v1/store_pb');

function serialize_store_v1_ReadRequest(arg) {
  if (!(arg instanceof store_v1_service_pb.ReadRequest)) {
    throw new Error('Expected argument of type store.v1.ReadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_store_v1_ReadRequest(buffer_arg) {
  return store_v1_service_pb.ReadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_store_v1_ReadResponse(arg) {
  if (!(arg instanceof store_v1_service_pb.ReadResponse)) {
    throw new Error('Expected argument of type store.v1.ReadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_store_v1_ReadResponse(buffer_arg) {
  return store_v1_service_pb.ReadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_store_v1_WriteRequest(arg) {
  if (!(arg instanceof store_v1_service_pb.WriteRequest)) {
    throw new Error('Expected argument of type store.v1.WriteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_store_v1_WriteRequest(buffer_arg) {
  return store_v1_service_pb.WriteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_store_v1_WriteResponse(arg) {
  if (!(arg instanceof store_v1_service_pb.WriteResponse)) {
    throw new Error('Expected argument of type store.v1.WriteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_store_v1_WriteResponse(buffer_arg) {
  return store_v1_service_pb.WriteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var StoreServiceService = exports.StoreServiceService = {
  read: {
    path: '/store.v1.StoreService/Read',
    requestStream: false,
    responseStream: false,
    requestType: store_v1_service_pb.ReadRequest,
    responseType: store_v1_service_pb.ReadResponse,
    requestSerialize: serialize_store_v1_ReadRequest,
    requestDeserialize: deserialize_store_v1_ReadRequest,
    responseSerialize: serialize_store_v1_ReadResponse,
    responseDeserialize: deserialize_store_v1_ReadResponse,
  },
  write: {
    path: '/store.v1.StoreService/Write',
    requestStream: false,
    responseStream: false,
    requestType: store_v1_service_pb.WriteRequest,
    responseType: store_v1_service_pb.WriteResponse,
    requestSerialize: serialize_store_v1_WriteRequest,
    requestDeserialize: deserialize_store_v1_WriteRequest,
    responseSerialize: serialize_store_v1_WriteResponse,
    responseDeserialize: deserialize_store_v1_WriteResponse,
  },
};

exports.StoreServiceClient = grpc.makeGenericClientConstructor(StoreServiceService);
