// package: agent.v1
// file: agent/v1/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as buf_validate_validate_pb from "../../buf/validate/validate_pb";
import * as common_v1_common_pb from "../../common/v1/common_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "../../protoc-gen-openapiv2/options/annotations_pb";
import * as validate_validate_pb from "../../validate/validate_pb";

export class RegistrationRequest extends jspb.Message { 

    getPluginVersionsMap(): jspb.Map<string, VersionList>;
    clearPluginVersionsMap(): void;
    getType(): number;
    setType(value: number): RegistrationRequest;

    getTagsMap(): jspb.Map<string, TagList>;
    clearTagsMap(): void;
    getSigningKeyId(): string;
    setSigningKeyId(value: string): RegistrationRequest;
    clearVerificationKeyIdsList(): void;
    getVerificationKeyIdsList(): Array<string>;
    setVerificationKeyIdsList(value: Array<string>): RegistrationRequest;
    addVerificationKeyIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegistrationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RegistrationRequest): RegistrationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegistrationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegistrationRequest;
    static deserializeBinaryFromReader(message: RegistrationRequest, reader: jspb.BinaryReader): RegistrationRequest;
}

export namespace RegistrationRequest {
    export type AsObject = {

        pluginVersionsMap: Array<[string, VersionList.AsObject]>,
        type: number,

        tagsMap: Array<[string, TagList.AsObject]>,
        signingKeyId: string,
        verificationKeyIdsList: Array<string>,
    }
}

export class RegistrationResponse extends jspb.Message { 

    hasResponseMeta(): boolean;
    clearResponseMeta(): void;
    getResponseMeta(): RegistrationResponse.ResponseMeta | undefined;
    setResponseMeta(value?: RegistrationResponse.ResponseMeta): RegistrationResponse;

    hasData(): boolean;
    clearData(): void;
    getData(): RegistrationResponse.ResponseBody | undefined;
    setData(value?: RegistrationResponse.ResponseBody): RegistrationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegistrationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RegistrationResponse): RegistrationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegistrationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegistrationResponse;
    static deserializeBinaryFromReader(message: RegistrationResponse, reader: jspb.BinaryReader): RegistrationResponse;
}

export namespace RegistrationResponse {
    export type AsObject = {
        responseMeta?: RegistrationResponse.ResponseMeta.AsObject,
        data?: RegistrationResponse.ResponseBody.AsObject,
    }


    export class ResponseMeta extends jspb.Message { 
        getStatus(): number;
        setStatus(value: number): ResponseMeta;
        getMessage(): string;
        setMessage(value: string): ResponseMeta;
        getSuccess(): boolean;
        setSuccess(value: boolean): ResponseMeta;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ResponseMeta.AsObject;
        static toObject(includeInstance: boolean, msg: ResponseMeta): ResponseMeta.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ResponseMeta, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ResponseMeta;
        static deserializeBinaryFromReader(message: ResponseMeta, reader: jspb.BinaryReader): ResponseMeta;
    }

    export namespace ResponseMeta {
        export type AsObject = {
            status: number,
            message: string,
            success: boolean,
        }
    }

    export class ResponseBody extends jspb.Message { 

        hasAgent(): boolean;
        clearAgent(): void;
        getAgent(): RegistrationResponse.ResponseBody.Agent | undefined;
        setAgent(value?: RegistrationResponse.ResponseBody.Agent): ResponseBody;
        getBillingPlan(): string;
        setBillingPlan(value: string): ResponseBody;
        getOrganizationId(): string;
        setOrganizationId(value: string): ResponseBody;
        getOrganizationName(): string;
        setOrganizationName(value: string): ResponseBody;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ResponseBody.AsObject;
        static toObject(includeInstance: boolean, msg: ResponseBody): ResponseBody.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ResponseBody, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ResponseBody;
        static deserializeBinaryFromReader(message: ResponseBody, reader: jspb.BinaryReader): ResponseBody;
    }

    export namespace ResponseBody {
        export type AsObject = {
            agent?: RegistrationResponse.ResponseBody.Agent.AsObject,
            billingPlan: string,
            organizationId: string,
            organizationName: string,
        }


        export class Agent extends jspb.Message { 
            getId(): string;
            setId(value: string): Agent;
            getKey(): string;
            setKey(value: string): Agent;
            getEnvironment(): string;
            setEnvironment(value: string): Agent;
            getStatus(): string;
            setStatus(value: string): Agent;
            getVersion(): string;
            setVersion(value: string): Agent;
            getVersionExternal(): string;
            setVersionExternal(value: string): Agent;

            getSupportedPluginVersionsMap(): jspb.Map<string, VersionList>;
            clearSupportedPluginVersionsMap(): void;
            getUrl(): string;
            setUrl(value: string): Agent;
            getType(): number;
            setType(value: number): Agent;

            hasUpdated(): boolean;
            clearUpdated(): void;
            getUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
            setUpdated(value?: google_protobuf_timestamp_pb.Timestamp): Agent;

            hasCreated(): boolean;
            clearCreated(): void;
            getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
            setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Agent;

            getTagsMap(): jspb.Map<string, TagList>;
            clearTagsMap(): void;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Agent.AsObject;
            static toObject(includeInstance: boolean, msg: Agent): Agent.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Agent, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Agent;
            static deserializeBinaryFromReader(message: Agent, reader: jspb.BinaryReader): Agent;
        }

        export namespace Agent {
            export type AsObject = {
                id: string,
                key: string,
                environment: string,
                status: string,
                version: string,
                versionExternal: string,

                supportedPluginVersionsMap: Array<[string, VersionList.AsObject]>,
                url: string,
                type: number,
                updated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
                created?: google_protobuf_timestamp_pb.Timestamp.AsObject,

                tagsMap: Array<[string, TagList.AsObject]>,
            }
        }

    }

}

export class VersionList extends jspb.Message { 
    clearVersionsList(): void;
    getVersionsList(): Array<string>;
    setVersionsList(value: Array<string>): VersionList;
    addVersions(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionList.AsObject;
    static toObject(includeInstance: boolean, msg: VersionList): VersionList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionList;
    static deserializeBinaryFromReader(message: VersionList, reader: jspb.BinaryReader): VersionList;
}

export namespace VersionList {
    export type AsObject = {
        versionsList: Array<string>,
    }
}

export class TagList extends jspb.Message { 
    clearTagsList(): void;
    getTagsList(): Array<string>;
    setTagsList(value: Array<string>): TagList;
    addTags(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TagList.AsObject;
    static toObject(includeInstance: boolean, msg: TagList): TagList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TagList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TagList;
    static deserializeBinaryFromReader(message: TagList, reader: jspb.BinaryReader): TagList;
}

export namespace TagList {
    export type AsObject = {
        tagsList: Array<string>,
    }
}

export class AuditLogRequest extends jspb.Message { 
    clearAuditLogsList(): void;
    getAuditLogsList(): Array<AuditLogRequest.AuditLog>;
    setAuditLogsList(value: Array<AuditLogRequest.AuditLog>): AuditLogRequest;
    addAuditLogs(value?: AuditLogRequest.AuditLog, index?: number): AuditLogRequest.AuditLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AuditLogRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AuditLogRequest): AuditLogRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AuditLogRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AuditLogRequest;
    static deserializeBinaryFromReader(message: AuditLogRequest, reader: jspb.BinaryReader): AuditLogRequest;
}

export namespace AuditLogRequest {
    export type AsObject = {
        auditLogsList: Array<AuditLogRequest.AuditLog.AsObject>,
    }


    export class AuditLog extends jspb.Message { 
        getId(): string;
        setId(value: string): AuditLog;
        getEntityId(): string;
        setEntityId(value: string): AuditLog;
        getEntityType(): AuditLogRequest.AuditLog.AuditLogEntityType;
        setEntityType(value: AuditLogRequest.AuditLog.AuditLogEntityType): AuditLog;
        getOrganizationId(): string;
        setOrganizationId(value: string): AuditLog;
        getIsDeployed(): boolean;
        setIsDeployed(value: boolean): AuditLog;
        getSource(): string;
        setSource(value: string): AuditLog;
        getTarget(): string;
        setTarget(value: string): AuditLog;
        getType(): AuditLogRequest.AuditLog.AuditLogEventType;
        setType(value: AuditLogRequest.AuditLog.AuditLogEventType): AuditLog;

        hasAgentId(): boolean;
        clearAgentId(): void;
        getAgentId(): string | undefined;
        setAgentId(value: string): AuditLog;

        hasStatus(): boolean;
        clearStatus(): void;
        getStatus(): AuditLogRequest.AuditLog.ApiRunStatus | undefined;
        setStatus(value: AuditLogRequest.AuditLog.ApiRunStatus): AuditLog;

        hasError(): boolean;
        clearError(): void;
        getError(): string | undefined;
        setError(value: string): AuditLog;

        hasApiLocationContext(): boolean;
        clearApiLocationContext(): void;
        getApiLocationContext(): AuditLogRequest.AuditLog.ApiLocationContext | undefined;
        setApiLocationContext(value?: AuditLogRequest.AuditLog.ApiLocationContext): AuditLog;

        hasApiTiming(): boolean;
        clearApiTiming(): void;
        getApiTiming(): AuditLogRequest.AuditLog.ApiTiming | undefined;
        setApiTiming(value?: AuditLogRequest.AuditLog.ApiTiming): AuditLog;

        hasUserType(): boolean;
        clearUserType(): void;
        getUserType(): common_v1_common_pb.UserType | undefined;
        setUserType(value: common_v1_common_pb.UserType): AuditLog;

        hasTargetname(): boolean;
        clearTargetname(): void;
        getTargetname(): string | undefined;
        setTargetname(value: string): AuditLog;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): AuditLog.AsObject;
        static toObject(includeInstance: boolean, msg: AuditLog): AuditLog.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: AuditLog, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): AuditLog;
        static deserializeBinaryFromReader(message: AuditLog, reader: jspb.BinaryReader): AuditLog;
    }

    export namespace AuditLog {
        export type AsObject = {
            id: string,
            entityId: string,
            entityType: AuditLogRequest.AuditLog.AuditLogEntityType,
            organizationId: string,
            isDeployed: boolean,
            source: string,
            target: string,
            type: AuditLogRequest.AuditLog.AuditLogEventType,
            agentId?: string,
            status?: AuditLogRequest.AuditLog.ApiRunStatus,
            error?: string,
            apiLocationContext?: AuditLogRequest.AuditLog.ApiLocationContext.AsObject,
            apiTiming?: AuditLogRequest.AuditLog.ApiTiming.AsObject,
            userType?: common_v1_common_pb.UserType,
            targetname?: string,
        }


        export class ApiLocationContext extends jspb.Message { 
            getApplicationId(): string;
            setApplicationId(value: string): ApiLocationContext;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): ApiLocationContext.AsObject;
            static toObject(includeInstance: boolean, msg: ApiLocationContext): ApiLocationContext.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: ApiLocationContext, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): ApiLocationContext;
            static deserializeBinaryFromReader(message: ApiLocationContext, reader: jspb.BinaryReader): ApiLocationContext;
        }

        export namespace ApiLocationContext {
            export type AsObject = {
                applicationId: string,
            }
        }

        export class ApiTiming extends jspb.Message { 
            getStart(): number;
            setStart(value: number): ApiTiming;

            hasEnd(): boolean;
            clearEnd(): void;
            getEnd(): number | undefined;
            setEnd(value: number): ApiTiming;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): ApiTiming.AsObject;
            static toObject(includeInstance: boolean, msg: ApiTiming): ApiTiming.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: ApiTiming, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): ApiTiming;
            static deserializeBinaryFromReader(message: ApiTiming, reader: jspb.BinaryReader): ApiTiming;
        }

        export namespace ApiTiming {
            export type AsObject = {
                start: number,
                end?: number,
            }
        }


        export enum ApiRunStatus {
    API_RUN_STATUS_UNSPECIFIED = 0,
    API_RUN_STATUS_SUCCESS = 1,
    API_RUN_STATUS_FAILED = 2,
        }

        export enum AuditLogEntityType {
    AUDIT_LOG_ENTITY_TYPE_UNSPECIFIED = 0,
    AUDIT_LOG_ENTITY_TYPE_APPLICATION = 1,
    AUDIT_LOG_ENTITY_TYPE_WORKFLOW = 2,
    AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB = 3,
    AUDIT_LOG_ENTITY_TYPE_STEP = 4,
        }

        export enum AuditLogEventType {
    AUDIT_LOG_EVENT_TYPE_UNSPECIFIED = 0,
    AUDIT_LOG_EVENT_TYPE_API_RUN = 1,
        }

    }

}
