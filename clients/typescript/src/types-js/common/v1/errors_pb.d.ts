// package: common.v1
// file: common/v1/errors.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class Error extends jspb.Message {
  getName(): string;
  setName(value: string): Error;
  getMessage(): string;
  setMessage(value: string): Error;
  getHandled(): boolean;
  setHandled(value: boolean): Error;
  getBlockPath(): string;
  setBlockPath(value: string): Error;
  getFormPath(): string;
  setFormPath(value: string): Error;
  getCode(): Code;
  setCode(value: Code): Error;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Error.AsObject;
  static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Error;
  static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
}

export namespace Error {
  export type AsObject = {
    name: string;
    message: string;
    handled: boolean;
    blockPath: string;
    formPath: string;
    code: Code;
  };
}

export enum Code {
  CODE_UNSPECIFIED = 0,
  CODE_INTEGRATION_AUTHORIZATION = 1,
  CODE_INTEGRATION_NETWORK = 2,
  CODE_INTEGRATION_QUERY_TIMEOUT = 3,
  CODE_INTEGRATION_SYNTAX = 4,
  CODE_INTEGRATION_LOGIC = 5,
  CODE_INTEGRATION_MISSING_REQUIRED_FIELD = 6,
  CODE_INTEGRATION_RATE_LIMIT = 7,
  CODE_INTEGRATION_USER_CANCELLED = 8,
  CODE_INTEGRATION_INTERNAL = 9
}
