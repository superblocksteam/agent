// package: api.v1
// file: api/v1/blocks.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Variables extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Variables.Config>;
    setItemsList(value: Array<Variables.Config>): Variables;
    addItems(value?: Variables.Config, index?: number): Variables.Config;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Variables.AsObject;
    static toObject(includeInstance: boolean, msg: Variables): Variables.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Variables, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Variables;
    static deserializeBinaryFromReader(message: Variables, reader: jspb.BinaryReader): Variables;
}

export namespace Variables {
    export type AsObject = {
        itemsList: Array<Variables.Config.AsObject>,
    }


    export class Config extends jspb.Message { 
        getValue(): string;
        setValue(value: string): Config;
        getType(): Variables.Type;
        setType(value: Variables.Type): Config;
        getMode(): Variables.Mode;
        setMode(value: Variables.Mode): Config;
        getKey(): string;
        setKey(value: string): Config;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Config.AsObject;
        static toObject(includeInstance: boolean, msg: Config): Config.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Config, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Config;
        static deserializeBinaryFromReader(message: Config, reader: jspb.BinaryReader): Config;
    }

    export namespace Config {
        export type AsObject = {
            value: string,
            type: Variables.Type,
            mode: Variables.Mode,
            key: string,
        }
    }


    export enum Type {
    TYPE_UNSPECIFIED = 0,
    TYPE_SIMPLE = 1,
    TYPE_ADVANCED = 2,
    TYPE_NATIVE = 3,
    TYPE_FILEPICKER = 4,
    }

    export enum Mode {
    MODE_UNSPECIFIED = 0,
    MODE_READ = 1,
    MODE_READWRITE = 2,
    }

}
