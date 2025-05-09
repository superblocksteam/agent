// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file plugins/gsheets/v1/plugin.proto (package plugins.gsheets.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message plugins.gsheets.v1.SuperblocksMetadata
 */
export class SuperblocksMetadata extends Message<SuperblocksMetadata> {
  /**
   * @generated from field: string pluginVersion = 1;
   */
  pluginVersion = "";

  constructor(data?: PartialMessage<SuperblocksMetadata>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.gsheets.v1.SuperblocksMetadata";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "pluginVersion", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata {
    return new SuperblocksMetadata().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata {
    return new SuperblocksMetadata().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata {
    return new SuperblocksMetadata().fromJsonString(jsonString, options);
  }

  static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean {
    return proto3.util.equals(SuperblocksMetadata, a, b);
  }
}

/**
 * @generated from message plugins.gsheets.v1.Plugin
 */
export class Plugin extends Message<Plugin> {
  /**
   * @generated from field: string spreadsheetId = 1;
   */
  spreadsheetId = "";

  /**
   * @generated from field: optional string sheetTitle = 2;
   */
  sheetTitle?: string;

  /**
   * @generated from field: optional string range = 3;
   */
  range?: string;

  /**
   * Super confusing but these are potentially bindings. Or stringified int
   * If this was not a binding, it would be best to keep it int32 here
   *
   * @generated from field: optional string rowNumber = 4;
   */
  rowNumber?: string;

  /**
   * @generated from field: bool extractFirstRowHeader = 5;
   */
  extractFirstRowHeader = false;

  /**
   * Same as above comment
   *
   * @generated from field: optional string headerRowNumber = 6;
   */
  headerRowNumber?: string;

  /**
   * @generated from field: optional string format = 7;
   */
  format?: string;

  /**
   * @generated from field: optional string data = 8;
   */
  data?: string;

  /**
   * @generated from field: bool preserveHeaderRow = 9;
   */
  preserveHeaderRow = false;

  /**
   * @generated from field: bool includeHeaderRow = 10;
   */
  includeHeaderRow = false;

  /**
   * @generated from field: optional string action = 11;
   */
  action?: string;

  /**
   * @generated from field: optional string writeToDestinationType = 12;
   */
  writeToDestinationType?: string;

  /**
   * @generated from field: optional string body = 13;
   */
  body?: string;

  /**
   * @generated from field: plugins.gsheets.v1.SuperblocksMetadata superblocksMetadata = 14;
   */
  superblocksMetadata?: SuperblocksMetadata;

  /**
   * @generated from field: optional plugins.gsheets.v1.Plugin.AddSheet addSheet = 15;
   */
  addSheet?: Plugin_AddSheet;

  constructor(data?: PartialMessage<Plugin>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.gsheets.v1.Plugin";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "spreadsheetId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "sheetTitle", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 3, name: "range", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 4, name: "rowNumber", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 5, name: "extractFirstRowHeader", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 6, name: "headerRowNumber", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 7, name: "format", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 8, name: "data", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 9, name: "preserveHeaderRow", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 10, name: "includeHeaderRow", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 11, name: "action", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 12, name: "writeToDestinationType", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 13, name: "body", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 14, name: "superblocksMetadata", kind: "message", T: SuperblocksMetadata },
    { no: 15, name: "addSheet", kind: "message", T: Plugin_AddSheet, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin {
    return new Plugin().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin {
    return new Plugin().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin {
    return new Plugin().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean {
    return proto3.util.equals(Plugin, a, b);
  }
}

/**
 * @generated from message plugins.gsheets.v1.Plugin.AddSheet
 */
export class Plugin_AddSheet extends Message<Plugin_AddSheet> {
  /**
   * @generated from field: string sheetTitle = 1;
   */
  sheetTitle = "";

  /**
   * @generated from field: optional string rowCount = 2;
   */
  rowCount?: string;

  /**
   * @generated from field: optional string columnCount = 3;
   */
  columnCount?: string;

  constructor(data?: PartialMessage<Plugin_AddSheet>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "plugins.gsheets.v1.Plugin.AddSheet";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "sheetTitle", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "rowCount", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 3, name: "columnCount", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin_AddSheet {
    return new Plugin_AddSheet().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin_AddSheet {
    return new Plugin_AddSheet().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin_AddSheet {
    return new Plugin_AddSheet().fromJsonString(jsonString, options);
  }

  static equals(a: Plugin_AddSheet | PlainMessage<Plugin_AddSheet> | undefined, b: Plugin_AddSheet | PlainMessage<Plugin_AddSheet> | undefined): boolean {
    return proto3.util.equals(Plugin_AddSheet, a, b);
  }
}

