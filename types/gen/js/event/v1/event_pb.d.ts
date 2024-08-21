// package: event.v1
// file: event/v1/event.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_event_pb from "../../api/v1/event_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";

export class ExecutionEvent extends jspb.Message { 
    getExecutionId(): string;
    setExecutionId(value: string): ExecutionEvent;
    getResourceId(): string;
    setResourceId(value: string): ExecutionEvent;
    getResourceName(): string;
    setResourceName(value: string): ExecutionEvent;
    getResourceType(): Type;
    setResourceType(value: Type): ExecutionEvent;

    hasResourceSubtype(): boolean;
    clearResourceSubtype(): void;
    getResourceSubtype(): api_v1_event_pb.BlockType | undefined;
    setResourceSubtype(value: api_v1_event_pb.BlockType): ExecutionEvent;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): api_v1_event_pb.BlockStatus | undefined;
    setResult(value: api_v1_event_pb.BlockStatus): ExecutionEvent;
    getStatus(): Status;
    setStatus(value: Status): ExecutionEvent;

    hasIntegrationId(): boolean;
    clearIntegrationId(): void;
    getIntegrationId(): string | undefined;
    setIntegrationId(value: string): ExecutionEvent;

    hasIntegrationType(): boolean;
    clearIntegrationType(): void;
    getIntegrationType(): string | undefined;
    setIntegrationType(value: string): ExecutionEvent;
    getMode(): Mode;
    setMode(value: Mode): ExecutionEvent;
    getOrganizationId(): string;
    setOrganizationId(value: string): ExecutionEvent;

    hasUserId(): boolean;
    clearUserId(): void;
    getUserId(): string | undefined;
    setUserId(value: string): ExecutionEvent;
    getTrigger(): Trigger;
    setTrigger(value: Trigger): ExecutionEvent;

    hasParentId(): boolean;
    clearParentId(): void;
    getParentId(): string | undefined;
    setParentId(value: string): ExecutionEvent;

    hasParentName(): boolean;
    clearParentName(): void;
    getParentName(): string | undefined;
    setParentName(value: string): ExecutionEvent;

    hasParentType(): boolean;
    clearParentType(): void;
    getParentType(): Type | undefined;
    setParentType(value: Type): ExecutionEvent;
    getIsDescendantOfStream(): boolean;
    setIsDescendantOfStream(value: boolean): ExecutionEvent;

    hasApiId(): boolean;
    clearApiId(): void;
    getApiId(): string | undefined;
    setApiId(value: string): ExecutionEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecutionEvent.AsObject;
    static toObject(includeInstance: boolean, msg: ExecutionEvent): ExecutionEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecutionEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecutionEvent;
    static deserializeBinaryFromReader(message: ExecutionEvent, reader: jspb.BinaryReader): ExecutionEvent;
}

export namespace ExecutionEvent {
    export type AsObject = {
        executionId: string,
        resourceId: string,
        resourceName: string,
        resourceType: Type,
        resourceSubtype?: api_v1_event_pb.BlockType,
        result?: api_v1_event_pb.BlockStatus,
        status: Status,
        integrationId?: string,
        integrationType?: string,
        mode: Mode,
        organizationId: string,
        userId?: string,
        trigger: Trigger,
        parentId?: string,
        parentName?: string,
        parentType?: Type,
        isDescendantOfStream: boolean,
        apiId?: string,
    }
}

export enum Mode {
    MODE_UNSPECIFIED = 0,
    MODE_DEPLOYED = 1,
    MODE_EDITOR = 2,
    MODE_PREVIEW = 3,
}

export enum Type {
    TYPE_UNSPECIFIED = 0,
    TYPE_EXECUTION_API = 1,
    TYPE_EXECUTION_BLOCK = 2,
}

export enum Status {
    STATUS_UNSPECIFIED = 0,
    STATUS_STARTED = 1,
    STATUS_ENDED = 2,
}

export enum Trigger {
    TRIGGER_UNSPECIFIED = 0,
    TRIGGER_APPLICATION = 1,
    TRIGGER_WORKFLOW = 2,
    TRIGGER_JOB = 3,
}
