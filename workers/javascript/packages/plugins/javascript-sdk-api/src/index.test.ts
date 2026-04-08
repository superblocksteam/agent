import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, ExecutionOutput, IntegrationError, WorkerPool } from '@superblocks/shared';

import JavascriptSdkApiPlugin from './index';

describe('JavascriptSdkApiPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('passes files to WorkerPool.ExecuteInWorkerPool', async () => {
    const output = new ExecutionOutput();
    output.output = { ok: true };

    const executeSpy = jest.spyOn(WorkerPool, 'ExecuteInWorkerPool').mockResolvedValue(output);

    const context = new ExecutionContext();
    context.globals = {
      SampleFiles: {
        files: [
          {
            $superblocksId: 'upload-1',
            encoding: 'text',
            extension: 'txt',
            name: 'demo.txt',
            size: 25,
            type: 'text/plain'
          }
        ]
      }
    };
    context.kvStore = {
      read: async () => ({ data: [] }),
      write: async () => undefined,
      writeMany: async () => undefined
    } as never;
    context.variables = {};

    const plugin = new JavascriptSdkApiPlugin();
    await plugin.execute({
      actionConfiguration: { body: 'return true;' } as never,
      context: context as never,
      files: [
        {
          originalname: 'upload-1',
          path: '/tmp/upload-1'
        }
      ] as never
    } as never);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const call = executeSpy.mock.calls[0][0];
    expect(call.input.files).toEqual([
      {
        originalname: 'upload-1',
        path: '/tmp/upload-1'
      }
    ]);
    expect(call.poolName).toBe('JavaScript SDK API');
    expect(call.input.code).toBe('return true;');
  });

  it('passes integrationExecutor and includeDiagnostics', async () => {
    const output = new ExecutionOutput();
    output.output = {};

    const executeSpy = jest.spyOn(WorkerPool, 'ExecuteInWorkerPool').mockResolvedValue(output);

    const mockExecutor = {
      executeIntegration: jest.fn()
    };

    const context = new ExecutionContext();
    context.globals = {};
    context.kvStore = {
      read: async () => ({ data: [] }),
      write: async () => undefined,
      writeMany: async () => undefined
    } as never;
    context.variables = {};
    context.integrationExecutor = mockExecutor as never;
    context.includeDiagnostics = true;

    const plugin = new JavascriptSdkApiPlugin();
    await plugin.execute({
      actionConfiguration: { body: 'return {};' } as never,
      context: context as never
    } as never);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const call = executeSpy.mock.calls[0][0];
    expect(call.integrationExecutor).toBe(mockExecutor);
    expect(call.includeDiagnostics).toBe(true);
  });

  it('returns error output when no code provided', async () => {
    const plugin = new JavascriptSdkApiPlugin();
    const result = await plugin.execute({
      actionConfiguration: { body: '' } as never,
      context: new ExecutionContext() as never
    } as never);

    expect(result.error).toContain('No code provided');
  });

  it('returns error output when kvStore is missing', async () => {
    const context = new ExecutionContext();
    context.kvStore = undefined;

    const plugin = new JavascriptSdkApiPlugin();
    const result = await plugin.execute({
      actionConfiguration: { body: 'return true;' } as never,
      context: context as never
    } as never);

    expect(result.error).toContain('kvStore not available');
  });

  it('rethrows IntegrationError from WorkerPool as-is', async () => {
    const integrationErr = new IntegrationError('timeout');
    jest.spyOn(WorkerPool, 'ExecuteInWorkerPool').mockRejectedValue(integrationErr);

    const context = new ExecutionContext();
    context.kvStore = { read: async () => ({ data: [] }), write: async () => undefined, writeMany: async () => undefined } as never;

    const plugin = new JavascriptSdkApiPlugin();
    await expect(plugin.execute({ actionConfiguration: { body: 'return 1;' } as never, context: context as never } as never)).rejects.toBe(
      integrationErr
    );
  });

  it('wraps non-IntegrationError from WorkerPool', async () => {
    jest.spyOn(WorkerPool, 'ExecuteInWorkerPool').mockRejectedValue(new Error('boom'));

    const context = new ExecutionContext();
    context.kvStore = { read: async () => ({ data: [] }), write: async () => undefined, writeMany: async () => undefined } as never;

    const plugin = new JavascriptSdkApiPlugin();
    await expect(
      plugin.execute({ actionConfiguration: { body: 'return 1;' } as never, context: context as never } as never)
    ).rejects.toThrow(IntegrationError);
  });
});
