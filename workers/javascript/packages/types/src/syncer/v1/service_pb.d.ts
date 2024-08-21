import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
import { Error } from "../../common/v1/errors_pb";
import { Metadata } from "./syncer_pb";
/**
 * @generated from message syncer.v1.GetConfigurationMetadataRequest
 */
export declare class GetConfigurationMetadataRequest extends Message<GetConfigurationMetadataRequest> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    constructor(data?: PartialMessage<GetConfigurationMetadataRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.GetConfigurationMetadataRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetConfigurationMetadataRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetConfigurationMetadataRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetConfigurationMetadataRequest;
    static equals(a: GetConfigurationMetadataRequest | PlainMessage<GetConfigurationMetadataRequest> | undefined, b: GetConfigurationMetadataRequest | PlainMessage<GetConfigurationMetadataRequest> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.GetConfigurationMetadataResponse
 */
export declare class GetConfigurationMetadataResponse extends Message<GetConfigurationMetadataResponse> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    /**
     * @generated from field: map<string, google.protobuf.Struct> configurations = 2;
     */
    configurations: {
        [key: string]: Struct;
    };
    /**
     * @generated from field: string integration_type = 3;
     */
    integrationType: string;
    /**
     * @generated from field: string organization_id = 4;
     */
    organizationId: string;
    /**
     * @generated from field: repeated common.v1.Error errors = 5;
     */
    errors: Error[];
    constructor(data?: PartialMessage<GetConfigurationMetadataResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.GetConfigurationMetadataResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetConfigurationMetadataResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetConfigurationMetadataResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetConfigurationMetadataResponse;
    static equals(a: GetConfigurationMetadataResponse | PlainMessage<GetConfigurationMetadataResponse> | undefined, b: GetConfigurationMetadataResponse | PlainMessage<GetConfigurationMetadataResponse> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.SyncRequest
 */
export declare class SyncRequest extends Message<SyncRequest> {
    /**
     * @generated from field: repeated string integration_ids = 1;
     */
    integrationIds: string[];
    constructor(data?: PartialMessage<SyncRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.SyncRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncRequest;
    static equals(a: SyncRequest | PlainMessage<SyncRequest> | undefined, b: SyncRequest | PlainMessage<SyncRequest> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.SyncResponse
 */
export declare class SyncResponse extends Message<SyncResponse> {
    /**
     * @generated from field: map<string, syncer.v1.SyncResponse.Integration> integrations_synced = 1;
     */
    integrationsSynced: {
        [key: string]: SyncResponse_Integration;
    };
    /**
     * @generated from field: repeated common.v1.Error errors = 2;
     */
    errors: Error[];
    constructor(data?: PartialMessage<SyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.SyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncResponse;
    static equals(a: SyncResponse | PlainMessage<SyncResponse> | undefined, b: SyncResponse | PlainMessage<SyncResponse> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.SyncResponse.Integration
 */
export declare class SyncResponse_Integration extends Message<SyncResponse_Integration> {
    /**
     * @generated from field: repeated string configurationIds = 1;
     */
    configurationIds: string[];
    constructor(data?: PartialMessage<SyncResponse_Integration>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.SyncResponse.Integration";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncResponse_Integration;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncResponse_Integration;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncResponse_Integration;
    static equals(a: SyncResponse_Integration | PlainMessage<SyncResponse_Integration> | undefined, b: SyncResponse_Integration | PlainMessage<SyncResponse_Integration> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.UpsertMetadataRequest
 */
export declare class UpsertMetadataRequest extends Message<UpsertMetadataRequest> {
    /**
     * @generated from field: repeated syncer.v1.Metadata metadata = 1;
     */
    metadata: Metadata[];
    constructor(data?: PartialMessage<UpsertMetadataRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.UpsertMetadataRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpsertMetadataRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpsertMetadataRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpsertMetadataRequest;
    static equals(a: UpsertMetadataRequest | PlainMessage<UpsertMetadataRequest> | undefined, b: UpsertMetadataRequest | PlainMessage<UpsertMetadataRequest> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.UpsertMetadataResponse
 */
export declare class UpsertMetadataResponse extends Message<UpsertMetadataResponse> {
    /**
     * @generated from field: repeated common.v1.Error errors = 1;
     */
    errors: Error[];
    constructor(data?: PartialMessage<UpsertMetadataResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.UpsertMetadataResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpsertMetadataResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpsertMetadataResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpsertMetadataResponse;
    static equals(a: UpsertMetadataResponse | PlainMessage<UpsertMetadataResponse> | undefined, b: UpsertMetadataResponse | PlainMessage<UpsertMetadataResponse> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.DeleteMetadataRequest
 */
export declare class DeleteMetadataRequest extends Message<DeleteMetadataRequest> {
    /**
     * @generated from field: string integration_id = 1;
     */
    integrationId: string;
    /**
     * @generated from field: repeated string configuration_ids = 2;
     */
    configurationIds: string[];
    constructor(data?: PartialMessage<DeleteMetadataRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.DeleteMetadataRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteMetadataRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteMetadataRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteMetadataRequest;
    static equals(a: DeleteMetadataRequest | PlainMessage<DeleteMetadataRequest> | undefined, b: DeleteMetadataRequest | PlainMessage<DeleteMetadataRequest> | undefined): boolean;
}
/**
 * @generated from message syncer.v1.DeleteMetadataResponse
 */
export declare class DeleteMetadataResponse extends Message<DeleteMetadataResponse> {
    /**
     * @generated from field: repeated common.v1.Error errors = 1;
     */
    errors: Error[];
    constructor(data?: PartialMessage<DeleteMetadataResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.DeleteMetadataResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteMetadataResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteMetadataResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteMetadataResponse;
    static equals(a: DeleteMetadataResponse | PlainMessage<DeleteMetadataResponse> | undefined, b: DeleteMetadataResponse | PlainMessage<DeleteMetadataResponse> | undefined): boolean;
}
