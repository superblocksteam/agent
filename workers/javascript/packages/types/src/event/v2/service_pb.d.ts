import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { CloudEvent } from "./cloudevent_pb";
/**
 * @generated from message event.v2.SendRequest
 */
export declare class SendRequest extends Message<SendRequest> {
    /**
     * @generated from field: event.v2.CloudEvent event = 1;
     */
    event?: CloudEvent;
    /**
     * @generated from field: string destination = 2;
     */
    destination: string;
    constructor(data?: PartialMessage<SendRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v2.SendRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SendRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SendRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SendRequest;
    static equals(a: SendRequest | PlainMessage<SendRequest> | undefined, b: SendRequest | PlainMessage<SendRequest> | undefined): boolean;
}
