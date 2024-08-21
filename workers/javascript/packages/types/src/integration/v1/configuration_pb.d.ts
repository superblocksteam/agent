import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
import { Profile } from "../../api/v1/service_pb";
import { Error } from "../../common/v1/errors_pb";
/**
 * @generated from message integration.v1.GetConfigurationsRequest
 */
export declare class GetConfigurationsRequest extends Message<GetConfigurationsRequest> {
    /**
     * @generated from field: api.v1.Profile profile = 1;
     */
    profile?: Profile;
    /**
     * @generated from field: repeated string integration_ids = 2;
     */
    integrationIds: string[];
    constructor(data?: PartialMessage<GetConfigurationsRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.GetConfigurationsRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetConfigurationsRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetConfigurationsRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetConfigurationsRequest;
    static equals(a: GetConfigurationsRequest | PlainMessage<GetConfigurationsRequest> | undefined, b: GetConfigurationsRequest | PlainMessage<GetConfigurationsRequest> | undefined): boolean;
}
/**
 * @generated from message integration.v1.GetConfigurationsResponse
 */
export declare class GetConfigurationsResponse extends Message<GetConfigurationsResponse> {
    /**
     * @generated from field: map<string, google.protobuf.Struct> configurations = 1;
     */
    configurations: {
        [key: string]: Struct;
    };
    /**
     * @generated from field: common.v1.Error error = 2;
     */
    error?: Error;
    constructor(data?: PartialMessage<GetConfigurationsResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "integration.v1.GetConfigurationsResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetConfigurationsResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetConfigurationsResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetConfigurationsResponse;
    static equals(a: GetConfigurationsResponse | PlainMessage<GetConfigurationsResponse> | undefined, b: GetConfigurationsResponse | PlainMessage<GetConfigurationsResponse> | undefined): boolean;
}
