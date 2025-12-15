// package: common.v1
// file: common/v1/health.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Pool extends jspb.Message { 

    hasHits(): boolean;
    clearHits(): void;
    getHits(): number | undefined;
    setHits(value: number): Pool;

    hasMisses(): boolean;
    clearMisses(): void;
    getMisses(): number | undefined;
    setMisses(value: number): Pool;

    hasTimeouts(): boolean;
    clearTimeouts(): void;
    getTimeouts(): number | undefined;
    setTimeouts(value: number): Pool;

    hasTotal(): boolean;
    clearTotal(): void;
    getTotal(): number | undefined;
    setTotal(value: number): Pool;

    hasIdle(): boolean;
    clearIdle(): void;
    getIdle(): number | undefined;
    setIdle(value: number): Pool;

    hasStale(): boolean;
    clearStale(): void;
    getStale(): number | undefined;
    setStale(value: number): Pool;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Pool.AsObject;
    static toObject(includeInstance: boolean, msg: Pool): Pool.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Pool, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Pool;
    static deserializeBinaryFromReader(message: Pool, reader: jspb.BinaryReader): Pool;
}

export namespace Pool {
    export type AsObject = {
        hits?: number,
        misses?: number,
        timeouts?: number,
        total?: number,
        idle?: number,
        stale?: number,
    }
}

export class HealthResponse extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): HealthResponse;
    getUptime(): number;
    setUptime(value: number): HealthResponse;
    getVersion(): string;
    setVersion(value: string): HealthResponse;

    hasStore(): boolean;
    clearStore(): void;
    getStore(): Pool | undefined;
    setStore(value?: Pool): HealthResponse;

    hasStream(): boolean;
    clearStream(): void;
    getStream(): Pool | undefined;
    setStream(value?: Pool): HealthResponse;
    getId(): string;
    setId(value: string): HealthResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HealthResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HealthResponse): HealthResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HealthResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HealthResponse;
    static deserializeBinaryFromReader(message: HealthResponse, reader: jspb.BinaryReader): HealthResponse;
}

export namespace HealthResponse {
    export type AsObject = {
        message: string,
        uptime: number,
        version: string,
        store?: Pool.AsObject,
        stream?: Pool.AsObject,
        id: string,
    }
}
