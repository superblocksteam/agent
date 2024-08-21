import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * `Constraint` represents a validation rule written in the Common Expression
 * Language (CEL) syntax. Each Constraint includes a unique identifier, an
 * optional error message, and the CEL expression to evaluate. For more
 * information on CEL, [see our documentation](https://github.com/bufbuild/protovalidate/blob/main/docs/cel.md).
 *
 * ```proto
 * message Foo {
 *   option (buf.validate.message).cel = {
 *     id: "foo.bar"
 *     message: "bar must be greater than 0"
 *     expression: "this.bar > 0"
 *   };
 *   int32 bar = 1;
 * }
 * ```
 *
 * @generated from message buf.validate.Constraint
 */
export declare class Constraint extends Message<Constraint> {
    /**
     * `id` is a string that serves as a machine-readable name for this Constraint.
     * It should be unique within its scope, which could be either a message or a field.
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * `message` is an optional field that provides a human-readable error message
     * for this Constraint when the CEL expression evaluates to false. If a
     * non-empty message is provided, any strings resulting from the CEL
     * expression evaluation are ignored.
     *
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * `expression` is the actual CEL expression that will be evaluated for
     * validation. This string must resolve to either a boolean or a string
     * value. If the expression evaluates to false or a non-empty string, the
     * validation is considered failed, and the message is rejected.
     *
     * @generated from field: string expression = 3;
     */
    expression: string;
    constructor(data?: PartialMessage<Constraint>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Constraint";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Constraint;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Constraint;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Constraint;
    static equals(a: Constraint | PlainMessage<Constraint> | undefined, b: Constraint | PlainMessage<Constraint> | undefined): boolean;
}
/**
 * `Violations` is a collection of `Violation` messages. This message type is returned by
 * protovalidate when a proto message fails to meet the requirements set by the `Constraint` validation rules.
 * Each individual violation is represented by a `Violation` message.
 *
 * @generated from message buf.validate.Violations
 */
export declare class Violations extends Message<Violations> {
    /**
     * `violations` is a repeated field that contains all the `Violation` messages corresponding to the violations detected.
     *
     * @generated from field: repeated buf.validate.Violation violations = 1;
     */
    violations: Violation[];
    constructor(data?: PartialMessage<Violations>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Violations";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Violations;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Violations;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Violations;
    static equals(a: Violations | PlainMessage<Violations> | undefined, b: Violations | PlainMessage<Violations> | undefined): boolean;
}
/**
 * `Violation` represents a single instance where a validation rule, expressed
 * as a `Constraint`, was not met. It provides information about the field that
 * caused the violation, the specific constraint that wasn't fulfilled, and a
 * human-readable error message.
 *
 * ```json
 * {
 *   "fieldPath": "bar",
 *   "constraintId": "foo.bar",
 *   "message": "bar must be greater than 0"
 * }
 * ```
 *
 * @generated from message buf.validate.Violation
 */
export declare class Violation extends Message<Violation> {
    /**
     * `field_path` is a machine-readable identifier that points to the specific field that failed the validation.
     * This could be a nested field, in which case the path will include all the parent fields leading to the actual field that caused the violation.
     *
     * @generated from field: string field_path = 1;
     */
    fieldPath: string;
    /**
     * `constraint_id` is the unique identifier of the `Constraint` that was not fulfilled.
     * This is the same `id` that was specified in the `Constraint` message, allowing easy tracing of which rule was violated.
     *
     * @generated from field: string constraint_id = 2;
     */
    constraintId: string;
    /**
     * `message` is a human-readable error message that describes the nature of the violation.
     * This can be the default error message from the violated `Constraint`, or it can be a custom message that gives more context about the violation.
     *
     * @generated from field: string message = 3;
     */
    message: string;
    /**
     * `for_key` indicates whether the violation was caused by a map key, rather than a value.
     *
     * @generated from field: bool for_key = 4;
     */
    forKey: boolean;
    constructor(data?: PartialMessage<Violation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "buf.validate.Violation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Violation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Violation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Violation;
    static equals(a: Violation | PlainMessage<Violation> | undefined, b: Violation | PlainMessage<Violation> | undefined): boolean;
}
