import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message event.v1.IngestEventRequest
 */
export declare class IngestEventRequest extends Message<IngestEventRequest> {
    /**
     * @generated from field: repeated bytes events = 1;
     */
    events: Uint8Array[];
    constructor(data?: PartialMessage<IngestEventRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v1.IngestEventRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventRequest;
    static equals(a: IngestEventRequest | PlainMessage<IngestEventRequest> | undefined, b: IngestEventRequest | PlainMessage<IngestEventRequest> | undefined): boolean;
}
/**
 * @generated from message event.v1.IngestEventResponse
 */
export declare class IngestEventResponse extends Message<IngestEventResponse> {
    /**
     * @generated from field: int32 success = 1;
     */
    success: number;
    /**
     * @generated from field: repeated event.v1.IngestEventResponse.ErrorWrapper errors = 2;
     */
    errors: IngestEventResponse_ErrorWrapper[];
    constructor(data?: PartialMessage<IngestEventResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v1.IngestEventResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventResponse;
    static equals(a: IngestEventResponse | PlainMessage<IngestEventResponse> | undefined, b: IngestEventResponse | PlainMessage<IngestEventResponse> | undefined): boolean;
}
/**
 * @generated from message event.v1.IngestEventResponse.ErrorWrapper
 */
export declare class IngestEventResponse_ErrorWrapper extends Message<IngestEventResponse_ErrorWrapper> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string error = 2;
     */
    error: string;
    constructor(data?: PartialMessage<IngestEventResponse_ErrorWrapper>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v1.IngestEventResponse.ErrorWrapper";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IngestEventResponse_ErrorWrapper;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IngestEventResponse_ErrorWrapper;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IngestEventResponse_ErrorWrapper;
    static equals(a: IngestEventResponse_ErrorWrapper | PlainMessage<IngestEventResponse_ErrorWrapper> | undefined, b: IngestEventResponse_ErrorWrapper | PlainMessage<IngestEventResponse_ErrorWrapper> | undefined): boolean;
}
