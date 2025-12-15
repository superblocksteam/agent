// package: kafka.v1
// file: kafka/v1/kafka.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class IntegrationMetadataEvent extends jspb.Message { 

    hasUpsert(): boolean;
    clearUpsert(): void;
    getUpsert(): IntegrationMetadataEvent.Upsert | undefined;
    setUpsert(value?: IntegrationMetadataEvent.Upsert): IntegrationMetadataEvent;

    getEventCase(): IntegrationMetadataEvent.EventCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IntegrationMetadataEvent.AsObject;
    static toObject(includeInstance: boolean, msg: IntegrationMetadataEvent): IntegrationMetadataEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IntegrationMetadataEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IntegrationMetadataEvent;
    static deserializeBinaryFromReader(message: IntegrationMetadataEvent, reader: jspb.BinaryReader): IntegrationMetadataEvent;
}

export namespace IntegrationMetadataEvent {
    export type AsObject = {
        upsert?: IntegrationMetadataEvent.Upsert.AsObject,
    }


    export class Upsert extends jspb.Message { 

        hasDatasourceConfiguration(): boolean;
        clearDatasourceConfiguration(): void;
        getDatasourceConfiguration(): google_protobuf_struct_pb.Struct | undefined;
        setDatasourceConfiguration(value?: google_protobuf_struct_pb.Struct): Upsert;
        getIntegrationId(): string;
        setIntegrationId(value: string): Upsert;
        getConfigurationId(): string;
        setConfigurationId(value: string): Upsert;
        getIntegrationType(): string;
        setIntegrationType(value: string): Upsert;
        getOrganizationId(): string;
        setOrganizationId(value: string): Upsert;
        getSchemaVersion(): string;
        setSchemaVersion(value: string): Upsert;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Upsert.AsObject;
        static toObject(includeInstance: boolean, msg: Upsert): Upsert.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Upsert, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Upsert;
        static deserializeBinaryFromReader(message: Upsert, reader: jspb.BinaryReader): Upsert;
    }

    export namespace Upsert {
        export type AsObject = {
            datasourceConfiguration?: google_protobuf_struct_pb.Struct.AsObject,
            integrationId: string,
            configurationId: string,
            integrationType: string,
            organizationId: string,
            schemaVersion: string,
        }
    }


    export enum EventCase {
        EVENT_NOT_SET = 0,
        UPSERT = 1,
    }

}
