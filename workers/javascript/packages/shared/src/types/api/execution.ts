import { Code } from '@superblocksteam/types/src/common/v1';
import _ from 'lodash';
import { ApiResourceTiming } from '../common/timing';
import { ApiNotificationConfiguration, Global, PlaceholdersInfo } from '.';

// TODO(pbardea): Rename "view mode" everywhere to something more descriptive.
export const UNPUBLISHED_VIEW_MODE = false;
export const PUBLISHED_VIEW_MODE = true;

export interface ApiExecutionRequest {
  apiId: string;
  params: ExecutionParam[];
  viewMode: boolean;
  settings?: ApiExecutionSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookies?: Record<string, any>;
}

export interface ApiExecutionSettings {
  timeout: number;
  memoryLimitMB: number;
}

export interface ApiExecutionResponse {
  apiId: string;
  apiName?: string;
  context: ExecutionContext;
  notificationConfig?: ApiNotificationConfiguration;
  timing?: ApiResourceTiming;
}

export interface KVStore {
  read: (keys: string[]) => Promise<{ data: unknown[] }>;
  write: (key: string, value: string) => Promise<void>;
  writeMany: (kvs: { key: string; value: unknown }[]) => Promise<void>;
}

export class ExecutionContext {
  globals: { [key: string]: unknown };
  variables?: Record<string, { key: string; type: string; mode?: string }>;
  kvStore?: KVStore;

  outputs: { [key: string]: ExecutionOutput };
  preparedStatementContext: unknown[];
  error?: string;
  errorContext?: {
    actionId: string;
    actionName: string;
    pluginId: string;
    datasourceId?: string;
    authError?: boolean;
  };

  constructor(context?: ExecutionContext) {
    this.globals = context && context.globals ? _.cloneDeep(context.globals) : {};
    this.outputs = context && context.outputs ? _.cloneDeep(context.outputs) : {};
    this.preparedStatementContext = context && context.preparedStatementContext ? _.cloneDeep(context.preparedStatementContext) : [];
  }

  // Do not merge the objects in arrays. Just replace the entire array.
  private static customMerger(objValue, srcValue) {
    if (_.isArray(objValue)) {
      return srcValue;
    }
  }

  addGlobalVariable(name: string, value: unknown): void {
    const obj = { [name]: value };
    this.globals = _.mergeWith(obj, this.globals, ExecutionContext.customMerger);
  }

  addGlobalsOverride(global: Global): void {
    for (const key of global.keys()) {
      this.addGlobalVariableOverride(key, global.get(key));
    }
  }

  addGlobalVariableOverride(name: string, value: unknown): void {
    const obj = { [name]: value };
    this.globals = _.mergeWith(this.globals, obj, ExecutionContext.customMerger);
  }

  addOutput(name: string, output: ExecutionOutput): void {
    this.outputs[name] = output;
  }

  merge(other: ExecutionContext): void {
    this.globals = {
      ...this.globals,
      ...other.globals
    };
    this.outputs = {
      ...this.outputs,
      ...other.outputs
    };
  }

  globalBindingKeys(): string[] {
    if (_.isEmpty(this.globals)) {
      return [];
    }
    return Object.keys(this.globals);
  }

  outputBindingKeys(): string[] {
    if (_.isEmpty(this.outputs)) {
      return [];
    }
    return Object.keys(this.outputs);
  }
}

export enum WorkflowExecutionParamsKey {
  QUERY_PARAMS = 'params',
  BODY = 'body'
}

export enum ApiReservedQueryParams {
  AUTH = 'sb-auth',
  ENVIRONMENT = 'environment',
  TEST = 'test',
  RAW = 'raw',
  PROFILE = 'profile'
}

export interface ExecutionParam {
  key: string;
  value: unknown;
}

export interface RedactableExecutionParam extends ExecutionParam {
  redactedValue?: string;
}

// Log message that includes the level alongside the message that was logged
export interface StructuredLog {
  msg: string;
  level: 'info' | 'warn' | 'error';
}

// Plugin execution could show the underlying raw request, e.g. curl for RestAPI
// It's controlled by hasRawRequest of the Plugin
export type RawRequest = string | undefined;

export class ExecutionOutput {
  error?: string;
  authError?: boolean;
  children?: string[];
  startTimeUtc?: Date;
  executionTime: number;
  log: string[];
  structuredLog: StructuredLog[];
  output: unknown;
  request: RawRequest;
  placeholdersInfo?: PlaceholdersInfo;
  integrationErrorCode?: Code;

  constructor() {
    this.output = {};
    this.log = [];
    this.structuredLog = [];
  }

  static fromJSONString(json: string): ExecutionOutput {
    const obj = JSON.parse(json);
    const instance = new ExecutionOutput();
    instance.error = obj.error;
    instance.children = obj.children;
    instance.executionTime = obj.executionTime;
    instance.log = obj.log;
    instance.structuredLog = obj.structuredLog;
    instance.output = obj.output;
    instance.request = obj.request;
    instance.startTimeUtc = obj.startTimeUtc;

    return instance;
  }

  logInfo(msg: string): void {
    if (msg) {
      this.log.push(`${msg}`);
      this.structuredLog.push({ msg, level: 'info' });
    }
  }

  logWarn(msg: string): void {
    if (msg) {
      this.log.push(`[WARN] ${msg}`);
      this.structuredLog.push({ msg, level: 'warn' });
    }
  }

  logError(msg: string, authError?: boolean): void {
    if (msg) {
      this.error = msg;
      this.authError = authError;
      this.log.push(`[ERROR] ${msg}`);
      this.structuredLog.push({ msg, level: 'error' });
    }
  }
}
