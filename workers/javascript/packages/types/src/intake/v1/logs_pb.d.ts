import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
/**
 * @generated from message intake.v1.Logs
 */
export declare class Logs extends Message<Logs> {
    /**
     * @generated from field: repeated google.protobuf.Struct logs = 1;
     */
    logs: Struct[];
    constructor(data?: PartialMessage<Logs>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "intake.v1.Logs";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Logs;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Logs;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Logs;
    static equals(a: Logs | PlainMessage<Logs> | undefined, b: Logs | PlainMessage<Logs> | undefined): boolean;
}
