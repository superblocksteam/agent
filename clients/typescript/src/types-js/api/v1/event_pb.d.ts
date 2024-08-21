// package: api.v1
// file: api/v1/event.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as common_v1_errors_pb from '../../common/v1/errors_pb';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as validate_validate_pb from '../../validate/validate_pb';
import * as buf_validate_validate_pb from '../../buf/validate/validate_pb';

export class Resolved extends jspb.Message {
  hasValue(): boolean;
  clearValue(): void;
  getValue(): google_protobuf_struct_pb.Value | undefined;
  setValue(value?: google_protobuf_struct_pb.Value): Resolved;
  clearBindingsList(): void;
  getBindingsList(): Array<google_protobuf_struct_pb.Value>;
  setBindingsList(value: Array<google_protobuf_struct_pb.Value>): Resolved;
  addBindings(value?: google_protobuf_struct_pb.Value, index?: number): google_protobuf_struct_pb.Value;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Resolved.AsObject;
  static toObject(includeInstance: boolean, msg: Resolved): Resolved.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Resolved, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Resolved;
  static deserializeBinaryFromReader(message: Resolved, reader: jspb.BinaryReader): Resolved;
}

export namespace Resolved {
  export type AsObject = {
    value?: google_protobuf_struct_pb.Value.AsObject;
    bindingsList: Array<google_protobuf_struct_pb.Value.AsObject>;
  };
}

export class Event extends jspb.Message {
  getName(): string;
  setName(value: string): Event;
  getType(): BlockType;
  setType(value: BlockType): Event;

  hasTimestamp(): boolean;
  clearTimestamp(): void;
  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): Event;

  hasStart(): boolean;
  clearStart(): void;
  getStart(): Event.Start | undefined;
  setStart(value?: Event.Start): Event;

  hasEnd(): boolean;
  clearEnd(): void;
  getEnd(): Event.End | undefined;
  setEnd(value?: Event.End): Event;

  hasData(): boolean;
  clearData(): void;
  getData(): Event.Data | undefined;
  setData(value?: Event.Data): Event;

  hasRequest(): boolean;
  clearRequest(): void;
  getRequest(): Event.Request | undefined;
  setRequest(value?: Event.Request): Event;

  hasResponse(): boolean;
  clearResponse(): void;
  getResponse(): Event.Response | undefined;
  setResponse(value?: Event.Response): Event;

  hasParent(): boolean;
  clearParent(): void;
  getParent(): string | undefined;
  setParent(value: string): Event;

  hasExecutionIndex(): boolean;
  clearExecutionIndex(): void;
  getExecutionIndex(): string | undefined;
  setExecutionIndex(value: string): Event;

  getEventCase(): Event.EventCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
  export type AsObject = {
    name: string;
    type: BlockType;
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    start?: Event.Start.AsObject;
    end?: Event.End.AsObject;
    data?: Event.Data.AsObject;
    request?: Event.Request.AsObject;
    response?: Event.Response.AsObject;
    parent?: string;
    executionIndex?: string;
  };

  export class Data extends jspb.Message {
    hasValue(): boolean;
    clearValue(): void;
    getValue(): google_protobuf_struct_pb.Value | undefined;
    setValue(value?: google_protobuf_struct_pb.Value): Data;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Data.AsObject;
    static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Data;
    static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
  }

  export namespace Data {
    export type AsObject = {
      value?: google_protobuf_struct_pb.Value.AsObject;
    };
  }

  export class Request extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Request.AsObject;
    static toObject(includeInstance: boolean, msg: Request): Request.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Request, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Request;
    static deserializeBinaryFromReader(message: Request, reader: jspb.BinaryReader): Request;
  }

  export namespace Request {
    export type AsObject = {};
  }

  export class Response extends jspb.Message {
    getLast(): string;
    setLast(value: string): Response;
    clearErrorsList(): void;
    getErrorsList(): Array<common_v1_errors_pb.Error>;
    setErrorsList(value: Array<common_v1_errors_pb.Error>): Response;
    addErrors(value?: common_v1_errors_pb.Error, index?: number): common_v1_errors_pb.Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Response.AsObject;
    static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Response, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Response;
    static deserializeBinaryFromReader(message: Response, reader: jspb.BinaryReader): Response;
  }

  export namespace Response {
    export type AsObject = {
      last: string;
      errorsList: Array<common_v1_errors_pb.Error.AsObject>;
    };
  }

  export class Start extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Start.AsObject;
    static toObject(includeInstance: boolean, msg: Start): Start.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Start, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Start;
    static deserializeBinaryFromReader(message: Start, reader: jspb.BinaryReader): Start;
  }

  export namespace Start {
    export type AsObject = {};
  }

  export class End extends jspb.Message {
    hasPerformance(): boolean;
    clearPerformance(): void;
    getPerformance(): Performance | undefined;
    setPerformance(value?: Performance): End;

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): Output | undefined;
    setOutput(value?: Output): End;

    hasError(): boolean;
    clearError(): void;
    getError(): common_v1_errors_pb.Error | undefined;
    setError(value?: common_v1_errors_pb.Error): End;
    getStatus(): BlockStatus;
    setStatus(value: BlockStatus): End;

    getResolvedMap(): jspb.Map<string, Resolved>;
    clearResolvedMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): End.AsObject;
    static toObject(includeInstance: boolean, msg: End): End.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: End, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): End;
    static deserializeBinaryFromReader(message: End, reader: jspb.BinaryReader): End;
  }

  export namespace End {
    export type AsObject = {
      performance?: Performance.AsObject;
      output?: Output.AsObject;
      error?: common_v1_errors_pb.Error.AsObject;
      status: BlockStatus;

      resolvedMap: Array<[string, Resolved.AsObject]>;
    };
  }

  export enum EventCase {
    EVENT_NOT_SET = 0,
    START = 4,
    END = 5,
    DATA = 7,
    REQUEST = 9,
    RESPONSE = 10
  }
}

export class Performance extends jspb.Message {
  getStart(): number;
  setStart(value: number): Performance;
  getFinish(): number;
  setFinish(value: number): Performance;
  getTotal(): number;
  setTotal(value: number): Performance;
  getExecution(): number;
  setExecution(value: number): Performance;
  getOverhead(): number;
  setOverhead(value: number): Performance;

  getCustomMap(): jspb.Map<string, number>;
  clearCustomMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Performance.AsObject;
  static toObject(includeInstance: boolean, msg: Performance): Performance.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Performance, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Performance;
  static deserializeBinaryFromReader(message: Performance, reader: jspb.BinaryReader): Performance;
}

export namespace Performance {
  export type AsObject = {
    start: number;
    finish: number;
    total: number;
    execution: number;
    overhead: number;

    customMap: Array<[string, number]>;
  };
}

export class Output extends jspb.Message {
  hasResult(): boolean;
  clearResult(): void;
  getResult(): google_protobuf_struct_pb.Value | undefined;
  setResult(value?: google_protobuf_struct_pb.Value): Output;
  getRequest(): string;
  setRequest(value: string): Output;
  clearStdoutList(): void;
  getStdoutList(): Array<string>;
  setStdoutList(value: Array<string>): Output;
  addStdout(value: string, index?: number): string;
  clearStderrList(): void;
  getStderrList(): Array<string>;
  setStderrList(value: Array<string>): Output;
  addStderr(value: string, index?: number): string;

  hasRequestV2(): boolean;
  clearRequestV2(): void;
  getRequestV2(): Output.Request | undefined;
  setRequestV2(value?: Output.Request): Output;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Output.AsObject;
  static toObject(includeInstance: boolean, msg: Output): Output.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Output, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Output;
  static deserializeBinaryFromReader(message: Output, reader: jspb.BinaryReader): Output;
}

export namespace Output {
  export type AsObject = {
    result?: google_protobuf_struct_pb.Value.AsObject;
    request: string;
    stdoutList: Array<string>;
    stderrList: Array<string>;
    requestV2?: Output.Request.AsObject;
  };

  export class Request extends jspb.Message {
    getSummary(): string;
    setSummary(value: string): Request;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): Request;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Request.AsObject;
    static toObject(includeInstance: boolean, msg: Request): Request.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Request, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Request;
    static deserializeBinaryFromReader(message: Request, reader: jspb.BinaryReader): Request;
  }

  export namespace Request {
    export type AsObject = {
      summary: string;
      metadata?: google_protobuf_struct_pb.Struct.AsObject;
    };
  }
}

export class OutputOld extends jspb.Message {
  hasOutput(): boolean;
  clearOutput(): void;
  getOutput(): google_protobuf_struct_pb.Value | undefined;
  setOutput(value?: google_protobuf_struct_pb.Value): OutputOld;
  clearLogList(): void;
  getLogList(): Array<string>;
  setLogList(value: Array<string>): OutputOld;
  addLog(value: string, index?: number): string;
  getRequest(): string;
  setRequest(value: string): OutputOld;

  hasPlaceHoldersInfo(): boolean;
  clearPlaceHoldersInfo(): void;
  getPlaceHoldersInfo(): google_protobuf_struct_pb.Value | undefined;
  setPlaceHoldersInfo(value?: google_protobuf_struct_pb.Value): OutputOld;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OutputOld.AsObject;
  static toObject(includeInstance: boolean, msg: OutputOld): OutputOld.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: OutputOld, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OutputOld;
  static deserializeBinaryFromReader(message: OutputOld, reader: jspb.BinaryReader): OutputOld;
}

export namespace OutputOld {
  export type AsObject = {
    output?: google_protobuf_struct_pb.Value.AsObject;
    logList: Array<string>;
    request: string;
    placeHoldersInfo?: google_protobuf_struct_pb.Value.AsObject;
  };
}

export enum BlockStatus {
  BLOCK_STATUS_UNSPECIFIED = 0,
  BLOCK_STATUS_SUCCEEDED = 1,
  BLOCK_STATUS_ERRORED = 2
}

export enum BlockType {
  BLOCK_TYPE_UNSPECIFIED = 0,
  BLOCK_TYPE_BREAK = 1,
  BLOCK_TYPE_RETURN = 2,
  BLOCK_TYPE_WAIT = 3,
  BLOCK_TYPE_PARALLEL = 4,
  BLOCK_TYPE_CONDITIONAL = 5,
  BLOCK_TYPE_LOOP = 6,
  BLOCK_TYPE_TRYCATCH = 7,
  BLOCK_TYPE_STEP = 8,
  BLOCK_TYPE_VARIABLES = 9,
  BLOCK_TYPE_THROW = 10,
  BLOCK_TYPE_SEND = 11,
  BLOCK_TYPE_STREAM = 12
}
