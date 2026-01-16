// package: common.v1
// file: common/v1/utils.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class StringList extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<string>;
    setItemsList(value: Array<string>): StringList;
    addItems(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StringList.AsObject;
    static toObject(includeInstance: boolean, msg: StringList): StringList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StringList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StringList;
    static deserializeBinaryFromReader(message: StringList, reader: jspb.BinaryReader): StringList;
}

export namespace StringList {
    export type AsObject = {
        itemsList: Array<string>,
    }
}
