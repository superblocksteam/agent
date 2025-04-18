// source: security/v1/requests.proto
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

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb');
goog.object.extend(proto, google_protobuf_timestamp_pb);
var security_v1_service_pb = require('../../security/v1/service_pb');
goog.object.extend(proto, security_v1_service_pb);
goog.exportSymbol('proto.security.v1.KeyRotation', null, global);
goog.exportSymbol('proto.security.v1.KeyRotationStatus', null, global);
goog.exportSymbol('proto.security.v1.KeyRotationsResponse', null, global);
goog.exportSymbol('proto.security.v1.ResourcesToResignRequest', null, global);
goog.exportSymbol('proto.security.v1.ResourcesToResignResponse', null, global);
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
proto.security.v1.ResourcesToResignRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.security.v1.ResourcesToResignRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.security.v1.ResourcesToResignRequest.displayName = 'proto.security.v1.ResourcesToResignRequest';
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
proto.security.v1.ResourcesToResignResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.security.v1.ResourcesToResignResponse.repeatedFields_, null);
};
goog.inherits(proto.security.v1.ResourcesToResignResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.security.v1.ResourcesToResignResponse.displayName = 'proto.security.v1.ResourcesToResignResponse';
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
proto.security.v1.KeyRotation = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.security.v1.KeyRotation, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.security.v1.KeyRotation.displayName = 'proto.security.v1.KeyRotation';
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
proto.security.v1.KeyRotationsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.security.v1.KeyRotationsResponse.repeatedFields_, null);
};
goog.inherits(proto.security.v1.KeyRotationsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.security.v1.KeyRotationsResponse.displayName = 'proto.security.v1.KeyRotationsResponse';
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
proto.security.v1.ResourcesToResignRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.security.v1.ResourcesToResignRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.security.v1.ResourcesToResignRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.ResourcesToResignRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
claimedBy: jspb.Message.getFieldWithDefault(msg, 1, ""),
limit: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.security.v1.ResourcesToResignRequest}
 */
proto.security.v1.ResourcesToResignRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.security.v1.ResourcesToResignRequest;
  return proto.security.v1.ResourcesToResignRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.security.v1.ResourcesToResignRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.security.v1.ResourcesToResignRequest}
 */
proto.security.v1.ResourcesToResignRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setClaimedBy(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setLimit(value);
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
proto.security.v1.ResourcesToResignRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.security.v1.ResourcesToResignRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.security.v1.ResourcesToResignRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.ResourcesToResignRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getClaimedBy();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLimit();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string claimed_by = 1;
 * @return {string}
 */
proto.security.v1.ResourcesToResignRequest.prototype.getClaimedBy = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.security.v1.ResourcesToResignRequest} returns this
 */
proto.security.v1.ResourcesToResignRequest.prototype.setClaimedBy = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 limit = 2;
 * @return {number}
 */
proto.security.v1.ResourcesToResignRequest.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.security.v1.ResourcesToResignRequest} returns this
 */
proto.security.v1.ResourcesToResignRequest.prototype.setLimit = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.security.v1.ResourcesToResignResponse.repeatedFields_ = [1];



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
proto.security.v1.ResourcesToResignResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.security.v1.ResourcesToResignResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.security.v1.ResourcesToResignResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.ResourcesToResignResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
resourcesList: jspb.Message.toObjectList(msg.getResourcesList(),
    security_v1_service_pb.Resource.toObject, includeInstance)
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
 * @return {!proto.security.v1.ResourcesToResignResponse}
 */
proto.security.v1.ResourcesToResignResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.security.v1.ResourcesToResignResponse;
  return proto.security.v1.ResourcesToResignResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.security.v1.ResourcesToResignResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.security.v1.ResourcesToResignResponse}
 */
proto.security.v1.ResourcesToResignResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new security_v1_service_pb.Resource;
      reader.readMessage(value,security_v1_service_pb.Resource.deserializeBinaryFromReader);
      msg.addResources(value);
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
proto.security.v1.ResourcesToResignResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.security.v1.ResourcesToResignResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.security.v1.ResourcesToResignResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.ResourcesToResignResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResourcesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      security_v1_service_pb.Resource.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Resource resources = 1;
 * @return {!Array<!proto.security.v1.Resource>}
 */
proto.security.v1.ResourcesToResignResponse.prototype.getResourcesList = function() {
  return /** @type{!Array<!proto.security.v1.Resource>} */ (
    jspb.Message.getRepeatedWrapperField(this, security_v1_service_pb.Resource, 1));
};


/**
 * @param {!Array<!proto.security.v1.Resource>} value
 * @return {!proto.security.v1.ResourcesToResignResponse} returns this
*/
proto.security.v1.ResourcesToResignResponse.prototype.setResourcesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.security.v1.Resource=} opt_value
 * @param {number=} opt_index
 * @return {!proto.security.v1.Resource}
 */
proto.security.v1.ResourcesToResignResponse.prototype.addResources = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.security.v1.Resource, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.security.v1.ResourcesToResignResponse} returns this
 */
proto.security.v1.ResourcesToResignResponse.prototype.clearResourcesList = function() {
  return this.setResourcesList([]);
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
proto.security.v1.KeyRotation.prototype.toObject = function(opt_includeInstance) {
  return proto.security.v1.KeyRotation.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.security.v1.KeyRotation} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.KeyRotation.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
status: jspb.Message.getFieldWithDefault(msg, 2, 0),
resourcesCompleted: jspb.Message.getFieldWithDefault(msg, 3, 0),
resourcesTotal: jspb.Message.getFieldWithDefault(msg, 4, 0),
signingKeyId: jspb.Message.getFieldWithDefault(msg, 5, ""),
created: (f = msg.getCreated()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
updated: (f = msg.getUpdated()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
completed: (f = msg.getCompleted()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
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
 * @return {!proto.security.v1.KeyRotation}
 */
proto.security.v1.KeyRotation.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.security.v1.KeyRotation;
  return proto.security.v1.KeyRotation.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.security.v1.KeyRotation} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.security.v1.KeyRotation}
 */
proto.security.v1.KeyRotation.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {!proto.security.v1.KeyRotationStatus} */ (reader.readEnum());
      msg.setStatus(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setResourcesCompleted(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setResourcesTotal(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setSigningKeyId(value);
      break;
    case 6:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreated(value);
      break;
    case 7:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setUpdated(value);
      break;
    case 8:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCompleted(value);
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
proto.security.v1.KeyRotation.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.security.v1.KeyRotation.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.security.v1.KeyRotation} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.KeyRotation.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStatus();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getResourcesCompleted();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getResourcesTotal();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getSigningKeyId();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getCreated();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getUpdated();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getCompleted();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.security.v1.KeyRotation.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional KeyRotationStatus status = 2;
 * @return {!proto.security.v1.KeyRotationStatus}
 */
proto.security.v1.KeyRotation.prototype.getStatus = function() {
  return /** @type {!proto.security.v1.KeyRotationStatus} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.security.v1.KeyRotationStatus} value
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.setStatus = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional int32 resources_completed = 3;
 * @return {number}
 */
proto.security.v1.KeyRotation.prototype.getResourcesCompleted = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.setResourcesCompleted = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int32 resources_total = 4;
 * @return {number}
 */
proto.security.v1.KeyRotation.prototype.getResourcesTotal = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.setResourcesTotal = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string signing_key_id = 5;
 * @return {string}
 */
proto.security.v1.KeyRotation.prototype.getSigningKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.setSigningKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional google.protobuf.Timestamp created = 6;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.security.v1.KeyRotation.prototype.getCreated = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 6));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.security.v1.KeyRotation} returns this
*/
proto.security.v1.KeyRotation.prototype.setCreated = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.clearCreated = function() {
  return this.setCreated(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.security.v1.KeyRotation.prototype.hasCreated = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional google.protobuf.Timestamp updated = 7;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.security.v1.KeyRotation.prototype.getUpdated = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 7));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.security.v1.KeyRotation} returns this
*/
proto.security.v1.KeyRotation.prototype.setUpdated = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.clearUpdated = function() {
  return this.setUpdated(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.security.v1.KeyRotation.prototype.hasUpdated = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional google.protobuf.Timestamp completed = 8;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.security.v1.KeyRotation.prototype.getCompleted = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 8));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.security.v1.KeyRotation} returns this
*/
proto.security.v1.KeyRotation.prototype.setCompleted = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.security.v1.KeyRotation} returns this
 */
proto.security.v1.KeyRotation.prototype.clearCompleted = function() {
  return this.setCompleted(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.security.v1.KeyRotation.prototype.hasCompleted = function() {
  return jspb.Message.getField(this, 8) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.security.v1.KeyRotationsResponse.repeatedFields_ = [1];



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
proto.security.v1.KeyRotationsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.security.v1.KeyRotationsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.security.v1.KeyRotationsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.KeyRotationsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
keyRotationsList: jspb.Message.toObjectList(msg.getKeyRotationsList(),
    proto.security.v1.KeyRotation.toObject, includeInstance)
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
 * @return {!proto.security.v1.KeyRotationsResponse}
 */
proto.security.v1.KeyRotationsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.security.v1.KeyRotationsResponse;
  return proto.security.v1.KeyRotationsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.security.v1.KeyRotationsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.security.v1.KeyRotationsResponse}
 */
proto.security.v1.KeyRotationsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.security.v1.KeyRotation;
      reader.readMessage(value,proto.security.v1.KeyRotation.deserializeBinaryFromReader);
      msg.addKeyRotations(value);
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
proto.security.v1.KeyRotationsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.security.v1.KeyRotationsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.security.v1.KeyRotationsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.security.v1.KeyRotationsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKeyRotationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.security.v1.KeyRotation.serializeBinaryToWriter
    );
  }
};


/**
 * repeated KeyRotation key_rotations = 1;
 * @return {!Array<!proto.security.v1.KeyRotation>}
 */
proto.security.v1.KeyRotationsResponse.prototype.getKeyRotationsList = function() {
  return /** @type{!Array<!proto.security.v1.KeyRotation>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.security.v1.KeyRotation, 1));
};


/**
 * @param {!Array<!proto.security.v1.KeyRotation>} value
 * @return {!proto.security.v1.KeyRotationsResponse} returns this
*/
proto.security.v1.KeyRotationsResponse.prototype.setKeyRotationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.security.v1.KeyRotation=} opt_value
 * @param {number=} opt_index
 * @return {!proto.security.v1.KeyRotation}
 */
proto.security.v1.KeyRotationsResponse.prototype.addKeyRotations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.security.v1.KeyRotation, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.security.v1.KeyRotationsResponse} returns this
 */
proto.security.v1.KeyRotationsResponse.prototype.clearKeyRotationsList = function() {
  return this.setKeyRotationsList([]);
};


/**
 * @enum {number}
 */
proto.security.v1.KeyRotationStatus = {
  KEY_ROTATION_STATUS_UNSPECIFIED: 0,
  KEY_ROTATION_STATUS_IN_PROGRESS: 1,
  KEY_ROTATION_STATUS_COMPLETED: 2,
  KEY_ROTATION_STATUS_FAILED: 3,
  KEY_ROTATION_STATUS_CANCELED: 4
};

goog.object.extend(exports, proto.security.v1);
