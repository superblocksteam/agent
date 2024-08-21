/**
 * @jest-environment node
 */

import { trace } from '@opentelemetry/api';
import { Gauge } from 'prom-client';
import { ConnectionPool, ConnectionPoolCoordinator, ConnectionPoolCoordinatorOptions, ConnectionPoolOptions } from '.';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_CONNECTIONS = 10;

function createFakeGauge(): Gauge {
  return {
    set() {
      /* do nothing */
    }
  } as unknown as Gauge;
}

function createFakePoolMetrics() {
  return {
    poolConnectionsTotalGauge: createFakeGauge(),
    poolConnectionsIdleGauge: createFakeGauge(),
    poolConnectionsBusyGauge: createFakeGauge()
  };
}

function createMockPoolCoordinator(opts?: Partial<ConnectionPoolCoordinatorOptions>) {
  return new ConnectionPoolCoordinator({
    maxConnections: DEFAULT_MAX_CONNECTIONS,
    maxConnectionsPerKey: 3,
    // create a dummy tracer
    tracer: trace.getTracer('connection-pool'),
    metrics: createFakePoolMetrics(),
    ...opts
  });
}

type MockConnection = symbol;

class ConnectionManager {
  connections = new Set<MockConnection>();

  async createConnection(): Promise<MockConnection> {
    const conn = Symbol();
    this.connections.add(conn);
    return conn;
  }

  async destroyConnection(conn: MockConnection): Promise<void> {
    this.connections.delete(conn);
  }
}

function createMockPool(manager: ConnectionManager = new ConnectionManager(), opts?: Partial<ConnectionPoolOptions>) {
  return new ConnectionPool(
    {
      connectionPoolCoordinator: createMockPoolCoordinator(),
      idleTimeoutMs: DEFAULT_TTL_MS,
      ...opts
    },
    {
      thisArg: manager,
      createConnection: manager.createConnection,
      destroyConnection: manager.destroyConnection
    }
  );
}

jest.useFakeTimers();

describe('Connection pool', () => {
  test('basic connection pooling', async () => {
    const manager = new ConnectionManager();
    const pool = createMockPool(manager);
    expect(manager.connections.size).toBe(0);

    let conn1: MockConnection;
    await pool.withConnection('test1', [], async (conn) => {
      conn1 = conn;
      expect(manager.connections.size).toBe(1);
    });
    expect(manager.connections.size).toBe(1);

    // should reuse the existing connection for test1
    await pool.withConnection('test1', [], async (conn) => {
      expect(manager.connections.size).toBe(1);
      expect(conn === conn1).toBeTruthy();
    });
    expect(manager.connections.size).toBe(1);

    // should create a new connection for test2
    await pool.withConnection('test2', [], async () => {
      expect(manager.connections.size).toBe(2);
    });
    expect(manager.connections.size).toBe(2);

    jest.advanceTimersByTime(DEFAULT_TTL_MS);
    expect(manager.connections.size).toBe(0);
  });

  test('exceed capacity', async () => {
    const manager = new ConnectionManager();
    const pool = createMockPool(manager);

    let conn0: MockConnection;
    await pool.withConnection('test-0', [], async (conn) => {
      conn0 = conn;
    });

    // create more connections until we have reached DEFAULT_MAX_CONNECTIONS
    for (let i = DEFAULT_MAX_CONNECTIONS - manager.connections.size; i > 0; i--) {
      await pool.withConnection(`test-${i}`, [], async () => {
        /* do nothing */
      });
    }
    expect(manager.connections.size).toBe(DEFAULT_MAX_CONNECTIONS);
    // conn0 is still open
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(manager.connections.has(conn0!)).toBeTruthy();

    // create one more connection
    await pool.withConnection('test-more', [], async () => {
      expect(manager.connections.size).toBe(DEFAULT_MAX_CONNECTIONS);
      // conn0, which was the least recently used connection, must be closed
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(manager.connections.has(conn0!)).toBeFalsy();
    });

    jest.advanceTimersByTime(DEFAULT_TTL_MS);
    expect(manager.connections.size).toBe(0);
  });

  test('exceed capacity while all connections are busy', async () => {
    const manager = new ConnectionManager();
    const pool = createMockPool(manager);

    // create DEFAULT_MAX_CONNECTIONS connections without waiting for the tasks to complete, so that they are all busy
    const promises: Promise<void>[] = [];
    for (let i = DEFAULT_MAX_CONNECTIONS - manager.connections.size; i > 0; i--) {
      promises.push(
        pool.withConnection(`test-${i}`, [], async () => {
          /* do nothing */
        })
      );
    }
    expect(manager.connections.size).toBe(DEFAULT_MAX_CONNECTIONS);

    // create one more connection
    await pool.withConnection('test-more', [], async () => {
      // we are temporarily exceeding the capacity of the pool
      expect(manager.connections.size).toBe(DEFAULT_MAX_CONNECTIONS + 1);
    });
    // the extra connection will be closed immediately
    expect(manager.connections.size).toBe(DEFAULT_MAX_CONNECTIONS);

    // wait for all tasks
    await Promise.all(promises);

    jest.advanceTimersByTime(DEFAULT_TTL_MS);
    expect(manager.connections.size).toBe(0);
  });

  test('connection task throws exception', async () => {
    const manager = new ConnectionManager();
    const pool = createMockPool(manager);

    await expect(async () => {
      await pool.withConnection('test1', [], async () => {
        expect(manager.connections.size).toBe(1);
        throw new Error();
      });
    }).rejects.toThrow();
    // the connection is dropped
    expect(manager.connections.size).toBe(0);
  });

  test('requesting a connection after shutting down the pool', async () => {
    const pool = createMockPool();

    pool.shutdown();
    await expect(async () => {
      await pool.withConnection('test1', [], async () => {
        // do nothing
      });
    }).rejects.toThrow();
  });
});
