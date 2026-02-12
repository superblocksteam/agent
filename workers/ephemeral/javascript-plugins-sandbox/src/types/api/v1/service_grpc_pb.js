// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var api_v1_service_pb = require('../../api/v1/service_pb.js');
var api_v1_api_pb = require('../../api/v1/api_pb.js');
var api_v1_event_pb = require('../../api/v1/event_pb.js');
var buf_validate_validate_pb = require('../../buf/validate/validate_pb.js');
var common_v1_common_pb = require('../../common/v1/common_pb.js');
var common_v1_errors_pb = require('../../common/v1/errors_pb.js');
var common_v1_health_pb = require('../../common/v1/health_pb.js');
var google_api_annotations_pb = require('../../google/api/annotations_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var plugins_adls_v1_plugin_pb = require('../../plugins/adls/v1/plugin_pb.js');
var plugins_cosmosdb_v1_plugin_pb = require('../../plugins/cosmosdb/v1/plugin_pb.js');
var plugins_couchbase_v1_plugin_pb = require('../../plugins/couchbase/v1/plugin_pb.js');
var plugins_dynamodb_v1_plugin_pb = require('../../plugins/dynamodb/v1/plugin_pb.js');
var plugins_kafka_v1_plugin_pb = require('../../plugins/kafka/v1/plugin_pb.js');
var plugins_kinesis_v1_plugin_pb = require('../../plugins/kinesis/v1/plugin_pb.js');
var plugins_salesforce_v1_plugin_pb = require('../../plugins/salesforce/v1/plugin_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb.js');
var store_v1_store_pb = require('../../store/v1/store_pb.js');
var validate_validate_pb = require('../../validate/validate_pb.js');

function serialize_api_v1_AsyncResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.AsyncResponse)) {
    throw new Error('Expected argument of type api.v1.AsyncResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_AsyncResponse(buffer_arg) {
  return api_v1_service_pb.AsyncResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_AwaitResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.AwaitResponse)) {
    throw new Error('Expected argument of type api.v1.AwaitResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_AwaitResponse(buffer_arg) {
  return api_v1_service_pb.AwaitResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_CancelRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.CancelRequest)) {
    throw new Error('Expected argument of type api.v1.CancelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_CancelRequest(buffer_arg) {
  return api_v1_service_pb.CancelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_CancelResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.CancelResponse)) {
    throw new Error('Expected argument of type api.v1.CancelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_CancelResponse(buffer_arg) {
  return api_v1_service_pb.CancelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_DeleteRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.DeleteRequest)) {
    throw new Error('Expected argument of type api.v1.DeleteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_DeleteRequest(buffer_arg) {
  return api_v1_service_pb.DeleteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_DeleteResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.DeleteResponse)) {
    throw new Error('Expected argument of type api.v1.DeleteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_DeleteResponse(buffer_arg) {
  return api_v1_service_pb.DeleteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_DownloadRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.DownloadRequest)) {
    throw new Error('Expected argument of type api.v1.DownloadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_DownloadRequest(buffer_arg) {
  return api_v1_service_pb.DownloadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_DownloadResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.DownloadResponse)) {
    throw new Error('Expected argument of type api.v1.DownloadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_DownloadResponse(buffer_arg) {
  return api_v1_service_pb.DownloadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_ExecuteRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.ExecuteRequest)) {
    throw new Error('Expected argument of type api.v1.ExecuteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_ExecuteRequest(buffer_arg) {
  return api_v1_service_pb.ExecuteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_ExecuteV3Request(arg) {
  if (!(arg instanceof api_v1_service_pb.ExecuteV3Request)) {
    throw new Error('Expected argument of type api.v1.ExecuteV3Request');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_ExecuteV3Request(buffer_arg) {
  return api_v1_service_pb.ExecuteV3Request.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_HealthRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.HealthRequest)) {
    throw new Error('Expected argument of type api.v1.HealthRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_HealthRequest(buffer_arg) {
  return api_v1_service_pb.HealthRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_MetadataRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.MetadataRequest)) {
    throw new Error('Expected argument of type api.v1.MetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_MetadataRequest(buffer_arg) {
  return api_v1_service_pb.MetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_MetadataRequestDeprecated(arg) {
  if (!(arg instanceof api_v1_service_pb.MetadataRequestDeprecated)) {
    throw new Error('Expected argument of type api.v1.MetadataRequestDeprecated');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_MetadataRequestDeprecated(buffer_arg) {
  return api_v1_service_pb.MetadataRequestDeprecated.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_MetadataResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.MetadataResponse)) {
    throw new Error('Expected argument of type api.v1.MetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_MetadataResponse(buffer_arg) {
  return api_v1_service_pb.MetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_OutputRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.OutputRequest)) {
    throw new Error('Expected argument of type api.v1.OutputRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_OutputRequest(buffer_arg) {
  return api_v1_service_pb.OutputRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_OutputResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.OutputResponse)) {
    throw new Error('Expected argument of type api.v1.OutputResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_OutputResponse(buffer_arg) {
  return api_v1_service_pb.OutputResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_StatusRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.StatusRequest)) {
    throw new Error('Expected argument of type api.v1.StatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_StatusRequest(buffer_arg) {
  return api_v1_service_pb.StatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_StreamResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.StreamResponse)) {
    throw new Error('Expected argument of type api.v1.StreamResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_StreamResponse(buffer_arg) {
  return api_v1_service_pb.StreamResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_TestRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.TestRequest)) {
    throw new Error('Expected argument of type api.v1.TestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_TestRequest(buffer_arg) {
  return api_v1_service_pb.TestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_TestResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.TestResponse)) {
    throw new Error('Expected argument of type api.v1.TestResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_TestResponse(buffer_arg) {
  return api_v1_service_pb.TestResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_TwoWayRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.TwoWayRequest)) {
    throw new Error('Expected argument of type api.v1.TwoWayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_TwoWayRequest(buffer_arg) {
  return api_v1_service_pb.TwoWayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_TwoWayResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.TwoWayResponse)) {
    throw new Error('Expected argument of type api.v1.TwoWayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_TwoWayResponse(buffer_arg) {
  return api_v1_service_pb.TwoWayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_ValidateRequest(arg) {
  if (!(arg instanceof api_v1_service_pb.ValidateRequest)) {
    throw new Error('Expected argument of type api.v1.ValidateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_ValidateRequest(buffer_arg) {
  return api_v1_service_pb.ValidateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_api_v1_WorkflowResponse(arg) {
  if (!(arg instanceof api_v1_service_pb.WorkflowResponse)) {
    throw new Error('Expected argument of type api.v1.WorkflowResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_api_v1_WorkflowResponse(buffer_arg) {
  return api_v1_service_pb.WorkflowResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
    path: '/api.v1.MetadataService/Health',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.HealthRequest,
    responseType: common_v1_health_pb.HealthResponse,
    requestSerialize: serialize_api_v1_HealthRequest,
    requestDeserialize: deserialize_api_v1_HealthRequest,
    responseSerialize: serialize_common_v1_HealthResponse,
    responseDeserialize: deserialize_common_v1_HealthResponse,
  },
};

exports.MetadataServiceClient = grpc.makeGenericClientConstructor(MetadataServiceService);
var DeprecatedServiceService = exports.DeprecatedServiceService = {
  workflow: {
    path: '/api.v1.DeprecatedService/Workflow',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.ExecuteRequest,
    responseType: api_v1_service_pb.WorkflowResponse,
    requestSerialize: serialize_api_v1_ExecuteRequest,
    requestDeserialize: deserialize_api_v1_ExecuteRequest,
    responseSerialize: serialize_api_v1_WorkflowResponse,
    responseDeserialize: deserialize_api_v1_WorkflowResponse,
  },
};

exports.DeprecatedServiceClient = grpc.makeGenericClientConstructor(DeprecatedServiceService);
var ExecutorServiceService = exports.ExecutorServiceService = {
  await: {
    path: '/api.v1.ExecutorService/Await',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.ExecuteRequest,
    responseType: api_v1_service_pb.AwaitResponse,
    requestSerialize: serialize_api_v1_ExecuteRequest,
    requestDeserialize: deserialize_api_v1_ExecuteRequest,
    responseSerialize: serialize_api_v1_AwaitResponse,
    responseDeserialize: deserialize_api_v1_AwaitResponse,
  },
  executeV3: {
    path: '/api.v1.ExecutorService/ExecuteV3',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.ExecuteV3Request,
    responseType: api_v1_service_pb.AwaitResponse,
    requestSerialize: serialize_api_v1_ExecuteV3Request,
    requestDeserialize: deserialize_api_v1_ExecuteV3Request,
    responseSerialize: serialize_api_v1_AwaitResponse,
    responseDeserialize: deserialize_api_v1_AwaitResponse,
  },
  twoWayStream: {
    path: '/api.v1.ExecutorService/TwoWayStream',
    requestStream: true,
    responseStream: true,
    requestType: api_v1_service_pb.TwoWayRequest,
    responseType: api_v1_service_pb.TwoWayResponse,
    requestSerialize: serialize_api_v1_TwoWayRequest,
    requestDeserialize: deserialize_api_v1_TwoWayRequest,
    responseSerialize: serialize_api_v1_TwoWayResponse,
    responseDeserialize: deserialize_api_v1_TwoWayResponse,
  },
  metadataDeprecated: {
    path: '/api.v1.ExecutorService/MetadataDeprecated',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.MetadataRequestDeprecated,
    responseType: api_v1_service_pb.MetadataResponse,
    requestSerialize: serialize_api_v1_MetadataRequestDeprecated,
    requestDeserialize: deserialize_api_v1_MetadataRequestDeprecated,
    responseSerialize: serialize_api_v1_MetadataResponse,
    responseDeserialize: deserialize_api_v1_MetadataResponse,
  },
  metadata: {
    path: '/api.v1.ExecutorService/Metadata',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.MetadataRequest,
    responseType: api_v1_service_pb.MetadataResponse,
    requestSerialize: serialize_api_v1_MetadataRequest,
    requestDeserialize: deserialize_api_v1_MetadataRequest,
    responseSerialize: serialize_api_v1_MetadataResponse,
    responseDeserialize: deserialize_api_v1_MetadataResponse,
  },
  test: {
    path: '/api.v1.ExecutorService/Test',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.TestRequest,
    responseType: api_v1_service_pb.TestResponse,
    requestSerialize: serialize_api_v1_TestRequest,
    requestDeserialize: deserialize_api_v1_TestRequest,
    responseSerialize: serialize_api_v1_TestResponse,
    responseDeserialize: deserialize_api_v1_TestResponse,
  },
  delete: {
    path: '/api.v1.ExecutorService/Delete',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.DeleteRequest,
    responseType: api_v1_service_pb.DeleteResponse,
    requestSerialize: serialize_api_v1_DeleteRequest,
    requestDeserialize: deserialize_api_v1_DeleteRequest,
    responseSerialize: serialize_api_v1_DeleteResponse,
    responseDeserialize: deserialize_api_v1_DeleteResponse,
  },
  async: {
    path: '/api.v1.ExecutorService/Async',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.ExecuteRequest,
    responseType: api_v1_service_pb.AsyncResponse,
    requestSerialize: serialize_api_v1_ExecuteRequest,
    requestDeserialize: deserialize_api_v1_ExecuteRequest,
    responseSerialize: serialize_api_v1_AsyncResponse,
    responseDeserialize: deserialize_api_v1_AsyncResponse,
  },
  stream: {
    path: '/api.v1.ExecutorService/Stream',
    requestStream: false,
    responseStream: true,
    requestType: api_v1_service_pb.ExecuteRequest,
    responseType: api_v1_service_pb.StreamResponse,
    requestSerialize: serialize_api_v1_ExecuteRequest,
    requestDeserialize: deserialize_api_v1_ExecuteRequest,
    responseSerialize: serialize_api_v1_StreamResponse,
    responseDeserialize: deserialize_api_v1_StreamResponse,
  },
  status: {
    path: '/api.v1.ExecutorService/Status',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.StatusRequest,
    responseType: api_v1_service_pb.AwaitResponse,
    requestSerialize: serialize_api_v1_StatusRequest,
    requestDeserialize: deserialize_api_v1_StatusRequest,
    responseSerialize: serialize_api_v1_AwaitResponse,
    responseDeserialize: deserialize_api_v1_AwaitResponse,
  },
  output: {
    path: '/api.v1.ExecutorService/Output',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.OutputRequest,
    responseType: api_v1_service_pb.OutputResponse,
    requestSerialize: serialize_api_v1_OutputRequest,
    requestDeserialize: deserialize_api_v1_OutputRequest,
    responseSerialize: serialize_api_v1_OutputResponse,
    responseDeserialize: deserialize_api_v1_OutputResponse,
  },
  download: {
    path: '/api.v1.ExecutorService/Download',
    requestStream: false,
    responseStream: true,
    requestType: api_v1_service_pb.DownloadRequest,
    responseType: api_v1_service_pb.DownloadResponse,
    requestSerialize: serialize_api_v1_DownloadRequest,
    requestDeserialize: deserialize_api_v1_DownloadRequest,
    responseSerialize: serialize_api_v1_DownloadResponse,
    responseDeserialize: deserialize_api_v1_DownloadResponse,
  },
  cancel: {
    path: '/api.v1.ExecutorService/Cancel',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.CancelRequest,
    responseType: api_v1_service_pb.CancelResponse,
    requestSerialize: serialize_api_v1_CancelRequest,
    requestDeserialize: deserialize_api_v1_CancelRequest,
    responseSerialize: serialize_api_v1_CancelResponse,
    responseDeserialize: deserialize_api_v1_CancelResponse,
  },
  validate: {
    path: '/api.v1.ExecutorService/Validate',
    requestStream: false,
    responseStream: false,
    requestType: api_v1_service_pb.ValidateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_api_v1_ValidateRequest,
    requestDeserialize: deserialize_api_v1_ValidateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.ExecutorServiceClient = grpc.makeGenericClientConstructor(ExecutorServiceService);
