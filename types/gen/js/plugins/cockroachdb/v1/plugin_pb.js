// source: plugins/cockroachdb/v1/plugin.proto
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

goog.exportSymbol('proto.plugins.cockroachdb.v1.MappedColumns', null, global);
goog.exportSymbol('proto.plugins.cockroachdb.v1.Plugin', null, global);
goog.exportSymbol('proto.plugins.cockroachdb.v1.SuperblocksMetadata', null, global);
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
proto.plugins.cockroachdb.v1.MappedColumns = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.plugins.cockroachdb.v1.MappedColumns, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.plugins.cockroachdb.v1.MappedColumns.displayName = 'proto.plugins.cockroachdb.v1.MappedColumns';
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
proto.plugins.cockroachdb.v1.SuperblocksMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.plugins.cockroachdb.v1.SuperblocksMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.plugins.cockroachdb.v1.SuperblocksMetadata.displayName = 'proto.plugins.cockroachdb.v1.SuperblocksMetadata';
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
proto.plugins.cockroachdb.v1.Plugin = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.plugins.cockroachdb.v1.Plugin.repeatedFields_, null);
};
goog.inherits(proto.plugins.cockroachdb.v1.Plugin, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.plugins.cockroachdb.v1.Plugin.displayName = 'proto.plugins.cockroachdb.v1.Plugin';
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
proto.plugins.cockroachdb.v1.MappedColumns.prototype.toObject = function(opt_includeInstance) {
  return proto.plugins.cockroachdb.v1.MappedColumns.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.plugins.cockroachdb.v1.MappedColumns} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.MappedColumns.toObject = function(includeInstance, msg) {
  var f, obj = {
json: jspb.Message.getFieldWithDefault(msg, 1, ""),
sql: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.plugins.cockroachdb.v1.MappedColumns}
 */
proto.plugins.cockroachdb.v1.MappedColumns.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.plugins.cockroachdb.v1.MappedColumns;
  return proto.plugins.cockroachdb.v1.MappedColumns.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.plugins.cockroachdb.v1.MappedColumns} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.plugins.cockroachdb.v1.MappedColumns}
 */
proto.plugins.cockroachdb.v1.MappedColumns.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setJson(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setSql(value);
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
proto.plugins.cockroachdb.v1.MappedColumns.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.plugins.cockroachdb.v1.MappedColumns.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.plugins.cockroachdb.v1.MappedColumns} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.MappedColumns.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJson();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getSql();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string json = 1;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.MappedColumns.prototype.getJson = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.MappedColumns} returns this
 */
proto.plugins.cockroachdb.v1.MappedColumns.prototype.setJson = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string sql = 2;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.MappedColumns.prototype.getSql = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.MappedColumns} returns this
 */
proto.plugins.cockroachdb.v1.MappedColumns.prototype.setSql = function(value) {
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
proto.plugins.cockroachdb.v1.SuperblocksMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.plugins.cockroachdb.v1.SuperblocksMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.plugins.cockroachdb.v1.SuperblocksMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
pluginversion: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.plugins.cockroachdb.v1.SuperblocksMetadata}
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.plugins.cockroachdb.v1.SuperblocksMetadata;
  return proto.plugins.cockroachdb.v1.SuperblocksMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.plugins.cockroachdb.v1.SuperblocksMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.plugins.cockroachdb.v1.SuperblocksMetadata}
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPluginversion(value);
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
proto.plugins.cockroachdb.v1.SuperblocksMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.plugins.cockroachdb.v1.SuperblocksMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.plugins.cockroachdb.v1.SuperblocksMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPluginversion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string pluginVersion = 1;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.prototype.getPluginversion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.SuperblocksMetadata} returns this
 */
proto.plugins.cockroachdb.v1.SuperblocksMetadata.prototype.setPluginversion = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.plugins.cockroachdb.v1.Plugin.repeatedFields_ = [8,10];



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
proto.plugins.cockroachdb.v1.Plugin.prototype.toObject = function(opt_includeInstance) {
  return proto.plugins.cockroachdb.v1.Plugin.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.plugins.cockroachdb.v1.Plugin} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.Plugin.toObject = function(includeInstance, msg) {
  var f, obj = {
body: jspb.Message.getFieldWithDefault(msg, 1, ""),
usepreparedsql: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
operation: (f = jspb.Message.getField(msg, 3)) == null ? undefined : f,
useadvancedmatching: (f = jspb.Message.getField(msg, 4)) == null ? undefined : f,
table: (f = jspb.Message.getField(msg, 5)) == null ? undefined : f,
newvalues: (f = jspb.Message.getField(msg, 6)) == null ? undefined : f,
oldvalues: (f = jspb.Message.getField(msg, 7)) == null ? undefined : f,
filterbyList: (f = jspb.Message.getRepeatedField(msg, 8)) == null ? undefined : f,
mappingmode: (f = jspb.Message.getField(msg, 9)) == null ? undefined : f,
mappedcolumnsList: jspb.Message.toObjectList(msg.getMappedcolumnsList(),
    proto.plugins.cockroachdb.v1.MappedColumns.toObject, includeInstance),
superblocksmetadata: (f = msg.getSuperblocksmetadata()) && proto.plugins.cockroachdb.v1.SuperblocksMetadata.toObject(includeInstance, f),
insertedrows: (f = jspb.Message.getField(msg, 12)) == null ? undefined : f,
deletedrows: (f = jspb.Message.getField(msg, 13)) == null ? undefined : f,
schema: (f = jspb.Message.getField(msg, 14)) == null ? undefined : f
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
 * @return {!proto.plugins.cockroachdb.v1.Plugin}
 */
proto.plugins.cockroachdb.v1.Plugin.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.plugins.cockroachdb.v1.Plugin;
  return proto.plugins.cockroachdb.v1.Plugin.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.plugins.cockroachdb.v1.Plugin} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.plugins.cockroachdb.v1.Plugin}
 */
proto.plugins.cockroachdb.v1.Plugin.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBody(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setUsepreparedsql(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOperation(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setUseadvancedmatching(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setTable(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewvalues(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setOldvalues(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.addFilterby(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setMappingmode(value);
      break;
    case 10:
      var value = new proto.plugins.cockroachdb.v1.MappedColumns;
      reader.readMessage(value,proto.plugins.cockroachdb.v1.MappedColumns.deserializeBinaryFromReader);
      msg.addMappedcolumns(value);
      break;
    case 11:
      var value = new proto.plugins.cockroachdb.v1.SuperblocksMetadata;
      reader.readMessage(value,proto.plugins.cockroachdb.v1.SuperblocksMetadata.deserializeBinaryFromReader);
      msg.setSuperblocksmetadata(value);
      break;
    case 12:
      var value = /** @type {string} */ (reader.readString());
      msg.setInsertedrows(value);
      break;
    case 13:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeletedrows(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
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
proto.plugins.cockroachdb.v1.Plugin.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.plugins.cockroachdb.v1.Plugin.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.plugins.cockroachdb.v1.Plugin} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.plugins.cockroachdb.v1.Plugin.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBody();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUsepreparedsql();
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
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
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
  f = message.getFilterbyList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      8,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 9));
  if (f != null) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getMappedcolumnsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      10,
      f,
      proto.plugins.cockroachdb.v1.MappedColumns.serializeBinaryToWriter
    );
  }
  f = message.getSuperblocksmetadata();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      proto.plugins.cockroachdb.v1.SuperblocksMetadata.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 12));
  if (f != null) {
    writer.writeString(
      12,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 13));
  if (f != null) {
    writer.writeString(
      13,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 14));
  if (f != null) {
    writer.writeString(
      14,
      f
    );
  }
};


/**
 * optional string body = 1;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getBody = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setBody = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bool usePreparedSql = 2;
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getUsepreparedsql = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setUsepreparedsql = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional string operation = 3;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getOperation = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setOperation = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearOperation = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasOperation = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional string useAdvancedMatching = 4;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getUseadvancedmatching = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setUseadvancedmatching = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearUseadvancedmatching = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasUseadvancedmatching = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional string table = 5;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getTable = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setTable = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearTable = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasTable = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string newValues = 6;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getNewvalues = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setNewvalues = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearNewvalues = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasNewvalues = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional string oldValues = 7;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getOldvalues = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setOldvalues = function(value) {
  return jspb.Message.setField(this, 7, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearOldvalues = function() {
  return jspb.Message.setField(this, 7, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasOldvalues = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * repeated string filterBy = 8;
 * @return {!Array<string>}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getFilterbyList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 8));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setFilterbyList = function(value) {
  return jspb.Message.setField(this, 8, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.addFilterby = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 8, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearFilterbyList = function() {
  return this.setFilterbyList([]);
};


/**
 * optional string mappingMode = 9;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getMappingmode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setMappingmode = function(value) {
  return jspb.Message.setField(this, 9, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearMappingmode = function() {
  return jspb.Message.setField(this, 9, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasMappingmode = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * repeated MappedColumns mappedColumns = 10;
 * @return {!Array<!proto.plugins.cockroachdb.v1.MappedColumns>}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getMappedcolumnsList = function() {
  return /** @type{!Array<!proto.plugins.cockroachdb.v1.MappedColumns>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.plugins.cockroachdb.v1.MappedColumns, 10));
};


/**
 * @param {!Array<!proto.plugins.cockroachdb.v1.MappedColumns>} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
*/
proto.plugins.cockroachdb.v1.Plugin.prototype.setMappedcolumnsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 10, value);
};


/**
 * @param {!proto.plugins.cockroachdb.v1.MappedColumns=} opt_value
 * @param {number=} opt_index
 * @return {!proto.plugins.cockroachdb.v1.MappedColumns}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.addMappedcolumns = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 10, opt_value, proto.plugins.cockroachdb.v1.MappedColumns, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearMappedcolumnsList = function() {
  return this.setMappedcolumnsList([]);
};


/**
 * optional SuperblocksMetadata superblocksMetadata = 11;
 * @return {?proto.plugins.cockroachdb.v1.SuperblocksMetadata}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getSuperblocksmetadata = function() {
  return /** @type{?proto.plugins.cockroachdb.v1.SuperblocksMetadata} */ (
    jspb.Message.getWrapperField(this, proto.plugins.cockroachdb.v1.SuperblocksMetadata, 11));
};


/**
 * @param {?proto.plugins.cockroachdb.v1.SuperblocksMetadata|undefined} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
*/
proto.plugins.cockroachdb.v1.Plugin.prototype.setSuperblocksmetadata = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearSuperblocksmetadata = function() {
  return this.setSuperblocksmetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasSuperblocksmetadata = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional string insertedRows = 12;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getInsertedrows = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 12, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setInsertedrows = function(value) {
  return jspb.Message.setField(this, 12, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearInsertedrows = function() {
  return jspb.Message.setField(this, 12, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasInsertedrows = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional string deletedRows = 13;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getDeletedrows = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 13, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setDeletedrows = function(value) {
  return jspb.Message.setField(this, 13, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearDeletedrows = function() {
  return jspb.Message.setField(this, 13, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasDeletedrows = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional string schema = 14;
 * @return {string}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.getSchema = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/**
 * @param {string} value
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.setSchema = function(value) {
  return jspb.Message.setField(this, 14, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.plugins.cockroachdb.v1.Plugin} returns this
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.clearSchema = function() {
  return jspb.Message.setField(this, 14, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.plugins.cockroachdb.v1.Plugin.prototype.hasSchema = function() {
  return jspb.Message.getField(this, 14) != null;
};


goog.object.extend(exports, proto.plugins.cockroachdb.v1);
