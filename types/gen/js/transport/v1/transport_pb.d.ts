// package: transport.v1
// file: transport/v1/transport.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as api_v1_api_pb from "../../api/v1/api_pb";
import * as api_v1_blocks_pb from "../../api/v1/blocks_pb";
import * as api_v1_service_pb from "../../api/v1/service_pb";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_errors_pb from "../../common/v1/errors_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as plugins_adls_v1_plugin_pb from "../../plugins/adls/v1/plugin_pb";
import * as plugins_cosmosdb_v1_plugin_pb from "../../plugins/cosmosdb/v1/plugin_pb";
import * as plugins_kafka_v1_plugin_pb from "../../plugins/kafka/v1/plugin_pb";
import * as store_v1_store_pb from "../../store/v1/store_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class Performance extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): Performance;

    hasPluginExecution(): boolean;
    clearPluginExecution(): void;
    getPluginExecution(): Performance.Observable | undefined;
    setPluginExecution(value?: Performance.Observable): Performance;

    hasQueueRequest(): boolean;
    clearQueueRequest(): void;
    getQueueRequest(): Performance.Observable | undefined;
    setQueueRequest(value?: Performance.Observable): Performance;

    hasQueueResponse(): boolean;
    clearQueueResponse(): void;
    getQueueResponse(): Performance.Observable | undefined;
    setQueueResponse(value?: Performance.Observable): Performance;

    hasKvStoreFetch(): boolean;
    clearKvStoreFetch(): void;
    getKvStoreFetch(): Performance.Observable | undefined;
    setKvStoreFetch(value?: Performance.Observable): Performance;

    hasKvStorePush(): boolean;
    clearKvStorePush(): void;
    getKvStorePush(): Performance.Observable | undefined;
    setKvStorePush(value?: Performance.Observable): Performance;

    hasTotal(): boolean;
    clearTotal(): void;
    getTotal(): Performance.Observable | undefined;
    setTotal(value?: Performance.Observable): Performance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Performance.AsObject;
    static toObject(includeInstance: boolean, msg: Performance): Performance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Performance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Performance;
    static deserializeBinaryFromReader(message: Performance, reader: jspb.BinaryReader): Performance;
}

export namespace Performance {
    export type AsObject = {
        error: boolean,
        pluginExecution?: Performance.Observable.AsObject,
        queueRequest?: Performance.Observable.AsObject,
        queueResponse?: Performance.Observable.AsObject,
        kvStoreFetch?: Performance.Observable.AsObject,
        kvStorePush?: Performance.Observable.AsObject,
        total?: Performance.Observable.AsObject,
    }


    export class Observable extends jspb.Message { 
        getStart(): number;
        setStart(value: number): Observable;
        getEnd(): number;
        setEnd(value: number): Observable;
        getValue(): number;
        setValue(value: number): Observable;
        getBytes(): number;
        setBytes(value: number): Observable;
        getEstimate(): number;
        setEstimate(value: number): Observable;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Observable.AsObject;
        static toObject(includeInstance: boolean, msg: Observable): Observable.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Observable, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Observable;
        static deserializeBinaryFromReader(message: Observable, reader: jspb.BinaryReader): Observable;
    }

    export namespace Observable {
        export type AsObject = {
            start: number,
            end: number,
            value: number,
            bytes: number,
            estimate: number,
        }
    }

}

export class Variable extends jspb.Message { 
    getKey(): string;
    setKey(value: string): Variable;
    getType(): api_v1_blocks_pb.Variables.Type;
    setType(value: api_v1_blocks_pb.Variables.Type): Variable;
    getMode(): api_v1_blocks_pb.Variables.Mode;
    setMode(value: api_v1_blocks_pb.Variables.Mode): Variable;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Variable.AsObject;
    static toObject(includeInstance: boolean, msg: Variable): Variable.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Variable, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Variable;
    static deserializeBinaryFromReader(message: Variable, reader: jspb.BinaryReader): Variable;
}

export namespace Variable {
    export type AsObject = {
        key: string,
        type: api_v1_blocks_pb.Variables.Type,
        mode: api_v1_blocks_pb.Variables.Mode,
    }
}

export class Observability extends jspb.Message { 
    getTraceId(): string;
    setTraceId(value: string): Observability;
    getSpanId(): string;
    setSpanId(value: string): Observability;

    getBaggageMap(): jspb.Map<string, string>;
    clearBaggageMap(): void;
    getTraceFlags(): Uint8Array | string;
    getTraceFlags_asU8(): Uint8Array;
    getTraceFlags_asB64(): string;
    setTraceFlags(value: Uint8Array | string): Observability;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Observability.AsObject;
    static toObject(includeInstance: boolean, msg: Observability): Observability.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Observability, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Observability;
    static deserializeBinaryFromReader(message: Observability, reader: jspb.BinaryReader): Observability;
}

export namespace Observability {
    export type AsObject = {
        traceId: string,
        spanId: string,

        baggageMap: Array<[string, string]>,
        traceFlags: Uint8Array | string,
    }
}

export class Request extends jspb.Message { 
    getInbox(): string;
    setInbox(value: string): Request;

    hasData(): boolean;
    clearData(): void;
    getData(): Request.Data | undefined;
    setData(value?: Request.Data): Request;
    getTopic(): string;
    setTopic(value: string): Request;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Request.AsObject;
    static toObject(includeInstance: boolean, msg: Request): Request.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Request, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Request;
    static deserializeBinaryFromReader(message: Request, reader: jspb.BinaryReader): Request;
}

export namespace Request {
    export type AsObject = {
        inbox: string,
        data?: Request.Data.AsObject,
        topic: string,
    }


    export class Data extends jspb.Message { 

        hasPinned(): boolean;
        clearPinned(): void;
        getPinned(): Request.Data.Pinned | undefined;
        setPinned(value?: Request.Data.Pinned): Data;

        hasData(): boolean;
        clearData(): void;
        getData(): Request.Data.Data | undefined;
        setData(value?: Request.Data.Data): Data;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Data.AsObject;
        static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Data;
        static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
    }

    export namespace Data {
        export type AsObject = {
            pinned?: Request.Data.Pinned.AsObject,
            data?: Request.Data.Data.AsObject,
        }


        export class Pinned extends jspb.Message { 
            getBucket(): string;
            setBucket(value: string): Pinned;
            getName(): string;
            setName(value: string): Pinned;
            getVersion(): string;
            setVersion(value: string): Pinned;
            getEvent(): string;
            setEvent(value: string): Pinned;

            getCarrierMap(): jspb.Map<string, string>;
            clearCarrierMap(): void;

            hasObservability(): boolean;
            clearObservability(): void;
            getObservability(): Observability | undefined;
            setObservability(value?: Observability): Pinned;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Pinned.AsObject;
            static toObject(includeInstance: boolean, msg: Pinned): Pinned.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Pinned, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Pinned;
            static deserializeBinaryFromReader(message: Pinned, reader: jspb.BinaryReader): Pinned;
        }

        export namespace Pinned {
            export type AsObject = {
                bucket: string,
                name: string,
                version: string,
                event: string,

                carrierMap: Array<[string, string]>,
                observability?: Observability.AsObject,
            }
        }

        export class Data extends jspb.Message { 

            hasProps(): boolean;
            clearProps(): void;
            getProps(): Request.Data.Data.Props | undefined;
            setProps(value?: Request.Data.Data.Props): Data;

            hasDConfig(): boolean;
            clearDConfig(): void;
            getDConfig(): google_protobuf_struct_pb.Struct | undefined;
            setDConfig(value?: google_protobuf_struct_pb.Struct): Data;

            hasAConfig(): boolean;
            clearAConfig(): void;
            getAConfig(): google_protobuf_struct_pb.Struct | undefined;
            setAConfig(value?: google_protobuf_struct_pb.Struct): Data;

            hasQuotas(): boolean;
            clearQuotas(): void;
            getQuotas(): Request.Data.Data.Quota | undefined;
            setQuotas(value?: Request.Data.Data.Quota): Data;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Data.AsObject;
            static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Data;
            static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
        }

        export namespace Data {
            export type AsObject = {
                props?: Request.Data.Data.Props.AsObject,
                dConfig?: google_protobuf_struct_pb.Struct.AsObject,
                aConfig?: google_protobuf_struct_pb.Struct.AsObject,
                quotas?: Request.Data.Data.Quota.AsObject,
            }


            export class Props extends jspb.Message { 

                hasActionConfiguration(): boolean;
                clearActionConfiguration(): void;
                getActionConfiguration(): google_protobuf_struct_pb.Struct | undefined;
                setActionConfiguration(value?: google_protobuf_struct_pb.Struct): Props;

                hasDatasourceConfiguration(): boolean;
                clearDatasourceConfiguration(): void;
                getDatasourceConfiguration(): google_protobuf_struct_pb.Struct | undefined;
                setDatasourceConfiguration(value?: google_protobuf_struct_pb.Struct): Props;

                hasRedactedDatasourceConfiguration(): boolean;
                clearRedactedDatasourceConfiguration(): void;
                getRedactedDatasourceConfiguration(): google_protobuf_struct_pb.Struct | undefined;
                setRedactedDatasourceConfiguration(value?: google_protobuf_struct_pb.Struct): Props;
                getExecutionId(): string;
                setExecutionId(value: string): Props;
                getStepName(): string;
                setStepName(value: string): Props;
                getEnvironment(): string;
                setEnvironment(value: string): Props;
                clearBindingKeysList(): void;
                getBindingKeysList(): Array<Request.Data.Data.Props.Binding>;
                setBindingKeysList(value: Array<Request.Data.Data.Props.Binding>): Props;
                addBindingKeys(value?: Request.Data.Data.Props.Binding, index?: number): Request.Data.Data.Props.Binding;

                getVariablesMap(): jspb.Map<string, Variable>;
                clearVariablesMap(): void;
                getFileserverurl(): string;
                setFileserverurl(value: string): Props;
                clearFilesList(): void;
                getFilesList(): Array<Request.Data.Data.Props.File>;
                setFilesList(value: Array<Request.Data.Data.Props.File>): Props;
                addFiles(value?: Request.Data.Data.Props.File, index?: number): Request.Data.Data.Props.File;
                getRender(): boolean;
                setRender(value: boolean): Props;
                getVersion(): string;
                setVersion(value: string): Props;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): Props.AsObject;
                static toObject(includeInstance: boolean, msg: Props): Props.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: Props, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): Props;
                static deserializeBinaryFromReader(message: Props, reader: jspb.BinaryReader): Props;
            }

            export namespace Props {
                export type AsObject = {
                    actionConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
                    datasourceConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
                    redactedDatasourceConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
                    executionId: string,
                    stepName: string,
                    environment: string,
                    bindingKeysList: Array<Request.Data.Data.Props.Binding.AsObject>,

                    variablesMap: Array<[string, Variable.AsObject]>,
                    fileserverurl: string,
                    filesList: Array<Request.Data.Data.Props.File.AsObject>,
                    render: boolean,
                    version: string,
                }


                export class Binding extends jspb.Message { 
                    getKey(): string;
                    setKey(value: string): Binding;
                    getType(): string;
                    setType(value: string): Binding;

                    serializeBinary(): Uint8Array;
                    toObject(includeInstance?: boolean): Binding.AsObject;
                    static toObject(includeInstance: boolean, msg: Binding): Binding.AsObject;
                    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                    static serializeBinaryToWriter(message: Binding, writer: jspb.BinaryWriter): void;
                    static deserializeBinary(bytes: Uint8Array): Binding;
                    static deserializeBinaryFromReader(message: Binding, reader: jspb.BinaryReader): Binding;
                }

                export namespace Binding {
                    export type AsObject = {
                        key: string,
                        type: string,
                    }
                }

                export class File extends jspb.Message { 
                    getFieldname(): string;
                    setFieldname(value: string): File;
                    getOriginalname(): string;
                    setOriginalname(value: string): File;
                    getEncoding(): string;
                    setEncoding(value: string): File;
                    getMimetype(): string;
                    setMimetype(value: string): File;
                    getSize(): number;
                    setSize(value: number): File;
                    getDestination(): string;
                    setDestination(value: string): File;
                    getFilename(): string;
                    setFilename(value: string): File;
                    getPath(): string;
                    setPath(value: string): File;
                    getBuffer(): Uint8Array | string;
                    getBuffer_asU8(): Uint8Array;
                    getBuffer_asB64(): string;
                    setBuffer(value: Uint8Array | string): File;

                    serializeBinary(): Uint8Array;
                    toObject(includeInstance?: boolean): File.AsObject;
                    static toObject(includeInstance: boolean, msg: File): File.AsObject;
                    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                    static serializeBinaryToWriter(message: File, writer: jspb.BinaryWriter): void;
                    static deserializeBinary(bytes: Uint8Array): File;
                    static deserializeBinaryFromReader(message: File, reader: jspb.BinaryReader): File;
                }

                export namespace File {
                    export type AsObject = {
                        fieldname: string,
                        originalname: string,
                        encoding: string,
                        mimetype: string,
                        size: number,
                        destination: string,
                        filename: string,
                        path: string,
                        buffer: Uint8Array | string,
                    }
                }

            }

            export class Quota extends jspb.Message { 
                getSize(): number;
                setSize(value: number): Quota;
                getDuration(): number;
                setDuration(value: number): Quota;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): Quota.AsObject;
                static toObject(includeInstance: boolean, msg: Quota): Quota.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: Quota, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): Quota;
                static deserializeBinaryFromReader(message: Quota, reader: jspb.BinaryReader): Quota;
            }

            export namespace Quota {
                export type AsObject = {
                    size: number,
                    duration: number,
                }
            }

        }

    }

}

export class Response extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): Response.Data | undefined;
    setData(value?: Response.Data): Response;

    hasPinned(): boolean;
    clearPinned(): void;
    getPinned(): common_v1_errors_pb.Error | undefined;
    setPinned(value?: common_v1_errors_pb.Error): Response;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Response.AsObject;
    static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Response, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Response;
    static deserializeBinaryFromReader(message: Response, reader: jspb.BinaryReader): Response;
}

export namespace Response {
    export type AsObject = {
        data?: Response.Data.AsObject,
        pinned?: common_v1_errors_pb.Error.AsObject,
    }


    export class Data extends jspb.Message { 

        hasPinned(): boolean;
        clearPinned(): void;
        getPinned(): Performance | undefined;
        setPinned(value?: Performance): Data;

        hasData(): boolean;
        clearData(): void;
        getData(): Response.Data.Data | undefined;
        setData(value?: Response.Data.Data): Data;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Data.AsObject;
        static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Data;
        static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
    }

    export namespace Data {
        export type AsObject = {
            pinned?: Performance.AsObject,
            data?: Response.Data.Data.AsObject,
        }


        export class Data extends jspb.Message { 
            getKey(): string;
            setKey(value: string): Data;

            hasErr(): boolean;
            clearErr(): void;
            getErr(): common_v1_errors_pb.Error | undefined;
            setErr(value?: common_v1_errors_pb.Error): Data;

            hasDbSchema(): boolean;
            clearDbSchema(): void;
            getDbSchema(): api_v1_service_pb.MetadataResponse.DatabaseSchemaMetadata | undefined;
            setDbSchema(value?: api_v1_service_pb.MetadataResponse.DatabaseSchemaMetadata): Data;
            clearBucketsList(): void;
            getBucketsList(): Array<api_v1_service_pb.MetadataResponse.BucketMetadata>;
            setBucketsList(value: Array<api_v1_service_pb.MetadataResponse.BucketMetadata>): Data;
            addBuckets(value?: api_v1_service_pb.MetadataResponse.BucketMetadata, index?: number): api_v1_service_pb.MetadataResponse.BucketMetadata;

            hasKafka(): boolean;
            clearKafka(): void;
            getKafka(): plugins_kafka_v1_plugin_pb.Metadata | undefined;
            setKafka(value?: plugins_kafka_v1_plugin_pb.Metadata): Data;

            hasCosmosdb(): boolean;
            clearCosmosdb(): void;
            getCosmosdb(): plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata | undefined;
            setCosmosdb(value?: plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata): Data;

            hasAdls(): boolean;
            clearAdls(): void;
            getAdls(): plugins_adls_v1_plugin_pb.Plugin.Metadata | undefined;
            setAdls(value?: plugins_adls_v1_plugin_pb.Plugin.Metadata): Data;

            hasDynamodb(): boolean;
            clearDynamodb(): void;
            getDynamodb(): google_protobuf_any_pb.Any | undefined;
            setDynamodb(value?: google_protobuf_any_pb.Any): Data;

            hasGSheetsNextPageToken(): boolean;
            clearGSheetsNextPageToken(): void;
            getGSheetsNextPageToken(): string | undefined;
            setGSheetsNextPageToken(value: string): Data;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Data.AsObject;
            static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Data;
            static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
        }

        export namespace Data {
            export type AsObject = {
                key: string,
                err?: common_v1_errors_pb.Error.AsObject,
                dbSchema?: api_v1_service_pb.MetadataResponse.DatabaseSchemaMetadata.AsObject,
                bucketsList: Array<api_v1_service_pb.MetadataResponse.BucketMetadata.AsObject>,
                kafka?: plugins_kafka_v1_plugin_pb.Metadata.AsObject,
                cosmosdb?: plugins_cosmosdb_v1_plugin_pb.Plugin.Metadata.AsObject,
                adls?: plugins_adls_v1_plugin_pb.Plugin.Metadata.AsObject,
                dynamodb?: google_protobuf_any_pb.Any.AsObject,
                gSheetsNextPageToken?: string,
            }
        }

    }

}

export class Fetch extends jspb.Message { 

    hasApi(): boolean;
    clearApi(): void;
    getApi(): api_v1_api_pb.Api | undefined;
    setApi(value?: api_v1_api_pb.Api): Fetch;

    getIntegrationsMap(): jspb.Map<string, google_protobuf_struct_pb.Struct>;
    clearIntegrationsMap(): void;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): Fetch.Metadata | undefined;
    setMetadata(value?: Fetch.Metadata): Fetch;

    hasStores(): boolean;
    clearStores(): void;
    getStores(): store_v1_store_pb.Stores | undefined;
    setStores(value?: store_v1_store_pb.Stores): Fetch;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fetch.AsObject;
    static toObject(includeInstance: boolean, msg: Fetch): Fetch.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fetch, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fetch;
    static deserializeBinaryFromReader(message: Fetch, reader: jspb.BinaryReader): Fetch;
}

export namespace Fetch {
    export type AsObject = {
        api?: api_v1_api_pb.Api.AsObject,

        integrationsMap: Array<[string, google_protobuf_struct_pb.Struct.AsObject]>,
        metadata?: Fetch.Metadata.AsObject,
        stores?: store_v1_store_pb.Stores.AsObject,
    }


    export class Metadata extends jspb.Message { 
        getRequester(): string;
        setRequester(value: string): Metadata;
        getProfile(): string;
        setProfile(value: string): Metadata;
        getOrganizationPlan(): string;
        setOrganizationPlan(value: string): Metadata;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Metadata.AsObject;
        static toObject(includeInstance: boolean, msg: Metadata): Metadata.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Metadata, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Metadata;
        static deserializeBinaryFromReader(message: Metadata, reader: jspb.BinaryReader): Metadata;
    }

    export namespace Metadata {
        export type AsObject = {
            requester: string,
            profile: string,
            organizationPlan: string,
        }
    }

}

export class FetchScheduleJobResp extends jspb.Message { 
    clearApisList(): void;
    getApisList(): Array<api_v1_service_pb.Definition>;
    setApisList(value: Array<api_v1_service_pb.Definition>): FetchScheduleJobResp;
    addApis(value?: api_v1_service_pb.Definition, index?: number): api_v1_service_pb.Definition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchScheduleJobResp.AsObject;
    static toObject(includeInstance: boolean, msg: FetchScheduleJobResp): FetchScheduleJobResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchScheduleJobResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchScheduleJobResp;
    static deserializeBinaryFromReader(message: FetchScheduleJobResp, reader: jspb.BinaryReader): FetchScheduleJobResp;
}

export namespace FetchScheduleJobResp {
    export type AsObject = {
        apisList: Array<api_v1_service_pb.Definition.AsObject>,
    }
}
