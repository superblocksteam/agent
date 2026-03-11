import { Code } from '@superblocksteam/types';
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
  fetchFileCallback?: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;
}

export interface IntegrationExecutor {
  executeIntegration(params: {
    integrationId: string;
    pluginId: string;
    actionConfiguration?: Record<string, unknown>;
  }): Promise<{ executionId: string; output: unknown; error?: string }>;
}

export class ExecutionContext {
  globals: { [key: string]: unknown };
  variables?: Record<string, { key: string; type: string; mode?: string }>;
  kvStore?: KVStore;
  integrationExecutor?: IntegrationExecutor;
  useWasmBindingsSandbox?: boolean;
  includeDiagnostics?: boolean;

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
    this.useWasmBindingsSandbox = context?.useWasmBindingsSandbox;
    this.includeDiagnostics = context?.includeDiagnostics;
    this.kvStore = context?.kvStore;
    this.integrationExecutor = context?.integrationExecutor;
    this.variables = context?.variables ? _.cloneDeep(context.variables) : undefined;
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

/**
 * Per-integration-call diagnostic record captured during SDK API execution.
 * Only populated when include_diagnostics is set on the request.
 */
export interface IntegrationCallDiagnostic {
  /** The integration ID (UUID) that was called. */
  integrationId: string;
  /** The plugin type (e.g. "postgres", "restapi"). */
  pluginId: string;
  /** Truncated JSON of the action configuration sent to the integration (capped at 10KB). */
  input: string;
  /** Truncated JSON of the integration response (capped at 10KB). */
  output: string;
  /** Unix epoch milliseconds when the call started. */
  startMs: number;
  /** Unix epoch milliseconds when the call ended. */
  endMs: number;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** Error message if the integration call failed, empty otherwise. */
  error: string;
  /** 0-based ordinal indicating call order within the execution. */
  sequence: number;
  /** Optional user-supplied metadata for this call. */
  metadata?: {
    label?: string;
    description?: string;
  };
}

export class ExecutionOutput {
  /**
   * Custom instanceof check that works across duplicate copies of this class.
   *
   * pnpm's `injectWorkspacePackages` copies (rather than symlinks) workspace
   * packages, which can produce multiple copies of `@superblocks/shared` in
   * the dependency tree. When that happens, the default `instanceof` check
   * fails because the prototype chains differ. This structural check ensures
   * `instanceof ExecutionOutput` works regardless of which copy created the
   * object.
   *
   * TODO: Remove this override once we switch to symlinked workspace packages
   * by setting `force-legacy-deploy: true` and removing
   * `injectWorkspacePackages: true` from pnpm-workspace.yaml.
   */
  static [Symbol.hasInstance](instance: unknown): instance is ExecutionOutput {
    return (
      instance !== null &&
      typeof instance === 'object' &&
      Array.isArray((instance as ExecutionOutput).structuredLog)
    );
  }

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
  diagnostics?: IntegrationCallDiagnostic[];

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
    instance.diagnostics = obj.diagnostics;

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
