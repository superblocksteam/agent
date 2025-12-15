// package: worker.v1
// file: worker/v1/sandbox_executor_transport.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class ExecuteRequest extends jspb.Message { 
    getScript(): string;
    setScript(value: string): ExecuteRequest;
    getContextJson(): string;
    setContextJson(value: string): ExecuteRequest;
    getTimeoutMs(): number;
    setTimeoutMs(value: number): ExecuteRequest;
    getExecutionId(): string;
    setExecutionId(value: string): ExecuteRequest;
    getVariableStoreAddress(): string;
    setVariableStoreAddress(value: string): ExecuteRequest;
    getVariablesJson(): string;
    setVariablesJson(value: string): ExecuteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteRequest): ExecuteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteRequest;
    static deserializeBinaryFromReader(message: ExecuteRequest, reader: jspb.BinaryReader): ExecuteRequest;
}

export namespace ExecuteRequest {
    export type AsObject = {
        script: string,
        contextJson: string,
        timeoutMs: number,
        executionId: string,
        variableStoreAddress: string,
        variablesJson: string,
    }
}

export class ExecuteResponse extends jspb.Message { 
    getResult(): string;
    setResult(value: string): ExecuteResponse;
    clearStdoutList(): void;
    getStdoutList(): Array<string>;
    setStdoutList(value: Array<string>): ExecuteResponse;
    addStdout(value: string, index?: number): string;
    clearStderrList(): void;
    getStderrList(): Array<string>;
    setStderrList(value: Array<string>): ExecuteResponse;
    addStderr(value: string, index?: number): string;
    getExitCode(): number;
    setExitCode(value: number): ExecuteResponse;
    getError(): string;
    setError(value: string): ExecuteResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteResponse): ExecuteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteResponse;
    static deserializeBinaryFromReader(message: ExecuteResponse, reader: jspb.BinaryReader): ExecuteResponse;
}

export namespace ExecuteResponse {
    export type AsObject = {
        result: string,
        stdoutList: Array<string>,
        stderrList: Array<string>,
        exitCode: number,
        error: string,
    }
}
