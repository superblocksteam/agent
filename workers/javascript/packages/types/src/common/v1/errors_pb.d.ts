import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from enum common.v1.Code
 */
export declare enum Code {
    /**
     * @generated from enum value: CODE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: CODE_INTEGRATION_AUTHORIZATION = 1;
     */
    INTEGRATION_AUTHORIZATION = 1,
    /**
     * @generated from enum value: CODE_INTEGRATION_NETWORK = 2;
     */
    INTEGRATION_NETWORK = 2,
    /**
     * @generated from enum value: CODE_INTEGRATION_QUERY_TIMEOUT = 3;
     */
    INTEGRATION_QUERY_TIMEOUT = 3,
    /**
     * @generated from enum value: CODE_INTEGRATION_SYNTAX = 4;
     */
    INTEGRATION_SYNTAX = 4,
    /**
     * @generated from enum value: CODE_INTEGRATION_LOGIC = 5;
     */
    INTEGRATION_LOGIC = 5,
    /**
     * @generated from enum value: CODE_INTEGRATION_MISSING_REQUIRED_FIELD = 6;
     */
    INTEGRATION_MISSING_REQUIRED_FIELD = 6,
    /**
     * @generated from enum value: CODE_INTEGRATION_RATE_LIMIT = 7;
     */
    INTEGRATION_RATE_LIMIT = 7,
    /**
     * @generated from enum value: CODE_INTEGRATION_USER_CANCELLED = 8;
     */
    INTEGRATION_USER_CANCELLED = 8,
    /**
     * @generated from enum value: CODE_INTEGRATION_INTERNAL = 9;
     */
    INTEGRATION_INTERNAL = 9
}
/**
 * @generated from message common.v1.Error
 */
export declare class Error extends Message<Error> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * @generated from field: bool handled = 3;
     */
    handled: boolean;
    /**
     * @generated from field: string block_path = 4;
     */
    blockPath: string;
    /**
     * @generated from field: string form_path = 5;
     */
    formPath: string;
    /**
     * @generated from field: common.v1.Code code = 6;
     */
    code: Code;
    constructor(data?: PartialMessage<Error>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "common.v1.Error";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Error;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Error;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Error;
    static equals(a: Error | PlainMessage<Error> | undefined, b: Error | PlainMessage<Error> | undefined): boolean;
}
