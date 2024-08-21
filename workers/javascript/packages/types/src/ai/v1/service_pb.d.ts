import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { LLM, MODEL, Task } from "./ai_pb";
/**
 * @generated from message ai.v1.Overrides
 */
export declare class Overrides extends Message<Overrides> {
    /**
     * @generated from field: ai.v1.LLM llm = 1;
     */
    llm: LLM;
    /**
     * @generated from field: ai.v1.MODEL model = 2;
     */
    model: MODEL;
    constructor(data?: PartialMessage<Overrides>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Overrides";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Overrides;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Overrides;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Overrides;
    static equals(a: Overrides | PlainMessage<Overrides> | undefined, b: Overrides | PlainMessage<Overrides> | undefined): boolean;
}
/**
 * @generated from message ai.v1.CreateTaskRequest
 */
export declare class CreateTaskRequest extends Message<CreateTaskRequest> {
    /**
     * @generated from field: ai.v1.Task task = 1;
     */
    task?: Task;
    /**
     * @generated from field: ai.v1.Overrides overrides = 2;
     */
    overrides?: Overrides;
    constructor(data?: PartialMessage<CreateTaskRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.CreateTaskRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateTaskRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateTaskRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateTaskRequest;
    static equals(a: CreateTaskRequest | PlainMessage<CreateTaskRequest> | undefined, b: CreateTaskRequest | PlainMessage<CreateTaskRequest> | undefined): boolean;
}
/**
 * NOTE(frank): I'm considering having two event types. I'm not sure how I feel about sending
 * inforamation that doesn't need to be sent every message in every message (i.e. id). Rather,
 * we could send a "hello" event at the beginning with any metadata.
 *
 * @generated from message ai.v1.TaskEvent
 */
export declare class TaskEvent extends Message<TaskEvent> {
    /**
     * @generated from field: string chunk = 1;
     */
    chunk: string;
    /**
     * @generated from field: ai.v1.LLM llm = 2;
     */
    llm: LLM;
    /**
     * @generated from field: ai.v1.MODEL model = 3;
     */
    model: MODEL;
    /**
     * @generated from field: string id = 4;
     */
    id: string;
    constructor(data?: PartialMessage<TaskEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.TaskEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TaskEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TaskEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TaskEvent;
    static equals(a: TaskEvent | PlainMessage<TaskEvent> | undefined, b: TaskEvent | PlainMessage<TaskEvent> | undefined): boolean;
}
