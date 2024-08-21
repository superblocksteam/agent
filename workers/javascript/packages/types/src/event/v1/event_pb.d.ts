import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { BlockStatus, BlockType } from "../../api/v1/event_pb";
/**
 * @generated from enum event.v1.Mode
 */
export declare enum Mode {
    /**
     * @generated from enum value: MODE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: MODE_DEPLOYED = 1;
     */
    DEPLOYED = 1,
    /**
     * @generated from enum value: MODE_EDITOR = 2;
     */
    EDITOR = 2,
    /**
     * @generated from enum value: MODE_PREVIEW = 3;
     */
    PREVIEW = 3
}
/**
 * @generated from enum event.v1.Type
 */
export declare enum Type {
    /**
     * @generated from enum value: TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: TYPE_EXECUTION_API = 1;
     */
    EXECUTION_API = 1,
    /**
     * @generated from enum value: TYPE_EXECUTION_BLOCK = 2;
     */
    EXECUTION_BLOCK = 2
}
/**
 * @generated from enum event.v1.Status
 */
export declare enum Status {
    /**
     * @generated from enum value: STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: STATUS_STARTED = 1;
     */
    STARTED = 1,
    /**
     * @generated from enum value: STATUS_ENDED = 2;
     */
    ENDED = 2
}
/**
 * @generated from enum event.v1.Trigger
 */
export declare enum Trigger {
    /**
     * @generated from enum value: TRIGGER_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: TRIGGER_APPLICATION = 1;
     */
    APPLICATION = 1,
    /**
     * @generated from enum value: TRIGGER_WORKFLOW = 2;
     */
    WORKFLOW = 2,
    /**
     * @generated from enum value: TRIGGER_JOB = 3;
     */
    JOB = 3
}
/**
 * @generated from message event.v1.ExecutionEvent
 */
export declare class ExecutionEvent extends Message<ExecutionEvent> {
    /**
     * @generated from field: string execution_id = 1;
     */
    executionId: string;
    /**
     * @generated from field: string resource_id = 2;
     */
    resourceId: string;
    /**
     * @generated from field: string resource_name = 3;
     */
    resourceName: string;
    /**
     * @generated from field: event.v1.Type resource_type = 4;
     */
    resourceType: Type;
    /**
     * @generated from field: optional api.v1.BlockType resource_subtype = 5;
     */
    resourceSubtype?: BlockType;
    /**
     * @generated from field: optional api.v1.BlockStatus result = 6;
     */
    result?: BlockStatus;
    /**
     * @generated from field: event.v1.Status status = 7;
     */
    status: Status;
    /**
     * @generated from field: optional string integration_id = 8;
     */
    integrationId?: string;
    /**
     * @generated from field: optional string integration_type = 9;
     */
    integrationType?: string;
    /**
     * @generated from field: event.v1.Mode mode = 10;
     */
    mode: Mode;
    /**
     * @generated from field: string organization_id = 11;
     */
    organizationId: string;
    /**
     * @generated from field: optional string user_id = 12;
     */
    userId?: string;
    /**
     * @generated from field: event.v1.Trigger trigger = 13;
     */
    trigger: Trigger;
    /**
     * @generated from field: optional string parent_id = 14;
     */
    parentId?: string;
    /**
     * @generated from field: optional string parent_name = 15;
     */
    parentName?: string;
    /**
     * @generated from field: optional event.v1.Type parent_type = 16;
     */
    parentType?: Type;
    /**
     * @generated from field: bool is_descendant_of_stream = 17;
     */
    isDescendantOfStream: boolean;
    /**
     * @generated from field: optional string api_id = 18;
     */
    apiId?: string;
    constructor(data?: PartialMessage<ExecutionEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "event.v1.ExecutionEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ExecutionEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ExecutionEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ExecutionEvent;
    static equals(a: ExecutionEvent | PlainMessage<ExecutionEvent> | undefined, b: ExecutionEvent | PlainMessage<ExecutionEvent> | undefined): boolean;
}
