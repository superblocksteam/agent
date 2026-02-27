import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import JavascriptWasmPlugin from './index';
import { WorkerPool } from './pool';

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

class MockKVStoreWithFileFetch extends MockKVStore {
  public fetchFileCallback(_path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
    callback(null, Buffer.from('ok'));
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

    const executeInWorkerSpy = jest
      .spyOn(plugin, 'executeInWorker')
      .mockResolvedValue({ output: 1 } as unknown as Awaited<ReturnType<typeof plugin.executeInWorker>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerSpy).toHaveBeenCalledWith(expect.objectContaining({ executionTimeout: 1234 }));
  });

  it('falls back to default timeout when config is invalid', async () => {
    const plugin = new JavascriptWasmPlugin();
    const pluginWithConfig = plugin as unknown as {
      pluginConfiguration: { javascriptExecutionTimeoutMs?: string };
    };
    pluginWithConfig.pluginConfiguration = { javascriptExecutionTimeoutMs: 'not-a-number' };

    const executeInWorkerSpy = jest
      .spyOn(plugin, 'executeInWorker')
      .mockResolvedValue({ output: 1 } as unknown as Awaited<ReturnType<typeof plugin.executeInWorker>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerSpy).toHaveBeenCalledWith(expect.objectContaining({ executionTimeout: 1_200_000 }));
  });

  it('prefers quotas.duration over configured timeout', async () => {
    const plugin = new JavascriptWasmPlugin();
    const pluginWithConfig = plugin as unknown as {
      pluginConfiguration: { javascriptExecutionTimeoutMs?: string };
    };
    pluginWithConfig.pluginConfiguration = { javascriptExecutionTimeoutMs: '2000' };

    const executeInWorkerSpy = jest
      .spyOn(plugin, 'executeInWorker')
      .mockResolvedValue({ output: 1 } as unknown as Awaited<ReturnType<typeof plugin.executeInWorker>>);

    await plugin.execute({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      actionConfiguration: { body: 'return 1;' },
      quotas: { duration: 3210 }
    } as unknown as Parameters<typeof plugin.execute>[0]);

    expect(executeInWorkerSpy).toHaveBeenCalledWith(expect.objectContaining({ executionTimeout: 3210 }));
  });

  it('derives useSandboxFileFetcher from kvStore capability', async () => {
    const plugin = new JavascriptWasmPlugin();
    const runSpy = jest.spyOn(WorkerPool, 'run').mockResolvedValue('{}');

    await plugin.executeInWorker({
      context: { globals: {}, variables: {}, kvStore: new MockKVStoreWithFileFetch() } as unknown as ExecutionContext,
      code: 'return null',
      executionTimeout: 10000
    });

    await plugin.executeInWorker({
      context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
      code: 'return null',
      executionTimeout: 10000
    });

    expect(runSpy).toHaveBeenCalledTimes(2);
    expect((runSpy.mock.calls[0]?.[0] as { useSandboxFileFetcher?: boolean })?.useSandboxFileFetcher).toBe(true);
    expect((runSpy.mock.calls[1]?.[0] as { useSandboxFileFetcher?: boolean })?.useSandboxFileFetcher).toBe(false);
  });

  it('converts AbortError into timeout IntegrationError', async () => {
    const plugin = new JavascriptWasmPlugin();
    jest.spyOn(WorkerPool, 'run').mockRejectedValue(Object.assign(new Error('aborted by hard timeout'), { name: 'AbortError' }));

    await expect(
      plugin.executeInWorker({
        context: { globals: {}, variables: {}, kvStore: new MockKVStore() } as unknown as ExecutionContext,
        code: 'while(true) {}',
        executionTimeout: 10
      })
    ).rejects.toThrow('[AbortError] Timed out after 10ms');
  });
});
