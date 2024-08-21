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
exports.Violation = exports.Violations = exports.Constraint = void 0;
const protobuf_1 = require("@bufbuild/protobuf");
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
class Constraint extends protobuf_1.Message {
    /**
     * `id` is a string that serves as a machine-readable name for this Constraint.
     * It should be unique within its scope, which could be either a message or a field.
     *
     * @generated from field: string id = 1;
     */
    id = "";
    /**
     * `message` is an optional field that provides a human-readable error message
     * for this Constraint when the CEL expression evaluates to false. If a
     * non-empty message is provided, any strings resulting from the CEL
     * expression evaluation are ignored.
     *
     * @generated from field: string message = 2;
     */
    message = "";
    /**
     * `expression` is the actual CEL expression that will be evaluated for
     * validation. This string must resolve to either a boolean or a string
     * value. If the expression evaluates to false or a non-empty string, the
     * validation is considered failed, and the message is rejected.
     *
     * @generated from field: string expression = 3;
     */
    expression = "";
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Constraint";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
        { no: 2, name: "message", kind: "scalar", T: 9 /* ScalarType.STRING */ },
        { no: 3, name: "expression", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    ]);
    static fromBinary(bytes, options) {
        return new Constraint().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Constraint().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Constraint().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Constraint, a, b);
    }
}
exports.Constraint = Constraint;
/**
 * `Violations` is a collection of `Violation` messages. This message type is returned by
 * protovalidate when a proto message fails to meet the requirements set by the `Constraint` validation rules.
 * Each individual violation is represented by a `Violation` message.
 *
 * @generated from message buf.validate.Violations
 */
class Violations extends protobuf_1.Message {
    /**
     * `violations` is a repeated field that contains all the `Violation` messages corresponding to the violations detected.
     *
     * @generated from field: repeated buf.validate.Violation violations = 1;
     */
    violations = [];
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Violations";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "violations", kind: "message", T: Violation, repeated: true },
    ]);
    static fromBinary(bytes, options) {
        return new Violations().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Violations().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Violations().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Violations, a, b);
    }
}
exports.Violations = Violations;
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
class Violation extends protobuf_1.Message {
    /**
     * `field_path` is a machine-readable identifier that points to the specific field that failed the validation.
     * This could be a nested field, in which case the path will include all the parent fields leading to the actual field that caused the violation.
     *
     * @generated from field: string field_path = 1;
     */
    fieldPath = "";
    /**
     * `constraint_id` is the unique identifier of the `Constraint` that was not fulfilled.
     * This is the same `id` that was specified in the `Constraint` message, allowing easy tracing of which rule was violated.
     *
     * @generated from field: string constraint_id = 2;
     */
    constraintId = "";
    /**
     * `message` is a human-readable error message that describes the nature of the violation.
     * This can be the default error message from the violated `Constraint`, or it can be a custom message that gives more context about the violation.
     *
     * @generated from field: string message = 3;
     */
    message = "";
    /**
     * `for_key` indicates whether the violation was caused by a map key, rather than a value.
     *
     * @generated from field: bool for_key = 4;
     */
    forKey = false;
    constructor(data) {
        super();
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static runtime = protobuf_1.proto3;
    static typeName = "buf.validate.Violation";
    static fields = protobuf_1.proto3.util.newFieldList(() => [
        { no: 1, name: "field_path", kind: "scalar", T: 9 /* ScalarType.STRING */ },
        { no: 2, name: "constraint_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
        { no: 3, name: "message", kind: "scalar", T: 9 /* ScalarType.STRING */ },
        { no: 4, name: "for_key", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    ]);
    static fromBinary(bytes, options) {
        return new Violation().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Violation().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Violation().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(Violation, a, b);
    }
}
exports.Violation = Violation;
//# sourceMappingURL=expression_pb.map