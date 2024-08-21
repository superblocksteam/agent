import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Struct } from "@bufbuild/protobuf";
/**
 * @generated from message kafka.v1.IntegrationMetadataEvent
 */
export declare class IntegrationMetadataEvent extends Message<IntegrationMetadataEvent> {
    /**
     * @generated from oneof kafka.v1.IntegrationMetadataEvent.event
     */
    event: {
        /**
         * @generated from field: kafka.v1.IntegrationMetadataEvent.Upsert upsert = 1;
         */
        value: IntegrationMetadataEvent_Upsert;
        case: "upsert";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<IntegrationMetadataEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "kafka.v1.IntegrationMetadataEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IntegrationMetadataEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IntegrationMetadataEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IntegrationMetadataEvent;
    static equals(a: IntegrationMetadataEvent | PlainMessage<IntegrationMetadataEvent> | undefined, b: IntegrationMetadataEvent | PlainMessage<IntegrationMetadataEvent> | undefined): boolean;
}
/**
 * @generated from message kafka.v1.IntegrationMetadataEvent.Upsert
 */
export declare class IntegrationMetadataEvent_Upsert extends Message<IntegrationMetadataEvent_Upsert> {
    /**
     * @generated from field: google.protobuf.Struct datasource_configuration = 1;
     */
    datasourceConfiguration?: Struct;
    /**
     * @generated from field: string integration_id = 2;
     */
    integrationId: string;
    /**
     * @generated from field: string configuration_id = 3;
     */
    configurationId: string;
    /**
     * @generated from field: string integration_type = 4;
     */
    integrationType: string;
    /**
     * @generated from field: string organization_id = 5;
     */
    organizationId: string;
    /**
     * @generated from field: string schema_version = 6;
     */
    schemaVersion: string;
    constructor(data?: PartialMessage<IntegrationMetadataEvent_Upsert>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "kafka.v1.IntegrationMetadataEvent.Upsert";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IntegrationMetadataEvent_Upsert;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IntegrationMetadataEvent_Upsert;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IntegrationMetadataEvent_Upsert;
    static equals(a: IntegrationMetadataEvent_Upsert | PlainMessage<IntegrationMetadataEvent_Upsert> | undefined, b: IntegrationMetadataEvent_Upsert | PlainMessage<IntegrationMetadataEvent_Upsert> | undefined): boolean;
}
