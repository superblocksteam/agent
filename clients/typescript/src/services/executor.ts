import * as grpc from '@grpc/grpc-js';
import { credentials } from '@grpc/grpc-js';
import { JavaScriptValue, Value } from 'google-protobuf/google/protobuf/struct_pb';
import { platform, release, type } from 'os';
import pino from 'pino';
import { version } from '../../package.json';
import { mapParams } from '../resources/api';
import { ApiConfig, ExecutionError, ExecutionEvent, ExecutionOutput, Function, JsonValue, Mock, Result } from '../types';
import { ExecutorServiceClient } from '../types-js/api/v1/service_grpc_pb';
import * as api_v1_service_pb from '../types-js/api/v1/service_pb';
import {
  ExecuteRequest,
  Function as FunctionProto,
  Mock as MockPb,
  TwoWayRequest,
  TwoWayResponse,
  ViewMode as ViewModePb
} from '../types-js/api/v1/service_pb';
import { Profile } from '../types-js/common/v1/common_pb';
import { uuidv4 } from '../utils';
import { sleep } from '../utils/coroutine';
import Fetch = ExecuteRequest.Fetch;
import FunctionResponse = FunctionProto.Response;
import Options = ExecuteRequest.Options;
type PromiseHandlers<T> = {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

/**
 * Each execute service will create one and only one connection
 */
export class ExecutorService {
  private client: ExecutorServiceClient;
  private url: string;
  private apiKey: string;
  private insecure: boolean;
  private authority?: string;
  private connectionTimeoutMs?: number;
  private connectionPromise: Promise<any>;
  private logger: pino.Logger | undefined;
  private status: 'connecting' | 'ready' | 'failed';

  public constructor({
    url,
    apiKey,
    insecure,
    authority,
    connectionTimeoutMs,
    logger
  }: {
    url: string;
    apiKey: string;
    insecure: boolean;
    authority?: string;
    connectionTimeoutMs: number;
    logger?: pino.Logger;
  }) {
    this.apiKey = apiKey;
    this.url = url;
    this.insecure = insecure;
    this.authority = authority;
    this.connectionTimeoutMs = connectionTimeoutMs;
    this.logger = logger;
    this.connect();
  }

  public reset() {
    if (this.status === 'connecting' || this.status === 'ready') {
      return;
    }
    this.logger?.info('Resetting connection');
    this.client?.close();
    this.connect();
  }

  public close() {
    this.logger?.info('Closing connection');
    this.client?.close();
  }

  public async execute({
    apiId,
    inputs,
    mocks,
    apiConfig,
    retries
  }: {
    apiId: string;
    inputs: object;
    mocks: Mock[];
    apiConfig: ApiConfig;
    retries: number;
  }): Promise<Result> {
    this.logger?.debug('Executing API', { apiId, retries });
    for (let i = 0; i < retries + 1; i++) {
      try {
        return await this.executeOnce({ apiId, inputs, mocks, apiConfig });
      } catch (e) {
        if (i == retries - 1) {
          this.logger?.error({ apiId: apiId, error: e, attempt: i + 1 }, 'Execution failed after maximum number of retries reached.');
          throw e;
        }
        if (this.shouldRetry(e.code)) {
          const sleepMs = Math.pow(2, i) * 1000;
          this.logger?.warn({ apiId: apiId, error: e, attempt: i + 1 }, `Execution failed on a retryable error. Sleeping ${sleepMs}ms.`);
          if (this.shouldReset(e.code) && this.status !== 'connecting') {
            this.status = 'failed';
            this.reset();
          }
          await sleep(sleepMs);
          continue;
        }
        this.logger?.error({ apiId: apiId, error: e, attempt: i + 1 }, 'Execution failed on a non-retryable error.');
        throw e;
      }
    }
  }

  private async executeOnce(spec: { apiId: string; inputs: object; mocks: Mock[]; apiConfig: ApiConfig }): Promise<Result> {
    this.logger?.debug({ apiId: spec.apiId }, 'Executing API once');
    await this.connectionPromise;
    const stream = this.newStream();
    const result = await stream.execute(spec);
    return result;
  }

  private shouldRetry(e: grpc.status) {
    return [grpc.status.UNAVAILABLE, grpc.status.DATA_LOSS, grpc.status.INTERNAL, grpc.status.CANCELLED].includes(e);
  }

  private shouldReset(e: grpc.status) {
    return [grpc.status.UNAVAILABLE, grpc.status.DATA_LOSS].includes(e);
  }

  private newStream(): ExecutorStream {
    this.logger?.debug('Creating new stream');
    return new ExecutorStream({ client: this.client, apiKey: this.apiKey });
  }

  private connect(): void {
    if (this.status === 'connecting' || this.status === 'ready') {
      return;
    }
    this.status = 'connecting';

    this.logger?.info({ url: this.url }, 'Connecting to superblocks');

    let pending: PromiseHandlers<any>;
    this.connectionPromise = new Promise<any>((resolve, reject) => {
      pending = { resolve, reject };
    });

    const options: grpc.ClientOptions = {
      'grpc.primary_user_agent': `Superblocks-JavaScript/${version} (${type()} ${release()}; ${platform()})`
    };

    if (this.insecure) {
      this.authority && (options['grpc.default_authority'] = this.authority);
      this.client = new ExecutorServiceClient(this.url, credentials.createInsecure(), options);
    } else {
      this.client = new ExecutorServiceClient(this.url, credentials.createSsl(), options);
    }
    this.client.waitForReady(Date.now() + this.connectionTimeoutMs, (err: Error | null) => {
      if (err) {
        this.status = 'failed';
        this.logger?.error({ timeout: this.connectionTimeoutMs, error: err }, 'Connection timeout');
        err.message = `Connection timeout after ${this.connectionTimeoutMs}ms. ${err.message}`;
        pending.reject(err);
      } else {
        this.status = 'ready';
        this.logger?.debug('Successfully connected to Superblokcs');
        pending.resolve({});
      }
    });
  }
}

export class ExecutorStream {
  private apiKey: string;
  private stream: grpc.ClientDuplexStream<api_v1_service_pb.TwoWayRequest, api_v1_service_pb.TwoWayResponse>;
  private pending: PromiseHandlers<any>;
  private funcs: Map<string, Function> = new Map();
  private executionEvents: ExecutionEvent[] = [];
  private streamError: Error | undefined;

  constructor({
    client,
    apiKey,
    requestTimeoutMs = 10 * 60 * 1000
  }: {
    client: ExecutorServiceClient;
    apiKey: string;
    requestTimeoutMs?: number;
  }) {
    this.apiKey = apiKey;
    const stream = client.twoWayStream({ deadline: Date.now() + requestTimeoutMs });

    stream.on('data', (receive: TwoWayResponse) => {
      if (receive.hasStream() && receive.getStream().hasEvent()) {
        this.executionEvents.push(receive.getStream().getEvent());
      } else if (receive.hasFunction()) {
        const id = receive.getFunction().getId();
        const name = receive.getFunction().getName();
        const paramsProto = receive.getFunction().getParametersList();
        const paramsJs = paramsProto.map((p) => p.toJavaScript());
        const mappedParams = mapParams(paramsJs);

        const twoWayRequest: TwoWayRequest = new TwoWayRequest();
        const functionResponse = new FunctionResponse();
        functionResponse.setId(id);
        try {
          const val = this.funcs.get(name)(...mappedParams);
          functionResponse.setValue(Value.fromJavaScript(val ?? null));
        } catch (e) {
          throw e;
        }

        twoWayRequest.setFunction(functionResponse);
        this.send(twoWayRequest);
      }
    });

    stream.on('error', (error: any) => {
      this.streamError = error;
      if (!this.pending) {
        return;
      }
      // Execution finished with step error
      if ([grpc.status.UNKNOWN].includes(error.code)) {
        try {
          const executionResult = new IExecutionResult({ events: this.executionEvents });
          this.pending.resolve(executionResult);
        } catch (e) {
          this.pending.reject(e);
        }
        return;
      }
      this.pending.reject(error);
    });

    stream.on('end', () => {
      if (this.streamError) {
        this.pending.reject(this.streamError);
        return;
      }
      try {
        const executionResult = new IExecutionResult({ events: this.executionEvents });
        this.pending.resolve(executionResult);
      } catch (e) {
        this.pending.reject(e);
      }
    });

    this.stream = stream;
  }

  public async execute({
    apiId,
    inputs,
    mocks,
    apiConfig
  }: {
    apiId: string;
    inputs: object;
    mocks: Mock[];
    apiConfig: ApiConfig;
  }): Promise<Result> {
    const twoWayRequest = new TwoWayRequest();
    const executeRequest = new ExecuteRequest();
    const fetch = new Fetch();
    if (apiConfig.profile) {
      const profilePb = new Profile();
      profilePb.setName(apiConfig.profile);
      fetch.setProfile(profilePb);
      executeRequest.setProfile(profilePb);
    }

    if (apiConfig.branch) {
      fetch.setBranchName(apiConfig.branch);
    }

    if (apiConfig.commit) {
      fetch.setCommitId(apiConfig.commit);
    }

    fetch.setId(apiId);
    fetch.setToken(`Bearer ${decodeURIComponent(this.apiKey)}`);
    if (apiConfig.viewMode) {
      switch (apiConfig.viewMode) {
        case 'deployed': {
          fetch.setViewMode(ViewModePb.VIEW_MODE_DEPLOYED);
          break;
        }
        case 'editor': {
          fetch.setViewMode(ViewModePb.VIEW_MODE_EDIT);
          break;
        }
        case 'preview': {
          fetch.setViewMode(ViewModePb.VIEW_MODE_PREVIEW);
          break;
        }
      }
    }

    executeRequest.setFetch(fetch);
    const mp = executeRequest.getInputsMap();

    for (const [key, value] of Object.entries(inputs)) {
      const cleanedValue = JSON.parse(JSON.stringify(value));
      mp.set(key, Value.fromJavaScript(cleanedValue));
    }

    for (const m of mocks) {
      const { filter, predicate, ret } = m;
      const mock = new MockPb();
      const on = new MockPb.On();

      if (filter) {
        const params = new MockPb.Params();
        filter.integration && params.setIntegrationType(filter.integration);
        filter.stepName && params.setStepName(filter.stepName);
        filter.configuration && params.setInputs(Value.fromJavaScript(filter.configuration));
        on.setStatic(params);
      }

      if (predicate) {
        const funcName = this.registerFunc(predicate);
        on.setDynamic(funcName);
      }

      mock.setOn(on);

      const returnn = new MockPb.Return();
      if (typeof ret === 'function') {
        const funcName = this.registerFunc(ret as Function);
        returnn.setDynamic(funcName);
      } else {
        const val = Value.fromJavaScript(ret as JavaScriptValue);
        returnn.setStatic(val);
      }

      mock.setReturn(returnn);
      executeRequest.addMocks(mock);
    }

    const options = new Options();
    options.setIncludeEventOutputs(true);
    options.setIncludeEvents(true);
    options.setIncludeApiEvents(true);

    executeRequest.setOptions(options);
    twoWayRequest.setExecute(executeRequest);
    return await this.request(twoWayRequest);
  }

  private registerFunc(func: Function): string {
    const funcName = uuidv4();
    this.funcs.set(funcName, func);
    return funcName;
  }

  private async request(payload: TwoWayRequest): Promise<any> {
    const p = new Promise<any>((resolve, reject) => {
      this.pending = { resolve, reject };
    });
    this.send(payload);
    return await p;
  }

  private send(payload: TwoWayRequest): void {
    this.stream.write(payload);
  }

  private handleExecuteFunctions(funcStr: string): any {
    const fn = new Function(funcStr) as (a: number, b: number) => number;
  }
}

export class IExecutionResult implements Result {
  private events: ExecutionEvent[];
  private output: ExecutionOutput;
  private errors: ExecutionError[];

  constructor({ events }: { events: ExecutionEvent[] }) {
    this.events = events;
    const responseEvent = this.events.find((e) => e.hasResponse());
    if (!responseEvent) {
      throw new Error('Response event does not exist');
    }

    const response = responseEvent.getResponse();

    const errors = response.getErrorsList();
    this.errors = errors;

    if (errors.length === 0) {
      const last = response.getLast();
      if (last === '') {
        throw new Error(`This api is empty.`);
      }
      const lastEndEvent = events.find((e) => e.hasEnd() && e.getName() === last);
      if (!lastEndEvent) {
        throw new Error(`Response event not found: ${last}.`);
      }
      if (!lastEndEvent.hasEnd() && lastEndEvent.getEnd().hasOutput()) {
        throw new Error(`Output not found`);
      }
      this.output = lastEndEvent.getEnd().getOutput();
    }
  }

  getEvents(): ExecutionEvent[] {
    return this.events;
  }

  getOutput(): ExecutionOutput {
    return this.output;
  }

  getErrors(): ExecutionError[] {
    return this.errors;
  }

  getResult(): JsonValue {
    if (this.getErrors().length > 0) {
      const errors = this.getErrors()
        .map((e) => `${e.getName()}: ${e.getMessage()}`)
        .join('. ');
      throw new Error(`Api has an error. ${errors}`);
    }
    return this.getOutput().getResult().toJavaScript();
  }

  getBlockResult(blockName: string): JsonValue {
    const endEvent = this.events.find((e) => e.hasEnd() && e.getName() === blockName);
    if (!endEvent) {
      throw new Error(`Block does not exist: ${blockName}. `);
    }
    if (endEvent.getEnd().hasError()) {
      throw new Error(`Block has an error: ${blockName}.`);
    }
    return endEvent.getEnd().getOutput().getResult().toJavaScript();
  }
}
