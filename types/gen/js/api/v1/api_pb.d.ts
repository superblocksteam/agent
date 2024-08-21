// package: api.v1
// file: api/v1/api.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_blocks_pb from "../../api/v1/blocks_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as plugins_adls_v1_plugin_pb from "../../plugins/adls/v1/plugin_pb";
import * as plugins_athena_v1_plugin_pb from "../../plugins/athena/v1/plugin_pb";
import * as plugins_bigquery_v1_plugin_pb from "../../plugins/bigquery/v1/plugin_pb";
import * as plugins_cockroachdb_v1_plugin_pb from "../../plugins/cockroachdb/v1/plugin_pb";
import * as plugins_cosmosdb_v1_plugin_pb from "../../plugins/cosmosdb/v1/plugin_pb";
import * as plugins_couchbase_v1_plugin_pb from "../../plugins/couchbase/v1/plugin_pb";
import * as plugins_custom_v1_plugin_pb from "../../plugins/custom/v1/plugin_pb";
import * as plugins_databricks_v1_plugin_pb from "../../plugins/databricks/v1/plugin_pb";
import * as plugins_dynamodb_v1_plugin_pb from "../../plugins/dynamodb/v1/plugin_pb";
import * as plugins_email_v1_plugin_pb from "../../plugins/email/v1/plugin_pb";
import * as plugins_gcs_v1_plugin_pb from "../../plugins/gcs/v1/plugin_pb";
import * as plugins_graphql_v1_plugin_pb from "../../plugins/graphql/v1/plugin_pb";
import * as plugins_gsheets_v1_plugin_pb from "../../plugins/gsheets/v1/plugin_pb";
import * as plugins_javascript_v1_plugin_pb from "../../plugins/javascript/v1/plugin_pb";
import * as plugins_kafka_v1_plugin_pb from "../../plugins/kafka/v1/plugin_pb";
import * as plugins_mariadb_v1_plugin_pb from "../../plugins/mariadb/v1/plugin_pb";
import * as plugins_mongodb_v1_plugin_pb from "../../plugins/mongodb/v1/plugin_pb";
import * as plugins_mssql_v1_plugin_pb from "../../plugins/mssql/v1/plugin_pb";
import * as plugins_mysql_v1_plugin_pb from "../../plugins/mysql/v1/plugin_pb";
import * as plugins_ocr_v1_plugin_pb from "../../plugins/ocr/v1/plugin_pb";
import * as plugins_openai_v1_plugin_pb from "../../plugins/openai/v1/plugin_pb";
import * as plugins_oracledb_v1_plugin_pb from "../../plugins/oracledb/v1/plugin_pb";
import * as plugins_pinecone_v1_plugin_pb from "../../plugins/pinecone/v1/plugin_pb";
import * as plugins_postgresql_v1_plugin_pb from "../../plugins/postgresql/v1/plugin_pb";
import * as plugins_python_v1_plugin_pb from "../../plugins/python/v1/plugin_pb";
import * as plugins_redis_v1_plugin_pb from "../../plugins/redis/v1/plugin_pb";
import * as plugins_redshift_v1_plugin_pb from "../../plugins/redshift/v1/plugin_pb";
import * as plugins_restapi_v1_plugin_pb from "../../plugins/restapi/v1/plugin_pb";
import * as plugins_restapiintegration_v1_plugin_pb from "../../plugins/restapiintegration/v1/plugin_pb";
import * as plugins_rockset_v1_plugin_pb from "../../plugins/rockset/v1/plugin_pb";
import * as plugins_s3_v1_plugin_pb from "../../plugins/s3/v1/plugin_pb";
import * as plugins_salesforce_v1_plugin_pb from "../../plugins/salesforce/v1/plugin_pb";
import * as plugins_smtp_v1_plugin_pb from "../../plugins/smtp/v1/plugin_pb";
import * as plugins_snowflake_v1_plugin_pb from "../../plugins/snowflake/v1/plugin_pb";
import * as plugins_workflow_v1_plugin_pb from "../../plugins/workflow/v1/plugin_pb";
import * as superblocks_v1_options_pb from "../../superblocks/v1/options_pb";
import * as utils_v1_utils_pb from "../../utils/v1/utils_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Api extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): common_v1_common_pb.Metadata | undefined;
    setMetadata(value?: common_v1_common_pb.Metadata): Api;
    clearBlocksList(): void;
    getBlocksList(): Array<Block>;
    setBlocksList(value: Array<Block>): Api;
    addBlocks(value?: Block, index?: number): Block;

    hasTrigger(): boolean;
    clearTrigger(): void;
    getTrigger(): Trigger | undefined;
    setTrigger(value?: Trigger): Api;

    hasSignature(): boolean;
    clearSignature(): void;
    getSignature(): utils_v1_utils_pb.Signature | undefined;
    setSignature(value?: utils_v1_utils_pb.Signature): Api;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Api.AsObject;
    static toObject(includeInstance: boolean, msg: Api): Api.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Api, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Api;
    static deserializeBinaryFromReader(message: Api, reader: jspb.BinaryReader): Api;
}

export namespace Api {
    export type AsObject = {
        metadata?: common_v1_common_pb.Metadata.AsObject,
        blocksList: Array<Block.AsObject>,
        trigger?: Trigger.AsObject,
        signature?: utils_v1_utils_pb.Signature.AsObject,
    }
}

export class Profiles extends jspb.Message { 

    hasModes(): boolean;
    clearModes(): void;
    getModes(): Profiles.Modes | undefined;
    setModes(value?: Profiles.Modes): Profiles;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Profiles.AsObject;
    static toObject(includeInstance: boolean, msg: Profiles): Profiles.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Profiles, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Profiles;
    static deserializeBinaryFromReader(message: Profiles, reader: jspb.BinaryReader): Profiles;
}

export namespace Profiles {
    export type AsObject = {
        modes?: Profiles.Modes.AsObject,
    }


    export class Modes extends jspb.Message { 

        hasEditor(): boolean;
        clearEditor(): void;
        getEditor(): Profiles.Modes.Settings | undefined;
        setEditor(value?: Profiles.Modes.Settings): Modes;

        hasPreview(): boolean;
        clearPreview(): void;
        getPreview(): Profiles.Modes.Settings | undefined;
        setPreview(value?: Profiles.Modes.Settings): Modes;

        hasDeployed(): boolean;
        clearDeployed(): void;
        getDeployed(): Profiles.Modes.Settings | undefined;
        setDeployed(value?: Profiles.Modes.Settings): Modes;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Modes.AsObject;
        static toObject(includeInstance: boolean, msg: Modes): Modes.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Modes, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Modes;
        static deserializeBinaryFromReader(message: Modes, reader: jspb.BinaryReader): Modes;
    }

    export namespace Modes {
        export type AsObject = {
            editor?: Profiles.Modes.Settings.AsObject,
            preview?: Profiles.Modes.Settings.AsObject,
            deployed?: Profiles.Modes.Settings.AsObject,
        }


        export class Settings extends jspb.Message { 
            getDefault(): string;
            setDefault(value: string): Settings;
            clearAvailableList(): void;
            getAvailableList(): Array<string>;
            setAvailableList(value: Array<string>): Settings;
            addAvailable(value: string, index?: number): string;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Settings.AsObject;
            static toObject(includeInstance: boolean, msg: Settings): Settings.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Settings, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Settings;
            static deserializeBinaryFromReader(message: Settings, reader: jspb.BinaryReader): Settings;
        }

        export namespace Settings {
            export type AsObject = {
                pb_default: string,
                availableList: Array<string>,
            }
        }

    }

}

export class Trigger extends jspb.Message { 

    hasApplication(): boolean;
    clearApplication(): void;
    getApplication(): Trigger.Application | undefined;
    setApplication(value?: Trigger.Application): Trigger;

    hasWorkflow(): boolean;
    clearWorkflow(): void;
    getWorkflow(): Trigger.Workflow | undefined;
    setWorkflow(value?: Trigger.Workflow): Trigger;

    hasJob(): boolean;
    clearJob(): void;
    getJob(): Trigger.Job | undefined;
    setJob(value?: Trigger.Job): Trigger;

    getConfigCase(): Trigger.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Trigger.AsObject;
    static toObject(includeInstance: boolean, msg: Trigger): Trigger.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Trigger, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Trigger;
    static deserializeBinaryFromReader(message: Trigger, reader: jspb.BinaryReader): Trigger;
}

export namespace Trigger {
    export type AsObject = {
        application?: Trigger.Application.AsObject,
        workflow?: Trigger.Workflow.AsObject,
        job?: Trigger.Job.AsObject,
    }


    export class Application extends jspb.Message { 

        hasOptions(): boolean;
        clearOptions(): void;
        getOptions(): Trigger.Application.Options | undefined;
        setOptions(value?: Trigger.Application.Options): Application;
        getId(): string;
        setId(value: string): Application;

        hasPageId(): boolean;
        clearPageId(): void;
        getPageId(): string | undefined;
        setPageId(value: string): Application;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Application.AsObject;
        static toObject(includeInstance: boolean, msg: Application): Application.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Application, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Application;
        static deserializeBinaryFromReader(message: Application, reader: jspb.BinaryReader): Application;
    }

    export namespace Application {
        export type AsObject = {
            options?: Trigger.Application.Options.AsObject,
            id: string,
            pageId?: string,
        }


        export class Options extends jspb.Message { 

            hasExecuteOnPageLoad(): boolean;
            clearExecuteOnPageLoad(): void;
            getExecuteOnPageLoad(): boolean | undefined;
            setExecuteOnPageLoad(value: boolean): Options;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Options.AsObject;
            static toObject(includeInstance: boolean, msg: Options): Options.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Options, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Options;
            static deserializeBinaryFromReader(message: Options, reader: jspb.BinaryReader): Options;
        }

        export namespace Options {
            export type AsObject = {
                executeOnPageLoad?: boolean,
            }
        }

    }

    export class Workflow extends jspb.Message { 

        hasOptions(): boolean;
        clearOptions(): void;
        getOptions(): Trigger.Workflow.Options | undefined;
        setOptions(value?: Trigger.Workflow.Options): Workflow;

        hasParameters(): boolean;
        clearParameters(): void;
        getParameters(): Trigger.Workflow.Parameters | undefined;
        setParameters(value?: Trigger.Workflow.Parameters): Workflow;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Workflow.AsObject;
        static toObject(includeInstance: boolean, msg: Workflow): Workflow.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Workflow, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Workflow;
        static deserializeBinaryFromReader(message: Workflow, reader: jspb.BinaryReader): Workflow;
    }

    export namespace Workflow {
        export type AsObject = {
            options?: Trigger.Workflow.Options.AsObject,
            parameters?: Trigger.Workflow.Parameters.AsObject,
        }


        export class Options extends jspb.Message { 

            hasProfiles(): boolean;
            clearProfiles(): void;
            getProfiles(): Profiles | undefined;
            setProfiles(value?: Profiles): Options;

            hasDeployedcommitid(): boolean;
            clearDeployedcommitid(): void;
            getDeployedcommitid(): string | undefined;
            setDeployedcommitid(value: string): Options;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Options.AsObject;
            static toObject(includeInstance: boolean, msg: Options): Options.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Options, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Options;
            static deserializeBinaryFromReader(message: Options, reader: jspb.BinaryReader): Options;
        }

        export namespace Options {
            export type AsObject = {
                profiles?: Profiles.AsObject,
                deployedcommitid?: string,
            }
        }

        export class Parameters extends jspb.Message { 

            getQueryMap(): jspb.Map<string, Trigger.Workflow.Parameters.QueryParam>;
            clearQueryMap(): void;

            getBodyMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
            clearBodyMap(): void;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Parameters.AsObject;
            static toObject(includeInstance: boolean, msg: Parameters): Parameters.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Parameters, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Parameters;
            static deserializeBinaryFromReader(message: Parameters, reader: jspb.BinaryReader): Parameters;
        }

        export namespace Parameters {
            export type AsObject = {

                queryMap: Array<[string, Trigger.Workflow.Parameters.QueryParam.AsObject]>,

                bodyMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
            }


            export class QueryParam extends jspb.Message { 
                clearValuesList(): void;
                getValuesList(): Array<string>;
                setValuesList(value: Array<string>): QueryParam;
                addValues(value: string, index?: number): string;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): QueryParam.AsObject;
                static toObject(includeInstance: boolean, msg: QueryParam): QueryParam.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: QueryParam, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): QueryParam;
                static deserializeBinaryFromReader(message: QueryParam, reader: jspb.BinaryReader): QueryParam;
            }

            export namespace QueryParam {
                export type AsObject = {
                    valuesList: Array<string>,
                }
            }

        }

    }

    export class Job extends jspb.Message { 

        hasOptions(): boolean;
        clearOptions(): void;
        getOptions(): Trigger.Job.Options | undefined;
        setOptions(value?: Trigger.Job.Options): Job;
        getFrequency(): number;
        setFrequency(value: number): Job;
        getInterval(): Trigger.Job.Interval;
        setInterval(value: Trigger.Job.Interval): Job;
        getDayOfMonth(): number;
        setDayOfMonth(value: number): Job;

        hasDays(): boolean;
        clearDays(): void;
        getDays(): Trigger.Job.Days | undefined;
        setDays(value?: Trigger.Job.Days): Job;

        hasTime(): boolean;
        clearTime(): void;
        getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
        setTime(value?: google_protobuf_timestamp_pb.Timestamp): Job;
        getTimezoneLocale(): string;
        setTimezoneLocale(value: string): Job;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Job.AsObject;
        static toObject(includeInstance: boolean, msg: Job): Job.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Job, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Job;
        static deserializeBinaryFromReader(message: Job, reader: jspb.BinaryReader): Job;
    }

    export namespace Job {
        export type AsObject = {
            options?: Trigger.Job.Options.AsObject,
            frequency: number,
            interval: Trigger.Job.Interval,
            dayOfMonth: number,
            days?: Trigger.Job.Days.AsObject,
            time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
            timezoneLocale: string,
        }


        export class Options extends jspb.Message { 

            hasProfiles(): boolean;
            clearProfiles(): void;
            getProfiles(): Profiles | undefined;
            setProfiles(value?: Profiles): Options;
            getSendEmailOnFailure(): boolean;
            setSendEmailOnFailure(value: boolean): Options;

            hasDeployedcommitid(): boolean;
            clearDeployedcommitid(): void;
            getDeployedcommitid(): string | undefined;
            setDeployedcommitid(value: string): Options;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Options.AsObject;
            static toObject(includeInstance: boolean, msg: Options): Options.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Options, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Options;
            static deserializeBinaryFromReader(message: Options, reader: jspb.BinaryReader): Options;
        }

        export namespace Options {
            export type AsObject = {
                profiles?: Profiles.AsObject,
                sendEmailOnFailure: boolean,
                deployedcommitid?: string,
            }
        }

        export class Days extends jspb.Message { 
            getSunday(): boolean;
            setSunday(value: boolean): Days;
            getMonday(): boolean;
            setMonday(value: boolean): Days;
            getTuesday(): boolean;
            setTuesday(value: boolean): Days;
            getWednesday(): boolean;
            setWednesday(value: boolean): Days;
            getThursday(): boolean;
            setThursday(value: boolean): Days;
            getFriday(): boolean;
            setFriday(value: boolean): Days;
            getSaturday(): boolean;
            setSaturday(value: boolean): Days;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Days.AsObject;
            static toObject(includeInstance: boolean, msg: Days): Days.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Days, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Days;
            static deserializeBinaryFromReader(message: Days, reader: jspb.BinaryReader): Days;
        }

        export namespace Days {
            export type AsObject = {
                sunday: boolean,
                monday: boolean,
                tuesday: boolean,
                wednesday: boolean,
                thursday: boolean,
                friday: boolean,
                saturday: boolean,
            }
        }


        export enum Interval {
    INTERVAL_UNSPECIFIED = 0,
    INTERVAL_MINUTE = 1,
    INTERVAL_HOUR = 2,
    INTERVAL_DAY = 3,
    INTERVAL_WEEK = 4,
    INTERVAL_MONTH = 5,
        }

    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        APPLICATION = 1,
        WORKFLOW = 2,
        JOB = 3,
    }

}

export class Blocks extends jspb.Message { 
    clearBlocksList(): void;
    getBlocksList(): Array<Block>;
    setBlocksList(value: Array<Block>): Blocks;
    addBlocks(value?: Block, index?: number): Block;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Blocks.AsObject;
    static toObject(includeInstance: boolean, msg: Blocks): Blocks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Blocks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Blocks;
    static deserializeBinaryFromReader(message: Blocks, reader: jspb.BinaryReader): Blocks;
}

export namespace Blocks {
    export type AsObject = {
        blocksList: Array<Block.AsObject>,
    }
}

export class Block extends jspb.Message { 
    getName(): string;
    setName(value: string): Block;

    hasBreak(): boolean;
    clearBreak(): void;
    getBreak(): Block.Break | undefined;
    setBreak(value?: Block.Break): Block;

    hasReturn(): boolean;
    clearReturn(): void;
    getReturn(): Block.Return | undefined;
    setReturn(value?: Block.Return): Block;

    hasWait(): boolean;
    clearWait(): void;
    getWait(): Block.Wait | undefined;
    setWait(value?: Block.Wait): Block;

    hasParallel(): boolean;
    clearParallel(): void;
    getParallel(): Block.Parallel | undefined;
    setParallel(value?: Block.Parallel): Block;

    hasConditional(): boolean;
    clearConditional(): void;
    getConditional(): Block.Conditional | undefined;
    setConditional(value?: Block.Conditional): Block;

    hasLoop(): boolean;
    clearLoop(): void;
    getLoop(): Block.Loop | undefined;
    setLoop(value?: Block.Loop): Block;

    hasTryCatch(): boolean;
    clearTryCatch(): void;
    getTryCatch(): Block.TryCatch | undefined;
    setTryCatch(value?: Block.TryCatch): Block;

    hasStep(): boolean;
    clearStep(): void;
    getStep(): Step | undefined;
    setStep(value?: Step): Block;

    hasVariables(): boolean;
    clearVariables(): void;
    getVariables(): api_v1_blocks_pb.Variables | undefined;
    setVariables(value?: api_v1_blocks_pb.Variables): Block;

    hasThrow(): boolean;
    clearThrow(): void;
    getThrow(): Block.Throw | undefined;
    setThrow(value?: Block.Throw): Block;

    hasStream(): boolean;
    clearStream(): void;
    getStream(): Block.Stream | undefined;
    setStream(value?: Block.Stream): Block;

    hasSend(): boolean;
    clearSend(): void;
    getSend(): Block.Send | undefined;
    setSend(value?: Block.Send): Block;

    getConfigCase(): Block.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Block.AsObject;
    static toObject(includeInstance: boolean, msg: Block): Block.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Block, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Block;
    static deserializeBinaryFromReader(message: Block, reader: jspb.BinaryReader): Block;
}

export namespace Block {
    export type AsObject = {
        name: string,
        pb_break?: Block.Break.AsObject,
        pb_return?: Block.Return.AsObject,
        wait?: Block.Wait.AsObject,
        parallel?: Block.Parallel.AsObject,
        conditional?: Block.Conditional.AsObject,
        loop?: Block.Loop.AsObject,
        tryCatch?: Block.TryCatch.AsObject,
        step?: Step.AsObject,
        variables?: api_v1_blocks_pb.Variables.AsObject,
        pb_throw?: Block.Throw.AsObject,
        stream?: Block.Stream.AsObject,
        send?: Block.Send.AsObject,
    }


    export class Parallel extends jspb.Message { 

        hasStatic(): boolean;
        clearStatic(): void;
        getStatic(): Block.Parallel.Static | undefined;
        setStatic(value?: Block.Parallel.Static): Parallel;

        hasDynamic(): boolean;
        clearDynamic(): void;
        getDynamic(): Block.Parallel.Dynamic | undefined;
        setDynamic(value?: Block.Parallel.Dynamic): Parallel;
        getWait(): Block.Parallel.Wait;
        setWait(value: Block.Parallel.Wait): Parallel;

        hasPoolSize(): boolean;
        clearPoolSize(): void;
        getPoolSize(): number | undefined;
        setPoolSize(value: number): Parallel;

        getConfigCase(): Parallel.ConfigCase;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Parallel.AsObject;
        static toObject(includeInstance: boolean, msg: Parallel): Parallel.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Parallel, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Parallel;
        static deserializeBinaryFromReader(message: Parallel, reader: jspb.BinaryReader): Parallel;
    }

    export namespace Parallel {
        export type AsObject = {
            pb_static?: Block.Parallel.Static.AsObject,
            dynamic?: Block.Parallel.Dynamic.AsObject,
            wait: Block.Parallel.Wait,
            poolSize?: number,
        }


        export class Static extends jspb.Message { 

            getPathsMap(): jspb.Map<string, Blocks>;
            clearPathsMap(): void;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Static.AsObject;
            static toObject(includeInstance: boolean, msg: Static): Static.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Static, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Static;
            static deserializeBinaryFromReader(message: Static, reader: jspb.BinaryReader): Static;
        }

        export namespace Static {
            export type AsObject = {

                pathsMap: Array<[string, Blocks.AsObject]>,
            }
        }

        export class Dynamic extends jspb.Message { 
            getPaths(): string;
            setPaths(value: string): Dynamic;

            hasVariables(): boolean;
            clearVariables(): void;
            getVariables(): Block.Parallel.Dynamic.Variables | undefined;
            setVariables(value?: Block.Parallel.Dynamic.Variables): Dynamic;
            clearBlocksList(): void;
            getBlocksList(): Array<Block>;
            setBlocksList(value: Array<Block>): Dynamic;
            addBlocks(value?: Block, index?: number): Block;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Dynamic.AsObject;
            static toObject(includeInstance: boolean, msg: Dynamic): Dynamic.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Dynamic, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Dynamic;
            static deserializeBinaryFromReader(message: Dynamic, reader: jspb.BinaryReader): Dynamic;
        }

        export namespace Dynamic {
            export type AsObject = {
                paths: string,
                variables?: Block.Parallel.Dynamic.Variables.AsObject,
                blocksList: Array<Block.AsObject>,
            }


            export class Variables extends jspb.Message { 
                getItem(): string;
                setItem(value: string): Variables;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): Variables.AsObject;
                static toObject(includeInstance: boolean, msg: Variables): Variables.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: Variables, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): Variables;
                static deserializeBinaryFromReader(message: Variables, reader: jspb.BinaryReader): Variables;
            }

            export namespace Variables {
                export type AsObject = {
                    item: string,
                }
            }

        }


        export enum Wait {
    WAIT_UNSPECIFIED = 0,
    WAIT_ALL = 1,
    WAIT_NONE = 2,
        }


        export enum ConfigCase {
            CONFIG_NOT_SET = 0,
            STATIC = 1,
            DYNAMIC = 2,
        }

    }

    export class Conditional extends jspb.Message { 

        hasIf(): boolean;
        clearIf(): void;
        getIf(): Block.Conditional.Condition | undefined;
        setIf(value?: Block.Conditional.Condition): Conditional;
        clearElseIfList(): void;
        getElseIfList(): Array<Block.Conditional.Condition>;
        setElseIfList(value: Array<Block.Conditional.Condition>): Conditional;
        addElseIf(value?: Block.Conditional.Condition, index?: number): Block.Conditional.Condition;

        hasElse(): boolean;
        clearElse(): void;
        getElse(): Blocks | undefined;
        setElse(value?: Blocks): Conditional;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Conditional.AsObject;
        static toObject(includeInstance: boolean, msg: Conditional): Conditional.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Conditional, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Conditional;
        static deserializeBinaryFromReader(message: Conditional, reader: jspb.BinaryReader): Conditional;
    }

    export namespace Conditional {
        export type AsObject = {
            pb_if?: Block.Conditional.Condition.AsObject,
            elseIfList: Array<Block.Conditional.Condition.AsObject>,
            pb_else?: Blocks.AsObject,
        }


        export class Condition extends jspb.Message { 
            getCondition(): string;
            setCondition(value: string): Condition;
            clearBlocksList(): void;
            getBlocksList(): Array<Block>;
            setBlocksList(value: Array<Block>): Condition;
            addBlocks(value?: Block, index?: number): Block;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Condition.AsObject;
            static toObject(includeInstance: boolean, msg: Condition): Condition.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Condition, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Condition;
            static deserializeBinaryFromReader(message: Condition, reader: jspb.BinaryReader): Condition;
        }

        export namespace Condition {
            export type AsObject = {
                condition: string,
                blocksList: Array<Block.AsObject>,
            }
        }

    }

    export class Loop extends jspb.Message { 
        getRange(): string;
        setRange(value: string): Loop;
        getType(): Block.Loop.Type;
        setType(value: Block.Loop.Type): Loop;

        hasVariables(): boolean;
        clearVariables(): void;
        getVariables(): Block.Loop.Variables | undefined;
        setVariables(value?: Block.Loop.Variables): Loop;
        clearBlocksList(): void;
        getBlocksList(): Array<Block>;
        setBlocksList(value: Array<Block>): Loop;
        addBlocks(value?: Block, index?: number): Block;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Loop.AsObject;
        static toObject(includeInstance: boolean, msg: Loop): Loop.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Loop, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Loop;
        static deserializeBinaryFromReader(message: Loop, reader: jspb.BinaryReader): Loop;
    }

    export namespace Loop {
        export type AsObject = {
            range: string,
            type: Block.Loop.Type,
            variables?: Block.Loop.Variables.AsObject,
            blocksList: Array<Block.AsObject>,
        }


        export class Variables extends jspb.Message { 
            getIndex(): string;
            setIndex(value: string): Variables;
            getItem(): string;
            setItem(value: string): Variables;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Variables.AsObject;
            static toObject(includeInstance: boolean, msg: Variables): Variables.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Variables, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Variables;
            static deserializeBinaryFromReader(message: Variables, reader: jspb.BinaryReader): Variables;
        }

        export namespace Variables {
            export type AsObject = {
                index: string,
                item: string,
            }
        }


        export enum Type {
    TYPE_UNSPECIFIED = 0,
    TYPE_FOR = 1,
    TYPE_FOREACH = 2,
    TYPE_WHILE = 3,
        }

    }

    export class TryCatch extends jspb.Message { 

        hasTry(): boolean;
        clearTry(): void;
        getTry(): Blocks | undefined;
        setTry(value?: Blocks): TryCatch;

        hasCatch(): boolean;
        clearCatch(): void;
        getCatch(): Blocks | undefined;
        setCatch(value?: Blocks): TryCatch;

        hasFinally(): boolean;
        clearFinally(): void;
        getFinally(): Blocks | undefined;
        setFinally(value?: Blocks): TryCatch;

        hasVariables(): boolean;
        clearVariables(): void;
        getVariables(): Block.TryCatch.Variables | undefined;
        setVariables(value?: Block.TryCatch.Variables): TryCatch;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): TryCatch.AsObject;
        static toObject(includeInstance: boolean, msg: TryCatch): TryCatch.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: TryCatch, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): TryCatch;
        static deserializeBinaryFromReader(message: TryCatch, reader: jspb.BinaryReader): TryCatch;
    }

    export namespace TryCatch {
        export type AsObject = {
            pb_try?: Blocks.AsObject,
            pb_catch?: Blocks.AsObject,
            pb_finally?: Blocks.AsObject,
            variables?: Block.TryCatch.Variables.AsObject,
        }


        export class Variables extends jspb.Message { 
            getError(): string;
            setError(value: string): Variables;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Variables.AsObject;
            static toObject(includeInstance: boolean, msg: Variables): Variables.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Variables, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Variables;
            static deserializeBinaryFromReader(message: Variables, reader: jspb.BinaryReader): Variables;
        }

        export namespace Variables {
            export type AsObject = {
                error: string,
            }
        }

    }

    export class Break extends jspb.Message { 
        getCondition(): string;
        setCondition(value: string): Break;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Break.AsObject;
        static toObject(includeInstance: boolean, msg: Break): Break.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Break, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Break;
        static deserializeBinaryFromReader(message: Break, reader: jspb.BinaryReader): Break;
    }

    export namespace Break {
        export type AsObject = {
            condition: string,
        }
    }

    export class Return extends jspb.Message { 
        getData(): string;
        setData(value: string): Return;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Return.AsObject;
        static toObject(includeInstance: boolean, msg: Return): Return.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Return, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Return;
        static deserializeBinaryFromReader(message: Return, reader: jspb.BinaryReader): Return;
    }

    export namespace Return {
        export type AsObject = {
            data: string,
        }
    }

    export class Throw extends jspb.Message { 
        getError(): string;
        setError(value: string): Throw;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Throw.AsObject;
        static toObject(includeInstance: boolean, msg: Throw): Throw.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Throw, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Throw;
        static deserializeBinaryFromReader(message: Throw, reader: jspb.BinaryReader): Throw;
    }

    export namespace Throw {
        export type AsObject = {
            error: string,
        }
    }

    export class Wait extends jspb.Message { 
        getCondition(): string;
        setCondition(value: string): Wait;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Wait.AsObject;
        static toObject(includeInstance: boolean, msg: Wait): Wait.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Wait, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Wait;
        static deserializeBinaryFromReader(message: Wait, reader: jspb.BinaryReader): Wait;
    }

    export namespace Wait {
        export type AsObject = {
            condition: string,
        }
    }

    export class Stream extends jspb.Message { 

        hasTrigger(): boolean;
        clearTrigger(): void;
        getTrigger(): Block.Stream.Trigger | undefined;
        setTrigger(value?: Block.Stream.Trigger): Stream;

        hasProcess(): boolean;
        clearProcess(): void;
        getProcess(): Blocks | undefined;
        setProcess(value?: Blocks): Stream;

        hasVariables(): boolean;
        clearVariables(): void;
        getVariables(): Block.Stream.Variables | undefined;
        setVariables(value?: Block.Stream.Variables): Stream;

        hasOptions(): boolean;
        clearOptions(): void;
        getOptions(): Block.Stream.Options | undefined;
        setOptions(value?: Block.Stream.Options): Stream;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Stream.AsObject;
        static toObject(includeInstance: boolean, msg: Stream): Stream.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Stream, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Stream;
        static deserializeBinaryFromReader(message: Stream, reader: jspb.BinaryReader): Stream;
    }

    export namespace Stream {
        export type AsObject = {
            trigger?: Block.Stream.Trigger.AsObject,
            process?: Blocks.AsObject,
            variables?: Block.Stream.Variables.AsObject,
            options?: Block.Stream.Options.AsObject,
        }


        export class Variables extends jspb.Message { 
            getItem(): string;
            setItem(value: string): Variables;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Variables.AsObject;
            static toObject(includeInstance: boolean, msg: Variables): Variables.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Variables, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Variables;
            static deserializeBinaryFromReader(message: Variables, reader: jspb.BinaryReader): Variables;
        }

        export namespace Variables {
            export type AsObject = {
                item: string,
            }
        }

        export class Options extends jspb.Message { 
            getDisableAutoSend(): boolean;
            setDisableAutoSend(value: boolean): Options;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Options.AsObject;
            static toObject(includeInstance: boolean, msg: Options): Options.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Options, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Options;
            static deserializeBinaryFromReader(message: Options, reader: jspb.BinaryReader): Options;
        }

        export namespace Options {
            export type AsObject = {
                disableAutoSend: boolean,
            }
        }

        export class Trigger extends jspb.Message { 
            getName(): string;
            setName(value: string): Trigger;

            hasStep(): boolean;
            clearStep(): void;
            getStep(): Step | undefined;
            setStep(value?: Step): Trigger;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Trigger.AsObject;
            static toObject(includeInstance: boolean, msg: Trigger): Trigger.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Trigger, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Trigger;
            static deserializeBinaryFromReader(message: Trigger, reader: jspb.BinaryReader): Trigger;
        }

        export namespace Trigger {
            export type AsObject = {
                name: string,
                step?: Step.AsObject,
            }
        }

    }

    export class Send extends jspb.Message { 
        getMessage(): string;
        setMessage(value: string): Send;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Send.AsObject;
        static toObject(includeInstance: boolean, msg: Send): Send.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Send, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Send;
        static deserializeBinaryFromReader(message: Send, reader: jspb.BinaryReader): Send;
    }

    export namespace Send {
        export type AsObject = {
            message: string,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        BREAK = 2,
        RETURN = 3,
        WAIT = 4,
        PARALLEL = 5,
        CONDITIONAL = 6,
        LOOP = 7,
        TRY_CATCH = 8,
        STEP = 9,
        VARIABLES = 10,
        THROW = 11,
        STREAM = 12,
        SEND = 13,
    }

}

export class Step extends jspb.Message { 
    getIntegration(): string;
    setIntegration(value: string): Step;

    hasPython(): boolean;
    clearPython(): void;
    getPython(): plugins_python_v1_plugin_pb.Plugin | undefined;
    setPython(value?: plugins_python_v1_plugin_pb.Plugin): Step;

    hasBigquery(): boolean;
    clearBigquery(): void;
    getBigquery(): plugins_bigquery_v1_plugin_pb.Plugin | undefined;
    setBigquery(value?: plugins_bigquery_v1_plugin_pb.Plugin): Step;

    hasDynamodb(): boolean;
    clearDynamodb(): void;
    getDynamodb(): plugins_dynamodb_v1_plugin_pb.Plugin | undefined;
    setDynamodb(value?: plugins_dynamodb_v1_plugin_pb.Plugin): Step;

    hasEmail(): boolean;
    clearEmail(): void;
    getEmail(): plugins_email_v1_plugin_pb.Plugin | undefined;
    setEmail(value?: plugins_email_v1_plugin_pb.Plugin): Step;

    hasGraphql(): boolean;
    clearGraphql(): void;
    getGraphql(): plugins_graphql_v1_plugin_pb.Plugin | undefined;
    setGraphql(value?: plugins_graphql_v1_plugin_pb.Plugin): Step;

    hasGraphqlintegration(): boolean;
    clearGraphqlintegration(): void;
    getGraphqlintegration(): plugins_graphql_v1_plugin_pb.Plugin | undefined;
    setGraphqlintegration(value?: plugins_graphql_v1_plugin_pb.Plugin): Step;

    hasGsheets(): boolean;
    clearGsheets(): void;
    getGsheets(): plugins_gsheets_v1_plugin_pb.Plugin | undefined;
    setGsheets(value?: plugins_gsheets_v1_plugin_pb.Plugin): Step;

    hasMariadb(): boolean;
    clearMariadb(): void;
    getMariadb(): plugins_mariadb_v1_plugin_pb.Plugin | undefined;
    setMariadb(value?: plugins_mariadb_v1_plugin_pb.Plugin): Step;

    hasMssql(): boolean;
    clearMssql(): void;
    getMssql(): plugins_mssql_v1_plugin_pb.Plugin | undefined;
    setMssql(value?: plugins_mssql_v1_plugin_pb.Plugin): Step;

    hasMysql(): boolean;
    clearMysql(): void;
    getMysql(): plugins_mysql_v1_plugin_pb.Plugin | undefined;
    setMysql(value?: plugins_mysql_v1_plugin_pb.Plugin): Step;

    hasPostgres(): boolean;
    clearPostgres(): void;
    getPostgres(): plugins_postgresql_v1_plugin_pb.Plugin | undefined;
    setPostgres(value?: plugins_postgresql_v1_plugin_pb.Plugin): Step;

    hasRedshift(): boolean;
    clearRedshift(): void;
    getRedshift(): plugins_redshift_v1_plugin_pb.Plugin | undefined;
    setRedshift(value?: plugins_redshift_v1_plugin_pb.Plugin): Step;

    hasRestapi(): boolean;
    clearRestapi(): void;
    getRestapi(): plugins_restapi_v1_plugin_pb.Plugin | undefined;
    setRestapi(value?: plugins_restapi_v1_plugin_pb.Plugin): Step;

    hasRestapiintegration(): boolean;
    clearRestapiintegration(): void;
    getRestapiintegration(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setRestapiintegration(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasRockset(): boolean;
    clearRockset(): void;
    getRockset(): plugins_rockset_v1_plugin_pb.Plugin | undefined;
    setRockset(value?: plugins_rockset_v1_plugin_pb.Plugin): Step;

    hasS3(): boolean;
    clearS3(): void;
    getS3(): plugins_s3_v1_plugin_pb.Plugin | undefined;
    setS3(value?: plugins_s3_v1_plugin_pb.Plugin): Step;

    hasSnowflake(): boolean;
    clearSnowflake(): void;
    getSnowflake(): plugins_snowflake_v1_plugin_pb.Plugin | undefined;
    setSnowflake(value?: plugins_snowflake_v1_plugin_pb.Plugin): Step;

    hasWorkflow(): boolean;
    clearWorkflow(): void;
    getWorkflow(): plugins_workflow_v1_plugin_pb.Plugin | undefined;
    setWorkflow(value?: plugins_workflow_v1_plugin_pb.Plugin): Step;

    hasJavascript(): boolean;
    clearJavascript(): void;
    getJavascript(): plugins_javascript_v1_plugin_pb.Plugin | undefined;
    setJavascript(value?: plugins_javascript_v1_plugin_pb.Plugin): Step;

    hasMongodb(): boolean;
    clearMongodb(): void;
    getMongodb(): plugins_mongodb_v1_plugin_pb.Plugin | undefined;
    setMongodb(value?: plugins_mongodb_v1_plugin_pb.Plugin): Step;

    hasGcs(): boolean;
    clearGcs(): void;
    getGcs(): plugins_gcs_v1_plugin_pb.Plugin | undefined;
    setGcs(value?: plugins_gcs_v1_plugin_pb.Plugin): Step;

    hasOpenai(): boolean;
    clearOpenai(): void;
    getOpenai(): plugins_openai_v1_plugin_pb.Plugin | undefined;
    setOpenai(value?: plugins_openai_v1_plugin_pb.Plugin): Step;

    hasOcr(): boolean;
    clearOcr(): void;
    getOcr(): plugins_ocr_v1_plugin_pb.Plugin | undefined;
    setOcr(value?: plugins_ocr_v1_plugin_pb.Plugin): Step;

    hasKafka(): boolean;
    clearKafka(): void;
    getKafka(): plugins_kafka_v1_plugin_pb.Plugin | undefined;
    setKafka(value?: plugins_kafka_v1_plugin_pb.Plugin): Step;

    hasConfluent(): boolean;
    clearConfluent(): void;
    getConfluent(): plugins_kafka_v1_plugin_pb.Plugin | undefined;
    setConfluent(value?: plugins_kafka_v1_plugin_pb.Plugin): Step;

    hasMsk(): boolean;
    clearMsk(): void;
    getMsk(): plugins_kafka_v1_plugin_pb.Plugin | undefined;
    setMsk(value?: plugins_kafka_v1_plugin_pb.Plugin): Step;

    hasRedpanda(): boolean;
    clearRedpanda(): void;
    getRedpanda(): plugins_kafka_v1_plugin_pb.Plugin | undefined;
    setRedpanda(value?: plugins_kafka_v1_plugin_pb.Plugin): Step;

    hasAivenkafka(): boolean;
    clearAivenkafka(): void;
    getAivenkafka(): plugins_kafka_v1_plugin_pb.Plugin | undefined;
    setAivenkafka(value?: plugins_kafka_v1_plugin_pb.Plugin): Step;

    hasCockroachdb(): boolean;
    clearCockroachdb(): void;
    getCockroachdb(): plugins_cockroachdb_v1_plugin_pb.Plugin | undefined;
    setCockroachdb(value?: plugins_cockroachdb_v1_plugin_pb.Plugin): Step;

    hasAirtable(): boolean;
    clearAirtable(): void;
    getAirtable(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setAirtable(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasNotion(): boolean;
    clearNotion(): void;
    getNotion(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setNotion(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasPagerduty(): boolean;
    clearPagerduty(): void;
    getPagerduty(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setPagerduty(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasSendgrid(): boolean;
    clearSendgrid(): void;
    getSendgrid(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setSendgrid(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasSlack(): boolean;
    clearSlack(): void;
    getSlack(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setSlack(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasAthena(): boolean;
    clearAthena(): void;
    getAthena(): plugins_athena_v1_plugin_pb.Plugin | undefined;
    setAthena(value?: plugins_athena_v1_plugin_pb.Plugin): Step;

    hasRedis(): boolean;
    clearRedis(): void;
    getRedis(): plugins_redis_v1_plugin_pb.Plugin | undefined;
    setRedis(value?: plugins_redis_v1_plugin_pb.Plugin): Step;

    hasAsana(): boolean;
    clearAsana(): void;
    getAsana(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setAsana(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasGithub(): boolean;
    clearGithub(): void;
    getGithub(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setGithub(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasSmtp(): boolean;
    clearSmtp(): void;
    getSmtp(): plugins_smtp_v1_plugin_pb.Plugin | undefined;
    setSmtp(value?: plugins_smtp_v1_plugin_pb.Plugin): Step;

    hasSalesforce(): boolean;
    clearSalesforce(): void;
    getSalesforce(): plugins_salesforce_v1_plugin_pb.Plugin | undefined;
    setSalesforce(value?: plugins_salesforce_v1_plugin_pb.Plugin): Step;

    hasBitbucket(): boolean;
    clearBitbucket(): void;
    getBitbucket(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setBitbucket(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasCircleci(): boolean;
    clearCircleci(): void;
    getCircleci(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setCircleci(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasFront(): boolean;
    clearFront(): void;
    getFront(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setFront(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasIntercom(): boolean;
    clearIntercom(): void;
    getIntercom(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setIntercom(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasSegment(): boolean;
    clearSegment(): void;
    getSegment(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setSegment(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasLaunchdarkly(): boolean;
    clearLaunchdarkly(): void;
    getLaunchdarkly(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setLaunchdarkly(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasDropbox(): boolean;
    clearDropbox(): void;
    getDropbox(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setDropbox(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasTwilio(): boolean;
    clearTwilio(): void;
    getTwilio(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setTwilio(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasGoogledrive(): boolean;
    clearGoogledrive(): void;
    getGoogledrive(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setGoogledrive(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasGoogleanalytics(): boolean;
    clearGoogleanalytics(): void;
    getGoogleanalytics(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setGoogleanalytics(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasBox(): boolean;
    clearBox(): void;
    getBox(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setBox(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasHubspot(): boolean;
    clearHubspot(): void;
    getHubspot(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setHubspot(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasStripe(): boolean;
    clearStripe(): void;
    getStripe(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setStripe(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasZoom(): boolean;
    clearZoom(): void;
    getZoom(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setZoom(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasJira(): boolean;
    clearJira(): void;
    getJira(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setJira(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasZendesk(): boolean;
    clearZendesk(): void;
    getZendesk(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setZendesk(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasAdls(): boolean;
    clearAdls(): void;
    getAdls(): plugins_adls_v1_plugin_pb.Plugin | undefined;
    setAdls(value?: plugins_adls_v1_plugin_pb.Plugin): Step;

    hasPinecone(): boolean;
    clearPinecone(): void;
    getPinecone(): plugins_pinecone_v1_plugin_pb.Plugin | undefined;
    setPinecone(value?: plugins_pinecone_v1_plugin_pb.Plugin): Step;

    hasCosmosdb(): boolean;
    clearCosmosdb(): void;
    getCosmosdb(): plugins_cosmosdb_v1_plugin_pb.Plugin | undefined;
    setCosmosdb(value?: plugins_cosmosdb_v1_plugin_pb.Plugin): Step;

    hasDatadog(): boolean;
    clearDatadog(): void;
    getDatadog(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setDatadog(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasXero(): boolean;
    clearXero(): void;
    getXero(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setXero(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasOracledb(): boolean;
    clearOracledb(): void;
    getOracledb(): plugins_oracledb_v1_plugin_pb.Plugin | undefined;
    setOracledb(value?: plugins_oracledb_v1_plugin_pb.Plugin): Step;

    hasElasticsearch(): boolean;
    clearElasticsearch(): void;
    getElasticsearch(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setElasticsearch(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasDatabricks(): boolean;
    clearDatabricks(): void;
    getDatabricks(): plugins_databricks_v1_plugin_pb.Plugin | undefined;
    setDatabricks(value?: plugins_databricks_v1_plugin_pb.Plugin): Step;

    hasCouchbase(): boolean;
    clearCouchbase(): void;
    getCouchbase(): plugins_couchbase_v1_plugin_pb.Plugin | undefined;
    setCouchbase(value?: plugins_couchbase_v1_plugin_pb.Plugin): Step;

    hasCustom(): boolean;
    clearCustom(): void;
    getCustom(): plugins_custom_v1_plugin_pb.Plugin | undefined;
    setCustom(value?: plugins_custom_v1_plugin_pb.Plugin): Step;

    hasAnthropic(): boolean;
    clearAnthropic(): void;
    getAnthropic(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setAnthropic(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasCohere(): boolean;
    clearCohere(): void;
    getCohere(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setCohere(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasFireworks(): boolean;
    clearFireworks(): void;
    getFireworks(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setFireworks(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasMistral(): boolean;
    clearMistral(): void;
    getMistral(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setMistral(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasGroq(): boolean;
    clearGroq(): void;
    getGroq(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setGroq(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasPerplexity(): boolean;
    clearPerplexity(): void;
    getPerplexity(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setPerplexity(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasStabilityai(): boolean;
    clearStabilityai(): void;
    getStabilityai(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setStabilityai(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    hasGemini(): boolean;
    clearGemini(): void;
    getGemini(): plugins_restapiintegration_v1_plugin_pb.Plugin | undefined;
    setGemini(value?: plugins_restapiintegration_v1_plugin_pb.Plugin): Step;

    getConfigCase(): Step.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Step.AsObject;
    static toObject(includeInstance: boolean, msg: Step): Step.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Step, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Step;
    static deserializeBinaryFromReader(message: Step, reader: jspb.BinaryReader): Step;
}

export namespace Step {
    export type AsObject = {
        integration: string,
        python?: plugins_python_v1_plugin_pb.Plugin.AsObject,
        bigquery?: plugins_bigquery_v1_plugin_pb.Plugin.AsObject,
        dynamodb?: plugins_dynamodb_v1_plugin_pb.Plugin.AsObject,
        email?: plugins_email_v1_plugin_pb.Plugin.AsObject,
        graphql?: plugins_graphql_v1_plugin_pb.Plugin.AsObject,
        graphqlintegration?: plugins_graphql_v1_plugin_pb.Plugin.AsObject,
        gsheets?: plugins_gsheets_v1_plugin_pb.Plugin.AsObject,
        mariadb?: plugins_mariadb_v1_plugin_pb.Plugin.AsObject,
        mssql?: plugins_mssql_v1_plugin_pb.Plugin.AsObject,
        mysql?: plugins_mysql_v1_plugin_pb.Plugin.AsObject,
        postgres?: plugins_postgresql_v1_plugin_pb.Plugin.AsObject,
        redshift?: plugins_redshift_v1_plugin_pb.Plugin.AsObject,
        restapi?: plugins_restapi_v1_plugin_pb.Plugin.AsObject,
        restapiintegration?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        rockset?: plugins_rockset_v1_plugin_pb.Plugin.AsObject,
        s3?: plugins_s3_v1_plugin_pb.Plugin.AsObject,
        snowflake?: plugins_snowflake_v1_plugin_pb.Plugin.AsObject,
        workflow?: plugins_workflow_v1_plugin_pb.Plugin.AsObject,
        javascript?: plugins_javascript_v1_plugin_pb.Plugin.AsObject,
        mongodb?: plugins_mongodb_v1_plugin_pb.Plugin.AsObject,
        gcs?: plugins_gcs_v1_plugin_pb.Plugin.AsObject,
        openai?: plugins_openai_v1_plugin_pb.Plugin.AsObject,
        ocr?: plugins_ocr_v1_plugin_pb.Plugin.AsObject,
        kafka?: plugins_kafka_v1_plugin_pb.Plugin.AsObject,
        confluent?: plugins_kafka_v1_plugin_pb.Plugin.AsObject,
        msk?: plugins_kafka_v1_plugin_pb.Plugin.AsObject,
        redpanda?: plugins_kafka_v1_plugin_pb.Plugin.AsObject,
        aivenkafka?: plugins_kafka_v1_plugin_pb.Plugin.AsObject,
        cockroachdb?: plugins_cockroachdb_v1_plugin_pb.Plugin.AsObject,
        airtable?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        notion?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        pagerduty?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        sendgrid?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        slack?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        athena?: plugins_athena_v1_plugin_pb.Plugin.AsObject,
        redis?: plugins_redis_v1_plugin_pb.Plugin.AsObject,
        asana?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        github?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        smtp?: plugins_smtp_v1_plugin_pb.Plugin.AsObject,
        salesforce?: plugins_salesforce_v1_plugin_pb.Plugin.AsObject,
        bitbucket?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        circleci?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        front?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        intercom?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        segment?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        launchdarkly?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        dropbox?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        twilio?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        googledrive?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        googleanalytics?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        box?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        hubspot?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        stripe?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        zoom?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        jira?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        zendesk?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        adls?: plugins_adls_v1_plugin_pb.Plugin.AsObject,
        pinecone?: plugins_pinecone_v1_plugin_pb.Plugin.AsObject,
        cosmosdb?: plugins_cosmosdb_v1_plugin_pb.Plugin.AsObject,
        datadog?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        xero?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        oracledb?: plugins_oracledb_v1_plugin_pb.Plugin.AsObject,
        elasticsearch?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        databricks?: plugins_databricks_v1_plugin_pb.Plugin.AsObject,
        couchbase?: plugins_couchbase_v1_plugin_pb.Plugin.AsObject,
        custom?: plugins_custom_v1_plugin_pb.Plugin.AsObject,
        anthropic?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        cohere?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        fireworks?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        mistral?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        groq?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        perplexity?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        stabilityai?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
        gemini?: plugins_restapiintegration_v1_plugin_pb.Plugin.AsObject,
    }

    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        PYTHON = 2,
        BIGQUERY = 3,
        DYNAMODB = 4,
        EMAIL = 5,
        GRAPHQL = 6,
        GRAPHQLINTEGRATION = 7,
        GSHEETS = 8,
        MARIADB = 9,
        MSSQL = 10,
        MYSQL = 11,
        POSTGRES = 12,
        REDSHIFT = 13,
        RESTAPI = 14,
        RESTAPIINTEGRATION = 15,
        ROCKSET = 16,
        S3 = 17,
        SNOWFLAKE = 18,
        WORKFLOW = 19,
        JAVASCRIPT = 20,
        MONGODB = 21,
        GCS = 22,
        OPENAI = 23,
        OCR = 24,
        KAFKA = 25,
        CONFLUENT = 26,
        MSK = 27,
        REDPANDA = 28,
        AIVENKAFKA = 29,
        COCKROACHDB = 30,
        AIRTABLE = 31,
        NOTION = 32,
        PAGERDUTY = 33,
        SENDGRID = 34,
        SLACK = 35,
        ATHENA = 36,
        REDIS = 37,
        ASANA = 38,
        GITHUB = 39,
        SMTP = 40,
        SALESFORCE = 41,
        BITBUCKET = 42,
        CIRCLECI = 43,
        FRONT = 44,
        INTERCOM = 45,
        SEGMENT = 46,
        LAUNCHDARKLY = 47,
        DROPBOX = 48,
        TWILIO = 49,
        GOOGLEDRIVE = 50,
        GOOGLEANALYTICS = 51,
        BOX = 52,
        HUBSPOT = 53,
        STRIPE = 54,
        ZOOM = 55,
        JIRA = 56,
        ZENDESK = 57,
        ADLS = 58,
        PINECONE = 59,
        COSMOSDB = 60,
        DATADOG = 61,
        XERO = 62,
        ORACLEDB = 63,
        ELASTICSEARCH = 64,
        DATABRICKS = 65,
        COUCHBASE = 66,
        CUSTOM = 67,
        ANTHROPIC = 68,
        COHERE = 69,
        FIREWORKS = 70,
        MISTRAL = 71,
        GROQ = 72,
        PERPLEXITY = 73,
        STABILITYAI = 74,
        GEMINI = 75,
    }

}
