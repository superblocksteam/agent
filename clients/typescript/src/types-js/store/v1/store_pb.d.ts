// package: store.v1
// file: store/v1/store.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';
import * as secrets_v1_secrets_pb from '../../secrets/v1/secrets_pb';

export class Pair extends jspb.Message {
  getKey(): string;
  setKey(value: string): Pair;

  hasValue(): boolean;
  clearValue(): void;
  getValue(): google_protobuf_struct_pb.Value | undefined;
  setValue(value?: google_protobuf_struct_pb.Value): Pair;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Pair.AsObject;
  static toObject(includeInstance: boolean, msg: Pair): Pair.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Pair, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Pair;
  static deserializeBinaryFromReader(message: Pair, reader: jspb.BinaryReader): Pair;
}

export namespace Pair {
  export type AsObject = {
    key: string;
    value?: google_protobuf_struct_pb.Value.AsObject;
  };
}

export class Stores extends jspb.Message {
  clearSecretsList(): void;
  getSecretsList(): Array<secrets_v1_secrets_pb.Store>;
  setSecretsList(value: Array<secrets_v1_secrets_pb.Store>): Stores;
  addSecrets(value?: secrets_v1_secrets_pb.Store, index?: number): secrets_v1_secrets_pb.Store;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Stores.AsObject;
  static toObject(includeInstance: boolean, msg: Stores): Stores.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Stores, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Stores;
  static deserializeBinaryFromReader(message: Stores, reader: jspb.BinaryReader): Stores;
}

export namespace Stores {
  export type AsObject = {
    secretsList: Array<secrets_v1_secrets_pb.Store.AsObject>;
  };
}
