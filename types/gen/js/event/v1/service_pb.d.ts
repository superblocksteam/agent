// package: event.v1
// file: event/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class IngestEventRequest extends jspb.Message { 
    clearEventsList(): void;
    getEventsList(): Array<Uint8Array | string>;
    getEventsList_asU8(): Array<Uint8Array>;
    getEventsList_asB64(): Array<string>;
    setEventsList(value: Array<Uint8Array | string>): IngestEventRequest;
    addEvents(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IngestEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: IngestEventRequest): IngestEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IngestEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IngestEventRequest;
    static deserializeBinaryFromReader(message: IngestEventRequest, reader: jspb.BinaryReader): IngestEventRequest;
}

export namespace IngestEventRequest {
    export type AsObject = {
        eventsList: Array<Uint8Array | string>,
    }
}

export class IngestEventResponse extends jspb.Message { 
    getSuccess(): number;
    setSuccess(value: number): IngestEventResponse;
    clearErrorsList(): void;
    getErrorsList(): Array<IngestEventResponse.ErrorWrapper>;
    setErrorsList(value: Array<IngestEventResponse.ErrorWrapper>): IngestEventResponse;
    addErrors(value?: IngestEventResponse.ErrorWrapper, index?: number): IngestEventResponse.ErrorWrapper;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IngestEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: IngestEventResponse): IngestEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IngestEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IngestEventResponse;
    static deserializeBinaryFromReader(message: IngestEventResponse, reader: jspb.BinaryReader): IngestEventResponse;
}

export namespace IngestEventResponse {
    export type AsObject = {
        success: number,
        errorsList: Array<IngestEventResponse.ErrorWrapper.AsObject>,
    }


    export class ErrorWrapper extends jspb.Message { 
        getId(): string;
        setId(value: string): ErrorWrapper;
        getError(): string;
        setError(value: string): ErrorWrapper;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ErrorWrapper.AsObject;
        static toObject(includeInstance: boolean, msg: ErrorWrapper): ErrorWrapper.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ErrorWrapper, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ErrorWrapper;
        static deserializeBinaryFromReader(message: ErrorWrapper, reader: jspb.BinaryReader): ErrorWrapper;
    }

    export namespace ErrorWrapper {
        export type AsObject = {
            id: string,
            error: string,
        }
    }

}
