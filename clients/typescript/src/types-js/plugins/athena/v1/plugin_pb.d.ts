// package: plugins.athena.v1
// file: plugins/athena/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as plugins_common_v1_plugin_pb from '../../../plugins/common/v1/plugin_pb';

export class Connection extends jspb.Message {
  hasWorkgroupName(): boolean;
  clearWorkgroupName(): void;
  getWorkgroupName(): string | undefined;
  setWorkgroupName(value: string): Connection;
  getOverrideS3OutputLocation(): boolean;
  setOverrideS3OutputLocation(value: boolean): Connection;

  hasS3OutputLocation(): boolean;
  clearS3OutputLocation(): void;
  getS3OutputLocation(): string | undefined;
  setS3OutputLocation(value: string): Connection;

  hasS3OutputLocationSuffix(): boolean;
  clearS3OutputLocationSuffix(): void;
  getS3OutputLocationSuffix(): Connection.DateFolderType | undefined;
  setS3OutputLocationSuffix(value: Connection.DateFolderType): Connection;
  getDatabaseName(): string;
  setDatabaseName(value: string): Connection;

  hasAwsConfig(): boolean;
  clearAwsConfig(): void;
  getAwsConfig(): plugins_common_v1_plugin_pb.AWSConfig | undefined;
  setAwsConfig(value?: plugins_common_v1_plugin_pb.AWSConfig): Connection;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Connection.AsObject;
  static toObject(includeInstance: boolean, msg: Connection): Connection.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Connection, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Connection;
  static deserializeBinaryFromReader(message: Connection, reader: jspb.BinaryReader): Connection;
}

export namespace Connection {
  export type AsObject = {
    workgroupName?: string;
    overrideS3OutputLocation: boolean;
    s3OutputLocation?: string;
    s3OutputLocationSuffix?: Connection.DateFolderType;
    databaseName: string;
    awsConfig?: plugins_common_v1_plugin_pb.AWSConfig.AsObject;
  };

  export enum DateFolderType {
    DATE_FOLDER_TYPE_UNSPECIFIED = 0,
    DATE_FOLDER_TYPE_YYYY = 1,
    DATE_FOLDER_TYPE_YYYYMM = 2,
    DATE_FOLDER_TYPE_YYYYMMDD = 3
  }
}

export class Plugin extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): Plugin;

  hasConnection(): boolean;
  clearConnection(): void;
  getConnection(): Connection | undefined;
  setConnection(value?: Connection): Plugin;

  hasRunSql(): boolean;
  clearRunSql(): void;
  getRunSql(): plugins_common_v1_plugin_pb.SQLExecution | undefined;
  setRunSql(value?: plugins_common_v1_plugin_pb.SQLExecution): Plugin;

  hasDynamicWorkflowConfiguration(): boolean;
  clearDynamicWorkflowConfiguration(): void;
  getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
  setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Plugin.AsObject;
  static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Plugin;
  static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
  export type AsObject = {
    name?: string;
    connection?: Connection.AsObject;
    runSql?: plugins_common_v1_plugin_pb.SQLExecution.AsObject;
    dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject;
  };
}
