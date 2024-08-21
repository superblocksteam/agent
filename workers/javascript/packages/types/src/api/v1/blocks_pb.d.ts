import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message api.v1.Variables
 */
export declare class Variables extends Message<Variables> {
    /**
     * @generated from field: repeated api.v1.Variables.Config items = 1;
     */
    items: Variables_Config[];
    constructor(data?: PartialMessage<Variables>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Variables";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Variables;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Variables;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Variables;
    static equals(a: Variables | PlainMessage<Variables> | undefined, b: Variables | PlainMessage<Variables> | undefined): boolean;
}
/**
 * @generated from enum api.v1.Variables.Type
 */
export declare enum Variables_Type {
    /**
     * @generated from enum value: TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     *
     * myVar1.get()
     * myVar1.set()
     *
     * @generated from enum value: TYPE_SIMPLE = 1;
     */
    SIMPLE = 1,
    /**
     *
     * await myVar1.get()
     * await myVar1.set()
     *
     * @generated from enum value: TYPE_ADVANCED = 2;
     */
    ADVANCED = 2,
    /**
     *
     * myVar1
     * myVar1 = 5; // NOTE(frank): We won't implement MODE_READWRITE for this yet.
     *
     * @generated from enum value: TYPE_NATIVE = 3;
     */
    NATIVE = 3,
    /**
     *
     * await myVar1.readContentsAsync()
     * await myVar1.readContentsAsync(someMode)
     * myVar1.readContents()
     * myVar1.readContents(someMode)
     *
     * @generated from enum value: TYPE_FILEPICKER = 4;
     */
    FILEPICKER = 4
}
/**
 * @generated from enum api.v1.Variables.Mode
 */
export declare enum Variables_Mode {
    /**
     * @generated from enum value: MODE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: MODE_READ = 1;
     */
    READ = 1,
    /**
     * @generated from enum value: MODE_READWRITE = 2;
     */
    READWRITE = 2
}
/**
 * @generated from message api.v1.Variables.Config
 */
export declare class Variables_Config extends Message<Variables_Config> {
    /**
     * @generated from field: string value = 1;
     */
    value: string;
    /**
     * @generated from field: api.v1.Variables.Type type = 2;
     */
    type: Variables_Type;
    /**
     * @generated from field: api.v1.Variables.Mode mode = 3;
     */
    mode: Variables_Mode;
    /**
     * @generated from field: string key = 4;
     */
    key: string;
    constructor(data?: PartialMessage<Variables_Config>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "api.v1.Variables.Config";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Variables_Config;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Variables_Config;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Variables_Config;
    static equals(a: Variables_Config | PlainMessage<Variables_Config> | undefined, b: Variables_Config | PlainMessage<Variables_Config> | undefined): boolean;
}
