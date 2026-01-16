// package: utils.v1
// file: utils/v1/utils.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Signature extends jspb.Message { 
    getKeyId(): string;
    setKeyId(value: string): Signature;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): Signature;
    getPublicKey(): Uint8Array | string;
    getPublicKey_asU8(): Uint8Array;
    getPublicKey_asB64(): string;
    setPublicKey(value: Uint8Array | string): Signature;
    getAlgorithm(): Signature.Algorithm;
    setAlgorithm(value: Signature.Algorithm): Signature;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Signature.AsObject;
    static toObject(includeInstance: boolean, msg: Signature): Signature.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Signature, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Signature;
    static deserializeBinaryFromReader(message: Signature, reader: jspb.BinaryReader): Signature;
}

export namespace Signature {
    export type AsObject = {
        keyId: string,
        data: Uint8Array | string,
        publicKey: Uint8Array | string,
        algorithm: Signature.Algorithm,
    }

    export enum Algorithm {
    ALGORITHM_UNSPECIFIED = 0,
    ALGORITHM_ED25519 = 1,
    }

}
