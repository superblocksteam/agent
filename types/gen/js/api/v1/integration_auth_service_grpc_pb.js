// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var api_v1_integration_auth_service_pb = require('../../api/v1/integration_auth_service_pb');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
var common_v1_common_pb = require('../../common/v1/common_pb');
var google_api_annotations_pb = require('../../google/api/annotations_pb');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var plugins_common_v1_auth_pb = require('../../plugins/common/v1/auth_pb');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb');
var validate_validate_pb = require('../../validate/validate_pb');

function serialize_api_v1_CheckAuthRequest(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.CheckAuthRequest)) {
    throw new Error('Expected argument of type api.v1.CheckAuthRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_CheckAuthRequest(buffer_arg) {
  return api_v1_integration_auth_service_pb.CheckAuthRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_CheckAuthResponse(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.CheckAuthResponse)) {
    throw new Error('Expected argument of type api.v1.CheckAuthResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_CheckAuthResponse(buffer_arg) {
  return api_v1_integration_auth_service_pb.CheckAuthResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_ExchangeOauthCodeForTokenRequest(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest)) {
    throw new Error('Expected argument of type api.v1.ExchangeOauthCodeForTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_ExchangeOauthCodeForTokenRequest(buffer_arg) {
  return api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_LoginRequest(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.LoginRequest)) {
    throw new Error('Expected argument of type api.v1.LoginRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_LoginRequest(buffer_arg) {
  return api_v1_integration_auth_service_pb.LoginRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_LoginResponse(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.LoginResponse)) {
    throw new Error('Expected argument of type api.v1.LoginResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_LoginResponse(buffer_arg) {
  return api_v1_integration_auth_service_pb.LoginResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_RequestOauthPasswordTokenRequest(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest)) {
    throw new Error('Expected argument of type api.v1.RequestOauthPasswordTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_RequestOauthPasswordTokenRequest(buffer_arg) {
  return api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_RequestOauthPasswordTokenResponse(arg) {
  if (!(arg instanceof api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse)) {
    throw new Error('Expected argument of type api.v1.RequestOauthPasswordTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_RequestOauthPasswordTokenResponse(buffer_arg) {
  return api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
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


var IntegrationAuthServiceService = exports.IntegrationAuthServiceService = {
  checkAuth: {
    path: '/api.v1.IntegrationAuthService/CheckAuth',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_integration_auth_service_pb.CheckAuthRequest,
    responseType: api_v1_integration_auth_service_pb.CheckAuthResponse,
    requestSerialize: serialize_api_v1_CheckAuthRequest,
    requestDeserialize: deserialize_api_v1_CheckAuthRequest,
    responseSerialize: serialize_api_v1_CheckAuthResponse,
    responseDeserialize: deserialize_api_v1_CheckAuthResponse,
  },
  login: {
    path: '/api.v1.IntegrationAuthService/Login',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_integration_auth_service_pb.LoginRequest,
    responseType: api_v1_integration_auth_service_pb.LoginResponse,
    requestSerialize: serialize_api_v1_LoginRequest,
    requestDeserialize: deserialize_api_v1_LoginRequest,
    responseSerialize: serialize_api_v1_LoginResponse,
    responseDeserialize: deserialize_api_v1_LoginResponse,
  },
  logout: {
    path: '/api.v1.IntegrationAuthService/Logout',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  exchangeOauthCodeForToken: {
    path: '/api.v1.IntegrationAuthService/ExchangeOauthCodeForToken',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_integration_auth_service_pb.ExchangeOauthCodeForTokenRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_api_v1_ExchangeOauthCodeForTokenRequest,
    requestDeserialize: deserialize_api_v1_ExchangeOauthCodeForTokenRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  requestOauthPasswordToken: {
    path: '/api.v1.IntegrationAuthService/RequestOauthPasswordToken',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenRequest,
    responseType: api_v1_integration_auth_service_pb.RequestOauthPasswordTokenResponse,
    requestSerialize: serialize_api_v1_RequestOauthPasswordTokenRequest,
    requestDeserialize: deserialize_api_v1_RequestOauthPasswordTokenRequest,
    responseSerialize: serialize_api_v1_RequestOauthPasswordTokenResponse,
    responseDeserialize: deserialize_api_v1_RequestOauthPasswordTokenResponse,
  },
};

exports.IntegrationAuthServiceClient = grpc.makeGenericClientConstructor(IntegrationAuthServiceService);
