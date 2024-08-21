// This is deprecated code. This is mainly used only for E2E testing now.
import { randomUUID } from 'crypto';
import { RedisClientType } from '@redis/client';
import _ from 'lodash';
import { Logger } from 'pino';
import { InternalError, TimeoutError } from '../../errors';
import { StepPerformanceImpl } from '../../performance/step';
import { StepPerformance } from '../../performance/types';
import { micros, observe } from '../../performance/utils';
import { FullPluginPropsBuilder } from '../../plugin-property/builder/builders';
import { metaStore } from '../../plugin-property/decorators';
import { PluginPropsWriter } from '../../plugin-property/delegates/writer';
import { PluginProps } from '../../plugin-property/plugin-props';
import { GC } from '../../store/gc';
import {
  Deferable,
  Error,
  Event,
  ExecuteRequest,
  ExecuteResponse,
  INBOX_ACK_MESSAGE_ID,
  INBOX_START_ID,
  IO,
  KVStore,
  KVStoreTx,
  Metadata,
  MetadataRequest,
  MetadataResponse,
  PreDeleteRequest,
  PreDeleteResponse,
  QueueAPI,
  Request,
  Response,
  Returnable,
  Selector,
  TestRequest,
  TestResponse,
  WorkerAPI,
  WorkerAPIOptions,
  Wrapped
} from '../../types';
import { unpack } from '../../utils';

export class WorkerAPIImpl implements WorkerAPI, QueueAPI {
  private _logger?: Logger;
  private _agent: string;
  private _ackTimeoutMs: number;
  private _timeout: number;
  private _redis: RedisClientType;
  private _kvStore: KVStore;

  constructor(opts: WorkerAPIOptions) {
    this._logger = opts.logger;
    this._redis = opts.redis;
    this._agent = opts.agent;
    this._timeout = opts.timeout || 5000;
    this._ackTimeoutMs = opts.ackTimeoutMs || this._timeout;
    this._kvStore = opts.kvStore;
  }

  /**
   * Write the API scoped props to the KVstore using a transaction.
   * Return a list of store keys used to save the execution metadata.
   * @param tx
   * @param props
   * @param gc
   */
  public static async initApi(tx: KVStoreTx, props: PluginProps, gc: GC): Promise<IO> {
    const writer = new PluginPropsWriter();
    const builder = new FullPluginPropsBuilder(props);
    writer.load(builder);
    const keys = await writer.writeStore(tx);
    gc.record(keys);
    return { write: writer.stats()[0], read: 0 };
  }

  /**
   * @deprecated
   */
  public async prepareApiExecution(firstStepProps: PluginProps): Promise<void> {
    const writer = new PluginPropsWriter();
    const builder = new FullPluginPropsBuilder(firstStepProps);
    writer.load(builder);
    await writer.writeStore(this._kvStore);
  }

  public async execute(
    selector: Selector,
    request: ExecuteRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<ExecuteResponse>>> {
    request.props = _.pick(request.props, metaStore.getStreamProperties());
    return await this._observed<ExecuteResponse>(request, {
      ...selector,
      event: Event.EXECUTE,
      carrier
    });
  }

  public async metadata(
    selector: Selector,
    request: MetadataRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<MetadataResponse>>> {
    return await this._observed<MetadataResponse>(request, {
      ...selector,
      event: Event.METADATA,
      carrier
    });
  }

  public async test(
    selector: Selector,
    request: TestRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<TestResponse>>> {
    return await this._observed<TestResponse>(request, {
      ...selector,
      event: Event.TEST,
      carrier
    });
  }

  public async preDelete(
    selector: Selector,
    request: PreDeleteRequest,
    carrier?: Record<string, string>
  ): Promise<Wrapped<StepPerformance, Deferable<PreDeleteResponse>>> {
    return await this._observed<PreDeleteResponse>(request, {
      ...selector,
      event: Event.PRE_DELETE,
      carrier
    });
  }

  private async _observed<T extends ExecuteResponse | TestResponse | MetadataResponse | PreDeleteResponse>(
    _data: Request,
    _metadata: Metadata
  ): Promise<Wrapped<StepPerformance, Deferable<T>>> {
    const perf: StepPerformanceImpl = new StepPerformanceImpl({
      queueRequest: {
        start: micros(false)
      }
    });

    const {
      data,
      pinned
    }: Wrapped<StepPerformance, Deferable<T>> = await observe<Wrapped<StepPerformance, Deferable<T>>>(
      this._logger,
      perf.total,
      async (): Promise<Wrapped<StepPerformance, Deferable<T>>> => await this._do<T>(_data, _metadata)
    );

    return { data, pinned: perf.merge(pinned) };
  }

  private async _do<T extends ExecuteResponse | TestResponse | MetadataResponse | PreDeleteResponse>(
    data: Request,
    metadata: Metadata
  ): Promise<Wrapped<StepPerformance, Deferable<T>>> {
    const inbox = `INBOX.${randomUUID()}`;
    const subject: string = this._subject(metadata);
    const _logger = this._logger?.child({ subject, inbox, event: metadata.event });

    let messageID: string;
    let bytes: number;
    {
      try {
        _logger?.info('[BEFORE] publishing request');
        ({ result: messageID, bytes } = await this._publish<Returnable<Wrapped<Metadata, Request>>>(subject, {
          inbox,
          data: { pinned: metadata, data }
        }));
        _logger?.info('[AFTER] publishing request');
      } catch (err) {
        _logger?.error({ err }, 'could not publish request');
        return { data: { result: new Promise((_, reject) => reject(err)) } };
      }
    }

    let generic: Wrapped<Error, Wrapped<StepPerformance, Response>>;
    {
      try {
        _logger?.info('[BEFORE] waiting for response');
        generic = await this.wait(inbox);
        _logger?.info('[AFTER] waiting for response');
      } catch (err) {
        _logger?.error({ err }, 'could not receive reply from worker');
        return {
          data: {
            result: new Promise((_, reject) => reject(err))
          }
        };
      } finally {
        _logger?.info({ messageID }, 'purging message from stream');
        void this._purge(subject, messageID);
      }
    }

    generic.data.pinned.queueRequest.bytes = bytes;

    return {
      pinned: generic.data.pinned,
      data: {
        result: new Promise<T>((resolve, reject) => (generic.pinned ? reject(generic.pinned) : resolve(generic.data.data as T)))
      }
    };
  }

  /**
   * If {@param id} is provided, [XDEL {@param key} {@param id}] is invoked.
   * If not provided, [DEL {@param key}] is invoked.
   *
   * @param key
   * @param id
   */
  private async _purge(key: string, id?: string): Promise<void> {
    try {
      await (id ? this._redis.xDel(key, id) : this._redis.del(key));
    } catch (err) {
      this._logger?.error(
        { err, key, id },
        id
          ? 'could not purge item - this might cause unecessary backpressure on the stream'
          : 'could not purge item - this might cause the keyspace to grow unbounded'
      );
    }
  }

  private async _publish<T>(subject: string, data: T): Promise<{ result: string; bytes: number }> {
    let request: Buffer;
    {
      try {
        request = Buffer.from(JSON.stringify(data));
      } catch (err) {
        this._logger?.error({ err }, 'could not encode request');
        throw err;
      }
    }

    try {
      const result: string = await this._redis.xAdd(subject, '*', { data: request }, { NOMKSTREAM: true });

      if (result === null) {
        const err = new InternalError('stream does not exist');
        this._logger?.error({ err, stream: subject }, 'could not place request onto the stream');
        throw err;
      }

      return { result, bytes: request.byteLength };
    } catch (err) {
      this._logger?.error({ err }, 'could not publish request');
      throw err;
    }
  }

  private async xRead(client: RedisClientType, key: string, id: string, count: number, timeout: number, message: string): Promise<unknown> {
    let resp: unknown;

    try {
      resp = await client.xRead(
        { key, id },
        {
          COUNT: count,
          BLOCK: timeout
        }
      );
    } catch (err) {
      this._logger?.error({ err }, 'could not receive response');
      throw err;
    }

    if (!resp) {
      this._logger?.error({ timeout }, 'xRead timeout');
      throw new TimeoutError(message);
    }

    return resp;
  }

  public async wait(inbox: string, timeout?: number): Promise<Wrapped<Error, Wrapped<StepPerformance, Response>>> {
    let raw: unknown;
    {
      try {
        raw = await this._redis.executeIsolated(async (client: RedisClientType): Promise<unknown> => {
          await this.xRead(client, inbox, INBOX_START_ID, 1, this._ackTimeoutMs, 'We have not received an ACK from a worker.');
          this._logger?.info({ inbox }, 'recieved ack');
          return await this.xRead(
            client,
            inbox,
            INBOX_ACK_MESSAGE_ID,
            1,
            timeout || this._timeout,
            'We have not received a response from the worker.'
          );
        });
      } catch (err) {
        this._logger?.error({ err }, 'Error waiting for raw response from worker.');
        throw err;
      } finally {
        void this._purge(inbox);
      }
    }

    const responseEnd: number = micros(false);

    let response: string;
    {
      try {
        response = unpack(raw, this._logger)[0].message.data;
      } catch (err) {
        this._logger?.error({ err }, 'Error unpacking raw queue message.');
        throw err;
      }
    }

    let parsed: Wrapped<Error, Wrapped<StepPerformance, Response>>;
    try {
      parsed = JSON.parse(response);

      parsed.data.pinned.queueResponse.end = responseEnd;
      parsed.data.pinned.queueResponse.bytes = Buffer.byteLength(response);
    } catch (err) {
      this._logger?.error({ err }, 'could not decode response');
      throw err;
    }

    return parsed;
  }

  private _subject(metadata: Metadata): string {
    return `agent.main.bucket.${metadata.bucket}.plugin.${metadata.name}.event.${metadata.event}`;
  }
}
