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

export class GetVariableRequest extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): GetVariableRequest;
    getKey(): string;
    setKey(value: string): GetVariableRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVariableRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetVariableRequest): GetVariableRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVariableRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVariableRequest;
    static deserializeBinaryFromReader(message: GetVariableRequest, reader: jspb.BinaryReader): GetVariableRequest;
}

export namespace GetVariableRequest {
    export type AsObject = {
        executionId: string,
        key: string,
    }
}

export class GetVariableResponse extends jspb.Message { 
    getValue(): string;
    setValue(value: string): GetVariableResponse;
    getFound(): boolean;
    setFound(value: boolean): GetVariableResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVariableResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetVariableResponse): GetVariableResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVariableResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVariableResponse;
    static deserializeBinaryFromReader(message: GetVariableResponse, reader: jspb.BinaryReader): GetVariableResponse;
}

export namespace GetVariableResponse {
    export type AsObject = {
        value: string,
        found: boolean,
    }
}

export class SetVariableRequest extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): SetVariableRequest;
    getKey(): string;
    setKey(value: string): SetVariableRequest;
    getValue(): string;
    setValue(value: string): SetVariableRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetVariableRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetVariableRequest): SetVariableRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetVariableRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetVariableRequest;
    static deserializeBinaryFromReader(message: SetVariableRequest, reader: jspb.BinaryReader): SetVariableRequest;
}

export namespace SetVariableRequest {
    export type AsObject = {
        executionId: string,
        key: string,
        value: string,
    }
}

export class SetVariableResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): SetVariableResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetVariableResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetVariableResponse): SetVariableResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetVariableResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetVariableResponse;
    static deserializeBinaryFromReader(message: SetVariableResponse, reader: jspb.BinaryReader): SetVariableResponse;
}

export namespace SetVariableResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class GetVariablesRequest extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): GetVariablesRequest;
    clearKeysList(): void;
    getKeysList(): Array<string>;
    setKeysList(value: Array<string>): GetVariablesRequest;
    addKeys(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVariablesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetVariablesRequest): GetVariablesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVariablesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVariablesRequest;
    static deserializeBinaryFromReader(message: GetVariablesRequest, reader: jspb.BinaryReader): GetVariablesRequest;
}

export namespace GetVariablesRequest {
    export type AsObject = {
        executionId: string,
        keysList: Array<string>,
    }
}

export class GetVariablesResponse extends jspb.Message { 
    clearValuesList(): void;
    getValuesList(): Array<string>;
    setValuesList(value: Array<string>): GetVariablesResponse;
    addValues(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVariablesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetVariablesResponse): GetVariablesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVariablesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVariablesResponse;
    static deserializeBinaryFromReader(message: GetVariablesResponse, reader: jspb.BinaryReader): GetVariablesResponse;
}

export namespace GetVariablesResponse {
    export type AsObject = {
        valuesList: Array<string>,
    }
}

export class SetVariablesRequest extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): SetVariablesRequest;
    clearKvsList(): void;
    getKvsList(): Array<KeyValue>;
    setKvsList(value: Array<KeyValue>): SetVariablesRequest;
    addKvs(value?: KeyValue, index?: number): KeyValue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetVariablesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetVariablesRequest): SetVariablesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetVariablesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetVariablesRequest;
    static deserializeBinaryFromReader(message: SetVariablesRequest, reader: jspb.BinaryReader): SetVariablesRequest;
}

export namespace SetVariablesRequest {
    export type AsObject = {
        executionId: string,
        kvsList: Array<KeyValue.AsObject>,
    }
}

export class KeyValue extends jspb.Message { 
    getKey(): string;
    setKey(value: string): KeyValue;
    getValue(): string;
    setValue(value: string): KeyValue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyValue.AsObject;
    static toObject(includeInstance: boolean, msg: KeyValue): KeyValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeyValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeyValue;
    static deserializeBinaryFromReader(message: KeyValue, reader: jspb.BinaryReader): KeyValue;
}

export namespace KeyValue {
    export type AsObject = {
        key: string,
        value: string,
    }
}

export class SetVariablesResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): SetVariablesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetVariablesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetVariablesResponse): SetVariablesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetVariablesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetVariablesResponse;
    static deserializeBinaryFromReader(message: SetVariablesResponse, reader: jspb.BinaryReader): SetVariablesResponse;
}

export namespace SetVariablesResponse {
    export type AsObject = {
        success: boolean,
    }
}
