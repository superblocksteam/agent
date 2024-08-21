import * as crypto from 'crypto';
// the following import is needed for jest (https://github.com/facebook/jest/issues/11629)
import { performance } from 'perf_hooks';
import { context as otelContext, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { Gauge } from 'prom-client';
import { getTagsFromContext } from '../../utils/tracing';
import { MultiMap } from './MultiMap';

// wrap a connection object together with some metadata
interface ConnectionContext<Conn> {
  conn: Conn;
  key: string;
  pool: ConnectionPool<Conn, unknown[]>;
  executionCount: number;
  createdAt: number; // timestamp in the monotonic clock

  // the values of all the following properties are only used when the connection is idle
  // so their values do not matter if the connection is not idle
  idleSince: number; // timestamp in the monotonic clock
  idleTimeoutId?: NodeJS.Timeout;
}

/** Options for ConnectionPool, passed to its constructor */
export interface ConnectionPoolOptions {
  connectionPoolCoordinator: ConnectionPoolCoordinator;
  idleTimeoutMs: number;
}

/** Methods passed to the connection pool by the plugin, so that the pool knows how to create/drestroy connections */
export interface ConnectionPoolFactory<Conn, CreateConnArgs extends unknown[]> {
  thisArg: unknown;
  createConnection: (...createConnArgs: CreateConnArgs) => Promise<Conn>;
  destroyConnection: (conn: Conn) => Promise<void>;
}

/**
 * A connection pool/cache. Each plugin should get its own private pool.
 * Pools need a pool coordinator to track the number of connections globally and enforce a global limit.
 * They are also responsible for enforcing a limit in the number of connections per datasource.
 */
export class ConnectionPool<Conn, CreateConnArgs extends unknown[]> {
  private readonly coordinator: ConnectionPoolCoordinator;
  private readonly idleTimeoutMs: number;
  private readonly factory: ConnectionPoolFactory<Conn, CreateConnArgs>;
  private isShuttingDown = false;
  // connCache only contains idle connections
  private readonly connCache = new MultiMap<string, ConnectionContext<Conn>>();

  private readonly tracer: Tracer;

  constructor(opts: ConnectionPoolOptions, factory: ConnectionPoolFactory<Conn, CreateConnArgs>) {
    this.coordinator = opts.connectionPoolCoordinator;
    this.idleTimeoutMs = opts.idleTimeoutMs;
    this.factory = factory;
    this.tracer = this.coordinator.tracer;
    this.coordinator.registerPool(this);
  }

  shutdown(): void {
    this.isShuttingDown = true;

    // remove connections first and then close them
    // closing connections is an async operation, so if we were to close them in the first loop, that could pontentially create a race
    const connections = new Set<Conn>();
    for (const [, context] of this.connCache) {
      connections.add(context.conn);
      this.coordinator.removeConnection(context);
    }
    this.connCache.clear();

    // close connections asynchronously
    (async () => {
      for (const conn of connections) {
        await this.destroyConnection(conn);
      }
    })();
  }

  private async getConnection(key: string, createConnArgs: CreateConnArgs): Promise<ConnectionContext<Conn>> {
    if (this.isShuttingDown) {
      throw new Error('The connection pool is shutting down, requesting new connections is not permitted');
    }
    const context = this.connCache.extractOne(key);
    return this.tracer.startActiveSpan(
      'connectionPool.getConnection',
      {
        attributes: {
          // if we found a context, there was a cache hit
          is_cached: !!context,
          ...getTagsFromContext(otelContext.active())
        }
      },
      async (span) => {
        try {
          if (context) {
            span.setAttributes({
              execution_count: context.executionCount,
              idle_for: performance.now() - context.idleSince
            });
            if (context.idleTimeoutId) clearTimeout(context.idleTimeoutId);
            this.coordinator.markConnectionBusy(context);
            span.setStatus({ code: SpanStatusCode.OK });
            return context;
          } else {
            const conn = await this.factory.createConnection.apply(this.factory.thisArg, createConnArgs);
            span.setStatus({ code: SpanStatusCode.OK });
            const context: ConnectionContext<Conn> = {
              conn,
              key,
              pool: this,
              createdAt: performance.now(),
              executionCount: 0,
              idleSince: 0 // the actual value does not matter since the connection is not in the cache (yet)
            };
            this.coordinator.addBusyConnection(context);
            return context;
          }
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  private async destroyConnection(conn: Conn) {
    try {
      this.factory.destroyConnection.call(this.factory.thisArg, conn);
    } catch {
      // ignore the error, the destoryConnection method in the plugin will handle this
    }
  }

  private releaseConnection(key: string, err: unknown, context: ConnectionContext<Conn>) {
    context.executionCount++;
    if (
      // if there was an error, destroy the connection since we cannot reliably tell if the connection is left in a good state
      err ||
      this.isShuttingDown ||
      this.idleTimeoutMs <= 0 ||
      this.coordinator.connectionCount > this.coordinator.maxConnections ||
      this.connCache.getCount(key) > this.coordinator.maxConnectionsPerKey
    ) {
      this.coordinator.removeConnection(context);
      // do not await for this, let the destruction happen in the background
      void this.destroyConnection(context.conn);
    } else {
      const idleTimeoutId = setTimeout(() => {
        this.connCache.delete(key, context);
        this.coordinator.removeConnection(context);
        // do not await for this, let the destruction happen in the background
        void this.destroyConnection(context.conn);
      }, this.idleTimeoutMs).unref();
      context.idleSince = performance.now();
      context.idleTimeoutId = idleTimeoutId;
      this.connCache.add(key, context);
      this.coordinator.markConnectionIdle(context);
    }
  }

  async withConnection<Ret>(
    /**
     * connectionConfiguration is any object that contains all the information that can be used to create a connection
     * If two connections have the same connectionConfiguration object then they are considered to be interchangeable
     */
    connectionConfiguration: unknown,
    createConnArgs: CreateConnArgs,
    cb: (conn: Conn) => Promise<Ret>
  ): Promise<Ret> {
    // We generate the key by hashing the JSON stringified version of connectionConfiguration.
    // This assumes that JSON.stringify will always serialize the same object in the same way.
    // Given that key traversal order in objects in JS is deterministic and that the configuration always comes from
    // the same source (DB), this assumption is true.
    const key = crypto.createHash('sha256').update(JSON.stringify(connectionConfiguration)).digest('base64');
    const context = await this.getConnection(key, createConnArgs);
    let ret: Ret;
    try {
      ret = await cb(context.conn);
    } catch (err) {
      this.releaseConnection(key, err, context);
      throw err;
    }
    this.releaseConnection(key, undefined, context);
    return ret;
  }

  async dropConnection(context: ConnectionContext<Conn>): Promise<void> {
    this.connCache.delete(context.key, context);
    await this.destroyConnection(context.conn);
  }
}

interface ConnectionPoolCoordinatorMetrics {
  poolConnectionsTotalGauge: Gauge;
  poolConnectionsIdleGauge: Gauge;
  poolConnectionsBusyGauge: Gauge;
}

export interface ConnectionPoolCoordinatorOptions {
  maxConnections: number;
  maxConnectionsPerKey: number;
  tracer: Tracer;
  metrics?: ConnectionPoolCoordinatorMetrics;
}

/**
 * A class that coordinates a set of pools, i.e. it ensures that:
 * 1) we don't exceed the maximum allowed number of total connections
 * 2) if a connection has to be closed, it will ask from the pool that holds the least recently used connection to close it
 */
export class ConnectionPoolCoordinator {
  private readonly pools = new Set<ConnectionPool<unknown, unknown[]>>();
  private readonly idleConnections = new Set<ConnectionContext<unknown>>();
  private readonly busyConnections = new Set<ConnectionContext<unknown>>();
  readonly maxConnections: number;
  readonly maxConnectionsPerKey: number;
  readonly tracer: Tracer;
  private readonly metrics: ConnectionPoolCoordinatorMetrics;

  constructor(opts: ConnectionPoolCoordinatorOptions) {
    this.maxConnections = opts.maxConnections;
    this.maxConnectionsPerKey = opts.maxConnectionsPerKey;
    this.tracer = opts.tracer;
    if (opts.metrics) {
      this.metrics = opts.metrics;
      this.updateMetrics();
    }
  }

  private updateMetrics() {
    if (this.metrics) {
      this.metrics.poolConnectionsTotalGauge.set(this.connectionCount);
      this.metrics.poolConnectionsIdleGauge.set(this.idleConnections.size);
      this.metrics.poolConnectionsBusyGauge.set(this.busyConnections.size);
    }
  }

  get connectionCount(): number {
    return this.idleConnections.size + this.busyConnections.size;
  }

  registerPool<Conn, CreateConnArgs extends unknown[]>(connectionPool: ConnectionPool<Conn, CreateConnArgs>): void {
    this.pools.add(connectionPool);
  }

  addBusyConnection<Conn>(context: ConnectionContext<Conn>): void {
    this.markConnectionBusy(context);
    // we added a new connection, we must ensure that we do not have too many connections
    this.closeExtraneous();
    this.updateMetrics();
  }

  markConnectionIdle<Conn>(context: ConnectionContext<Conn>): void {
    this.busyConnections.delete(context);
    this.idleConnections.add(context);
    this.updateMetrics();
  }

  markConnectionBusy<Conn>(context: ConnectionContext<Conn>): void {
    this.idleConnections.delete(context);
    this.busyConnections.add(context);
    this.updateMetrics();
  }

  removeConnection<Conn>(context: ConnectionContext<Conn>): void {
    this.idleConnections.delete(context);
    this.busyConnections.delete(context);
    this.updateMetrics();
  }

  /** Does not actually wait for the connections to be closed */
  private closeExtraneous(): void {
    const extraneousCount = this.connectionCount - this.maxConnections;
    if (extraneousCount <= 0) return;
    const removedConnections: ConnectionContext<unknown>[] = [];
    // we take advantage of the fact that the iterable instance of Set returns the elements in insertion order
    for (const context of this.idleConnections) {
      removedConnections.push(context);
      this.idleConnections.delete(context);
      if (removedConnections.length >= extraneousCount) break;
    }
    this.updateMetrics();
    // we destroy the connections in the background without waiting for this process to complete
    (async () => {
      for (const context of removedConnections) {
        await context.pool.dropConnection(context);
      }
    })();
  }

  shutdown(): void {
    for (const pool of this.pools) {
      pool.shutdown();
    }
  }
}
