import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp } from "@bufbuild/protobuf";
import { Metadata as Metadata$1 } from "../../ai/v1/metadata_pb";
/**
 * @generated from message syncer.v1.Metadata
 */
export declare class Metadata extends Message<Metadata> {
    /**
     * @generated from field: string configuration_id = 1;
     */
    configurationId: string;
    /**
     * @generated from field: string integration_id = 2;
     */
    integrationId: string;
    /**
     * @generated from field: ai.v1.Metadata raw_metadata = 3;
     */
    rawMetadata?: Metadata$1;
    /**
     * @generated from field: google.protobuf.Timestamp updated_datetime_utc = 4;
     */
    updatedDatetimeUtc?: Timestamp;
    /**
     * @generated from field: string integration_type = 5;
     */
    integrationType: string;
    /**
     * @generated from field: string organization_id = 6;
     */
    organizationId: string;
    constructor(data?: PartialMessage<Metadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "syncer.v1.Metadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata;
    static equals(a: Metadata | PlainMessage<Metadata> | undefined, b: Metadata | PlainMessage<Metadata> | undefined): boolean;
}
