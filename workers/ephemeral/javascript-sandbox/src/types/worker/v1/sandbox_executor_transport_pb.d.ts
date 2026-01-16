// package: worker.v1
// file: worker/v1/sandbox_executor_transport.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class ExecuteRequestV1 extends jspb.Message { 
    getScript(): string;
    setScript(value: string): ExecuteRequestV1;
    getContextJson(): string;
    setContextJson(value: string): ExecuteRequestV1;
    getTimeoutMs(): number;
    setTimeoutMs(value: number): ExecuteRequestV1;
    getExecutionId(): string;
    setExecutionId(value: string): ExecuteRequestV1;
    getVariableStoreAddress(): string;
    setVariableStoreAddress(value: string): ExecuteRequestV1;
    getVariablesJson(): string;
    setVariablesJson(value: string): ExecuteRequestV1;

    getFilesMap(): jspb.Map<string, string>;
    clearFilesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteRequestV1.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteRequestV1): ExecuteRequestV1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteRequestV1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteRequestV1;
    static deserializeBinaryFromReader(message: ExecuteRequestV1, reader: jspb.BinaryReader): ExecuteRequestV1;
}

export namespace ExecuteRequestV1 {
    export type AsObject = {
        script: string,
        contextJson: string,
        timeoutMs: number,
        executionId: string,
        variableStoreAddress: string,
        variablesJson: string,

        filesMap: Array<[string, string]>,
    }
}

export class ExecuteResponseV1 extends jspb.Message { 
    getResult(): string;
    setResult(value: string): ExecuteResponseV1;
    clearStdoutList(): void;
    getStdoutList(): Array<string>;
    setStdoutList(value: Array<string>): ExecuteResponseV1;
    addStdout(value: string, index?: number): string;
    clearStderrList(): void;
    getStderrList(): Array<string>;
    setStderrList(value: Array<string>): ExecuteResponseV1;
    addStderr(value: string, index?: number): string;
    getExitCode(): number;
    setExitCode(value: number): ExecuteResponseV1;
    getError(): string;
    setError(value: string): ExecuteResponseV1;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteResponseV1.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteResponseV1): ExecuteResponseV1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteResponseV1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteResponseV1;
    static deserializeBinaryFromReader(message: ExecuteResponseV1, reader: jspb.BinaryReader): ExecuteResponseV1;
}

export namespace ExecuteResponseV1 {
    export type AsObject = {
        result: string,
        stdoutList: Array<string>,
        stderrList: Array<string>,
        exitCode: number,
        error: string,
    }
}
