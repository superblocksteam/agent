import { Closer, ConnectionPoolCoordinator, MaybeError } from '@superblocks/shared';
import pino from 'pino';
import {
  SUPERBLOCKS_CONNECTION_CACHE_MAX_CONCURRENT_CONNECTIONS,
  SUPERBLOCKS_CONNECTION_CACHE_MAX_CONNECTIONS_PER_DATASOURCE,
  SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST,
  SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS,
  SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE
} from './env';
import logger from './logger';
import { poolConnectionsBusyGauge, poolConnectionsIdleGauge, poolConnectionsTotalGauge } from './metrics';
import { load } from './plugin';
import { shutdown } from './runtime';
import { Shim } from './shim';
import { getTracer } from './tracer';
import { Event, ExecutionPoolOptions, ProcessOptions, RunFunc, TransportOptions } from './types';
import { Worker } from './worker';

export class Transport implements Closer {
  private _logger: pino.Logger;
  private _options: TransportOptions;
  private _worker: Closer;
  private _streams: string[];

  private constructor(options: TransportOptions) {
    this._options = options;
    this._streams = [];
    this._logger = logger.child({
      who: 'transport'
    });

    if (this._options.plugins.length === 0 || this._options.events.length === 0) {
      const error = 'a list of plugins and events is required';
      this._logger.error({ plugins: this._options.plugins, events: this._options.events }, error);
      throw Error(error);
    }
  }

  public streams(): string[] {
    return this._streams;
  }

  private static async initPluginsAndStreams(
    _instance: Transport,
    connectionPoolCoordinator: ConnectionPoolCoordinator
  ): Promise<Record<string, RunFunc>> {
    // computing the cross product of plugins and events
    const functions: Record<string, RunFunc> = {};
    {
      for (const pd of load(_instance._options.plugins)) {
        functions[pd.name] = (await Shim.init(pd, connectionPoolCoordinator, _instance._options.plugins, _instance._options.kvstore)).run;
        for (const event of _instance._options.events) {
          const stream = `agent.${_instance._options.agent}.bucket.${_instance._options.bucket}.plugin.${pd.name}.event.${event}`;
          _instance._streams.push(stream);
          try {
            await _instance._options.queue.xGroupCreate(stream, _instance._options.group, '0', { MKSTREAM: true });
            _instance._logger.debug({ stream }, 'created stream');
          } catch (err) {
            // TODO(frank): I don't think Redis types their errors
            if (err.message !== 'BUSYGROUP Consumer Group name already exists') {
              _instance._logger.error({ err }, 'could not connect to consumer group');
              throw err;
            }
            _instance._logger.debug({ stream }, 'verified stream');
          }
        }
      }

      _instance._logger.info({ streams: _instance._streams }, 'Worker starts listening to streams.');
    }

    return functions;
  }

  static async init(options: TransportOptions): Promise<Transport> {
    const connectionPoolCoordinator = new ConnectionPoolCoordinator({
      maxConnections: SUPERBLOCKS_CONNECTION_CACHE_MAX_CONCURRENT_CONNECTIONS,
      maxConnectionsPerKey: SUPERBLOCKS_CONNECTION_CACHE_MAX_CONNECTIONS_PER_DATASOURCE,
      tracer: getTracer(),
      metrics: {
        poolConnectionsTotalGauge,
        poolConnectionsIdleGauge,
        poolConnectionsBusyGauge
      }
    });

    const _instance: Transport = new Transport(options);

    const functions = await Transport.initPluginsAndStreams(_instance, connectionPoolCoordinator);

    const executionPoolOptions: ExecutionPoolOptions = { enabled: false, poolSize: 0 };

    if (_instance._options.events.includes(Event.EXECUTE) && _instance._options.plugins['sb-javascript'] !== undefined) {
      if (SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE <= 0) {
        _instance._logger.warn('invalid value supplied for pool size');
        throw Error('invalid value supplied for pool size');
      }

      if (_instance._options.batch > SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE) {
        _instance._logger.warn('batch size is larger than execution pool size, this may cause performance issues');
      }

      executionPoolOptions.enabled = true;
      executionPoolOptions.poolSize = SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE;
      executionPoolOptions.kvStore = _instance._options.kvstore;
      executionPoolOptions.defaultExecutionTimeoutMs = SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS;
      executionPoolOptions.executionEnvInclusionList = SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST.split(',').map((envVar: string) =>
        envVar.trim()
      );
    }

    _instance._worker = await Worker.init(
      {
        name: _instance._options.name,
        group: _instance._options.group,
        keys: _instance._streams,
        client: _instance._options.queue,
        executors: functions,
        ...(options as ProcessOptions)
      },
      executionPoolOptions
    );

    return _instance;
  }

  public async close(reason: string): Promise<MaybeError> {
    const { _logger, _worker } = this;

    _logger.info({ reason }, 'shutdown request received');

    await shutdown(reason, _worker);
  }
}
