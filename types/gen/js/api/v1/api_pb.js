// source: api/v1/api.proto
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
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

var api_v1_blocks_pb = require('../../api/v1/blocks_pb');
goog.object.extend(proto, api_v1_blocks_pb);
var buf_validate_validate_pb = require('../../buf/validate/validate_pb');
goog.object.extend(proto, buf_validate_validate_pb);
var common_v1_common_pb = require('../../common/v1/common_pb');
goog.object.extend(proto, common_v1_common_pb);
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb');
goog.object.extend(proto, google_protobuf_struct_pb);
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb');
goog.object.extend(proto, google_protobuf_timestamp_pb);
var plugins_adls_v1_plugin_pb = require('../../plugins/adls/v1/plugin_pb');
goog.object.extend(proto, plugins_adls_v1_plugin_pb);
var plugins_athena_v1_plugin_pb = require('../../plugins/athena/v1/plugin_pb');
goog.object.extend(proto, plugins_athena_v1_plugin_pb);
var plugins_bigquery_v1_plugin_pb = require('../../plugins/bigquery/v1/plugin_pb');
goog.object.extend(proto, plugins_bigquery_v1_plugin_pb);
var plugins_cockroachdb_v1_plugin_pb = require('../../plugins/cockroachdb/v1/plugin_pb');
goog.object.extend(proto, plugins_cockroachdb_v1_plugin_pb);
var plugins_cosmosdb_v1_plugin_pb = require('../../plugins/cosmosdb/v1/plugin_pb');
goog.object.extend(proto, plugins_cosmosdb_v1_plugin_pb);
var plugins_couchbase_v1_plugin_pb = require('../../plugins/couchbase/v1/plugin_pb');
goog.object.extend(proto, plugins_couchbase_v1_plugin_pb);
var plugins_custom_v1_plugin_pb = require('../../plugins/custom/v1/plugin_pb');
goog.object.extend(proto, plugins_custom_v1_plugin_pb);
var plugins_databricks_v1_plugin_pb = require('../../plugins/databricks/v1/plugin_pb');
goog.object.extend(proto, plugins_databricks_v1_plugin_pb);
var plugins_dynamodb_v1_plugin_pb = require('../../plugins/dynamodb/v1/plugin_pb');
goog.object.extend(proto, plugins_dynamodb_v1_plugin_pb);
var plugins_email_v1_plugin_pb = require('../../plugins/email/v1/plugin_pb');
goog.object.extend(proto, plugins_email_v1_plugin_pb);
var plugins_gcs_v1_plugin_pb = require('../../plugins/gcs/v1/plugin_pb');
goog.object.extend(proto, plugins_gcs_v1_plugin_pb);
var plugins_graphql_v1_plugin_pb = require('../../plugins/graphql/v1/plugin_pb');
goog.object.extend(proto, plugins_graphql_v1_plugin_pb);
var plugins_gsheets_v1_plugin_pb = require('../../plugins/gsheets/v1/plugin_pb');
goog.object.extend(proto, plugins_gsheets_v1_plugin_pb);
var plugins_javascript_v1_plugin_pb = require('../../plugins/javascript/v1/plugin_pb');
goog.object.extend(proto, plugins_javascript_v1_plugin_pb);
var plugins_kafka_v1_plugin_pb = require('../../plugins/kafka/v1/plugin_pb');
goog.object.extend(proto, plugins_kafka_v1_plugin_pb);
var plugins_kinesis_v1_plugin_pb = require('../../plugins/kinesis/v1/plugin_pb');
goog.object.extend(proto, plugins_kinesis_v1_plugin_pb);
var plugins_mariadb_v1_plugin_pb = require('../../plugins/mariadb/v1/plugin_pb');
goog.object.extend(proto, plugins_mariadb_v1_plugin_pb);
var plugins_mongodb_v1_plugin_pb = require('../../plugins/mongodb/v1/plugin_pb');
goog.object.extend(proto, plugins_mongodb_v1_plugin_pb);
var plugins_mssql_v1_plugin_pb = require('../../plugins/mssql/v1/plugin_pb');
goog.object.extend(proto, plugins_mssql_v1_plugin_pb);
var plugins_mysql_v1_plugin_pb = require('../../plugins/mysql/v1/plugin_pb');
goog.object.extend(proto, plugins_mysql_v1_plugin_pb);
var plugins_ocr_v1_plugin_pb = require('../../plugins/ocr/v1/plugin_pb');
goog.object.extend(proto, plugins_ocr_v1_plugin_pb);
var plugins_openai_v1_plugin_pb = require('../../plugins/openai/v1/plugin_pb');
goog.object.extend(proto, plugins_openai_v1_plugin_pb);
var plugins_oracledb_v1_plugin_pb = require('../../plugins/oracledb/v1/plugin_pb');
goog.object.extend(proto, plugins_oracledb_v1_plugin_pb);
var plugins_pinecone_v1_plugin_pb = require('../../plugins/pinecone/v1/plugin_pb');
goog.object.extend(proto, plugins_pinecone_v1_plugin_pb);
var plugins_postgresql_v1_plugin_pb = require('../../plugins/postgresql/v1/plugin_pb');
goog.object.extend(proto, plugins_postgresql_v1_plugin_pb);
var plugins_python_v1_plugin_pb = require('../../plugins/python/v1/plugin_pb');
goog.object.extend(proto, plugins_python_v1_plugin_pb);
var plugins_redis_v1_plugin_pb = require('../../plugins/redis/v1/plugin_pb');
goog.object.extend(proto, plugins_redis_v1_plugin_pb);
var plugins_redshift_v1_plugin_pb = require('../../plugins/redshift/v1/plugin_pb');
goog.object.extend(proto, plugins_redshift_v1_plugin_pb);
var plugins_restapi_v1_plugin_pb = require('../../plugins/restapi/v1/plugin_pb');
goog.object.extend(proto, plugins_restapi_v1_plugin_pb);
var plugins_restapiintegration_v1_plugin_pb = require('../../plugins/restapiintegration/v1/plugin_pb');
goog.object.extend(proto, plugins_restapiintegration_v1_plugin_pb);
var plugins_rockset_v1_plugin_pb = require('../../plugins/rockset/v1/plugin_pb');
goog.object.extend(proto, plugins_rockset_v1_plugin_pb);
var plugins_s3_v1_plugin_pb = require('../../plugins/s3/v1/plugin_pb');
goog.object.extend(proto, plugins_s3_v1_plugin_pb);
var plugins_salesforce_v1_plugin_pb = require('../../plugins/salesforce/v1/plugin_pb');
goog.object.extend(proto, plugins_salesforce_v1_plugin_pb);
var plugins_smtp_v1_plugin_pb = require('../../plugins/smtp/v1/plugin_pb');
goog.object.extend(proto, plugins_smtp_v1_plugin_pb);
var plugins_snowflake_v1_plugin_pb = require('../../plugins/snowflake/v1/plugin_pb');
goog.object.extend(proto, plugins_snowflake_v1_plugin_pb);
var plugins_workflow_v1_plugin_pb = require('../../plugins/workflow/v1/plugin_pb');
goog.object.extend(proto, plugins_workflow_v1_plugin_pb);
var superblocks_v1_options_pb = require('../../superblocks/v1/options_pb');
goog.object.extend(proto, superblocks_v1_options_pb);
var utils_v1_utils_pb = require('../../utils/v1/utils_pb');
goog.object.extend(proto, utils_v1_utils_pb);
var validate_validate_pb = require('../../validate/validate_pb');
goog.object.extend(proto, validate_validate_pb);
goog.exportSymbol('proto.api.v1.Api', null, global);
goog.exportSymbol('proto.api.v1.Authorization', null, global);
goog.exportSymbol('proto.api.v1.AuthorizationType', null, global);
goog.exportSymbol('proto.api.v1.Block', null, global);
goog.exportSymbol('proto.api.v1.Block.Break', null, global);
goog.exportSymbol('proto.api.v1.Block.Conditional', null, global);
goog.exportSymbol('proto.api.v1.Block.Conditional.Condition', null, global);
goog.exportSymbol('proto.api.v1.Block.ConfigCase', null, global);
goog.exportSymbol('proto.api.v1.Block.Loop', null, global);
goog.exportSymbol('proto.api.v1.Block.Loop.Type', null, global);
goog.exportSymbol('proto.api.v1.Block.Loop.Variables', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel.ConfigCase', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel.Dynamic', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel.Dynamic.Variables', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel.Static', null, global);
goog.exportSymbol('proto.api.v1.Block.Parallel.Wait', null, global);
goog.exportSymbol('proto.api.v1.Block.Return', null, global);
goog.exportSymbol('proto.api.v1.Block.Send', null, global);
goog.exportSymbol('proto.api.v1.Block.Stream', null, global);
goog.exportSymbol('proto.api.v1.Block.Stream.Options', null, global);
goog.exportSymbol('proto.api.v1.Block.Stream.Trigger', null, global);
goog.exportSymbol('proto.api.v1.Block.Stream.Variables', null, global);
goog.exportSymbol('proto.api.v1.Block.Throw', null, global);
goog.exportSymbol('proto.api.v1.Block.TryCatch', null, global);
goog.exportSymbol('proto.api.v1.Block.TryCatch.Variables', null, global);
goog.exportSymbol('proto.api.v1.Block.Wait', null, global);
goog.exportSymbol('proto.api.v1.Blocks', null, global);
goog.exportSymbol('proto.api.v1.Profiles', null, global);
goog.exportSymbol('proto.api.v1.Profiles.Modes', null, global);
goog.exportSymbol('proto.api.v1.Profiles.Modes.Settings', null, global);
goog.exportSymbol('proto.api.v1.Step', null, global);
goog.exportSymbol('proto.api.v1.Step.ConfigCase', null, global);
goog.exportSymbol('proto.api.v1.Trigger', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Application', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Application.Options', null, global);
goog.exportSymbol('proto.api.v1.Trigger.ConfigCase', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Job', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Job.Days', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Job.Interval', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Job.Options', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Workflow', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Workflow.Options', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Workflow.Parameters', null, global);
goog.exportSymbol('proto.api.v1.Trigger.Workflow.Parameters.QueryParam', null, global);
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
proto.api.v1.Api = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Api.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Api, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Api.displayName = 'proto.api.v1.Api';
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
proto.api.v1.Authorization = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Authorization, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Authorization.displayName = 'proto.api.v1.Authorization';
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
proto.api.v1.Profiles = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Profiles, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Profiles.displayName = 'proto.api.v1.Profiles';
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
proto.api.v1.Profiles.Modes = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Profiles.Modes, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Profiles.Modes.displayName = 'proto.api.v1.Profiles.Modes';
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
proto.api.v1.Profiles.Modes.Settings = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Profiles.Modes.Settings.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Profiles.Modes.Settings, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Profiles.Modes.Settings.displayName = 'proto.api.v1.Profiles.Modes.Settings';
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
proto.api.v1.Trigger = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.Trigger.oneofGroups_);
};
goog.inherits(proto.api.v1.Trigger, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.displayName = 'proto.api.v1.Trigger';
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
proto.api.v1.Trigger.Application = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Application, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Application.displayName = 'proto.api.v1.Trigger.Application';
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
proto.api.v1.Trigger.Application.Options = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Application.Options, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Application.Options.displayName = 'proto.api.v1.Trigger.Application.Options';
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
proto.api.v1.Trigger.Workflow = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Workflow, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Workflow.displayName = 'proto.api.v1.Trigger.Workflow';
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
proto.api.v1.Trigger.Workflow.Options = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Workflow.Options, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Workflow.Options.displayName = 'proto.api.v1.Trigger.Workflow.Options';
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
proto.api.v1.Trigger.Workflow.Parameters = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Workflow.Parameters, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Workflow.Parameters.displayName = 'proto.api.v1.Trigger.Workflow.Parameters';
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
proto.api.v1.Trigger.Workflow.Parameters.QueryParam = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Trigger.Workflow.Parameters.QueryParam.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Trigger.Workflow.Parameters.QueryParam, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Workflow.Parameters.QueryParam.displayName = 'proto.api.v1.Trigger.Workflow.Parameters.QueryParam';
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
proto.api.v1.Trigger.Job = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Job, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Job.displayName = 'proto.api.v1.Trigger.Job';
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
proto.api.v1.Trigger.Job.Options = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Job.Options, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Job.Options.displayName = 'proto.api.v1.Trigger.Job.Options';
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
proto.api.v1.Trigger.Job.Days = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Trigger.Job.Days, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Trigger.Job.Days.displayName = 'proto.api.v1.Trigger.Job.Days';
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
proto.api.v1.Blocks = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Blocks.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Blocks, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Blocks.displayName = 'proto.api.v1.Blocks';
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
proto.api.v1.Block = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.Block.oneofGroups_);
};
goog.inherits(proto.api.v1.Block, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.displayName = 'proto.api.v1.Block';
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
proto.api.v1.Block.Parallel = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.Block.Parallel.oneofGroups_);
};
goog.inherits(proto.api.v1.Block.Parallel, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Parallel.displayName = 'proto.api.v1.Block.Parallel';
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
proto.api.v1.Block.Parallel.Static = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Parallel.Static, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Parallel.Static.displayName = 'proto.api.v1.Block.Parallel.Static';
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
proto.api.v1.Block.Parallel.Dynamic = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Block.Parallel.Dynamic.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Block.Parallel.Dynamic, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Parallel.Dynamic.displayName = 'proto.api.v1.Block.Parallel.Dynamic';
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
proto.api.v1.Block.Parallel.Dynamic.Variables = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Parallel.Dynamic.Variables, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Parallel.Dynamic.Variables.displayName = 'proto.api.v1.Block.Parallel.Dynamic.Variables';
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
proto.api.v1.Block.Conditional = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Block.Conditional.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Block.Conditional, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Conditional.displayName = 'proto.api.v1.Block.Conditional';
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
proto.api.v1.Block.Conditional.Condition = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Block.Conditional.Condition.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Block.Conditional.Condition, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Conditional.Condition.displayName = 'proto.api.v1.Block.Conditional.Condition';
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
proto.api.v1.Block.Loop = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.api.v1.Block.Loop.repeatedFields_, null);
};
goog.inherits(proto.api.v1.Block.Loop, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Loop.displayName = 'proto.api.v1.Block.Loop';
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
proto.api.v1.Block.Loop.Variables = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Loop.Variables, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Loop.Variables.displayName = 'proto.api.v1.Block.Loop.Variables';
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
proto.api.v1.Block.TryCatch = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.TryCatch, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.TryCatch.displayName = 'proto.api.v1.Block.TryCatch';
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
proto.api.v1.Block.TryCatch.Variables = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.TryCatch.Variables, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.TryCatch.Variables.displayName = 'proto.api.v1.Block.TryCatch.Variables';
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
proto.api.v1.Block.Break = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Break, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Break.displayName = 'proto.api.v1.Block.Break';
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
proto.api.v1.Block.Return = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Return, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Return.displayName = 'proto.api.v1.Block.Return';
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
proto.api.v1.Block.Throw = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Throw, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Throw.displayName = 'proto.api.v1.Block.Throw';
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
proto.api.v1.Block.Wait = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Wait, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Wait.displayName = 'proto.api.v1.Block.Wait';
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
proto.api.v1.Block.Stream = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Stream, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Stream.displayName = 'proto.api.v1.Block.Stream';
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
proto.api.v1.Block.Stream.Variables = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Stream.Variables, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Stream.Variables.displayName = 'proto.api.v1.Block.Stream.Variables';
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
proto.api.v1.Block.Stream.Options = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Stream.Options, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Stream.Options.displayName = 'proto.api.v1.Block.Stream.Options';
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
proto.api.v1.Block.Stream.Trigger = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Stream.Trigger, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Stream.Trigger.displayName = 'proto.api.v1.Block.Stream.Trigger';
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
proto.api.v1.Block.Send = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.api.v1.Block.Send, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Block.Send.displayName = 'proto.api.v1.Block.Send';
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
proto.api.v1.Step = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.api.v1.Step.oneofGroups_);
};
goog.inherits(proto.api.v1.Step, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.api.v1.Step.displayName = 'proto.api.v1.Step';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Api.repeatedFields_ = [2];



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
proto.api.v1.Api.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Api.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Api} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Api.toObject = function(includeInstance, msg) {
  var f, obj = {
metadata: (f = msg.getMetadata()) && common_v1_common_pb.Metadata.toObject(includeInstance, f),
blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.api.v1.Block.toObject, includeInstance),
trigger: (f = msg.getTrigger()) && proto.api.v1.Trigger.toObject(includeInstance, f),
signature: (f = msg.getSignature()) && utils_v1_utils_pb.Signature.toObject(includeInstance, f),
authorization: (f = msg.getAuthorization()) && proto.api.v1.Authorization.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Api}
 */
proto.api.v1.Api.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Api;
  return proto.api.v1.Api.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Api} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Api}
 */
proto.api.v1.Api.deserializeBinaryFromReader = function(msg, reader) {
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
      var value = new proto.api.v1.Block;
      reader.readMessage(value,proto.api.v1.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
      break;
    case 3:
      var value = new proto.api.v1.Trigger;
      reader.readMessage(value,proto.api.v1.Trigger.deserializeBinaryFromReader);
      msg.setTrigger(value);
      break;
    case 4:
      var value = new utils_v1_utils_pb.Signature;
      reader.readMessage(value,utils_v1_utils_pb.Signature.deserializeBinaryFromReader);
      msg.setSignature(value);
      break;
    case 5:
      var value = new proto.api.v1.Authorization;
      reader.readMessage(value,proto.api.v1.Authorization.deserializeBinaryFromReader);
      msg.setAuthorization(value);
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
proto.api.v1.Api.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Api.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Api} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Api.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_v1_common_pb.Metadata.serializeBinaryToWriter
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.api.v1.Block.serializeBinaryToWriter
    );
  }
  f = message.getTrigger();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Trigger.serializeBinaryToWriter
    );
  }
  f = message.getSignature();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      utils_v1_utils_pb.Signature.serializeBinaryToWriter
    );
  }
  f = message.getAuthorization();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.api.v1.Authorization.serializeBinaryToWriter
    );
  }
};


/**
 * optional common.v1.Metadata metadata = 1;
 * @return {?proto.common.v1.Metadata}
 */
proto.api.v1.Api.prototype.getMetadata = function() {
  return /** @type{?proto.common.v1.Metadata} */ (
    jspb.Message.getWrapperField(this, common_v1_common_pb.Metadata, 1));
};


/**
 * @param {?proto.common.v1.Metadata|undefined} value
 * @return {!proto.api.v1.Api} returns this
*/
proto.api.v1.Api.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Api} returns this
 */
proto.api.v1.Api.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Api.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated Block blocks = 2;
 * @return {!Array<!proto.api.v1.Block>}
 */
proto.api.v1.Api.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.api.v1.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block, 2));
};


/**
 * @param {!Array<!proto.api.v1.Block>} value
 * @return {!proto.api.v1.Api} returns this
*/
proto.api.v1.Api.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.api.v1.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Api.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.api.v1.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Api} returns this
 */
proto.api.v1.Api.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};


/**
 * optional Trigger trigger = 3;
 * @return {?proto.api.v1.Trigger}
 */
proto.api.v1.Api.prototype.getTrigger = function() {
  return /** @type{?proto.api.v1.Trigger} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger, 3));
};


/**
 * @param {?proto.api.v1.Trigger|undefined} value
 * @return {!proto.api.v1.Api} returns this
*/
proto.api.v1.Api.prototype.setTrigger = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Api} returns this
 */
proto.api.v1.Api.prototype.clearTrigger = function() {
  return this.setTrigger(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Api.prototype.hasTrigger = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional utils.v1.Signature signature = 4;
 * @return {?proto.utils.v1.Signature}
 */
proto.api.v1.Api.prototype.getSignature = function() {
  return /** @type{?proto.utils.v1.Signature} */ (
    jspb.Message.getWrapperField(this, utils_v1_utils_pb.Signature, 4));
};


/**
 * @param {?proto.utils.v1.Signature|undefined} value
 * @return {!proto.api.v1.Api} returns this
*/
proto.api.v1.Api.prototype.setSignature = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Api} returns this
 */
proto.api.v1.Api.prototype.clearSignature = function() {
  return this.setSignature(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Api.prototype.hasSignature = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Authorization authorization = 5;
 * @return {?proto.api.v1.Authorization}
 */
proto.api.v1.Api.prototype.getAuthorization = function() {
  return /** @type{?proto.api.v1.Authorization} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Authorization, 5));
};


/**
 * @param {?proto.api.v1.Authorization|undefined} value
 * @return {!proto.api.v1.Api} returns this
*/
proto.api.v1.Api.prototype.setAuthorization = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Api} returns this
 */
proto.api.v1.Api.prototype.clearAuthorization = function() {
  return this.setAuthorization(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Api.prototype.hasAuthorization = function() {
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
proto.api.v1.Authorization.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Authorization.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Authorization} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Authorization.toObject = function(includeInstance, msg) {
  var f, obj = {
type: jspb.Message.getFieldWithDefault(msg, 1, 0),
expression: (f = jspb.Message.getField(msg, 2)) == null ? undefined : f
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
 * @return {!proto.api.v1.Authorization}
 */
proto.api.v1.Authorization.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Authorization;
  return proto.api.v1.Authorization.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Authorization} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Authorization}
 */
proto.api.v1.Authorization.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.api.v1.AuthorizationType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExpression(value);
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
proto.api.v1.Authorization.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Authorization.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Authorization} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Authorization.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
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
};


/**
 * optional AuthorizationType type = 1;
 * @return {!proto.api.v1.AuthorizationType}
 */
proto.api.v1.Authorization.prototype.getType = function() {
  return /** @type {!proto.api.v1.AuthorizationType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.api.v1.AuthorizationType} value
 * @return {!proto.api.v1.Authorization} returns this
 */
proto.api.v1.Authorization.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string expression = 2;
 * @return {string}
 */
proto.api.v1.Authorization.prototype.getExpression = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Authorization} returns this
 */
proto.api.v1.Authorization.prototype.setExpression = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Authorization} returns this
 */
proto.api.v1.Authorization.prototype.clearExpression = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Authorization.prototype.hasExpression = function() {
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
proto.api.v1.Profiles.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Profiles.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Profiles} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.toObject = function(includeInstance, msg) {
  var f, obj = {
modes: (f = msg.getModes()) && proto.api.v1.Profiles.Modes.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Profiles}
 */
proto.api.v1.Profiles.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Profiles;
  return proto.api.v1.Profiles.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Profiles} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Profiles}
 */
proto.api.v1.Profiles.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Profiles.Modes;
      reader.readMessage(value,proto.api.v1.Profiles.Modes.deserializeBinaryFromReader);
      msg.setModes(value);
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
proto.api.v1.Profiles.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Profiles.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Profiles} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getModes();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Profiles.Modes.serializeBinaryToWriter
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
proto.api.v1.Profiles.Modes.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Profiles.Modes.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Profiles.Modes} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.Modes.toObject = function(includeInstance, msg) {
  var f, obj = {
editor: (f = msg.getEditor()) && proto.api.v1.Profiles.Modes.Settings.toObject(includeInstance, f),
preview: (f = msg.getPreview()) && proto.api.v1.Profiles.Modes.Settings.toObject(includeInstance, f),
deployed: (f = msg.getDeployed()) && proto.api.v1.Profiles.Modes.Settings.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Profiles.Modes}
 */
proto.api.v1.Profiles.Modes.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Profiles.Modes;
  return proto.api.v1.Profiles.Modes.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Profiles.Modes} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Profiles.Modes}
 */
proto.api.v1.Profiles.Modes.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Profiles.Modes.Settings;
      reader.readMessage(value,proto.api.v1.Profiles.Modes.Settings.deserializeBinaryFromReader);
      msg.setEditor(value);
      break;
    case 2:
      var value = new proto.api.v1.Profiles.Modes.Settings;
      reader.readMessage(value,proto.api.v1.Profiles.Modes.Settings.deserializeBinaryFromReader);
      msg.setPreview(value);
      break;
    case 3:
      var value = new proto.api.v1.Profiles.Modes.Settings;
      reader.readMessage(value,proto.api.v1.Profiles.Modes.Settings.deserializeBinaryFromReader);
      msg.setDeployed(value);
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
proto.api.v1.Profiles.Modes.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Profiles.Modes.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Profiles.Modes} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.Modes.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEditor();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Profiles.Modes.Settings.serializeBinaryToWriter
    );
  }
  f = message.getPreview();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Profiles.Modes.Settings.serializeBinaryToWriter
    );
  }
  f = message.getDeployed();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Profiles.Modes.Settings.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Profiles.Modes.Settings.repeatedFields_ = [2];



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
proto.api.v1.Profiles.Modes.Settings.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Profiles.Modes.Settings.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Profiles.Modes.Settings} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.Modes.Settings.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_default: jspb.Message.getFieldWithDefault(msg, 1, ""),
availableList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
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
 * @return {!proto.api.v1.Profiles.Modes.Settings}
 */
proto.api.v1.Profiles.Modes.Settings.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Profiles.Modes.Settings;
  return proto.api.v1.Profiles.Modes.Settings.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Profiles.Modes.Settings} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Profiles.Modes.Settings}
 */
proto.api.v1.Profiles.Modes.Settings.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefault(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addAvailable(value);
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
proto.api.v1.Profiles.Modes.Settings.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Profiles.Modes.Settings.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Profiles.Modes.Settings} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Profiles.Modes.Settings.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDefault();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAvailableList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional string default = 1;
 * @return {string}
 */
proto.api.v1.Profiles.Modes.Settings.prototype.getDefault = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Profiles.Modes.Settings} returns this
 */
proto.api.v1.Profiles.Modes.Settings.prototype.setDefault = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string available = 2;
 * @return {!Array<string>}
 */
proto.api.v1.Profiles.Modes.Settings.prototype.getAvailableList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.api.v1.Profiles.Modes.Settings} returns this
 */
proto.api.v1.Profiles.Modes.Settings.prototype.setAvailableList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Profiles.Modes.Settings} returns this
 */
proto.api.v1.Profiles.Modes.Settings.prototype.addAvailable = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Profiles.Modes.Settings} returns this
 */
proto.api.v1.Profiles.Modes.Settings.prototype.clearAvailableList = function() {
  return this.setAvailableList([]);
};


/**
 * optional Settings editor = 1;
 * @return {?proto.api.v1.Profiles.Modes.Settings}
 */
proto.api.v1.Profiles.Modes.prototype.getEditor = function() {
  return /** @type{?proto.api.v1.Profiles.Modes.Settings} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles.Modes.Settings, 1));
};


/**
 * @param {?proto.api.v1.Profiles.Modes.Settings|undefined} value
 * @return {!proto.api.v1.Profiles.Modes} returns this
*/
proto.api.v1.Profiles.Modes.prototype.setEditor = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Profiles.Modes} returns this
 */
proto.api.v1.Profiles.Modes.prototype.clearEditor = function() {
  return this.setEditor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Profiles.Modes.prototype.hasEditor = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Settings preview = 2;
 * @return {?proto.api.v1.Profiles.Modes.Settings}
 */
proto.api.v1.Profiles.Modes.prototype.getPreview = function() {
  return /** @type{?proto.api.v1.Profiles.Modes.Settings} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles.Modes.Settings, 2));
};


/**
 * @param {?proto.api.v1.Profiles.Modes.Settings|undefined} value
 * @return {!proto.api.v1.Profiles.Modes} returns this
*/
proto.api.v1.Profiles.Modes.prototype.setPreview = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Profiles.Modes} returns this
 */
proto.api.v1.Profiles.Modes.prototype.clearPreview = function() {
  return this.setPreview(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Profiles.Modes.prototype.hasPreview = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Settings deployed = 3;
 * @return {?proto.api.v1.Profiles.Modes.Settings}
 */
proto.api.v1.Profiles.Modes.prototype.getDeployed = function() {
  return /** @type{?proto.api.v1.Profiles.Modes.Settings} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles.Modes.Settings, 3));
};


/**
 * @param {?proto.api.v1.Profiles.Modes.Settings|undefined} value
 * @return {!proto.api.v1.Profiles.Modes} returns this
*/
proto.api.v1.Profiles.Modes.prototype.setDeployed = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Profiles.Modes} returns this
 */
proto.api.v1.Profiles.Modes.prototype.clearDeployed = function() {
  return this.setDeployed(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Profiles.Modes.prototype.hasDeployed = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Modes modes = 1;
 * @return {?proto.api.v1.Profiles.Modes}
 */
proto.api.v1.Profiles.prototype.getModes = function() {
  return /** @type{?proto.api.v1.Profiles.Modes} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles.Modes, 1));
};


/**
 * @param {?proto.api.v1.Profiles.Modes|undefined} value
 * @return {!proto.api.v1.Profiles} returns this
*/
proto.api.v1.Profiles.prototype.setModes = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Profiles} returns this
 */
proto.api.v1.Profiles.prototype.clearModes = function() {
  return this.setModes(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Profiles.prototype.hasModes = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.Trigger.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.api.v1.Trigger.ConfigCase = {
  CONFIG_NOT_SET: 0,
  APPLICATION: 1,
  WORKFLOW: 2,
  JOB: 3
};

/**
 * @return {proto.api.v1.Trigger.ConfigCase}
 */
proto.api.v1.Trigger.prototype.getConfigCase = function() {
  return /** @type {proto.api.v1.Trigger.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.Trigger.oneofGroups_[0]));
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
proto.api.v1.Trigger.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.toObject = function(includeInstance, msg) {
  var f, obj = {
application: (f = msg.getApplication()) && proto.api.v1.Trigger.Application.toObject(includeInstance, f),
workflow: (f = msg.getWorkflow()) && proto.api.v1.Trigger.Workflow.toObject(includeInstance, f),
job: (f = msg.getJob()) && proto.api.v1.Trigger.Job.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Trigger}
 */
proto.api.v1.Trigger.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger;
  return proto.api.v1.Trigger.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger}
 */
proto.api.v1.Trigger.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Trigger.Application;
      reader.readMessage(value,proto.api.v1.Trigger.Application.deserializeBinaryFromReader);
      msg.setApplication(value);
      break;
    case 2:
      var value = new proto.api.v1.Trigger.Workflow;
      reader.readMessage(value,proto.api.v1.Trigger.Workflow.deserializeBinaryFromReader);
      msg.setWorkflow(value);
      break;
    case 3:
      var value = new proto.api.v1.Trigger.Job;
      reader.readMessage(value,proto.api.v1.Trigger.Job.deserializeBinaryFromReader);
      msg.setJob(value);
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
proto.api.v1.Trigger.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApplication();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Trigger.Application.serializeBinaryToWriter
    );
  }
  f = message.getWorkflow();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Trigger.Workflow.serializeBinaryToWriter
    );
  }
  f = message.getJob();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Trigger.Job.serializeBinaryToWriter
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
proto.api.v1.Trigger.Application.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Application.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Application} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Application.toObject = function(includeInstance, msg) {
  var f, obj = {
options: (f = msg.getOptions()) && proto.api.v1.Trigger.Application.Options.toObject(includeInstance, f),
id: jspb.Message.getFieldWithDefault(msg, 2, ""),
pageId: (f = jspb.Message.getField(msg, 3)) == null ? undefined : f
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
 * @return {!proto.api.v1.Trigger.Application}
 */
proto.api.v1.Trigger.Application.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Application;
  return proto.api.v1.Trigger.Application.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Application} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Application}
 */
proto.api.v1.Trigger.Application.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Trigger.Application.Options;
      reader.readMessage(value,proto.api.v1.Trigger.Application.Options.deserializeBinaryFromReader);
      msg.setOptions(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPageId(value);
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
proto.api.v1.Trigger.Application.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Application.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Application} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Application.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Trigger.Application.Options.serializeBinaryToWriter
    );
  }
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
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
proto.api.v1.Trigger.Application.Options.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Application.Options.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Application.Options} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Application.Options.toObject = function(includeInstance, msg) {
  var f, obj = {
executeOnPageLoad: (f = jspb.Message.getBooleanField(msg, 1)) == null ? undefined : f
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
 * @return {!proto.api.v1.Trigger.Application.Options}
 */
proto.api.v1.Trigger.Application.Options.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Application.Options;
  return proto.api.v1.Trigger.Application.Options.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Application.Options} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Application.Options}
 */
proto.api.v1.Trigger.Application.Options.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setExecuteOnPageLoad(value);
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
proto.api.v1.Trigger.Application.Options.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Application.Options.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Application.Options} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Application.Options.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {boolean} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool execute_on_page_load = 1;
 * @return {boolean}
 */
proto.api.v1.Trigger.Application.Options.prototype.getExecuteOnPageLoad = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Application.Options} returns this
 */
proto.api.v1.Trigger.Application.Options.prototype.setExecuteOnPageLoad = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Trigger.Application.Options} returns this
 */
proto.api.v1.Trigger.Application.Options.prototype.clearExecuteOnPageLoad = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Application.Options.prototype.hasExecuteOnPageLoad = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Options options = 1;
 * @return {?proto.api.v1.Trigger.Application.Options}
 */
proto.api.v1.Trigger.Application.prototype.getOptions = function() {
  return /** @type{?proto.api.v1.Trigger.Application.Options} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Application.Options, 1));
};


/**
 * @param {?proto.api.v1.Trigger.Application.Options|undefined} value
 * @return {!proto.api.v1.Trigger.Application} returns this
*/
proto.api.v1.Trigger.Application.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Application} returns this
 */
proto.api.v1.Trigger.Application.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Application.prototype.hasOptions = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string id = 2;
 * @return {string}
 */
proto.api.v1.Trigger.Application.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Trigger.Application} returns this
 */
proto.api.v1.Trigger.Application.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string page_id = 3;
 * @return {string}
 */
proto.api.v1.Trigger.Application.prototype.getPageId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Trigger.Application} returns this
 */
proto.api.v1.Trigger.Application.prototype.setPageId = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Trigger.Application} returns this
 */
proto.api.v1.Trigger.Application.prototype.clearPageId = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Application.prototype.hasPageId = function() {
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
proto.api.v1.Trigger.Workflow.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Workflow.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Workflow} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.toObject = function(includeInstance, msg) {
  var f, obj = {
options: (f = msg.getOptions()) && proto.api.v1.Trigger.Workflow.Options.toObject(includeInstance, f),
parameters: (f = msg.getParameters()) && proto.api.v1.Trigger.Workflow.Parameters.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Trigger.Workflow}
 */
proto.api.v1.Trigger.Workflow.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Workflow;
  return proto.api.v1.Trigger.Workflow.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Workflow} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Workflow}
 */
proto.api.v1.Trigger.Workflow.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Trigger.Workflow.Options;
      reader.readMessage(value,proto.api.v1.Trigger.Workflow.Options.deserializeBinaryFromReader);
      msg.setOptions(value);
      break;
    case 2:
      var value = new proto.api.v1.Trigger.Workflow.Parameters;
      reader.readMessage(value,proto.api.v1.Trigger.Workflow.Parameters.deserializeBinaryFromReader);
      msg.setParameters(value);
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
proto.api.v1.Trigger.Workflow.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Workflow.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Workflow} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Trigger.Workflow.Options.serializeBinaryToWriter
    );
  }
  f = message.getParameters();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Trigger.Workflow.Parameters.serializeBinaryToWriter
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
proto.api.v1.Trigger.Workflow.Options.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Workflow.Options.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Workflow.Options} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Options.toObject = function(includeInstance, msg) {
  var f, obj = {
profiles: (f = msg.getProfiles()) && proto.api.v1.Profiles.toObject(includeInstance, f),
deployedcommitid: (f = jspb.Message.getField(msg, 2)) == null ? undefined : f
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
 * @return {!proto.api.v1.Trigger.Workflow.Options}
 */
proto.api.v1.Trigger.Workflow.Options.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Workflow.Options;
  return proto.api.v1.Trigger.Workflow.Options.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Workflow.Options} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Workflow.Options}
 */
proto.api.v1.Trigger.Workflow.Options.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Profiles;
      reader.readMessage(value,proto.api.v1.Profiles.deserializeBinaryFromReader);
      msg.setProfiles(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeployedcommitid(value);
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
proto.api.v1.Trigger.Workflow.Options.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Workflow.Options.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Workflow.Options} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Options.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfiles();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Profiles.serializeBinaryToWriter
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
 * optional Profiles profiles = 1;
 * @return {?proto.api.v1.Profiles}
 */
proto.api.v1.Trigger.Workflow.Options.prototype.getProfiles = function() {
  return /** @type{?proto.api.v1.Profiles} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles, 1));
};


/**
 * @param {?proto.api.v1.Profiles|undefined} value
 * @return {!proto.api.v1.Trigger.Workflow.Options} returns this
*/
proto.api.v1.Trigger.Workflow.Options.prototype.setProfiles = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Workflow.Options} returns this
 */
proto.api.v1.Trigger.Workflow.Options.prototype.clearProfiles = function() {
  return this.setProfiles(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Workflow.Options.prototype.hasProfiles = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string deployedCommitId = 2;
 * @return {string}
 */
proto.api.v1.Trigger.Workflow.Options.prototype.getDeployedcommitid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Trigger.Workflow.Options} returns this
 */
proto.api.v1.Trigger.Workflow.Options.prototype.setDeployedcommitid = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Trigger.Workflow.Options} returns this
 */
proto.api.v1.Trigger.Workflow.Options.prototype.clearDeployedcommitid = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Workflow.Options.prototype.hasDeployedcommitid = function() {
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
proto.api.v1.Trigger.Workflow.Parameters.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Workflow.Parameters.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Workflow.Parameters} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Parameters.toObject = function(includeInstance, msg) {
  var f, obj = {
queryMap: (f = msg.getQueryMap()) ? f.toObject(includeInstance, proto.api.v1.Trigger.Workflow.Parameters.QueryParam.toObject) : [],
bodyMap: (f = msg.getBodyMap()) ? f.toObject(includeInstance, proto.google.protobuf.Value.toObject) : []
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
 * @return {!proto.api.v1.Trigger.Workflow.Parameters}
 */
proto.api.v1.Trigger.Workflow.Parameters.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Workflow.Parameters;
  return proto.api.v1.Trigger.Workflow.Parameters.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Workflow.Parameters} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Workflow.Parameters}
 */
proto.api.v1.Trigger.Workflow.Parameters.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getQueryMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.api.v1.Trigger.Workflow.Parameters.QueryParam.deserializeBinaryFromReader, "", new proto.api.v1.Trigger.Workflow.Parameters.QueryParam());
         });
      break;
    case 2:
      var value = msg.getBodyMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.google.protobuf.Value.deserializeBinaryFromReader, "", new proto.google.protobuf.Value());
         });
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
proto.api.v1.Trigger.Workflow.Parameters.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Workflow.Parameters.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Workflow.Parameters} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Parameters.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getQueryMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.api.v1.Trigger.Workflow.Parameters.QueryParam.serializeBinaryToWriter);
  }
  f = message.getBodyMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.google.protobuf.Value.serializeBinaryToWriter);
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.repeatedFields_ = [1];



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
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Workflow.Parameters.QueryParam.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.toObject = function(includeInstance, msg) {
  var f, obj = {
valuesList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
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
 * @return {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam}
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Workflow.Parameters.QueryParam;
  return proto.api.v1.Trigger.Workflow.Parameters.QueryParam.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam}
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addValues(value);
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
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Workflow.Parameters.QueryParam.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValuesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string values = 1;
 * @return {!Array<string>}
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.getValuesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} returns this
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.setValuesList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} returns this
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.addValues = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Trigger.Workflow.Parameters.QueryParam} returns this
 */
proto.api.v1.Trigger.Workflow.Parameters.QueryParam.prototype.clearValuesList = function() {
  return this.setValuesList([]);
};


/**
 * map<string, QueryParam> query = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.api.v1.Trigger.Workflow.Parameters.QueryParam>}
 */
proto.api.v1.Trigger.Workflow.Parameters.prototype.getQueryMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.api.v1.Trigger.Workflow.Parameters.QueryParam>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.api.v1.Trigger.Workflow.Parameters.QueryParam));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.api.v1.Trigger.Workflow.Parameters} returns this
 */
proto.api.v1.Trigger.Workflow.Parameters.prototype.clearQueryMap = function() {
  this.getQueryMap().clear();
  return this;
};


/**
 * map<string, google.protobuf.Value> body = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.google.protobuf.Value>}
 */
proto.api.v1.Trigger.Workflow.Parameters.prototype.getBodyMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.google.protobuf.Value>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.google.protobuf.Value));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.api.v1.Trigger.Workflow.Parameters} returns this
 */
proto.api.v1.Trigger.Workflow.Parameters.prototype.clearBodyMap = function() {
  this.getBodyMap().clear();
  return this;
};


/**
 * optional Options options = 1;
 * @return {?proto.api.v1.Trigger.Workflow.Options}
 */
proto.api.v1.Trigger.Workflow.prototype.getOptions = function() {
  return /** @type{?proto.api.v1.Trigger.Workflow.Options} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Workflow.Options, 1));
};


/**
 * @param {?proto.api.v1.Trigger.Workflow.Options|undefined} value
 * @return {!proto.api.v1.Trigger.Workflow} returns this
*/
proto.api.v1.Trigger.Workflow.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Workflow} returns this
 */
proto.api.v1.Trigger.Workflow.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Workflow.prototype.hasOptions = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Parameters parameters = 2;
 * @return {?proto.api.v1.Trigger.Workflow.Parameters}
 */
proto.api.v1.Trigger.Workflow.prototype.getParameters = function() {
  return /** @type{?proto.api.v1.Trigger.Workflow.Parameters} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Workflow.Parameters, 2));
};


/**
 * @param {?proto.api.v1.Trigger.Workflow.Parameters|undefined} value
 * @return {!proto.api.v1.Trigger.Workflow} returns this
*/
proto.api.v1.Trigger.Workflow.prototype.setParameters = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Workflow} returns this
 */
proto.api.v1.Trigger.Workflow.prototype.clearParameters = function() {
  return this.setParameters(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Workflow.prototype.hasParameters = function() {
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
proto.api.v1.Trigger.Job.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Job.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Job} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.toObject = function(includeInstance, msg) {
  var f, obj = {
options: (f = msg.getOptions()) && proto.api.v1.Trigger.Job.Options.toObject(includeInstance, f),
frequency: jspb.Message.getFieldWithDefault(msg, 2, 0),
interval: jspb.Message.getFieldWithDefault(msg, 3, 0),
dayOfMonth: jspb.Message.getFieldWithDefault(msg, 4, 0),
days: (f = msg.getDays()) && proto.api.v1.Trigger.Job.Days.toObject(includeInstance, f),
time: (f = msg.getTime()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
timezoneLocale: jspb.Message.getFieldWithDefault(msg, 8, "")
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
 * @return {!proto.api.v1.Trigger.Job}
 */
proto.api.v1.Trigger.Job.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Job;
  return proto.api.v1.Trigger.Job.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Job} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Job}
 */
proto.api.v1.Trigger.Job.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Trigger.Job.Options;
      reader.readMessage(value,proto.api.v1.Trigger.Job.Options.deserializeBinaryFromReader);
      msg.setOptions(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setFrequency(value);
      break;
    case 3:
      var value = /** @type {!proto.api.v1.Trigger.Job.Interval} */ (reader.readEnum());
      msg.setInterval(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDayOfMonth(value);
      break;
    case 5:
      var value = new proto.api.v1.Trigger.Job.Days;
      reader.readMessage(value,proto.api.v1.Trigger.Job.Days.deserializeBinaryFromReader);
      msg.setDays(value);
      break;
    case 6:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setTime(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setTimezoneLocale(value);
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
proto.api.v1.Trigger.Job.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Job.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Job} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Trigger.Job.Options.serializeBinaryToWriter
    );
  }
  f = message.getFrequency();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getInterval();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getDayOfMonth();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getDays();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.api.v1.Trigger.Job.Days.serializeBinaryToWriter
    );
  }
  f = message.getTime();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getTimezoneLocale();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.api.v1.Trigger.Job.Interval = {
  INTERVAL_UNSPECIFIED: 0,
  INTERVAL_MINUTE: 1,
  INTERVAL_HOUR: 2,
  INTERVAL_DAY: 3,
  INTERVAL_WEEK: 4,
  INTERVAL_MONTH: 5
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
proto.api.v1.Trigger.Job.Options.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Job.Options.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Job.Options} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.Options.toObject = function(includeInstance, msg) {
  var f, obj = {
profiles: (f = msg.getProfiles()) && proto.api.v1.Profiles.toObject(includeInstance, f),
sendEmailOnFailure: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
deployedcommitid: (f = jspb.Message.getField(msg, 3)) == null ? undefined : f
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
 * @return {!proto.api.v1.Trigger.Job.Options}
 */
proto.api.v1.Trigger.Job.Options.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Job.Options;
  return proto.api.v1.Trigger.Job.Options.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Job.Options} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Job.Options}
 */
proto.api.v1.Trigger.Job.Options.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Profiles;
      reader.readMessage(value,proto.api.v1.Profiles.deserializeBinaryFromReader);
      msg.setProfiles(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSendEmailOnFailure(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeployedcommitid(value);
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
proto.api.v1.Trigger.Job.Options.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Job.Options.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Job.Options} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.Options.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfiles();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Profiles.serializeBinaryToWriter
    );
  }
  f = message.getSendEmailOnFailure();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional Profiles profiles = 1;
 * @return {?proto.api.v1.Profiles}
 */
proto.api.v1.Trigger.Job.Options.prototype.getProfiles = function() {
  return /** @type{?proto.api.v1.Profiles} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Profiles, 1));
};


/**
 * @param {?proto.api.v1.Profiles|undefined} value
 * @return {!proto.api.v1.Trigger.Job.Options} returns this
*/
proto.api.v1.Trigger.Job.Options.prototype.setProfiles = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Job.Options} returns this
 */
proto.api.v1.Trigger.Job.Options.prototype.clearProfiles = function() {
  return this.setProfiles(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Options.prototype.hasProfiles = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool send_email_on_failure = 2;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Options.prototype.getSendEmailOnFailure = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Options} returns this
 */
proto.api.v1.Trigger.Job.Options.prototype.setSendEmailOnFailure = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional string deployedCommitId = 3;
 * @return {string}
 */
proto.api.v1.Trigger.Job.Options.prototype.getDeployedcommitid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Trigger.Job.Options} returns this
 */
proto.api.v1.Trigger.Job.Options.prototype.setDeployedcommitid = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Trigger.Job.Options} returns this
 */
proto.api.v1.Trigger.Job.Options.prototype.clearDeployedcommitid = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Options.prototype.hasDeployedcommitid = function() {
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
proto.api.v1.Trigger.Job.Days.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Trigger.Job.Days.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Trigger.Job.Days} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.Days.toObject = function(includeInstance, msg) {
  var f, obj = {
sunday: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
monday: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
tuesday: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
wednesday: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
thursday: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
friday: jspb.Message.getBooleanFieldWithDefault(msg, 6, false),
saturday: jspb.Message.getBooleanFieldWithDefault(msg, 7, false)
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
 * @return {!proto.api.v1.Trigger.Job.Days}
 */
proto.api.v1.Trigger.Job.Days.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Trigger.Job.Days;
  return proto.api.v1.Trigger.Job.Days.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Trigger.Job.Days} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Trigger.Job.Days}
 */
proto.api.v1.Trigger.Job.Days.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSunday(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setMonday(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setTuesday(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setWednesday(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setThursday(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setFriday(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSaturday(value);
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
proto.api.v1.Trigger.Job.Days.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Trigger.Job.Days.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Trigger.Job.Days} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Trigger.Job.Days.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSunday();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getMonday();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getTuesday();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getWednesday();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getThursday();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getFriday();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
  f = message.getSaturday();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
};


/**
 * optional bool sunday = 1;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getSunday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setSunday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool monday = 2;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getMonday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setMonday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional bool tuesday = 3;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getTuesday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setTuesday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional bool wednesday = 4;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getWednesday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setWednesday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional bool thursday = 5;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getThursday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setThursday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional bool friday = 6;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getFriday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 6, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setFriday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 6, value);
};


/**
 * optional bool saturday = 7;
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.Days.prototype.getSaturday = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 7, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Trigger.Job.Days} returns this
 */
proto.api.v1.Trigger.Job.Days.prototype.setSaturday = function(value) {
  return jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional Options options = 1;
 * @return {?proto.api.v1.Trigger.Job.Options}
 */
proto.api.v1.Trigger.Job.prototype.getOptions = function() {
  return /** @type{?proto.api.v1.Trigger.Job.Options} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Job.Options, 1));
};


/**
 * @param {?proto.api.v1.Trigger.Job.Options|undefined} value
 * @return {!proto.api.v1.Trigger.Job} returns this
*/
proto.api.v1.Trigger.Job.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.prototype.hasOptions = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional int32 frequency = 2;
 * @return {number}
 */
proto.api.v1.Trigger.Job.prototype.getFrequency = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.setFrequency = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional Interval interval = 3;
 * @return {!proto.api.v1.Trigger.Job.Interval}
 */
proto.api.v1.Trigger.Job.prototype.getInterval = function() {
  return /** @type {!proto.api.v1.Trigger.Job.Interval} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.api.v1.Trigger.Job.Interval} value
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.setInterval = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional int32 day_of_month = 4;
 * @return {number}
 */
proto.api.v1.Trigger.Job.prototype.getDayOfMonth = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.setDayOfMonth = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional Days days = 5;
 * @return {?proto.api.v1.Trigger.Job.Days}
 */
proto.api.v1.Trigger.Job.prototype.getDays = function() {
  return /** @type{?proto.api.v1.Trigger.Job.Days} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Job.Days, 5));
};


/**
 * @param {?proto.api.v1.Trigger.Job.Days|undefined} value
 * @return {!proto.api.v1.Trigger.Job} returns this
*/
proto.api.v1.Trigger.Job.prototype.setDays = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.clearDays = function() {
  return this.setDays(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.prototype.hasDays = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional google.protobuf.Timestamp time = 6;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.api.v1.Trigger.Job.prototype.getTime = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 6));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.api.v1.Trigger.Job} returns this
*/
proto.api.v1.Trigger.Job.prototype.setTime = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.clearTime = function() {
  return this.setTime(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.Job.prototype.hasTime = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional string timezone_locale = 8;
 * @return {string}
 */
proto.api.v1.Trigger.Job.prototype.getTimezoneLocale = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Trigger.Job} returns this
 */
proto.api.v1.Trigger.Job.prototype.setTimezoneLocale = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional Application application = 1;
 * @return {?proto.api.v1.Trigger.Application}
 */
proto.api.v1.Trigger.prototype.getApplication = function() {
  return /** @type{?proto.api.v1.Trigger.Application} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Application, 1));
};


/**
 * @param {?proto.api.v1.Trigger.Application|undefined} value
 * @return {!proto.api.v1.Trigger} returns this
*/
proto.api.v1.Trigger.prototype.setApplication = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.Trigger.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger} returns this
 */
proto.api.v1.Trigger.prototype.clearApplication = function() {
  return this.setApplication(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.prototype.hasApplication = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Workflow workflow = 2;
 * @return {?proto.api.v1.Trigger.Workflow}
 */
proto.api.v1.Trigger.prototype.getWorkflow = function() {
  return /** @type{?proto.api.v1.Trigger.Workflow} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Workflow, 2));
};


/**
 * @param {?proto.api.v1.Trigger.Workflow|undefined} value
 * @return {!proto.api.v1.Trigger} returns this
*/
proto.api.v1.Trigger.prototype.setWorkflow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.Trigger.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger} returns this
 */
proto.api.v1.Trigger.prototype.clearWorkflow = function() {
  return this.setWorkflow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.prototype.hasWorkflow = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Job job = 3;
 * @return {?proto.api.v1.Trigger.Job}
 */
proto.api.v1.Trigger.prototype.getJob = function() {
  return /** @type{?proto.api.v1.Trigger.Job} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Trigger.Job, 3));
};


/**
 * @param {?proto.api.v1.Trigger.Job|undefined} value
 * @return {!proto.api.v1.Trigger} returns this
*/
proto.api.v1.Trigger.prototype.setJob = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.api.v1.Trigger.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Trigger} returns this
 */
proto.api.v1.Trigger.prototype.clearJob = function() {
  return this.setJob(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Trigger.prototype.hasJob = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Blocks.repeatedFields_ = [1];



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
proto.api.v1.Blocks.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Blocks.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Blocks} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Blocks.toObject = function(includeInstance, msg) {
  var f, obj = {
blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.api.v1.Block.toObject, includeInstance)
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
 * @return {!proto.api.v1.Blocks}
 */
proto.api.v1.Blocks.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Blocks;
  return proto.api.v1.Blocks.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Blocks} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Blocks}
 */
proto.api.v1.Blocks.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Block;
      reader.readMessage(value,proto.api.v1.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
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
proto.api.v1.Blocks.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Blocks.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Blocks} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Blocks.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.api.v1.Block.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Block blocks = 1;
 * @return {!Array<!proto.api.v1.Block>}
 */
proto.api.v1.Blocks.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.api.v1.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block, 1));
};


/**
 * @param {!Array<!proto.api.v1.Block>} value
 * @return {!proto.api.v1.Blocks} returns this
*/
proto.api.v1.Blocks.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.api.v1.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Blocks.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.api.v1.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Blocks} returns this
 */
proto.api.v1.Blocks.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.Block.oneofGroups_ = [[2,3,4,5,6,7,8,9,10,11,12,13]];

/**
 * @enum {number}
 */
proto.api.v1.Block.ConfigCase = {
  CONFIG_NOT_SET: 0,
  BREAK: 2,
  RETURN: 3,
  WAIT: 4,
  PARALLEL: 5,
  CONDITIONAL: 6,
  LOOP: 7,
  TRY_CATCH: 8,
  STEP: 9,
  VARIABLES: 10,
  THROW: 11,
  STREAM: 12,
  SEND: 13
};

/**
 * @return {proto.api.v1.Block.ConfigCase}
 */
proto.api.v1.Block.prototype.getConfigCase = function() {
  return /** @type {proto.api.v1.Block.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.Block.oneofGroups_[0]));
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
proto.api.v1.Block.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, ""),
pb_break: (f = msg.getBreak()) && proto.api.v1.Block.Break.toObject(includeInstance, f),
pb_return: (f = msg.getReturn()) && proto.api.v1.Block.Return.toObject(includeInstance, f),
wait: (f = msg.getWait()) && proto.api.v1.Block.Wait.toObject(includeInstance, f),
parallel: (f = msg.getParallel()) && proto.api.v1.Block.Parallel.toObject(includeInstance, f),
conditional: (f = msg.getConditional()) && proto.api.v1.Block.Conditional.toObject(includeInstance, f),
loop: (f = msg.getLoop()) && proto.api.v1.Block.Loop.toObject(includeInstance, f),
tryCatch: (f = msg.getTryCatch()) && proto.api.v1.Block.TryCatch.toObject(includeInstance, f),
step: (f = msg.getStep()) && proto.api.v1.Step.toObject(includeInstance, f),
variables: (f = msg.getVariables()) && api_v1_blocks_pb.Variables.toObject(includeInstance, f),
pb_throw: (f = msg.getThrow()) && proto.api.v1.Block.Throw.toObject(includeInstance, f),
stream: (f = msg.getStream()) && proto.api.v1.Block.Stream.toObject(includeInstance, f),
send: (f = msg.getSend()) && proto.api.v1.Block.Send.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Block.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block;
  return proto.api.v1.Block.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Block.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = new proto.api.v1.Block.Break;
      reader.readMessage(value,proto.api.v1.Block.Break.deserializeBinaryFromReader);
      msg.setBreak(value);
      break;
    case 3:
      var value = new proto.api.v1.Block.Return;
      reader.readMessage(value,proto.api.v1.Block.Return.deserializeBinaryFromReader);
      msg.setReturn(value);
      break;
    case 4:
      var value = new proto.api.v1.Block.Wait;
      reader.readMessage(value,proto.api.v1.Block.Wait.deserializeBinaryFromReader);
      msg.setWait(value);
      break;
    case 5:
      var value = new proto.api.v1.Block.Parallel;
      reader.readMessage(value,proto.api.v1.Block.Parallel.deserializeBinaryFromReader);
      msg.setParallel(value);
      break;
    case 6:
      var value = new proto.api.v1.Block.Conditional;
      reader.readMessage(value,proto.api.v1.Block.Conditional.deserializeBinaryFromReader);
      msg.setConditional(value);
      break;
    case 7:
      var value = new proto.api.v1.Block.Loop;
      reader.readMessage(value,proto.api.v1.Block.Loop.deserializeBinaryFromReader);
      msg.setLoop(value);
      break;
    case 8:
      var value = new proto.api.v1.Block.TryCatch;
      reader.readMessage(value,proto.api.v1.Block.TryCatch.deserializeBinaryFromReader);
      msg.setTryCatch(value);
      break;
    case 9:
      var value = new proto.api.v1.Step;
      reader.readMessage(value,proto.api.v1.Step.deserializeBinaryFromReader);
      msg.setStep(value);
      break;
    case 10:
      var value = new api_v1_blocks_pb.Variables;
      reader.readMessage(value,api_v1_blocks_pb.Variables.deserializeBinaryFromReader);
      msg.setVariables(value);
      break;
    case 11:
      var value = new proto.api.v1.Block.Throw;
      reader.readMessage(value,proto.api.v1.Block.Throw.deserializeBinaryFromReader);
      msg.setThrow(value);
      break;
    case 12:
      var value = new proto.api.v1.Block.Stream;
      reader.readMessage(value,proto.api.v1.Block.Stream.deserializeBinaryFromReader);
      msg.setStream(value);
      break;
    case 13:
      var value = new proto.api.v1.Block.Send;
      reader.readMessage(value,proto.api.v1.Block.Send.deserializeBinaryFromReader);
      msg.setSend(value);
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
proto.api.v1.Block.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBreak();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Block.Break.serializeBinaryToWriter
    );
  }
  f = message.getReturn();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Block.Return.serializeBinaryToWriter
    );
  }
  f = message.getWait();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.api.v1.Block.Wait.serializeBinaryToWriter
    );
  }
  f = message.getParallel();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.api.v1.Block.Parallel.serializeBinaryToWriter
    );
  }
  f = message.getConditional();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.api.v1.Block.Conditional.serializeBinaryToWriter
    );
  }
  f = message.getLoop();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.api.v1.Block.Loop.serializeBinaryToWriter
    );
  }
  f = message.getTryCatch();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.api.v1.Block.TryCatch.serializeBinaryToWriter
    );
  }
  f = message.getStep();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.api.v1.Step.serializeBinaryToWriter
    );
  }
  f = message.getVariables();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      api_v1_blocks_pb.Variables.serializeBinaryToWriter
    );
  }
  f = message.getThrow();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      proto.api.v1.Block.Throw.serializeBinaryToWriter
    );
  }
  f = message.getStream();
  if (f != null) {
    writer.writeMessage(
      12,
      f,
      proto.api.v1.Block.Stream.serializeBinaryToWriter
    );
  }
  f = message.getSend();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      proto.api.v1.Block.Send.serializeBinaryToWriter
    );
  }
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.Block.Parallel.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.api.v1.Block.Parallel.ConfigCase = {
  CONFIG_NOT_SET: 0,
  STATIC: 1,
  DYNAMIC: 2
};

/**
 * @return {proto.api.v1.Block.Parallel.ConfigCase}
 */
proto.api.v1.Block.Parallel.prototype.getConfigCase = function() {
  return /** @type {proto.api.v1.Block.Parallel.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.Block.Parallel.oneofGroups_[0]));
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
proto.api.v1.Block.Parallel.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Parallel.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Parallel} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_static: (f = msg.getStatic()) && proto.api.v1.Block.Parallel.Static.toObject(includeInstance, f),
dynamic: (f = msg.getDynamic()) && proto.api.v1.Block.Parallel.Dynamic.toObject(includeInstance, f),
wait: jspb.Message.getFieldWithDefault(msg, 3, 0),
poolSize: (f = jspb.Message.getField(msg, 4)) == null ? undefined : f
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
 * @return {!proto.api.v1.Block.Parallel}
 */
proto.api.v1.Block.Parallel.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Parallel;
  return proto.api.v1.Block.Parallel.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Parallel} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Parallel}
 */
proto.api.v1.Block.Parallel.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Block.Parallel.Static;
      reader.readMessage(value,proto.api.v1.Block.Parallel.Static.deserializeBinaryFromReader);
      msg.setStatic(value);
      break;
    case 2:
      var value = new proto.api.v1.Block.Parallel.Dynamic;
      reader.readMessage(value,proto.api.v1.Block.Parallel.Dynamic.deserializeBinaryFromReader);
      msg.setDynamic(value);
      break;
    case 3:
      var value = /** @type {!proto.api.v1.Block.Parallel.Wait} */ (reader.readEnum());
      msg.setWait(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPoolSize(value);
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
proto.api.v1.Block.Parallel.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Parallel.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Parallel} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatic();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Block.Parallel.Static.serializeBinaryToWriter
    );
  }
  f = message.getDynamic();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Block.Parallel.Dynamic.serializeBinaryToWriter
    );
  }
  f = message.getWait();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeInt32(
      4,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.api.v1.Block.Parallel.Wait = {
  WAIT_UNSPECIFIED: 0,
  WAIT_ALL: 1,
  WAIT_NONE: 2
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
proto.api.v1.Block.Parallel.Static.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Parallel.Static.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Parallel.Static} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Static.toObject = function(includeInstance, msg) {
  var f, obj = {
pathsMap: (f = msg.getPathsMap()) ? f.toObject(includeInstance, proto.api.v1.Blocks.toObject) : []
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
 * @return {!proto.api.v1.Block.Parallel.Static}
 */
proto.api.v1.Block.Parallel.Static.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Parallel.Static;
  return proto.api.v1.Block.Parallel.Static.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Parallel.Static} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Parallel.Static}
 */
proto.api.v1.Block.Parallel.Static.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getPathsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.api.v1.Blocks.deserializeBinaryFromReader, "", new proto.api.v1.Blocks());
         });
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
proto.api.v1.Block.Parallel.Static.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Parallel.Static.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Parallel.Static} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Static.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPathsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.api.v1.Blocks.serializeBinaryToWriter);
  }
};


/**
 * map<string, Blocks> paths = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.api.v1.Blocks>}
 */
proto.api.v1.Block.Parallel.Static.prototype.getPathsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.api.v1.Blocks>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.api.v1.Blocks));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.api.v1.Block.Parallel.Static} returns this
 */
proto.api.v1.Block.Parallel.Static.prototype.clearPathsMap = function() {
  this.getPathsMap().clear();
  return this;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Block.Parallel.Dynamic.repeatedFields_ = [3];



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
proto.api.v1.Block.Parallel.Dynamic.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Parallel.Dynamic.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Parallel.Dynamic} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Dynamic.toObject = function(includeInstance, msg) {
  var f, obj = {
paths: jspb.Message.getFieldWithDefault(msg, 1, ""),
variables: (f = msg.getVariables()) && proto.api.v1.Block.Parallel.Dynamic.Variables.toObject(includeInstance, f),
blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.api.v1.Block.toObject, includeInstance)
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
 * @return {!proto.api.v1.Block.Parallel.Dynamic}
 */
proto.api.v1.Block.Parallel.Dynamic.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Parallel.Dynamic;
  return proto.api.v1.Block.Parallel.Dynamic.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Parallel.Dynamic} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Parallel.Dynamic}
 */
proto.api.v1.Block.Parallel.Dynamic.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPaths(value);
      break;
    case 2:
      var value = new proto.api.v1.Block.Parallel.Dynamic.Variables;
      reader.readMessage(value,proto.api.v1.Block.Parallel.Dynamic.Variables.deserializeBinaryFromReader);
      msg.setVariables(value);
      break;
    case 3:
      var value = new proto.api.v1.Block;
      reader.readMessage(value,proto.api.v1.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
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
proto.api.v1.Block.Parallel.Dynamic.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Parallel.Dynamic.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Parallel.Dynamic} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Dynamic.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPaths();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVariables();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Block.Parallel.Dynamic.Variables.serializeBinaryToWriter
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.api.v1.Block.serializeBinaryToWriter
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
proto.api.v1.Block.Parallel.Dynamic.Variables.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Parallel.Dynamic.Variables.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Parallel.Dynamic.Variables} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.toObject = function(includeInstance, msg) {
  var f, obj = {
item: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Parallel.Dynamic.Variables}
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Parallel.Dynamic.Variables;
  return proto.api.v1.Block.Parallel.Dynamic.Variables.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Parallel.Dynamic.Variables} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Parallel.Dynamic.Variables}
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setItem(value);
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
proto.api.v1.Block.Parallel.Dynamic.Variables.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Parallel.Dynamic.Variables.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Parallel.Dynamic.Variables} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItem();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string item = 1;
 * @return {string}
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.prototype.getItem = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Parallel.Dynamic.Variables} returns this
 */
proto.api.v1.Block.Parallel.Dynamic.Variables.prototype.setItem = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string paths = 1;
 * @return {string}
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.getPaths = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Parallel.Dynamic} returns this
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.setPaths = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Variables variables = 2;
 * @return {?proto.api.v1.Block.Parallel.Dynamic.Variables}
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.getVariables = function() {
  return /** @type{?proto.api.v1.Block.Parallel.Dynamic.Variables} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Parallel.Dynamic.Variables, 2));
};


/**
 * @param {?proto.api.v1.Block.Parallel.Dynamic.Variables|undefined} value
 * @return {!proto.api.v1.Block.Parallel.Dynamic} returns this
*/
proto.api.v1.Block.Parallel.Dynamic.prototype.setVariables = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Parallel.Dynamic} returns this
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.clearVariables = function() {
  return this.setVariables(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.hasVariables = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated Block blocks = 3;
 * @return {!Array<!proto.api.v1.Block>}
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.api.v1.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block, 3));
};


/**
 * @param {!Array<!proto.api.v1.Block>} value
 * @return {!proto.api.v1.Block.Parallel.Dynamic} returns this
*/
proto.api.v1.Block.Parallel.Dynamic.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.api.v1.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.api.v1.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Block.Parallel.Dynamic} returns this
 */
proto.api.v1.Block.Parallel.Dynamic.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};


/**
 * optional Static static = 1;
 * @return {?proto.api.v1.Block.Parallel.Static}
 */
proto.api.v1.Block.Parallel.prototype.getStatic = function() {
  return /** @type{?proto.api.v1.Block.Parallel.Static} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Parallel.Static, 1));
};


/**
 * @param {?proto.api.v1.Block.Parallel.Static|undefined} value
 * @return {!proto.api.v1.Block.Parallel} returns this
*/
proto.api.v1.Block.Parallel.prototype.setStatic = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.api.v1.Block.Parallel.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Parallel} returns this
 */
proto.api.v1.Block.Parallel.prototype.clearStatic = function() {
  return this.setStatic(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Parallel.prototype.hasStatic = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Dynamic dynamic = 2;
 * @return {?proto.api.v1.Block.Parallel.Dynamic}
 */
proto.api.v1.Block.Parallel.prototype.getDynamic = function() {
  return /** @type{?proto.api.v1.Block.Parallel.Dynamic} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Parallel.Dynamic, 2));
};


/**
 * @param {?proto.api.v1.Block.Parallel.Dynamic|undefined} value
 * @return {!proto.api.v1.Block.Parallel} returns this
*/
proto.api.v1.Block.Parallel.prototype.setDynamic = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.Block.Parallel.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Parallel} returns this
 */
proto.api.v1.Block.Parallel.prototype.clearDynamic = function() {
  return this.setDynamic(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Parallel.prototype.hasDynamic = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Wait wait = 3;
 * @return {!proto.api.v1.Block.Parallel.Wait}
 */
proto.api.v1.Block.Parallel.prototype.getWait = function() {
  return /** @type {!proto.api.v1.Block.Parallel.Wait} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.api.v1.Block.Parallel.Wait} value
 * @return {!proto.api.v1.Block.Parallel} returns this
 */
proto.api.v1.Block.Parallel.prototype.setWait = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional int32 pool_size = 4;
 * @return {number}
 */
proto.api.v1.Block.Parallel.prototype.getPoolSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.api.v1.Block.Parallel} returns this
 */
proto.api.v1.Block.Parallel.prototype.setPoolSize = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.api.v1.Block.Parallel} returns this
 */
proto.api.v1.Block.Parallel.prototype.clearPoolSize = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Parallel.prototype.hasPoolSize = function() {
  return jspb.Message.getField(this, 4) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Block.Conditional.repeatedFields_ = [2];



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
proto.api.v1.Block.Conditional.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Conditional.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Conditional} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Conditional.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_if: (f = msg.getIf()) && proto.api.v1.Block.Conditional.Condition.toObject(includeInstance, f),
elseIfList: jspb.Message.toObjectList(msg.getElseIfList(),
    proto.api.v1.Block.Conditional.Condition.toObject, includeInstance),
pb_else: (f = msg.getElse()) && proto.api.v1.Blocks.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Block.Conditional}
 */
proto.api.v1.Block.Conditional.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Conditional;
  return proto.api.v1.Block.Conditional.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Conditional} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Conditional}
 */
proto.api.v1.Block.Conditional.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Block.Conditional.Condition;
      reader.readMessage(value,proto.api.v1.Block.Conditional.Condition.deserializeBinaryFromReader);
      msg.setIf(value);
      break;
    case 2:
      var value = new proto.api.v1.Block.Conditional.Condition;
      reader.readMessage(value,proto.api.v1.Block.Conditional.Condition.deserializeBinaryFromReader);
      msg.addElseIf(value);
      break;
    case 3:
      var value = new proto.api.v1.Blocks;
      reader.readMessage(value,proto.api.v1.Blocks.deserializeBinaryFromReader);
      msg.setElse(value);
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
proto.api.v1.Block.Conditional.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Conditional.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Conditional} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Conditional.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIf();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Block.Conditional.Condition.serializeBinaryToWriter
    );
  }
  f = message.getElseIfList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.api.v1.Block.Conditional.Condition.serializeBinaryToWriter
    );
  }
  f = message.getElse();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Blocks.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Block.Conditional.Condition.repeatedFields_ = [2];



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
proto.api.v1.Block.Conditional.Condition.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Conditional.Condition.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Conditional.Condition} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Conditional.Condition.toObject = function(includeInstance, msg) {
  var f, obj = {
condition: jspb.Message.getFieldWithDefault(msg, 1, ""),
blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.api.v1.Block.toObject, includeInstance)
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
 * @return {!proto.api.v1.Block.Conditional.Condition}
 */
proto.api.v1.Block.Conditional.Condition.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Conditional.Condition;
  return proto.api.v1.Block.Conditional.Condition.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Conditional.Condition} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Conditional.Condition}
 */
proto.api.v1.Block.Conditional.Condition.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCondition(value);
      break;
    case 2:
      var value = new proto.api.v1.Block;
      reader.readMessage(value,proto.api.v1.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
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
proto.api.v1.Block.Conditional.Condition.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Conditional.Condition.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Conditional.Condition} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Conditional.Condition.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCondition();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.api.v1.Block.serializeBinaryToWriter
    );
  }
};


/**
 * optional string condition = 1;
 * @return {string}
 */
proto.api.v1.Block.Conditional.Condition.prototype.getCondition = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Conditional.Condition} returns this
 */
proto.api.v1.Block.Conditional.Condition.prototype.setCondition = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated Block blocks = 2;
 * @return {!Array<!proto.api.v1.Block>}
 */
proto.api.v1.Block.Conditional.Condition.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.api.v1.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block, 2));
};


/**
 * @param {!Array<!proto.api.v1.Block>} value
 * @return {!proto.api.v1.Block.Conditional.Condition} returns this
*/
proto.api.v1.Block.Conditional.Condition.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.api.v1.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Block.Conditional.Condition.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.api.v1.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Block.Conditional.Condition} returns this
 */
proto.api.v1.Block.Conditional.Condition.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};


/**
 * optional Condition if = 1;
 * @return {?proto.api.v1.Block.Conditional.Condition}
 */
proto.api.v1.Block.Conditional.prototype.getIf = function() {
  return /** @type{?proto.api.v1.Block.Conditional.Condition} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Conditional.Condition, 1));
};


/**
 * @param {?proto.api.v1.Block.Conditional.Condition|undefined} value
 * @return {!proto.api.v1.Block.Conditional} returns this
*/
proto.api.v1.Block.Conditional.prototype.setIf = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Conditional} returns this
 */
proto.api.v1.Block.Conditional.prototype.clearIf = function() {
  return this.setIf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Conditional.prototype.hasIf = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated Condition else_if = 2;
 * @return {!Array<!proto.api.v1.Block.Conditional.Condition>}
 */
proto.api.v1.Block.Conditional.prototype.getElseIfList = function() {
  return /** @type{!Array<!proto.api.v1.Block.Conditional.Condition>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block.Conditional.Condition, 2));
};


/**
 * @param {!Array<!proto.api.v1.Block.Conditional.Condition>} value
 * @return {!proto.api.v1.Block.Conditional} returns this
*/
proto.api.v1.Block.Conditional.prototype.setElseIfList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.api.v1.Block.Conditional.Condition=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block.Conditional.Condition}
 */
proto.api.v1.Block.Conditional.prototype.addElseIf = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.api.v1.Block.Conditional.Condition, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Block.Conditional} returns this
 */
proto.api.v1.Block.Conditional.prototype.clearElseIfList = function() {
  return this.setElseIfList([]);
};


/**
 * optional Blocks else = 3;
 * @return {?proto.api.v1.Blocks}
 */
proto.api.v1.Block.Conditional.prototype.getElse = function() {
  return /** @type{?proto.api.v1.Blocks} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Blocks, 3));
};


/**
 * @param {?proto.api.v1.Blocks|undefined} value
 * @return {!proto.api.v1.Block.Conditional} returns this
*/
proto.api.v1.Block.Conditional.prototype.setElse = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Conditional} returns this
 */
proto.api.v1.Block.Conditional.prototype.clearElse = function() {
  return this.setElse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Conditional.prototype.hasElse = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.api.v1.Block.Loop.repeatedFields_ = [4];



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
proto.api.v1.Block.Loop.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Loop.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Loop} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Loop.toObject = function(includeInstance, msg) {
  var f, obj = {
range: jspb.Message.getFieldWithDefault(msg, 1, ""),
type: jspb.Message.getFieldWithDefault(msg, 2, 0),
variables: (f = msg.getVariables()) && proto.api.v1.Block.Loop.Variables.toObject(includeInstance, f),
blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.api.v1.Block.toObject, includeInstance)
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
 * @return {!proto.api.v1.Block.Loop}
 */
proto.api.v1.Block.Loop.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Loop;
  return proto.api.v1.Block.Loop.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Loop} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Loop}
 */
proto.api.v1.Block.Loop.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRange(value);
      break;
    case 2:
      var value = /** @type {!proto.api.v1.Block.Loop.Type} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 3:
      var value = new proto.api.v1.Block.Loop.Variables;
      reader.readMessage(value,proto.api.v1.Block.Loop.Variables.deserializeBinaryFromReader);
      msg.setVariables(value);
      break;
    case 4:
      var value = new proto.api.v1.Block;
      reader.readMessage(value,proto.api.v1.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
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
proto.api.v1.Block.Loop.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Loop.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Loop} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Loop.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRange();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getVariables();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Block.Loop.Variables.serializeBinaryToWriter
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.api.v1.Block.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.api.v1.Block.Loop.Type = {
  TYPE_UNSPECIFIED: 0,
  TYPE_FOR: 1,
  TYPE_FOREACH: 2,
  TYPE_WHILE: 3
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
proto.api.v1.Block.Loop.Variables.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Loop.Variables.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Loop.Variables} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Loop.Variables.toObject = function(includeInstance, msg) {
  var f, obj = {
index: jspb.Message.getFieldWithDefault(msg, 1, ""),
item: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.api.v1.Block.Loop.Variables}
 */
proto.api.v1.Block.Loop.Variables.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Loop.Variables;
  return proto.api.v1.Block.Loop.Variables.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Loop.Variables} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Loop.Variables}
 */
proto.api.v1.Block.Loop.Variables.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIndex(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setItem(value);
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
proto.api.v1.Block.Loop.Variables.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Loop.Variables.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Loop.Variables} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Loop.Variables.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIndex();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getItem();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string index = 1;
 * @return {string}
 */
proto.api.v1.Block.Loop.Variables.prototype.getIndex = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Loop.Variables} returns this
 */
proto.api.v1.Block.Loop.Variables.prototype.setIndex = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string item = 2;
 * @return {string}
 */
proto.api.v1.Block.Loop.Variables.prototype.getItem = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Loop.Variables} returns this
 */
proto.api.v1.Block.Loop.Variables.prototype.setItem = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string range = 1;
 * @return {string}
 */
proto.api.v1.Block.Loop.prototype.getRange = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Loop} returns this
 */
proto.api.v1.Block.Loop.prototype.setRange = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Type type = 2;
 * @return {!proto.api.v1.Block.Loop.Type}
 */
proto.api.v1.Block.Loop.prototype.getType = function() {
  return /** @type {!proto.api.v1.Block.Loop.Type} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.api.v1.Block.Loop.Type} value
 * @return {!proto.api.v1.Block.Loop} returns this
 */
proto.api.v1.Block.Loop.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional Variables variables = 3;
 * @return {?proto.api.v1.Block.Loop.Variables}
 */
proto.api.v1.Block.Loop.prototype.getVariables = function() {
  return /** @type{?proto.api.v1.Block.Loop.Variables} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Loop.Variables, 3));
};


/**
 * @param {?proto.api.v1.Block.Loop.Variables|undefined} value
 * @return {!proto.api.v1.Block.Loop} returns this
*/
proto.api.v1.Block.Loop.prototype.setVariables = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Loop} returns this
 */
proto.api.v1.Block.Loop.prototype.clearVariables = function() {
  return this.setVariables(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Loop.prototype.hasVariables = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * repeated Block blocks = 4;
 * @return {!Array<!proto.api.v1.Block>}
 */
proto.api.v1.Block.Loop.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.api.v1.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.api.v1.Block, 4));
};


/**
 * @param {!Array<!proto.api.v1.Block>} value
 * @return {!proto.api.v1.Block.Loop} returns this
*/
proto.api.v1.Block.Loop.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.api.v1.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.api.v1.Block}
 */
proto.api.v1.Block.Loop.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.api.v1.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.api.v1.Block.Loop} returns this
 */
proto.api.v1.Block.Loop.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
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
proto.api.v1.Block.TryCatch.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.TryCatch.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.TryCatch} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.TryCatch.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_try: (f = msg.getTry()) && proto.api.v1.Blocks.toObject(includeInstance, f),
pb_catch: (f = msg.getCatch()) && proto.api.v1.Blocks.toObject(includeInstance, f),
pb_finally: (f = msg.getFinally()) && proto.api.v1.Blocks.toObject(includeInstance, f),
variables: (f = msg.getVariables()) && proto.api.v1.Block.TryCatch.Variables.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Block.TryCatch}
 */
proto.api.v1.Block.TryCatch.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.TryCatch;
  return proto.api.v1.Block.TryCatch.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.TryCatch} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.TryCatch}
 */
proto.api.v1.Block.TryCatch.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Blocks;
      reader.readMessage(value,proto.api.v1.Blocks.deserializeBinaryFromReader);
      msg.setTry(value);
      break;
    case 2:
      var value = new proto.api.v1.Blocks;
      reader.readMessage(value,proto.api.v1.Blocks.deserializeBinaryFromReader);
      msg.setCatch(value);
      break;
    case 3:
      var value = new proto.api.v1.Blocks;
      reader.readMessage(value,proto.api.v1.Blocks.deserializeBinaryFromReader);
      msg.setFinally(value);
      break;
    case 4:
      var value = new proto.api.v1.Block.TryCatch.Variables;
      reader.readMessage(value,proto.api.v1.Block.TryCatch.Variables.deserializeBinaryFromReader);
      msg.setVariables(value);
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
proto.api.v1.Block.TryCatch.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.TryCatch.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.TryCatch} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.TryCatch.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTry();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Blocks.serializeBinaryToWriter
    );
  }
  f = message.getCatch();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Blocks.serializeBinaryToWriter
    );
  }
  f = message.getFinally();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Blocks.serializeBinaryToWriter
    );
  }
  f = message.getVariables();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.api.v1.Block.TryCatch.Variables.serializeBinaryToWriter
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
proto.api.v1.Block.TryCatch.Variables.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.TryCatch.Variables.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.TryCatch.Variables} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.TryCatch.Variables.toObject = function(includeInstance, msg) {
  var f, obj = {
error: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.TryCatch.Variables}
 */
proto.api.v1.Block.TryCatch.Variables.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.TryCatch.Variables;
  return proto.api.v1.Block.TryCatch.Variables.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.TryCatch.Variables} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.TryCatch.Variables}
 */
proto.api.v1.Block.TryCatch.Variables.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
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
proto.api.v1.Block.TryCatch.Variables.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.TryCatch.Variables.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.TryCatch.Variables} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.TryCatch.Variables.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string error = 1;
 * @return {string}
 */
proto.api.v1.Block.TryCatch.Variables.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.TryCatch.Variables} returns this
 */
proto.api.v1.Block.TryCatch.Variables.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Blocks try = 1;
 * @return {?proto.api.v1.Blocks}
 */
proto.api.v1.Block.TryCatch.prototype.getTry = function() {
  return /** @type{?proto.api.v1.Blocks} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Blocks, 1));
};


/**
 * @param {?proto.api.v1.Blocks|undefined} value
 * @return {!proto.api.v1.Block.TryCatch} returns this
*/
proto.api.v1.Block.TryCatch.prototype.setTry = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.TryCatch} returns this
 */
proto.api.v1.Block.TryCatch.prototype.clearTry = function() {
  return this.setTry(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.TryCatch.prototype.hasTry = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Blocks catch = 2;
 * @return {?proto.api.v1.Blocks}
 */
proto.api.v1.Block.TryCatch.prototype.getCatch = function() {
  return /** @type{?proto.api.v1.Blocks} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Blocks, 2));
};


/**
 * @param {?proto.api.v1.Blocks|undefined} value
 * @return {!proto.api.v1.Block.TryCatch} returns this
*/
proto.api.v1.Block.TryCatch.prototype.setCatch = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.TryCatch} returns this
 */
proto.api.v1.Block.TryCatch.prototype.clearCatch = function() {
  return this.setCatch(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.TryCatch.prototype.hasCatch = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Blocks finally = 3;
 * @return {?proto.api.v1.Blocks}
 */
proto.api.v1.Block.TryCatch.prototype.getFinally = function() {
  return /** @type{?proto.api.v1.Blocks} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Blocks, 3));
};


/**
 * @param {?proto.api.v1.Blocks|undefined} value
 * @return {!proto.api.v1.Block.TryCatch} returns this
*/
proto.api.v1.Block.TryCatch.prototype.setFinally = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.TryCatch} returns this
 */
proto.api.v1.Block.TryCatch.prototype.clearFinally = function() {
  return this.setFinally(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.TryCatch.prototype.hasFinally = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Variables variables = 4;
 * @return {?proto.api.v1.Block.TryCatch.Variables}
 */
proto.api.v1.Block.TryCatch.prototype.getVariables = function() {
  return /** @type{?proto.api.v1.Block.TryCatch.Variables} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.TryCatch.Variables, 4));
};


/**
 * @param {?proto.api.v1.Block.TryCatch.Variables|undefined} value
 * @return {!proto.api.v1.Block.TryCatch} returns this
*/
proto.api.v1.Block.TryCatch.prototype.setVariables = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.TryCatch} returns this
 */
proto.api.v1.Block.TryCatch.prototype.clearVariables = function() {
  return this.setVariables(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.TryCatch.prototype.hasVariables = function() {
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
proto.api.v1.Block.Break.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Break.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Break} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Break.toObject = function(includeInstance, msg) {
  var f, obj = {
condition: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Break}
 */
proto.api.v1.Block.Break.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Break;
  return proto.api.v1.Block.Break.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Break} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Break}
 */
proto.api.v1.Block.Break.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCondition(value);
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
proto.api.v1.Block.Break.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Break.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Break} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Break.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCondition();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string condition = 1;
 * @return {string}
 */
proto.api.v1.Block.Break.prototype.getCondition = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Break} returns this
 */
proto.api.v1.Block.Break.prototype.setCondition = function(value) {
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
proto.api.v1.Block.Return.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Return.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Return} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Return.toObject = function(includeInstance, msg) {
  var f, obj = {
data: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Return}
 */
proto.api.v1.Block.Return.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Return;
  return proto.api.v1.Block.Return.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Return} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Return}
 */
proto.api.v1.Block.Return.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
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
proto.api.v1.Block.Return.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Return.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Return} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Return.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string data = 1;
 * @return {string}
 */
proto.api.v1.Block.Return.prototype.getData = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Return} returns this
 */
proto.api.v1.Block.Return.prototype.setData = function(value) {
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
proto.api.v1.Block.Throw.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Throw.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Throw} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Throw.toObject = function(includeInstance, msg) {
  var f, obj = {
error: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Throw}
 */
proto.api.v1.Block.Throw.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Throw;
  return proto.api.v1.Block.Throw.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Throw} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Throw}
 */
proto.api.v1.Block.Throw.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
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
proto.api.v1.Block.Throw.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Throw.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Throw} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Throw.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string error = 1;
 * @return {string}
 */
proto.api.v1.Block.Throw.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Throw} returns this
 */
proto.api.v1.Block.Throw.prototype.setError = function(value) {
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
proto.api.v1.Block.Wait.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Wait.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Wait} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Wait.toObject = function(includeInstance, msg) {
  var f, obj = {
condition: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Wait}
 */
proto.api.v1.Block.Wait.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Wait;
  return proto.api.v1.Block.Wait.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Wait} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Wait}
 */
proto.api.v1.Block.Wait.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCondition(value);
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
proto.api.v1.Block.Wait.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Wait.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Wait} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Wait.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCondition();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string condition = 1;
 * @return {string}
 */
proto.api.v1.Block.Wait.prototype.getCondition = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Wait} returns this
 */
proto.api.v1.Block.Wait.prototype.setCondition = function(value) {
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
proto.api.v1.Block.Stream.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Stream.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Stream} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.toObject = function(includeInstance, msg) {
  var f, obj = {
trigger: (f = msg.getTrigger()) && proto.api.v1.Block.Stream.Trigger.toObject(includeInstance, f),
process: (f = msg.getProcess()) && proto.api.v1.Blocks.toObject(includeInstance, f),
variables: (f = msg.getVariables()) && proto.api.v1.Block.Stream.Variables.toObject(includeInstance, f),
options: (f = msg.getOptions()) && proto.api.v1.Block.Stream.Options.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Block.Stream}
 */
proto.api.v1.Block.Stream.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Stream;
  return proto.api.v1.Block.Stream.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Stream} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Stream}
 */
proto.api.v1.Block.Stream.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.api.v1.Block.Stream.Trigger;
      reader.readMessage(value,proto.api.v1.Block.Stream.Trigger.deserializeBinaryFromReader);
      msg.setTrigger(value);
      break;
    case 2:
      var value = new proto.api.v1.Blocks;
      reader.readMessage(value,proto.api.v1.Blocks.deserializeBinaryFromReader);
      msg.setProcess(value);
      break;
    case 3:
      var value = new proto.api.v1.Block.Stream.Variables;
      reader.readMessage(value,proto.api.v1.Block.Stream.Variables.deserializeBinaryFromReader);
      msg.setVariables(value);
      break;
    case 4:
      var value = new proto.api.v1.Block.Stream.Options;
      reader.readMessage(value,proto.api.v1.Block.Stream.Options.deserializeBinaryFromReader);
      msg.setOptions(value);
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
proto.api.v1.Block.Stream.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Stream.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Stream} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTrigger();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.api.v1.Block.Stream.Trigger.serializeBinaryToWriter
    );
  }
  f = message.getProcess();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Blocks.serializeBinaryToWriter
    );
  }
  f = message.getVariables();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.api.v1.Block.Stream.Variables.serializeBinaryToWriter
    );
  }
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.api.v1.Block.Stream.Options.serializeBinaryToWriter
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
proto.api.v1.Block.Stream.Variables.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Stream.Variables.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Stream.Variables} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Variables.toObject = function(includeInstance, msg) {
  var f, obj = {
item: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Stream.Variables}
 */
proto.api.v1.Block.Stream.Variables.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Stream.Variables;
  return proto.api.v1.Block.Stream.Variables.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Stream.Variables} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Stream.Variables}
 */
proto.api.v1.Block.Stream.Variables.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setItem(value);
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
proto.api.v1.Block.Stream.Variables.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Stream.Variables.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Stream.Variables} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Variables.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItem();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string item = 1;
 * @return {string}
 */
proto.api.v1.Block.Stream.Variables.prototype.getItem = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Stream.Variables} returns this
 */
proto.api.v1.Block.Stream.Variables.prototype.setItem = function(value) {
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
proto.api.v1.Block.Stream.Options.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Stream.Options.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Stream.Options} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Options.toObject = function(includeInstance, msg) {
  var f, obj = {
disableAutoSend: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
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
 * @return {!proto.api.v1.Block.Stream.Options}
 */
proto.api.v1.Block.Stream.Options.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Stream.Options;
  return proto.api.v1.Block.Stream.Options.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Stream.Options} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Stream.Options}
 */
proto.api.v1.Block.Stream.Options.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setDisableAutoSend(value);
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
proto.api.v1.Block.Stream.Options.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Stream.Options.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Stream.Options} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Options.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDisableAutoSend();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool disable_auto_send = 1;
 * @return {boolean}
 */
proto.api.v1.Block.Stream.Options.prototype.getDisableAutoSend = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.api.v1.Block.Stream.Options} returns this
 */
proto.api.v1.Block.Stream.Options.prototype.setDisableAutoSend = function(value) {
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
proto.api.v1.Block.Stream.Trigger.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Stream.Trigger.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Stream.Trigger} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Trigger.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, ""),
step: (f = msg.getStep()) && proto.api.v1.Step.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Block.Stream.Trigger}
 */
proto.api.v1.Block.Stream.Trigger.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Stream.Trigger;
  return proto.api.v1.Block.Stream.Trigger.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Stream.Trigger} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Stream.Trigger}
 */
proto.api.v1.Block.Stream.Trigger.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = new proto.api.v1.Step;
      reader.readMessage(value,proto.api.v1.Step.deserializeBinaryFromReader);
      msg.setStep(value);
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
proto.api.v1.Block.Stream.Trigger.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Stream.Trigger.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Stream.Trigger} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Stream.Trigger.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStep();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.api.v1.Step.serializeBinaryToWriter
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.api.v1.Block.Stream.Trigger.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Stream.Trigger} returns this
 */
proto.api.v1.Block.Stream.Trigger.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Step step = 2;
 * @return {?proto.api.v1.Step}
 */
proto.api.v1.Block.Stream.Trigger.prototype.getStep = function() {
  return /** @type{?proto.api.v1.Step} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Step, 2));
};


/**
 * @param {?proto.api.v1.Step|undefined} value
 * @return {!proto.api.v1.Block.Stream.Trigger} returns this
*/
proto.api.v1.Block.Stream.Trigger.prototype.setStep = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Stream.Trigger} returns this
 */
proto.api.v1.Block.Stream.Trigger.prototype.clearStep = function() {
  return this.setStep(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Stream.Trigger.prototype.hasStep = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Trigger trigger = 1;
 * @return {?proto.api.v1.Block.Stream.Trigger}
 */
proto.api.v1.Block.Stream.prototype.getTrigger = function() {
  return /** @type{?proto.api.v1.Block.Stream.Trigger} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Stream.Trigger, 1));
};


/**
 * @param {?proto.api.v1.Block.Stream.Trigger|undefined} value
 * @return {!proto.api.v1.Block.Stream} returns this
*/
proto.api.v1.Block.Stream.prototype.setTrigger = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Stream} returns this
 */
proto.api.v1.Block.Stream.prototype.clearTrigger = function() {
  return this.setTrigger(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Stream.prototype.hasTrigger = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Blocks process = 2;
 * @return {?proto.api.v1.Blocks}
 */
proto.api.v1.Block.Stream.prototype.getProcess = function() {
  return /** @type{?proto.api.v1.Blocks} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Blocks, 2));
};


/**
 * @param {?proto.api.v1.Blocks|undefined} value
 * @return {!proto.api.v1.Block.Stream} returns this
*/
proto.api.v1.Block.Stream.prototype.setProcess = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Stream} returns this
 */
proto.api.v1.Block.Stream.prototype.clearProcess = function() {
  return this.setProcess(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Stream.prototype.hasProcess = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Variables variables = 3;
 * @return {?proto.api.v1.Block.Stream.Variables}
 */
proto.api.v1.Block.Stream.prototype.getVariables = function() {
  return /** @type{?proto.api.v1.Block.Stream.Variables} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Stream.Variables, 3));
};


/**
 * @param {?proto.api.v1.Block.Stream.Variables|undefined} value
 * @return {!proto.api.v1.Block.Stream} returns this
*/
proto.api.v1.Block.Stream.prototype.setVariables = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Stream} returns this
 */
proto.api.v1.Block.Stream.prototype.clearVariables = function() {
  return this.setVariables(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Stream.prototype.hasVariables = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Options options = 4;
 * @return {?proto.api.v1.Block.Stream.Options}
 */
proto.api.v1.Block.Stream.prototype.getOptions = function() {
  return /** @type{?proto.api.v1.Block.Stream.Options} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Stream.Options, 4));
};


/**
 * @param {?proto.api.v1.Block.Stream.Options|undefined} value
 * @return {!proto.api.v1.Block.Stream} returns this
*/
proto.api.v1.Block.Stream.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block.Stream} returns this
 */
proto.api.v1.Block.Stream.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.Stream.prototype.hasOptions = function() {
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
proto.api.v1.Block.Send.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Block.Send.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Block.Send} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Send.toObject = function(includeInstance, msg) {
  var f, obj = {
message: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.api.v1.Block.Send}
 */
proto.api.v1.Block.Send.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Block.Send;
  return proto.api.v1.Block.Send.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Block.Send} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Block.Send}
 */
proto.api.v1.Block.Send.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
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
proto.api.v1.Block.Send.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Block.Send.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Block.Send} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Block.Send.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string message = 1;
 * @return {string}
 */
proto.api.v1.Block.Send.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block.Send} returns this
 */
proto.api.v1.Block.Send.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.api.v1.Block.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Break break = 2;
 * @return {?proto.api.v1.Block.Break}
 */
proto.api.v1.Block.prototype.getBreak = function() {
  return /** @type{?proto.api.v1.Block.Break} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Break, 2));
};


/**
 * @param {?proto.api.v1.Block.Break|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setBreak = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearBreak = function() {
  return this.setBreak(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasBreak = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Return return = 3;
 * @return {?proto.api.v1.Block.Return}
 */
proto.api.v1.Block.prototype.getReturn = function() {
  return /** @type{?proto.api.v1.Block.Return} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Return, 3));
};


/**
 * @param {?proto.api.v1.Block.Return|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setReturn = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearReturn = function() {
  return this.setReturn(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasReturn = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Wait wait = 4;
 * @return {?proto.api.v1.Block.Wait}
 */
proto.api.v1.Block.prototype.getWait = function() {
  return /** @type{?proto.api.v1.Block.Wait} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Wait, 4));
};


/**
 * @param {?proto.api.v1.Block.Wait|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setWait = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearWait = function() {
  return this.setWait(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasWait = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Parallel parallel = 5;
 * @return {?proto.api.v1.Block.Parallel}
 */
proto.api.v1.Block.prototype.getParallel = function() {
  return /** @type{?proto.api.v1.Block.Parallel} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Parallel, 5));
};


/**
 * @param {?proto.api.v1.Block.Parallel|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setParallel = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearParallel = function() {
  return this.setParallel(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasParallel = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Conditional conditional = 6;
 * @return {?proto.api.v1.Block.Conditional}
 */
proto.api.v1.Block.prototype.getConditional = function() {
  return /** @type{?proto.api.v1.Block.Conditional} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Conditional, 6));
};


/**
 * @param {?proto.api.v1.Block.Conditional|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setConditional = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearConditional = function() {
  return this.setConditional(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasConditional = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Loop loop = 7;
 * @return {?proto.api.v1.Block.Loop}
 */
proto.api.v1.Block.prototype.getLoop = function() {
  return /** @type{?proto.api.v1.Block.Loop} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Loop, 7));
};


/**
 * @param {?proto.api.v1.Block.Loop|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setLoop = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearLoop = function() {
  return this.setLoop(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasLoop = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional TryCatch try_catch = 8;
 * @return {?proto.api.v1.Block.TryCatch}
 */
proto.api.v1.Block.prototype.getTryCatch = function() {
  return /** @type{?proto.api.v1.Block.TryCatch} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.TryCatch, 8));
};


/**
 * @param {?proto.api.v1.Block.TryCatch|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setTryCatch = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearTryCatch = function() {
  return this.setTryCatch(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasTryCatch = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional Step step = 9;
 * @return {?proto.api.v1.Step}
 */
proto.api.v1.Block.prototype.getStep = function() {
  return /** @type{?proto.api.v1.Step} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Step, 9));
};


/**
 * @param {?proto.api.v1.Step|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setStep = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearStep = function() {
  return this.setStep(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasStep = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional Variables variables = 10;
 * @return {?proto.api.v1.Variables}
 */
proto.api.v1.Block.prototype.getVariables = function() {
  return /** @type{?proto.api.v1.Variables} */ (
    jspb.Message.getWrapperField(this, api_v1_blocks_pb.Variables, 10));
};


/**
 * @param {?proto.api.v1.Variables|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setVariables = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearVariables = function() {
  return this.setVariables(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasVariables = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional Throw throw = 11;
 * @return {?proto.api.v1.Block.Throw}
 */
proto.api.v1.Block.prototype.getThrow = function() {
  return /** @type{?proto.api.v1.Block.Throw} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Throw, 11));
};


/**
 * @param {?proto.api.v1.Block.Throw|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setThrow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 11, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearThrow = function() {
  return this.setThrow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasThrow = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional Stream stream = 12;
 * @return {?proto.api.v1.Block.Stream}
 */
proto.api.v1.Block.prototype.getStream = function() {
  return /** @type{?proto.api.v1.Block.Stream} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Stream, 12));
};


/**
 * @param {?proto.api.v1.Block.Stream|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setStream = function(value) {
  return jspb.Message.setOneofWrapperField(this, 12, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearStream = function() {
  return this.setStream(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasStream = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional Send send = 13;
 * @return {?proto.api.v1.Block.Send}
 */
proto.api.v1.Block.prototype.getSend = function() {
  return /** @type{?proto.api.v1.Block.Send} */ (
    jspb.Message.getWrapperField(this, proto.api.v1.Block.Send, 13));
};


/**
 * @param {?proto.api.v1.Block.Send|undefined} value
 * @return {!proto.api.v1.Block} returns this
*/
proto.api.v1.Block.prototype.setSend = function(value) {
  return jspb.Message.setOneofWrapperField(this, 13, proto.api.v1.Block.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Block} returns this
 */
proto.api.v1.Block.prototype.clearSend = function() {
  return this.setSend(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Block.prototype.hasSend = function() {
  return jspb.Message.getField(this, 13) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.api.v1.Step.oneofGroups_ = [[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76]];

/**
 * @enum {number}
 */
proto.api.v1.Step.ConfigCase = {
  CONFIG_NOT_SET: 0,
  PYTHON: 2,
  BIGQUERY: 3,
  DYNAMODB: 4,
  EMAIL: 5,
  GRAPHQL: 6,
  GRAPHQLINTEGRATION: 7,
  GSHEETS: 8,
  MARIADB: 9,
  MSSQL: 10,
  MYSQL: 11,
  POSTGRES: 12,
  REDSHIFT: 13,
  RESTAPI: 14,
  RESTAPIINTEGRATION: 15,
  ROCKSET: 16,
  S3: 17,
  SNOWFLAKE: 18,
  WORKFLOW: 19,
  JAVASCRIPT: 20,
  MONGODB: 21,
  GCS: 22,
  OPENAI: 23,
  OCR: 24,
  KAFKA: 25,
  CONFLUENT: 26,
  MSK: 27,
  REDPANDA: 28,
  AIVENKAFKA: 29,
  COCKROACHDB: 30,
  AIRTABLE: 31,
  NOTION: 32,
  PAGERDUTY: 33,
  SENDGRID: 34,
  SLACK: 35,
  ATHENA: 36,
  REDIS: 37,
  ASANA: 38,
  GITHUB: 39,
  SMTP: 40,
  SALESFORCE: 41,
  BITBUCKET: 42,
  CIRCLECI: 43,
  FRONT: 44,
  INTERCOM: 45,
  SEGMENT: 46,
  LAUNCHDARKLY: 47,
  DROPBOX: 48,
  TWILIO: 49,
  GOOGLEDRIVE: 50,
  GOOGLEANALYTICS: 51,
  BOX: 52,
  HUBSPOT: 53,
  STRIPE: 54,
  ZOOM: 55,
  JIRA: 56,
  ZENDESK: 57,
  ADLS: 58,
  PINECONE: 59,
  COSMOSDB: 60,
  DATADOG: 61,
  XERO: 62,
  ORACLEDB: 63,
  ELASTICSEARCH: 64,
  DATABRICKS: 65,
  COUCHBASE: 66,
  CUSTOM: 67,
  ANTHROPIC: 68,
  COHERE: 69,
  FIREWORKS: 70,
  MISTRAL: 71,
  GROQ: 72,
  PERPLEXITY: 73,
  STABILITYAI: 74,
  GEMINI: 75,
  KINESIS: 76
};

/**
 * @return {proto.api.v1.Step.ConfigCase}
 */
proto.api.v1.Step.prototype.getConfigCase = function() {
  return /** @type {proto.api.v1.Step.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.api.v1.Step.oneofGroups_[0]));
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
proto.api.v1.Step.prototype.toObject = function(opt_includeInstance) {
  return proto.api.v1.Step.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.api.v1.Step} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Step.toObject = function(includeInstance, msg) {
  var f, obj = {
integration: jspb.Message.getFieldWithDefault(msg, 1, ""),
python: (f = msg.getPython()) && plugins_python_v1_plugin_pb.Plugin.toObject(includeInstance, f),
bigquery: (f = msg.getBigquery()) && plugins_bigquery_v1_plugin_pb.Plugin.toObject(includeInstance, f),
dynamodb: (f = msg.getDynamodb()) && plugins_dynamodb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
email: (f = msg.getEmail()) && plugins_email_v1_plugin_pb.Plugin.toObject(includeInstance, f),
graphql: (f = msg.getGraphql()) && plugins_graphql_v1_plugin_pb.Plugin.toObject(includeInstance, f),
graphqlintegration: (f = msg.getGraphqlintegration()) && plugins_graphql_v1_plugin_pb.Plugin.toObject(includeInstance, f),
gsheets: (f = msg.getGsheets()) && plugins_gsheets_v1_plugin_pb.Plugin.toObject(includeInstance, f),
mariadb: (f = msg.getMariadb()) && plugins_mariadb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
mssql: (f = msg.getMssql()) && plugins_mssql_v1_plugin_pb.Plugin.toObject(includeInstance, f),
mysql: (f = msg.getMysql()) && plugins_mysql_v1_plugin_pb.Plugin.toObject(includeInstance, f),
postgres: (f = msg.getPostgres()) && plugins_postgresql_v1_plugin_pb.Plugin.toObject(includeInstance, f),
redshift: (f = msg.getRedshift()) && plugins_redshift_v1_plugin_pb.Plugin.toObject(includeInstance, f),
restapi: (f = msg.getRestapi()) && plugins_restapi_v1_plugin_pb.Plugin.toObject(includeInstance, f),
restapiintegration: (f = msg.getRestapiintegration()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
rockset: (f = msg.getRockset()) && plugins_rockset_v1_plugin_pb.Plugin.toObject(includeInstance, f),
s3: (f = msg.getS3()) && plugins_s3_v1_plugin_pb.Plugin.toObject(includeInstance, f),
snowflake: (f = msg.getSnowflake()) && plugins_snowflake_v1_plugin_pb.Plugin.toObject(includeInstance, f),
workflow: (f = msg.getWorkflow()) && plugins_workflow_v1_plugin_pb.Plugin.toObject(includeInstance, f),
javascript: (f = msg.getJavascript()) && plugins_javascript_v1_plugin_pb.Plugin.toObject(includeInstance, f),
mongodb: (f = msg.getMongodb()) && plugins_mongodb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
gcs: (f = msg.getGcs()) && plugins_gcs_v1_plugin_pb.Plugin.toObject(includeInstance, f),
openai: (f = msg.getOpenai()) && plugins_openai_v1_plugin_pb.Plugin.toObject(includeInstance, f),
ocr: (f = msg.getOcr()) && plugins_ocr_v1_plugin_pb.Plugin.toObject(includeInstance, f),
kafka: (f = msg.getKafka()) && plugins_kafka_v1_plugin_pb.Plugin.toObject(includeInstance, f),
confluent: (f = msg.getConfluent()) && plugins_kafka_v1_plugin_pb.Plugin.toObject(includeInstance, f),
msk: (f = msg.getMsk()) && plugins_kafka_v1_plugin_pb.Plugin.toObject(includeInstance, f),
redpanda: (f = msg.getRedpanda()) && plugins_kafka_v1_plugin_pb.Plugin.toObject(includeInstance, f),
aivenkafka: (f = msg.getAivenkafka()) && plugins_kafka_v1_plugin_pb.Plugin.toObject(includeInstance, f),
cockroachdb: (f = msg.getCockroachdb()) && plugins_cockroachdb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
airtable: (f = msg.getAirtable()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
notion: (f = msg.getNotion()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
pagerduty: (f = msg.getPagerduty()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
sendgrid: (f = msg.getSendgrid()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
slack: (f = msg.getSlack()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
athena: (f = msg.getAthena()) && plugins_athena_v1_plugin_pb.Plugin.toObject(includeInstance, f),
redis: (f = msg.getRedis()) && plugins_redis_v1_plugin_pb.Plugin.toObject(includeInstance, f),
asana: (f = msg.getAsana()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
github: (f = msg.getGithub()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
smtp: (f = msg.getSmtp()) && plugins_smtp_v1_plugin_pb.Plugin.toObject(includeInstance, f),
salesforce: (f = msg.getSalesforce()) && plugins_salesforce_v1_plugin_pb.Plugin.toObject(includeInstance, f),
bitbucket: (f = msg.getBitbucket()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
circleci: (f = msg.getCircleci()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
front: (f = msg.getFront()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
intercom: (f = msg.getIntercom()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
segment: (f = msg.getSegment()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
launchdarkly: (f = msg.getLaunchdarkly()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
dropbox: (f = msg.getDropbox()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
twilio: (f = msg.getTwilio()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
googledrive: (f = msg.getGoogledrive()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
googleanalytics: (f = msg.getGoogleanalytics()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
box: (f = msg.getBox()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
hubspot: (f = msg.getHubspot()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
stripe: (f = msg.getStripe()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
zoom: (f = msg.getZoom()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
jira: (f = msg.getJira()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
zendesk: (f = msg.getZendesk()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
adls: (f = msg.getAdls()) && plugins_adls_v1_plugin_pb.Plugin.toObject(includeInstance, f),
pinecone: (f = msg.getPinecone()) && plugins_pinecone_v1_plugin_pb.Plugin.toObject(includeInstance, f),
cosmosdb: (f = msg.getCosmosdb()) && plugins_cosmosdb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
datadog: (f = msg.getDatadog()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
xero: (f = msg.getXero()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
oracledb: (f = msg.getOracledb()) && plugins_oracledb_v1_plugin_pb.Plugin.toObject(includeInstance, f),
elasticsearch: (f = msg.getElasticsearch()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
databricks: (f = msg.getDatabricks()) && plugins_databricks_v1_plugin_pb.Plugin.toObject(includeInstance, f),
couchbase: (f = msg.getCouchbase()) && plugins_couchbase_v1_plugin_pb.Plugin.toObject(includeInstance, f),
custom: (f = msg.getCustom()) && plugins_custom_v1_plugin_pb.Plugin.toObject(includeInstance, f),
anthropic: (f = msg.getAnthropic()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
cohere: (f = msg.getCohere()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
fireworks: (f = msg.getFireworks()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
mistral: (f = msg.getMistral()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
groq: (f = msg.getGroq()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
perplexity: (f = msg.getPerplexity()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
stabilityai: (f = msg.getStabilityai()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
gemini: (f = msg.getGemini()) && plugins_restapiintegration_v1_plugin_pb.Plugin.toObject(includeInstance, f),
kinesis: (f = msg.getKinesis()) && plugins_kinesis_v1_plugin_pb.Plugin.toObject(includeInstance, f)
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
 * @return {!proto.api.v1.Step}
 */
proto.api.v1.Step.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.api.v1.Step;
  return proto.api.v1.Step.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.api.v1.Step} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.api.v1.Step}
 */
proto.api.v1.Step.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIntegration(value);
      break;
    case 2:
      var value = new plugins_python_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_python_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setPython(value);
      break;
    case 3:
      var value = new plugins_bigquery_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_bigquery_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setBigquery(value);
      break;
    case 4:
      var value = new plugins_dynamodb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_dynamodb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setDynamodb(value);
      break;
    case 5:
      var value = new plugins_email_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_email_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setEmail(value);
      break;
    case 6:
      var value = new plugins_graphql_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_graphql_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGraphql(value);
      break;
    case 7:
      var value = new plugins_graphql_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_graphql_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGraphqlintegration(value);
      break;
    case 8:
      var value = new plugins_gsheets_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_gsheets_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGsheets(value);
      break;
    case 9:
      var value = new plugins_mariadb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_mariadb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMariadb(value);
      break;
    case 10:
      var value = new plugins_mssql_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_mssql_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMssql(value);
      break;
    case 11:
      var value = new plugins_mysql_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_mysql_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMysql(value);
      break;
    case 12:
      var value = new plugins_postgresql_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_postgresql_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setPostgres(value);
      break;
    case 13:
      var value = new plugins_redshift_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_redshift_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRedshift(value);
      break;
    case 14:
      var value = new plugins_restapi_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapi_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRestapi(value);
      break;
    case 15:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRestapiintegration(value);
      break;
    case 16:
      var value = new plugins_rockset_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_rockset_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRockset(value);
      break;
    case 17:
      var value = new plugins_s3_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_s3_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setS3(value);
      break;
    case 18:
      var value = new plugins_snowflake_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_snowflake_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSnowflake(value);
      break;
    case 19:
      var value = new plugins_workflow_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_workflow_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setWorkflow(value);
      break;
    case 20:
      var value = new plugins_javascript_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_javascript_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setJavascript(value);
      break;
    case 21:
      var value = new plugins_mongodb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_mongodb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMongodb(value);
      break;
    case 22:
      var value = new plugins_gcs_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_gcs_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGcs(value);
      break;
    case 23:
      var value = new plugins_openai_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_openai_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setOpenai(value);
      break;
    case 24:
      var value = new plugins_ocr_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_ocr_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setOcr(value);
      break;
    case 25:
      var value = new plugins_kafka_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setKafka(value);
      break;
    case 26:
      var value = new plugins_kafka_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setConfluent(value);
      break;
    case 27:
      var value = new plugins_kafka_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMsk(value);
      break;
    case 28:
      var value = new plugins_kafka_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRedpanda(value);
      break;
    case 29:
      var value = new plugins_kafka_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kafka_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAivenkafka(value);
      break;
    case 30:
      var value = new plugins_cockroachdb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_cockroachdb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCockroachdb(value);
      break;
    case 31:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAirtable(value);
      break;
    case 32:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setNotion(value);
      break;
    case 33:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setPagerduty(value);
      break;
    case 34:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSendgrid(value);
      break;
    case 35:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSlack(value);
      break;
    case 36:
      var value = new plugins_athena_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_athena_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAthena(value);
      break;
    case 37:
      var value = new plugins_redis_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_redis_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setRedis(value);
      break;
    case 38:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAsana(value);
      break;
    case 39:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGithub(value);
      break;
    case 40:
      var value = new plugins_smtp_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_smtp_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSmtp(value);
      break;
    case 41:
      var value = new plugins_salesforce_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_salesforce_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSalesforce(value);
      break;
    case 42:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setBitbucket(value);
      break;
    case 43:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCircleci(value);
      break;
    case 44:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setFront(value);
      break;
    case 45:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setIntercom(value);
      break;
    case 46:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setSegment(value);
      break;
    case 47:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setLaunchdarkly(value);
      break;
    case 48:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setDropbox(value);
      break;
    case 49:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setTwilio(value);
      break;
    case 50:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGoogledrive(value);
      break;
    case 51:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGoogleanalytics(value);
      break;
    case 52:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setBox(value);
      break;
    case 53:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setHubspot(value);
      break;
    case 54:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setStripe(value);
      break;
    case 55:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setZoom(value);
      break;
    case 56:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setJira(value);
      break;
    case 57:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setZendesk(value);
      break;
    case 58:
      var value = new plugins_adls_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_adls_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAdls(value);
      break;
    case 59:
      var value = new plugins_pinecone_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_pinecone_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setPinecone(value);
      break;
    case 60:
      var value = new plugins_cosmosdb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_cosmosdb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCosmosdb(value);
      break;
    case 61:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setDatadog(value);
      break;
    case 62:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setXero(value);
      break;
    case 63:
      var value = new plugins_oracledb_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_oracledb_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setOracledb(value);
      break;
    case 64:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setElasticsearch(value);
      break;
    case 65:
      var value = new plugins_databricks_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_databricks_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setDatabricks(value);
      break;
    case 66:
      var value = new plugins_couchbase_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_couchbase_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCouchbase(value);
      break;
    case 67:
      var value = new plugins_custom_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_custom_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCustom(value);
      break;
    case 68:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setAnthropic(value);
      break;
    case 69:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setCohere(value);
      break;
    case 70:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setFireworks(value);
      break;
    case 71:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setMistral(value);
      break;
    case 72:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGroq(value);
      break;
    case 73:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setPerplexity(value);
      break;
    case 74:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setStabilityai(value);
      break;
    case 75:
      var value = new plugins_restapiintegration_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_restapiintegration_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setGemini(value);
      break;
    case 76:
      var value = new plugins_kinesis_v1_plugin_pb.Plugin;
      reader.readMessage(value,plugins_kinesis_v1_plugin_pb.Plugin.deserializeBinaryFromReader);
      msg.setKinesis(value);
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
proto.api.v1.Step.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.api.v1.Step.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.api.v1.Step} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.api.v1.Step.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIntegration();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPython();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      plugins_python_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getBigquery();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      plugins_bigquery_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getDynamodb();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      plugins_dynamodb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getEmail();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      plugins_email_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGraphql();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      plugins_graphql_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGraphqlintegration();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      plugins_graphql_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGsheets();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      plugins_gsheets_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMariadb();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      plugins_mariadb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMssql();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      plugins_mssql_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMysql();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      plugins_mysql_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getPostgres();
  if (f != null) {
    writer.writeMessage(
      12,
      f,
      plugins_postgresql_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRedshift();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      plugins_redshift_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRestapi();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      plugins_restapi_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRestapiintegration();
  if (f != null) {
    writer.writeMessage(
      15,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRockset();
  if (f != null) {
    writer.writeMessage(
      16,
      f,
      plugins_rockset_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getS3();
  if (f != null) {
    writer.writeMessage(
      17,
      f,
      plugins_s3_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSnowflake();
  if (f != null) {
    writer.writeMessage(
      18,
      f,
      plugins_snowflake_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getWorkflow();
  if (f != null) {
    writer.writeMessage(
      19,
      f,
      plugins_workflow_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getJavascript();
  if (f != null) {
    writer.writeMessage(
      20,
      f,
      plugins_javascript_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMongodb();
  if (f != null) {
    writer.writeMessage(
      21,
      f,
      plugins_mongodb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGcs();
  if (f != null) {
    writer.writeMessage(
      22,
      f,
      plugins_gcs_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getOpenai();
  if (f != null) {
    writer.writeMessage(
      23,
      f,
      plugins_openai_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getOcr();
  if (f != null) {
    writer.writeMessage(
      24,
      f,
      plugins_ocr_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getKafka();
  if (f != null) {
    writer.writeMessage(
      25,
      f,
      plugins_kafka_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getConfluent();
  if (f != null) {
    writer.writeMessage(
      26,
      f,
      plugins_kafka_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMsk();
  if (f != null) {
    writer.writeMessage(
      27,
      f,
      plugins_kafka_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRedpanda();
  if (f != null) {
    writer.writeMessage(
      28,
      f,
      plugins_kafka_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAivenkafka();
  if (f != null) {
    writer.writeMessage(
      29,
      f,
      plugins_kafka_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCockroachdb();
  if (f != null) {
    writer.writeMessage(
      30,
      f,
      plugins_cockroachdb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAirtable();
  if (f != null) {
    writer.writeMessage(
      31,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getNotion();
  if (f != null) {
    writer.writeMessage(
      32,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getPagerduty();
  if (f != null) {
    writer.writeMessage(
      33,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSendgrid();
  if (f != null) {
    writer.writeMessage(
      34,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSlack();
  if (f != null) {
    writer.writeMessage(
      35,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAthena();
  if (f != null) {
    writer.writeMessage(
      36,
      f,
      plugins_athena_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getRedis();
  if (f != null) {
    writer.writeMessage(
      37,
      f,
      plugins_redis_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAsana();
  if (f != null) {
    writer.writeMessage(
      38,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGithub();
  if (f != null) {
    writer.writeMessage(
      39,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSmtp();
  if (f != null) {
    writer.writeMessage(
      40,
      f,
      plugins_smtp_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSalesforce();
  if (f != null) {
    writer.writeMessage(
      41,
      f,
      plugins_salesforce_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getBitbucket();
  if (f != null) {
    writer.writeMessage(
      42,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCircleci();
  if (f != null) {
    writer.writeMessage(
      43,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getFront();
  if (f != null) {
    writer.writeMessage(
      44,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getIntercom();
  if (f != null) {
    writer.writeMessage(
      45,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getSegment();
  if (f != null) {
    writer.writeMessage(
      46,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getLaunchdarkly();
  if (f != null) {
    writer.writeMessage(
      47,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getDropbox();
  if (f != null) {
    writer.writeMessage(
      48,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getTwilio();
  if (f != null) {
    writer.writeMessage(
      49,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGoogledrive();
  if (f != null) {
    writer.writeMessage(
      50,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGoogleanalytics();
  if (f != null) {
    writer.writeMessage(
      51,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getBox();
  if (f != null) {
    writer.writeMessage(
      52,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getHubspot();
  if (f != null) {
    writer.writeMessage(
      53,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getStripe();
  if (f != null) {
    writer.writeMessage(
      54,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getZoom();
  if (f != null) {
    writer.writeMessage(
      55,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getJira();
  if (f != null) {
    writer.writeMessage(
      56,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getZendesk();
  if (f != null) {
    writer.writeMessage(
      57,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAdls();
  if (f != null) {
    writer.writeMessage(
      58,
      f,
      plugins_adls_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getPinecone();
  if (f != null) {
    writer.writeMessage(
      59,
      f,
      plugins_pinecone_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCosmosdb();
  if (f != null) {
    writer.writeMessage(
      60,
      f,
      plugins_cosmosdb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getDatadog();
  if (f != null) {
    writer.writeMessage(
      61,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getXero();
  if (f != null) {
    writer.writeMessage(
      62,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getOracledb();
  if (f != null) {
    writer.writeMessage(
      63,
      f,
      plugins_oracledb_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getElasticsearch();
  if (f != null) {
    writer.writeMessage(
      64,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getDatabricks();
  if (f != null) {
    writer.writeMessage(
      65,
      f,
      plugins_databricks_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCouchbase();
  if (f != null) {
    writer.writeMessage(
      66,
      f,
      plugins_couchbase_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCustom();
  if (f != null) {
    writer.writeMessage(
      67,
      f,
      plugins_custom_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getAnthropic();
  if (f != null) {
    writer.writeMessage(
      68,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getCohere();
  if (f != null) {
    writer.writeMessage(
      69,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getFireworks();
  if (f != null) {
    writer.writeMessage(
      70,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getMistral();
  if (f != null) {
    writer.writeMessage(
      71,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGroq();
  if (f != null) {
    writer.writeMessage(
      72,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getPerplexity();
  if (f != null) {
    writer.writeMessage(
      73,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getStabilityai();
  if (f != null) {
    writer.writeMessage(
      74,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getGemini();
  if (f != null) {
    writer.writeMessage(
      75,
      f,
      plugins_restapiintegration_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
  f = message.getKinesis();
  if (f != null) {
    writer.writeMessage(
      76,
      f,
      plugins_kinesis_v1_plugin_pb.Plugin.serializeBinaryToWriter
    );
  }
};


/**
 * optional string integration = 1;
 * @return {string}
 */
proto.api.v1.Step.prototype.getIntegration = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.setIntegration = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional plugins.python.v1.Plugin python = 2;
 * @return {?proto.plugins.python.v1.Plugin}
 */
proto.api.v1.Step.prototype.getPython = function() {
  return /** @type{?proto.plugins.python.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_python_v1_plugin_pb.Plugin, 2));
};


/**
 * @param {?proto.plugins.python.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setPython = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearPython = function() {
  return this.setPython(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasPython = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional plugins.bigquery.v1.Plugin bigquery = 3;
 * @return {?proto.plugins.bigquery.v1.Plugin}
 */
proto.api.v1.Step.prototype.getBigquery = function() {
  return /** @type{?proto.plugins.bigquery.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_bigquery_v1_plugin_pb.Plugin, 3));
};


/**
 * @param {?proto.plugins.bigquery.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setBigquery = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearBigquery = function() {
  return this.setBigquery(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasBigquery = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional plugins.dynamodb.v1.Plugin dynamodb = 4;
 * @return {?proto.plugins.dynamodb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getDynamodb = function() {
  return /** @type{?proto.plugins.dynamodb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_dynamodb_v1_plugin_pb.Plugin, 4));
};


/**
 * @param {?proto.plugins.dynamodb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setDynamodb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearDynamodb = function() {
  return this.setDynamodb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasDynamodb = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional plugins.email.v1.Plugin email = 5;
 * @return {?proto.plugins.email.v1.Plugin}
 */
proto.api.v1.Step.prototype.getEmail = function() {
  return /** @type{?proto.plugins.email.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_email_v1_plugin_pb.Plugin, 5));
};


/**
 * @param {?proto.plugins.email.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setEmail = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearEmail = function() {
  return this.setEmail(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasEmail = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional plugins.graphql.v1.Plugin graphql = 6;
 * @return {?proto.plugins.graphql.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGraphql = function() {
  return /** @type{?proto.plugins.graphql.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_graphql_v1_plugin_pb.Plugin, 6));
};


/**
 * @param {?proto.plugins.graphql.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGraphql = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGraphql = function() {
  return this.setGraphql(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGraphql = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional plugins.graphql.v1.Plugin graphqlintegration = 7;
 * @return {?proto.plugins.graphql.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGraphqlintegration = function() {
  return /** @type{?proto.plugins.graphql.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_graphql_v1_plugin_pb.Plugin, 7));
};


/**
 * @param {?proto.plugins.graphql.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGraphqlintegration = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGraphqlintegration = function() {
  return this.setGraphqlintegration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGraphqlintegration = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional plugins.gsheets.v1.Plugin gsheets = 8;
 * @return {?proto.plugins.gsheets.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGsheets = function() {
  return /** @type{?proto.plugins.gsheets.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_gsheets_v1_plugin_pb.Plugin, 8));
};


/**
 * @param {?proto.plugins.gsheets.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGsheets = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGsheets = function() {
  return this.setGsheets(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGsheets = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional plugins.mariadb.v1.Plugin mariadb = 9;
 * @return {?proto.plugins.mariadb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMariadb = function() {
  return /** @type{?proto.plugins.mariadb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_mariadb_v1_plugin_pb.Plugin, 9));
};


/**
 * @param {?proto.plugins.mariadb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMariadb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMariadb = function() {
  return this.setMariadb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMariadb = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional plugins.mssql.v1.Plugin mssql = 10;
 * @return {?proto.plugins.mssql.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMssql = function() {
  return /** @type{?proto.plugins.mssql.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_mssql_v1_plugin_pb.Plugin, 10));
};


/**
 * @param {?proto.plugins.mssql.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMssql = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMssql = function() {
  return this.setMssql(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMssql = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional plugins.mysql.v1.Plugin mysql = 11;
 * @return {?proto.plugins.mysql.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMysql = function() {
  return /** @type{?proto.plugins.mysql.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_mysql_v1_plugin_pb.Plugin, 11));
};


/**
 * @param {?proto.plugins.mysql.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMysql = function(value) {
  return jspb.Message.setOneofWrapperField(this, 11, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMysql = function() {
  return this.setMysql(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMysql = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional plugins.postgresql.v1.Plugin postgres = 12;
 * @return {?proto.plugins.postgresql.v1.Plugin}
 */
proto.api.v1.Step.prototype.getPostgres = function() {
  return /** @type{?proto.plugins.postgresql.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_postgresql_v1_plugin_pb.Plugin, 12));
};


/**
 * @param {?proto.plugins.postgresql.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setPostgres = function(value) {
  return jspb.Message.setOneofWrapperField(this, 12, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearPostgres = function() {
  return this.setPostgres(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasPostgres = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional plugins.redshift.v1.Plugin redshift = 13;
 * @return {?proto.plugins.redshift.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRedshift = function() {
  return /** @type{?proto.plugins.redshift.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_redshift_v1_plugin_pb.Plugin, 13));
};


/**
 * @param {?proto.plugins.redshift.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRedshift = function(value) {
  return jspb.Message.setOneofWrapperField(this, 13, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRedshift = function() {
  return this.setRedshift(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRedshift = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional plugins.restapi.v1.Plugin restapi = 14;
 * @return {?proto.plugins.restapi.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRestapi = function() {
  return /** @type{?proto.plugins.restapi.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapi_v1_plugin_pb.Plugin, 14));
};


/**
 * @param {?proto.plugins.restapi.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRestapi = function(value) {
  return jspb.Message.setOneofWrapperField(this, 14, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRestapi = function() {
  return this.setRestapi(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRestapi = function() {
  return jspb.Message.getField(this, 14) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin restapiintegration = 15;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRestapiintegration = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 15));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRestapiintegration = function(value) {
  return jspb.Message.setOneofWrapperField(this, 15, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRestapiintegration = function() {
  return this.setRestapiintegration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRestapiintegration = function() {
  return jspb.Message.getField(this, 15) != null;
};


/**
 * optional plugins.rockset.v1.Plugin rockset = 16;
 * @return {?proto.plugins.rockset.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRockset = function() {
  return /** @type{?proto.plugins.rockset.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_rockset_v1_plugin_pb.Plugin, 16));
};


/**
 * @param {?proto.plugins.rockset.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRockset = function(value) {
  return jspb.Message.setOneofWrapperField(this, 16, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRockset = function() {
  return this.setRockset(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRockset = function() {
  return jspb.Message.getField(this, 16) != null;
};


/**
 * optional plugins.s3.v1.Plugin s3 = 17;
 * @return {?proto.plugins.s3.v1.Plugin}
 */
proto.api.v1.Step.prototype.getS3 = function() {
  return /** @type{?proto.plugins.s3.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_s3_v1_plugin_pb.Plugin, 17));
};


/**
 * @param {?proto.plugins.s3.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setS3 = function(value) {
  return jspb.Message.setOneofWrapperField(this, 17, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearS3 = function() {
  return this.setS3(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasS3 = function() {
  return jspb.Message.getField(this, 17) != null;
};


/**
 * optional plugins.snowflake.v1.Plugin snowflake = 18;
 * @return {?proto.plugins.snowflake.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSnowflake = function() {
  return /** @type{?proto.plugins.snowflake.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_snowflake_v1_plugin_pb.Plugin, 18));
};


/**
 * @param {?proto.plugins.snowflake.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSnowflake = function(value) {
  return jspb.Message.setOneofWrapperField(this, 18, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSnowflake = function() {
  return this.setSnowflake(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSnowflake = function() {
  return jspb.Message.getField(this, 18) != null;
};


/**
 * optional plugins.workflow.v1.Plugin workflow = 19;
 * @return {?proto.plugins.workflow.v1.Plugin}
 */
proto.api.v1.Step.prototype.getWorkflow = function() {
  return /** @type{?proto.plugins.workflow.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_workflow_v1_plugin_pb.Plugin, 19));
};


/**
 * @param {?proto.plugins.workflow.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setWorkflow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 19, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearWorkflow = function() {
  return this.setWorkflow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasWorkflow = function() {
  return jspb.Message.getField(this, 19) != null;
};


/**
 * optional plugins.javascript.v1.Plugin javascript = 20;
 * @return {?proto.plugins.javascript.v1.Plugin}
 */
proto.api.v1.Step.prototype.getJavascript = function() {
  return /** @type{?proto.plugins.javascript.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_javascript_v1_plugin_pb.Plugin, 20));
};


/**
 * @param {?proto.plugins.javascript.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setJavascript = function(value) {
  return jspb.Message.setOneofWrapperField(this, 20, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearJavascript = function() {
  return this.setJavascript(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasJavascript = function() {
  return jspb.Message.getField(this, 20) != null;
};


/**
 * optional plugins.mongodb.v1.Plugin mongodb = 21;
 * @return {?proto.plugins.mongodb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMongodb = function() {
  return /** @type{?proto.plugins.mongodb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_mongodb_v1_plugin_pb.Plugin, 21));
};


/**
 * @param {?proto.plugins.mongodb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMongodb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 21, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMongodb = function() {
  return this.setMongodb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMongodb = function() {
  return jspb.Message.getField(this, 21) != null;
};


/**
 * optional plugins.gcs.v1.Plugin gcs = 22;
 * @return {?proto.plugins.gcs.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGcs = function() {
  return /** @type{?proto.plugins.gcs.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_gcs_v1_plugin_pb.Plugin, 22));
};


/**
 * @param {?proto.plugins.gcs.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGcs = function(value) {
  return jspb.Message.setOneofWrapperField(this, 22, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGcs = function() {
  return this.setGcs(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGcs = function() {
  return jspb.Message.getField(this, 22) != null;
};


/**
 * optional plugins.openai.v1.Plugin openai = 23;
 * @return {?proto.plugins.openai.v1.Plugin}
 */
proto.api.v1.Step.prototype.getOpenai = function() {
  return /** @type{?proto.plugins.openai.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_openai_v1_plugin_pb.Plugin, 23));
};


/**
 * @param {?proto.plugins.openai.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setOpenai = function(value) {
  return jspb.Message.setOneofWrapperField(this, 23, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearOpenai = function() {
  return this.setOpenai(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasOpenai = function() {
  return jspb.Message.getField(this, 23) != null;
};


/**
 * optional plugins.ocr.v1.Plugin ocr = 24;
 * @return {?proto.plugins.ocr.v1.Plugin}
 */
proto.api.v1.Step.prototype.getOcr = function() {
  return /** @type{?proto.plugins.ocr.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_ocr_v1_plugin_pb.Plugin, 24));
};


/**
 * @param {?proto.plugins.ocr.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setOcr = function(value) {
  return jspb.Message.setOneofWrapperField(this, 24, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearOcr = function() {
  return this.setOcr(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasOcr = function() {
  return jspb.Message.getField(this, 24) != null;
};


/**
 * optional plugins.kafka.v1.Plugin kafka = 25;
 * @return {?proto.plugins.kafka.v1.Plugin}
 */
proto.api.v1.Step.prototype.getKafka = function() {
  return /** @type{?proto.plugins.kafka.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Plugin, 25));
};


/**
 * @param {?proto.plugins.kafka.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setKafka = function(value) {
  return jspb.Message.setOneofWrapperField(this, 25, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearKafka = function() {
  return this.setKafka(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasKafka = function() {
  return jspb.Message.getField(this, 25) != null;
};


/**
 * optional plugins.kafka.v1.Plugin confluent = 26;
 * @return {?proto.plugins.kafka.v1.Plugin}
 */
proto.api.v1.Step.prototype.getConfluent = function() {
  return /** @type{?proto.plugins.kafka.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Plugin, 26));
};


/**
 * @param {?proto.plugins.kafka.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setConfluent = function(value) {
  return jspb.Message.setOneofWrapperField(this, 26, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearConfluent = function() {
  return this.setConfluent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasConfluent = function() {
  return jspb.Message.getField(this, 26) != null;
};


/**
 * optional plugins.kafka.v1.Plugin msk = 27;
 * @return {?proto.plugins.kafka.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMsk = function() {
  return /** @type{?proto.plugins.kafka.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Plugin, 27));
};


/**
 * @param {?proto.plugins.kafka.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMsk = function(value) {
  return jspb.Message.setOneofWrapperField(this, 27, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMsk = function() {
  return this.setMsk(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMsk = function() {
  return jspb.Message.getField(this, 27) != null;
};


/**
 * optional plugins.kafka.v1.Plugin redpanda = 28;
 * @return {?proto.plugins.kafka.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRedpanda = function() {
  return /** @type{?proto.plugins.kafka.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Plugin, 28));
};


/**
 * @param {?proto.plugins.kafka.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRedpanda = function(value) {
  return jspb.Message.setOneofWrapperField(this, 28, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRedpanda = function() {
  return this.setRedpanda(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRedpanda = function() {
  return jspb.Message.getField(this, 28) != null;
};


/**
 * optional plugins.kafka.v1.Plugin aivenkafka = 29;
 * @return {?proto.plugins.kafka.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAivenkafka = function() {
  return /** @type{?proto.plugins.kafka.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kafka_v1_plugin_pb.Plugin, 29));
};


/**
 * @param {?proto.plugins.kafka.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAivenkafka = function(value) {
  return jspb.Message.setOneofWrapperField(this, 29, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAivenkafka = function() {
  return this.setAivenkafka(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAivenkafka = function() {
  return jspb.Message.getField(this, 29) != null;
};


/**
 * optional plugins.cockroachdb.v1.Plugin cockroachdb = 30;
 * @return {?proto.plugins.cockroachdb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCockroachdb = function() {
  return /** @type{?proto.plugins.cockroachdb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_cockroachdb_v1_plugin_pb.Plugin, 30));
};


/**
 * @param {?proto.plugins.cockroachdb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCockroachdb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 30, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCockroachdb = function() {
  return this.setCockroachdb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCockroachdb = function() {
  return jspb.Message.getField(this, 30) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin airtable = 31;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAirtable = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 31));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAirtable = function(value) {
  return jspb.Message.setOneofWrapperField(this, 31, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAirtable = function() {
  return this.setAirtable(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAirtable = function() {
  return jspb.Message.getField(this, 31) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin notion = 32;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getNotion = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 32));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setNotion = function(value) {
  return jspb.Message.setOneofWrapperField(this, 32, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearNotion = function() {
  return this.setNotion(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasNotion = function() {
  return jspb.Message.getField(this, 32) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin pagerduty = 33;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getPagerduty = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 33));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setPagerduty = function(value) {
  return jspb.Message.setOneofWrapperField(this, 33, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearPagerduty = function() {
  return this.setPagerduty(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasPagerduty = function() {
  return jspb.Message.getField(this, 33) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin sendgrid = 34;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSendgrid = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 34));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSendgrid = function(value) {
  return jspb.Message.setOneofWrapperField(this, 34, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSendgrid = function() {
  return this.setSendgrid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSendgrid = function() {
  return jspb.Message.getField(this, 34) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin slack = 35;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSlack = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 35));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSlack = function(value) {
  return jspb.Message.setOneofWrapperField(this, 35, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSlack = function() {
  return this.setSlack(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSlack = function() {
  return jspb.Message.getField(this, 35) != null;
};


/**
 * optional plugins.athena.v1.Plugin athena = 36;
 * @return {?proto.plugins.athena.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAthena = function() {
  return /** @type{?proto.plugins.athena.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_athena_v1_plugin_pb.Plugin, 36));
};


/**
 * @param {?proto.plugins.athena.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAthena = function(value) {
  return jspb.Message.setOneofWrapperField(this, 36, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAthena = function() {
  return this.setAthena(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAthena = function() {
  return jspb.Message.getField(this, 36) != null;
};


/**
 * optional plugins.redis.v1.Plugin redis = 37;
 * @return {?proto.plugins.redis.v1.Plugin}
 */
proto.api.v1.Step.prototype.getRedis = function() {
  return /** @type{?proto.plugins.redis.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_redis_v1_plugin_pb.Plugin, 37));
};


/**
 * @param {?proto.plugins.redis.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setRedis = function(value) {
  return jspb.Message.setOneofWrapperField(this, 37, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearRedis = function() {
  return this.setRedis(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasRedis = function() {
  return jspb.Message.getField(this, 37) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin asana = 38;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAsana = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 38));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAsana = function(value) {
  return jspb.Message.setOneofWrapperField(this, 38, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAsana = function() {
  return this.setAsana(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAsana = function() {
  return jspb.Message.getField(this, 38) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin github = 39;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGithub = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 39));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGithub = function(value) {
  return jspb.Message.setOneofWrapperField(this, 39, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGithub = function() {
  return this.setGithub(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGithub = function() {
  return jspb.Message.getField(this, 39) != null;
};


/**
 * optional plugins.smtp.v1.Plugin smtp = 40;
 * @return {?proto.plugins.smtp.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSmtp = function() {
  return /** @type{?proto.plugins.smtp.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_smtp_v1_plugin_pb.Plugin, 40));
};


/**
 * @param {?proto.plugins.smtp.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSmtp = function(value) {
  return jspb.Message.setOneofWrapperField(this, 40, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSmtp = function() {
  return this.setSmtp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSmtp = function() {
  return jspb.Message.getField(this, 40) != null;
};


/**
 * optional plugins.salesforce.v1.Plugin salesforce = 41;
 * @return {?proto.plugins.salesforce.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSalesforce = function() {
  return /** @type{?proto.plugins.salesforce.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_salesforce_v1_plugin_pb.Plugin, 41));
};


/**
 * @param {?proto.plugins.salesforce.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSalesforce = function(value) {
  return jspb.Message.setOneofWrapperField(this, 41, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSalesforce = function() {
  return this.setSalesforce(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSalesforce = function() {
  return jspb.Message.getField(this, 41) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin bitbucket = 42;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getBitbucket = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 42));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setBitbucket = function(value) {
  return jspb.Message.setOneofWrapperField(this, 42, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearBitbucket = function() {
  return this.setBitbucket(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasBitbucket = function() {
  return jspb.Message.getField(this, 42) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin circleci = 43;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCircleci = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 43));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCircleci = function(value) {
  return jspb.Message.setOneofWrapperField(this, 43, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCircleci = function() {
  return this.setCircleci(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCircleci = function() {
  return jspb.Message.getField(this, 43) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin front = 44;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getFront = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 44));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setFront = function(value) {
  return jspb.Message.setOneofWrapperField(this, 44, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearFront = function() {
  return this.setFront(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasFront = function() {
  return jspb.Message.getField(this, 44) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin intercom = 45;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getIntercom = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 45));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setIntercom = function(value) {
  return jspb.Message.setOneofWrapperField(this, 45, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearIntercom = function() {
  return this.setIntercom(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasIntercom = function() {
  return jspb.Message.getField(this, 45) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin segment = 46;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getSegment = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 46));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setSegment = function(value) {
  return jspb.Message.setOneofWrapperField(this, 46, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearSegment = function() {
  return this.setSegment(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasSegment = function() {
  return jspb.Message.getField(this, 46) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin launchdarkly = 47;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getLaunchdarkly = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 47));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setLaunchdarkly = function(value) {
  return jspb.Message.setOneofWrapperField(this, 47, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearLaunchdarkly = function() {
  return this.setLaunchdarkly(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasLaunchdarkly = function() {
  return jspb.Message.getField(this, 47) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin dropbox = 48;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getDropbox = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 48));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setDropbox = function(value) {
  return jspb.Message.setOneofWrapperField(this, 48, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearDropbox = function() {
  return this.setDropbox(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasDropbox = function() {
  return jspb.Message.getField(this, 48) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin twilio = 49;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getTwilio = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 49));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setTwilio = function(value) {
  return jspb.Message.setOneofWrapperField(this, 49, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearTwilio = function() {
  return this.setTwilio(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasTwilio = function() {
  return jspb.Message.getField(this, 49) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin googledrive = 50;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGoogledrive = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 50));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGoogledrive = function(value) {
  return jspb.Message.setOneofWrapperField(this, 50, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGoogledrive = function() {
  return this.setGoogledrive(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGoogledrive = function() {
  return jspb.Message.getField(this, 50) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin googleanalytics = 51;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGoogleanalytics = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 51));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGoogleanalytics = function(value) {
  return jspb.Message.setOneofWrapperField(this, 51, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGoogleanalytics = function() {
  return this.setGoogleanalytics(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGoogleanalytics = function() {
  return jspb.Message.getField(this, 51) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin box = 52;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getBox = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 52));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setBox = function(value) {
  return jspb.Message.setOneofWrapperField(this, 52, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearBox = function() {
  return this.setBox(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasBox = function() {
  return jspb.Message.getField(this, 52) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin hubspot = 53;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getHubspot = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 53));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setHubspot = function(value) {
  return jspb.Message.setOneofWrapperField(this, 53, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearHubspot = function() {
  return this.setHubspot(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasHubspot = function() {
  return jspb.Message.getField(this, 53) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin stripe = 54;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getStripe = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 54));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setStripe = function(value) {
  return jspb.Message.setOneofWrapperField(this, 54, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearStripe = function() {
  return this.setStripe(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasStripe = function() {
  return jspb.Message.getField(this, 54) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin zoom = 55;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getZoom = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 55));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setZoom = function(value) {
  return jspb.Message.setOneofWrapperField(this, 55, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearZoom = function() {
  return this.setZoom(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasZoom = function() {
  return jspb.Message.getField(this, 55) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin jira = 56;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getJira = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 56));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setJira = function(value) {
  return jspb.Message.setOneofWrapperField(this, 56, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearJira = function() {
  return this.setJira(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasJira = function() {
  return jspb.Message.getField(this, 56) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin zendesk = 57;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getZendesk = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 57));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setZendesk = function(value) {
  return jspb.Message.setOneofWrapperField(this, 57, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearZendesk = function() {
  return this.setZendesk(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasZendesk = function() {
  return jspb.Message.getField(this, 57) != null;
};


/**
 * optional plugins.adls.v1.Plugin adls = 58;
 * @return {?proto.plugins.adls.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAdls = function() {
  return /** @type{?proto.plugins.adls.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_adls_v1_plugin_pb.Plugin, 58));
};


/**
 * @param {?proto.plugins.adls.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAdls = function(value) {
  return jspb.Message.setOneofWrapperField(this, 58, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAdls = function() {
  return this.setAdls(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAdls = function() {
  return jspb.Message.getField(this, 58) != null;
};


/**
 * optional plugins.pinecone.v1.Plugin pinecone = 59;
 * @return {?proto.plugins.pinecone.v1.Plugin}
 */
proto.api.v1.Step.prototype.getPinecone = function() {
  return /** @type{?proto.plugins.pinecone.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_pinecone_v1_plugin_pb.Plugin, 59));
};


/**
 * @param {?proto.plugins.pinecone.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setPinecone = function(value) {
  return jspb.Message.setOneofWrapperField(this, 59, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearPinecone = function() {
  return this.setPinecone(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasPinecone = function() {
  return jspb.Message.getField(this, 59) != null;
};


/**
 * optional plugins.cosmosdb.v1.Plugin cosmosdb = 60;
 * @return {?proto.plugins.cosmosdb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCosmosdb = function() {
  return /** @type{?proto.plugins.cosmosdb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_cosmosdb_v1_plugin_pb.Plugin, 60));
};


/**
 * @param {?proto.plugins.cosmosdb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCosmosdb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 60, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCosmosdb = function() {
  return this.setCosmosdb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCosmosdb = function() {
  return jspb.Message.getField(this, 60) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin datadog = 61;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getDatadog = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 61));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setDatadog = function(value) {
  return jspb.Message.setOneofWrapperField(this, 61, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearDatadog = function() {
  return this.setDatadog(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasDatadog = function() {
  return jspb.Message.getField(this, 61) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin xero = 62;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getXero = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 62));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setXero = function(value) {
  return jspb.Message.setOneofWrapperField(this, 62, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearXero = function() {
  return this.setXero(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasXero = function() {
  return jspb.Message.getField(this, 62) != null;
};


/**
 * optional plugins.oracledb.v1.Plugin oracledb = 63;
 * @return {?proto.plugins.oracledb.v1.Plugin}
 */
proto.api.v1.Step.prototype.getOracledb = function() {
  return /** @type{?proto.plugins.oracledb.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_oracledb_v1_plugin_pb.Plugin, 63));
};


/**
 * @param {?proto.plugins.oracledb.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setOracledb = function(value) {
  return jspb.Message.setOneofWrapperField(this, 63, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearOracledb = function() {
  return this.setOracledb(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasOracledb = function() {
  return jspb.Message.getField(this, 63) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin elasticsearch = 64;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getElasticsearch = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 64));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setElasticsearch = function(value) {
  return jspb.Message.setOneofWrapperField(this, 64, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearElasticsearch = function() {
  return this.setElasticsearch(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasElasticsearch = function() {
  return jspb.Message.getField(this, 64) != null;
};


/**
 * optional plugins.databricks.v1.Plugin databricks = 65;
 * @return {?proto.plugins.databricks.v1.Plugin}
 */
proto.api.v1.Step.prototype.getDatabricks = function() {
  return /** @type{?proto.plugins.databricks.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_databricks_v1_plugin_pb.Plugin, 65));
};


/**
 * @param {?proto.plugins.databricks.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setDatabricks = function(value) {
  return jspb.Message.setOneofWrapperField(this, 65, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearDatabricks = function() {
  return this.setDatabricks(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasDatabricks = function() {
  return jspb.Message.getField(this, 65) != null;
};


/**
 * optional plugins.couchbase.v1.Plugin couchbase = 66;
 * @return {?proto.plugins.couchbase.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCouchbase = function() {
  return /** @type{?proto.plugins.couchbase.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_couchbase_v1_plugin_pb.Plugin, 66));
};


/**
 * @param {?proto.plugins.couchbase.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCouchbase = function(value) {
  return jspb.Message.setOneofWrapperField(this, 66, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCouchbase = function() {
  return this.setCouchbase(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCouchbase = function() {
  return jspb.Message.getField(this, 66) != null;
};


/**
 * optional plugins.custom.v1.Plugin custom = 67;
 * @return {?proto.plugins.custom.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCustom = function() {
  return /** @type{?proto.plugins.custom.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_custom_v1_plugin_pb.Plugin, 67));
};


/**
 * @param {?proto.plugins.custom.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCustom = function(value) {
  return jspb.Message.setOneofWrapperField(this, 67, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCustom = function() {
  return this.setCustom(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCustom = function() {
  return jspb.Message.getField(this, 67) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin anthropic = 68;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getAnthropic = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 68));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setAnthropic = function(value) {
  return jspb.Message.setOneofWrapperField(this, 68, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearAnthropic = function() {
  return this.setAnthropic(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasAnthropic = function() {
  return jspb.Message.getField(this, 68) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin cohere = 69;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getCohere = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 69));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setCohere = function(value) {
  return jspb.Message.setOneofWrapperField(this, 69, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearCohere = function() {
  return this.setCohere(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasCohere = function() {
  return jspb.Message.getField(this, 69) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin fireworks = 70;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getFireworks = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 70));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setFireworks = function(value) {
  return jspb.Message.setOneofWrapperField(this, 70, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearFireworks = function() {
  return this.setFireworks(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasFireworks = function() {
  return jspb.Message.getField(this, 70) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin mistral = 71;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getMistral = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 71));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setMistral = function(value) {
  return jspb.Message.setOneofWrapperField(this, 71, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearMistral = function() {
  return this.setMistral(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasMistral = function() {
  return jspb.Message.getField(this, 71) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin groq = 72;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGroq = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 72));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGroq = function(value) {
  return jspb.Message.setOneofWrapperField(this, 72, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGroq = function() {
  return this.setGroq(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGroq = function() {
  return jspb.Message.getField(this, 72) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin perplexity = 73;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getPerplexity = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 73));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setPerplexity = function(value) {
  return jspb.Message.setOneofWrapperField(this, 73, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearPerplexity = function() {
  return this.setPerplexity(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasPerplexity = function() {
  return jspb.Message.getField(this, 73) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin stabilityai = 74;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getStabilityai = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 74));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setStabilityai = function(value) {
  return jspb.Message.setOneofWrapperField(this, 74, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearStabilityai = function() {
  return this.setStabilityai(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasStabilityai = function() {
  return jspb.Message.getField(this, 74) != null;
};


/**
 * optional plugins.restapiintegration.v1.Plugin gemini = 75;
 * @return {?proto.plugins.restapiintegration.v1.Plugin}
 */
proto.api.v1.Step.prototype.getGemini = function() {
  return /** @type{?proto.plugins.restapiintegration.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_restapiintegration_v1_plugin_pb.Plugin, 75));
};


/**
 * @param {?proto.plugins.restapiintegration.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setGemini = function(value) {
  return jspb.Message.setOneofWrapperField(this, 75, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearGemini = function() {
  return this.setGemini(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasGemini = function() {
  return jspb.Message.getField(this, 75) != null;
};


/**
 * optional plugins.kinesis.v1.Plugin kinesis = 76;
 * @return {?proto.plugins.kinesis.v1.Plugin}
 */
proto.api.v1.Step.prototype.getKinesis = function() {
  return /** @type{?proto.plugins.kinesis.v1.Plugin} */ (
    jspb.Message.getWrapperField(this, plugins_kinesis_v1_plugin_pb.Plugin, 76));
};


/**
 * @param {?proto.plugins.kinesis.v1.Plugin|undefined} value
 * @return {!proto.api.v1.Step} returns this
*/
proto.api.v1.Step.prototype.setKinesis = function(value) {
  return jspb.Message.setOneofWrapperField(this, 76, proto.api.v1.Step.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.api.v1.Step} returns this
 */
proto.api.v1.Step.prototype.clearKinesis = function() {
  return this.setKinesis(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.api.v1.Step.prototype.hasKinesis = function() {
  return jspb.Message.getField(this, 76) != null;
};


/**
 * @enum {number}
 */
proto.api.v1.AuthorizationType = {
  AUTHORIZATION_TYPE_UNSPECIFIED: 0,
  AUTHORIZATION_TYPE_APP_USERS: 1,
  AUTHORIZATION_TYPE_JS_EXPRESSION: 2
};

goog.object.extend(exports, proto.api.v1);
