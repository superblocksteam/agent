import { Event as EventPb, Output as OutputPb } from '../types-js/api/v1/event_pb';
import { Error as ErrorPb } from '../types-js/common/v1/errors_pb';

export interface Result {
  // Get all the execution events in protobuf format
  getEvents(): ExecutionEvent[];

  // Get all the block execution outputs in protobuf format
  getOutput(): ExecutionOutput;

  // Get all the execution errors in protobuf format
  getErrors(): ExecutionError[];

  // Get the execution result
  getResult(): JsonValue;

  // Get the block execution result by block name
  getBlockResult(blockName: string): JsonValue;
}

export type ExecutionEvent = EventPb;

export type ExecutionOutput = OutputPb;

export type ExecutionError = ErrorPb;

export type ViewMode = 'editor' | 'preview' | 'deployed';

export type JsonValue = undefined | null | number | string | boolean | JsonValue[] | object;

export type ClientConfig = {
  endpoint?: string;
  token: string;
  connectionTimeoutMs?: number;
  // Use ssl if set to false
  insecure?: boolean;
  authority?: string;
  // Number of retries on failed executions caused by network issue.
  retries?: number;
};

export type ApiConfig = {
  profile?: string;
  viewMode?: ViewMode;
  branch?: string;
  commit?: string;
};
