import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
import { Profile } from "../../common/v1/common_pb";
/**
 * @generated from enum integration.v1.Kind
 */
export declare enum Kind {
    /**
     * @generated from enum value: KIND_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: KIND_PLUGIN = 1;
     */
    PLUGIN = 1,
    /**
     * @generated from enum value: KIND_SECRET = 2;
     */
    SECRET = 2
}
/**
 * @generated from message integration.v1.GetIntegrationResponse
 */
export declare class GetIntegrationResponse extends Message<GetIntegrationResponse> {
    /**
     * @generated from field: integration.v1.Integration data = 1;
     */
    data?: Integration;
    constructor(data?: PartialMessage<GetIntegrationResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.GetIntegrationResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetIntegrationResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetIntegrationResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetIntegrationResponse;
    static equals(a: GetIntegrationResponse | PlainMessage<GetIntegrationResponse> | undefined, b: GetIntegrationResponse | PlainMessage<GetIntegrationResponse> | undefined): boolean;
}
/**
 * @generated from message integration.v1.GetIntegrationsRequest
 */
export declare class GetIntegrationsRequest extends Message<GetIntegrationsRequest> {
    /**
     * @generated from field: optional common.v1.Profile profile = 1;
     */
    profile?: Profile;
    /**
     * @generated from field: repeated string ids = 2;
     */
    ids: string[];
    /**
     * @generated from field: optional integration.v1.Kind kind = 3;
     */
    kind?: Kind;
    /**
     * @generated from field: optional string slug = 4;
     */
    slug?: string;
    constructor(data?: PartialMessage<GetIntegrationsRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.GetIntegrationsRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetIntegrationsRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetIntegrationsRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetIntegrationsRequest;
    static equals(a: GetIntegrationsRequest | PlainMessage<GetIntegrationsRequest> | undefined, b: GetIntegrationsRequest | PlainMessage<GetIntegrationsRequest> | undefined): boolean;
}
/**
 * @generated from message integration.v1.GetIntegrationsResponse
 */
export declare class GetIntegrationsResponse extends Message<GetIntegrationsResponse> {
    /**
     * @generated from field: repeated integration.v1.Integration data = 1;
     */
    data: Integration[];
    constructor(data?: PartialMessage<GetIntegrationsResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.GetIntegrationsResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetIntegrationsResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetIntegrationsResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetIntegrationsResponse;
    static equals(a: GetIntegrationsResponse | PlainMessage<GetIntegrationsResponse> | undefined, b: GetIntegrationsResponse | PlainMessage<GetIntegrationsResponse> | undefined): boolean;
}
/**
 * @generated from message integration.v1.Configuration
 */
export declare class Configuration extends Message<Configuration> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string created = 2;
     */
    created: string;
    /**
     * @generated from field: string integration_id = 3;
     */
    integrationId: string;
    /**
     * @generated from field: google.protobuf.Struct configuration = 4;
     */
    configuration?: Struct;
    /**
     * @generated from field: bool is_default = 5;
     */
    isDefault: boolean;
    /**
     * @generated from field: repeated string profile_ids = 6;
     */
    profileIds: string[];
    constructor(data?: PartialMessage<Configuration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.Configuration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Configuration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Configuration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Configuration;
    static equals(a: Configuration | PlainMessage<Configuration> | undefined, b: Configuration | PlainMessage<Configuration> | undefined): boolean;
}
/**
 * @generated from message integration.v1.Integration
 */
export declare class Integration extends Message<Integration> {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string created = 2;
     */
    created: string;
    /**
     * @generated from field: string updated = 3;
     */
    updated: string;
    /**
     * @generated from field: string name = 4;
     */
    name: string;
    /**
     * @generated from field: string plugin_id = 5;
     */
    pluginId: string;
    /**
     * @generated from field: string organization_id = 6;
     */
    organizationId: string;
    /**
     * @generated from field: string demo_integration_id = 7;
     */
    demoIntegrationId: string;
    /**
     * @generated from field: repeated integration.v1.Configuration configurations = 8;
     */
    configurations: Configuration[];
    /**
     * @generated from field: bool is_user_configured = 9;
     */
    isUserConfigured: boolean;
    /**
     * @generated from field: string slug = 10;
     */
    slug: string;
    constructor(data?: PartialMessage<Integration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.Integration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Integration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Integration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Integration;
    static equals(a: Integration | PlainMessage<Integration> | undefined, b: Integration | PlainMessage<Integration> | undefined): boolean;
}
