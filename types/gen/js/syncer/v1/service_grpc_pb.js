// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var syncer_v1_service_pb = require('../../syncer/v1/service_pb');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
var common_v1_errors_pb = require('../../common/v1/errors_pb');
var event_v1_service_pb = require('../../event/v1/service_pb');
var google_api_annotations_pb = require('../../google/api/annotations_pb');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb');
var syncer_v1_syncer_pb = require('../../syncer/v1/syncer_pb');
var validate_validate_pb = require('../../validate/validate_pb');

function serialize_event_v1_IngestEventRequest(arg) {
  if (!(arg instanceof event_v1_service_pb.IngestEventRequest)) {
    throw new Error('Expected argument of type event.v1.IngestEventRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_event_v1_IngestEventRequest(buffer_arg) {
  return event_v1_service_pb.IngestEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_event_v1_IngestEventResponse(arg) {
  if (!(arg instanceof event_v1_service_pb.IngestEventResponse)) {
    throw new Error('Expected argument of type event.v1.IngestEventResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_event_v1_IngestEventResponse(buffer_arg) {
  return event_v1_service_pb.IngestEventResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_DeleteMetadataRequest(arg) {
  if (!(arg instanceof syncer_v1_service_pb.DeleteMetadataRequest)) {
    throw new Error('Expected argument of type syncer.v1.DeleteMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_DeleteMetadataRequest(buffer_arg) {
  return syncer_v1_service_pb.DeleteMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_DeleteMetadataResponse(arg) {
  if (!(arg instanceof syncer_v1_service_pb.DeleteMetadataResponse)) {
    throw new Error('Expected argument of type syncer.v1.DeleteMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_DeleteMetadataResponse(buffer_arg) {
  return syncer_v1_service_pb.DeleteMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_GetConfigurationMetadataRequest(arg) {
  if (!(arg instanceof syncer_v1_service_pb.GetConfigurationMetadataRequest)) {
    throw new Error('Expected argument of type syncer.v1.GetConfigurationMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_GetConfigurationMetadataRequest(buffer_arg) {
  return syncer_v1_service_pb.GetConfigurationMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_GetConfigurationMetadataResponse(arg) {
  if (!(arg instanceof syncer_v1_service_pb.GetConfigurationMetadataResponse)) {
    throw new Error('Expected argument of type syncer.v1.GetConfigurationMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_GetConfigurationMetadataResponse(buffer_arg) {
  return syncer_v1_service_pb.GetConfigurationMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_SyncRequest(arg) {
  if (!(arg instanceof syncer_v1_service_pb.SyncRequest)) {
    throw new Error('Expected argument of type syncer.v1.SyncRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_SyncRequest(buffer_arg) {
  return syncer_v1_service_pb.SyncRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_SyncResponse(arg) {
  if (!(arg instanceof syncer_v1_service_pb.SyncResponse)) {
    throw new Error('Expected argument of type syncer.v1.SyncResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_SyncResponse(buffer_arg) {
  return syncer_v1_service_pb.SyncResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_UpsertMetadataRequest(arg) {
  if (!(arg instanceof syncer_v1_service_pb.UpsertMetadataRequest)) {
    throw new Error('Expected argument of type syncer.v1.UpsertMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_UpsertMetadataRequest(buffer_arg) {
  return syncer_v1_service_pb.UpsertMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_syncer_v1_UpsertMetadataResponse(arg) {
  if (!(arg instanceof syncer_v1_service_pb.UpsertMetadataResponse)) {
    throw new Error('Expected argument of type syncer.v1.UpsertMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_syncer_v1_UpsertMetadataResponse(buffer_arg) {
  return syncer_v1_service_pb.UpsertMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var IntakeServiceService = exports.IntakeServiceService = {
  upsertMetadata: {
    path: '/syncer.v1.IntakeService/UpsertMetadata',
    requestStream: false,
    responseStream: false,
    requestType: syncer_v1_service_pb.UpsertMetadataRequest,
    responseType: syncer_v1_service_pb.UpsertMetadataResponse,
    requestSerialize: serialize_syncer_v1_UpsertMetadataRequest,
    requestDeserialize: deserialize_syncer_v1_UpsertMetadataRequest,
    responseSerialize: serialize_syncer_v1_UpsertMetadataResponse,
    responseDeserialize: deserialize_syncer_v1_UpsertMetadataResponse,
  },
  deleteMetadata: {
    path: '/syncer.v1.IntakeService/DeleteMetadata',
    requestStream: false,
    responseStream: false,
    requestType: syncer_v1_service_pb.DeleteMetadataRequest,
    responseType: syncer_v1_service_pb.DeleteMetadataResponse,
    requestSerialize: serialize_syncer_v1_DeleteMetadataRequest,
    requestDeserialize: deserialize_syncer_v1_DeleteMetadataRequest,
    responseSerialize: serialize_syncer_v1_DeleteMetadataResponse,
    responseDeserialize: deserialize_syncer_v1_DeleteMetadataResponse,
  },
  ingestEvent: {
    path: '/syncer.v1.IntakeService/IngestEvent',
    requestStream: false,
    responseStream: false,
    requestType: event_v1_service_pb.IngestEventRequest,
    responseType: event_v1_service_pb.IngestEventResponse,
    requestSerialize: serialize_event_v1_IngestEventRequest,
    requestDeserialize: deserialize_event_v1_IngestEventRequest,
    responseSerialize: serialize_event_v1_IngestEventResponse,
    responseDeserialize: deserialize_event_v1_IngestEventResponse,
  },
};

exports.IntakeServiceClient = grpc.makeGenericClientConstructor(IntakeServiceService);
var SyncerServiceService = exports.SyncerServiceService = {
  sync: {
    path: '/syncer.v1.SyncerService/Sync',
    requestStream: false,
    responseStream: false,
    requestType: syncer_v1_service_pb.SyncRequest,
    responseType: syncer_v1_service_pb.SyncResponse,
    requestSerialize: serialize_syncer_v1_SyncRequest,
    requestDeserialize: deserialize_syncer_v1_SyncRequest,
    responseSerialize: serialize_syncer_v1_SyncResponse,
    responseDeserialize: deserialize_syncer_v1_SyncResponse,
  },
};

exports.SyncerServiceClient = grpc.makeGenericClientConstructor(SyncerServiceService);
var IntegrationServiceService = exports.IntegrationServiceService = {
  getConfigurationMetadata: {
    path: '/syncer.v1.IntegrationService/GetConfigurationMetadata',
    requestStream: false,
    responseStream: false,
    requestType: syncer_v1_service_pb.GetConfigurationMetadataRequest,
    responseType: syncer_v1_service_pb.GetConfigurationMetadataResponse,
    requestSerialize: serialize_syncer_v1_GetConfigurationMetadataRequest,
    requestDeserialize: deserialize_syncer_v1_GetConfigurationMetadataRequest,
    responseSerialize: serialize_syncer_v1_GetConfigurationMetadataResponse,
    responseDeserialize: deserialize_syncer_v1_GetConfigurationMetadataResponse,
  },
};

exports.IntegrationServiceClient = grpc.makeGenericClientConstructor(IntegrationServiceService);
