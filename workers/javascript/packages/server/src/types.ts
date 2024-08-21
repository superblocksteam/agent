import { RedisClientType } from '@redis/client';
import { ActionConfiguration, Closer, DatasourceConfiguration, DatasourceMetadataDto, ExecutionOutput } from '@superblocks/shared';
import { Options as PoolOptions } from 'generic-pool';
import { Logger } from 'pino';
import { PluginProps } from '../src/plugin-property/plugin-props';
import { StepPerformanceImpl } from './performance/step';
import { StepPerformance } from './performance/types';

export type TransportStoreType = 'redis' | 'redis-cluster' | 'mock';
export type TransportQueueType = 'redis' | 'redis-cluster';

export interface TransportOptions extends ProcessOptions {
  /**
   * A unique name for this transport.
   */
  name: string;
  /**
   * The name of this agent platform group.
   */
  agent: string;
  /**
   * Service bucket.
   */
  bucket: string;
  /**
   * List of plugin events to support.
   */
  events: string[];
  /**
   * Plugins that this worker will support.
   */
  plugins: Record<string, unknown>;
  /**
   * The KVStore;
   */
  kvstore: KVStore;
  /**
   * The Queue;
   */
  queue: RedisClientType;
}

export interface ProcessOptions {
  /**
   * The consumer group name.
   */
  group: string;
  /**
   * The max number of waiting messages to retrieve from the queue.
   */
  batch: number;
  /**
   * The number of milliseconds to block a Redis connection for
   * while it waits for new items on the stream to return.
   */
  block: number;
  /**
   * If true, messages will be processed sequencially
   */
  sync?: boolean;
}

export interface WorkerOptions extends ProcessOptions {
  /**
   * The name for this worker.
   */
  name: string;
  /**
   * The Redis streams that this worker will listen for messages on.
   */
  keys: Array<string>;
  /**
   * The {@link Plugin} that will be invoke for each message.
   */
  executors: Record<string, RunFunc>;
  /**
   * The Redis client.
   * https://github.com/redis/node-redis/blob/0752f143a6dbc83df0a5db987907e8794aabe9db/docs/FAQ.md#redisclienttype
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  // run: any;
}

export interface ExecutionPoolOptions {
  /**
   * The maximum number of processes in the worker execution pool. Correlates
   * to the maximum number of 'execute' steps to process concurrently.
   */
  poolSize: number;

  /**
   * The KVStore client that will be used to execute commands on behalf of the pool processes.
   * Pool processes do not have direct access to the KVStore (redis), instead they will send
   * their desired commands to the pool manager, who will execute the request on their behalf
   * using this client.
   *
   * Note: This KV store client cannot be an IPC store.
   */
  kvStore?: KVStore;

  /**
   * The maximum amount of time that a plugin execution can take before it is forcefully terminated.
   */
  defaultExecutionTimeoutMs?: string;

  /**
   * The list of environment variables, from the parent/host process, that are allowed
   * to be set in the pool processes' environment.
   */
  executionEnvInclusionList?: string[];

  /**
   * Whether the execution pool should be initialized and enabled to execute steps.
   */
  enabled: boolean;
}

export interface PoolExecResult {
  /**
   * The output of the successful execution of the plugin.
   * If the plugin execution failed, this value can be ignored.
   */
  output: ExecutionOutput;

  /**
   * The performance object containing the performance metrics of the plugin execution.
   * This object is built on top of the perf object that is passed to the plugin.
   */
  perf?: StepPerformance;

  /**
   * The error that occurred during execution.
   * If the execution was successful, this will be undefined.
   */
  err?: Error;
}

export type SendFunc = (_message: unknown) => Promise<void>;
export type UntilFunc = () => Promise<void>;

export interface RunOptions {
  /**
   * The event to run (i.e. execute).
   */
  event: Event;

  /**
   * The performance object that will be filled
   * in with various details along the way.
   */
  perf: StepPerformanceImpl;

  /**
   * The core request.
   */
  request: Request;

  /**
   * The observability tags
   */
  observabilityTags: Record<string, string>;

  /**
   * Optional function to send events through.
   */
  send?: SendFunc;

  /**
   * Sometimes we may want to exit a plugin early.
   * This provides an optional way to do that.
   */
  until?: UntilFunc;
}

export type RunFunc = (options: RunOptions) => Promise<Response>;

export interface Plugin {
  name: string;

  run(options: RunOptions): Promise<Response>;
}

export const VariableType = {
  Simple: 'TYPE_SIMPLE',
  Advanced: 'TYPE_ADVANCED',
  NATIVE: 'TYPE_NATIVE',
  Filepicker: 'TYPE_FILEPICKER'
};

export const VariableMode = {
  ReadWrite: 'MODE_READWRITE',
  Read: 'MODE_READ'
};

export interface ExcludableList<T> {
  exclude?: boolean;
  items?: T[];
}

export type TransportMode = 'redis';
export type StorageMode = 'redis';

export type PluginDefinition = {
  name: string;
};

export enum Event {
  METADATA = 'metadata',
  TEST = 'test',
  EXECUTE = 'execute',
  PRE_DELETE = 'pre_delete',
  STREAM = 'stream'
}

export interface RedisConnectionOptions {
  /**
   * The identifier of this worker.
   */
  name: string;
  /**
   * Authentication token.
   */
  token?: string;
  /**
   * redis[s]://[[username][:password]@][host][:port][/db-number]
   */
  url: string;
  /**
   * Optionaal port. Default to 6379.
   */
  port?: number;
  /**
   * SNI name. Defaults to {@link RedisConnectionOptions.url}
   */
  servername?: string;
  /**
   * TLS options.
   */
  tls: boolean;
  /**
   * The optional redis database name.
   */
  database?: number;
  /**
   * The maximum write size after encoding.
   */
  maxBytes?: number;
  /**
   * Optional logger
   */
  logger?: Logger;
  /**
   * Connection pool options
   */
  pool?: PoolOptions;
  /**
   * If true, throughput will be optimized at the expense of latency.
   */
  delay?: boolean;
}

export interface RedisMessage {
  id: string;
  message: Record<string, string>;
  idx: number;
}

export type Selector = WorkerSelector & PluginDefinition;

export interface WorkerSelector {
  bucket: string;
}

export type Metadata = Selector & {
  event: Event;
  /**
   * This is the carrier used to propogate OpenTelemetry context.
   */
  carrier?: Record<string, string>;
};

/**
 * This error is "codec-able".
 */
export interface Error {
  name: string;
  message: string;
}

export type Response = ExecuteResponse | TestResponse | MetadataResponse | PreDeleteResponse | StreamResponse;

/**
 * Wrapper for the response of {@link BasePlugin.execute}
 */
export interface ExecuteResponse {
  /**
   * Since the actual execution output is stored in the
   * {@link KVStore}, we don't need to return it to the client.
   */
  err?: Error;
  /**
   * The key for which the output can
   * be retrieved from the {@link KVStore}
   */
  key: string;
}

/**
 * Wrapper for the response of {@link BasePlugin.test}
 */
export type TestResponse = void;

/**
 * Wrapper for the response of {@link BasePlugin.stream}
 */
export type StreamResponse = void;

/**
 * Wrapper for the response of {@link BasePlugin.metadata}
 */
export type MetadataResponse = DatasourceMetadataDto;

/**
 * Wrapper for the response of {@link BasePlugin.preDelete}
 */
export type PreDeleteResponse = void;

export type Request = ExecuteRequest | TestRequest | MetadataRequest | PreDeleteRequest | StreamRequest;

export enum BindingType {
  Global = 'global',
  Output = 'output'
}

export type BindingKeyAndType = { type: BindingType; key: string };
export type Binding = BindingKeyAndType & { value: object };

export interface Quotas {
  /**
   * The max number of bytes a serialized step response can be.
   */
  size?: number;
  /**
   * The max number of miiliseconds a step can execute for.
   */
  duration?: number;
}

/**
 * Wrapper for the request of {@link BasePlugin.execute}
 */
export interface ExecuteRequest {
  props: Partial<PluginProps>;
  /**
   * These are items that we don't care about but that will be
   * added to select log statements for easier correlation.
   */
  baggage?: Record<string, string>;
  /**
   * The quotas to apply to this step.
   */
  quotas?: Quotas;
}

/**
 * Wrapper for the request of {@link BasePlugin.stream}
 */
export type StreamRequest = ExecuteRequest;

/**
 * Wrapper for the request of {@link BasePlugin.test}
 */
export interface TestRequest {
  dConfig: DatasourceConfiguration;
  aConfig?: ActionConfiguration;
}

/**
 * Wrapper for the request of {@link BasePlugin.metadata}
 */
export interface MetadataRequest {
  dConfig: DatasourceConfiguration;
  aConfig: ActionConfiguration;
}

/**
 * Wrapper for the request of {@link BasePlugin.preDelete}
 */
export interface PreDeleteRequest {
  dConfig: DatasourceConfiguration;
}

export type PluginOpts = {
  datasourceConfiguration?: DatasourceConfiguration;
  actionConfiguration?: ActionConfiguration;
  pluginProps?: PluginProps;
};

export interface Inbox {
  // The queue to send the reponse on.
  inbox: string;

  // The topic to send any events through.
  topic?: string;
}

export interface Returnable<T> extends Inbox {
  data?: T;
}

/**
 * Sometimes you have a function that might throw. However, you may
 * want to always return metadata from that function regardless.
 * We can wrap the function result in a {@link Deferable} so that we
 * always return {@link Performance}.
 *
 *      const { pinned: performance, data: response }: Wrapped<Performance, Deferable<Response>> = fn();
 *      console.log(performance)
 *      await response.result;
 *
 */
export interface Wrapped<T, U> {
  pinned?: T;
  data: U;
}

/**
 * Wraps a deferred promise.
 */
export interface Deferable<T> {
  /**
   * The deferred promise.
   */
  result: Promise<T>;
}

export interface WorkerAPIOptions {
  /**
   * NOTE(frank): I have no idea what the correct type is here
   * https://github.com/redis/node-redis/blob/0752f143a6dbc83df0a5db987907e8794aabe9db/docs/FAQ.md#redisclienttype
   */
  kvStore: KVStore;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // This is stream
  redis: RedisClientType;

  /**
   * TODO(frank)
   */
  agent: string;
  /**
   * Optional logger
   */
  logger?: Logger;
  /**
   * Ack timeout on stream messages
   */
  ackTimeoutMs?: number;
  /**
   * Global step timeout
   */
  timeout?: number;
}

export interface WorkerAPI {
  prepareApiExecution(firstStepProps: PluginProps): Promise<void>;

  execute(
    selector: Selector,
    request: ExecuteRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<ExecuteResponse>>>;

  metadata(
    selector: Selector,
    request: MetadataRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<MetadataResponse>>>;

  test(
    selector: Selector,
    request: TestRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<TestResponse>>>;

  preDelete(
    selector: Selector,
    request: PreDeleteRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<PreDeleteResponse>>>;
}

/**
 * Attempts to abstract queue based operations.
 * This interface isn't complete and methods are
 * added as needed. Currently used to aid in tests.
 */
export interface QueueAPI {
  /**
   * Waits for an item to be sent on a stream.
   *
   * @param inbox
   * @param timeout
   */
  wait(inbox: string, timeout?: number): Promise<Wrapped<Error, Wrapped<StepPerformance, Response>>>;
}

export interface IO {
  read?: number;
  write?: number;
}

export type TxProcessFunc = (results: Array<{ data?: number }>) => void;

export interface KVOps {
  baggage?: Record<string, string>;
}

export interface WriteOps extends KVOps {
  /**
   * The duration in seconds that this KV pair should be valid for.
   */
  expiration?: number;
  /**
   * The max number of bytes a serialized step response can be.
   */
  maxSize?: number;
}

export interface KVStoreTx {
  /**
   * Add a read operation to the transaction.
   * @param key
   */
  read(key: string): void;
  /**
   * Add a write operation to the transaction.
   * @param key
   * @param value
   * @param expiration
   */
  write(key: string, value: unknown, ops?: WriteOps): void;
  /**
   * Commit the transaction.
   */
  commit(ops?: KVOps): Promise<Wrapped<IO, Array<unknown>>>;
}

export interface KVStore extends Closer {
  read(keys: string[]): Promise<Wrapped<IO, Array<unknown>>>;

  write(key: string, value: unknown, ops?: WriteOps): Promise<Wrapped<IO, void>>;

  writeMany(payload: KV[], ops?: WriteOps): Promise<Wrapped<IO, void>>;

  delete(keys: string[]): Promise<void>;

  decr(key: string): Promise<number>;

  tx(): KVStoreTx;
}

/**
 * Represents an expirable KV pair.
 */
export interface KV {
  /**
   * The key.
   */
  key: string;
  /**
   * The value.
   */
  value: unknown;
  /**
   * The duration in seconds that this KV pair should be valid for.
   */
  expiration?: number;
}

export interface RedisOptions {
  /**
   * The Redis client.
   */
  client: RedisClientType;
  /**
   * The Redis client to use for very large payloads.
   */
  slowClient?: RedisClientType;
  /**
   * When the number of bytes being written is greater,
   * than this amount use the slow client.
   */
  slowThreshold?: number;
  /**
   * Key retention seconds
   */
  seconds: number;
  /**
   * The maximum write size after encoding.
   *
   * NOTE: This is not related to quotas but rather used
   *       to tune a kvstore in a product agnostic way.
   */
  maxBytes?: number;
  /**
   * The logger
   */
  logger?: Logger;
}

export const INBOX_START_ID = '0-0';
export const INBOX_ACK_MESSAGE_ID = '0-1';
export const INBOX_DATA_MESSAGE_ID = '0-2';
