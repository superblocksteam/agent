// package: worker.v1
// file: worker/v1/step_executor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as transport_v1_transport_pb from "../../transport/v1/transport_pb";

export class StringValue extends jspb.Message { 
    getValue(): string;
    setValue(value: string): StringValue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StringValue.AsObject;
    static toObject(includeInstance: boolean, msg: StringValue): StringValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StringValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StringValue;
    static deserializeBinaryFromReader(message: StringValue, reader: jspb.BinaryReader): StringValue;
}

export namespace StringValue {
    export type AsObject = {
        value: string,
    }
}
