import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Duration, Message, proto3, Timestamp } from "@bufbuild/protobuf";
import { Constraint } from "./expression_pb";
/**
 * WellKnownRegex contain some well-known patterns.
 *
 * @generated from enum buf.validate.KnownRegex
 */
export declare enum KnownRegex {
    /**
     * @generated from enum value: KNOWN_REGEX_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * HTTP header name as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2).
     *
     * @generated from enum value: KNOWN_REGEX_HTTP_HEADER_NAME = 1;
     */
    HTTP_HEADER_NAME = 1,
    /**
     * HTTP header value as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2.4).
     *
     * @generated from enum value: KNOWN_REGEX_HTTP_HEADER_VALUE = 2;
     */
    HTTP_HEADER_VALUE = 2
}
/**
 * MessageConstraints represents validation rules that are applied to the entire message.
 * It includes disabling options and a list of Constraint messages representing Common Expression Language (CEL) validation rules.
 *
 * @generated from message buf.validate.MessageConstraints
 */
export declare class MessageConstraints extends Message<MessageConstraints> {
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
    disabled?: boolean;
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
    cel: Constraint[];
    constructor(data?: PartialMessage<MessageConstraints>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.MessageConstraints";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MessageConstraints;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MessageConstraints;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MessageConstraints;
    static equals(a: MessageConstraints | PlainMessage<MessageConstraints> | undefined, b: MessageConstraints | PlainMessage<MessageConstraints> | undefined): boolean;
}
/**
 * The `OneofConstraints` message type enables you to manage constraints for
 * oneof fields in your protobuf messages.
 *
 * @generated from message buf.validate.OneofConstraints
 */
export declare class OneofConstraints extends Message<OneofConstraints> {
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
    required?: boolean;
    constructor(data?: PartialMessage<OneofConstraints>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.OneofConstraints";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): OneofConstraints;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OneofConstraints;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OneofConstraints;
    static equals(a: OneofConstraints | PlainMessage<OneofConstraints> | undefined, b: OneofConstraints | PlainMessage<OneofConstraints> | undefined): boolean;
}
/**
 * FieldRules encapsulates the rules for each type of field. Depending on the
 * field, the correct set should be used to ensure proper validations.
 *
 * @generated from message buf.validate.FieldConstraints
 */
export declare class FieldConstraints extends Message<FieldConstraints> {
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
    cel: Constraint[];
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
    skipped: boolean;
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
    required: boolean;
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
    ignoreEmpty: boolean;
    /**
     * @generated from oneof buf.validate.FieldConstraints.type
     */
    type: {
        /**
         * Scalar Field Types
         *
         * @generated from field: buf.validate.FloatRules float = 1;
         */
        value: FloatRules;
        case: "float";
    } | {
        /**
         * @generated from field: buf.validate.DoubleRules double = 2;
         */
        value: DoubleRules;
        case: "double";
    } | {
        /**
         * @generated from field: buf.validate.Int32Rules int32 = 3;
         */
        value: Int32Rules;
        case: "int32";
    } | {
        /**
         * @generated from field: buf.validate.Int64Rules int64 = 4;
         */
        value: Int64Rules;
        case: "int64";
    } | {
        /**
         * @generated from field: buf.validate.UInt32Rules uint32 = 5;
         */
        value: UInt32Rules;
        case: "uint32";
    } | {
        /**
         * @generated from field: buf.validate.UInt64Rules uint64 = 6;
         */
        value: UInt64Rules;
        case: "uint64";
    } | {
        /**
         * @generated from field: buf.validate.SInt32Rules sint32 = 7;
         */
        value: SInt32Rules;
        case: "sint32";
    } | {
        /**
         * @generated from field: buf.validate.SInt64Rules sint64 = 8;
         */
        value: SInt64Rules;
        case: "sint64";
    } | {
        /**
         * @generated from field: buf.validate.Fixed32Rules fixed32 = 9;
         */
        value: Fixed32Rules;
        case: "fixed32";
    } | {
        /**
         * @generated from field: buf.validate.Fixed64Rules fixed64 = 10;
         */
        value: Fixed64Rules;
        case: "fixed64";
    } | {
        /**
         * @generated from field: buf.validate.SFixed32Rules sfixed32 = 11;
         */
        value: SFixed32Rules;
        case: "sfixed32";
    } | {
        /**
         * @generated from field: buf.validate.SFixed64Rules sfixed64 = 12;
         */
        value: SFixed64Rules;
        case: "sfixed64";
    } | {
        /**
         * @generated from field: buf.validate.BoolRules bool = 13;
         */
        value: BoolRules;
        case: "bool";
    } | {
        /**
         * @generated from field: buf.validate.StringRules string = 14;
         */
        value: StringRules;
        case: "string";
    } | {
        /**
         * @generated from field: buf.validate.BytesRules bytes = 15;
         */
        value: BytesRules;
        case: "bytes";
    } | {
        /**
         * Complex Field Types
         *
         * @generated from field: buf.validate.EnumRules enum = 16;
         */
        value: EnumRules;
        case: "enum";
    } | {
        /**
         * @generated from field: buf.validate.RepeatedRules repeated = 18;
         */
        value: RepeatedRules;
        case: "repeated";
    } | {
        /**
         * @generated from field: buf.validate.MapRules map = 19;
         */
        value: MapRules;
        case: "map";
    } | {
        /**
         * Well-Known Field Types
         *
         * @generated from field: buf.validate.AnyRules any = 20;
         */
        value: AnyRules;
        case: "any";
    } | {
        /**
         * @generated from field: buf.validate.DurationRules duration = 21;
         */
        value: DurationRules;
        case: "duration";
    } | {
        /**
         * @generated from field: buf.validate.TimestampRules timestamp = 22;
         */
        value: TimestampRules;
        case: "timestamp";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<FieldConstraints>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.FieldConstraints";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FieldConstraints;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FieldConstraints;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FieldConstraints;
    static equals(a: FieldConstraints | PlainMessage<FieldConstraints> | undefined, b: FieldConstraints | PlainMessage<FieldConstraints> | undefined): boolean;
}
/**
 * FloatRules describes the constraints applied to `float` values. These
 * rules may also be applied to the `google.protobuf.FloatValue` Well-Known-Type.
 *
 * @generated from message buf.validate.FloatRules
 */
export declare class FloatRules extends Message<FloatRules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.FloatRules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyFloat {
         *   // value must be less than 10.0
         *   float value = 1 [(buf.validate.field).float.lt = 10.0];
         * }
         * ```
         *
         * @generated from field: float lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyFloat {
         *   // value must be less than or equal to 10.0
         *   float value = 1 [(buf.validate.field).float.lte = 10.0];
         * }
         * ```
         *
         * @generated from field: float lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.FloatRules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFloat {
         *   // value must be greater than 5.0 [float.gt]
         *   float value = 1 [(buf.validate.field).float.gt = 5.0];
         *
         *   // value must be greater than 5 and less than 10.0 [float.gt_lt]
         *   float other_value = 2 [(buf.validate.field).float = { gt: 5.0, lt: 10.0 }];
         *
         *   // value must be greater than 10 or less than 5.0 [float.gt_lt_exclusive]
         *   float another_value = 3 [(buf.validate.field).float = { gt: 10.0, lt: 5.0 }];
         * }
         * ```
         *
         * @generated from field: float gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFloat {
         *   // value must be greater than or equal to 5.0 [float.gte]
         *   float value = 1 [(buf.validate.field).float.gte = 5.0];
         *
         *   // value must be greater than or equal to 5.0 and less than 10.0 [float.gte_lt]
         *   float other_value = 2 [(buf.validate.field).float = { gte: 5.0, lt: 10.0 }];
         *
         *   // value must be greater than or equal to 10.0 or less than 5.0 [float.gte_lt_exclusive]
         *   float another_value = 3 [(buf.validate.field).float = { gte: 10.0, lt: 5.0 }];
         * }
         * ```
         *
         * @generated from field: float gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    /**
     * `finite` requires the field value to be finite. If the field value is
     * infinite or NaN, an error message is generated.
     *
     * @generated from field: bool finite = 8;
     */
    finite: boolean;
    constructor(data?: PartialMessage<FloatRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.FloatRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FloatRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FloatRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FloatRules;
    static equals(a: FloatRules | PlainMessage<FloatRules> | undefined, b: FloatRules | PlainMessage<FloatRules> | undefined): boolean;
}
/**
 * DoubleRules describes the constraints applied to `double` values. These
 * rules may also be applied to the `google.protobuf.DoubleValue` Well-Known-Type.
 *
 * @generated from message buf.validate.DoubleRules
 */
export declare class DoubleRules extends Message<DoubleRules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.DoubleRules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyDouble {
         *   // value must be less than 10.0
         *   double value = 1 [(buf.validate.field).double.lt = 10.0];
         * }
         * ```
         *
         * @generated from field: double lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified value
         * (field <= value). If the field value is greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyDouble {
         *   // value must be less than or equal to 10.0
         *   double value = 1 [(buf.validate.field).double.lte = 10.0];
         * }
         * ```
         *
         * @generated from field: double lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.DoubleRules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or `lte`,
         * the range is reversed, and the field value must be outside the specified
         * range. If the field value doesn't meet the required conditions, an error
         * message is generated.
         *
         * ```proto
         * message MyDouble {
         *   // value must be greater than 5.0 [double.gt]
         *   double value = 1 [(buf.validate.field).double.gt = 5.0];
         *
         *   // value must be greater than 5 and less than 10.0 [double.gt_lt]
         *   double other_value = 2 [(buf.validate.field).double = { gt: 5.0, lt: 10.0 }];
         *
         *   // value must be greater than 10 or less than 5.0 [double.gt_lt_exclusive]
         *   double another_value = 3 [(buf.validate.field).double = { gt: 10.0, lt: 5.0 }];
         * }
         * ```
         *
         * @generated from field: double gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyDouble {
         *   // value must be greater than or equal to 5.0 [double.gte]
         *   double value = 1 [(buf.validate.field).double.gte = 5.0];
         *
         *   // value must be greater than or equal to 5.0 and less than 10.0 [double.gte_lt]
         *   double other_value = 2 [(buf.validate.field).double = { gte: 5.0, lt: 10.0 }];
         *
         *   // value must be greater than or equal to 10.0 or less than 5.0 [double.gte_lt_exclusive]
         *   double another_value = 3 [(buf.validate.field).double = { gte: 10.0, lt: 5.0 }];
         * }
         * ```
         *
         * @generated from field: double gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    /**
     * `finite` requires the field value to be finite. If the field value is
     * infinite or NaN, an error message is generated.
     *
     * @generated from field: bool finite = 8;
     */
    finite: boolean;
    constructor(data?: PartialMessage<DoubleRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.DoubleRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DoubleRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DoubleRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DoubleRules;
    static equals(a: DoubleRules | PlainMessage<DoubleRules> | undefined, b: DoubleRules | PlainMessage<DoubleRules> | undefined): boolean;
}
/**
 * Int32Rules describes the constraints applied to `int32` values. These
 * rules may also be applied to the `google.protobuf.Int32Value` Well-Known-Type.
 *
 * @generated from message buf.validate.Int32Rules
 */
export declare class Int32Rules extends Message<Int32Rules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.Int32Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field
         * < value). If the field value is equal to or greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyInt32 {
         *   // value must be less than 10
         *   int32 value = 1 [(buf.validate.field).int32.lt = 10];
         * }
         * ```
         *
         * @generated from field: int32 lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyInt32 {
         *   // value must be less than or equal to 10
         *   int32 value = 1 [(buf.validate.field).int32.lte = 10];
         * }
         * ```
         *
         * @generated from field: int32 lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.Int32Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyInt32 {
         *   // value must be greater than 5 [int32.gt]
         *   int32 value = 1 [(buf.validate.field).int32.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [int32.gt_lt]
         *   int32 other_value = 2 [(buf.validate.field).int32 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [int32.gt_lt_exclusive]
         *   int32 another_value = 3 [(buf.validate.field).int32 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: int32 gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified value
         * (exclusive). If the value of `gte` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyInt32 {
         *   // value must be greater than or equal to 5 [int32.gte]
         *   int32 value = 1 [(buf.validate.field).int32.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [int32.gte_lt]
         *   int32 other_value = 2 [(buf.validate.field).int32 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [int32.gte_lt_exclusive]
         *   int32 another_value = 3 [(buf.validate.field).int32 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: int32 gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<Int32Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Int32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Int32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Int32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Int32Rules;
    static equals(a: Int32Rules | PlainMessage<Int32Rules> | undefined, b: Int32Rules | PlainMessage<Int32Rules> | undefined): boolean;
}
/**
 * Int64Rules describes the constraints applied to `int64` values. These
 * rules may also be applied to the `google.protobuf.Int64Value` Well-Known-Type.
 *
 * @generated from message buf.validate.Int64Rules
 */
export declare class Int64Rules extends Message<Int64Rules> {
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
    const?: bigint;
    /**
     * @generated from oneof buf.validate.Int64Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyInt64 {
         *   // value must be less than 10
         *   int64 value = 1 [(buf.validate.field).int64.lt = 10];
         * }
         * ```
         *
         * @generated from field: int64 lt = 2;
         */
        value: bigint;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyInt64 {
         *   // value must be less than or equal to 10
         *   int64 value = 1 [(buf.validate.field).int64.lte = 10];
         * }
         * ```
         *
         * @generated from field: int64 lte = 3;
         */
        value: bigint;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.Int64Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyInt64 {
         *   // value must be greater than 5 [int64.gt]
         *   int64 value = 1 [(buf.validate.field).int64.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [int64.gt_lt]
         *   int64 other_value = 2 [(buf.validate.field).int64 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [int64.gt_lt_exclusive]
         *   int64 another_value = 3 [(buf.validate.field).int64 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: int64 gt = 4;
         */
        value: bigint;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyInt64 {
         *   // value must be greater than or equal to 5 [int64.gte]
         *   int64 value = 1 [(buf.validate.field).int64.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [int64.gte_lt]
         *   int64 other_value = 2 [(buf.validate.field).int64 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [int64.gte_lt_exclusive]
         *   int64 another_value = 3 [(buf.validate.field).int64 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: int64 gte = 5;
         */
        value: bigint;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: bigint[];
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
    notIn: bigint[];
    constructor(data?: PartialMessage<Int64Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Int64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Int64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Int64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Int64Rules;
    static equals(a: Int64Rules | PlainMessage<Int64Rules> | undefined, b: Int64Rules | PlainMessage<Int64Rules> | undefined): boolean;
}
/**
 * UInt32Rules describes the constraints applied to `uint32` values. These
 * rules may also be applied to the `google.protobuf.UInt32Value` Well-Known-Type.
 *
 * @generated from message buf.validate.UInt32Rules
 */
export declare class UInt32Rules extends Message<UInt32Rules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.UInt32Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt32 {
         *   // value must be less than 10
         *   uint32 value = 1 [(buf.validate.field).uint32.lt = 10];
         * }
         * ```
         *
         * @generated from field: uint32 lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyUInt32 {
         *   // value must be less than or equal to 10
         *   uint32 value = 1 [(buf.validate.field).uint32.lte = 10];
         * }
         * ```
         *
         * @generated from field: uint32 lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.UInt32Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt32 {
         *   // value must be greater than 5 [uint32.gt]
         *   uint32 value = 1 [(buf.validate.field).uint32.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [uint32.gt_lt]
         *   uint32 other_value = 2 [(buf.validate.field).uint32 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [uint32.gt_lt_exclusive]
         *   uint32 another_value = 3 [(buf.validate.field).uint32 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: uint32 gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt32 {
         *   // value must be greater than or equal to 5 [uint32.gte]
         *   uint32 value = 1 [(buf.validate.field).uint32.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [uint32.gte_lt]
         *   uint32 other_value = 2 [(buf.validate.field).uint32 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [uint32.gte_lt_exclusive]
         *   uint32 another_value = 3 [(buf.validate.field).uint32 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: uint32 gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<UInt32Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.UInt32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UInt32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UInt32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UInt32Rules;
    static equals(a: UInt32Rules | PlainMessage<UInt32Rules> | undefined, b: UInt32Rules | PlainMessage<UInt32Rules> | undefined): boolean;
}
/**
 * UInt64Rules describes the constraints applied to `uint64` values. These
 * rules may also be applied to the `google.protobuf.UInt64Value` Well-Known-Type.
 *
 * @generated from message buf.validate.UInt64Rules
 */
export declare class UInt64Rules extends Message<UInt64Rules> {
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
    const?: bigint;
    /**
     * @generated from oneof buf.validate.UInt64Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt64 {
         *   // value must be less than 10
         *   uint64 value = 1 [(buf.validate.field).uint64.lt = 10];
         * }
         * ```
         *
         * @generated from field: uint64 lt = 2;
         */
        value: bigint;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyUInt64 {
         *   // value must be less than or equal to 10
         *   uint64 value = 1 [(buf.validate.field).uint64.lte = 10];
         * }
         * ```
         *
         * @generated from field: uint64 lte = 3;
         */
        value: bigint;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.UInt64Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt64 {
         *   // value must be greater than 5 [uint64.gt]
         *   uint64 value = 1 [(buf.validate.field).uint64.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [uint64.gt_lt]
         *   uint64 other_value = 2 [(buf.validate.field).uint64 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [uint64.gt_lt_exclusive]
         *   uint64 another_value = 3 [(buf.validate.field).uint64 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: uint64 gt = 4;
         */
        value: bigint;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyUInt64 {
         *   // value must be greater than or equal to 5 [uint64.gte]
         *   uint64 value = 1 [(buf.validate.field).uint64.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [uint64.gte_lt]
         *   uint64 other_value = 2 [(buf.validate.field).uint64 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [uint64.gte_lt_exclusive]
         *   uint64 another_value = 3 [(buf.validate.field).uint64 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: uint64 gte = 5;
         */
        value: bigint;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: bigint[];
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
    notIn: bigint[];
    constructor(data?: PartialMessage<UInt64Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.UInt64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UInt64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UInt64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UInt64Rules;
    static equals(a: UInt64Rules | PlainMessage<UInt64Rules> | undefined, b: UInt64Rules | PlainMessage<UInt64Rules> | undefined): boolean;
}
/**
 * SInt32Rules describes the constraints applied to `sint32` values.
 *
 * @generated from message buf.validate.SInt32Rules
 */
export declare class SInt32Rules extends Message<SInt32Rules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.SInt32Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field
         * < value). If the field value is equal to or greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySInt32 {
         *   // value must be less than 10
         *   sint32 value = 1 [(buf.validate.field).sint32.lt = 10];
         * }
         * ```
         *
         * @generated from field: sint32 lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySInt32 {
         *   // value must be less than or equal to 10
         *   sint32 value = 1 [(buf.validate.field).sint32.lte = 10];
         * }
         * ```
         *
         * @generated from field: sint32 lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.SInt32Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySInt32 {
         *   // value must be greater than 5 [sint32.gt]
         *   sint32 value = 1 [(buf.validate.field).sint32.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [sint32.gt_lt]
         *   sint32 other_value = 2 [(buf.validate.field).sint32 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [sint32.gt_lt_exclusive]
         *   sint32 another_value = 3 [(buf.validate.field).sint32 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sint32 gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySInt32 {
         *  // value must be greater than or equal to 5 [sint32.gte]
         *  sint32 value = 1 [(buf.validate.field).sint32.gte = 5];
         *
         *  // value must be greater than or equal to 5 and less than 10 [sint32.gte_lt]
         *  sint32 other_value = 2 [(buf.validate.field).sint32 = { gte: 5, lt: 10 }];
         *
         *  // value must be greater than or equal to 10 or less than 5 [sint32.gte_lt_exclusive]
         *  sint32 another_value = 3 [(buf.validate.field).sint32 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sint32 gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<SInt32Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.SInt32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SInt32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SInt32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SInt32Rules;
    static equals(a: SInt32Rules | PlainMessage<SInt32Rules> | undefined, b: SInt32Rules | PlainMessage<SInt32Rules> | undefined): boolean;
}
/**
 * SInt64Rules describes the constraints applied to `sint64` values.
 *
 * @generated from message buf.validate.SInt64Rules
 */
export declare class SInt64Rules extends Message<SInt64Rules> {
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
    const?: bigint;
    /**
     * @generated from oneof buf.validate.SInt64Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field
         * < value). If the field value is equal to or greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySInt64 {
         *   // value must be less than 10
         *   sint64 value = 1 [(buf.validate.field).sint64.lt = 10];
         * }
         * ```
         *
         * @generated from field: sint64 lt = 2;
         */
        value: bigint;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySInt64 {
         *   // value must be less than or equal to 10
         *   sint64 value = 1 [(buf.validate.field).sint64.lte = 10];
         * }
         * ```
         *
         * @generated from field: sint64 lte = 3;
         */
        value: bigint;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.SInt64Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySInt64 {
         *   // value must be greater than 5 [sint64.gt]
         *   sint64 value = 1 [(buf.validate.field).sint64.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [sint64.gt_lt]
         *   sint64 other_value = 2 [(buf.validate.field).sint64 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [sint64.gt_lt_exclusive]
         *   sint64 another_value = 3 [(buf.validate.field).sint64 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sint64 gt = 4;
         */
        value: bigint;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySInt64 {
         *   // value must be greater than or equal to 5 [sint64.gte]
         *   sint64 value = 1 [(buf.validate.field).sint64.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [sint64.gte_lt]
         *   sint64 other_value = 2 [(buf.validate.field).sint64 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [sint64.gte_lt_exclusive]
         *   sint64 another_value = 3 [(buf.validate.field).sint64 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sint64 gte = 5;
         */
        value: bigint;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: bigint[];
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
    notIn: bigint[];
    constructor(data?: PartialMessage<SInt64Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.SInt64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SInt64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SInt64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SInt64Rules;
    static equals(a: SInt64Rules | PlainMessage<SInt64Rules> | undefined, b: SInt64Rules | PlainMessage<SInt64Rules> | undefined): boolean;
}
/**
 * Fixed32Rules describes the constraints applied to `fixed32` values.
 *
 * @generated from message buf.validate.Fixed32Rules
 */
export declare class Fixed32Rules extends Message<Fixed32Rules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.Fixed32Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed32 {
         *   // value must be less than 10
         *   fixed32 value = 1 [(buf.validate.field).fixed32.lt = 10];
         * }
         * ```
         *
         * @generated from field: fixed32 lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyFixed32 {
         *   // value must be less than or equal to 10
         *   fixed32 value = 1 [(buf.validate.field).fixed32.lte = 10];
         * }
         * ```
         *
         * @generated from field: fixed32 lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.Fixed32Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed32 {
         *   // value must be greater than 5 [fixed32.gt]
         *   fixed32 value = 1 [(buf.validate.field).fixed32.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [fixed32.gt_lt]
         *   fixed32 other_value = 2 [(buf.validate.field).fixed32 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [fixed32.gt_lt_exclusive]
         *   fixed32 another_value = 3 [(buf.validate.field).fixed32 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: fixed32 gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed32 {
         *   // value must be greater than or equal to 5 [fixed32.gte]
         *   fixed32 value = 1 [(buf.validate.field).fixed32.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [fixed32.gte_lt]
         *   fixed32 other_value = 2 [(buf.validate.field).fixed32 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [fixed32.gte_lt_exclusive]
         *   fixed32 another_value = 3 [(buf.validate.field).fixed32 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: fixed32 gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<Fixed32Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Fixed32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fixed32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fixed32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fixed32Rules;
    static equals(a: Fixed32Rules | PlainMessage<Fixed32Rules> | undefined, b: Fixed32Rules | PlainMessage<Fixed32Rules> | undefined): boolean;
}
/**
 * Fixed64Rules describes the constraints applied to `fixed64` values.
 *
 * @generated from message buf.validate.Fixed64Rules
 */
export declare class Fixed64Rules extends Message<Fixed64Rules> {
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
    const?: bigint;
    /**
     * @generated from oneof buf.validate.Fixed64Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed64 {
         *   // value must be less than 10
         *   fixed64 value = 1 [(buf.validate.field).fixed64.lt = 10];
         * }
         * ```
         *
         * @generated from field: fixed64 lt = 2;
         */
        value: bigint;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MyFixed64 {
         *   // value must be less than or equal to 10
         *   fixed64 value = 1 [(buf.validate.field).fixed64.lte = 10];
         * }
         * ```
         *
         * @generated from field: fixed64 lte = 3;
         */
        value: bigint;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.Fixed64Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed64 {
         *   // value must be greater than 5 [fixed64.gt]
         *   fixed64 value = 1 [(buf.validate.field).fixed64.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [fixed64.gt_lt]
         *   fixed64 other_value = 2 [(buf.validate.field).fixed64 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [fixed64.gt_lt_exclusive]
         *   fixed64 another_value = 3 [(buf.validate.field).fixed64 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: fixed64 gt = 4;
         */
        value: bigint;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyFixed64 {
         *   // value must be greater than or equal to 5 [fixed64.gte]
         *   fixed64 value = 1 [(buf.validate.field).fixed64.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [fixed64.gte_lt]
         *   fixed64 other_value = 2 [(buf.validate.field).fixed64 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [fixed64.gte_lt_exclusive]
         *   fixed64 another_value = 3 [(buf.validate.field).fixed64 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: fixed64 gte = 5;
         */
        value: bigint;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: bigint[];
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
    notIn: bigint[];
    constructor(data?: PartialMessage<Fixed64Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Fixed64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fixed64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fixed64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fixed64Rules;
    static equals(a: Fixed64Rules | PlainMessage<Fixed64Rules> | undefined, b: Fixed64Rules | PlainMessage<Fixed64Rules> | undefined): boolean;
}
/**
 * SFixed32Rules describes the constraints applied to `fixed32` values.
 *
 * @generated from message buf.validate.SFixed32Rules
 */
export declare class SFixed32Rules extends Message<SFixed32Rules> {
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
    const?: number;
    /**
     * @generated from oneof buf.validate.SFixed32Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed32 {
         *   // value must be less than 10
         *   sfixed32 value = 1 [(buf.validate.field).sfixed32.lt = 10];
         * }
         * ```
         *
         * @generated from field: sfixed32 lt = 2;
         */
        value: number;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySFixed32 {
         *   // value must be less than or equal to 10
         *   sfixed32 value = 1 [(buf.validate.field).sfixed32.lte = 10];
         * }
         * ```
         *
         * @generated from field: sfixed32 lte = 3;
         */
        value: number;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.SFixed32Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed32 {
         *   // value must be greater than 5 [sfixed32.gt]
         *   sfixed32 value = 1 [(buf.validate.field).sfixed32.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [sfixed32.gt_lt]
         *   sfixed32 other_value = 2 [(buf.validate.field).sfixed32 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [sfixed32.gt_lt_exclusive]
         *   sfixed32 another_value = 3 [(buf.validate.field).sfixed32 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sfixed32 gt = 4;
         */
        value: number;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed32 {
         *   // value must be greater than or equal to 5 [sfixed32.gte]
         *   sfixed32 value = 1 [(buf.validate.field).sfixed32.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [sfixed32.gte_lt]
         *   sfixed32 other_value = 2 [(buf.validate.field).sfixed32 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [sfixed32.gte_lt_exclusive]
         *   sfixed32 another_value = 3 [(buf.validate.field).sfixed32 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sfixed32 gte = 5;
         */
        value: number;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<SFixed32Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.SFixed32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SFixed32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SFixed32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SFixed32Rules;
    static equals(a: SFixed32Rules | PlainMessage<SFixed32Rules> | undefined, b: SFixed32Rules | PlainMessage<SFixed32Rules> | undefined): boolean;
}
/**
 * SFixed64Rules describes the constraints applied to `fixed64` values.
 *
 * @generated from message buf.validate.SFixed64Rules
 */
export declare class SFixed64Rules extends Message<SFixed64Rules> {
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
    const?: bigint;
    /**
     * @generated from oneof buf.validate.SFixed64Rules.less_than
     */
    lessThan: {
        /**
         * `lt` requires the field value to be less than the specified value (field <
         * value). If the field value is equal to or greater than the specified value,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed64 {
         *   // value must be less than 10
         *   sfixed64 value = 1 [(buf.validate.field).sfixed64.lt = 10];
         * }
         * ```
         *
         * @generated from field: sfixed64 lt = 2;
         */
        value: bigint;
        case: "lt";
    } | {
        /**
         * `lte` requires the field value to be less than or equal to the specified
         * value (field <= value). If the field value is greater than the specified
         * value, an error message is generated.
         *
         * ```proto
         * message MySFixed64 {
         *   // value must be less than or equal to 10
         *   sfixed64 value = 1 [(buf.validate.field).sfixed64.lte = 10];
         * }
         * ```
         *
         * @generated from field: sfixed64 lte = 3;
         */
        value: bigint;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.SFixed64Rules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the field value to be greater than the specified value
         * (exclusive). If the value of `gt` is larger than a specified `lt` or
         * `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed64 {
         *   // value must be greater than 5 [sfixed64.gt]
         *   sfixed64 value = 1 [(buf.validate.field).sfixed64.gt = 5];
         *
         *   // value must be greater than 5 and less than 10 [sfixed64.gt_lt]
         *   sfixed64 other_value = 2 [(buf.validate.field).sfixed64 = { gt: 5, lt: 10 }];
         *
         *   // value must be greater than 10 or less than 5 [sfixed64.gt_lt_exclusive]
         *   sfixed64 another_value = 3 [(buf.validate.field).sfixed64 = { gt: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sfixed64 gt = 4;
         */
        value: bigint;
        case: "gt";
    } | {
        /**
         * `gte` requires the field value to be greater than or equal to the specified
         * value (exclusive). If the value of `gte` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MySFixed64 {
         *   // value must be greater than or equal to 5 [sfixed64.gte]
         *   sfixed64 value = 1 [(buf.validate.field).sfixed64.gte = 5];
         *
         *   // value must be greater than or equal to 5 and less than 10 [sfixed64.gte_lt]
         *   sfixed64 other_value = 2 [(buf.validate.field).sfixed64 = { gte: 5, lt: 10 }];
         *
         *   // value must be greater than or equal to 10 or less than 5 [sfixed64.gte_lt_exclusive]
         *   sfixed64 another_value = 3 [(buf.validate.field).sfixed64 = { gte: 10, lt: 5 }];
         * }
         * ```
         *
         * @generated from field: sfixed64 gte = 5;
         */
        value: bigint;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: bigint[];
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
    notIn: bigint[];
    constructor(data?: PartialMessage<SFixed64Rules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.SFixed64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SFixed64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SFixed64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SFixed64Rules;
    static equals(a: SFixed64Rules | PlainMessage<SFixed64Rules> | undefined, b: SFixed64Rules | PlainMessage<SFixed64Rules> | undefined): boolean;
}
/**
 * BoolRules describes the constraints applied to `bool` values. These rules
 * may also be applied to the `google.protobuf.BoolValue` Well-Known-Type.
 *
 * @generated from message buf.validate.BoolRules
 */
export declare class BoolRules extends Message<BoolRules> {
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
    const?: boolean;
    constructor(data?: PartialMessage<BoolRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.BoolRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BoolRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BoolRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BoolRules;
    static equals(a: BoolRules | PlainMessage<BoolRules> | undefined, b: BoolRules | PlainMessage<BoolRules> | undefined): boolean;
}
/**
 * StringRules describes the constraints applied to `string` values These
 * rules may also be applied to the `google.protobuf.StringValue` Well-Known-Type.
 *
 * @generated from message buf.validate.StringRules
 */
export declare class StringRules extends Message<StringRules> {
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
    const?: string;
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
    len?: bigint;
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
    minLen?: bigint;
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
    maxLen?: bigint;
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
    lenBytes?: bigint;
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
    minBytes?: bigint;
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
    maxBytes?: bigint;
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
    pattern?: string;
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
    prefix?: string;
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
    suffix?: string;
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
    contains?: string;
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
    notContains?: string;
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
    in: string[];
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
    notIn: string[];
    /**
     * `WellKnown` rules provide advanced constraints against common string
     * patterns
     *
     * @generated from oneof buf.validate.StringRules.well_known
     */
    wellKnown: {
        /**
         * `email` specifies that the field value must be a valid email address
         * (addr-spec only) as defined by [RFC 5322](https://tools.ietf.org/html/rfc5322#section-3.4.1).
         * If the field value isn't a valid email address, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid email address
         *   string value = 1 [(buf.validate.field).string.email = true];
         * }
         * ```
         *
         * @generated from field: bool email = 12;
         */
        value: boolean;
        case: "email";
    } | {
        /**
         * `hostname` specifies that the field value must be a valid
         * hostname as defined by [RFC 1034](https://tools.ietf.org/html/rfc1034#section-3.5). This constraint doesn't support
         * internationalized domain names (IDNs). If the field value isn't a
         * valid hostname, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid hostname
         *   string value = 1 [(buf.validate.field).string.hostname = true];
         * }
         * ```
         *
         * @generated from field: bool hostname = 13;
         */
        value: boolean;
        case: "hostname";
    } | {
        /**
         * `ip` specifies that the field value must be a valid IP
         * (v4 or v6) address, without surrounding square brackets for IPv6 addresses.
         * If the field value isn't a valid IP address, an error message will be
         * generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IP address
         *   string value = 1 [(buf.validate.field).string.ip = true];
         * }
         * ```
         *
         * @generated from field: bool ip = 14;
         */
        value: boolean;
        case: "ip";
    } | {
        /**
         * `ipv4` specifies that the field value must be a valid IPv4
         * address. If the field value isn't a valid IPv4 address, an error message
         * will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv4 address
         *   string value = 1 [(buf.validate.field).string.ipv4 = true];
         * }
         * ```
         *
         * @generated from field: bool ipv4 = 15;
         */
        value: boolean;
        case: "ipv4";
    } | {
        /**
         * `ipv6` specifies that the field value must be a valid
         * IPv6 address, without surrounding square brackets. If the field value is
         * not a valid IPv6 address, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv6 address
         *   string value = 1 [(buf.validate.field).string.ipv6 = true];
         * }
         * ```
         *
         * @generated from field: bool ipv6 = 16;
         */
        value: boolean;
        case: "ipv6";
    } | {
        /**
         * `uri` specifies that the field value must be a valid,
         * absolute URI as defined by [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3). If the field value isn't a valid,
         * absolute URI, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid URI
         *   string value = 1 [(buf.validate.field).string.uri = true];
         * }
         * ```
         *
         * @generated from field: bool uri = 17;
         */
        value: boolean;
        case: "uri";
    } | {
        /**
         * `uri_ref` specifies that the field value must be a valid URI
         * as defined by [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3) and may be either relative or absolute. If the
         * field value isn't a valid URI, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid URI
         *   string value = 1 [(buf.validate.field).string.uri_ref = true];
         * }
         * ```
         *
         * @generated from field: bool uri_ref = 18;
         */
        value: boolean;
        case: "uriRef";
    } | {
        /**
         * `address` specifies that the field value must be either a valid hostname
         * as defined by [RFC 1034](https://tools.ietf.org/html/rfc1034#section-3.5)
         * (which doesn't support internationalized domain names or IDNs) or a valid
         * IP (v4 or v6). If the field value isn't a valid hostname or IP, an error
         * message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid hostname, or ip address
         *   string value = 1 [(buf.validate.field).string.address = true];
         * }
         * ```
         *
         * @generated from field: bool address = 21;
         */
        value: boolean;
        case: "address";
    } | {
        /**
         * `uuid` specifies that the field value must be a valid UUID as defined by
         * [RFC 4122](https://tools.ietf.org/html/rfc4122#section-4.1.2). If the
         * field value isn't a valid UUID, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid UUID
         *   string value = 1 [(buf.validate.field).string.uuid = true];
         * }
         * ```
         *
         * @generated from field: bool uuid = 22;
         */
        value: boolean;
        case: "uuid";
    } | {
        /**
         * `ip_with_prefixlen` specifies that the field value must be a valid IP (v4 or v6)
         * address with prefix length. If the field value isn't a valid IP with prefix
         * length, an error message will be generated.
         *
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IP with prefix length
         *    string value = 1 [(buf.validate.field).string.ip_with_prefixlen = true];
         * }
         * ```
         *
         * @generated from field: bool ip_with_prefixlen = 26;
         */
        value: boolean;
        case: "ipWithPrefixlen";
    } | {
        /**
         * `ipv4_with_prefixlen` specifies that the field value must be a valid
         * IPv4 address with prefix.
         * If the field value isn't a valid IPv4 address with prefix length,
         * an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv4 address with prefix lentgh
         *    string value = 1 [(buf.validate.field).string.ipv4_with_prefixlen = true];
         * }
         * ```
         *
         * @generated from field: bool ipv4_with_prefixlen = 27;
         */
        value: boolean;
        case: "ipv4WithPrefixlen";
    } | {
        /**
         * `ipv6_with_prefixlen` specifies that the field value must be a valid
         * IPv6 address with prefix length.
         * If the field value is not a valid IPv6 address with prefix length,
         * an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv6 address prefix length
         *    string value = 1 [(buf.validate.field).string.ipv6_with_prefixlen = true];
         * }
         * ```
         *
         * @generated from field: bool ipv6_with_prefixlen = 28;
         */
        value: boolean;
        case: "ipv6WithPrefixlen";
    } | {
        /**
         * `ip_prefix` specifies that the field value must be a valid IP (v4 or v6) prefix.
         * If the field value isn't a valid IP prefix, an error message will be
         * generated. The prefix must have all zeros for the masked bits of the prefix (e.g.,
         * `127.0.0.0/16`, not `127.0.0.1/16`).
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IP prefix
         *    string value = 1 [(buf.validate.field).string.ip_prefix = true];
         * }
         * ```
         *
         * @generated from field: bool ip_prefix = 29;
         */
        value: boolean;
        case: "ipPrefix";
    } | {
        /**
         * `ipv4_prefix` specifies that the field value must be a valid IPv4
         * prefix. If the field value isn't a valid IPv4 prefix, an error message
         * will be generated. The prefix must have all zeros for the masked bits of
         * the prefix (e.g., `127.0.0.0/16`, not `127.0.0.1/16`).
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv4 prefix
         *    string value = 1 [(buf.validate.field).string.ipv4_prefix = true];
         * }
         * ```
         *
         * @generated from field: bool ipv4_prefix = 30;
         */
        value: boolean;
        case: "ipv4Prefix";
    } | {
        /**
         * `ipv6_prefix` specifies that the field value must be a valid IPv6 prefix.
         * If the field value is not a valid IPv6 prefix, an error message will be
         * generated. The prefix must have all zeros for the masked bits of the prefix
         * (e.g., `2001:db8::/48`, not `2001:db8::1/48`).
         *
         * ```proto
         * message MyString {
         *   // value must be a valid IPv6 prefix
         *    string value = 1 [(buf.validate.field).string.ipv6_prefix = true];
         * }
         * ```
         *
         * @generated from field: bool ipv6_prefix = 31;
         */
        value: boolean;
        case: "ipv6Prefix";
    } | {
        /**
         * `well_known_regex` specifies a common well-known pattern
         * defined as a regex. If the field value doesn't match the well-known
         * regex, an error message will be generated.
         *
         * ```proto
         * message MyString {
         *   // value must be a valid HTTP header value
         *   string value = 1 [(buf.validate.field).string.well_known_regex = 2];
         * }
         * ```
         *
         * #### KnownRegex
         *
         * `well_known_regex` contains some well-known patterns.
         *
         * | Name                          | Number | Description                               |
         * |-------------------------------|--------|-------------------------------------------|
         * | KNOWN_REGEX_UNSPECIFIED       | 0      |                                           |
         * | KNOWN_REGEX_HTTP_HEADER_NAME  | 1      | HTTP header name as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2)  |
         * | KNOWN_REGEX_HTTP_HEADER_VALUE | 2      | HTTP header value as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230#section-3.2.4) |
         *
         * @generated from field: buf.validate.KnownRegex well_known_regex = 24;
         */
        value: KnownRegex;
        case: "wellKnownRegex";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    strict?: boolean;
    constructor(data?: PartialMessage<StringRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.StringRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StringRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StringRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StringRules;
    static equals(a: StringRules | PlainMessage<StringRules> | undefined, b: StringRules | PlainMessage<StringRules> | undefined): boolean;
}
/**
 * BytesRules describe the constraints applied to `bytes` values. These rules
 * may also be applied to the `google.protobuf.BytesValue` Well-Known-Type.
 *
 * @generated from message buf.validate.BytesRules
 */
export declare class BytesRules extends Message<BytesRules> {
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
    const?: Uint8Array;
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
    len?: bigint;
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
    minLen?: bigint;
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
    maxLen?: bigint;
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
    pattern?: string;
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
    prefix?: Uint8Array;
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
    suffix?: Uint8Array;
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
    contains?: Uint8Array;
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
    in: Uint8Array[];
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
    notIn: Uint8Array[];
    /**
     * WellKnown rules provide advanced constraints against common byte
     * patterns
     *
     * @generated from oneof buf.validate.BytesRules.well_known
     */
    wellKnown: {
        /**
         * `ip` ensures that the field `value` is a valid IP address (v4 or v6) in byte format.
         * If the field value doesn't meet this constraint, an error message is generated.
         *
         * ```proto
         * message MyBytes {
         *   // value must be a valid IP address
         *   optional bytes value = 1 [(buf.validate.field).bytes.ip = true];
         * }
         * ```
         *
         * @generated from field: bool ip = 10;
         */
        value: boolean;
        case: "ip";
    } | {
        /**
         * `ipv4` ensures that the field `value` is a valid IPv4 address in byte format.
         * If the field value doesn't meet this constraint, an error message is generated.
         *
         * ```proto
         * message MyBytes {
         *   // value must be a valid IPv4 address
         *   optional bytes value = 1 [(buf.validate.field).bytes.ipv4 = true];
         * }
         * ```
         *
         * @generated from field: bool ipv4 = 11;
         */
        value: boolean;
        case: "ipv4";
    } | {
        /**
         * `ipv6` ensures that the field `value` is a valid IPv6 address in byte format.
         * If the field value doesn't meet this constraint, an error message is generated.
         * ```proto
         * message MyBytes {
         *   // value must be a valid IPv6 address
         *   optional bytes value = 1 [(buf.validate.field).bytes.ipv6 = true];
         * }
         * ```
         *
         * @generated from field: bool ipv6 = 12;
         */
        value: boolean;
        case: "ipv6";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<BytesRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.BytesRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BytesRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BytesRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BytesRules;
    static equals(a: BytesRules | PlainMessage<BytesRules> | undefined, b: BytesRules | PlainMessage<BytesRules> | undefined): boolean;
}
/**
 * EnumRules describe the constraints applied to `enum` values.
 *
 * @generated from message buf.validate.EnumRules
 */
export declare class EnumRules extends Message<EnumRules> {
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
    const?: number;
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
    definedOnly?: boolean;
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
    in: number[];
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
    notIn: number[];
    constructor(data?: PartialMessage<EnumRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.EnumRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EnumRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EnumRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EnumRules;
    static equals(a: EnumRules | PlainMessage<EnumRules> | undefined, b: EnumRules | PlainMessage<EnumRules> | undefined): boolean;
}
/**
 * RepeatedRules describe the constraints applied to `repeated` values.
 *
 * @generated from message buf.validate.RepeatedRules
 */
export declare class RepeatedRules extends Message<RepeatedRules> {
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
    minItems?: bigint;
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
    maxItems?: bigint;
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
    unique?: boolean;
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
    items?: FieldConstraints;
    constructor(data?: PartialMessage<RepeatedRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.RepeatedRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RepeatedRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RepeatedRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RepeatedRules;
    static equals(a: RepeatedRules | PlainMessage<RepeatedRules> | undefined, b: RepeatedRules | PlainMessage<RepeatedRules> | undefined): boolean;
}
/**
 * MapRules describe the constraints applied to `map` values.
 *
 * @generated from message buf.validate.MapRules
 */
export declare class MapRules extends Message<MapRules> {
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
    minPairs?: bigint;
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
    maxPairs?: bigint;
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
    keys?: FieldConstraints;
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
    values?: FieldConstraints;
    constructor(data?: PartialMessage<MapRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.MapRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MapRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MapRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MapRules;
    static equals(a: MapRules | PlainMessage<MapRules> | undefined, b: MapRules | PlainMessage<MapRules> | undefined): boolean;
}
/**
 * AnyRules describe constraints applied exclusively to the `google.protobuf.Any` well-known type.
 *
 * @generated from message buf.validate.AnyRules
 */
export declare class AnyRules extends Message<AnyRules> {
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
    in: string[];
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
    notIn: string[];
    constructor(data?: PartialMessage<AnyRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.AnyRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AnyRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AnyRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AnyRules;
    static equals(a: AnyRules | PlainMessage<AnyRules> | undefined, b: AnyRules | PlainMessage<AnyRules> | undefined): boolean;
}
/**
 * DurationRules describe the constraints applied exclusively to the `google.protobuf.Duration` well-known type.
 *
 * @generated from message buf.validate.DurationRules
 */
export declare class DurationRules extends Message<DurationRules> {
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
    const?: Duration;
    /**
     * @generated from oneof buf.validate.DurationRules.less_than
     */
    lessThan: {
        /**
         * `lt` stipulates that the field must be less than the specified value of the `google.protobuf.Duration` type,
         * exclusive. If the field's value is greater than or equal to the specified
         * value, an error message will be generated.
         *
         * ```proto
         * message MyDuration {
         *   // value must be less than 5s
         *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.lt = "5s"];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Duration lt = 3;
         */
        value: Duration;
        case: "lt";
    } | {
        /**
         * `lte` indicates that the field must be less than or equal to the specified
         * value of the `google.protobuf.Duration` type, inclusive. If the field's value is greater than the specified value,
         * an error message will be generated.
         *
         * ```proto
         * message MyDuration {
         *   // value must be less than or equal to 10s
         *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.lte = "10s"];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Duration lte = 4;
         */
        value: Duration;
        case: "lte";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.DurationRules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the duration field value to be greater than the specified
         * value (exclusive). If the value of `gt` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyDuration {
         *   // duration must be greater than 5s [duration.gt]
         *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.gt = { seconds: 5 }];
         *
         *   // duration must be greater than 5s and less than 10s [duration.gt_lt]
         *   google.protobuf.Duration another_value = 2 [(buf.validate.field).duration = { gt: { seconds: 5 }, lt: { seconds: 10 } }];
         *
         *   // duration must be greater than 10s or less than 5s [duration.gt_lt_exclusive]
         *   google.protobuf.Duration other_value = 3 [(buf.validate.field).duration = { gt: { seconds: 10 }, lt: { seconds: 5 } }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Duration gt = 5;
         */
        value: Duration;
        case: "gt";
    } | {
        /**
         * `gte` requires the duration field value to be greater than or equal to the
         * specified value (exclusive). If the value of `gte` is larger than a
         * specified `lt` or `lte`, the range is reversed, and the field value must
         * be outside the specified range. If the field value doesn't meet the
         * required conditions, an error message is generated.
         *
         * ```proto
         * message MyDuration {
         *  // duration must be greater than or equal to 5s [duration.gte]
         *  google.protobuf.Duration value = 1 [(buf.validate.field).duration.gte = { seconds: 5 }];
         *
         *  // duration must be greater than or equal to 5s and less than 10s [duration.gte_lt]
         *  google.protobuf.Duration another_value = 2 [(buf.validate.field).duration = { gte: { seconds: 5 }, lt: { seconds: 10 } }];
         *
         *  // duration must be greater than or equal to 10s or less than 5s [duration.gte_lt_exclusive]
         *  google.protobuf.Duration other_value = 3 [(buf.validate.field).duration = { gte: { seconds: 10 }, lt: { seconds: 5 } }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Duration gte = 6;
         */
        value: Duration;
        case: "gte";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    in: Duration[];
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
    notIn: Duration[];
    constructor(data?: PartialMessage<DurationRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.DurationRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DurationRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DurationRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DurationRules;
    static equals(a: DurationRules | PlainMessage<DurationRules> | undefined, b: DurationRules | PlainMessage<DurationRules> | undefined): boolean;
}
/**
 * TimestampRules describe the constraints applied exclusively to the `google.protobuf.Timestamp` well-known type.
 *
 * @generated from message buf.validate.TimestampRules
 */
export declare class TimestampRules extends Message<TimestampRules> {
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
    const?: Timestamp;
    /**
     * @generated from oneof buf.validate.TimestampRules.less_than
     */
    lessThan: {
        /**
         * requires the duration field value to be less than the specified value (field < value). If the field value doesn't meet the required conditions, an error message is generated.
         *
         * ```proto
         * message MyDuration {
         *   // duration must be less than 'P3D' [duration.lt]
         *   google.protobuf.Duration value = 1 [(buf.validate.field).duration.lt = { seconds: 259200 }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Timestamp lt = 3;
         */
        value: Timestamp;
        case: "lt";
    } | {
        /**
         * requires the timestamp field value to be less than or equal to the specified value (field <= value). If the field value doesn't meet the required conditions, an error message is generated.
         *
         * ```proto
         * message MyTimestamp {
         *   // timestamp must be less than or equal to '2023-05-14T00:00:00Z' [timestamp.lte]
         *   google.protobuf.Timestamp value = 1 [(buf.validate.field).timestamp.lte = { seconds: 1678867200 }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Timestamp lte = 4;
         */
        value: Timestamp;
        case: "lte";
    } | {
        /**
         * `lt_now` specifies that this field, of the `google.protobuf.Timestamp` type, must be less than the current time. `lt_now` can only be used with the `within` rule.
         *
         * ```proto
         * message MyTimestamp {
         *  // value must be less than now
         *   google.protobuf.Timestamp created_at = 1 [(buf.validate.field).timestamp.lt_now = true];
         * }
         * ```
         *
         * @generated from field: bool lt_now = 7;
         */
        value: boolean;
        case: "ltNow";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from oneof buf.validate.TimestampRules.greater_than
     */
    greaterThan: {
        /**
         * `gt` requires the timestamp field value to be greater than the specified
         * value (exclusive). If the value of `gt` is larger than a specified `lt`
         * or `lte`, the range is reversed, and the field value must be outside the
         * specified range. If the field value doesn't meet the required conditions,
         * an error message is generated.
         *
         * ```proto
         * message MyTimestamp {
         *   // timestamp must be greater than '2023-01-01T00:00:00Z' [timestamp.gt]
         *   google.protobuf.Timestamp value = 1 [(buf.validate.field).timestamp.gt = { seconds: 1672444800 }];
         *
         *   // timestamp must be greater than '2023-01-01T00:00:00Z' and less than '2023-01-02T00:00:00Z' [timestamp.gt_lt]
         *   google.protobuf.Timestamp another_value = 2 [(buf.validate.field).timestamp = { gt: { seconds: 1672444800 }, lt: { seconds: 1672531200 } }];
         *
         *   // timestamp must be greater than '2023-01-02T00:00:00Z' or less than '2023-01-01T00:00:00Z' [timestamp.gt_lt_exclusive]
         *   google.protobuf.Timestamp other_value = 3 [(buf.validate.field).timestamp = { gt: { seconds: 1672531200 }, lt: { seconds: 1672444800 } }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Timestamp gt = 5;
         */
        value: Timestamp;
        case: "gt";
    } | {
        /**
         * `gte` requires the timestamp field value to be greater than or equal to the
         * specified value (exclusive). If the value of `gte` is larger than a
         * specified `lt` or `lte`, the range is reversed, and the field value
         * must be outside the specified range. If the field value doesn't meet
         * the required conditions, an error message is generated.
         *
         * ```proto
         * message MyTimestamp {
         *   // timestamp must be greater than or equal to '2023-01-01T00:00:00Z' [timestamp.gte]
         *   google.protobuf.Timestamp value = 1 [(buf.validate.field).timestamp.gte = { seconds: 1672444800 }];
         *
         *   // timestamp must be greater than or equal to '2023-01-01T00:00:00Z' and less than '2023-01-02T00:00:00Z' [timestamp.gte_lt]
         *   google.protobuf.Timestamp another_value = 2 [(buf.validate.field).timestamp = { gte: { seconds: 1672444800 }, lt: { seconds: 1672531200 } }];
         *
         *   // timestamp must be greater than or equal to '2023-01-02T00:00:00Z' or less than '2023-01-01T00:00:00Z' [timestamp.gte_lt_exclusive]
         *   google.protobuf.Timestamp other_value = 3 [(buf.validate.field).timestamp = { gte: { seconds: 1672531200 }, lt: { seconds: 1672444800 } }];
         * }
         * ```
         *
         * @generated from field: google.protobuf.Timestamp gte = 6;
         */
        value: Timestamp;
        case: "gte";
    } | {
        /**
         * `gt_now` specifies that this field, of the `google.protobuf.Timestamp` type, must be greater than the current time. `gt_now` can only be used with the `within` rule.
         *
         * ```proto
         * message MyTimestamp {
         *   // value must be greater than now
         *   google.protobuf.Timestamp created_at = 1 [(buf.validate.field).timestamp.gt_now = true];
         * }
         * ```
         *
         * @generated from field: bool gt_now = 8;
         */
        value: boolean;
        case: "gtNow";
    } | {
        case: undefined;
        value?: undefined;
    };
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
    within?: Duration;
    constructor(data?: PartialMessage<TimestampRules>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.TimestampRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TimestampRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TimestampRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TimestampRules;
    static equals(a: TimestampRules | PlainMessage<TimestampRules> | undefined, b: TimestampRules | PlainMessage<TimestampRules> | undefined): boolean;
}
