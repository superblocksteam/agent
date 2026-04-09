import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { ExecutionContext, WorkerPool } from '@superblocks/shared';

import JavascriptWasmPlugin from './index';

class MockKVStore {
  public async read(_keys: string[]): Promise<{ data: unknown[] }> {
    return { data: [] };
  }

  public async write(_key: string, _value: unknown): Promise<void> {
    return;
  }

  public async writeMany(_payload: { key: string; value: unknown }[]): Promise<void> {
    return;
  }

  public async delete(_keys: string[]): Promise<void> {
    return;
  }

  public async close(_reason: string | undefined): Promise<void> {
    return;
  }
}

describe('JavascriptWasmPlugin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses configured timeout with underscores', async () => {
    const plugin = new JavascriptWasmPlugin();
    const pluginWithConfig = plugin as unknown as {
      pluginConfiguration: { javascriptExecutionTimeoutMs?: string };
    };
    pluginWithConfig.pluginConfiguration = { javascriptExecutionTimeoutMs: '1_234' };

    const executeInWorkerPoolSpy = jest
      .spyOn(WorkerPool, 'ExecuteInWorkerPool')
      .mockResolvedValue({ output: 1 } as Awaited<ReturnType<typeof WorkerPool.ExecuteInWorkerPool>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
      datasourceConfiguration: {}
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerPoolSpy).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ executionTimeout: 1234 }) })
    );
  });

  it('falls back to default timeout when config is invalid', async () => {
    const plugin = new JavascriptWasmPlugin();
    const pluginWithConfig = plugin as unknown as {
      pluginConfiguration: { javascriptExecutionTimeoutMs?: string };
    };
    pluginWithConfig.pluginConfiguration = { javascriptExecutionTimeoutMs: 'not-a-number' };

    const executeInWorkerPoolSpy = jest
      .spyOn(WorkerPool, 'ExecuteInWorkerPool')
      .mockResolvedValue({ output: 1 } as Awaited<ReturnType<typeof WorkerPool.ExecuteInWorkerPool>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
      datasourceConfiguration: {}
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerPoolSpy).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ executionTimeout: 1_200_000 }) })
    );
  });

  it('prefers quotas.duration over configured timeout', async () => {
    const plugin = new JavascriptWasmPlugin();
    const pluginWithConfig = plugin as unknown as {
      pluginConfiguration: { javascriptExecutionTimeoutMs?: string };
    };
    pluginWithConfig.pluginConfiguration = { javascriptExecutionTimeoutMs: '2000' };

    const executeInWorkerPoolSpy = jest
      .spyOn(WorkerPool, 'ExecuteInWorkerPool')
      .mockResolvedValue({ output: 1 } as Awaited<ReturnType<typeof WorkerPool.ExecuteInWorkerPool>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
      datasourceConfiguration: {},
      quotas: { duration: 3210 }
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerPoolSpy).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ executionTimeout: 3210 }) })
    );
  });
});
