// package: common.v1
// file: common/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';

export class Property extends jspb.Message {
  hasKey(): boolean;
  clearKey(): void;
  getKey(): string | undefined;
  setKey(value: string): Property;

  hasValue(): boolean;
  clearValue(): void;
  getValue(): string | undefined;
  setValue(value: string): Property;

  hasEditable(): boolean;
  clearEditable(): void;
  getEditable(): boolean | undefined;
  setEditable(value: boolean): Property;

  hasInternal(): boolean;
  clearInternal(): void;
  getInternal(): boolean | undefined;
  setInternal(value: boolean): Property;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): Property;

  hasMandatory(): boolean;
  clearMandatory(): void;
  getMandatory(): boolean | undefined;
  setMandatory(value: boolean): Property;

  hasType(): boolean;
  clearType(): void;
  getType(): string | undefined;
  setType(value: string): Property;

  hasDefaultvalue(): boolean;
  clearDefaultvalue(): void;
  getDefaultvalue(): string | undefined;
  setDefaultvalue(value: string): Property;

  hasMinrange(): boolean;
  clearMinrange(): void;
  getMinrange(): string | undefined;
  setMinrange(value: string): Property;

  hasMaxrange(): boolean;
  clearMaxrange(): void;
  getMaxrange(): string | undefined;
  setMaxrange(value: string): Property;
  clearValueoptionsList(): void;
  getValueoptionsList(): Array<string>;
  setValueoptionsList(value: Array<string>): Property;
  addValueoptions(value: string, index?: number): string;

  hasSystem(): boolean;
  clearSystem(): void;
  getSystem(): boolean | undefined;
  setSystem(value: boolean): Property;

  hasFile(): boolean;
  clearFile(): void;
  getFile(): FileMetadata | undefined;
  setFile(value?: FileMetadata): Property;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Property.AsObject;
  static toObject(includeInstance: boolean, msg: Property): Property.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Property, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Property;
  static deserializeBinaryFromReader(message: Property, reader: jspb.BinaryReader): Property;
}

export namespace Property {
  export type AsObject = {
    key?: string;
    value?: string;
    editable?: boolean;
    internal?: boolean;
    description?: string;
    mandatory?: boolean;
    type?: string;
    defaultvalue?: string;
    minrange?: string;
    maxrange?: string;
    valueoptionsList: Array<string>;
    system?: boolean;
    file?: FileMetadata.AsObject;
  };
}

export class SuperblocksMetadata extends jspb.Message {
  getPluginversion(): string;
  setPluginversion(value: string): SuperblocksMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SuperblocksMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SuperblocksMetadata): SuperblocksMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: SuperblocksMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SuperblocksMetadata;
  static deserializeBinaryFromReader(message: SuperblocksMetadata, reader: jspb.BinaryReader): SuperblocksMetadata;
}

export namespace SuperblocksMetadata {
  export type AsObject = {
    pluginversion: string;
  };
}

export class HttpParameters extends jspb.Message {
  getQueryMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
  clearQueryMap(): void;

  getBodyMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
  clearBodyMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HttpParameters.AsObject;
  static toObject(includeInstance: boolean, msg: HttpParameters): HttpParameters.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: HttpParameters, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HttpParameters;
  static deserializeBinaryFromReader(message: HttpParameters, reader: jspb.BinaryReader): HttpParameters;
}

export namespace HttpParameters {
  export type AsObject = {
    queryMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>;

    bodyMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>;
  };
}

export class FileMetadata extends jspb.Message {
  getFilename(): string;
  setFilename(value: string): FileMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FileMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: FileMetadata): FileMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: FileMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FileMetadata;
  static deserializeBinaryFromReader(message: FileMetadata, reader: jspb.BinaryReader): FileMetadata;
}

export namespace FileMetadata {
  export type AsObject = {
    filename: string;
  };
}
