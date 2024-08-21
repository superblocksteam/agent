import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Duration, Message, proto2, Timestamp } from "@bufbuild/protobuf";
/**
 * WellKnownRegex contain some well-known patterns.
 *
 * @generated from enum validate.KnownRegex
 */
export declare enum KnownRegex {
    /**
     * @generated from enum value: UNKNOWN = 0;
     */
    UNKNOWN = 0,
    /**
     * HTTP header name as defined by RFC 7230.
     *
     * @generated from enum value: HTTP_HEADER_NAME = 1;
     */
    HTTP_HEADER_NAME = 1,
    /**
     * HTTP header value as defined by RFC 7230.
     *
     * @generated from enum value: HTTP_HEADER_VALUE = 2;
     */
    HTTP_HEADER_VALUE = 2
}
/**
 * FieldRules encapsulates the rules for each type of field. Depending on the
 * field, the correct set should be used to ensure proper validations.
 *
 * @generated from message validate.FieldRules
 */
export declare class FieldRules extends Message<FieldRules> {
    /**
     * @generated from field: optional validate.MessageRules message = 17;
     */
    message?: MessageRules;
    /**
     * @generated from oneof validate.FieldRules.type
     */
    type: {
        /**
         * Scalar Field Types
         *
         * @generated from field: validate.FloatRules float = 1;
         */
        value: FloatRules;
        case: "float";
    } | {
        /**
         * @generated from field: validate.DoubleRules double = 2;
         */
        value: DoubleRules;
        case: "double";
    } | {
        /**
         * @generated from field: validate.Int32Rules int32 = 3;
         */
        value: Int32Rules;
        case: "int32";
    } | {
        /**
         * @generated from field: validate.Int64Rules int64 = 4;
         */
        value: Int64Rules;
        case: "int64";
    } | {
        /**
         * @generated from field: validate.UInt32Rules uint32 = 5;
         */
        value: UInt32Rules;
        case: "uint32";
    } | {
        /**
         * @generated from field: validate.UInt64Rules uint64 = 6;
         */
        value: UInt64Rules;
        case: "uint64";
    } | {
        /**
         * @generated from field: validate.SInt32Rules sint32 = 7;
         */
        value: SInt32Rules;
        case: "sint32";
    } | {
        /**
         * @generated from field: validate.SInt64Rules sint64 = 8;
         */
        value: SInt64Rules;
        case: "sint64";
    } | {
        /**
         * @generated from field: validate.Fixed32Rules fixed32 = 9;
         */
        value: Fixed32Rules;
        case: "fixed32";
    } | {
        /**
         * @generated from field: validate.Fixed64Rules fixed64 = 10;
         */
        value: Fixed64Rules;
        case: "fixed64";
    } | {
        /**
         * @generated from field: validate.SFixed32Rules sfixed32 = 11;
         */
        value: SFixed32Rules;
        case: "sfixed32";
    } | {
        /**
         * @generated from field: validate.SFixed64Rules sfixed64 = 12;
         */
        value: SFixed64Rules;
        case: "sfixed64";
    } | {
        /**
         * @generated from field: validate.BoolRules bool = 13;
         */
        value: BoolRules;
        case: "bool";
    } | {
        /**
         * @generated from field: validate.StringRules string = 14;
         */
        value: StringRules;
        case: "string";
    } | {
        /**
         * @generated from field: validate.BytesRules bytes = 15;
         */
        value: BytesRules;
        case: "bytes";
    } | {
        /**
         * Complex Field Types
         *
         * @generated from field: validate.EnumRules enum = 16;
         */
        value: EnumRules;
        case: "enum";
    } | {
        /**
         * @generated from field: validate.RepeatedRules repeated = 18;
         */
        value: RepeatedRules;
        case: "repeated";
    } | {
        /**
         * @generated from field: validate.MapRules map = 19;
         */
        value: MapRules;
        case: "map";
    } | {
        /**
         * Well-Known Field Types
         *
         * @generated from field: validate.AnyRules any = 20;
         */
        value: AnyRules;
        case: "any";
    } | {
        /**
         * @generated from field: validate.DurationRules duration = 21;
         */
        value: DurationRules;
        case: "duration";
    } | {
        /**
         * @generated from field: validate.TimestampRules timestamp = 22;
         */
        value: TimestampRules;
        case: "timestamp";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<FieldRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.FieldRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FieldRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FieldRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FieldRules;
    static equals(a: FieldRules | PlainMessage<FieldRules> | undefined, b: FieldRules | PlainMessage<FieldRules> | undefined): boolean;
}
/**
 * FloatRules describes the constraints applied to `float` values
 *
 * @generated from message validate.FloatRules
 */
export declare class FloatRules extends Message<FloatRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional float const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional float lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional float lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional float gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional float gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated float in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated float not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<FloatRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.FloatRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FloatRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FloatRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FloatRules;
    static equals(a: FloatRules | PlainMessage<FloatRules> | undefined, b: FloatRules | PlainMessage<FloatRules> | undefined): boolean;
}
/**
 * DoubleRules describes the constraints applied to `double` values
 *
 * @generated from message validate.DoubleRules
 */
export declare class DoubleRules extends Message<DoubleRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional double const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional double lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional double lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional double gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional double gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated double in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated double not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<DoubleRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.DoubleRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DoubleRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DoubleRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DoubleRules;
    static equals(a: DoubleRules | PlainMessage<DoubleRules> | undefined, b: DoubleRules | PlainMessage<DoubleRules> | undefined): boolean;
}
/**
 * Int32Rules describes the constraints applied to `int32` values
 *
 * @generated from message validate.Int32Rules
 */
export declare class Int32Rules extends Message<Int32Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional int32 const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional int32 lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional int32 lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional int32 gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional int32 gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated int32 in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated int32 not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<Int32Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.Int32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Int32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Int32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Int32Rules;
    static equals(a: Int32Rules | PlainMessage<Int32Rules> | undefined, b: Int32Rules | PlainMessage<Int32Rules> | undefined): boolean;
}
/**
 * Int64Rules describes the constraints applied to `int64` values
 *
 * @generated from message validate.Int64Rules
 */
export declare class Int64Rules extends Message<Int64Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional int64 const = 1;
     */
    const?: bigint;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional int64 lt = 2;
     */
    lt?: bigint;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional int64 lte = 3;
     */
    lte?: bigint;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional int64 gt = 4;
     */
    gt?: bigint;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional int64 gte = 5;
     */
    gte?: bigint;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated int64 in = 6;
     */
    in: bigint[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated int64 not_in = 7;
     */
    notIn: bigint[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<Int64Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.Int64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Int64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Int64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Int64Rules;
    static equals(a: Int64Rules | PlainMessage<Int64Rules> | undefined, b: Int64Rules | PlainMessage<Int64Rules> | undefined): boolean;
}
/**
 * UInt32Rules describes the constraints applied to `uint32` values
 *
 * @generated from message validate.UInt32Rules
 */
export declare class UInt32Rules extends Message<UInt32Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional uint32 const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional uint32 lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional uint32 lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional uint32 gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional uint32 gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated uint32 in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated uint32 not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<UInt32Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.UInt32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UInt32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UInt32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UInt32Rules;
    static equals(a: UInt32Rules | PlainMessage<UInt32Rules> | undefined, b: UInt32Rules | PlainMessage<UInt32Rules> | undefined): boolean;
}
/**
 * UInt64Rules describes the constraints applied to `uint64` values
 *
 * @generated from message validate.UInt64Rules
 */
export declare class UInt64Rules extends Message<UInt64Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional uint64 const = 1;
     */
    const?: bigint;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional uint64 lt = 2;
     */
    lt?: bigint;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional uint64 lte = 3;
     */
    lte?: bigint;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional uint64 gt = 4;
     */
    gt?: bigint;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional uint64 gte = 5;
     */
    gte?: bigint;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated uint64 in = 6;
     */
    in: bigint[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated uint64 not_in = 7;
     */
    notIn: bigint[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<UInt64Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.UInt64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UInt64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UInt64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UInt64Rules;
    static equals(a: UInt64Rules | PlainMessage<UInt64Rules> | undefined, b: UInt64Rules | PlainMessage<UInt64Rules> | undefined): boolean;
}
/**
 * SInt32Rules describes the constraints applied to `sint32` values
 *
 * @generated from message validate.SInt32Rules
 */
export declare class SInt32Rules extends Message<SInt32Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional sint32 const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional sint32 lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional sint32 lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional sint32 gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional sint32 gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated sint32 in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated sint32 not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<SInt32Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.SInt32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SInt32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SInt32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SInt32Rules;
    static equals(a: SInt32Rules | PlainMessage<SInt32Rules> | undefined, b: SInt32Rules | PlainMessage<SInt32Rules> | undefined): boolean;
}
/**
 * SInt64Rules describes the constraints applied to `sint64` values
 *
 * @generated from message validate.SInt64Rules
 */
export declare class SInt64Rules extends Message<SInt64Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional sint64 const = 1;
     */
    const?: bigint;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional sint64 lt = 2;
     */
    lt?: bigint;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional sint64 lte = 3;
     */
    lte?: bigint;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional sint64 gt = 4;
     */
    gt?: bigint;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional sint64 gte = 5;
     */
    gte?: bigint;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated sint64 in = 6;
     */
    in: bigint[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated sint64 not_in = 7;
     */
    notIn: bigint[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<SInt64Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.SInt64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SInt64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SInt64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SInt64Rules;
    static equals(a: SInt64Rules | PlainMessage<SInt64Rules> | undefined, b: SInt64Rules | PlainMessage<SInt64Rules> | undefined): boolean;
}
/**
 * Fixed32Rules describes the constraints applied to `fixed32` values
 *
 * @generated from message validate.Fixed32Rules
 */
export declare class Fixed32Rules extends Message<Fixed32Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional fixed32 const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional fixed32 lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional fixed32 lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional fixed32 gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional fixed32 gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated fixed32 in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated fixed32 not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<Fixed32Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.Fixed32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fixed32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fixed32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fixed32Rules;
    static equals(a: Fixed32Rules | PlainMessage<Fixed32Rules> | undefined, b: Fixed32Rules | PlainMessage<Fixed32Rules> | undefined): boolean;
}
/**
 * Fixed64Rules describes the constraints applied to `fixed64` values
 *
 * @generated from message validate.Fixed64Rules
 */
export declare class Fixed64Rules extends Message<Fixed64Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional fixed64 const = 1;
     */
    const?: bigint;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional fixed64 lt = 2;
     */
    lt?: bigint;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional fixed64 lte = 3;
     */
    lte?: bigint;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional fixed64 gt = 4;
     */
    gt?: bigint;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional fixed64 gte = 5;
     */
    gte?: bigint;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated fixed64 in = 6;
     */
    in: bigint[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated fixed64 not_in = 7;
     */
    notIn: bigint[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<Fixed64Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.Fixed64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Fixed64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Fixed64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Fixed64Rules;
    static equals(a: Fixed64Rules | PlainMessage<Fixed64Rules> | undefined, b: Fixed64Rules | PlainMessage<Fixed64Rules> | undefined): boolean;
}
/**
 * SFixed32Rules describes the constraints applied to `sfixed32` values
 *
 * @generated from message validate.SFixed32Rules
 */
export declare class SFixed32Rules extends Message<SFixed32Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional sfixed32 const = 1;
     */
    const?: number;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional sfixed32 lt = 2;
     */
    lt?: number;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional sfixed32 lte = 3;
     */
    lte?: number;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional sfixed32 gt = 4;
     */
    gt?: number;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional sfixed32 gte = 5;
     */
    gte?: number;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated sfixed32 in = 6;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated sfixed32 not_in = 7;
     */
    notIn: number[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<SFixed32Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.SFixed32Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SFixed32Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SFixed32Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SFixed32Rules;
    static equals(a: SFixed32Rules | PlainMessage<SFixed32Rules> | undefined, b: SFixed32Rules | PlainMessage<SFixed32Rules> | undefined): boolean;
}
/**
 * SFixed64Rules describes the constraints applied to `sfixed64` values
 *
 * @generated from message validate.SFixed64Rules
 */
export declare class SFixed64Rules extends Message<SFixed64Rules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional sfixed64 const = 1;
     */
    const?: bigint;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional sfixed64 lt = 2;
     */
    lt?: bigint;
    /**
     * Lte specifies that this field must be less than or equal to the
     * specified value, inclusive
     *
     * @generated from field: optional sfixed64 lte = 3;
     */
    lte?: bigint;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive. If the value of Gt is larger than a specified Lt or Lte, the
     * range is reversed.
     *
     * @generated from field: optional sfixed64 gt = 4;
     */
    gt?: bigint;
    /**
     * Gte specifies that this field must be greater than or equal to the
     * specified value, inclusive. If the value of Gte is larger than a
     * specified Lt or Lte, the range is reversed.
     *
     * @generated from field: optional sfixed64 gte = 5;
     */
    gte?: bigint;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated sfixed64 in = 6;
     */
    in: bigint[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated sfixed64 not_in = 7;
     */
    notIn: bigint[];
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 8;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<SFixed64Rules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.SFixed64Rules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SFixed64Rules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SFixed64Rules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SFixed64Rules;
    static equals(a: SFixed64Rules | PlainMessage<SFixed64Rules> | undefined, b: SFixed64Rules | PlainMessage<SFixed64Rules> | undefined): boolean;
}
/**
 * BoolRules describes the constraints applied to `bool` values
 *
 * @generated from message validate.BoolRules
 */
export declare class BoolRules extends Message<BoolRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional bool const = 1;
     */
    const?: boolean;
    constructor(data?: PartialMessage<BoolRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.BoolRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BoolRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BoolRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BoolRules;
    static equals(a: BoolRules | PlainMessage<BoolRules> | undefined, b: BoolRules | PlainMessage<BoolRules> | undefined): boolean;
}
/**
 * StringRules describe the constraints applied to `string` values
 *
 * @generated from message validate.StringRules
 */
export declare class StringRules extends Message<StringRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional string const = 1;
     */
    const?: string;
    /**
     * Len specifies that this field must be the specified number of
     * characters (Unicode code points). Note that the number of
     * characters may differ from the number of bytes in the string.
     *
     * @generated from field: optional uint64 len = 19;
     */
    len?: bigint;
    /**
     * MinLen specifies that this field must be the specified number of
     * characters (Unicode code points) at a minimum. Note that the number of
     * characters may differ from the number of bytes in the string.
     *
     * @generated from field: optional uint64 min_len = 2;
     */
    minLen?: bigint;
    /**
     * MaxLen specifies that this field must be the specified number of
     * characters (Unicode code points) at a maximum. Note that the number of
     * characters may differ from the number of bytes in the string.
     *
     * @generated from field: optional uint64 max_len = 3;
     */
    maxLen?: bigint;
    /**
     * LenBytes specifies that this field must be the specified number of bytes
     *
     * @generated from field: optional uint64 len_bytes = 20;
     */
    lenBytes?: bigint;
    /**
     * MinBytes specifies that this field must be the specified number of bytes
     * at a minimum
     *
     * @generated from field: optional uint64 min_bytes = 4;
     */
    minBytes?: bigint;
    /**
     * MaxBytes specifies that this field must be the specified number of bytes
     * at a maximum
     *
     * @generated from field: optional uint64 max_bytes = 5;
     */
    maxBytes?: bigint;
    /**
     * Pattern specifes that this field must match against the specified
     * regular expression (RE2 syntax). The included expression should elide
     * any delimiters.
     *
     * @generated from field: optional string pattern = 6;
     */
    pattern?: string;
    /**
     * Prefix specifies that this field must have the specified substring at
     * the beginning of the string.
     *
     * @generated from field: optional string prefix = 7;
     */
    prefix?: string;
    /**
     * Suffix specifies that this field must have the specified substring at
     * the end of the string.
     *
     * @generated from field: optional string suffix = 8;
     */
    suffix?: string;
    /**
     * Contains specifies that this field must have the specified substring
     * anywhere in the string.
     *
     * @generated from field: optional string contains = 9;
     */
    contains?: string;
    /**
     * NotContains specifies that this field cannot have the specified substring
     * anywhere in the string.
     *
     * @generated from field: optional string not_contains = 23;
     */
    notContains?: string;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated string in = 10;
     */
    in: string[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated string not_in = 11;
     */
    notIn: string[];
    /**
     * WellKnown rules provide advanced constraints against common string
     * patterns
     *
     * @generated from oneof validate.StringRules.well_known
     */
    wellKnown: {
        /**
         * Email specifies that the field must be a valid email address as
         * defined by RFC 5322
         *
         * @generated from field: bool email = 12;
         */
        value: boolean;
        case: "email";
    } | {
        /**
         * Hostname specifies that the field must be a valid hostname as
         * defined by RFC 1034. This constraint does not support
         * internationalized domain names (IDNs).
         *
         * @generated from field: bool hostname = 13;
         */
        value: boolean;
        case: "hostname";
    } | {
        /**
         * Ip specifies that the field must be a valid IP (v4 or v6) address.
         * Valid IPv6 addresses should not include surrounding square brackets.
         *
         * @generated from field: bool ip = 14;
         */
        value: boolean;
        case: "ip";
    } | {
        /**
         * Ipv4 specifies that the field must be a valid IPv4 address.
         *
         * @generated from field: bool ipv4 = 15;
         */
        value: boolean;
        case: "ipv4";
    } | {
        /**
         * Ipv6 specifies that the field must be a valid IPv6 address. Valid
         * IPv6 addresses should not include surrounding square brackets.
         *
         * @generated from field: bool ipv6 = 16;
         */
        value: boolean;
        case: "ipv6";
    } | {
        /**
         * Uri specifies that the field must be a valid, absolute URI as defined
         * by RFC 3986
         *
         * @generated from field: bool uri = 17;
         */
        value: boolean;
        case: "uri";
    } | {
        /**
         * UriRef specifies that the field must be a valid URI as defined by RFC
         * 3986 and may be relative or absolute.
         *
         * @generated from field: bool uri_ref = 18;
         */
        value: boolean;
        case: "uriRef";
    } | {
        /**
         * Address specifies that the field must be either a valid hostname as
         * defined by RFC 1034 (which does not support internationalized domain
         * names or IDNs), or it can be a valid IP (v4 or v6).
         *
         * @generated from field: bool address = 21;
         */
        value: boolean;
        case: "address";
    } | {
        /**
         * Uuid specifies that the field must be a valid UUID as defined by
         * RFC 4122
         *
         * @generated from field: bool uuid = 22;
         */
        value: boolean;
        case: "uuid";
    } | {
        /**
         * WellKnownRegex specifies a common well known pattern defined as a regex.
         *
         * @generated from field: validate.KnownRegex well_known_regex = 24;
         */
        value: KnownRegex;
        case: "wellKnownRegex";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * This applies to regexes HTTP_HEADER_NAME and HTTP_HEADER_VALUE to enable
     * strict header validation.
     * By default, this is true, and HTTP header validations are RFC-compliant.
     * Setting to false will enable a looser validations that only disallows
     * \r\n\0 characters, which can be used to bypass header matching rules.
     *
     * @generated from field: optional bool strict = 25 [default = true];
     */
    strict?: boolean;
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 26;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<StringRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.StringRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StringRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StringRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StringRules;
    static equals(a: StringRules | PlainMessage<StringRules> | undefined, b: StringRules | PlainMessage<StringRules> | undefined): boolean;
}
/**
 * BytesRules describe the constraints applied to `bytes` values
 *
 * @generated from message validate.BytesRules
 */
export declare class BytesRules extends Message<BytesRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional bytes const = 1;
     */
    const?: Uint8Array;
    /**
     * Len specifies that this field must be the specified number of bytes
     *
     * @generated from field: optional uint64 len = 13;
     */
    len?: bigint;
    /**
     * MinLen specifies that this field must be the specified number of bytes
     * at a minimum
     *
     * @generated from field: optional uint64 min_len = 2;
     */
    minLen?: bigint;
    /**
     * MaxLen specifies that this field must be the specified number of bytes
     * at a maximum
     *
     * @generated from field: optional uint64 max_len = 3;
     */
    maxLen?: bigint;
    /**
     * Pattern specifes that this field must match against the specified
     * regular expression (RE2 syntax). The included expression should elide
     * any delimiters.
     *
     * @generated from field: optional string pattern = 4;
     */
    pattern?: string;
    /**
     * Prefix specifies that this field must have the specified bytes at the
     * beginning of the string.
     *
     * @generated from field: optional bytes prefix = 5;
     */
    prefix?: Uint8Array;
    /**
     * Suffix specifies that this field must have the specified bytes at the
     * end of the string.
     *
     * @generated from field: optional bytes suffix = 6;
     */
    suffix?: Uint8Array;
    /**
     * Contains specifies that this field must have the specified bytes
     * anywhere in the string.
     *
     * @generated from field: optional bytes contains = 7;
     */
    contains?: Uint8Array;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated bytes in = 8;
     */
    in: Uint8Array[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated bytes not_in = 9;
     */
    notIn: Uint8Array[];
    /**
     * WellKnown rules provide advanced constraints against common byte
     * patterns
     *
     * @generated from oneof validate.BytesRules.well_known
     */
    wellKnown: {
        /**
         * Ip specifies that the field must be a valid IP (v4 or v6) address in
         * byte format
         *
         * @generated from field: bool ip = 10;
         */
        value: boolean;
        case: "ip";
    } | {
        /**
         * Ipv4 specifies that the field must be a valid IPv4 address in byte
         * format
         *
         * @generated from field: bool ipv4 = 11;
         */
        value: boolean;
        case: "ipv4";
    } | {
        /**
         * Ipv6 specifies that the field must be a valid IPv6 address in byte
         * format
         *
         * @generated from field: bool ipv6 = 12;
         */
        value: boolean;
        case: "ipv6";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 14;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<BytesRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.BytesRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BytesRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BytesRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BytesRules;
    static equals(a: BytesRules | PlainMessage<BytesRules> | undefined, b: BytesRules | PlainMessage<BytesRules> | undefined): boolean;
}
/**
 * EnumRules describe the constraints applied to enum values
 *
 * @generated from message validate.EnumRules
 */
export declare class EnumRules extends Message<EnumRules> {
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional int32 const = 1;
     */
    const?: number;
    /**
     * DefinedOnly specifies that this field must be only one of the defined
     * values for this enum, failing on any undefined value.
     *
     * @generated from field: optional bool defined_only = 2;
     */
    definedOnly?: boolean;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated int32 in = 3;
     */
    in: number[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated int32 not_in = 4;
     */
    notIn: number[];
    constructor(data?: PartialMessage<EnumRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.EnumRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EnumRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EnumRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EnumRules;
    static equals(a: EnumRules | PlainMessage<EnumRules> | undefined, b: EnumRules | PlainMessage<EnumRules> | undefined): boolean;
}
/**
 * MessageRules describe the constraints applied to embedded message values.
 * For message-type fields, validation is performed recursively.
 *
 * @generated from message validate.MessageRules
 */
export declare class MessageRules extends Message<MessageRules> {
    /**
     * Skip specifies that the validation rules of this field should not be
     * evaluated
     *
     * @generated from field: optional bool skip = 1;
     */
    skip?: boolean;
    /**
     * Required specifies that this field must be set
     *
     * @generated from field: optional bool required = 2;
     */
    required?: boolean;
    constructor(data?: PartialMessage<MessageRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.MessageRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MessageRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MessageRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MessageRules;
    static equals(a: MessageRules | PlainMessage<MessageRules> | undefined, b: MessageRules | PlainMessage<MessageRules> | undefined): boolean;
}
/**
 * RepeatedRules describe the constraints applied to `repeated` values
 *
 * @generated from message validate.RepeatedRules
 */
export declare class RepeatedRules extends Message<RepeatedRules> {
    /**
     * MinItems specifies that this field must have the specified number of
     * items at a minimum
     *
     * @generated from field: optional uint64 min_items = 1;
     */
    minItems?: bigint;
    /**
     * MaxItems specifies that this field must have the specified number of
     * items at a maximum
     *
     * @generated from field: optional uint64 max_items = 2;
     */
    maxItems?: bigint;
    /**
     * Unique specifies that all elements in this field must be unique. This
     * contraint is only applicable to scalar and enum types (messages are not
     * supported).
     *
     * @generated from field: optional bool unique = 3;
     */
    unique?: boolean;
    /**
     * Items specifies the contraints to be applied to each item in the field.
     * Repeated message fields will still execute validation against each item
     * unless skip is specified here.
     *
     * @generated from field: optional validate.FieldRules items = 4;
     */
    items?: FieldRules;
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 5;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<RepeatedRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.RepeatedRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RepeatedRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RepeatedRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RepeatedRules;
    static equals(a: RepeatedRules | PlainMessage<RepeatedRules> | undefined, b: RepeatedRules | PlainMessage<RepeatedRules> | undefined): boolean;
}
/**
 * MapRules describe the constraints applied to `map` values
 *
 * @generated from message validate.MapRules
 */
export declare class MapRules extends Message<MapRules> {
    /**
     * MinPairs specifies that this field must have the specified number of
     * KVs at a minimum
     *
     * @generated from field: optional uint64 min_pairs = 1;
     */
    minPairs?: bigint;
    /**
     * MaxPairs specifies that this field must have the specified number of
     * KVs at a maximum
     *
     * @generated from field: optional uint64 max_pairs = 2;
     */
    maxPairs?: bigint;
    /**
     * NoSparse specifies values in this field cannot be unset. This only
     * applies to map's with message value types.
     *
     * @generated from field: optional bool no_sparse = 3;
     */
    noSparse?: boolean;
    /**
     * Keys specifies the constraints to be applied to each key in the field.
     *
     * @generated from field: optional validate.FieldRules keys = 4;
     */
    keys?: FieldRules;
    /**
     * Values specifies the constraints to be applied to the value of each key
     * in the field. Message values will still have their validations evaluated
     * unless skip is specified here.
     *
     * @generated from field: optional validate.FieldRules values = 5;
     */
    values?: FieldRules;
    /**
     * IgnoreEmpty specifies that the validation rules of this field should be
     * evaluated only if the field is not empty
     *
     * @generated from field: optional bool ignore_empty = 6;
     */
    ignoreEmpty?: boolean;
    constructor(data?: PartialMessage<MapRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.MapRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MapRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MapRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MapRules;
    static equals(a: MapRules | PlainMessage<MapRules> | undefined, b: MapRules | PlainMessage<MapRules> | undefined): boolean;
}
/**
 * AnyRules describe constraints applied exclusively to the
 * `google.protobuf.Any` well-known type
 *
 * @generated from message validate.AnyRules
 */
export declare class AnyRules extends Message<AnyRules> {
    /**
     * Required specifies that this field must be set
     *
     * @generated from field: optional bool required = 1;
     */
    required?: boolean;
    /**
     * In specifies that this field's `type_url` must be equal to one of the
     * specified values.
     *
     * @generated from field: repeated string in = 2;
     */
    in: string[];
    /**
     * NotIn specifies that this field's `type_url` must not be equal to any of
     * the specified values.
     *
     * @generated from field: repeated string not_in = 3;
     */
    notIn: string[];
    constructor(data?: PartialMessage<AnyRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.AnyRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AnyRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AnyRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AnyRules;
    static equals(a: AnyRules | PlainMessage<AnyRules> | undefined, b: AnyRules | PlainMessage<AnyRules> | undefined): boolean;
}
/**
 * DurationRules describe the constraints applied exclusively to the
 * `google.protobuf.Duration` well-known type
 *
 * @generated from message validate.DurationRules
 */
export declare class DurationRules extends Message<DurationRules> {
    /**
     * Required specifies that this field must be set
     *
     * @generated from field: optional bool required = 1;
     */
    required?: boolean;
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional google.protobuf.Duration const = 2;
     */
    const?: Duration;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional google.protobuf.Duration lt = 3;
     */
    lt?: Duration;
    /**
     * Lt specifies that this field must be less than the specified value,
     * inclusive
     *
     * @generated from field: optional google.protobuf.Duration lte = 4;
     */
    lte?: Duration;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive
     *
     * @generated from field: optional google.protobuf.Duration gt = 5;
     */
    gt?: Duration;
    /**
     * Gte specifies that this field must be greater than the specified value,
     * inclusive
     *
     * @generated from field: optional google.protobuf.Duration gte = 6;
     */
    gte?: Duration;
    /**
     * In specifies that this field must be equal to one of the specified
     * values
     *
     * @generated from field: repeated google.protobuf.Duration in = 7;
     */
    in: Duration[];
    /**
     * NotIn specifies that this field cannot be equal to one of the specified
     * values
     *
     * @generated from field: repeated google.protobuf.Duration not_in = 8;
     */
    notIn: Duration[];
    constructor(data?: PartialMessage<DurationRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.DurationRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DurationRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DurationRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DurationRules;
    static equals(a: DurationRules | PlainMessage<DurationRules> | undefined, b: DurationRules | PlainMessage<DurationRules> | undefined): boolean;
}
/**
 * TimestampRules describe the constraints applied exclusively to the
 * `google.protobuf.Timestamp` well-known type
 *
 * @generated from message validate.TimestampRules
 */
export declare class TimestampRules extends Message<TimestampRules> {
    /**
     * Required specifies that this field must be set
     *
     * @generated from field: optional bool required = 1;
     */
    required?: boolean;
    /**
     * Const specifies that this field must be exactly the specified value
     *
     * @generated from field: optional google.protobuf.Timestamp const = 2;
     */
    const?: Timestamp;
    /**
     * Lt specifies that this field must be less than the specified value,
     * exclusive
     *
     * @generated from field: optional google.protobuf.Timestamp lt = 3;
     */
    lt?: Timestamp;
    /**
     * Lte specifies that this field must be less than the specified value,
     * inclusive
     *
     * @generated from field: optional google.protobuf.Timestamp lte = 4;
     */
    lte?: Timestamp;
    /**
     * Gt specifies that this field must be greater than the specified value,
     * exclusive
     *
     * @generated from field: optional google.protobuf.Timestamp gt = 5;
     */
    gt?: Timestamp;
    /**
     * Gte specifies that this field must be greater than the specified value,
     * inclusive
     *
     * @generated from field: optional google.protobuf.Timestamp gte = 6;
     */
    gte?: Timestamp;
    /**
     * LtNow specifies that this must be less than the current time. LtNow
     * can only be used with the Within rule.
     *
     * @generated from field: optional bool lt_now = 7;
     */
    ltNow?: boolean;
    /**
     * GtNow specifies that this must be greater than the current time. GtNow
     * can only be used with the Within rule.
     *
     * @generated from field: optional bool gt_now = 8;
     */
    gtNow?: boolean;
    /**
     * Within specifies that this field must be within this duration of the
     * current time. This constraint can be used alone or with the LtNow and
     * GtNow rules.
     *
     * @generated from field: optional google.protobuf.Duration within = 9;
     */
    within?: Duration;
    constructor(data?: PartialMessage<TimestampRules>);
    static readonly runtime: typeof proto2;
    static readonly typeName = "validate.TimestampRules";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TimestampRules;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TimestampRules;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TimestampRules;
    static equals(a: TimestampRules | PlainMessage<TimestampRules> | undefined, b: TimestampRules | PlainMessage<TimestampRules> | undefined): boolean;
}
