// source: api/v1/service.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = globalThis;

var api_v1_api_pb = require('../../api/v1/api_pb');
goog.object.extend(proto, api_v1_api_pb);
var api_v1_event_pb = require('../../api/v1/event_pb');
goog.object.extend(proto, api_v1_event_pb);
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
goog.object.extend(proto, buf_validate_validate_pb);
var common_v1_common_pb = require('../../common/v1/common_pb');
goog.object.extend(proto, common_v1_common_pb);
var common_v1_errors_pb = require('../../common/v1/errors_pb');
goog.object.extend(proto, common_v1_errors_pb);
var common_v1_health_pb = require('../../common/v1/health_pb');
goog.object.extend(proto, common_v1_health_pb);
var google_api_annotations_pb = require('../../google/api/annotations_pb');
goog.object.extend(proto, google_api_annotations_pb);
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb');
goog.object.extend(proto, google_protobuf_empty_pb);
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb');
goog.object.extend(proto, google_protobuf_struct_pb);
var plugins_adls_v1_plugin_pb = require('../../plugins/adls/v1/plugin_pb');
goog.object.extend(proto, plugins_adls_v1_plugin_pb);
var plugins_cosmosdb_v1_plugin_pb = require('../../plugins/cosmosdb/v1/plugin_pb');
goog.object.extend(proto, plugins_cosmosdb_v1_plugin_pb);
var plugins_couchbase_v1_plugin_pb = require('../../plugins/couchbase/v1/plugin_pb');
goog.object.extend(proto, plugins_couchbase_v1_plugin_pb);
var plugins_kafka_v1_plugin_pb = require('../../plugins/kafka/v1/plugin_pb');
goog.object.extend(proto, plugins_kafka_v1_plugin_pb);
var plugins_kinesis_v1_plugin_pb = require('../../plugins/kinesis/v1/plugin_pb');
goog.object.extend(proto, plugins_kinesis_v1_plugin_pb);
var protoc$gen$openapiv2_options_annotations_pb = require('../../protoc-gen-openapiv2/options/annotations_pb');
goog.object.extend(proto, protoc$gen$openapiv2_options_annotations_pb);
var store_v1_store_pb = require('../../store/v1/store_pb');
goog.object.extend(proto, store_v1_store_pb);
var validate_validate_pb = require('../../validate/validate_pb');
goog.object.extend(proto, validate_validate_pb);
goog.exportSymbol('proto.api.v1.AsyncResponse', null, global);
goog.exportSymbol('proto.api.v1.AwaitResponse', null, global);
goog.exportSymbol('proto.api.v1.AwaitResponse.Status', null, global);
goog.exportSymbol('proto.api.v1.CancelRequest', null, global);
goog.exportSymbol('proto.api.v1.CancelResponse', null, global);
goog.exportSymbol('proto.api.v1.Definition', null, global);
goog.exportSymbol('proto.api.v1.Definition.Metadata', null, global);
goog.exportSymbol('proto.api.v1.DeleteRequest', null, global);
goog.exportSymbol('proto.api.v1.DeleteResponse', null, global);
goog.exportSymbol('proto.api.v1.DownloadRequest', null, global);
goog.exportSymbol('proto.api.v1.DownloadResponse', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest.Fetch', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest.FetchByPath', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest.File', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest.Options', null, global);
goog.exportSymbol('proto.api.v1.ExecuteRequest.RequestCase', null, global);
goog.exportSymbol('proto.api.v1.Function', null, global);
goog.exportSymbol('proto.api.v1.Function.Request', null, global);
goog.exportSymbol('proto.api.v1.Function.Response', null, global);
goog.exportSymbol('proto.api.v1.HealthRequest', null, global);
goog.exportSymbol('proto.api.v1.MetadataRequest', null, global);
goog.exportSymbol('proto.api.v1.MetadataRequestDeprecated', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.BucketMetadata', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.BucketsMetadata', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template', null, global);
goog.exportSymbol('proto.api.v1.MetadataResponse.MetadataCase', null, global);
goog.exportSymbol('proto.api.v1.Mock', null, global);
goog.exportSymbol('proto.api.v1.Mock.On', null, global);
goog.exportSymbol('proto.api.v1.Mock.Params', null, global);
goog.exportSymbol('proto.api.v1.Mock.Return', null, global);
goog.exportSymbol('proto.api.v1.Mock.Return.TypeCase', null, global);
goog.exportSymbol('proto.api.v1.OutputRequest', null, global);
goog.exportSymbol('proto.api.v1.OutputResponse', null, global);
goog.exportSymbol('proto.api.v1.StatusRequest', null, global);
goog.exportSymbol('proto.api.v1.StreamResponse', null, global);
goog.exportSymbol('proto.api.v1.TestRequest', null, global);
goog.exportSymbol('proto.api.v1.TestResponse', null, global);
goog.exportSymbol('proto.api.v1.TwoWayRequest', null, global);
goog.exportSymbol('proto.api.v1.TwoWayRequest.TypeCase', null, global);
goog.exportSymbol('proto.api.v1.TwoWayResponse', null, global);
goog.exportSymbol('proto.api.v1.TwoWayResponse.TypeCase', null, global);
goog.exportSymbol('proto.api.v1.ValidateRequest', null, global);
goog.exportSymbol('proto.api.v1.ViewMode', null, global);
goog.exportSymbol('proto.api.v1.WorkflowResponse', null, global);
goog.exportSymbol('proto.api.v1.WorkflowResponse.ResponseMeta', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.HealthRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.HealthRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.HealthRequest.displayName = 'proto.api.v1.HealthRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ValidateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.ValidateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ValidateRequest.displayName = 'proto.api.v1.ValidateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ExecuteRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.ExecuteRequest.repeatedFields_, proto.api.v1.ExecuteRequest.oneofGroups_);
};
goog.inherits(proto.api.v1.ExecuteRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ExecuteRequest.displayName = 'proto.api.v1.ExecuteRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ExecuteRequest.Options = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.ExecuteRequest.Options, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ExecuteRequest.Options.displayName = 'proto.api.v1.ExecuteRequest.Options';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ExecuteRequest.Fetch = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.ExecuteRequest.Fetch, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ExecuteRequest.Fetch.displayName = 'proto.api.v1.ExecuteRequest.Fetch';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ExecuteRequest.FetchByPath = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.ExecuteRequest.FetchByPath, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ExecuteRequest.FetchByPath.displayName = 'proto.api.v1.ExecuteRequest.FetchByPath';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.ExecuteRequest.File = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.ExecuteRequest.File, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.ExecuteRequest.File.displayName = 'proto.api.v1.ExecuteRequest.File';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Definition = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Definition, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Definition.displayName = 'proto.api.v1.Definition';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Definition.Metadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Definition.Metadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Definition.Metadata.displayName = 'proto.api.v1.Definition.Metadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.StatusRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.StatusRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.StatusRequest.displayName = 'proto.api.v1.StatusRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.AwaitResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.AwaitResponse.repeatedFields_, null);
};
goog.inherits(proto.api.v1.AwaitResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.AwaitResponse.displayName = 'proto.api.v1.AwaitResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.AsyncResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.AsyncResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.AsyncResponse.displayName = 'proto.api.v1.AsyncResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.StreamResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.StreamResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.StreamResponse.displayName = 'proto.api.v1.StreamResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.OutputRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.OutputRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.OutputRequest.displayName = 'proto.api.v1.OutputRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.OutputResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.OutputResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.OutputResponse.displayName = 'proto.api.v1.OutputResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.CancelRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.CancelRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.CancelRequest.displayName = 'proto.api.v1.CancelRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.CancelResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.CancelResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.CancelResponse.displayName = 'proto.api.v1.CancelResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.TestRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.TestRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.TestRequest.displayName = 'proto.api.v1.TestRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.TestResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.TestResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.TestResponse.displayName = 'proto.api.v1.TestResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.DeleteRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.DeleteRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.DeleteRequest.displayName = 'proto.api.v1.DeleteRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.DeleteResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.DeleteResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.DeleteResponse.displayName = 'proto.api.v1.DeleteResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Function = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Function, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Function.displayName = 'proto.api.v1.Function';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Function.Request = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Function.Request.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Function.Request, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Function.Request.displayName = 'proto.api.v1.Function.Request';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Function.Response = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Function.Response, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Function.Response.displayName = 'proto.api.v1.Function.Response';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.TwoWayRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.TwoWayRequest.oneofGroups_);
};
goog.inherits(proto.api.v1.TwoWayRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.TwoWayRequest.displayName = 'proto.api.v1.TwoWayRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.TwoWayResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.TwoWayResponse.oneofGroups_);
};
goog.inherits(proto.api.v1.TwoWayResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.TwoWayResponse.displayName = 'proto.api.v1.TwoWayResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Mock = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Mock, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Mock.displayName = 'proto.api.v1.Mock';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Mock.Params = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Mock.Params, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Mock.Params.displayName = 'proto.api.v1.Mock.Params';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Mock.On = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Mock.On, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Mock.On.displayName = 'proto.api.v1.Mock.On';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.Mock.Return = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.Mock.Return.oneofGroups_);
};
goog.inherits(proto.api.v1.Mock.Return, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Mock.Return.displayName = 'proto.api.v1.Mock.Return';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataRequestDeprecated = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataRequestDeprecated, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataRequestDeprecated.displayName = 'proto.api.v1.MetadataRequestDeprecated';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataRequest.displayName = 'proto.api.v1.MetadataRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.MetadataResponse.oneofGroups_);
};
goog.inherits(proto.api.v1.MetadataResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.displayName = 'proto.api.v1.MetadataResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.repeatedFields_, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.repeatedFields_, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.repeatedFields_, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.displayName = 'proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.BucketMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.MetadataResponse.BucketMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.BucketMetadata.displayName = 'proto.api.v1.MetadataResponse.BucketMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.MetadataResponse.BucketsMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.MetadataResponse.BucketsMetadata.repeatedFields_, null);
};
goog.inherits(proto.api.v1.MetadataResponse.BucketsMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.MetadataResponse.BucketsMetadata.displayName = 'proto.api.v1.MetadataResponse.BucketsMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.DownloadRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.DownloadRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.DownloadRequest.displayName = 'proto.api.v1.DownloadRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.DownloadResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.DownloadResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.DownloadResponse.displayName = 'proto.api.v1.DownloadResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.WorkflowResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.WorkflowResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.WorkflowResponse.displayName = 'proto.api.v1.WorkflowResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.api.v1.WorkflowResponse.ResponseMeta = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.WorkflowResponse.ResponseMeta, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.WorkflowResponse.ResponseMeta.displayName = 'proto.api.v1.WorkflowResponse.ResponseMeta';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.HealthRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.HealthRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.HealthRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.HealthRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
detailed: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.HealthRequest}
 */
proto.api.v1.HealthRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.HealthRequest;
  return proto.api.v1.HealthRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.HealthRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.HealthRequest}
 */
proto.api.v1.HealthRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setDetailed(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.HealthRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.HealthRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.HealthRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.HealthRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDetailed();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool detailed = 1;
 * @return {boolean}
 */
proto.api.v1.HealthRequest.prototype.getDetailed = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.HealthRequest} returns this
 */
proto.api.v1.HealthRequest.prototype.setDetailed = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ValidateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ValidateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ValidateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ValidateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
api: (f = msg.getApi()) && api_v1_api_pb.Api.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ValidateRequest}
 */
proto.api.v1.ValidateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ValidateRequest;
  return proto.api.v1.ValidateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ValidateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ValidateRequest}
 */
proto.api.v1.ValidateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_v1_api_pb.Api;
      reader.readMessage(value,api_v1_api_pb.Api.deserializeBinaryFromReader);
      msg.setApi(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ValidateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ValidateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ValidateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ValidateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApi();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_v1_api_pb.Api.serializeBinaryToWriter
    );
  }
};


/**
 * optional Api api = 1;
 * @return {?proto.api.v1.Api}
 */
proto.api.v1.ValidateRequest.prototype.getApi = function() {
  return /** @type{?proto.api.v1.Api} */ (
    jspb.Message.getWrapperField(this, api_v1_api_pb.Api, 1));
};


/**
 * @param {?proto.api.v1.Api|undefined} value
 * @return {!proto.api.v1.ValidateRequest} returns this
*/
proto.api.v1.ValidateRequest.prototype.setApi = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ValidateRequest} returns this
 */
proto.api.v1.ValidateRequest.prototype.clearApi = function() {
  return this.setApi(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ValidateRequest.prototype.hasApi = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.ExecuteRequest.repeatedFields_ = [5,7];

/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.ExecuteRequest.oneofGroups_ = [[3,4,8]];

/**
 * @enum {number}
 */
proto.api.v1.ExecuteRequest.RequestCase = {
  REQUEST_NOT_SET: 0,
  DEFINITION: 3,
  FETCH: 4,
  FETCH_BY_PATH: 8
};

/**
 * @return {proto.api.v1.ExecuteRequest.RequestCase}
 */
proto.api.v1.ExecuteRequest.prototype.getRequestCase = function() {
  return /** @type {proto.api.v1.ExecuteRequest.RequestCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.ExecuteRequest.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ExecuteRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ExecuteRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ExecuteRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
options: (f = msg.getOptions()) && proto.api.v1.ExecuteRequest.Options.toObject(includeInstance, f),
inputsMap: (f = msg.getInputsMap()) ? f.toObject(includeInstance, proto.google.protobuf.Value.toObject) : [],
definition: (f = msg.getDefinition()) && proto.api.v1.Definition.toObject(includeInstance, f),
fetch: (f = msg.getFetch()) && proto.api.v1.ExecuteRequest.Fetch.toObject(includeInstance, f),
fetchByPath: (f = msg.getFetchByPath()) && proto.api.v1.ExecuteRequest.FetchByPath.toObject(includeInstance, f),
filesList: jspb.Message.toObjectList(msg.getFilesList(),
    proto.api.v1.ExecuteRequest.File.toObject, includeInstance),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
mocksList: jspb.Message.toObjectList(msg.getMocksList(),
    proto.api.v1.Mock.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ExecuteRequest}
 */
proto.api.v1.ExecuteRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ExecuteRequest;
  return proto.api.v1.ExecuteRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ExecuteRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ExecuteRequest}
 */
proto.api.v1.ExecuteRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.ExecuteRequest.Options;
      reader.readMessage(value,proto.api.v1.ExecuteRequest.Options.deserializeBinaryFromReader);
      msg.setOptions(value);
      break;
    case 2:
      var value = msg.getInputsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readStringRequireUtf8, jspb.BinaryReader.prototype.readMessage, proto.google.protobuf.Value.deserializeBinaryFromReader, "", new proto.google.protobuf.Value());
         });
      break;
    case 3:
      var value = new proto.api.v1.Definition;
      reader.readMessage(value,proto.api.v1.Definition.deserializeBinaryFromReader);
      msg.setDefinition(value);
      break;
    case 4:
      var value = new proto.api.v1.ExecuteRequest.Fetch;
      reader.readMessage(value,proto.api.v1.ExecuteRequest.Fetch.deserializeBinaryFromReader);
      msg.setFetch(value);
      break;
    case 8:
      var value = new proto.api.v1.ExecuteRequest.FetchByPath;
      reader.readMessage(value,proto.api.v1.ExecuteRequest.FetchByPath.deserializeBinaryFromReader);
      msg.setFetchByPath(value);
      break;
    case 5:
      var value = new proto.api.v1.ExecuteRequest.File;
      reader.readMessage(value,proto.api.v1.ExecuteRequest.File.deserializeBinaryFromReader);
      msg.addFiles(value);
      break;
    case 6:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 7:
      var value = new proto.api.v1.Mock;
      reader.readMessage(value,proto.api.v1.Mock.deserializeBinaryFromReader);
      msg.addMocks(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ExecuteRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ExecuteRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.ExecuteRequest.Options.serializeBinaryToWriter
    );
  }
  f = message.getInputsMap(true);
  if (f && f.getLength() > 0) {
jspb.internal.public_for_gencode.serializeMapToBinary(
    message.getInputsMap(true),
    2,
    writer,
    jspb.BinaryWriter.prototype.writeString,
    jspb.BinaryWriter.prototype.writeMessage,
    proto.google.protobuf.Value.serializeBinaryToWriter);
  }
  f = message.getDefinition();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Definition.serializeBinaryToWriter
    );
  }
  f = message.getFetch();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.api.v1.ExecuteRequest.Fetch.serializeBinaryToWriter
    );
  }
  f = message.getFetchByPath();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.api.v1.ExecuteRequest.FetchByPath.serializeBinaryToWriter
    );
  }
  f = message.getFilesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.api.v1.ExecuteRequest.File.serializeBinaryToWriter
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = message.getMocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.api.v1.Mock.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ExecuteRequest.Options.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ExecuteRequest.Options.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ExecuteRequest.Options} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.Options.toObject = function(includeInstance, msg) {
  var f, obj = {
excludeOutput: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
includeEventOutputs: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
includeEvents: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
start: jspb.Message.getFieldWithDefault(msg, 4, ""),
stop: jspb.Message.getFieldWithDefault(msg, 5, ""),
includeResolved: jspb.Message.getBooleanFieldWithDefault(msg, 6, false),
async: jspb.Message.getBooleanFieldWithDefault(msg, 7, false),
includeApiEvents: jspb.Message.getBooleanFieldWithDefault(msg, 8, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ExecuteRequest.Options}
 */
proto.api.v1.ExecuteRequest.Options.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ExecuteRequest.Options;
  return proto.api.v1.ExecuteRequest.Options.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ExecuteRequest.Options} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ExecuteRequest.Options}
 */
proto.api.v1.ExecuteRequest.Options.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setExcludeOutput(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeEventOutputs(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeEvents(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setStart(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setStop(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeResolved(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setAsync(value);
      break;
    case 8:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeApiEvents(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.Options.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ExecuteRequest.Options.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ExecuteRequest.Options} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.Options.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExcludeOutput();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getIncludeEventOutputs();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getIncludeEvents();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getStart();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getStop();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getIncludeResolved();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
  f = message.getAsync();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getIncludeApiEvents();
  if (f) {
    writer.writeBool(
      8,
      f
    );
  }
};


/**
 * optional bool exclude_output = 1;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getExcludeOutput = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setExcludeOutput = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool include_event_outputs = 2;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getIncludeEventOutputs = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setIncludeEventOutputs = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional bool include_events = 3;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getIncludeEvents = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setIncludeEvents = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional string start = 4;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getStart = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setStart = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string stop = 5;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getStop = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setStop = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional bool include_resolved = 6;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getIncludeResolved = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 6, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setIncludeResolved = function(value) {
  return jspb.Message.setProto3BooleanField(this, 6, value);
};


/**
 * optional bool async = 7;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getAsync = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 7, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setAsync = function(value) {
  return jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional bool include_api_events = 8;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Options.prototype.getIncludeApiEvents = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 8, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Options} returns this
 */
proto.api.v1.ExecuteRequest.Options.prototype.setIncludeApiEvents = function(value) {
  return jspb.Message.setProto3BooleanField(this, 8, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ExecuteRequest.Fetch.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ExecuteRequest.Fetch} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.Fetch.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
test: (f = jspb.Message.getBooleanField(msg, 3)) == null ? undefined : f,
token: (f = jspb.Message.getField(msg, 4)) == null ? undefined : f,
viewMode: jspb.Message.getFieldWithDefault(msg, 5, 0),
commitId: (f = jspb.Message.getField(msg, 6)) == null ? undefined : f,
branchName: (f = jspb.Message.getField(msg, 7)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ExecuteRequest.Fetch}
 */
proto.api.v1.ExecuteRequest.Fetch.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ExecuteRequest.Fetch;
  return proto.api.v1.ExecuteRequest.Fetch.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ExecuteRequest.Fetch} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ExecuteRequest.Fetch}
 */
proto.api.v1.ExecuteRequest.Fetch.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setId(value);
      break;
    case 2:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setTest(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setToken(value);
      break;
    case 5:
      var value = /** @type {!proto.api.v1.ViewMode} */ (reader.readEnum());
      msg.setViewMode(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setCommitId(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setBranchName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ExecuteRequest.Fetch.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ExecuteRequest.Fetch} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.Fetch.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeBool(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getViewMode();
  if (f !== 0.0) {
    writer.writeEnum(
      5,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeString(
      6,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional common.v1.Profile profile = 2;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 2));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
*/
proto.api.v1.ExecuteRequest.Fetch.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bool test = 3;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getTest = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setTest = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.clearTest = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.hasTest = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional string token = 4;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setToken = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.clearToken = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.hasToken = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional ViewMode view_mode = 5;
 * @return {!proto.api.v1.ViewMode}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getViewMode = function() {
  return /** @type {!proto.api.v1.ViewMode} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {!proto.api.v1.ViewMode} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setViewMode = function(value) {
  return jspb.Message.setProto3EnumField(this, 5, value);
};


/**
 * optional string commit_id = 6;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getCommitId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setCommitId = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.clearCommitId = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.hasCommitId = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional string branch_name = 7;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.getBranchName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.setBranchName = function(value) {
  return jspb.Message.setField(this, 7, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.Fetch} returns this
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.clearBranchName = function() {
  return jspb.Message.setField(this, 7, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.Fetch.prototype.hasBranchName = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ExecuteRequest.FetchByPath.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ExecuteRequest.FetchByPath} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.FetchByPath.toObject = function(includeInstance, msg) {
  var f, obj = {
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
test: (f = jspb.Message.getBooleanField(msg, 2)) == null ? undefined : f,
viewMode: jspb.Message.getFieldWithDefault(msg, 3, 0),
path: jspb.Message.getFieldWithDefault(msg, 4, ""),
applicationId: (f = jspb.Message.getField(msg, 5)) == null ? undefined : f,
commitId: (f = jspb.Message.getField(msg, 6)) == null ? undefined : f,
branchName: (f = jspb.Message.getField(msg, 7)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath}
 */
proto.api.v1.ExecuteRequest.FetchByPath.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ExecuteRequest.FetchByPath;
  return proto.api.v1.ExecuteRequest.FetchByPath.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ExecuteRequest.FetchByPath} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath}
 */
proto.api.v1.ExecuteRequest.FetchByPath.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setTest(value);
      break;
    case 3:
      var value = /** @type {!proto.api.v1.ViewMode} */ (reader.readEnum());
      msg.setViewMode(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setPath(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setApplicationId(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setCommitId(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setBranchName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ExecuteRequest.FetchByPath.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ExecuteRequest.FetchByPath} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.FetchByPath.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getViewMode();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getPath();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeString(
      6,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional common.v1.Profile profile = 1;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 1));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
*/
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool test = 2;
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getTest = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setTest = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.clearTest = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.hasTest = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional ViewMode view_mode = 3;
 * @return {!proto.api.v1.ViewMode}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getViewMode = function() {
  return /** @type {!proto.api.v1.ViewMode} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.api.v1.ViewMode} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setViewMode = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional string path = 4;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setPath = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string application_id = 5;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getApplicationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setApplicationId = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.clearApplicationId = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.hasApplicationId = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string commit_id = 6;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getCommitId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setCommitId = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.clearCommitId = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.hasCommitId = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional string branch_name = 7;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.getBranchName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.setBranchName = function(value) {
  return jspb.Message.setField(this, 7, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest.FetchByPath} returns this
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.clearBranchName = function() {
  return jspb.Message.setField(this, 7, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.FetchByPath.prototype.hasBranchName = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.ExecuteRequest.File.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.ExecuteRequest.File.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.ExecuteRequest.File} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.File.toObject = function(includeInstance, msg) {
  var f, obj = {
originalname: jspb.Message.getFieldWithDefault(msg, 1, ""),
buffer: msg.getBuffer_asB64(),
encoding: jspb.Message.getFieldWithDefault(msg, 3, ""),
mimetype: jspb.Message.getFieldWithDefault(msg, 4, ""),
size: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.ExecuteRequest.File}
 */
proto.api.v1.ExecuteRequest.File.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.ExecuteRequest.File;
  return proto.api.v1.ExecuteRequest.File.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.ExecuteRequest.File} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.ExecuteRequest.File}
 */
proto.api.v1.ExecuteRequest.File.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setOriginalname(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setBuffer(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setEncoding(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setMimetype(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.File.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.ExecuteRequest.File.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.ExecuteRequest.File} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.ExecuteRequest.File.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOriginalname();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBuffer_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getEncoding();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getMimetype();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getSize();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string originalName = 1;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getOriginalname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.File} returns this
 */
proto.api.v1.ExecuteRequest.File.prototype.setOriginalname = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes buffer = 2;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getBuffer = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes buffer = 2;
 * This is a type-conversion wrapper around `getBuffer()`
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getBuffer_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getBuffer()));
};


/**
 * optional bytes buffer = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getBuffer()`
 * @return {!Uint8Array}
 */
proto.api.v1.ExecuteRequest.File.prototype.getBuffer_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getBuffer()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.api.v1.ExecuteRequest.File} returns this
 */
proto.api.v1.ExecuteRequest.File.prototype.setBuffer = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional string encoding = 3;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getEncoding = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.File} returns this
 */
proto.api.v1.ExecuteRequest.File.prototype.setEncoding = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string mimeType = 4;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getMimetype = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.File} returns this
 */
proto.api.v1.ExecuteRequest.File.prototype.setMimetype = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string size = 5;
 * @return {string}
 */
proto.api.v1.ExecuteRequest.File.prototype.getSize = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.ExecuteRequest.File} returns this
 */
proto.api.v1.ExecuteRequest.File.prototype.setSize = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional Options options = 1;
 * @return {?proto.api.v1.ExecuteRequest.Options}
 */
proto.api.v1.ExecuteRequest.prototype.getOptions = function() {
  return /** @type{?proto.api.v1.ExecuteRequest.Options} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.ExecuteRequest.Options, 1));
};


/**
 * @param {?proto.api.v1.ExecuteRequest.Options|undefined} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.prototype.hasOptions = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * map<string, google.protobuf.Value> inputs = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.google.protobuf.Value>}
 */
proto.api.v1.ExecuteRequest.prototype.getInputsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.google.protobuf.Value>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.google.protobuf.Value));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearInputsMap = function() {
  this.getInputsMap().clear();
  return this;
};


/**
 * optional Definition definition = 3;
 * @return {?proto.api.v1.Definition}
 */
proto.api.v1.ExecuteRequest.prototype.getDefinition = function() {
  return /** @type{?proto.api.v1.Definition} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Definition, 3));
};


/**
 * @param {?proto.api.v1.Definition|undefined} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setDefinition = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.api.v1.ExecuteRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearDefinition = function() {
  return this.setDefinition(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.prototype.hasDefinition = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Fetch fetch = 4;
 * @return {?proto.api.v1.ExecuteRequest.Fetch}
 */
proto.api.v1.ExecuteRequest.prototype.getFetch = function() {
  return /** @type{?proto.api.v1.ExecuteRequest.Fetch} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.ExecuteRequest.Fetch, 4));
};


/**
 * @param {?proto.api.v1.ExecuteRequest.Fetch|undefined} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setFetch = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.api.v1.ExecuteRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearFetch = function() {
  return this.setFetch(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.prototype.hasFetch = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional FetchByPath fetch_by_path = 8;
 * @return {?proto.api.v1.ExecuteRequest.FetchByPath}
 */
proto.api.v1.ExecuteRequest.prototype.getFetchByPath = function() {
  return /** @type{?proto.api.v1.ExecuteRequest.FetchByPath} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.ExecuteRequest.FetchByPath, 8));
};


/**
 * @param {?proto.api.v1.ExecuteRequest.FetchByPath|undefined} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setFetchByPath = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.api.v1.ExecuteRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearFetchByPath = function() {
  return this.setFetchByPath(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.prototype.hasFetchByPath = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * repeated File files = 5;
 * @return {!Array<!proto.api.v1.ExecuteRequest.File>}
 */
proto.api.v1.ExecuteRequest.prototype.getFilesList = function() {
  return /** @type{!Array<!proto.api.v1.ExecuteRequest.File>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.ExecuteRequest.File, 5));
};


/**
 * @param {!Array<!proto.api.v1.ExecuteRequest.File>} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setFilesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.api.v1.ExecuteRequest.File=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.ExecuteRequest.File}
 */
proto.api.v1.ExecuteRequest.prototype.addFiles = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.api.v1.ExecuteRequest.File, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearFilesList = function() {
  return this.setFilesList([]);
};


/**
 * optional common.v1.Profile profile = 6;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.ExecuteRequest.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 6));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.ExecuteRequest.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * repeated Mock mocks = 7;
 * @return {!Array<!proto.api.v1.Mock>}
 */
proto.api.v1.ExecuteRequest.prototype.getMocksList = function() {
  return /** @type{!Array<!proto.api.v1.Mock>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Mock, 7));
};


/**
 * @param {!Array<!proto.api.v1.Mock>} value
 * @return {!proto.api.v1.ExecuteRequest} returns this
*/
proto.api.v1.ExecuteRequest.prototype.setMocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.api.v1.Mock=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Mock}
 */
proto.api.v1.ExecuteRequest.prototype.addMocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.api.v1.Mock, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.ExecuteRequest} returns this
 */
proto.api.v1.ExecuteRequest.prototype.clearMocksList = function() {
  return this.setMocksList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Definition.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Definition.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Definition} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Definition.toObject = function(includeInstance, msg) {
  var f, obj = {
api: (f = msg.getApi()) && api_v1_api_pb.Api.toObject(includeInstance, f),
integrationsMap: (f = msg.getIntegrationsMap()) ? f.toObject(includeInstance, proto.google.protobuf.Struct.toObject) : [],
metadata: (f = msg.getMetadata()) && proto.api.v1.Definition.Metadata.toObject(includeInstance, f),
stores: (f = msg.getStores()) && store_v1_store_pb.Stores.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Definition}
 */
proto.api.v1.Definition.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Definition;
  return proto.api.v1.Definition.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Definition} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Definition}
 */
proto.api.v1.Definition.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_v1_api_pb.Api;
      reader.readMessage(value,api_v1_api_pb.Api.deserializeBinaryFromReader);
      msg.setApi(value);
      break;
    case 2:
      var value = msg.getIntegrationsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readStringRequireUtf8, jspb.BinaryReader.prototype.readMessage, proto.google.protobuf.Struct.deserializeBinaryFromReader, "", new proto.google.protobuf.Struct());
         });
      break;
    case 3:
      var value = new proto.api.v1.Definition.Metadata;
      reader.readMessage(value,proto.api.v1.Definition.Metadata.deserializeBinaryFromReader);
      msg.setMetadata(value);
      break;
    case 4:
      var value = new store_v1_store_pb.Stores;
      reader.readMessage(value,store_v1_store_pb.Stores.deserializeBinaryFromReader);
      msg.setStores(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Definition.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Definition.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Definition} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Definition.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApi();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_v1_api_pb.Api.serializeBinaryToWriter
    );
  }
  f = message.getIntegrationsMap(true);
  if (f && f.getLength() > 0) {
jspb.internal.public_for_gencode.serializeMapToBinary(
    message.getIntegrationsMap(true),
    2,
    writer,
    jspb.BinaryWriter.prototype.writeString,
    jspb.BinaryWriter.prototype.writeMessage,
    proto.google.protobuf.Struct.serializeBinaryToWriter);
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Definition.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getStores();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      store_v1_store_pb.Stores.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Definition.Metadata.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Definition.Metadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Definition.Metadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Definition.Metadata.toObject = function(includeInstance, msg) {
  var f, obj = {
requester: jspb.Message.getFieldWithDefault(msg, 1, ""),
profile: jspb.Message.getFieldWithDefault(msg, 2, ""),
organizationPlan: jspb.Message.getFieldWithDefault(msg, 3, ""),
organizationName: jspb.Message.getFieldWithDefault(msg, 4, ""),
requesterType: (f = jspb.Message.getField(msg, 5)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Definition.Metadata}
 */
proto.api.v1.Definition.Metadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Definition.Metadata;
  return proto.api.v1.Definition.Metadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Definition.Metadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Definition.Metadata}
 */
proto.api.v1.Definition.Metadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setRequester(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setProfile(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setOrganizationPlan(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setOrganizationName(value);
      break;
    case 5:
      var value = /** @type {!proto.common.v1.UserType} */ (reader.readEnum());
      msg.setRequesterType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Definition.Metadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Definition.Metadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Definition.Metadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Definition.Metadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRequester();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getProfile();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOrganizationPlan();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getOrganizationName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = /** @type {!proto.common.v1.UserType} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeEnum(
      5,
      f
    );
  }
};


/**
 * optional string requester = 1;
 * @return {string}
 */
proto.api.v1.Definition.Metadata.prototype.getRequester = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.setRequester = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string profile = 2;
 * @return {string}
 */
proto.api.v1.Definition.Metadata.prototype.getProfile = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.setProfile = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string organization_plan = 3;
 * @return {string}
 */
proto.api.v1.Definition.Metadata.prototype.getOrganizationPlan = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.setOrganizationPlan = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string organization_name = 4;
 * @return {string}
 */
proto.api.v1.Definition.Metadata.prototype.getOrganizationName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.setOrganizationName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional common.v1.UserType requester_type = 5;
 * @return {!proto.common.v1.UserType}
 */
proto.api.v1.Definition.Metadata.prototype.getRequesterType = function() {
  return /** @type {!proto.common.v1.UserType} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {!proto.common.v1.UserType} value
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.setRequesterType = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Definition.Metadata} returns this
 */
proto.api.v1.Definition.Metadata.prototype.clearRequesterType = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Definition.Metadata.prototype.hasRequesterType = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Api api = 1;
 * @return {?proto.api.v1.Api}
 */
proto.api.v1.Definition.prototype.getApi = function() {
  return /** @type{?proto.api.v1.Api} */ (
    jspb.Message.getWrapperField(this, api_v1_api_pb.Api, 1));
};


/**
 * @param {?proto.api.v1.Api|undefined} value
 * @return {!proto.api.v1.Definition} returns this
*/
proto.api.v1.Definition.prototype.setApi = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Definition} returns this
 */
proto.api.v1.Definition.prototype.clearApi = function() {
  return this.setApi(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Definition.prototype.hasApi = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * map<string, google.protobuf.Struct> integrations = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.google.protobuf.Struct>}
 */
proto.api.v1.Definition.prototype.getIntegrationsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.google.protobuf.Struct>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.google.protobuf.Struct));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.api.v1.Definition} returns this
 */
proto.api.v1.Definition.prototype.clearIntegrationsMap = function() {
  this.getIntegrationsMap().clear();
  return this;
};


/**
 * optional Metadata metadata = 3;
 * @return {?proto.api.v1.Definition.Metadata}
 */
proto.api.v1.Definition.prototype.getMetadata = function() {
  return /** @type{?proto.api.v1.Definition.Metadata} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Definition.Metadata, 3));
};


/**
 * @param {?proto.api.v1.Definition.Metadata|undefined} value
 * @return {!proto.api.v1.Definition} returns this
*/
proto.api.v1.Definition.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Definition} returns this
 */
proto.api.v1.Definition.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Definition.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional store.v1.Stores stores = 4;
 * @return {?proto.store.v1.Stores}
 */
proto.api.v1.Definition.prototype.getStores = function() {
  return /** @type{?proto.store.v1.Stores} */ (
    jspb.Message.getWrapperField(this, store_v1_store_pb.Stores, 4));
};


/**
 * @param {?proto.store.v1.Stores|undefined} value
 * @return {!proto.api.v1.Definition} returns this
*/
proto.api.v1.Definition.prototype.setStores = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Definition} returns this
 */
proto.api.v1.Definition.prototype.clearStores = function() {
  return this.setStores(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Definition.prototype.hasStores = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.StatusRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.StatusRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.StatusRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.StatusRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.StatusRequest}
 */
proto.api.v1.StatusRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.StatusRequest;
  return proto.api.v1.StatusRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.StatusRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.StatusRequest}
 */
proto.api.v1.StatusRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.StatusRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.StatusRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.StatusRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.StatusRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.StatusRequest.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.StatusRequest} returns this
 */
proto.api.v1.StatusRequest.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.AwaitResponse.repeatedFields_ = [3,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.AwaitResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.AwaitResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.AwaitResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.AwaitResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, ""),
output: (f = msg.getOutput()) && api_v1_event_pb.Output.toObject(includeInstance, f),
errorsList: jspb.Message.toObjectList(msg.getErrorsList(),
    common_v1_errors_pb.Error.toObject, includeInstance),
status: jspb.Message.getFieldWithDefault(msg, 4, 0),
performance: (f = msg.getPerformance()) && api_v1_event_pb.Performance.toObject(includeInstance, f),
eventsList: jspb.Message.toObjectList(msg.getEventsList(),
    api_v1_event_pb.Event.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.AwaitResponse}
 */
proto.api.v1.AwaitResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.AwaitResponse;
  return proto.api.v1.AwaitResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.AwaitResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.AwaitResponse}
 */
proto.api.v1.AwaitResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    case 2:
      var value = new api_v1_event_pb.Output;
      reader.readMessage(value,api_v1_event_pb.Output.deserializeBinaryFromReader);
      msg.setOutput(value);
      break;
    case 3:
      var value = new common_v1_errors_pb.Error;
      reader.readMessage(value,common_v1_errors_pb.Error.deserializeBinaryFromReader);
      msg.addErrors(value);
      break;
    case 4:
      var value = /** @type {!proto.api.v1.AwaitResponse.Status} */ (reader.readEnum());
      msg.setStatus(value);
      break;
    case 5:
      var value = new api_v1_event_pb.Performance;
      reader.readMessage(value,api_v1_event_pb.Performance.deserializeBinaryFromReader);
      msg.setPerformance(value);
      break;
    case 6:
      var value = new api_v1_event_pb.Event;
      reader.readMessage(value,api_v1_event_pb.Event.deserializeBinaryFromReader);
      msg.addEvents(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.AwaitResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.AwaitResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.AwaitResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.AwaitResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOutput();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_v1_event_pb.Output.serializeBinaryToWriter
    );
  }
  f = message.getErrorsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      common_v1_errors_pb.Error.serializeBinaryToWriter
    );
  }
  f = message.getStatus();
  if (f !== 0.0) {
    writer.writeEnum(
      4,
      f
    );
  }
  f = message.getPerformance();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      api_v1_event_pb.Performance.serializeBinaryToWriter
    );
  }
  f = message.getEventsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      6,
      f,
      api_v1_event_pb.Event.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.api.v1.AwaitResponse.Status = {
  STATUS_UNSPECIFIED: 0,
  STATUS_COMPLETED: 1,
  STATUS_EXECUTING: 2
};

/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.AwaitResponse.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Output output = 2;
 * @return {?proto.api.v1.Output}
 */
proto.api.v1.AwaitResponse.prototype.getOutput = function() {
  return /** @type{?proto.api.v1.Output} */ (
    jspb.Message.getWrapperField(this, api_v1_event_pb.Output, 2));
};


/**
 * @param {?proto.api.v1.Output|undefined} value
 * @return {!proto.api.v1.AwaitResponse} returns this
*/
proto.api.v1.AwaitResponse.prototype.setOutput = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.clearOutput = function() {
  return this.setOutput(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.AwaitResponse.prototype.hasOutput = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated common.v1.Error errors = 3;
 * @return {!Array<!proto.common.v1.Error>}
 */
proto.api.v1.AwaitResponse.prototype.getErrorsList = function() {
  return /** @type{!Array<!proto.common.v1.Error>} */ (
    jspb.Message.getRepeatedWrapperField(this, common_v1_errors_pb.Error, 3));
};


/**
 * @param {!Array<!proto.common.v1.Error>} value
 * @return {!proto.api.v1.AwaitResponse} returns this
*/
proto.api.v1.AwaitResponse.prototype.setErrorsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.common.v1.Error=} opt_value
 * @param {number=} opt_index
 * @return {!proto.common.v1.Error}
 */
proto.api.v1.AwaitResponse.prototype.addErrors = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.common.v1.Error, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.clearErrorsList = function() {
  return this.setErrorsList([]);
};


/**
 * optional Status status = 4;
 * @return {!proto.api.v1.AwaitResponse.Status}
 */
proto.api.v1.AwaitResponse.prototype.getStatus = function() {
  return /** @type {!proto.api.v1.AwaitResponse.Status} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {!proto.api.v1.AwaitResponse.Status} value
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3EnumField(this, 4, value);
};


/**
 * optional Performance performance = 5;
 * @return {?proto.api.v1.Performance}
 */
proto.api.v1.AwaitResponse.prototype.getPerformance = function() {
  return /** @type{?proto.api.v1.Performance} */ (
    jspb.Message.getWrapperField(this, api_v1_event_pb.Performance, 5));
};


/**
 * @param {?proto.api.v1.Performance|undefined} value
 * @return {!proto.api.v1.AwaitResponse} returns this
*/
proto.api.v1.AwaitResponse.prototype.setPerformance = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.clearPerformance = function() {
  return this.setPerformance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.AwaitResponse.prototype.hasPerformance = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * repeated Event events = 6;
 * @return {!Array<!proto.api.v1.Event>}
 */
proto.api.v1.AwaitResponse.prototype.getEventsList = function() {
  return /** @type{!Array<!proto.api.v1.Event>} */ (
    jspb.Message.getRepeatedWrapperField(this, api_v1_event_pb.Event, 6));
};


/**
 * @param {!Array<!proto.api.v1.Event>} value
 * @return {!proto.api.v1.AwaitResponse} returns this
*/
proto.api.v1.AwaitResponse.prototype.setEventsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 6, value);
};


/**
 * @param {!proto.api.v1.Event=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Event}
 */
proto.api.v1.AwaitResponse.prototype.addEvents = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 6, opt_value, proto.api.v1.Event, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.AwaitResponse} returns this
 */
proto.api.v1.AwaitResponse.prototype.clearEventsList = function() {
  return this.setEventsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.AsyncResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.AsyncResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.AsyncResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.AsyncResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, ""),
error: (f = msg.getError()) && common_v1_errors_pb.Error.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.AsyncResponse}
 */
proto.api.v1.AsyncResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.AsyncResponse;
  return proto.api.v1.AsyncResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.AsyncResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.AsyncResponse}
 */
proto.api.v1.AsyncResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    case 2:
      var value = new common_v1_errors_pb.Error;
      reader.readMessage(value,common_v1_errors_pb.Error.deserializeBinaryFromReader);
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.AsyncResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.AsyncResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.AsyncResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.AsyncResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getError();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_v1_errors_pb.Error.serializeBinaryToWriter
    );
  }
};


/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.AsyncResponse.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.AsyncResponse} returns this
 */
proto.api.v1.AsyncResponse.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional common.v1.Error error = 2;
 * @return {?proto.common.v1.Error}
 */
proto.api.v1.AsyncResponse.prototype.getError = function() {
  return /** @type{?proto.common.v1.Error} */ (
    jspb.Message.getWrapperField(this, common_v1_errors_pb.Error, 2));
};


/**
 * @param {?proto.common.v1.Error|undefined} value
 * @return {!proto.api.v1.AsyncResponse} returns this
*/
proto.api.v1.AsyncResponse.prototype.setError = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.AsyncResponse} returns this
 */
proto.api.v1.AsyncResponse.prototype.clearError = function() {
  return this.setError(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.AsyncResponse.prototype.hasError = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.StreamResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.StreamResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.StreamResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.StreamResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, ""),
event: (f = msg.getEvent()) && api_v1_event_pb.Event.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.StreamResponse}
 */
proto.api.v1.StreamResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.StreamResponse;
  return proto.api.v1.StreamResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.StreamResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.StreamResponse}
 */
proto.api.v1.StreamResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    case 2:
      var value = new api_v1_event_pb.Event;
      reader.readMessage(value,api_v1_event_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.StreamResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.StreamResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.StreamResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.StreamResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_v1_event_pb.Event.serializeBinaryToWriter
    );
  }
};


/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.StreamResponse.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.StreamResponse} returns this
 */
proto.api.v1.StreamResponse.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Event event = 2;
 * @return {?proto.api.v1.Event}
 */
proto.api.v1.StreamResponse.prototype.getEvent = function() {
  return /** @type{?proto.api.v1.Event} */ (
    jspb.Message.getWrapperField(this, api_v1_event_pb.Event, 2));
};


/**
 * @param {?proto.api.v1.Event|undefined} value
 * @return {!proto.api.v1.StreamResponse} returns this
*/
proto.api.v1.StreamResponse.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.StreamResponse} returns this
 */
proto.api.v1.StreamResponse.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.StreamResponse.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.OutputRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.OutputRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.OutputRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.OutputRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, ""),
block: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.OutputRequest}
 */
proto.api.v1.OutputRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.OutputRequest;
  return proto.api.v1.OutputRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.OutputRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.OutputRequest}
 */
proto.api.v1.OutputRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setBlock(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.OutputRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.OutputRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.OutputRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.OutputRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBlock();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.OutputRequest.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.OutputRequest} returns this
 */
proto.api.v1.OutputRequest.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string block = 2;
 * @return {string}
 */
proto.api.v1.OutputRequest.prototype.getBlock = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.OutputRequest} returns this
 */
proto.api.v1.OutputRequest.prototype.setBlock = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.OutputResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.OutputResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.OutputResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.OutputResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
metadata: (f = msg.getMetadata()) && common_v1_common_pb.Metadata.toObject(includeInstance, f),
output: (f = msg.getOutput()) && api_v1_event_pb.Output.toObject(includeInstance, f),
error: (f = msg.getError()) && common_v1_errors_pb.Error.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.OutputResponse}
 */
proto.api.v1.OutputResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.OutputResponse;
  return proto.api.v1.OutputResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.OutputResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.OutputResponse}
 */
proto.api.v1.OutputResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_v1_common_pb.Metadata;
      reader.readMessage(value,common_v1_common_pb.Metadata.deserializeBinaryFromReader);
      msg.setMetadata(value);
      break;
    case 2:
      var value = new api_v1_event_pb.Output;
      reader.readMessage(value,api_v1_event_pb.Output.deserializeBinaryFromReader);
      msg.setOutput(value);
      break;
    case 3:
      var value = new common_v1_errors_pb.Error;
      reader.readMessage(value,common_v1_errors_pb.Error.deserializeBinaryFromReader);
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.OutputResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.OutputResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.OutputResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.OutputResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_v1_common_pb.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getOutput();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_v1_event_pb.Output.serializeBinaryToWriter
    );
  }
  f = message.getError();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_v1_errors_pb.Error.serializeBinaryToWriter
    );
  }
};


/**
 * optional common.v1.Metadata metadata = 1;
 * @return {?proto.common.v1.Metadata}
 */
proto.api.v1.OutputResponse.prototype.getMetadata = function() {
  return /** @type{?proto.common.v1.Metadata} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Metadata, 1));
};


/**
 * @param {?proto.common.v1.Metadata|undefined} value
 * @return {!proto.api.v1.OutputResponse} returns this
*/
proto.api.v1.OutputResponse.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.OutputResponse} returns this
 */
proto.api.v1.OutputResponse.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.OutputResponse.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Output output = 2;
 * @return {?proto.api.v1.Output}
 */
proto.api.v1.OutputResponse.prototype.getOutput = function() {
  return /** @type{?proto.api.v1.Output} */ (
    jspb.Message.getWrapperField(this, api_v1_event_pb.Output, 2));
};


/**
 * @param {?proto.api.v1.Output|undefined} value
 * @return {!proto.api.v1.OutputResponse} returns this
*/
proto.api.v1.OutputResponse.prototype.setOutput = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.OutputResponse} returns this
 */
proto.api.v1.OutputResponse.prototype.clearOutput = function() {
  return this.setOutput(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.OutputResponse.prototype.hasOutput = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional common.v1.Error error = 3;
 * @return {?proto.common.v1.Error}
 */
proto.api.v1.OutputResponse.prototype.getError = function() {
  return /** @type{?proto.common.v1.Error} */ (
    jspb.Message.getWrapperField(this, common_v1_errors_pb.Error, 3));
};


/**
 * @param {?proto.common.v1.Error|undefined} value
 * @return {!proto.api.v1.OutputResponse} returns this
*/
proto.api.v1.OutputResponse.prototype.setError = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.OutputResponse} returns this
 */
proto.api.v1.OutputResponse.prototype.clearError = function() {
  return this.setError(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.OutputResponse.prototype.hasError = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.CancelRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.CancelRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.CancelRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.CancelRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
execution: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.CancelRequest}
 */
proto.api.v1.CancelRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.CancelRequest;
  return proto.api.v1.CancelRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.CancelRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.CancelRequest}
 */
proto.api.v1.CancelRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setExecution(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.CancelRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.CancelRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.CancelRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.CancelRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecution();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string execution = 1;
 * @return {string}
 */
proto.api.v1.CancelRequest.prototype.getExecution = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.CancelRequest} returns this
 */
proto.api.v1.CancelRequest.prototype.setExecution = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.CancelResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.CancelResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.CancelResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.CancelResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
error: (f = msg.getError()) && common_v1_errors_pb.Error.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.CancelResponse}
 */
proto.api.v1.CancelResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.CancelResponse;
  return proto.api.v1.CancelResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.CancelResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.CancelResponse}
 */
proto.api.v1.CancelResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_v1_errors_pb.Error;
      reader.readMessage(value,common_v1_errors_pb.Error.deserializeBinaryFromReader);
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.CancelResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.CancelResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.CancelResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.CancelResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getError();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_v1_errors_pb.Error.serializeBinaryToWriter
    );
  }
};


/**
 * optional common.v1.Error error = 1;
 * @return {?proto.common.v1.Error}
 */
proto.api.v1.CancelResponse.prototype.getError = function() {
  return /** @type{?proto.common.v1.Error} */ (
    jspb.Message.getWrapperField(this, common_v1_errors_pb.Error, 1));
};


/**
 * @param {?proto.common.v1.Error|undefined} value
 * @return {!proto.api.v1.CancelResponse} returns this
*/
proto.api.v1.CancelResponse.prototype.setError = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.CancelResponse} returns this
 */
proto.api.v1.CancelResponse.prototype.clearError = function() {
  return this.setError(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.CancelResponse.prototype.hasError = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.TestRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.TestRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.TestRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TestRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
datasourceConfig: (f = msg.getDatasourceConfig()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
integrationType: jspb.Message.getFieldWithDefault(msg, 2, ""),
configurationId: jspb.Message.getFieldWithDefault(msg, 3, ""),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
actionConfig: (f = msg.getActionConfig()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.TestRequest}
 */
proto.api.v1.TestRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.TestRequest;
  return proto.api.v1.TestRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.TestRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.TestRequest}
 */
proto.api.v1.TestRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setDatasourceConfig(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setIntegrationType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setConfigurationId(value);
      break;
    case 4:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 5:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setActionConfig(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.TestRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.TestRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.TestRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TestRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDatasourceConfig();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getIntegrationType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConfigurationId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = message.getActionConfig();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional google.protobuf.Struct datasource_config = 1;
 * @return {?proto.google.protobuf.Struct}
 */
proto.api.v1.TestRequest.prototype.getDatasourceConfig = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 1));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.api.v1.TestRequest} returns this
*/
proto.api.v1.TestRequest.prototype.setDatasourceConfig = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TestRequest} returns this
 */
proto.api.v1.TestRequest.prototype.clearDatasourceConfig = function() {
  return this.setDatasourceConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TestRequest.prototype.hasDatasourceConfig = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string integration_type = 2;
 * @return {string}
 */
proto.api.v1.TestRequest.prototype.getIntegrationType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.TestRequest} returns this
 */
proto.api.v1.TestRequest.prototype.setIntegrationType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string configuration_id = 3;
 * @return {string}
 */
proto.api.v1.TestRequest.prototype.getConfigurationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.TestRequest} returns this
 */
proto.api.v1.TestRequest.prototype.setConfigurationId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional common.v1.Profile profile = 4;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.TestRequest.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 4));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.TestRequest} returns this
*/
proto.api.v1.TestRequest.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TestRequest} returns this
 */
proto.api.v1.TestRequest.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TestRequest.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional google.protobuf.Struct action_config = 5;
 * @return {?proto.google.protobuf.Struct}
 */
proto.api.v1.TestRequest.prototype.getActionConfig = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 5));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.api.v1.TestRequest} returns this
*/
proto.api.v1.TestRequest.prototype.setActionConfig = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TestRequest} returns this
 */
proto.api.v1.TestRequest.prototype.clearActionConfig = function() {
  return this.setActionConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TestRequest.prototype.hasActionConfig = function() {
  return jspb.Message.getField(this, 5) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.TestResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.TestResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.TestResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TestResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.TestResponse}
 */
proto.api.v1.TestResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.TestResponse;
  return proto.api.v1.TestResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.TestResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.TestResponse}
 */
proto.api.v1.TestResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.TestResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.TestResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.TestResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TestResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.DeleteRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.DeleteRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.DeleteRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DeleteRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
integration: jspb.Message.getFieldWithDefault(msg, 1, ""),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
configurationId: jspb.Message.getFieldWithDefault(msg, 3, ""),
pluginName: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.DeleteRequest}
 */
proto.api.v1.DeleteRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.DeleteRequest;
  return proto.api.v1.DeleteRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.DeleteRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.DeleteRequest}
 */
proto.api.v1.DeleteRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setIntegration(value);
      break;
    case 2:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setConfigurationId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setPluginName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.DeleteRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.DeleteRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.DeleteRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DeleteRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIntegration();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = message.getConfigurationId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getPluginName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string integration = 1;
 * @return {string}
 */
proto.api.v1.DeleteRequest.prototype.getIntegration = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.DeleteRequest} returns this
 */
proto.api.v1.DeleteRequest.prototype.setIntegration = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional common.v1.Profile profile = 2;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.DeleteRequest.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 2));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.DeleteRequest} returns this
*/
proto.api.v1.DeleteRequest.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.DeleteRequest} returns this
 */
proto.api.v1.DeleteRequest.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.DeleteRequest.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional string configuration_id = 3;
 * @return {string}
 */
proto.api.v1.DeleteRequest.prototype.getConfigurationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.DeleteRequest} returns this
 */
proto.api.v1.DeleteRequest.prototype.setConfigurationId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string plugin_name = 4;
 * @return {string}
 */
proto.api.v1.DeleteRequest.prototype.getPluginName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.DeleteRequest} returns this
 */
proto.api.v1.DeleteRequest.prototype.setPluginName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.DeleteResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.DeleteResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.DeleteResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DeleteResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.DeleteResponse}
 */
proto.api.v1.DeleteResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.DeleteResponse;
  return proto.api.v1.DeleteResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.DeleteResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.DeleteResponse}
 */
proto.api.v1.DeleteResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.DeleteResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.DeleteResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.DeleteResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DeleteResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Function.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Function.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Function} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Function}
 */
proto.api.v1.Function.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Function;
  return proto.api.v1.Function.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Function} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Function}
 */
proto.api.v1.Function.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Function.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Function.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Function} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Function.Request.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Function.Request.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Function.Request.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Function.Request} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.Request.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
name: jspb.Message.getFieldWithDefault(msg, 2, ""),
parametersList: jspb.Message.toObjectList(msg.getParametersList(),
    google_protobuf_struct_pb.Value.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Function.Request}
 */
proto.api.v1.Function.Request.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Function.Request;
  return proto.api.v1.Function.Request.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Function.Request} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Function.Request}
 */
proto.api.v1.Function.Request.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Value;
      reader.readMessage(value,google_protobuf_struct_pb.Value.deserializeBinaryFromReader);
      msg.addParameters(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Function.Request.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Function.Request.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Function.Request} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.Request.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getParametersList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      google_protobuf_struct_pb.Value.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.api.v1.Function.Request.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Function.Request} returns this
 */
proto.api.v1.Function.Request.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.api.v1.Function.Request.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Function.Request} returns this
 */
proto.api.v1.Function.Request.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated google.protobuf.Value parameters = 3;
 * @return {!Array<!proto.google.protobuf.Value>}
 */
proto.api.v1.Function.Request.prototype.getParametersList = function() {
  return /** @type{!Array<!proto.google.protobuf.Value>} */ (
    jspb.Message.getRepeatedWrapperField(this, google_protobuf_struct_pb.Value, 3));
};


/**
 * @param {!Array<!proto.google.protobuf.Value>} value
 * @return {!proto.api.v1.Function.Request} returns this
*/
proto.api.v1.Function.Request.prototype.setParametersList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.google.protobuf.Value=} opt_value
 * @param {number=} opt_index
 * @return {!proto.google.protobuf.Value}
 */
proto.api.v1.Function.Request.prototype.addParameters = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.google.protobuf.Value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Function.Request} returns this
 */
proto.api.v1.Function.Request.prototype.clearParametersList = function() {
  return this.setParametersList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Function.Response.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Function.Response.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Function.Response} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.Response.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
value: (f = msg.getValue()) && google_protobuf_struct_pb.Value.toObject(includeInstance, f),
error: (f = msg.getError()) && common_v1_errors_pb.Error.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Function.Response}
 */
proto.api.v1.Function.Response.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Function.Response;
  return proto.api.v1.Function.Response.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Function.Response} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Function.Response}
 */
proto.api.v1.Function.Response.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Value;
      reader.readMessage(value,google_protobuf_struct_pb.Value.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    case 3:
      var value = new common_v1_errors_pb.Error;
      reader.readMessage(value,common_v1_errors_pb.Error.deserializeBinaryFromReader);
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Function.Response.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Function.Response.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Function.Response} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Function.Response.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Value.serializeBinaryToWriter
    );
  }
  f = message.getError();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_v1_errors_pb.Error.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.api.v1.Function.Response.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Function.Response} returns this
 */
proto.api.v1.Function.Response.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Value value = 2;
 * @return {?proto.google.protobuf.Value}
 */
proto.api.v1.Function.Response.prototype.getValue = function() {
  return /** @type{?proto.google.protobuf.Value} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Value, 2));
};


/**
 * @param {?proto.google.protobuf.Value|undefined} value
 * @return {!proto.api.v1.Function.Response} returns this
*/
proto.api.v1.Function.Response.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Function.Response} returns this
 */
proto.api.v1.Function.Response.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Function.Response.prototype.hasValue = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional common.v1.Error error = 3;
 * @return {?proto.common.v1.Error}
 */
proto.api.v1.Function.Response.prototype.getError = function() {
  return /** @type{?proto.common.v1.Error} */ (
    jspb.Message.getWrapperField(this, common_v1_errors_pb.Error, 3));
};


/**
 * @param {?proto.common.v1.Error|undefined} value
 * @return {!proto.api.v1.Function.Response} returns this
*/
proto.api.v1.Function.Response.prototype.setError = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Function.Response} returns this
 */
proto.api.v1.Function.Response.prototype.clearError = function() {
  return this.setError(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Function.Response.prototype.hasError = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.TwoWayRequest.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.api.v1.TwoWayRequest.TypeCase = {
  TYPE_NOT_SET: 0,
  EXECUTE: 1,
  FUNCTION: 2
};

/**
 * @return {proto.api.v1.TwoWayRequest.TypeCase}
 */
proto.api.v1.TwoWayRequest.prototype.getTypeCase = function() {
  return /** @type {proto.api.v1.TwoWayRequest.TypeCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.TwoWayRequest.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.TwoWayRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.TwoWayRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.TwoWayRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TwoWayRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
execute: (f = msg.getExecute()) && proto.api.v1.ExecuteRequest.toObject(includeInstance, f),
pb_function: (f = msg.getFunction()) && proto.api.v1.Function.Response.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.TwoWayRequest}
 */
proto.api.v1.TwoWayRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.TwoWayRequest;
  return proto.api.v1.TwoWayRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.TwoWayRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.TwoWayRequest}
 */
proto.api.v1.TwoWayRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.ExecuteRequest;
      reader.readMessage(value,proto.api.v1.ExecuteRequest.deserializeBinaryFromReader);
      msg.setExecute(value);
      break;
    case 2:
      var value = new proto.api.v1.Function.Response;
      reader.readMessage(value,proto.api.v1.Function.Response.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.TwoWayRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.TwoWayRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.TwoWayRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TwoWayRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecute();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.ExecuteRequest.serializeBinaryToWriter
    );
  }
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Function.Response.serializeBinaryToWriter
    );
  }
};


/**
 * optional ExecuteRequest execute = 1;
 * @return {?proto.api.v1.ExecuteRequest}
 */
proto.api.v1.TwoWayRequest.prototype.getExecute = function() {
  return /** @type{?proto.api.v1.ExecuteRequest} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.ExecuteRequest, 1));
};


/**
 * @param {?proto.api.v1.ExecuteRequest|undefined} value
 * @return {!proto.api.v1.TwoWayRequest} returns this
*/
proto.api.v1.TwoWayRequest.prototype.setExecute = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.TwoWayRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TwoWayRequest} returns this
 */
proto.api.v1.TwoWayRequest.prototype.clearExecute = function() {
  return this.setExecute(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TwoWayRequest.prototype.hasExecute = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Function.Response function = 2;
 * @return {?proto.api.v1.Function.Response}
 */
proto.api.v1.TwoWayRequest.prototype.getFunction = function() {
  return /** @type{?proto.api.v1.Function.Response} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Function.Response, 2));
};


/**
 * @param {?proto.api.v1.Function.Response|undefined} value
 * @return {!proto.api.v1.TwoWayRequest} returns this
*/
proto.api.v1.TwoWayRequest.prototype.setFunction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.TwoWayRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TwoWayRequest} returns this
 */
proto.api.v1.TwoWayRequest.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TwoWayRequest.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.TwoWayResponse.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.api.v1.TwoWayResponse.TypeCase = {
  TYPE_NOT_SET: 0,
  STREAM: 1,
  FUNCTION: 2
};

/**
 * @return {proto.api.v1.TwoWayResponse.TypeCase}
 */
proto.api.v1.TwoWayResponse.prototype.getTypeCase = function() {
  return /** @type {proto.api.v1.TwoWayResponse.TypeCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.TwoWayResponse.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.TwoWayResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.TwoWayResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.TwoWayResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TwoWayResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
stream: (f = msg.getStream()) && proto.api.v1.StreamResponse.toObject(includeInstance, f),
pb_function: (f = msg.getFunction()) && proto.api.v1.Function.Request.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.TwoWayResponse}
 */
proto.api.v1.TwoWayResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.TwoWayResponse;
  return proto.api.v1.TwoWayResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.TwoWayResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.TwoWayResponse}
 */
proto.api.v1.TwoWayResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.StreamResponse;
      reader.readMessage(value,proto.api.v1.StreamResponse.deserializeBinaryFromReader);
      msg.setStream(value);
      break;
    case 2:
      var value = new proto.api.v1.Function.Request;
      reader.readMessage(value,proto.api.v1.Function.Request.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.TwoWayResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.TwoWayResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.TwoWayResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.TwoWayResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStream();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.StreamResponse.serializeBinaryToWriter
    );
  }
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Function.Request.serializeBinaryToWriter
    );
  }
};


/**
 * optional StreamResponse stream = 1;
 * @return {?proto.api.v1.StreamResponse}
 */
proto.api.v1.TwoWayResponse.prototype.getStream = function() {
  return /** @type{?proto.api.v1.StreamResponse} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.StreamResponse, 1));
};


/**
 * @param {?proto.api.v1.StreamResponse|undefined} value
 * @return {!proto.api.v1.TwoWayResponse} returns this
*/
proto.api.v1.TwoWayResponse.prototype.setStream = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.TwoWayResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TwoWayResponse} returns this
 */
proto.api.v1.TwoWayResponse.prototype.clearStream = function() {
  return this.setStream(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TwoWayResponse.prototype.hasStream = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Function.Request function = 2;
 * @return {?proto.api.v1.Function.Request}
 */
proto.api.v1.TwoWayResponse.prototype.getFunction = function() {
  return /** @type{?proto.api.v1.Function.Request} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Function.Request, 2));
};


/**
 * @param {?proto.api.v1.Function.Request|undefined} value
 * @return {!proto.api.v1.TwoWayResponse} returns this
*/
proto.api.v1.TwoWayResponse.prototype.setFunction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.TwoWayResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.TwoWayResponse} returns this
 */
proto.api.v1.TwoWayResponse.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.TwoWayResponse.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Mock.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Mock.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Mock} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.toObject = function(includeInstance, msg) {
  var f, obj = {
on: (f = msg.getOn()) && proto.api.v1.Mock.On.toObject(includeInstance, f),
pb_return: (f = msg.getReturn()) && proto.api.v1.Mock.Return.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Mock}
 */
proto.api.v1.Mock.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Mock;
  return proto.api.v1.Mock.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Mock} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Mock}
 */
proto.api.v1.Mock.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Mock.On;
      reader.readMessage(value,proto.api.v1.Mock.On.deserializeBinaryFromReader);
      msg.setOn(value);
      break;
    case 2:
      var value = new proto.api.v1.Mock.Return;
      reader.readMessage(value,proto.api.v1.Mock.Return.deserializeBinaryFromReader);
      msg.setReturn(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Mock.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Mock.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Mock} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Mock.On.serializeBinaryToWriter
    );
  }
  f = message.getReturn();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Mock.Return.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Mock.Params.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Mock.Params.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Mock.Params} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.Params.toObject = function(includeInstance, msg) {
  var f, obj = {
integrationType: (f = jspb.Message.getField(msg, 1)) == null ? undefined : f,
stepName: (f = jspb.Message.getField(msg, 2)) == null ? undefined : f,
inputs: (f = msg.getInputs()) && google_protobuf_struct_pb.Value.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Mock.Params}
 */
proto.api.v1.Mock.Params.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Mock.Params;
  return proto.api.v1.Mock.Params.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Mock.Params} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Mock.Params}
 */
proto.api.v1.Mock.Params.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setIntegrationType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setStepName(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Value;
      reader.readMessage(value,google_protobuf_struct_pb.Value.deserializeBinaryFromReader);
      msg.setInputs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Mock.Params.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Mock.Params.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Mock.Params} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.Params.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getInputs();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_struct_pb.Value.serializeBinaryToWriter
    );
  }
};


/**
 * optional string integration_type = 1;
 * @return {string}
 */
proto.api.v1.Mock.Params.prototype.getIntegrationType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Mock.Params} returns this
 */
proto.api.v1.Mock.Params.prototype.setIntegrationType = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Mock.Params} returns this
 */
proto.api.v1.Mock.Params.prototype.clearIntegrationType = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.Params.prototype.hasIntegrationType = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string step_name = 2;
 * @return {string}
 */
proto.api.v1.Mock.Params.prototype.getStepName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Mock.Params} returns this
 */
proto.api.v1.Mock.Params.prototype.setStepName = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Mock.Params} returns this
 */
proto.api.v1.Mock.Params.prototype.clearStepName = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.Params.prototype.hasStepName = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional google.protobuf.Value inputs = 3;
 * @return {?proto.google.protobuf.Value}
 */
proto.api.v1.Mock.Params.prototype.getInputs = function() {
  return /** @type{?proto.google.protobuf.Value} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Value, 3));
};


/**
 * @param {?proto.google.protobuf.Value|undefined} value
 * @return {!proto.api.v1.Mock.Params} returns this
*/
proto.api.v1.Mock.Params.prototype.setInputs = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Mock.Params} returns this
 */
proto.api.v1.Mock.Params.prototype.clearInputs = function() {
  return this.setInputs(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.Params.prototype.hasInputs = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Mock.On.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Mock.On.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Mock.On} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.On.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_static: (f = msg.getStatic()) && proto.api.v1.Mock.Params.toObject(includeInstance, f),
dynamic: (f = jspb.Message.getField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Mock.On}
 */
proto.api.v1.Mock.On.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Mock.On;
  return proto.api.v1.Mock.On.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Mock.On} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Mock.On}
 */
proto.api.v1.Mock.On.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Mock.Params;
      reader.readMessage(value,proto.api.v1.Mock.Params.deserializeBinaryFromReader);
      msg.setStatic(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setDynamic(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Mock.On.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Mock.On.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Mock.On} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.On.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatic();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Mock.Params.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional Params static = 1;
 * @return {?proto.api.v1.Mock.Params}
 */
proto.api.v1.Mock.On.prototype.getStatic = function() {
  return /** @type{?proto.api.v1.Mock.Params} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Mock.Params, 1));
};


/**
 * @param {?proto.api.v1.Mock.Params|undefined} value
 * @return {!proto.api.v1.Mock.On} returns this
*/
proto.api.v1.Mock.On.prototype.setStatic = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Mock.On} returns this
 */
proto.api.v1.Mock.On.prototype.clearStatic = function() {
  return this.setStatic(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.On.prototype.hasStatic = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string dynamic = 2;
 * @return {string}
 */
proto.api.v1.Mock.On.prototype.getDynamic = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Mock.On} returns this
 */
proto.api.v1.Mock.On.prototype.setDynamic = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Mock.On} returns this
 */
proto.api.v1.Mock.On.prototype.clearDynamic = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.On.prototype.hasDynamic = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.Mock.Return.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.api.v1.Mock.Return.TypeCase = {
  TYPE_NOT_SET: 0,
  STATIC: 1,
  DYNAMIC: 2
};

/**
 * @return {proto.api.v1.Mock.Return.TypeCase}
 */
proto.api.v1.Mock.Return.prototype.getTypeCase = function() {
  return /** @type {proto.api.v1.Mock.Return.TypeCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.Mock.Return.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.Mock.Return.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Mock.Return.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Mock.Return} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.Return.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_static: (f = msg.getStatic()) && google_protobuf_struct_pb.Value.toObject(includeInstance, f),
dynamic: (f = jspb.Message.getField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.Mock.Return}
 */
proto.api.v1.Mock.Return.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Mock.Return;
  return proto.api.v1.Mock.Return.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Mock.Return} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Mock.Return}
 */
proto.api.v1.Mock.Return.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_struct_pb.Value;
      reader.readMessage(value,google_protobuf_struct_pb.Value.deserializeBinaryFromReader);
      msg.setStatic(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setDynamic(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.Mock.Return.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Mock.Return.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Mock.Return} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Mock.Return.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatic();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_struct_pb.Value.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional google.protobuf.Value static = 1;
 * @return {?proto.google.protobuf.Value}
 */
proto.api.v1.Mock.Return.prototype.getStatic = function() {
  return /** @type{?proto.google.protobuf.Value} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Value, 1));
};


/**
 * @param {?proto.google.protobuf.Value|undefined} value
 * @return {!proto.api.v1.Mock.Return} returns this
*/
proto.api.v1.Mock.Return.prototype.setStatic = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.Mock.Return.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Mock.Return} returns this
 */
proto.api.v1.Mock.Return.prototype.clearStatic = function() {
  return this.setStatic(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.Return.prototype.hasStatic = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string dynamic = 2;
 * @return {string}
 */
proto.api.v1.Mock.Return.prototype.getDynamic = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Mock.Return} returns this
 */
proto.api.v1.Mock.Return.prototype.setDynamic = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.api.v1.Mock.Return.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Mock.Return} returns this
 */
proto.api.v1.Mock.Return.prototype.clearDynamic = function() {
  return jspb.Message.setOneofField(this, 2, proto.api.v1.Mock.Return.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.Return.prototype.hasDynamic = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional On on = 1;
 * @return {?proto.api.v1.Mock.On}
 */
proto.api.v1.Mock.prototype.getOn = function() {
  return /** @type{?proto.api.v1.Mock.On} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Mock.On, 1));
};


/**
 * @param {?proto.api.v1.Mock.On|undefined} value
 * @return {!proto.api.v1.Mock} returns this
*/
proto.api.v1.Mock.prototype.setOn = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Mock} returns this
 */
proto.api.v1.Mock.prototype.clearOn = function() {
  return this.setOn(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.prototype.hasOn = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Return return = 2;
 * @return {?proto.api.v1.Mock.Return}
 */
proto.api.v1.Mock.prototype.getReturn = function() {
  return /** @type{?proto.api.v1.Mock.Return} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Mock.Return, 2));
};


/**
 * @param {?proto.api.v1.Mock.Return|undefined} value
 * @return {!proto.api.v1.Mock} returns this
*/
proto.api.v1.Mock.prototype.setReturn = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Mock} returns this
 */
proto.api.v1.Mock.prototype.clearReturn = function() {
  return this.setReturn(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Mock.prototype.hasReturn = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataRequestDeprecated.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataRequestDeprecated} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataRequestDeprecated.toObject = function(includeInstance, msg) {
  var f, obj = {
integration: jspb.Message.getFieldWithDefault(msg, 1, ""),
apiId: jspb.Message.getFieldWithDefault(msg, 2, ""),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataRequestDeprecated}
 */
proto.api.v1.MetadataRequestDeprecated.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataRequestDeprecated;
  return proto.api.v1.MetadataRequestDeprecated.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataRequestDeprecated} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataRequestDeprecated}
 */
proto.api.v1.MetadataRequestDeprecated.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setIntegration(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setApiId(value);
      break;
    case 3:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataRequestDeprecated.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataRequestDeprecated} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataRequestDeprecated.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIntegration();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getApiId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
};


/**
 * optional string integration = 1;
 * @return {string}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.getIntegration = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataRequestDeprecated} returns this
 */
proto.api.v1.MetadataRequestDeprecated.prototype.setIntegration = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string api_id = 2;
 * @return {string}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.getApiId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataRequestDeprecated} returns this
 */
proto.api.v1.MetadataRequestDeprecated.prototype.setApiId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional common.v1.Profile profile = 3;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 3));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.MetadataRequestDeprecated} returns this
*/
proto.api.v1.MetadataRequestDeprecated.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataRequestDeprecated} returns this
 */
proto.api.v1.MetadataRequestDeprecated.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataRequestDeprecated.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
integration: jspb.Message.getFieldWithDefault(msg, 1, ""),
profile: (f = msg.getProfile()) && common_v1_common_pb.Profile.toObject(includeInstance, f),
stepConfiguration: (f = msg.getStepConfiguration()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataRequest}
 */
proto.api.v1.MetadataRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataRequest;
  return proto.api.v1.MetadataRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataRequest}
 */
proto.api.v1.MetadataRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setIntegration(value);
      break;
    case 2:
      var value = new common_v1_common_pb.Profile;
      reader.readMessage(value,common_v1_common_pb.Profile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setStepConfiguration(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIntegration();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_v1_common_pb.Profile.serializeBinaryToWriter
    );
  }
  f = message.getStepConfiguration();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string integration = 1;
 * @return {string}
 */
proto.api.v1.MetadataRequest.prototype.getIntegration = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataRequest} returns this
 */
proto.api.v1.MetadataRequest.prototype.setIntegration = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional common.v1.Profile profile = 2;
 * @return {?proto.common.v1.Profile}
 */
proto.api.v1.MetadataRequest.prototype.getProfile = function() {
  return /** @type{?proto.common.v1.Profile} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Profile, 2));
};


/**
 * @param {?proto.common.v1.Profile|undefined} value
 * @return {!proto.api.v1.MetadataRequest} returns this
*/
proto.api.v1.MetadataRequest.prototype.setProfile = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataRequest} returns this
 */
proto.api.v1.MetadataRequest.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataRequest.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional google.protobuf.Struct step_configuration = 3;
 * @return {?proto.google.protobuf.Struct}
 */
proto.api.v1.MetadataRequest.prototype.getStepConfiguration = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 3));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.api.v1.MetadataRequest} returns this
*/
proto.api.v1.MetadataRequest.prototype.setStepConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataRequest} returns this
 */
proto.api.v1.MetadataRequest.prototype.clearStepConfiguration = function() {
  return this.setStepConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataRequest.prototype.hasStepConfiguration = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.MetadataResponse.oneofGroups_ = [[1,2,3,4,5,6,7,9]];

/**
 * @enum {number}
 */
proto.api.v1.MetadataResponse.MetadataCase = {
  METADATA_NOT_SET: 0,
  DATABASE_SCHEMA_METADATA: 1,
  BUCKETS_METADATA: 2,
  COUCHBASE: 3,
  KAFKA: 4,
  KINESIS: 5,
  COSMOSDB: 6,
  ADLS: 7,
  GRAPHQL: 9
};

/**
 * @return {proto.api.v1.MetadataResponse.MetadataCase}
 */
proto.api.v1.MetadataResponse.prototype.getMetadataCase = function() {
  return /** @type {proto.api.v1.MetadataResponse.MetadataCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.MetadataResponse.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
databaseSchemaMetadata: (f = msg.getDatabaseSchemaMetadata()) && proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.toObject(includeInstance, f),
bucketsMetadata: (f = msg.getBucketsMetadata()) && proto.api.v1.MetadataResponse.BucketsMetadata.toObject(includeInstance, f),
couchbase: (f = msg.getCouchbase()) && plugins_couchbase_v1_plugin_pb.Metadata.toObject(includeInstance, f),
kafka: (f = msg.getKafka()) && plugins_kafka_v1_plugin_pb.Metadata.toObject(includeInstance, f),
kinesis: (f = msg.getKinesis()) && plugins_kinesis_v1_plugin_pb.Metadata.toObject(includeInstance, f),
cosmosdb: (f = msg.getCosmosdb()) && plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata.toObject(includeInstance, f),
adls: (f = msg.getAdls()) && plugins_adls_v1_plugin_pb.Plugin.Metadata.toObject(includeInstance, f),
graphql: (f = msg.getGraphql()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
gSheetsNextPageToken: jspb.Message.getFieldWithDefault(msg, 8, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse}
 */
proto.api.v1.MetadataResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse;
  return proto.api.v1.MetadataResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse}
 */
proto.api.v1.MetadataResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.deserializeBinaryFromReader);
      msg.setDatabaseSchemaMetadata(value);
      break;
    case 2:
      var value = new proto.api.v1.MetadataResponse.BucketsMetadata;
      reader.readMessage(value,proto.api.v1.MetadataResponse.BucketsMetadata.deserializeBinaryFromReader);
      msg.setBucketsMetadata(value);
      break;
    case 3:
      var value = new plugins_couchbase_v1_plugin_pb.Metadata;
      reader.readMessage(value,plugins_couchbase_v1_plugin_pb.Metadata.deserializeBinaryFromReader);
      msg.setCouchbase(value);
      break;
    case 4:
      var value = new plugins_kafka_v1_plugin_pb.Metadata;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Metadata.deserializeBinaryFromReader);
      msg.setKafka(value);
      break;
    case 5:
      var value = new plugins_kinesis_v1_plugin_pb.Metadata;
      reader.readMessage(value,plugins_kinesis_v1_plugin_pb.Metadata.deserializeBinaryFromReader);
      msg.setKinesis(value);
      break;
    case 6:
      var value = new plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata;
      reader.readMessage(value,plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata.deserializeBinaryFromReader);
      msg.setCosmosdb(value);
      break;
    case 7:
      var value = new plugins_adls_v1_plugin_pb.Plugin.Metadata;
      reader.readMessage(value,plugins_adls_v1_plugin_pb.Plugin.Metadata.deserializeBinaryFromReader);
      msg.setAdls(value);
      break;
    case 9:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setGraphql(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setGSheetsNextPageToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDatabaseSchemaMetadata();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.serializeBinaryToWriter
    );
  }
  f = message.getBucketsMetadata();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.MetadataResponse.BucketsMetadata.serializeBinaryToWriter
    );
  }
  f = message.getCouchbase();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      plugins_couchbase_v1_plugin_pb.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getKafka();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      plugins_kafka_v1_plugin_pb.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getKinesis();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      plugins_kinesis_v1_plugin_pb.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getCosmosdb();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getAdls();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      plugins_adls_v1_plugin_pb.Plugin.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getGraphql();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getGSheetsNextPageToken();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.repeatedFields_ = [1,2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
tablesList: jspb.Message.toObjectList(msg.getTablesList(),
    proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.toObject, includeInstance),
schemasList: jspb.Message.toObjectList(msg.getSchemasList(),
    proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.deserializeBinaryFromReader);
      msg.addTables(value);
      break;
    case 2:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.deserializeBinaryFromReader);
      msg.addSchemas(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTablesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.serializeBinaryToWriter
    );
  }
  f = message.getSchemasList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, ""),
type: jspb.Message.getFieldWithDefault(msg, 2, ""),
escapedName: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setEscapedName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getEscapedName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string type = 2;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string escaped_name = 3;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.getEscapedName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.prototype.setEscapedName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, ""),
type: jspb.Message.getFieldWithDefault(msg, 2, ""),
columnsList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.addColumns(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getColumnsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string type = 2;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated string columns = 3;
 * @return {!Array<string>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.getColumnsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.setColumnsList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.addColumns = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.prototype.clearColumnsList = function() {
  return this.setColumnsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.toObject = function(includeInstance, msg) {
  var f, obj = {
title: jspb.Message.getFieldWithDefault(msg, 1, ""),
body: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setTitle(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setBody(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTitle();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBody();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string title = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.getTitle = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.setTitle = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string body = 2;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.getBody = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.prototype.setBody = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.repeatedFields_ = [4,5,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
type: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
columnsList: jspb.Message.toObjectList(msg.getColumnsList(),
    proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.toObject, includeInstance),
keysList: jspb.Message.toObjectList(msg.getKeysList(),
    proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.toObject, includeInstance),
templatesList: jspb.Message.toObjectList(msg.getTemplatesList(),
    proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.toObject, includeInstance),
schema: jspb.Message.getFieldWithDefault(msg, 7, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    case 4:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.deserializeBinaryFromReader);
      msg.addColumns(value);
      break;
    case 5:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.deserializeBinaryFromReader);
      msg.addKeys(value);
      break;
    case 6:
      var value = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template;
      reader.readMessage(value,proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.deserializeBinaryFromReader);
      msg.addTemplates(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setSchema(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getColumnsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column.serializeBinaryToWriter
    );
  }
  f = message.getKeysList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key.serializeBinaryToWriter
    );
  }
  f = message.getTemplatesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      6,
      f,
      proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template.serializeBinaryToWriter
    );
  }
  f = message.getSchema();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string type = 2;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * repeated Column columns = 4;
 * @return {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getColumnsList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column, 4));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
*/
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setColumnsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.addColumns = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Column, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.clearColumnsList = function() {
  return this.setColumnsList([]);
};


/**
 * repeated Key keys = 5;
 * @return {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getKeysList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key, 5));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
*/
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setKeysList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.addKeys = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Key, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.clearKeysList = function() {
  return this.setKeysList([]);
};


/**
 * repeated Template templates = 6;
 * @return {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getTemplatesList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template, 6));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
*/
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setTemplatesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 6, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.addTemplates = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 6, opt_value, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Template, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.clearTemplatesList = function() {
  return this.setTemplatesList([]);
};


/**
 * optional string schema = 7;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.getSchema = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table.prototype.setSchema = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
name: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema;
  return proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated Table tables = 1;
 * @return {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.getTablesList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table, 1));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} returns this
*/
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.setTablesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.addTables = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Table, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.clearTablesList = function() {
  return this.setTablesList([]);
};


/**
 * repeated Schema schemas = 2;
 * @return {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema>}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.getSchemasList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema, 2));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema>} value
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} returns this
*/
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.setSchemasList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema}
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.addSchemas = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.Schema, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} returns this
 */
proto.api.v1.MetadataResponse.DatabaseSchemaMetadata.prototype.clearSchemasList = function() {
  return this.setSchemasList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.BucketMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.BucketMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.BucketMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.BucketMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.BucketMetadata}
 */
proto.api.v1.MetadataResponse.BucketMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.BucketMetadata;
  return proto.api.v1.MetadataResponse.BucketMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.BucketMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.BucketMetadata}
 */
proto.api.v1.MetadataResponse.BucketMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.BucketMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.BucketMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.BucketMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.BucketMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.api.v1.MetadataResponse.BucketMetadata.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse.BucketMetadata} returns this
 */
proto.api.v1.MetadataResponse.BucketMetadata.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.MetadataResponse.BucketsMetadata.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.MetadataResponse.BucketsMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.MetadataResponse.BucketsMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.BucketsMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
bucketsList: jspb.Message.toObjectList(msg.getBucketsList(),
    proto.api.v1.MetadataResponse.BucketMetadata.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.MetadataResponse.BucketsMetadata}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.MetadataResponse.BucketsMetadata;
  return proto.api.v1.MetadataResponse.BucketsMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.MetadataResponse.BucketsMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.MetadataResponse.BucketsMetadata}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.MetadataResponse.BucketMetadata;
      reader.readMessage(value,proto.api.v1.MetadataResponse.BucketMetadata.deserializeBinaryFromReader);
      msg.addBuckets(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.MetadataResponse.BucketsMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.MetadataResponse.BucketsMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.MetadataResponse.BucketsMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBucketsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.api.v1.MetadataResponse.BucketMetadata.serializeBinaryToWriter
    );
  }
};


/**
 * repeated BucketMetadata buckets = 1;
 * @return {!Array<!proto.api.v1.MetadataResponse.BucketMetadata>}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.getBucketsList = function() {
  return /** @type{!Array<!proto.api.v1.MetadataResponse.BucketMetadata>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.MetadataResponse.BucketMetadata, 1));
};


/**
 * @param {!Array<!proto.api.v1.MetadataResponse.BucketMetadata>} value
 * @return {!proto.api.v1.MetadataResponse.BucketsMetadata} returns this
*/
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.setBucketsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.api.v1.MetadataResponse.BucketMetadata=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.MetadataResponse.BucketMetadata}
 */
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.addBuckets = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.api.v1.MetadataResponse.BucketMetadata, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.MetadataResponse.BucketsMetadata} returns this
 */
proto.api.v1.MetadataResponse.BucketsMetadata.prototype.clearBucketsList = function() {
  return this.setBucketsList([]);
};


/**
 * optional DatabaseSchemaMetadata database_schema_metadata = 1;
 * @return {?proto.api.v1.MetadataResponse.DatabaseSchemaMetadata}
 */
proto.api.v1.MetadataResponse.prototype.getDatabaseSchemaMetadata = function() {
  return /** @type{?proto.api.v1.MetadataResponse.DatabaseSchemaMetadata} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.MetadataResponse.DatabaseSchemaMetadata, 1));
};


/**
 * @param {?proto.api.v1.MetadataResponse.DatabaseSchemaMetadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setDatabaseSchemaMetadata = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearDatabaseSchemaMetadata = function() {
  return this.setDatabaseSchemaMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasDatabaseSchemaMetadata = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional BucketsMetadata buckets_metadata = 2;
 * @return {?proto.api.v1.MetadataResponse.BucketsMetadata}
 */
proto.api.v1.MetadataResponse.prototype.getBucketsMetadata = function() {
  return /** @type{?proto.api.v1.MetadataResponse.BucketsMetadata} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.MetadataResponse.BucketsMetadata, 2));
};


/**
 * @param {?proto.api.v1.MetadataResponse.BucketsMetadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setBucketsMetadata = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearBucketsMetadata = function() {
  return this.setBucketsMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasBucketsMetadata = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional plugins.couchbase.v1.Metadata couchbase = 3;
 * @return {?proto.plugins.couchbase.v1.Metadata}
 */
proto.api.v1.MetadataResponse.prototype.getCouchbase = function() {
  return /** @type{?proto.plugins.couchbase.v1.Metadata} */ (
    jspb.Message.getWrapperField(this, plugins_couchbase_v1_plugin_pb.Metadata, 3));
};


/**
 * @param {?proto.plugins.couchbase.v1.Metadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setCouchbase = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearCouchbase = function() {
  return this.setCouchbase(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasCouchbase = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional plugins.kafka.v1.Metadata kafka = 4;
 * @return {?proto.plugins.kafka.v1.Metadata}
 */
proto.api.v1.MetadataResponse.prototype.getKafka = function() {
  return /** @type{?proto.plugins.kafka.v1.Metadata} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Metadata, 4));
};


/**
 * @param {?proto.plugins.kafka.v1.Metadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setKafka = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearKafka = function() {
  return this.setKafka(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasKafka = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional plugins.kinesis.v1.Metadata kinesis = 5;
 * @return {?proto.plugins.kinesis.v1.Metadata}
 */
proto.api.v1.MetadataResponse.prototype.getKinesis = function() {
  return /** @type{?proto.plugins.kinesis.v1.Metadata} */ (
    jspb.Message.getWrapperField(this, plugins_kinesis_v1_plugin_pb.Metadata, 5));
};


/**
 * @param {?proto.plugins.kinesis.v1.Metadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setKinesis = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearKinesis = function() {
  return this.setKinesis(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasKinesis = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional plugins.cosmosdb.v1.Plugin.Metadata cosmosdb = 6;
 * @return {?proto.plugins.cosmosdb.v1.Plugin.Metadata}
 */
proto.api.v1.MetadataResponse.prototype.getCosmosdb = function() {
  return /** @type{?proto.plugins.cosmosdb.v1.Plugin.Metadata} */ (
    jspb.Message.getWrapperField(this, plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata, 6));
};


/**
 * @param {?proto.plugins.cosmosdb.v1.Plugin.Metadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setCosmosdb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearCosmosdb = function() {
  return this.setCosmosdb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasCosmosdb = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional plugins.adls.v1.Plugin.Metadata adls = 7;
 * @return {?proto.plugins.adls.v1.Plugin.Metadata}
 */
proto.api.v1.MetadataResponse.prototype.getAdls = function() {
  return /** @type{?proto.plugins.adls.v1.Plugin.Metadata} */ (
    jspb.Message.getWrapperField(this, plugins_adls_v1_plugin_pb.Plugin.Metadata, 7));
};


/**
 * @param {?proto.plugins.adls.v1.Plugin.Metadata|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setAdls = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearAdls = function() {
  return this.setAdls(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasAdls = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional google.protobuf.Struct graphql = 9;
 * @return {?proto.google.protobuf.Struct}
 */
proto.api.v1.MetadataResponse.prototype.getGraphql = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 9));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.api.v1.MetadataResponse} returns this
*/
proto.api.v1.MetadataResponse.prototype.setGraphql = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.api.v1.MetadataResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.clearGraphql = function() {
  return this.setGraphql(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.MetadataResponse.prototype.hasGraphql = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional string g_sheets_next_page_token = 8;
 * @return {string}
 */
proto.api.v1.MetadataResponse.prototype.getGSheetsNextPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.MetadataResponse} returns this
 */
proto.api.v1.MetadataResponse.prototype.setGSheetsNextPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.DownloadRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.DownloadRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.DownloadRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DownloadRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
location: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.DownloadRequest}
 */
proto.api.v1.DownloadRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.DownloadRequest;
  return proto.api.v1.DownloadRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.DownloadRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.DownloadRequest}
 */
proto.api.v1.DownloadRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setLocation(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.DownloadRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.DownloadRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.DownloadRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DownloadRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLocation();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string location = 1;
 * @return {string}
 */
proto.api.v1.DownloadRequest.prototype.getLocation = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.DownloadRequest} returns this
 */
proto.api.v1.DownloadRequest.prototype.setLocation = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.DownloadResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.DownloadResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.DownloadResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DownloadResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
data: msg.getData_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.DownloadResponse}
 */
proto.api.v1.DownloadResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.DownloadResponse;
  return proto.api.v1.DownloadResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.DownloadResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.DownloadResponse}
 */
proto.api.v1.DownloadResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.DownloadResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.DownloadResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.DownloadResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.DownloadResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
};


/**
 * optional bytes data = 1;
 * @return {string}
 */
proto.api.v1.DownloadResponse.prototype.getData = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes data = 1;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.api.v1.DownloadResponse.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.api.v1.DownloadResponse.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.api.v1.DownloadResponse} returns this
 */
proto.api.v1.DownloadResponse.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.WorkflowResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.WorkflowResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.WorkflowResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.WorkflowResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
data: (f = msg.getData()) && google_protobuf_struct_pb.Value.toObject(includeInstance, f),
responseMeta: (f = msg.getResponseMeta()) && proto.api.v1.WorkflowResponse.ResponseMeta.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.WorkflowResponse}
 */
proto.api.v1.WorkflowResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.WorkflowResponse;
  return proto.api.v1.WorkflowResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.WorkflowResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.WorkflowResponse}
 */
proto.api.v1.WorkflowResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_struct_pb.Value;
      reader.readMessage(value,google_protobuf_struct_pb.Value.deserializeBinaryFromReader);
      msg.setData(value);
      break;
    case 2:
      var value = new proto.api.v1.WorkflowResponse.ResponseMeta;
      reader.readMessage(value,proto.api.v1.WorkflowResponse.ResponseMeta.deserializeBinaryFromReader);
      msg.setResponseMeta(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.WorkflowResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.WorkflowResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.WorkflowResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.WorkflowResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_struct_pb.Value.serializeBinaryToWriter
    );
  }
  f = message.getResponseMeta();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.WorkflowResponse.ResponseMeta.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.WorkflowResponse.ResponseMeta.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.WorkflowResponse.ResponseMeta} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.WorkflowResponse.ResponseMeta.toObject = function(includeInstance, msg) {
  var f, obj = {
status: jspb.Message.getFieldWithDefault(msg, 1, 0),
message: jspb.Message.getFieldWithDefault(msg, 2, ""),
success: jspb.Message.getBooleanFieldWithDefault(msg, 3, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.api.v1.WorkflowResponse.ResponseMeta}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.WorkflowResponse.ResponseMeta;
  return proto.api.v1.WorkflowResponse.ResponseMeta.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.WorkflowResponse.ResponseMeta} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.WorkflowResponse.ResponseMeta}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setStatus(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readStringRequireUtf8());
      msg.setMessage(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSuccess(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.WorkflowResponse.ResponseMeta.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.WorkflowResponse.ResponseMeta} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.WorkflowResponse.ResponseMeta.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSuccess();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
};


/**
 * optional int32 status = 1;
 * @return {number}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.getStatus = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.api.v1.WorkflowResponse.ResponseMeta} returns this
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.setStatus = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.WorkflowResponse.ResponseMeta} returns this
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bool success = 3;
 * @return {boolean}
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.getSuccess = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.WorkflowResponse.ResponseMeta} returns this
 */
proto.api.v1.WorkflowResponse.ResponseMeta.prototype.setSuccess = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional google.protobuf.Value data = 1;
 * @return {?proto.google.protobuf.Value}
 */
proto.api.v1.WorkflowResponse.prototype.getData = function() {
  return /** @type{?proto.google.protobuf.Value} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Value, 1));
};


/**
 * @param {?proto.google.protobuf.Value|undefined} value
 * @return {!proto.api.v1.WorkflowResponse} returns this
*/
proto.api.v1.WorkflowResponse.prototype.setData = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.WorkflowResponse} returns this
 */
proto.api.v1.WorkflowResponse.prototype.clearData = function() {
  return this.setData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.WorkflowResponse.prototype.hasData = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional ResponseMeta response_meta = 2;
 * @return {?proto.api.v1.WorkflowResponse.ResponseMeta}
 */
proto.api.v1.WorkflowResponse.prototype.getResponseMeta = function() {
  return /** @type{?proto.api.v1.WorkflowResponse.ResponseMeta} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.WorkflowResponse.ResponseMeta, 2));
};


/**
 * @param {?proto.api.v1.WorkflowResponse.ResponseMeta|undefined} value
 * @return {!proto.api.v1.WorkflowResponse} returns this
*/
proto.api.v1.WorkflowResponse.prototype.setResponseMeta = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.WorkflowResponse} returns this
 */
proto.api.v1.WorkflowResponse.prototype.clearResponseMeta = function() {
  return this.setResponseMeta(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.WorkflowResponse.prototype.hasResponseMeta = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * @enum {number}
 */
proto.api.v1.ViewMode = {
  VIEW_MODE_UNSPECIFIED: 0,
  VIEW_MODE_EDIT: 1,
  VIEW_MODE_PREVIEW: 2,
  VIEW_MODE_DEPLOYED: 3
};

goog.object.extend(exports, proto.api.v1);
