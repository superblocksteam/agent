"use strict";
// Copyright 2023 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampRules = exports.DurationRules = exports.AnyRules = exports.MapRules = exports.RepeatedRules = exports.EnumRules = exports.BytesRules = exports.StringRules = exports.BoolRules = exports.SFixed64Rules = exports.SFixed32Rules = exports.Fixed64Rules = exports.Fixed32Rules = exports.SInt64Rules = exports.SInt32Rules = exports.UInt64Rules = exports.UInt32Rules = exports.Int64Rules = exports.Int32Rules = exports.DoubleRules = exports.FloatRules = exports.FieldConstraints = exports.OneofConstraints = exports.MessageConstraints = exports.KnownRegex = void 0;
const protobuf_1 = require("@bufbuild/protobuf");
const expression_pb_1 = require("./expression_pb");
/**
 * WellKnownRegex contain some well-known patterns.
 *
 * @generated from enum buf.validate.KnownRegex
 */
var KnownRegex;
(function (KnownRegex) {
    /**
     * @generated from enum value: KNOWN_REGEX_UNSPECIFIED = 0;
     */
    KnownRegex[KnownRegex["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    /**
     * HTTP header name as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2).
     *
     * @generated from enum value: KNOWN_REGEX_HTTP_HEADER_NAME = 1;
     */
    KnownRegex[KnownRegex["HTTP_HEADER_NAME"] = 1] = "HTTP_HEADER_NAME";
    /**
     * HTTP header value as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2.4).
     *
     * @generated from enum value: KNOWN_REGEX_HTTP_HEADER_VALUE = 2;
     */
    KnownRegex[KnownRegex["HTTP_HEADER_VALUE"] = 2] = "HTTP_HEADER_VALUE";
})(KnownRegex || (exports.KnownRegex = KnownRegex = {}));
// Retrieve enum metadata with: proto3.getEnumType(KnownRegex)
protobuf_1.proto3.util.setEnumType(KnownRegex, "buf.validate.KnownRegex", [
    { no: 0, name: "KNOWN_REGEX_UNSPECIFIED" },
    { no: 1, name: "KNOWN_REGEX_HTTP_HEADER_NAME" },
    { no: 2, name: "KNOWN_REGEX_HTTP_HEADER_VALUE" },
]);
/**
 * MessageConstraints represents validation rules that are applied to the entire message.
 * It includes disabling options and a list of Constraint messages representing Common Expression Language (CEL) validation rules.
 *
 * @generated from message buf.validate.MessageConstraints
 */
class MessageConstraints extends protobuf_1.Message {
    /**
     * `disabled` is a boolean flag that, when set to true, nullifies any validation rules for this message.
     * This includes any fields within the message that would otherwise support validation.
     *
     * ```proto
     * message MyMessage {
     *   // validation will be bypassed for this message
     *   option (buf.validate.message).disabled = true;
     * }
     * ```
     *
     * @generated from field: optional bool disabled = 1;
     */
    disabled;
    /**
     * `cel` is a repeated field of type Constraint. Each Constraint specifies a validation rule to be applied to this message.
     * These constraints are written in Common Expression Language (CEL) syntax. For more information on
     * CEL, [see our documentation](https://github.com/bufbuild/protovalidate/blob/main/docs/cel.md).
     *
     *
     * ```proto
     * message MyMessage {
     *   // The field `foo` must be greater than 42.
     *   option (buf.validate.message).cel = {
     *     id: "my_message.value",
     *     message: "value must be greater than 42",
     *     expression: "this.foo > 42",
     *   };
     *   optional int32 foo = 1;
     * }
     * ```
     *
     * @generated from field: repeated buf.validate.Constraint cel = 3;
     */
    cel = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.MessageConstraints";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "disabled", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
        { no: 3, name: "cel", kind: "message", T: expression_pb_1.Constraint, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new MessageConstraints().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new MessageConstraints().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new MessageConstraints().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(MessageConstraints, a, b);
    }
}
exports.MessageConstraints = MessageConstraints;
/**
 * The `OneofConstraints` message type enables you to manage constraints for
 * oneof fields in your protobuf messages.
 *
 * @generated from message buf.validate.OneofConstraints
 */
class OneofConstraints extends protobuf_1.Message {
    /**
     * If `required` is true, exactly one field of the oneof must be present. A
     * validation error is returned if no fields in the oneof are present. The
     * field itself may still be a default value; further constraints
     * should be placed on the fields themselves to ensure they are valid values,
     * such as `min_len` or `gt`.
     *
     * ```proto
     * message MyMessage {
     *   oneof value {
     *     // Either `a` or `b` must be set. If `a` is set, it must also be
     *     // non-empty; whereas if `b` is set, it can still be an empty string.
     *     option (buf.validate.oneof).required = true;
     *     string a = 1 [(buf.validate.field).string.min_len = 1];
     *     string b = 2;
     *   }
     * }
     * ```
     *
     * @generated from field: optional bool required = 1;
     */
    required;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.OneofConstraints";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "required", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new OneofConstraints().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new OneofConstraints().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new OneofConstraints().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(OneofConstraints, a, b);
    }
}
exports.OneofConstraints = OneofConstraints;
/**
 * FieldRules encapsulates the rules for each type of field. Depending on the
 * field, the correct set should be used to ensure proper validations.
 *
 * @generated from message buf.validate.FieldConstraints
 */
class FieldConstraints extends protobuf_1.Message {
    /**
     * `cel` is a repeated field used to represent a textual expression
     * in the Common Expression Language (CEL) syntax. For more information on
     * CEL, [see our documentation](https://github.com/bufbuild/protovalidate/blob/main/docs/cel.md).
     *
     * ```proto
     * message MyMessage {
     *   // The field `value` must be greater than 42.
     *   optional int32 value = 1 [(buf.validate.field).cel = {
     *     id: "my_message.value",
     *     message: "value must be greater than 42",
     *     expression: "this > 42",
     *   }];
     * }
     * ```
     *
     * @generated from field: repeated buf.validate.Constraint cel = 23;
     */
    cel = [];
    /**
     * `skipped` is an optional boolean attribute that specifies that the
     * validation rules of this field should not be evaluated. If skipped is set to
     * true, any validation rules set for the field will be ignored.
     *
     * ```proto
     * message MyMessage {
     *   // The field `value` must not be set.
     *   optional MyOtherMessage value = 1 [(buf.validate.field).skipped = true];
     * }
     * ```
     *
     * @generated from field: bool skipped = 24;
     */
    skipped = false;
    /**
     * If `required` is true, the field must be populated. Field presence can be
     * described as "serialized in the wire format," which follows the following rules:
     *
     * - the following "nullable" fields must be explicitly set to be considered present:
     *   - singular message fields (may be their empty value)
     *   - member fields of a oneof (may be their default value)
     *   - proto3 optional fields (may be their default value)
     *   - proto2 scalar fields
     * - proto3 scalar fields must be non-zero to be considered present
     * - repeated and map fields must be non-empty to be considered present
     *
     * ```proto
     * message MyMessage {
     *   // The field `value` must be set to a non-null value.
     *   optional MyOtherMessage value = 1 [(buf.validate.field).required = true];
     * }
     * ```
     *
     * @generated from field: bool required = 25;
     */
    required = false;
    /**
     * If `ignore_empty` is true and applied to a non-nullable field (see
     * `required` for more details), validation is skipped on the field if it is
     * the default or empty value. Adding `ignore_empty` to a "nullable" field is
     * a noop as these unset fields already skip validation (with the exception
     * of `required`).
     *
     * ```proto
     * message MyRepeated {
     *   // The field `value` min_len rule is only applied if the field isn't empty.
     *   repeated string value = 1 [
     *     (buf.validate.field).ignore_empty = true,
     *     (buf.validate.field).min_len = 5
     *   ];
     * }
     * ```
     *
     * @generated from field: bool ignore_empty = 26;
     */
    ignoreEmpty = false;
    /**
     * @generated from oneof buf.validate.FieldConstraints.type
     */
    type = { case: undefined };
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.FieldConstraints";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 23, name: "cel", kind: "message", T: expression_pb_1.Constraint, repeated: true },
        { no: 24, name: "skipped", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
        { no: 25, name: "required", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
        { no: 26, name: "ignore_empty", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
        { no: 1, name: "float", kind: "message", T: FloatRules, oneof: "type" },
        { no: 2, name: "double", kind: "message", T: DoubleRules, oneof: "type" },
        { no: 3, name: "int32", kind: "message", T: Int32Rules, oneof: "type" },
        { no: 4, name: "int64", kind: "message", T: Int64Rules, oneof: "type" },
        { no: 5, name: "uint32", kind: "message", T: UInt32Rules, oneof: "type" },
        { no: 6, name: "uint64", kind: "message", T: UInt64Rules, oneof: "type" },
        { no: 7, name: "sint32", kind: "message", T: SInt32Rules, oneof: "type" },
        { no: 8, name: "sint64", kind: "message", T: SInt64Rules, oneof: "type" },
        { no: 9, name: "fixed32", kind: "message", T: Fixed32Rules, oneof: "type" },
        { no: 10, name: "fixed64", kind: "message", T: Fixed64Rules, oneof: "type" },
        { no: 11, name: "sfixed32", kind: "message", T: SFixed32Rules, oneof: "type" },
        { no: 12, name: "sfixed64", kind: "message", T: SFixed64Rules, oneof: "type" },
        { no: 13, name: "bool", kind: "message", T: BoolRules, oneof: "type" },
        { no: 14, name: "string", kind: "message", T: StringRules, oneof: "type" },
        { no: 15, name: "bytes", kind: "message", T: BytesRules, oneof: "type" },
        { no: 16, name: "enum", kind: "message", T: EnumRules, oneof: "type" },
        { no: 18, name: "repeated", kind: "message", T: RepeatedRules, oneof: "type" },
        { no: 19, name: "map", kind: "message", T: MapRules, oneof: "type" },
        { no: 20, name: "any", kind: "message", T: AnyRules, oneof: "type" },
        { no: 21, name: "duration", kind: "message", T: DurationRules, oneof: "type" },
        { no: 22, name: "timestamp", kind: "message", T: TimestampRules, oneof: "type" },
    ]);
    static fromBinary(bytes, options) {
        return new FieldConstraints().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new FieldConstraints().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new FieldConstraints().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(FieldConstraints, a, b);
    }
}
exports.FieldConstraints = FieldConstraints;
/**
 * FloatRules describes the constraints applied to `float` values. These
 * rules may also be applied to the `google.protobuf.FloatValue` Well-Known-Type.
 *
 * @generated from message buf.validate.FloatRules
 */
class FloatRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyFloat {
     *   // value must equal 42.0
     *   float value = 1 [(buf.validate.field).float.const = 42.0];
     * }
     * ```
     *
     * @generated from field: optional float const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.FloatRules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.FloatRules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message
     * is generated.
     *
     * ```proto
     * message MyFloat {
     *   // value must be in list [1.0, 2.0, 3.0]
     *   repeated float value = 1 (buf.validate.field).float = { in: [1.0, 2.0, 3.0] };
     * }
     * ```
     *
     * @generated from field: repeated float in = 6;
     */
    in = [];
    /**
     * `in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyFloat {
     *   // value must not be in list [1.0, 2.0, 3.0]
     *   repeated float value = 1 (buf.validate.field).float = { not_in: [1.0, 2.0, 3.0] };
     * }
     * ```
     *
     * @generated from field: repeated float not_in = 7;
     */
    notIn = [];
    /**
     * `finite` requires the field value to be finite. If the field value is
     * infinite or NaN, an error message is generated.
     *
     * @generated from field: bool finite = 8;
     */
    finite = false;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.FloatRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 2 /* ScalarType.FLOAT */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 2 /* ScalarType.FLOAT */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 2 /* ScalarType.FLOAT */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 2 /* ScalarType.FLOAT */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 2 /* ScalarType.FLOAT */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 2 /* ScalarType.FLOAT */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 2 /* ScalarType.FLOAT */, repeated: true },
        { no: 8, name: "finite", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    ]);
    static fromBinary(bytes, options) {
        return new FloatRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new FloatRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new FloatRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(FloatRules, a, b);
    }
}
exports.FloatRules = FloatRules;
/**
 * DoubleRules describes the constraints applied to `double` values. These
 * rules may also be applied to the `google.protobuf.DoubleValue` Well-Known-Type.
 *
 * @generated from message buf.validate.DoubleRules
 */
class DoubleRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyDouble {
     *   // value must equal 42.0
     *   double value = 1 [(buf.validate.field).double.const = 42.0];
     * }
     * ```
     *
     * @generated from field: optional double const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.DoubleRules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.DoubleRules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyDouble {
     *   // value must be in list [1.0, 2.0, 3.0]
     *   repeated double value = 1 (buf.validate.field).double = { in: [1.0, 2.0, 3.0] };
     * }
     * ```
     *
     * @generated from field: repeated double in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyDouble {
     *   // value must not be in list [1.0, 2.0, 3.0]
     *   repeated double value = 1 (buf.validate.field).double = { not_in: [1.0, 2.0, 3.0] };
     * }
     * ```
     *
     * @generated from field: repeated double not_in = 7;
     */
    notIn = [];
    /**
     * `finite` requires the field value to be finite. If the field value is
     * infinite or NaN, an error message is generated.
     *
     * @generated from field: bool finite = 8;
     */
    finite = false;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.DoubleRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, repeated: true },
        { no: 8, name: "finite", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    ]);
    static fromBinary(bytes, options) {
        return new DoubleRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new DoubleRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new DoubleRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(DoubleRules, a, b);
    }
}
exports.DoubleRules = DoubleRules;
/**
 * Int32Rules describes the constraints applied to `int32` values. These
 * rules may also be applied to the `google.protobuf.Int32Value` Well-Known-Type.
 *
 * @generated from message buf.validate.Int32Rules
 */
class Int32Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyInt32 {
     *   // value must equal 42
     *   int32 value = 1 [(buf.validate.field).int32.const = 42];
     * }
     * ```
     *
     * @generated from field: optional int32 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.Int32Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.Int32Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyInt32 {
     *   // value must be in list [1, 2, 3]
     *   repeated int32 value = 1 (buf.validate.field).int32 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated int32 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error message
     * is generated.
     *
     * ```proto
     * message MyInt32 {
     *   // value must not be in list [1, 2, 3]
     *   repeated int32 value = 1 (buf.validate.field).int32 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated int32 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Int32Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new Int32Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Int32Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Int32Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Int32Rules, a, b);
    }
}
exports.Int32Rules = Int32Rules;
/**
 * Int64Rules describes the constraints applied to `int64` values. These
 * rules may also be applied to the `google.protobuf.Int64Value` Well-Known-Type.
 *
 * @generated from message buf.validate.Int64Rules
 */
class Int64Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyInt64 {
     *   // value must equal 42
     *   int64 value = 1 [(buf.validate.field).int64.const = 42];
     * }
     * ```
     *
     * @generated from field: optional int64 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.Int64Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.Int64Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyInt64 {
     *   // value must be in list [1, 2, 3]
     *   repeated int64 value = 1 (buf.validate.field).int64 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated int64 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyInt64 {
     *   // value must not be in list [1, 2, 3]
     *   repeated int64 value = 1 (buf.validate.field).int64 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated int64 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Int64Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 3 /* ScalarType.INT64 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 3 /* ScalarType.INT64 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 3 /* ScalarType.INT64 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new Int64Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Int64Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Int64Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Int64Rules, a, b);
    }
}
exports.Int64Rules = Int64Rules;
/**
 * UInt32Rules describes the constraints applied to `uint32` values. These
 * rules may also be applied to the `google.protobuf.UInt32Value` Well-Known-Type.
 *
 * @generated from message buf.validate.UInt32Rules
 */
class UInt32Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyUInt32 {
     *   // value must equal 42
     *   uint32 value = 1 [(buf.validate.field).uint32.const = 42];
     * }
     * ```
     *
     * @generated from field: optional uint32 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.UInt32Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.UInt32Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyUInt32 {
     *   // value must be in list [1, 2, 3]
     *   repeated uint32 value = 1 (buf.validate.field).uint32 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated uint32 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyUInt32 {
     *   // value must not be in list [1, 2, 3]
     *   repeated uint32 value = 1 (buf.validate.field).uint32 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated uint32 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.UInt32Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 13 /* ScalarType.UINT32 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 13 /* ScalarType.UINT32 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 13 /* ScalarType.UINT32 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 13 /* ScalarType.UINT32 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 13 /* ScalarType.UINT32 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 13 /* ScalarType.UINT32 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 13 /* ScalarType.UINT32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new UInt32Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new UInt32Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new UInt32Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(UInt32Rules, a, b);
    }
}
exports.UInt32Rules = UInt32Rules;
/**
 * UInt64Rules describes the constraints applied to `uint64` values. These
 * rules may also be applied to the `google.protobuf.UInt64Value` Well-Known-Type.
 *
 * @generated from message buf.validate.UInt64Rules
 */
class UInt64Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyUInt64 {
     *   // value must equal 42
     *   uint64 value = 1 [(buf.validate.field).uint64.const = 42];
     * }
     * ```
     *
     * @generated from field: optional uint64 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.UInt64Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.UInt64Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyUInt64 {
     *   // value must be in list [1, 2, 3]
     *   repeated uint64 value = 1 (buf.validate.field).uint64 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated uint64 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyUInt64 {
     *   // value must not be in list [1, 2, 3]
     *   repeated uint64 value = 1 (buf.validate.field).uint64 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated uint64 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.UInt64Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 4 /* ScalarType.UINT64 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 4 /* ScalarType.UINT64 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 4 /* ScalarType.UINT64 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 4 /* ScalarType.UINT64 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 4 /* ScalarType.UINT64 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 4 /* ScalarType.UINT64 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new UInt64Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new UInt64Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new UInt64Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(UInt64Rules, a, b);
    }
}
exports.UInt64Rules = UInt64Rules;
/**
 * SInt32Rules describes the constraints applied to `sint32` values.
 *
 * @generated from message buf.validate.SInt32Rules
 */
class SInt32Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MySInt32 {
     *   // value must equal 42
     *   sint32 value = 1 [(buf.validate.field).sint32.const = 42];
     * }
     * ```
     *
     * @generated from field: optional sint32 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.SInt32Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.SInt32Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MySInt32 {
     *   // value must be in list [1, 2, 3]
     *   repeated sint32 value = 1 (buf.validate.field).sint32 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sint32 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MySInt32 {
     *   // value must not be in list [1, 2, 3]
     *   repeated sint32 value = 1 (buf.validate.field).sint32 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sint32 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.SInt32Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 17 /* ScalarType.SINT32 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 17 /* ScalarType.SINT32 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 17 /* ScalarType.SINT32 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 17 /* ScalarType.SINT32 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 17 /* ScalarType.SINT32 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 17 /* ScalarType.SINT32 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 17 /* ScalarType.SINT32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new SInt32Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new SInt32Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new SInt32Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(SInt32Rules, a, b);
    }
}
exports.SInt32Rules = SInt32Rules;
/**
 * SInt64Rules describes the constraints applied to `sint64` values.
 *
 * @generated from message buf.validate.SInt64Rules
 */
class SInt64Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MySInt64 {
     *   // value must equal 42
     *   sint64 value = 1 [(buf.validate.field).sint64.const = 42];
     * }
     * ```
     *
     * @generated from field: optional sint64 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.SInt64Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.SInt64Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message
     * is generated.
     *
     * ```proto
     * message MySInt64 {
     *   // value must be in list [1, 2, 3]
     *   repeated sint64 value = 1 (buf.validate.field).sint64 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sint64 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MySInt64 {
     *   // value must not be in list [1, 2, 3]
     *   repeated sint64 value = 1 (buf.validate.field).sint64 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sint64 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.SInt64Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 18 /* ScalarType.SINT64 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 18 /* ScalarType.SINT64 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 18 /* ScalarType.SINT64 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 18 /* ScalarType.SINT64 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 18 /* ScalarType.SINT64 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 18 /* ScalarType.SINT64 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 18 /* ScalarType.SINT64 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new SInt64Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new SInt64Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new SInt64Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(SInt64Rules, a, b);
    }
}
exports.SInt64Rules = SInt64Rules;
/**
 * Fixed32Rules describes the constraints applied to `fixed32` values.
 *
 * @generated from message buf.validate.Fixed32Rules
 */
class Fixed32Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value.
     * If the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyFixed32 {
     *   // value must equal 42
     *   fixed32 value = 1 [(buf.validate.field).fixed32.const = 42];
     * }
     * ```
     *
     * @generated from field: optional fixed32 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.Fixed32Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.Fixed32Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message
     * is generated.
     *
     * ```proto
     * message MyFixed32 {
     *   // value must be in list [1, 2, 3]
     *   repeated fixed32 value = 1 (buf.validate.field).fixed32 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated fixed32 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyFixed32 {
     *   // value must not be in list [1, 2, 3]
     *   repeated fixed32 value = 1 (buf.validate.field).fixed32 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated fixed32 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Fixed32Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new Fixed32Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Fixed32Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Fixed32Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Fixed32Rules, a, b);
    }
}
exports.Fixed32Rules = Fixed32Rules;
/**
 * Fixed64Rules describes the constraints applied to `fixed64` values.
 *
 * @generated from message buf.validate.Fixed64Rules
 */
class Fixed64Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyFixed64 {
     *   // value must equal 42
     *   fixed64 value = 1 [(buf.validate.field).fixed64.const = 42];
     * }
     * ```
     *
     * @generated from field: optional fixed64 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.Fixed64Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.Fixed64Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyFixed64 {
     *   // value must be in list [1, 2, 3]
     *   repeated fixed64 value = 1 (buf.validate.field).fixed64 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated fixed64 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyFixed64 {
     *   // value must not be in list [1, 2, 3]
     *   repeated fixed64 value = 1 (buf.validate.field).fixed64 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated fixed64 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Fixed64Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new Fixed64Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Fixed64Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Fixed64Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Fixed64Rules, a, b);
    }
}
exports.Fixed64Rules = Fixed64Rules;
/**
 * SFixed32Rules describes the constraints applied to `fixed32` values.
 *
 * @generated from message buf.validate.SFixed32Rules
 */
class SFixed32Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MySFixed32 {
     *   // value must equal 42
     *   sfixed32 value = 1 [(buf.validate.field).sfixed32.const = 42];
     * }
     * ```
     *
     * @generated from field: optional sfixed32 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.SFixed32Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.SFixed32Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MySFixed32 {
     *   // value must be in list [1, 2, 3]
     *   repeated sfixed32 value = 1 (buf.validate.field).sfixed32 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sfixed32 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MySFixed32 {
     *   // value must not be in list [1, 2, 3]
     *   repeated sfixed32 value = 1 (buf.validate.field).sfixed32 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sfixed32 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.SFixed32Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new SFixed32Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new SFixed32Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new SFixed32Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(SFixed32Rules, a, b);
    }
}
exports.SFixed32Rules = SFixed32Rules;
/**
 * SFixed64Rules describes the constraints applied to `fixed64` values.
 *
 * @generated from message buf.validate.SFixed64Rules
 */
class SFixed64Rules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MySFixed64 {
     *   // value must equal 42
     *   sfixed64 value = 1 [(buf.validate.field).sfixed64.const = 42];
     * }
     * ```
     *
     * @generated from field: optional sfixed64 const = 1;
     */
    const;
    /**
     * @generated from oneof buf.validate.SFixed64Rules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.SFixed64Rules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` requires the field value to be equal to one of the specified values.
     * If the field value isn't one of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MySFixed64 {
     *   // value must be in list [1, 2, 3]
     *   repeated sfixed64 value = 1 (buf.validate.field).sfixed64 = { in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sfixed64 in = 6;
     */
    in = [];
    /**
     * `not_in` requires the field value to not be equal to any of the specified
     * values. If the field value is one of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MySFixed64 {
     *   // value must not be in list [1, 2, 3]
     *   repeated sfixed64 value = 1 (buf.validate.field).sfixed64 = { not_in: [1, 2, 3] };
     * }
     * ```
     *
     * @generated from field: repeated sfixed64 not_in = 7;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.SFixed64Rules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, opt: true },
        { no: 2, name: "lt", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, oneof: "less_than" },
        { no: 3, name: "lte", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, oneof: "less_than" },
        { no: 4, name: "gt", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, oneof: "greater_than" },
        { no: 5, name: "gte", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, oneof: "greater_than" },
        { no: 6, name: "in", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, repeated: true },
        { no: 7, name: "not_in", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new SFixed64Rules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new SFixed64Rules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new SFixed64Rules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(SFixed64Rules, a, b);
    }
}
exports.SFixed64Rules = SFixed64Rules;
/**
 * BoolRules describes the constraints applied to `bool` values. These rules
 * may also be applied to the `google.protobuf.BoolValue` Well-Known-Type.
 *
 * @generated from message buf.validate.BoolRules
 */
class BoolRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified boolean value.
     * If the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyBool {
     *   // value must equal true
     *   bool value = 1 [(buf.validate.field).bool.const = true];
     * }
     * ```
     *
     * @generated from field: optional bool const = 1;
     */
    const;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.BoolRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new BoolRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new BoolRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new BoolRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(BoolRules, a, b);
    }
}
exports.BoolRules = BoolRules;
/**
 * StringRules describes the constraints applied to `string` values These
 * rules may also be applied to the `google.protobuf.StringValue` Well-Known-Type.
 *
 * @generated from message buf.validate.StringRules
 */
class StringRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified value. If
     * the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyString {
     *   // value must equal `hello`
     *   string value = 1 [(buf.validate.field).string.const = "hello"];
     * }
     * ```
     *
     * @generated from field: optional string const = 1;
     */
    const;
    /**
     * `len` dictates that the field value must have the specified
     * number of characters (Unicode code points), which may differ from the number
     * of bytes in the string. If the field value does not meet the specified
     * length, an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be 5 characters
     *   string value = 1 [(buf.validate.field).string.len = 5];
     * }
     * ```
     *
     * @generated from field: optional uint64 len = 19;
     */
    len;
    /**
     * `min_len` specifies that the field value must have at least the specified
     * number of characters (Unicode code points), which may differ from the number
     * of bytes in the string. If the field value contains fewer characters, an error
     * message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be at least 3 characters
     *   string value = 1 [(buf.validate.field).string.min_len = 3];
     * }
     * ```
     *
     * @generated from field: optional uint64 min_len = 2;
     */
    minLen;
    /**
     * `max_len` specifies that the field value must have no more than the specified
     * number of characters (Unicode code points), which may differ from the
     * number of bytes in the string. If the field value contains more characters,
     * an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be at most 10 characters
     *   string value = 1 [(buf.validate.field).string.max_len = 10];
     * }
     * ```
     *
     * @generated from field: optional uint64 max_len = 3;
     */
    maxLen;
    /**
     * `len_bytes` dictates that the field value must have the specified number of
     * bytes. If the field value does not match the specified length in bytes,
     * an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be 6 bytes
     *   string value = 1 [(buf.validate.field).string.len_bytes = 6];
     * }
     * ```
     *
     * @generated from field: optional uint64 len_bytes = 20;
     */
    lenBytes;
    /**
     * `min_bytes` specifies that the field value must have at least the specified
     * number of bytes. If the field value contains fewer bytes, an error message
     * will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be at least 4 bytes
     *   string value = 1 [(buf.validate.field).string.min_bytes = 4];
     * }
     *
     * ```
     *
     * @generated from field: optional uint64 min_bytes = 4;
     */
    minBytes;
    /**
     * `max_bytes` specifies that the field value must have no more than the
     * specified number of bytes. If the field value contains more bytes, an
     * error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value length must be at most 8 bytes
     *   string value = 1 [(buf.validate.field).string.max_bytes = 8];
     * }
     * ```
     *
     * @generated from field: optional uint64 max_bytes = 5;
     */
    maxBytes;
    /**
     * `pattern` specifies that the field value must match the specified
     * regular expression (RE2 syntax), with the expression provided without any
     * delimiters. If the field value doesn't match the regular expression, an
     * error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value does not match regex pattern `^[a-zA-Z]//$`
     *   string value = 1 [(buf.validate.field).string.pattern = "^[a-zA-Z]//$"];
     * }
     * ```
     *
     * @generated from field: optional string pattern = 6;
     */
    pattern;
    /**
     * `prefix` specifies that the field value must have the
     * specified substring at the beginning of the string. If the field value
     * doesn't start with the specified prefix, an error message will be
     * generated.
     *
     * ```proto
     * message MyString {
     *   // value does not have prefix `pre`
     *   string value = 1 [(buf.validate.field).string.prefix = "pre"];
     * }
     * ```
     *
     * @generated from field: optional string prefix = 7;
     */
    prefix;
    /**
     * `suffix` specifies that the field value must have the
     * specified substring at the end of the string. If the field value doesn't
     * end with the specified suffix, an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value does not have suffix `post`
     *   string value = 1 [(buf.validate.field).string.suffix = "post"];
     * }
     * ```
     *
     * @generated from field: optional string suffix = 8;
     */
    suffix;
    /**
     * `contains` specifies that the field value must have the
     * specified substring anywhere in the string. If the field value doesn't
     * contain the specified substring, an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value does not contain substring `inside`.
     *   string value = 1 [(buf.validate.field).string.contains = "inside"];
     * }
     * ```
     *
     * @generated from field: optional string contains = 9;
     */
    contains;
    /**
     * `not_contains` specifies that the field value must not have the
     * specified substring anywhere in the string. If the field value contains
     * the specified substring, an error message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value contains substring `inside`.
     *   string value = 1 [(buf.validate.field).string.not_contains = "inside"];
     * }
     * ```
     *
     * @generated from field: optional string not_contains = 23;
     */
    notContains;
    /**
     * `in` specifies that the field value must be equal to one of the specified
     * values. If the field value isn't one of the specified values, an error
     * message will be generated.
     *
     * ```proto
     * message MyString {
     *   // value must be in list ["apple", "banana"]
     *   repeated string value = 1 [(buf.validate.field).string.in = "apple", (buf.validate.field).string.in = "banana"];
     * }
     * ```
     *
     * @generated from field: repeated string in = 10;
     */
    in = [];
    /**
     * `not_in` specifies that the field value cannot be equal to any
     * of the specified values. If the field value is one of the specified values,
     * an error message will be generated.
     * ```proto
     * message MyString {
     *   // value must not be in list ["orange", "grape"]
     *   repeated string value = 1 [(buf.validate.field).string.not_in = "orange", (buf.validate.field).string.not_in = "grape"];
     * }
     * ```
     *
     * @generated from field: repeated string not_in = 11;
     */
    notIn = [];
    /**
     * `WellKnown` rules provide advanced constraints against common string
     * patterns
     *
     * @generated from oneof buf.validate.StringRules.well_known
     */
    wellKnown = { case: undefined };
    /**
     * This applies to regexes `HTTP_HEADER_NAME` and `HTTP_HEADER_VALUE` to
     * enable strict header validation. By default, this is true, and HTTP header
     * validations are [RFC-compliant](https://tools.ietf.org/html/rfc7230#section-3). Setting to false will enable looser
     * validations that only disallow `\r\n\0` characters, which can be used to
     * bypass header matching rules.
     *
     * ```proto
     * message MyString {
     *   // The field `value` must have be a valid HTTP headers, but not enforced with strict rules.
     *   string value = 1 [(buf.validate.field).string.strict = false];
     * }
     * ```
     *
     * @generated from field: optional bool strict = 25;
     */
    strict;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.StringRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 19, name: "len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 2, name: "min_len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 3, name: "max_len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 20, name: "len_bytes", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 4, name: "min_bytes", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 5, name: "max_bytes", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 6, name: "pattern", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 7, name: "prefix", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 8, name: "suffix", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 9, name: "contains", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 23, name: "not_contains", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 10, name: "in", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
        { no: 11, name: "not_in", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
        { no: 12, name: "email", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 13, name: "hostname", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 14, name: "ip", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 15, name: "ipv4", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 16, name: "ipv6", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 17, name: "uri", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 18, name: "uri_ref", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 21, name: "address", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 22, name: "uuid", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 26, name: "ip_with_prefixlen", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 27, name: "ipv4_with_prefixlen", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 28, name: "ipv6_with_prefixlen", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 29, name: "ip_prefix", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 30, name: "ipv4_prefix", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 31, name: "ipv6_prefix", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 24, name: "well_known_regex", kind: "enum", T: protobuf_1.proto3.getEnumType(KnownRegex), oneof: "well_known" },
        { no: 25, name: "strict", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new StringRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new StringRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new StringRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(StringRules, a, b);
    }
}
exports.StringRules = StringRules;
/**
 * BytesRules describe the constraints applied to `bytes` values. These rules
 * may also be applied to the `google.protobuf.BytesValue` Well-Known-Type.
 *
 * @generated from message buf.validate.BytesRules
 */
class BytesRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified bytes
     * value. If the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value must be "\x01\x02\x03\x04"
     *   bytes value = 1 [(buf.validate.field).bytes.const = "\x01\x02\x03\x04"];
     * }
     * ```
     *
     * @generated from field: optional bytes const = 1;
     */
    const;
    /**
     * `len` requires the field value to have the specified length in bytes.
     * If the field value doesn't match, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value length must be 4 bytes.
     *   optional bytes value = 1 [(buf.validate.field).bytes.len = 4];
     * }
     * ```
     *
     * @generated from field: optional uint64 len = 13;
     */
    len;
    /**
     * `min_len` requires the field value to have at least the specified minimum
     * length in bytes.
     * If the field value doesn't meet the requirement, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value length must be at least 2 bytes.
     *   optional bytes value = 1 [(buf.validate.field).bytes.min_len = 2];
     * }
     * ```
     *
     * @generated from field: optional uint64 min_len = 2;
     */
    minLen;
    /**
     * `max_len` requires the field value to have at most the specified maximum
     * length in bytes.
     * If the field value exceeds the requirement, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value must be at most 6 bytes.
     *   optional bytes value = 1 [(buf.validate.field).bytes.max_len = 6];
     * }
     * ```
     *
     * @generated from field: optional uint64 max_len = 3;
     */
    maxLen;
    /**
     * `pattern` requires the field value to match the specified regular
     * expression ([RE2 syntax](https://github.com/google/re2/wiki/Syntax)).
     * The value of the field must be valid UTF-8 or validation will fail with a
     * runtime error.
     * If the field value doesn't match the pattern, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value must match regex pattern "^[a-zA-Z0-9]+$".
     *   optional bytes value = 1 [(buf.validate.field).bytes.pattern = "^[a-zA-Z0-9]+$"];
     * }
     * ```
     *
     * @generated from field: optional string pattern = 4;
     */
    pattern;
    /**
     * `prefix` requires the field value to have the specified bytes at the
     * beginning of the string.
     * If the field value doesn't meet the requirement, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value does not have prefix \x01\x02
     *   optional bytes value = 1 [(buf.validate.field).bytes.prefix = "\x01\x02"];
     * }
     * ```
     *
     * @generated from field: optional bytes prefix = 5;
     */
    prefix;
    /**
     * `suffix` requires the field value to have the specified bytes at the end
     * of the string.
     * If the field value doesn't meet the requirement, an error message is generated.
     *
     * ```proto
     * message MyBytes {
     *   // value does not have suffix \x03\x04
     *   optional bytes value = 1 [(buf.validate.field).bytes.suffix = "\x03\x04"];
     * }
     * ```
     *
     * @generated from field: optional bytes suffix = 6;
     */
    suffix;
    /**
     * `contains` requires the field value to have the specified bytes anywhere in
     * the string.
     * If the field value doesn't meet the requirement, an error message is generated.
     *
     * ```protobuf
     * message MyBytes {
     *   // value does not contain \x02\x03
     *   optional bytes value = 1 [(buf.validate.field).bytes.contains = "\x02\x03"];
     * }
     * ```
     *
     * @generated from field: optional bytes contains = 7;
     */
    contains;
    /**
     * `in` requires the field value to be equal to one of the specified
     * values. If the field value doesn't match any of the specified values, an
     * error message is generated.
     *
     * ```protobuf
     * message MyBytes {
     *   // value must in ["\x01\x02", "\x02\x03", "\x03\x04"]
     *   optional bytes value = 1 [(buf.validate.field).bytes.in = {"\x01\x02", "\x02\x03", "\x03\x04"}];
     * }
     * ```
     *
     * @generated from field: repeated bytes in = 8;
     */
    in = [];
    /**
     * `not_in` requires the field value to be not equal to any of the specified
     * values.
     * If the field value matches any of the specified values, an error message is
     * generated.
     *
     * ```proto
     * message MyBytes {
     *   // value must not in ["\x01\x02", "\x02\x03", "\x03\x04"]
     *   optional bytes value = 1 [(buf.validate.field).bytes.not_in = {"\x01\x02", "\x02\x03", "\x03\x04"}];
     * }
     * ```
     *
     * @generated from field: repeated bytes not_in = 9;
     */
    notIn = [];
    /**
     * WellKnown rules provide advanced constraints against common byte
     * patterns
     *
     * @generated from oneof buf.validate.BytesRules.well_known
     */
    wellKnown = { case: undefined };
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.BytesRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 12 /* ScalarType.BYTES */, opt: true },
        { no: 13, name: "len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 2, name: "min_len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 3, name: "max_len", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 4, name: "pattern", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
        { no: 5, name: "prefix", kind: "scalar", T: 12 /* ScalarType.BYTES */, opt: true },
        { no: 6, name: "suffix", kind: "scalar", T: 12 /* ScalarType.BYTES */, opt: true },
        { no: 7, name: "contains", kind: "scalar", T: 12 /* ScalarType.BYTES */, opt: true },
        { no: 8, name: "in", kind: "scalar", T: 12 /* ScalarType.BYTES */, repeated: true },
        { no: 9, name: "not_in", kind: "scalar", T: 12 /* ScalarType.BYTES */, repeated: true },
        { no: 10, name: "ip", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 11, name: "ipv4", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
        { no: 12, name: "ipv6", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "well_known" },
    ]);
    static fromBinary(bytes, options) {
        return new BytesRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new BytesRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new BytesRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(BytesRules, a, b);
    }
}
exports.BytesRules = BytesRules;
/**
 * EnumRules describe the constraints applied to `enum` values.
 *
 * @generated from message buf.validate.EnumRules
 */
class EnumRules extends protobuf_1.Message {
    /**
     * `const` requires the field value to exactly match the specified enum value.
     * If the field value doesn't match, an error message is generated.
     *
     * ```proto
     * enum MyEnum {
     *   MY_ENUM_UNSPECIFIED = 0;
     *   MY_ENUM_VALUE1 = 1;
     *   MY_ENUM_VALUE2 = 2;
     * }
     *
     * message MyMessage {
     *   // The field `value` must be exactly MY_ENUM_VALUE1.
     *   MyEnum value = 1 [(buf.validate.field).enum.const = 1];
     * }
     * ```
     *
     * @generated from field: optional int32 const = 1;
     */
    const;
    /**
     * `defined_only` requires the field value to be one of the defined values for
     * this enum, failing on any undefined value.
     *
     * ```proto
     * enum MyEnum {
     *   MY_ENUM_UNSPECIFIED = 0;
     *   MY_ENUM_VALUE1 = 1;
     *   MY_ENUM_VALUE2 = 2;
     * }
     *
     * message MyMessage {
     *   // The field `value` must be a defined value of MyEnum.
     *   MyEnum value = 1 [(buf.validate.field).enum.defined_only = true];
     * }
     * ```
     *
     * @generated from field: optional bool defined_only = 2;
     */
    definedOnly;
    /**
     * `in` requires the field value to be equal to one of the
     * specified enum values. If the field value doesn't match any of the
     * specified values, an error message is generated.
     *
     * ```proto
     * enum MyEnum {
     *   MY_ENUM_UNSPECIFIED = 0;
     *   MY_ENUM_VALUE1 = 1;
     *   MY_ENUM_VALUE2 = 2;
     * }
     *
     * message MyMessage {
     *   // The field `value` must be equal to one of the specified values.
     *   MyEnum value = 1 [(buf.validate.field).enum = { in: [1, 2]}];
     * }
     * ```
     *
     * @generated from field: repeated int32 in = 3;
     */
    in = [];
    /**
     * `not_in` requires the field value to be not equal to any of the
     * specified enum values. If the field value matches one of the specified
     * values, an error message is generated.
     *
     * ```proto
     * enum MyEnum {
     *   MY_ENUM_UNSPECIFIED = 0;
     *   MY_ENUM_VALUE1 = 1;
     *   MY_ENUM_VALUE2 = 2;
     * }
     *
     * message MyMessage {
     *   // The field `value` must not be equal to any of the specified values.
     *   MyEnum value = 1 [(buf.validate.field).enum = { not_in: [1, 2]}];
     * }
     * ```
     *
     * @generated from field: repeated int32 not_in = 4;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.EnumRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "const", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
        { no: 2, name: "defined_only", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
        { no: 3, name: "in", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
        { no: 4, name: "not_in", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new EnumRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new EnumRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new EnumRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(EnumRules, a, b);
    }
}
exports.EnumRules = EnumRules;
/**
 * RepeatedRules describe the constraints applied to `repeated` values.
 *
 * @generated from message buf.validate.RepeatedRules
 */
class RepeatedRules extends protobuf_1.Message {
    /**
     * `min_items` requires that this field must contain at least the specified
     * minimum number of items.
     *
     * Note that `min_items = 1` is equivalent to setting a field as `required`.
     *
     * ```proto
     * message MyRepeated {
     *   // value must contain at least  2 items
     *   repeated string value = 1 [(buf.validate.field).repeated.min_items = 2];
     * }
     * ```
     *
     * @generated from field: optional uint64 min_items = 1;
     */
    minItems;
    /**
     * `max_items` denotes that this field must not exceed a
     * certain number of items as the upper limit. If the field contains more
     * items than specified, an error message will be generated, requiring the
     * field to maintain no more than the specified number of items.
     *
     * ```proto
     * message MyRepeated {
     *   // value must contain no more than 3 item(s)
     *   repeated string value = 1 [(buf.validate.field).repeated.max_items = 3];
     * }
     * ```
     *
     * @generated from field: optional uint64 max_items = 2;
     */
    maxItems;
    /**
     * `unique` indicates that all elements in this field must
     * be unique. This constraint is strictly applicable to scalar and enum
     * types, with message types not being supported.
     *
     * ```proto
     * message MyRepeated {
     *   // repeated value must contain unique items
     *   repeated string value = 1 [(buf.validate.field).repeated.unique = true];
     * }
     * ```
     *
     * @generated from field: optional bool unique = 3;
     */
    unique;
    /**
     * `items` details the constraints to be applied to each item
     * in the field. Even for repeated message fields, validation is executed
     * against each item unless skip is explicitly specified.
     *
     * ```proto
     * message MyRepeated {
     *   // The items in the field `value` must follow the specified constraints.
     *   repeated string value = 1 [(buf.validate.field).repeated.items = {
     *     string: {
     *       min_len: 3
     *       max_len: 10
     *     }
     *   }];
     * }
     * ```
     *
     * @generated from field: optional buf.validate.FieldConstraints items = 4;
     */
    items;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.RepeatedRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "min_items", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 2, name: "max_items", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 3, name: "unique", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
        { no: 4, name: "items", kind: "message", T: FieldConstraints, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new RepeatedRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new RepeatedRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new RepeatedRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(RepeatedRules, a, b);
    }
}
exports.RepeatedRules = RepeatedRules;
/**
 * MapRules describe the constraints applied to `map` values.
 *
 * @generated from message buf.validate.MapRules
 */
class MapRules extends protobuf_1.Message {
    /**
     * Specifies the minimum number of key-value pairs allowed. If the field has
     * fewer key-value pairs than specified, an error message is generated.
     *
     * ```proto
     * message MyMap {
     *   // The field `value` must have at least 2 key-value pairs.
     *   map<string, string> value = 1 [(buf.validate.field).map.min_pairs = 2];
     * }
     * ```
     *
     * @generated from field: optional uint64 min_pairs = 1;
     */
    minPairs;
    /**
     * Specifies the maximum number of key-value pairs allowed. If the field has
     * more key-value pairs than specified, an error message is generated.
     *
     * ```proto
     * message MyMap {
     *   // The field `value` must have at most 3 key-value pairs.
     *   map<string, string> value = 1 [(buf.validate.field).map.max_pairs = 3];
     * }
     * ```
     *
     * @generated from field: optional uint64 max_pairs = 2;
     */
    maxPairs;
    /**
     * Specifies the constraints to be applied to each key in the field.
     *
     * ```proto
     * message MyMap {
     *   // The keys in the field `value` must follow the specified constraints.
     *   map<string, string> value = 1 [(buf.validate.field).map.keys = {
     *     string: {
     *       min_len: 3
     *       max_len: 10
     *     }
     *   }];
     * }
     * ```
     *
     * @generated from field: optional buf.validate.FieldConstraints keys = 4;
     */
    keys;
    /**
     * Specifies the constraints to be applied to the value of each key in the
     * field. Message values will still have their validations evaluated unless
     * skip is specified here.
     *
     * ```proto
     * message MyMap {
     *   // The values in the field `value` must follow the specified constraints.
     *   map<string, string> value = 1 [(buf.validate.field).map.values = {
     *     string: {
     *       min_len: 5
     *       max_len: 20
     *     }
     *   }];
     * }
     * ```
     *
     * @generated from field: optional buf.validate.FieldConstraints values = 5;
     */
    values;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.MapRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "min_pairs", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 2, name: "max_pairs", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
        { no: 4, name: "keys", kind: "message", T: FieldConstraints, opt: true },
        { no: 5, name: "values", kind: "message", T: FieldConstraints, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new MapRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new MapRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new MapRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(MapRules, a, b);
    }
}
exports.MapRules = MapRules;
/**
 * AnyRules describe constraints applied exclusively to the `google.protobuf.Any` well-known type.
 *
 * @generated from message buf.validate.AnyRules
 */
class AnyRules extends protobuf_1.Message {
    /**
     * `in` requires the field's `type_url` to be equal to one of the
     * specified values. If it doesn't match any of the specified values, an error
     * message is generated.
     *
     * ```proto
     * message MyAny {
     *   //  The `value` field must have a `type_url` equal to one of the specified values.
     *   google.protobuf.Any value = 1 [(buf.validate.field).any.in = ["type.googleapis.com/MyType1", "type.googleapis.com/MyType2"]];
     * }
     * ```
     *
     * @generated from field: repeated string in = 2;
     */
    in = [];
    /**
     * requires the field's type_url to be not equal to any of the specified values. If it matches any of the specified values, an error message is generated.
     *
     * ```proto
     * message MyAny {
     *   // The field `value` must not have a `type_url` equal to any of the specified values.
     *   google.protobuf.Any value = 1 [(buf.validate.field).any.not_in = ["type.googleapis.com/ForbiddenType1", "type.googleapis.com/ForbiddenType2"]];
     * }
     * ```
     *
     * @generated from field: repeated string not_in = 3;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.AnyRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 2, name: "in", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
        { no: 3, name: "not_in", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new AnyRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new AnyRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new AnyRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(AnyRules, a, b);
    }
}
exports.AnyRules = AnyRules;
/**
 * DurationRules describe the constraints applied exclusively to the `google.protobuf.Duration` well-known type.
 *
 * @generated from message buf.validate.DurationRules
 */
class DurationRules extends protobuf_1.Message {
    /**
     * `const` dictates that the field must match the specified value of the `google.protobuf.Duration` type exactly.
     * If the field's value deviates from the specified value, an error message
     * will be generated.
     *
     * ```proto
     * message MyDuration {
     *   // value must equal 5s
     *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.const = "5s"];
     * }
     * ```
     *
     * @generated from field: optional google.protobuf.Duration const = 2;
     */
    const;
    /**
     * @generated from oneof buf.validate.DurationRules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.DurationRules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `in` asserts that the field must be equal to one of the specified values of the `google.protobuf.Duration` type.
     * If the field's value doesn't correspond to any of the specified values,
     * an error message will be generated.
     *
     * ```proto
     * message MyDuration {
     *   // value must be in list [1s, 2s, 3s]
     *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.in = ["1s", "2s", "3s"]];
     * }
     * ```
     *
     * @generated from field: repeated google.protobuf.Duration in = 7;
     */
    in = [];
    /**
     * `not_in` denotes that the field must not be equal to
     * any of the specified values of the `google.protobuf.Duration` type.
     * If the field's value matches any of these values, an error message will be
     * generated.
     *
     * ```proto
     * message MyDuration {
     *   // value must not be in list [1s, 2s, 3s]
     *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.not_in = ["1s", "2s", "3s"]];
     * }
     * ```
     *
     * @generated from field: repeated google.protobuf.Duration not_in = 8;
     */
    notIn = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.DurationRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 2, name: "const", kind: "message", T: protobuf_1.Duration, opt: true },
        { no: 3, name: "lt", kind: "message", T: protobuf_1.Duration, oneof: "less_than" },
        { no: 4, name: "lte", kind: "message", T: protobuf_1.Duration, oneof: "less_than" },
        { no: 5, name: "gt", kind: "message", T: protobuf_1.Duration, oneof: "greater_than" },
        { no: 6, name: "gte", kind: "message", T: protobuf_1.Duration, oneof: "greater_than" },
        { no: 7, name: "in", kind: "message", T: protobuf_1.Duration, repeated: true },
        { no: 8, name: "not_in", kind: "message", T: protobuf_1.Duration, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new DurationRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new DurationRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new DurationRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(DurationRules, a, b);
    }
}
exports.DurationRules = DurationRules;
/**
 * TimestampRules describe the constraints applied exclusively to the `google.protobuf.Timestamp` well-known type.
 *
 * @generated from message buf.validate.TimestampRules
 */
class TimestampRules extends protobuf_1.Message {
    /**
     * `const` dictates that this field, of the `google.protobuf.Timestamp` type, must exactly match the specified value. If the field value doesn't correspond to the specified timestamp, an error message will be generated.
     *
     * ```proto
     * message MyTimestamp {
     *   // value must equal 2023-05-03T10:00:00Z
     *   google.protobuf.Timestamp created_at = 1 [(buf.validate.field).timestamp.const = {seconds: 1727998800}];
     * }
     * ```
     *
     * @generated from field: optional google.protobuf.Timestamp const = 2;
     */
    const;
    /**
     * @generated from oneof buf.validate.TimestampRules.less_than
     */
    lessThan = { case: undefined };
    /**
     * @generated from oneof buf.validate.TimestampRules.greater_than
     */
    greaterThan = { case: undefined };
    /**
     * `within` specifies that this field, of the `google.protobuf.Timestamp` type, must be within the specified duration of the current time. If the field value isn't within the duration, an error message is generated.
     *
     * ```proto
     * message MyTimestamp {
     *   // value must be within 1 hour of now
     *   google.protobuf.Timestamp created_at = 1 [(buf.validate.field).timestamp.within = {seconds: 3600}];
     * }
     * ```
     *
     * @generated from field: optional google.protobuf.Duration within = 9;
     */
    within;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.TimestampRules";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 2, name: "const", kind: "message", T: protobuf_1.Timestamp, opt: true },
        { no: 3, name: "lt", kind: "message", T: protobuf_1.Timestamp, oneof: "less_than" },
        { no: 4, name: "lte", kind: "message", T: protobuf_1.Timestamp, oneof: "less_than" },
        { no: 7, name: "lt_now", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "less_than" },
        { no: 5, name: "gt", kind: "message", T: protobuf_1.Timestamp, oneof: "greater_than" },
        { no: 6, name: "gte", kind: "message", T: protobuf_1.Timestamp, oneof: "greater_than" },
        { no: 8, name: "gt_now", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "greater_than" },
        { no: 9, name: "within", kind: "message", T: protobuf_1.Duration, opt: true },
    ]);
    static fromBinary(bytes, options) {
        return new TimestampRules().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new TimestampRules().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new TimestampRules().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(TimestampRules, a, b);
    }
}
exports.TimestampRules = TimestampRules;
//# sourceMappingURL=validate_pb.map