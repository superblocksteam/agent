import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp } from "@bufbuild/protobuf";
import { UserType } from "../../common/v1/common_pb";
/**
 * @generated from message agent.v1.RegistrationRequest
 */
export declare class RegistrationRequest extends Message<RegistrationRequest> {
    /**
     * @generated from field: map<string, agent.v1.VersionList> plugin_versions = 1;
     */
    pluginVersions: {
        [key: string]: VersionList;
    };
    /**
     * @generated from field: int32 type = 2;
     */
    type: number;
    /**
     * @generated from field: map<string, agent.v1.TagList> tags = 3;
     */
    tags: {
        [key: string]: TagList;
    };
    /**
     * @generated from field: string signing_key_id = 4;
     */
    signingKeyId: string;
    /**
     * @generated from field: repeated string verification_key_ids = 5;
     */
    verificationKeyIds: string[];
    constructor(data?: PartialMessage<RegistrationRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.RegistrationRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegistrationRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegistrationRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegistrationRequest;
    static equals(a: RegistrationRequest | PlainMessage<RegistrationRequest> | undefined, b: RegistrationRequest | PlainMessage<RegistrationRequest> | undefined): boolean;
}
/**
 * @generated from message agent.v1.RegistrationResponse
 */
export declare class RegistrationResponse extends Message<RegistrationResponse> {
    /**
     * @generated from field: agent.v1.RegistrationResponse.ResponseMeta response_meta = 1;
     */
    responseMeta?: RegistrationResponse_ResponseMeta;
    /**
     * @generated from field: agent.v1.RegistrationResponse.ResponseBody data = 2;
     */
    data?: RegistrationResponse_ResponseBody;
    constructor(data?: PartialMessage<RegistrationResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.RegistrationResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegistrationResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegistrationResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegistrationResponse;
    static equals(a: RegistrationResponse | PlainMessage<RegistrationResponse> | undefined, b: RegistrationResponse | PlainMessage<RegistrationResponse> | undefined): boolean;
}
/**
 * @generated from message agent.v1.RegistrationResponse.ResponseMeta
 */
export declare class RegistrationResponse_ResponseMeta extends Message<RegistrationResponse_ResponseMeta> {
    /**
     * @generated from field: int32 status = 1;
     */
    status: number;
    /**
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * @generated from field: bool success = 3;
     */
    success: boolean;
    constructor(data?: PartialMessage<RegistrationResponse_ResponseMeta>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.RegistrationResponse.ResponseMeta";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegistrationResponse_ResponseMeta;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseMeta;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseMeta;
    static equals(a: RegistrationResponse_ResponseMeta | PlainMessage<RegistrationResponse_ResponseMeta> | undefined, b: RegistrationResponse_ResponseMeta | PlainMessage<RegistrationResponse_ResponseMeta> | undefined): boolean;
}
/**
 * @generated from message agent.v1.RegistrationResponse.ResponseBody
 */
export declare class RegistrationResponse_ResponseBody extends Message<RegistrationResponse_ResponseBody> {
    /**
     * @generated from field: agent.v1.RegistrationResponse.ResponseBody.Agent agent = 1;
     */
    agent?: RegistrationResponse_ResponseBody_Agent;
    /**
     * @generated from field: string billing_plan = 2;
     */
    billingPlan: string;
    /**
     * @generated from field: string organization_id = 3;
     */
    organizationId: string;
    /**
     * @generated from field: string organization_name = 4;
     */
    organizationName: string;
    constructor(data?: PartialMessage<RegistrationResponse_ResponseBody>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.RegistrationResponse.ResponseBody";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegistrationResponse_ResponseBody;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseBody;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseBody;
    static equals(a: RegistrationResponse_ResponseBody | PlainMessage<RegistrationResponse_ResponseBody> | undefined, b: RegistrationResponse_ResponseBody | PlainMessage<RegistrationResponse_ResponseBody> | undefined): boolean;
}
/**
 * @generated from message agent.v1.RegistrationResponse.ResponseBody.Agent
 */
export declare class RegistrationResponse_ResponseBody_Agent extends Message<RegistrationResponse_ResponseBody_Agent> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string environment = 3;
     */
    environment: string;
    /**
     * @generated from field: string status = 4;
     */
    status: string;
    /**
     * @generated from field: string version = 5;
     */
    version: string;
    /**
     * @generated from field: string version_external = 6;
     */
    versionExternal: string;
    /**
     * @generated from field: map<string, agent.v1.VersionList> supported_plugin_versions = 7;
     */
    supportedPluginVersions: {
        [key: string]: VersionList;
    };
    /**
     * @generated from field: string url = 8;
     */
    url: string;
    /**
     * @generated from field: int32 type = 9;
     */
    type: number;
    /**
     * @generated from field: google.protobuf.Timestamp updated = 10;
     */
    updated?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp created = 11;
     */
    created?: Timestamp;
    /**
     * @generated from field: map<string, agent.v1.TagList> tags = 12;
     */
    tags: {
        [key: string]: TagList;
    };
    constructor(data?: PartialMessage<RegistrationResponse_ResponseBody_Agent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.RegistrationResponse.ResponseBody.Agent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegistrationResponse_ResponseBody_Agent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseBody_Agent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegistrationResponse_ResponseBody_Agent;
    static equals(a: RegistrationResponse_ResponseBody_Agent | PlainMessage<RegistrationResponse_ResponseBody_Agent> | undefined, b: RegistrationResponse_ResponseBody_Agent | PlainMessage<RegistrationResponse_ResponseBody_Agent> | undefined): boolean;
}
/**
 * @generated from message agent.v1.VersionList
 */
export declare class VersionList extends Message<VersionList> {
    /**
     * @generated from field: repeated string versions = 1;
     */
    versions: string[];
    constructor(data?: PartialMessage<VersionList>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.VersionList";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): VersionList;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): VersionList;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): VersionList;
    static equals(a: VersionList | PlainMessage<VersionList> | undefined, b: VersionList | PlainMessage<VersionList> | undefined): boolean;
}
/**
 * @generated from message agent.v1.TagList
 */
export declare class TagList extends Message<TagList> {
    /**
     * @generated from field: repeated string tags = 1;
     */
    tags: string[];
    constructor(data?: PartialMessage<TagList>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.TagList";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): TagList;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): TagList;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): TagList;
    static equals(a: TagList | PlainMessage<TagList> | undefined, b: TagList | PlainMessage<TagList> | undefined): boolean;
}
/**
 * @generated from message agent.v1.AuditLogRequest
 */
export declare class AuditLogRequest extends Message<AuditLogRequest> {
    /**
     * @generated from field: repeated agent.v1.AuditLogRequest.AuditLog audit_logs = 1;
     */
    auditLogs: AuditLogRequest_AuditLog[];
    constructor(data?: PartialMessage<AuditLogRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.AuditLogRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AuditLogRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AuditLogRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AuditLogRequest;
    static equals(a: AuditLogRequest | PlainMessage<AuditLogRequest> | undefined, b: AuditLogRequest | PlainMessage<AuditLogRequest> | undefined): boolean;
}
/**
 * @generated from message agent.v1.AuditLogRequest.AuditLog
 */
export declare class AuditLogRequest_AuditLog extends Message<AuditLogRequest_AuditLog> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string entity_id = 2;
     */
    entityId: string;
    /**
     * @generated from field: agent.v1.AuditLogRequest.AuditLog.AuditLogEntityType entity_type = 3;
     */
    entityType: AuditLogRequest_AuditLog_AuditLogEntityType;
    /**
     * @generated from field: string organization_id = 4;
     */
    organizationId: string;
    /**
     * @generated from field: bool is_deployed = 5;
     */
    isDeployed: boolean;
    /**
     * @generated from field: string source = 6;
     */
    source: string;
    /**
     * @generated from field: string target = 7;
     */
    target: string;
    /**
     * @generated from field: agent.v1.AuditLogRequest.AuditLog.AuditLogEventType type = 8;
     */
    type: AuditLogRequest_AuditLog_AuditLogEventType;
    /**
     * @generated from field: optional string agent_id = 9;
     */
    agentId?: string;
    /**
     * @generated from field: optional agent.v1.AuditLogRequest.AuditLog.ApiRunStatus status = 10;
     */
    status?: AuditLogRequest_AuditLog_ApiRunStatus;
    /**
     * @generated from field: optional string error = 11;
     */
    error?: string;
    /**
     * @generated from field: optional agent.v1.AuditLogRequest.AuditLog.ApiLocationContext api_location_context = 12;
     */
    apiLocationContext?: AuditLogRequest_AuditLog_ApiLocationContext;
    /**
     * @generated from field: agent.v1.AuditLogRequest.AuditLog.ApiTiming api_timing = 13;
     */
    apiTiming?: AuditLogRequest_AuditLog_ApiTiming;
    /**
     * @generated from field: optional common.v1.UserType user_type = 14;
     */
    userType?: UserType;
    /**
     * @generated from field: optional string targetName = 15;
     */
    targetName?: string;
    constructor(data?: PartialMessage<AuditLogRequest_AuditLog>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.AuditLogRequest.AuditLog";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AuditLogRequest_AuditLog;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog;
    static equals(a: AuditLogRequest_AuditLog | PlainMessage<AuditLogRequest_AuditLog> | undefined, b: AuditLogRequest_AuditLog | PlainMessage<AuditLogRequest_AuditLog> | undefined): boolean;
}
/**
 * @generated from enum agent.v1.AuditLogRequest.AuditLog.ApiRunStatus
 */
export declare enum AuditLogRequest_AuditLog_ApiRunStatus {
    /**
     * @generated from enum value: API_RUN_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: API_RUN_STATUS_SUCCESS = 1;
     */
    SUCCESS = 1,
    /**
     * @generated from enum value: API_RUN_STATUS_FAILED = 2;
     */
    FAILED = 2
}
/**
 * @generated from enum agent.v1.AuditLogRequest.AuditLog.AuditLogEntityType
 */
export declare enum AuditLogRequest_AuditLog_AuditLogEntityType {
    /**
     * @generated from enum value: AUDIT_LOG_ENTITY_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: AUDIT_LOG_ENTITY_TYPE_APPLICATION = 1;
     */
    APPLICATION = 1,
    /**
     * @generated from enum value: AUDIT_LOG_ENTITY_TYPE_WORKFLOW = 2;
     */
    WORKFLOW = 2,
    /**
     * @generated from enum value: AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB = 3;
     */
    SCHEDULED_JOB = 3,
    /**
     * @generated from enum value: AUDIT_LOG_ENTITY_TYPE_STEP = 4;
     */
    STEP = 4
}
/**
 * @generated from enum agent.v1.AuditLogRequest.AuditLog.AuditLogEventType
 */
export declare enum AuditLogRequest_AuditLog_AuditLogEventType {
    /**
     * @generated from enum value: AUDIT_LOG_EVENT_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: AUDIT_LOG_EVENT_TYPE_API_RUN = 1;
     */
    API_RUN = 1
}
/**
 * @generated from message agent.v1.AuditLogRequest.AuditLog.ApiLocationContext
 */
export declare class AuditLogRequest_AuditLog_ApiLocationContext extends Message<AuditLogRequest_AuditLog_ApiLocationContext> {
    /**
     * @generated from field: string application_id = 1;
     */
    applicationId: string;
    constructor(data?: PartialMessage<AuditLogRequest_AuditLog_ApiLocationContext>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.AuditLogRequest.AuditLog.ApiLocationContext";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AuditLogRequest_AuditLog_ApiLocationContext;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog_ApiLocationContext;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog_ApiLocationContext;
    static equals(a: AuditLogRequest_AuditLog_ApiLocationContext | PlainMessage<AuditLogRequest_AuditLog_ApiLocationContext> | undefined, b: AuditLogRequest_AuditLog_ApiLocationContext | PlainMessage<AuditLogRequest_AuditLog_ApiLocationContext> | undefined): boolean;
}
/**
 * @generated from message agent.v1.AuditLogRequest.AuditLog.ApiTiming
 */
export declare class AuditLogRequest_AuditLog_ApiTiming extends Message<AuditLogRequest_AuditLog_ApiTiming> {
    /**
     * @generated from field: int64 start = 1;
     */
    start: bigint;
    /**
     * @generated from field: optional int64 end = 2;
     */
    end?: bigint;
    constructor(data?: PartialMessage<AuditLogRequest_AuditLog_ApiTiming>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "agent.v1.AuditLogRequest.AuditLog.ApiTiming";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AuditLogRequest_AuditLog_ApiTiming;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog_ApiTiming;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AuditLogRequest_AuditLog_ApiTiming;
    static equals(a: AuditLogRequest_AuditLog_ApiTiming | PlainMessage<AuditLogRequest_AuditLog_ApiTiming> | undefined, b: AuditLogRequest_AuditLog_ApiTiming | PlainMessage<AuditLogRequest_AuditLog_ApiTiming> | undefined): boolean;
}
