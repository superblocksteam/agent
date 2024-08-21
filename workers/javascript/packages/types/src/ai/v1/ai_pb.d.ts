import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message as Message$1, proto3, Struct } from "@bufbuild/protobuf";
import { StringList } from "../../common/v1/utils_pb";
import { Language } from "../../common/v1/language_pb";
/**
 * @generated from enum ai.v1.LLM
 */
export declare enum LLM {
    /**
     * @generated from enum value: LLM_UNSPECIFIED = 0;
     */
    LLM_UNSPECIFIED = 0,
    /**
     * @generated from enum value: LLM_OPENAI = 1;
     */
    LLM_OPENAI = 1,
    /**
     * @generated from enum value: LLM_ANTHROPIC = 2;
     */
    LLM_ANTHROPIC = 2,
    /**
     * @generated from enum value: LLM_MOCK = 3;
     */
    LLM_MOCK = 3
}
/**
 * @generated from enum ai.v1.MODEL
 */
export declare enum MODEL {
    /**
     * @generated from enum value: MODEL_UNSPECIFIED = 0;
     */
    MODEL_UNSPECIFIED = 0,
    /**
     * @generated from enum value: MODEL_ANTHROPIC_CLAUDE_V1 = 1;
     */
    MODEL_ANTHROPIC_CLAUDE_V1 = 1,
    /**
     * @generated from enum value: MODEL_ANTHROPIC_CLAUDE_V1_0 = 2;
     */
    MODEL_ANTHROPIC_CLAUDE_V1_0 = 2,
    /**
     * @generated from enum value: MODEL_ANTHROPIC_CLAUDE_V1_2 = 3;
     */
    MODEL_ANTHROPIC_CLAUDE_V1_2 = 3,
    /**
     * @generated from enum value: MODEL_ANTHROPIC_CLAUDE_INSTANT_V1 = 4;
     */
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1 = 4,
    /**
     * @generated from enum value: MODEL_ANTHROPIC_CLAUDE_INSTANT_V1_0 = 5;
     */
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1_0 = 5,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT432K0314 = 6;
     */
    MODEL_OPENAI_GPT432K0314 = 6,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT432K0613 = 26;
     */
    MODEL_OPENAI_GPT432K0613 = 26,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT432K = 7;
     */
    MODEL_OPENAI_GPT432K = 7,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT40314 = 8;
     */
    MODEL_OPENAI_GPT40314 = 8,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT40613 = 27;
     */
    MODEL_OPENAI_GPT40613 = 27,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT4 = 9;
     */
    MODEL_OPENAI_GPT4 = 9,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_5_TURBO_0301 = 10;
     */
    MODEL_OPENAI_GPT3_5_TURBO_0301 = 10,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_5_TURBO_0613 = 28;
     */
    MODEL_OPENAI_GPT3_5_TURBO_0613 = 28,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_5_TURBO = 11;
     */
    MODEL_OPENAI_GPT3_5_TURBO = 11,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_5_TURBO_16K = 29;
     */
    MODEL_OPENAI_GPT3_5_TURBO_16K = 29,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_5_TURBO_16K_0613 = 30;
     */
    MODEL_OPENAI_GPT3_5_TURBO_16K_0613 = 30,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_DAVINCI_003 = 12;
     */
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_003 = 12,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_DAVINCI_002 = 13;
     */
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_002 = 13,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_CURIE_001 = 14;
     */
    MODEL_OPENAI_GPT3_TEXT_CURIE_001 = 14,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_BAGGAGE_001 = 15;
     */
    MODEL_OPENAI_GPT3_TEXT_BAGGAGE_001 = 15,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_ADA_001 = 16;
     */
    MODEL_OPENAI_GPT3_TEXT_ADA_001 = 16,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_TEXT_DAVINCI_001 = 17;
     */
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_001 = 17,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_DAVINCI_INSTRUCT_BETA = 18;
     */
    MODEL_OPENAI_GPT3_DAVINCI_INSTRUCT_BETA = 18,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_DAVINCI = 19;
     */
    MODEL_OPENAI_GPT3_DAVINCI = 19,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_CURIE_INSTRUCT_BETA = 20;
     */
    MODEL_OPENAI_GPT3_CURIE_INSTRUCT_BETA = 20,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_CURIE = 21;
     */
    MODEL_OPENAI_GPT3_CURIE = 21,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_ADA = 22;
     */
    MODEL_OPENAI_GPT3_ADA = 22,
    /**
     * @generated from enum value: MODEL_OPENAI_GPT3_BAGGAGE = 23;
     */
    MODEL_OPENAI_GPT3_BAGGAGE = 23,
    /**
     * @generated from enum value: MODEL_MOCK_TIER_ONE = 24;
     */
    MODEL_MOCK_TIER_ONE = 24,
    /**
     * @generated from enum value: MODEL_MOCK_TIER_TWO = 25;
     */
    MODEL_MOCK_TIER_TWO = 25
}
/**
 * @generated from enum ai.v1.Role
 */
export declare enum Role {
    /**
     * @generated from enum value: ROLE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: ROLE_USER = 1;
     */
    USER = 1,
    /**
     * @generated from enum value: ROLE_ASSISTANT = 2;
     */
    ASSISTANT = 2,
    /**
     * @generated from enum value: ROLE_SYSTEM = 3;
     */
    SYSTEM = 3
}
/**
 * NOTE(frank): I guess these could just be in the Lnaguage enum.
 *
 * @generated from enum ai.v1.Syntax
 */
export declare enum Syntax {
    /**
     * @generated from enum value: SYNTAX_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: SYNTAX_JAVASCRIPT = 1;
     */
    JAVASCRIPT = 1,
    /**
     * @generated from enum value: SYNTAX_PYTHON = 2;
     */
    PYTHON = 2,
    /**
     * @generated from enum value: SYNTAX_POSTGRESQL = 3;
     */
    POSTGRESQL = 3,
    /**
     * @generated from enum value: SYNTAX_MSSQL = 4;
     */
    MSSQL = 4,
    /**
     * @generated from enum value: SYNTAX_MYSQL = 5;
     */
    MYSQL = 5,
    /**
     * @generated from enum value: SYNTAX_MARIADB = 6;
     */
    MARIADB = 6,
    /**
     * @generated from enum value: SYNTAX_SNOWFLAKE = 7;
     */
    SNOWFLAKE = 7,
    /**
     * @generated from enum value: SYNTAX_COCKROACHDB = 8;
     */
    COCKROACHDB = 8,
    /**
     * @generated from enum value: SYNTAX_ROCKSET = 9;
     */
    ROCKSET = 9,
    /**
     * @generated from enum value: SYNTAX_REDSHIFT = 10;
     */
    REDSHIFT = 10,
    /**
     * @generated from enum value: SYNTAX_BIGQUERY = 11;
     */
    BIGQUERY = 11,
    /**
     * @generated from enum value: SYNTAX_DYNAMODB = 12;
     */
    DYNAMODB = 12,
    /**
     * @generated from enum value: SYNTAX_MONGODB = 13;
     */
    MONGODB = 13,
    /**
     * @generated from enum value: SYNTAX_BINDING = 14;
     */
    BINDING = 14,
    /**
     * @generated from enum value: SYNTAX_JSON = 15;
     */
    JSON = 15,
    /**
     * @generated from enum value: SYNTAX_HTML = 16;
     */
    HTML = 16,
    /**
     * @generated from enum value: SYNTAX_API = 17;
     */
    API = 17,
    /**
     * @generated from enum value: SYNTAX_PLUGIN_RESTAPI = 18;
     */
    PLUGIN_RESTAPI = 18,
    /**
     * @generated from enum value: SYNTAX_PLUGIN_GRAPHQL = 19;
     */
    PLUGIN_GRAPHQL = 19,
    /**
     * @generated from enum value: SYNTAX_ORACLEDB = 20;
     */
    ORACLEDB = 20,
    /**
     * @generated from enum value: SYNTAX_DATABRICKS = 21;
     */
    DATABRICKS = 21
}
/**
 * @generated from enum ai.v1.Persona
 */
export declare enum Persona {
    /**
     * @generated from enum value: PERSONA_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: PERSONA_DEVELOPER = 1;
     */
    DEVELOPER = 1,
    /**
     * @generated from enum value: PERSONA_TEACHER = 2;
     */
    TEACHER = 2
}
/**
 * @generated from message ai.v1.Message
 */
export declare class Message extends Message$1<Message> {
    /**
     * @generated from field: ai.v1.Role role = 1;
     */
    role: Role;
    /**
     * @generated from field: string content = 2;
     */
    content: string;
    constructor(data?: PartialMessage<Message>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Message";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Message;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Message;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Message;
    static equals(a: Message | PlainMessage<Message> | undefined, b: Message | PlainMessage<Message> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task
 */
export declare class Task extends Message$1<Task> {
    /**
     * @generated from oneof ai.v1.Task.kind
     */
    kind: {
        /**
         * @generated from field: ai.v1.Task.Optimize optimize = 1;
         */
        value: Task_Optimize;
        case: "optimize";
    } | {
        /**
         * @generated from field: ai.v1.Task.Edit edit = 2;
         */
        value: Task_Edit;
        case: "edit";
    } | {
        /**
         * @generated from field: ai.v1.Task.Explain explain = 3;
         */
        value: Task_Explain;
        case: "explain";
    } | {
        /**
         * @generated from field: ai.v1.Task.Create create = 4;
         */
        value: Task_Create;
        case: "create";
    } | {
        /**
         * @generated from field: ai.v1.Task.Debug debug = 5;
         */
        value: Task_Debug;
        case: "debug";
    } | {
        /**
         * @generated from field: ai.v1.Task.Transpile transpile = 7;
         */
        value: Task_Transpile;
        case: "transpile";
    } | {
        /**
         * @generated from field: ai.v1.Task.Mock mock = 8;
         */
        value: Task_Mock;
        case: "mock";
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: repeated ai.v1.Message history = 6;
     */
    history: Message[];
    constructor(data?: PartialMessage<Task>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task;
    static equals(a: Task | PlainMessage<Task> | undefined, b: Task | PlainMessage<Task> | undefined): boolean;
}
/**
 *
 *
 * @generated from message ai.v1.Task.Optimize
 */
export declare class Task_Optimize extends Message$1<Task_Optimize> {
    constructor(data?: PartialMessage<Task_Optimize>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Optimize";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Optimize;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Optimize;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Optimize;
    static equals(a: Task_Optimize | PlainMessage<Task_Optimize> | undefined, b: Task_Optimize | PlainMessage<Task_Optimize> | undefined): boolean;
}
/**
 *
 *
 * @generated from message ai.v1.Task.Debug
 */
export declare class Task_Debug extends Message$1<Task_Debug> {
    constructor(data?: PartialMessage<Task_Debug>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Debug";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Debug;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Debug;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Debug;
    static equals(a: Task_Debug | PlainMessage<Task_Debug> | undefined, b: Task_Debug | PlainMessage<Task_Debug> | undefined): boolean;
}
/**
 *
 *
 * @generated from message ai.v1.Task.Transpile
 */
export declare class Task_Transpile extends Message$1<Task_Transpile> {
    constructor(data?: PartialMessage<Task_Transpile>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Transpile";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Transpile;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Transpile;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Transpile;
    static equals(a: Task_Transpile | PlainMessage<Task_Transpile> | undefined, b: Task_Transpile | PlainMessage<Task_Transpile> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Edit
 */
export declare class Task_Edit extends Message$1<Task_Edit> {
    /**
     * @generated from field: string prompt = 1;
     */
    prompt: string;
    /**
     * @generated from field: ai.v1.Syntax syntax = 2;
     */
    syntax: Syntax;
    /**
     * @generated from field: string snippet = 3;
     */
    snippet: string;
    /**
     * @generated from field: ai.v1.Task.Edit.Context context = 4;
     */
    context?: Task_Edit_Context;
    constructor(data?: PartialMessage<Task_Edit>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Edit";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Edit;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Edit;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Edit;
    static equals(a: Task_Edit | PlainMessage<Task_Edit> | undefined, b: Task_Edit | PlainMessage<Task_Edit> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Edit.Context
 */
export declare class Task_Edit_Context extends Message$1<Task_Edit_Context> {
    /**
     * @generated from oneof ai.v1.Task.Edit.Context.configuration
     */
    configuration: {
        /**
         * @generated from field: google.protobuf.Struct metadata = 1;
         */
        value: Struct;
        case: "metadata";
    } | {
        /**
         * @generated from field: common.v1.StringList configuration_ids = 2;
         */
        value: StringList;
        case: "configurationIds";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Task_Edit_Context>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Edit.Context";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Edit_Context;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Edit_Context;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Edit_Context;
    static equals(a: Task_Edit_Context | PlainMessage<Task_Edit_Context> | undefined, b: Task_Edit_Context | PlainMessage<Task_Edit_Context> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Create
 */
export declare class Task_Create extends Message$1<Task_Create> {
    /**
     * @generated from field: string prompt = 1;
     */
    prompt: string;
    /**
     * @generated from field: ai.v1.Syntax syntax = 2;
     */
    syntax: Syntax;
    /**
     * @generated from field: ai.v1.Task.Create.Context context = 3;
     */
    context?: Task_Create_Context;
    constructor(data?: PartialMessage<Task_Create>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Create";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Create;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Create;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Create;
    static equals(a: Task_Create | PlainMessage<Task_Create> | undefined, b: Task_Create | PlainMessage<Task_Create> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Create.Context
 */
export declare class Task_Create_Context extends Message$1<Task_Create_Context> {
    /**
     * @generated from oneof ai.v1.Task.Create.Context.configuration
     */
    configuration: {
        /**
         * @generated from field: google.protobuf.Struct metadata = 1;
         */
        value: Struct;
        case: "metadata";
    } | {
        /**
         * @generated from field: common.v1.StringList configuration_ids = 2;
         */
        value: StringList;
        case: "configurationIds";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Task_Create_Context>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Create.Context";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Create_Context;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Create_Context;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Create_Context;
    static equals(a: Task_Create_Context | PlainMessage<Task_Create_Context> | undefined, b: Task_Create_Context | PlainMessage<Task_Create_Context> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Explain
 */
export declare class Task_Explain extends Message$1<Task_Explain> {
    /**
     * @generated from field: ai.v1.Syntax syntax = 1;
     */
    syntax: Syntax;
    /**
     * @generated from field: string snippet = 2;
     */
    snippet: string;
    /**
     * @generated from field: string contents = 3;
     */
    contents: string;
    /**
     * @generated from field: common.v1.Language language = 4;
     */
    language: Language;
    constructor(data?: PartialMessage<Task_Explain>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Explain";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Explain;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Explain;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Explain;
    static equals(a: Task_Explain | PlainMessage<Task_Explain> | undefined, b: Task_Explain | PlainMessage<Task_Explain> | undefined): boolean;
}
/**
 * @generated from message ai.v1.Task.Mock
 */
export declare class Task_Mock extends Message$1<Task_Mock> {
    /**
     * @generated from field: ai.v1.Syntax syntax = 1;
     */
    syntax: Syntax;
    /**
     * @generated from field: string shape = 2;
     */
    shape: string;
    /**
     * @generated from field: string prompt = 3;
     */
    prompt: string;
    constructor(data?: PartialMessage<Task_Mock>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "ai.v1.Task.Mock";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Task_Mock;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Task_Mock;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Task_Mock;
    static equals(a: Task_Mock | PlainMessage<Task_Mock> | undefined, b: Task_Mock | PlainMessage<Task_Mock> | undefined): boolean;
}
