// package: event.v2
// file: event/v2/cloudevent.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class CloudEvent extends jspb.Message { 
    getId(): string;
    setId(value: string): CloudEvent;
    getSource(): string;
    setSource(value: string): CloudEvent;
    getSpecVersion(): string;
    setSpecVersion(value: string): CloudEvent;
    getType(): string;
    setType(value: string): CloudEvent;

    getAttributesMap(): jspb.Map<string, CloudEventAttributeValue>;
    clearAttributesMap(): void;

    hasBinaryData(): boolean;
    clearBinaryData(): void;
    getBinaryData(): Uint8Array | string;
    getBinaryData_asU8(): Uint8Array;
    getBinaryData_asB64(): string;
    setBinaryData(value: Uint8Array | string): CloudEvent;

    hasTextData(): boolean;
    clearTextData(): void;
    getTextData(): string;
    setTextData(value: string): CloudEvent;

    hasProtoData(): boolean;
    clearProtoData(): void;
    getProtoData(): google_protobuf_any_pb.Any | undefined;
    setProtoData(value?: google_protobuf_any_pb.Any): CloudEvent;

    getDataCase(): CloudEvent.DataCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloudEvent.AsObject;
    static toObject(includeInstance: boolean, msg: CloudEvent): CloudEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloudEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloudEvent;
    static deserializeBinaryFromReader(message: CloudEvent, reader: jspb.BinaryReader): CloudEvent;
}

export namespace CloudEvent {
    export type AsObject = {
        id: string,
        source: string,
        specVersion: string,
        type: string,

        attributesMap: Array<[string, CloudEventAttributeValue.AsObject]>,
        binaryData: Uint8Array | string,
        textData: string,
        protoData?: google_protobuf_any_pb.Any.AsObject,
    }

    export enum DataCase {
        DATA_NOT_SET = 0,
        BINARY_DATA = 6,
        TEXT_DATA = 7,
        PROTO_DATA = 8,
    }

}

export class CloudEventAttributeValue extends jspb.Message { 

    hasCeBoolean(): boolean;
    clearCeBoolean(): void;
    getCeBoolean(): boolean;
    setCeBoolean(value: boolean): CloudEventAttributeValue;

    hasCeInteger(): boolean;
    clearCeInteger(): void;
    getCeInteger(): number;
    setCeInteger(value: number): CloudEventAttributeValue;

    hasCeString(): boolean;
    clearCeString(): void;
    getCeString(): string;
    setCeString(value: string): CloudEventAttributeValue;

    hasCeBytes(): boolean;
    clearCeBytes(): void;
    getCeBytes(): Uint8Array | string;
    getCeBytes_asU8(): Uint8Array;
    getCeBytes_asB64(): string;
    setCeBytes(value: Uint8Array | string): CloudEventAttributeValue;

    hasCeUri(): boolean;
    clearCeUri(): void;
    getCeUri(): string;
    setCeUri(value: string): CloudEventAttributeValue;

    hasCeUriRef(): boolean;
    clearCeUriRef(): void;
    getCeUriRef(): string;
    setCeUriRef(value: string): CloudEventAttributeValue;

    hasCeTimestamp(): boolean;
    clearCeTimestamp(): void;
    getCeTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCeTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): CloudEventAttributeValue;

    getAttrCase(): CloudEventAttributeValue.AttrCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloudEventAttributeValue.AsObject;
    static toObject(includeInstance: boolean, msg: CloudEventAttributeValue): CloudEventAttributeValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloudEventAttributeValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloudEventAttributeValue;
    static deserializeBinaryFromReader(message: CloudEventAttributeValue, reader: jspb.BinaryReader): CloudEventAttributeValue;
}

export namespace CloudEventAttributeValue {
    export type AsObject = {
        ceBoolean: boolean,
        ceInteger: number,
        ceString: string,
        ceBytes: Uint8Array | string,
        ceUri: string,
        ceUriRef: string,
        ceTimestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    }

    export enum AttrCase {
        ATTR_NOT_SET = 0,
        CE_BOOLEAN = 1,
        CE_INTEGER = 2,
        CE_STRING = 3,
        CE_BYTES = 4,
        CE_URI = 5,
        CE_URI_REF = 6,
        CE_TIMESTAMP = 7,
    }

}
