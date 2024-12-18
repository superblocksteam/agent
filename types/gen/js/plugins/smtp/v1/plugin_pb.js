// source: plugins/smtp/v1/plugin.proto
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

var plugins_common_v1_plugin_pb = require('../../../plugins/common/v1/plugin_pb');
goog.object.extend(proto, plugins_common_v1_plugin_pb);
goog.exportSymbol('proto.plugins.smtp.v1.Plugin', null, global);
goog.exportSymbol('proto.plugins.smtp.v1.Plugin.SmtpConnection', null, global);
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
proto.plugins.smtp.v1.Plugin = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.plugins.smtp.v1.Plugin, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.plugins.smtp.v1.Plugin.displayName = 'proto.plugins.smtp.v1.Plugin';
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
proto.plugins.smtp.v1.Plugin.SmtpConnection = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.plugins.smtp.v1.Plugin.SmtpConnection, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.plugins.smtp.v1.Plugin.SmtpConnection.displayName = 'proto.plugins.smtp.v1.Plugin.SmtpConnection';
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
proto.plugins.smtp.v1.Plugin.prototype.toObject = function(opt_includeInstance) {
  return proto.plugins.smtp.v1.Plugin.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.plugins.smtp.v1.Plugin} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.smtp.v1.Plugin.toObject = function(includeInstance, msg) {
  var f, obj = {
name: (f = jspb.Message.getField(msg, 1)) == null ? undefined : f,
connection: (f = msg.getConnection()) && proto.plugins.smtp.v1.Plugin.SmtpConnection.toObject(includeInstance, f),
from: jspb.Message.getFieldWithDefault(msg, 3, ""),
replyTo: jspb.Message.getFieldWithDefault(msg, 4, ""),
to: jspb.Message.getFieldWithDefault(msg, 5, ""),
cc: jspb.Message.getFieldWithDefault(msg, 6, ""),
bcc: jspb.Message.getFieldWithDefault(msg, 7, ""),
subject: jspb.Message.getFieldWithDefault(msg, 8, ""),
body: jspb.Message.getFieldWithDefault(msg, 9, ""),
attachments: jspb.Message.getFieldWithDefault(msg, 10, ""),
dynamicWorkflowConfiguration: (f = msg.getDynamicWorkflowConfiguration()) && plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.toObject(includeInstance, f)
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
 * @return {!proto.plugins.smtp.v1.Plugin}
 */
proto.plugins.smtp.v1.Plugin.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.plugins.smtp.v1.Plugin;
  return proto.plugins.smtp.v1.Plugin.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.plugins.smtp.v1.Plugin} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.plugins.smtp.v1.Plugin}
 */
proto.plugins.smtp.v1.Plugin.deserializeBinaryFromReader = function(msg, reader) {
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
      var value = new proto.plugins.smtp.v1.Plugin.SmtpConnection;
      reader.readMessage(value,proto.plugins.smtp.v1.Plugin.SmtpConnection.deserializeBinaryFromReader);
      msg.setConnection(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setFrom(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setReplyTo(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setTo(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setCc(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setBcc(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setSubject(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setBody(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setAttachments(value);
      break;
    case 11:
      var value = new plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration;
      reader.readMessage(value,plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.deserializeBinaryFromReader);
      msg.setDynamicWorkflowConfiguration(value);
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
proto.plugins.smtp.v1.Plugin.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.plugins.smtp.v1.Plugin.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.plugins.smtp.v1.Plugin} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.smtp.v1.Plugin.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getConnection();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.plugins.smtp.v1.Plugin.SmtpConnection.serializeBinaryToWriter
    );
  }
  f = message.getFrom();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getReplyTo();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getTo();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getCc();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getBcc();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getSubject();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getBody();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getAttachments();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getDynamicWorkflowConfiguration();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.serializeBinaryToWriter
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
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.toObject = function(opt_includeInstance) {
  return proto.plugins.smtp.v1.Plugin.SmtpConnection.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.plugins.smtp.v1.Plugin.SmtpConnection} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.toObject = function(includeInstance, msg) {
  var f, obj = {
host: jspb.Message.getFieldWithDefault(msg, 1, ""),
port: jspb.Message.getFieldWithDefault(msg, 2, 0),
username: jspb.Message.getFieldWithDefault(msg, 3, ""),
password: jspb.Message.getFieldWithDefault(msg, 4, ""),
secure: (f = jspb.Message.getBooleanField(msg, 5)) == null ? undefined : f
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
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.plugins.smtp.v1.Plugin.SmtpConnection;
  return proto.plugins.smtp.v1.Plugin.SmtpConnection.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.plugins.smtp.v1.Plugin.SmtpConnection} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setHost(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPort(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSecure(value);
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
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.plugins.smtp.v1.Plugin.SmtpConnection.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.plugins.smtp.v1.Plugin.SmtpConnection} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHost();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPort();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeBool(
      5,
      f
    );
  }
};


/**
 * optional string host = 1;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.getHost = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.setHost = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 port = 2;
 * @return {number}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.getPort = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.setPort = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string username = 3;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string password = 4;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional bool secure = 5;
 * @return {boolean}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.getSecure = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.setSecure = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.smtp.v1.Plugin.SmtpConnection} returns this
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.clearSecure = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.smtp.v1.Plugin.SmtpConnection.prototype.hasSecure = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setName = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.clearName = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.smtp.v1.Plugin.prototype.hasName = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional SmtpConnection connection = 2;
 * @return {?proto.plugins.smtp.v1.Plugin.SmtpConnection}
 */
proto.plugins.smtp.v1.Plugin.prototype.getConnection = function() {
  return /** @type{?proto.plugins.smtp.v1.Plugin.SmtpConnection} */ (
    jspb.Message.getWrapperField(this, proto.plugins.smtp.v1.Plugin.SmtpConnection, 2));
};


/**
 * @param {?proto.plugins.smtp.v1.Plugin.SmtpConnection|undefined} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
*/
proto.plugins.smtp.v1.Plugin.prototype.setConnection = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.clearConnection = function() {
  return this.setConnection(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.smtp.v1.Plugin.prototype.hasConnection = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional string from = 3;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getFrom = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setFrom = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string reply_to = 4;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getReplyTo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setReplyTo = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string to = 5;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getTo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setTo = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string cc = 6;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getCc = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setCc = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string bcc = 7;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getBcc = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setBcc = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional string subject = 8;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getSubject = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setSubject = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional string body = 9;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getBody = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setBody = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional string attachments = 10;
 * @return {string}
 */
proto.plugins.smtp.v1.Plugin.prototype.getAttachments = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.setAttachments = function(value) {
  return jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional plugins.common.v1.DynamicWorkflowConfiguration dynamic_workflow_configuration = 11;
 * @return {?proto.plugins.common.v1.DynamicWorkflowConfiguration}
 */
proto.plugins.smtp.v1.Plugin.prototype.getDynamicWorkflowConfiguration = function() {
  return /** @type{?proto.plugins.common.v1.DynamicWorkflowConfiguration} */ (
    jspb.Message.getWrapperField(this, plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration, 11));
};


/**
 * @param {?proto.plugins.common.v1.DynamicWorkflowConfiguration|undefined} value
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
*/
proto.plugins.smtp.v1.Plugin.prototype.setDynamicWorkflowConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.plugins.smtp.v1.Plugin} returns this
 */
proto.plugins.smtp.v1.Plugin.prototype.clearDynamicWorkflowConfiguration = function() {
  return this.setDynamicWorkflowConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.smtp.v1.Plugin.prototype.hasDynamicWorkflowConfiguration = function() {
  return jspb.Message.getField(this, 11) != null;
};


goog.object.extend(exports, proto.plugins.smtp.v1);
