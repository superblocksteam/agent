import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';

import { ErrorCode, IntegrationError } from '../../errors';
import { ExecutionContext, ExecutionOutput } from '../../types';
import { WorkerPool } from './pool';
import { PoolVariableServer } from './pool-variable-server';
import type { WorkerTaskInput } from './types';

const mockRun = jest.fn<(input: unknown, options: unknown) => Promise<string>>();
const mockDestroy = jest.fn<() => Promise<void>>();

jest.mock('piscina', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    run: mockRun,
    destroy: mockDestroy
  }))
}));

class MockKVStore {
  private _store: Record<string, unknown> = {};
  fetchFileCallback?: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;

  async read(keys: string[]): Promise<{ data: unknown[] }> {
    return { data: keys.map((k) => this._store[k]) };
  }

  async write(key: string, value: unknown): Promise<void> {
    this._store[key] = value;
  }

  async writeMany(payload: Array<{ key: string; value: unknown }>): Promise<void> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
  }

  async delete(_keys: string[]): Promise<void> {
    // no-op
  }

  async close(_reason: string | undefined): Promise<void> {
    // no-op
  }
}

function createInput(overrides?: Partial<WorkerTaskInput>): WorkerTaskInput {
  const kvStore = new MockKVStore();
  const base: WorkerTaskInput = {
    context: {
      globals: {},
      variables: {},
      kvStore
    } as unknown as ExecutionContext,
    code: 'return 1;',
    executionTimeout: 5000
  };
  return { ...base, ...overrides } as WorkerTaskInput;
}

describe('WorkerPool', () => {
  const POOL_NAME = 'test';

  beforeAll(() => {
    WorkerPool.configure({ name: POOL_NAME, filename: '/tmp/bootstrap.js' });
  });

  afterEach(() => {
    mockRun.mockReset();
    mockDestroy.mockReset();
  });

  describe('ExecuteInWorkerPool', () => {
    it('returns ExecutionOutput from worker JSON result', async () => {
      mockRun.mockResolvedValue('{"output":42}');

      const result = await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput()
      });

      expect(result).toBeInstanceOf(ExecutionOutput);
      expect(result.output).toBe(42);
    });

    it('passes context without kvStore to the worker', async () => {
      mockRun.mockImplementation((workerInput: unknown) => {
        const input = workerInput as { context?: { kvStore?: unknown } };
        expect(input).toHaveProperty('context');
        expect(input.context).not.toHaveProperty('kvStore');
        return Promise.resolve('{}');
      });

      await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput()
      });

      expect(mockRun).toHaveBeenCalledTimes(1);
      const callArgs = mockRun.mock.calls[0];
      expect(callArgs).toBeDefined();
      const workerInput = callArgs?.[0] as { context?: { kvStore?: unknown } };
      expect(workerInput?.context).toEqual({
        globals: {},
        variables: {}
      });
    });

    it('sets useSandboxFileFetcher true when kvStore has fetchFileCallback', async () => {
      const kvStore = new MockKVStore();
      kvStore.fetchFileCallback = (_path, cb) => cb(null, Buffer.from('data'));

      mockRun.mockImplementation((workerInput: unknown) => {
        expect((workerInput as { useSandboxFileFetcher?: boolean }).useSandboxFileFetcher).toBe(true);
        return Promise.resolve('{}');
      });

      await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput({
          context: { globals: {}, variables: {}, kvStore } as unknown as ExecutionContext
        })
      });

      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({ useSandboxFileFetcher: true }), expect.any(Object));
    });

    it('sets useSandboxFileFetcher false when kvStore lacks fetchFileCallback', async () => {
      mockRun.mockImplementation((workerInput: unknown) => {
        expect((workerInput as { useSandboxFileFetcher?: boolean }).useSandboxFileFetcher).toBe(false);
        return Promise.resolve('{}');
      });

      await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput()
      });

      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({ useSandboxFileFetcher: false }), expect.any(Object));
    });

    it('converts AbortError to IntegrationError with timeout message', async () => {
      const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
      mockRun.mockRejectedValue(abortErr);

      const err = await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput({ executionTimeout: 100 }),
        pluginName: 'javascript-wasm'
      }).catch((e) => e);

      expect(err).toBeInstanceOf(IntegrationError);
      expect(err.message).toBe('[AbortError] Timed out after 100ms');
      expect((err as IntegrationError).code).toBe(ErrorCode.INTEGRATION_QUERY_TIMEOUT);
      expect((err as IntegrationError).internalCode?.pluginName).toBe('javascript-wasm');
    });

    it('re-throws non-AbortError', async () => {
      const otherErr = new Error('something else');
      mockRun.mockRejectedValue(otherErr);

      await expect(
        WorkerPool.ExecuteInWorkerPool({
          poolName: POOL_NAME,
          input: createInput()
        })
      ).rejects.toThrow('something else');
    });

    it('closes variableServer in finally block', async () => {
      const closeSpy = jest.spyOn(PoolVariableServer.prototype, 'close');

      mockRun.mockResolvedValue('{}');
      await WorkerPool.ExecuteInWorkerPool({ poolName: POOL_NAME, input: createInput() });
      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });

    it('closes variableServer in finally when run throws', async () => {
      const closeSpy = jest.spyOn(PoolVariableServer.prototype, 'close');
      mockRun.mockRejectedValue(new Error('worker failed'));

      await expect(WorkerPool.ExecuteInWorkerPool({ poolName: POOL_NAME, input: createInput() })).rejects.toThrow('worker failed');
      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });

    it('passes executionTimeout and files to the worker', async () => {
      mockRun.mockResolvedValue('{}');

      await WorkerPool.ExecuteInWorkerPool({
        poolName: POOL_NAME,
        input: createInput({
          code: 'return x;',
          executionTimeout: 3000,
          files: [{ path: '/files/foo.js', contents: '// code' }]
        })
      });

      expect(mockRun).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'return x;',
          executionTimeout: 3000,
          files: [{ path: '/files/foo.js', contents: '// code' }]
        }),
        expect.any(Object)
      );
    });
  });

  describe('shutdown', () => {
    it('calls pool.destroy', async () => {
      mockDestroy.mockResolvedValue(undefined);
      // No active tasks - shutdown should resolve when getTasksCount becomes 0
      // The interval checks every 1s; after destroy(), active tasks drain. We have 0.
      const shutdownPromise = WorkerPool.shutdown(POOL_NAME);
      // Give the interval a chance to run
      await new Promise((r) => setTimeout(r, 1100));
      await shutdownPromise;
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
