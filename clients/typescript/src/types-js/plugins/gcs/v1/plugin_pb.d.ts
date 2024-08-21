// package: plugins.gcs.v1
// file: plugins/gcs/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

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

export class Property extends jspb.Message {
  getKey(): string;
  setKey(value: string): Property;
  getValue(): number;
  setValue(value: number): Property;
  getEditable(): boolean;
  setEditable(value: boolean): Property;
  getInternal(): boolean;
  setInternal(value: boolean): Property;
  getDescription(): string;
  setDescription(value: string): Property;
  getMandatory(): boolean;
  setMandatory(value: boolean): Property;
  getType(): string;
  setType(value: string): Property;
  getDefaultvalue(): string;
  setDefaultvalue(value: string): Property;
  getMinrange(): string;
  setMinrange(value: string): Property;
  getMaxrange(): string;
  setMaxrange(value: string): Property;
  clearValueoptionsList(): void;
  getValueoptionsList(): Array<string>;
  setValueoptionsList(value: Array<string>): Property;
  addValueoptions(value: string, index?: number): string;

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
    key: string;
    value: number;
    editable: boolean;
    internal: boolean;
    description: string;
    mandatory: boolean;
    type: string;
    defaultvalue: string;
    minrange: string;
    maxrange: string;
    valueoptionsList: Array<string>;
  };
}

export class Custom extends jspb.Message {
  hasPresignedexpiration(): boolean;
  clearPresignedexpiration(): void;
  getPresignedexpiration(): Property | undefined;
  setPresignedexpiration(value?: Property): Custom;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Custom.AsObject;
  static toObject(includeInstance: boolean, msg: Custom): Custom.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Custom, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Custom;
  static deserializeBinaryFromReader(message: Custom, reader: jspb.BinaryReader): Custom;
}

export namespace Custom {
  export type AsObject = {
    presignedexpiration?: Property.AsObject;
  };
}

export class Plugin extends jspb.Message {
  getResource(): string;
  setResource(value: string): Plugin;
  getResourcetype(): string;
  setResourcetype(value: string): Plugin;
  getAction(): string;
  setAction(value: string): Plugin;
  getPath(): string;
  setPath(value: string): Plugin;
  getPrefix(): string;
  setPrefix(value: string): Plugin;
  getBody(): string;
  setBody(value: string): Plugin;
  getFileobjects(): string;
  setFileobjects(value: string): Plugin;
  getResponsetype(): string;
  setResponsetype(value: string): Plugin;

  hasCustom(): boolean;
  clearCustom(): void;
  getCustom(): Custom | undefined;
  setCustom(value?: Custom): Plugin;

  hasSuperblocksmetadata(): boolean;
  clearSuperblocksmetadata(): void;
  getSuperblocksmetadata(): SuperblocksMetadata | undefined;
  setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

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
    resource: string;
    resourcetype: string;
    action: string;
    path: string;
    prefix: string;
    body: string;
    fileobjects: string;
    responsetype: string;
    custom?: Custom.AsObject;
    superblocksmetadata?: SuperblocksMetadata.AsObject;
  };
}
