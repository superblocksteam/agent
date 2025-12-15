// package: ai.v1
// file: ai/v1/ai.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_language_pb from "../../common/v1/language_pb";
import * as common_v1_utils_pb from "../../common/v1/utils_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Message extends jspb.Message { 
    getRole(): Role;
    setRole(value: Role): Message;
    getContent(): string;
    setContent(value: string): Message;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Message.AsObject;
    static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Message;
    static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
    export type AsObject = {
        role: Role,
        content: string,
    }
}

export class Task extends jspb.Message { 

    hasOptimize(): boolean;
    clearOptimize(): void;
    getOptimize(): Task.Optimize | undefined;
    setOptimize(value?: Task.Optimize): Task;

    hasEdit(): boolean;
    clearEdit(): void;
    getEdit(): Task.Edit | undefined;
    setEdit(value?: Task.Edit): Task;

    hasExplain(): boolean;
    clearExplain(): void;
    getExplain(): Task.Explain | undefined;
    setExplain(value?: Task.Explain): Task;

    hasCreate(): boolean;
    clearCreate(): void;
    getCreate(): Task.Create | undefined;
    setCreate(value?: Task.Create): Task;

    hasDebug(): boolean;
    clearDebug(): void;
    getDebug(): Task.Debug | undefined;
    setDebug(value?: Task.Debug): Task;

    hasTranspile(): boolean;
    clearTranspile(): void;
    getTranspile(): Task.Transpile | undefined;
    setTranspile(value?: Task.Transpile): Task;

    hasMock(): boolean;
    clearMock(): void;
    getMock(): Task.Mock | undefined;
    setMock(value?: Task.Mock): Task;
    clearHistoryList(): void;
    getHistoryList(): Array<Message>;
    setHistoryList(value: Array<Message>): Task;
    addHistory(value?: Message, index?: number): Message;

    getKindCase(): Task.KindCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Task.AsObject;
    static toObject(includeInstance: boolean, msg: Task): Task.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Task, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Task;
    static deserializeBinaryFromReader(message: Task, reader: jspb.BinaryReader): Task;
}

export namespace Task {
    export type AsObject = {
        optimize?: Task.Optimize.AsObject,
        edit?: Task.Edit.AsObject,
        explain?: Task.Explain.AsObject,
        create?: Task.Create.AsObject,
        debug?: Task.Debug.AsObject,
        transpile?: Task.Transpile.AsObject,
        mock?: Task.Mock.AsObject,
        historyList: Array<Message.AsObject>,
    }


    export class Optimize extends jspb.Message { 

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Optimize.AsObject;
        static toObject(includeInstance: boolean, msg: Optimize): Optimize.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Optimize, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Optimize;
        static deserializeBinaryFromReader(message: Optimize, reader: jspb.BinaryReader): Optimize;
    }

    export namespace Optimize {
        export type AsObject = {
        }
    }

    export class Debug extends jspb.Message { 

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Debug.AsObject;
        static toObject(includeInstance: boolean, msg: Debug): Debug.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Debug, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Debug;
        static deserializeBinaryFromReader(message: Debug, reader: jspb.BinaryReader): Debug;
    }

    export namespace Debug {
        export type AsObject = {
        }
    }

    export class Transpile extends jspb.Message { 

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Transpile.AsObject;
        static toObject(includeInstance: boolean, msg: Transpile): Transpile.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Transpile, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Transpile;
        static deserializeBinaryFromReader(message: Transpile, reader: jspb.BinaryReader): Transpile;
    }

    export namespace Transpile {
        export type AsObject = {
        }
    }

    export class Edit extends jspb.Message { 
        getPrompt(): string;
        setPrompt(value: string): Edit;
        getSyntax(): Syntax;
        setSyntax(value: Syntax): Edit;
        getSnippet(): string;
        setSnippet(value: string): Edit;

        hasContext(): boolean;
        clearContext(): void;
        getContext(): Task.Edit.Context | undefined;
        setContext(value?: Task.Edit.Context): Edit;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Edit.AsObject;
        static toObject(includeInstance: boolean, msg: Edit): Edit.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Edit, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Edit;
        static deserializeBinaryFromReader(message: Edit, reader: jspb.BinaryReader): Edit;
    }

    export namespace Edit {
        export type AsObject = {
            prompt: string,
            syntax: Syntax,
            snippet: string,
            context?: Task.Edit.Context.AsObject,
        }


        export class Context extends jspb.Message { 

            hasMetadata(): boolean;
            clearMetadata(): void;
            getMetadata(): google_protobuf_struct_pb.Struct | undefined;
            setMetadata(value?: google_protobuf_struct_pb.Struct): Context;

            hasConfigurationIds(): boolean;
            clearConfigurationIds(): void;
            getConfigurationIds(): common_v1_utils_pb.StringList | undefined;
            setConfigurationIds(value?: common_v1_utils_pb.StringList): Context;

            getConfigurationCase(): Context.ConfigurationCase;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Context.AsObject;
            static toObject(includeInstance: boolean, msg: Context): Context.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Context, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Context;
            static deserializeBinaryFromReader(message: Context, reader: jspb.BinaryReader): Context;
        }

        export namespace Context {
            export type AsObject = {
                metadata?: google_protobuf_struct_pb.Struct.AsObject,
                configurationIds?: common_v1_utils_pb.StringList.AsObject,
            }

            export enum ConfigurationCase {
                CONFIGURATION_NOT_SET = 0,
                METADATA = 1,
                CONFIGURATION_IDS = 2,
            }

        }

    }

    export class Create extends jspb.Message { 
        getPrompt(): string;
        setPrompt(value: string): Create;
        getSyntax(): Syntax;
        setSyntax(value: Syntax): Create;

        hasContext(): boolean;
        clearContext(): void;
        getContext(): Task.Create.Context | undefined;
        setContext(value?: Task.Create.Context): Create;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Create.AsObject;
        static toObject(includeInstance: boolean, msg: Create): Create.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Create, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Create;
        static deserializeBinaryFromReader(message: Create, reader: jspb.BinaryReader): Create;
    }

    export namespace Create {
        export type AsObject = {
            prompt: string,
            syntax: Syntax,
            context?: Task.Create.Context.AsObject,
        }


        export class Context extends jspb.Message { 

            hasMetadata(): boolean;
            clearMetadata(): void;
            getMetadata(): google_protobuf_struct_pb.Struct | undefined;
            setMetadata(value?: google_protobuf_struct_pb.Struct): Context;

            hasConfigurationIds(): boolean;
            clearConfigurationIds(): void;
            getConfigurationIds(): common_v1_utils_pb.StringList | undefined;
            setConfigurationIds(value?: common_v1_utils_pb.StringList): Context;

            getConfigurationCase(): Context.ConfigurationCase;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Context.AsObject;
            static toObject(includeInstance: boolean, msg: Context): Context.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Context, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Context;
            static deserializeBinaryFromReader(message: Context, reader: jspb.BinaryReader): Context;
        }

        export namespace Context {
            export type AsObject = {
                metadata?: google_protobuf_struct_pb.Struct.AsObject,
                configurationIds?: common_v1_utils_pb.StringList.AsObject,
            }

            export enum ConfigurationCase {
                CONFIGURATION_NOT_SET = 0,
                METADATA = 1,
                CONFIGURATION_IDS = 2,
            }

        }

    }

    export class Explain extends jspb.Message { 
        getSyntax(): Syntax;
        setSyntax(value: Syntax): Explain;
        getSnippet(): string;
        setSnippet(value: string): Explain;
        getContents(): string;
        setContents(value: string): Explain;
        getLanguage(): common_v1_language_pb.Language;
        setLanguage(value: common_v1_language_pb.Language): Explain;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Explain.AsObject;
        static toObject(includeInstance: boolean, msg: Explain): Explain.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Explain, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Explain;
        static deserializeBinaryFromReader(message: Explain, reader: jspb.BinaryReader): Explain;
    }

    export namespace Explain {
        export type AsObject = {
            syntax: Syntax,
            snippet: string,
            contents: string,
            language: common_v1_language_pb.Language,
        }
    }

    export class Mock extends jspb.Message { 
        getSyntax(): Syntax;
        setSyntax(value: Syntax): Mock;
        getShape(): string;
        setShape(value: string): Mock;
        getPrompt(): string;
        setPrompt(value: string): Mock;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Mock.AsObject;
        static toObject(includeInstance: boolean, msg: Mock): Mock.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Mock, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Mock;
        static deserializeBinaryFromReader(message: Mock, reader: jspb.BinaryReader): Mock;
    }

    export namespace Mock {
        export type AsObject = {
            syntax: Syntax,
            shape: string,
            prompt: string,
        }
    }


    export enum KindCase {
        KIND_NOT_SET = 0,
        OPTIMIZE = 1,
        EDIT = 2,
        EXPLAIN = 3,
        CREATE = 4,
        DEBUG = 5,
        TRANSPILE = 7,
        MOCK = 8,
    }

}

export enum LLM {
    LLM_UNSPECIFIED = 0,
    LLM_OPENAI = 1,
    LLM_ANTHROPIC = 2,
    LLM_MOCK = 3,
}

export enum MODEL {
    MODEL_UNSPECIFIED = 0,
    MODEL_ANTHROPIC_CLAUDE_V1 = 1,
    MODEL_ANTHROPIC_CLAUDE_V1_0 = 2,
    MODEL_ANTHROPIC_CLAUDE_V1_2 = 3,
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1 = 4,
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1_0 = 5,
    MODEL_OPENAI_GPT432K0314 = 6,
    MODEL_OPENAI_GPT432K0613 = 26,
    MODEL_OPENAI_GPT432K = 7,
    MODEL_OPENAI_GPT40314 = 8,
    MODEL_OPENAI_GPT40613 = 27,
    MODEL_OPENAI_GPT4 = 9,
    MODEL_OPENAI_GPT3_5_TURBO_0301 = 10,
    MODEL_OPENAI_GPT3_5_TURBO_0613 = 28,
    MODEL_OPENAI_GPT3_5_TURBO = 11,
    MODEL_OPENAI_GPT3_5_TURBO_16K = 29,
    MODEL_OPENAI_GPT3_5_TURBO_16K_0613 = 30,
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_003 = 12,
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_002 = 13,
    MODEL_OPENAI_GPT3_TEXT_CURIE_001 = 14,
    MODEL_OPENAI_GPT3_TEXT_BAGGAGE_001 = 15,
    MODEL_OPENAI_GPT3_TEXT_ADA_001 = 16,
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_001 = 17,
    MODEL_OPENAI_GPT3_DAVINCI_INSTRUCT_BETA = 18,
    MODEL_OPENAI_GPT3_DAVINCI = 19,
    MODEL_OPENAI_GPT3_CURIE_INSTRUCT_BETA = 20,
    MODEL_OPENAI_GPT3_CURIE = 21,
    MODEL_OPENAI_GPT3_ADA = 22,
    MODEL_OPENAI_GPT3_BAGGAGE = 23,
    MODEL_MOCK_TIER_ONE = 24,
    MODEL_MOCK_TIER_TWO = 25,
}

export enum Role {
    ROLE_UNSPECIFIED = 0,
    ROLE_USER = 1,
    ROLE_ASSISTANT = 2,
    ROLE_SYSTEM = 3,
}

export enum Syntax {
    SYNTAX_UNSPECIFIED = 0,
    SYNTAX_JAVASCRIPT = 1,
    SYNTAX_PYTHON = 2,
    SYNTAX_POSTGRESQL = 3,
    SYNTAX_MSSQL = 4,
    SYNTAX_MYSQL = 5,
    SYNTAX_MARIADB = 6,
    SYNTAX_SNOWFLAKE = 7,
    SYNTAX_COCKROACHDB = 8,
    SYNTAX_ROCKSET = 9,
    SYNTAX_REDSHIFT = 10,
    SYNTAX_BIGQUERY = 11,
    SYNTAX_DYNAMODB = 12,
    SYNTAX_MONGODB = 13,
    SYNTAX_BINDING = 14,
    SYNTAX_JSON = 15,
    SYNTAX_HTML = 16,
    SYNTAX_API = 17,
    SYNTAX_PLUGIN_RESTAPI = 18,
    SYNTAX_PLUGIN_GRAPHQL = 19,
    SYNTAX_ORACLEDB = 20,
    SYNTAX_DATABRICKS = 21,
}

export enum Persona {
    PERSONA_UNSPECIFIED = 0,
    PERSONA_DEVELOPER = 1,
    PERSONA_TEACHER = 2,
}
