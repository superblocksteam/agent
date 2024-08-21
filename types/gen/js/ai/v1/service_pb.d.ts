// package: ai.v1
// file: ai/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as ai_v1_ai_pb from "../../ai/v1/ai_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_health_pb from "../../common/v1/health_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Overrides extends jspb.Message { 
    getLlm(): ai_v1_ai_pb.LLM;
    setLlm(value: ai_v1_ai_pb.LLM): Overrides;
    getModel(): ai_v1_ai_pb.MODEL;
    setModel(value: ai_v1_ai_pb.MODEL): Overrides;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Overrides.AsObject;
    static toObject(includeInstance: boolean, msg: Overrides): Overrides.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Overrides, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Overrides;
    static deserializeBinaryFromReader(message: Overrides, reader: jspb.BinaryReader): Overrides;
}

export namespace Overrides {
    export type AsObject = {
        llm: ai_v1_ai_pb.LLM,
        model: ai_v1_ai_pb.MODEL,
    }
}

export class CreateTaskRequest extends jspb.Message { 

    hasTask(): boolean;
    clearTask(): void;
    getTask(): ai_v1_ai_pb.Task | undefined;
    setTask(value?: ai_v1_ai_pb.Task): CreateTaskRequest;

    hasOverrides(): boolean;
    clearOverrides(): void;
    getOverrides(): Overrides | undefined;
    setOverrides(value?: Overrides): CreateTaskRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTaskRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTaskRequest): CreateTaskRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTaskRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTaskRequest;
    static deserializeBinaryFromReader(message: CreateTaskRequest, reader: jspb.BinaryReader): CreateTaskRequest;
}

export namespace CreateTaskRequest {
    export type AsObject = {
        task?: ai_v1_ai_pb.Task.AsObject,
        overrides?: Overrides.AsObject,
    }
}

export class TaskEvent extends jspb.Message { 
    getChunk(): string;
    setChunk(value: string): TaskEvent;
    getLlm(): ai_v1_ai_pb.LLM;
    setLlm(value: ai_v1_ai_pb.LLM): TaskEvent;
    getModel(): ai_v1_ai_pb.MODEL;
    setModel(value: ai_v1_ai_pb.MODEL): TaskEvent;
    getId(): string;
    setId(value: string): TaskEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaskEvent.AsObject;
    static toObject(includeInstance: boolean, msg: TaskEvent): TaskEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaskEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaskEvent;
    static deserializeBinaryFromReader(message: TaskEvent, reader: jspb.BinaryReader): TaskEvent;
}

export namespace TaskEvent {
    export type AsObject = {
        chunk: string,
        llm: ai_v1_ai_pb.LLM,
        model: ai_v1_ai_pb.MODEL,
        id: string,
    }
}
