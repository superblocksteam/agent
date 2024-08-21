import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Any, Message, proto3, Timestamp } from "@bufbuild/protobuf";
/**
 * CloudEvent is copied from
 * https://github.com/cloudevents/spec/blob/main/cloudevents/formats/protobuf-format.md.
 *
 * @generated from message event.v2.CloudEvent
 */
export declare class CloudEvent extends Message<CloudEvent> {
    /**
     * Unique event identifier.
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * URI of the event source.
     *
     * @generated from field: string source = 2;
     */
    source: string;
    /**
     * Version of the spec in use.
     *
     * @generated from field: string spec_version = 3;
     */
    specVersion: string;
    /**
     * Event type identifier.
     *
     * @generated from field: string type = 4;
     */
    type: string;
    /**
     * Optional & Extension Attributes
     *
     * @generated from field: map<string, event.v2.CloudEventAttributeValue> attributes = 5;
     */
    attributes: {
        [key: string]: CloudEventAttributeValue;
    };
    /**
     * CloudEvent Data (Bytes, Text, or Proto)
     *
     * @generated from oneof event.v2.CloudEvent.data
     */
    data: {
        /**
         * If the event is binary data then the datacontenttype attribute
         * should be set to an appropriate media-type.
         *
         * @generated from field: bytes binary_data = 6;
         */
        value: Uint8Array;
        case: "binaryData";
    } | {
        /**
         * If the event is string data then the datacontenttype attribute
         * should be set to an appropriate media-type such as application/json.
         *
         * @generated from field: string text_data = 7;
         */
        value: string;
        case: "textData";
    } | {
        /**
         * If the event is a protobuf then it must be encoded using this Any
         * type. The datacontenttype attribute should be set to
         * application/protobuf and the dataschema attribute set to the message
         * type.
         *
         * @generated from field: google.protobuf.Any proto_data = 8;
         */
        value: Any;
        case: "protoData";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<CloudEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v2.CloudEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CloudEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CloudEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CloudEvent;
    static equals(a: CloudEvent | PlainMessage<CloudEvent> | undefined, b: CloudEvent | PlainMessage<CloudEvent> | undefined): boolean;
}
/**
 * CloudEventAttribute enables extensions to use any of the seven allowed
 * data types as the value of an envelope key.
 *
 * @generated from message event.v2.CloudEventAttributeValue
 */
export declare class CloudEventAttributeValue extends Message<CloudEventAttributeValue> {
    /**
     * The value can be any one of these types.
     *
     * @generated from oneof event.v2.CloudEventAttributeValue.attr
     */
    attr: {
        /**
         * Boolean value.
         *
         * @generated from field: bool ce_boolean = 1;
         */
        value: boolean;
        case: "ceBoolean";
    } | {
        /**
         * Integer value.
         *
         * @generated from field: int32 ce_integer = 2;
         */
        value: number;
        case: "ceInteger";
    } | {
        /**
         * String value.
         *
         * @generated from field: string ce_string = 3;
         */
        value: string;
        case: "ceString";
    } | {
        /**
         * Byte string value.
         *
         * @generated from field: bytes ce_bytes = 4;
         */
        value: Uint8Array;
        case: "ceBytes";
    } | {
        /**
         * URI value.
         *
         * @generated from field: string ce_uri = 5;
         */
        value: string;
        case: "ceUri";
    } | {
        /**
         * URI reference value.
         *
         * @generated from field: string ce_uri_ref = 6;
         */
        value: string;
        case: "ceUriRef";
    } | {
        /**
         * Timestamp value.
         *
         * @generated from field: google.protobuf.Timestamp ce_timestamp = 7;
         */
        value: Timestamp;
        case: "ceTimestamp";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<CloudEventAttributeValue>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v2.CloudEventAttributeValue";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CloudEventAttributeValue;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CloudEventAttributeValue;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CloudEventAttributeValue;
    static equals(a: CloudEventAttributeValue | PlainMessage<CloudEventAttributeValue> | undefined, b: CloudEventAttributeValue | PlainMessage<CloudEventAttributeValue> | undefined): boolean;
}
