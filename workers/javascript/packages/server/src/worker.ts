import { context as ctx, propagation, ROOT_CONTEXT, SpanKind } from '@opentelemetry/api';
import { commandOptions } from '@redis/client';
import { Closer, MaybeError } from '@superblocks/shared';
import { Logger } from 'pino';
import { ExecutionPoolImpl } from './language-step-executor/executionPool';
import { JsLanguageStepExecutor } from './language-step-executor/jsLanguageStepExecutor';
import logger from './logger';
import { workerIdleMillisecondsCounter } from './metrics';
import { StepPerformanceImpl } from './performance/step';
import { StepPerformance } from './performance/types';
import { micros, millis } from './performance/utils';
import { shutdown } from './runtime';
import { getBaggageAsObjFromCarrier, getTracer, OBS_CORRELATION_ID_TAG } from './tracer';
import {
  Error,
  Event,
  ExecuteRequest,
  ExecutionPoolOptions,
  INBOX_ACK_MESSAGE_ID,
  INBOX_DATA_MESSAGE_ID,
  Metadata,
  RedisMessage,
  Request,
  Response,
  Returnable,
  WorkerOptions,
  Wrapped
} from './types';
import { spanned, unpack, withJitter } from './utils';

export class Worker implements Closer {
  private _alive: boolean;
  private _logger: Logger;
  private _options: WorkerOptions;
  private _javascriptExecutor: JsLanguageStepExecutor;
  private _usePool: boolean;
  private _me: Promise<void>;

  constructor(opts: WorkerOptions, javascriptExecutor: JsLanguageStepExecutor) {
    this._options = opts;
    this._javascriptExecutor = javascriptExecutor;

    this._logger = logger.child({
      who: 'worker'
    });

    this._alive = true;
  }

  static async init(opts: WorkerOptions, poolOpts?: ExecutionPoolOptions): Promise<Worker> {
    const poolOptions = poolOpts ?? { enabled: false, poolSize: 0 };

    let javascriptExecutor: JsLanguageStepExecutor;
    if (poolOptions.enabled) {
      const execPool = await ExecutionPoolImpl.init(poolOptions, logger);
      javascriptExecutor = JsLanguageStepExecutor.init(
        poolOptions.kvStore,
        execPool,
        poolOptions.defaultExecutionTimeoutMs,
        logger,
        getTracer()
      );
    }

    const _instance: Worker = new Worker(opts, javascriptExecutor);
    _instance._usePool = poolOptions.enabled;

    // NOTE(frank): do not await
    _instance._me = _instance.run();
    return _instance;
  }

  private async run(): Promise<void> {
    const streams: Array<{ key: string; id: string }> = this._options.keys.map((key: string) => ({ key, id: '>' }));
    while (this._alive) {
      const startTime = millis(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let next: any;
      {
        try {
          next = await this._options.client.xReadGroup(
            commandOptions({
              isolated: true
            }),
            this._options.group,
            this._options.name,
            streams,
            {
              COUNT: this._options.batch,
              BLOCK: withJitter(this._options.block, Math.ceil(this._options.block * 1.5))
            }
          );
        } catch (err) {
          if (this._alive) {
            this._logger.error({ err }, 'could not perform XREADGROUP');
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }
      }

      if (!next) {
        if (this._options.sync) {
          workerIdleMillisecondsCounter.inc(millis(true) - startTime);
        }
        continue;
      } // read timed out

      let messages: RedisMessage[];
      {
        try {
          messages = unpack(next);
          this._logger.debug({ messages: messages.length }, 'received messages from the queue');
        } catch (err) {
          this._logger.warn({ err }, 'potential issue with returned redis message');
          continue;
        }
      }

      for (const msg of messages) {
        if (this._options.sync) {
          await this._unload(msg, streams[msg.idx].key);
        } else {
          void this._unload(msg, streams[msg.idx].key);
        }
      }
    }
  }

  private async _executeStep(request: Returnable<Wrapped<Metadata, Request>>, perf: StepPerformanceImpl): Promise<Response> {
    const observabilityTags = getBaggageAsObjFromCarrier(request.data?.pinned?.carrier || {});

    if (this._usePool && request.data.pinned.name === 'javascript' && request.data.pinned.event === Event.EXECUTE) {
      return await this._javascriptExecutor.ExecuteStep(request.data.data as ExecuteRequest, observabilityTags, perf);
    }

    return await this._options.executors[request.data.pinned.name]({
      event: request.data.pinned.event,
      perf,
      request: request.data.data,
      send: async (_message: unknown): Promise<void> => {
        // Unlike Redis Streams, a Redis Pub/Sub channel name can be the same as an existing key name.
        await this._send(request.topic || 'deadletter', _message);
      },
      until: this._until(request.topic),
      observabilityTags
    });
  }

  private async _unload({ id, message }: RedisMessage, stream: string): Promise<void> {
    const ack: Promise<void> = this._options.client.xAck(stream, this._options.group, id);

    try {
      if (!('data' in message)) {
        throw Error('message is malformed');
      }
      await this._process(message.data);
    } catch (err) {
      this._logger.error({ err }, 'could not process message');
    }

    try {
      // We don't really care to wait for the ack before processing.
      // By the time we're done processing, it should be done.
      await ack;
    } catch (err) {
      this._logger.error({ err }, 'could not ack message');
    }
  }

  /**
   * Processes a message with the follwoing logic:
   *
   *   [DECODE] Attempts to decode the message. If the decoding fails
   *            but the message implements {@link Inbox}, no error is thrown.
   *
   *      [RUN] Executes {@link Plugin.run}. This method is not expected
   *            to throw.
   *
   *   [ENCODE] Encodes the result. If an exception is thrown, we encode
   *            a static error.
   *
   *  [PUBLISH] Publish the encoded result to the provided {@link Inbox}
   *
   * @param message
   * @param plugin
   *
   * @throws If the decoding fails and the
   * @throws If we unable to publish the result to the {@link Inbox
   *
   */
  private async _process(message: string): Promise<void> {
    const perf: StepPerformanceImpl = new StepPerformanceImpl({
      queueRequest: {
        end: micros(false)
      }
    });

    let request: Returnable<Wrapped<Metadata, Request>>;
    {
      try {
        request = this._decode<Wrapped<Metadata, Request>>(message);
      } catch (err) {
        this._logger.error({ err }, 'decode failed with no inbox');
        throw err;
      }
    }

    // TODO(bruce): wrap this in a retry
    try {
      await this._options.client.xAdd(request.inbox, INBOX_ACK_MESSAGE_ID, 'ack');
      this._logger.debug({ inbox: request.inbox }, 'ack message');
    } catch (err) {
      this._logger.error({ err, inbox: request.inbox }, 'dropping request due to ack failure');
      throw err;
    }

    const _logger: Logger = this._logger.child({
      inbox: request.inbox,
      plugin: request.data?.pinned?.name,
      event: request.data?.pinned?.event,
      [OBS_CORRELATION_ID_TAG]: (request.data?.data as ExecuteRequest)?.props?.executionId
    });
    const result: Wrapped<Error, Wrapped<StepPerformance, Response>> = {
      data: {
        pinned: perf,
        data: {}
      }
    };

    try {
      _logger.debug('executing request');

      result.data.data = await ctx.with(
        propagation.extract(ROOT_CONTEXT, request.data?.pinned?.carrier || {}),
        async (): Promise<Response> =>
          await spanned<Response>(
            getTracer(),
            `execute.step.${request.data.pinned.name}`,
            SpanKind.INTERNAL,
            async (): Promise<Response> => await this._executeStep(request, perf)
          )
      );

      _logger.debug('executed request');
    } catch (err) {
      _logger.error({ err: err.message, type: err.name, stack: err.stack }, 'error executing request');
      result.pinned = {
        name: err.name,
        message: err.message
      };
    }

    let encoded: Uint8Array;
    {
      try {
        result.data.pinned.queueResponse = { start: micros(false) };
        encoded = Buffer.from(JSON.stringify(result));
      } catch (err) {
        _logger.error({ err }, 'could not encode response');
        encoded = Buffer.from(JSON.stringify({ err: Error('could not encode response') }));
      }
    }

    try {
      _logger.debug('[BEFORE] publishing response');
      await this._options.client.xAdd(request.inbox, INBOX_DATA_MESSAGE_ID, { data: encoded }, { NOMKSTREAM: true });
      _logger.debug('[AFTER] publishing response');
    } catch (err) {
      _logger.error({ err }, '[ERROR] publishing response');
      throw err;
    }
  }

  private async _send(_topic: string, _data: unknown): Promise<void> {
    try {
      if ((await this._options.client.publish(_topic, JSON.stringify(_data))) === 0) {
        this._logger.error({ topic: _topic }, 'successfully sent stream event was not received due to no subscribers');
      }
    } catch (err) {
      this._logger.error({ topic: _topic, err }, 'could not send stream event from worker');
    }
  }

  /**
   * If a topic is provided, this function will return a {@link UtilFunc}
   * that does not return until the provided topic has no subscribers. This
   * gives streamable plugins that run forever (i.e. Kafka) a way to shutdown
   * gracefully if the client is no longer around. We can optionall introduce
   * another way to gracefully shutdown (i.e. propogating a message) but this
   * logic will still be needed to gracefully shutdown streamable plugins if
   * the client is non-gracefully shutdown or a network brownout occurs.
   *
   * @param topic The redis pub/sub channel.
   * @returns An optional {@link UntilFunc}.
   */
  private _until(topic?: string): () => Promise<void> {
    if (!topic) {
      return undefined;
    }

    return async (): Promise<void> => {
      for (;;) {
        const subscribers = await this._options.client.pubSubNumSub(topic);

        if (!subscribers || !subscribers[topic] || subscribers.topic === 0) {
          return;
        }

        // NOTE(frank): We can make this interval configurable in the future if we need to.
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    };
  }

  private _decode<T>(buf: string): Returnable<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(buf);
    } catch (err) {
      this._logger.error({ err }, 'could not parse message');
      throw err;
    }

    if ('inbox' in parsed) {
      return { inbox: parsed.inbox, topic: parsed.topic, data: parsed.data };
    }

    throw new Error('message is not returnable');
  }

  public async close(reason?: string): Promise<MaybeError> {
    const { group, name } = this._options;

    this._alive = false;
    await this._me;

    await Promise.all(
      this._options.keys.map(async (stream: string): Promise<void> => {
        try {
          await this._options.client.xGroupDelConsumer(stream, group, name);
        } catch (err) {
          this._logger.info({ err, reason, stream }, 'could not delete consumer');
          return err;
        }
      })
    );

    // Shutdown the JavaScript executor's execution pool because we created it (and thus own its lifecycle)
    await shutdown(reason, this._javascriptExecutor.executionPool);

    this._logger.info({ reason }, 'successfully shutdown worker');
  }
}
