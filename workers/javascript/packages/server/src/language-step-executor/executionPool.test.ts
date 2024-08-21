import * as child_process from 'child_process';
import * as fs from 'fs';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import P from 'pino';
import { PluginProps } from '../plugin-property/plugin-props';
import { MockKVStore } from '../store/mock';
import { ExecutionPoolOptions } from '../types';
import { ExecutionPool, ExecutionPoolImpl } from './executionPool';
import { MockSubProcess } from './mockSubProcess';
import { ExecutionOutput, RawRequest } from './native-plugin/executionOutput';

const mockLogger: P.Logger = P({ level: 'silent' });

jest.mock('../env');
jest.mock('child_process', () => {
  const originalModule: object = jest.requireActual('child_process');

  return {
    __esModule: true,
    ...originalModule,
    fork: jest.fn()
  };
});
jest.mock('fs', () => {
  const originalModule: object = jest.requireActual('fs');

  return {
    __esModule: true,
    ...originalModule,
    rmSync: jest.fn()
  };
});

type ForkSpy = (modulePath: string, options?: child_process.ForkOptions) => child_process.ChildProcess;

describe('executionPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize the execution pool with ready pool processes when enabled', async () => {
      const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/test');
      const mockMkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const mockKill = jest.spyOn(process, 'kill').mockReturnValue(undefined);
      const mockRmSync = jest.spyOn(fs, 'rmSync').mockReturnValue(undefined);

      const forkedProcs: MockSubProcess[] = [];
      const mockForkSpy = jest.spyOn(child_process, 'fork') as unknown as jest.MockedFunction<ForkSpy>;
      mockForkSpy.mockImplementation((modulePath: string, options?: child_process.ForkOptions): child_process.ChildProcess => {
        const count = forkedProcs.length;
        forkedProcs.push(new MockSubProcess(count));

        return forkedProcs[count] as unknown as child_process.ChildProcess;
      });
      jest.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number): true => {
        const code: number | null = typeof signal === 'number' ? signal : null;
        const signalStr: string | null = typeof signal === 'string' ? signal : null;

        forkedProcs[Math.abs(pid)].kill(code, signalStr);
        return true;
      });

      const mockKvStore = new MockKVStore();
      const poolPromise: Promise<ExecutionPool> = ExecutionPoolImpl.init(
        {
          poolSize: 2,
          kvStore: mockKvStore,
          executionEnvInclusionList: ['ENV_VAR_1', 'ENV_VAR_2'],
          enabled: true
        },
        mockLogger
      );

      // Wait for exec pool to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(poolPromise).toBeDefined();
      expect(poolPromise).not.toBeInstanceOf(ExecutionPoolImpl);
      expect(mockCwd).toHaveBeenCalledTimes(2);
      expect(mockMkdir).toHaveBeenCalledTimes(2);
      expect(mockForkSpy).toHaveBeenCalledTimes(2);

      // Emit 'ready' message for each forked process
      forkedProcs.forEach((proc: MockSubProcess) => proc.emit('message', 'ready'));

      const execPool = await poolPromise;
      expect(execPool).toBeInstanceOf(ExecutionPoolImpl);

      await execPool.close();
      expect(mockKill).toHaveBeenCalledTimes(4);
      expect(mockRmSync).toHaveBeenCalledTimes(2);
      forkedProcs.forEach((proc: MockSubProcess) => {
        expect(proc.connected).toBeFalsy();
        expect(proc.exitCode).not.toEqual(0);
      });
    });

    it('should return immediately when disabled', async () => {
      const mockForkSpy = jest.spyOn(child_process, 'fork') as unknown as jest.MockedFunction<ForkSpy>;
      const execPool: ExecutionPool = await ExecutionPoolImpl.init({
        poolSize: 2,
        enabled: false
      });

      expect(execPool).toBeInstanceOf(ExecutionPoolImpl);
      expect(mockForkSpy).not.toHaveBeenCalled();

      await execPool.close();
    });
  });

  describe('ExecutePlugin', () => {
    let execPool: ExecutionPool;
    let forkedProcs: MockSubProcess[];
    let mockForkSpy: jest.MockedFunction<ForkSpy>;
    let mockKvStore: MockKVStore;

    beforeEach(async () => {
      jest.clearAllMocks();

      forkedProcs = [];
      mockForkSpy = jest.spyOn(child_process, 'fork') as unknown as jest.MockedFunction<ForkSpy>;
      mockForkSpy.mockImplementation((modulePath: string, options?: child_process.ForkOptions): child_process.ChildProcess => {
        const count = forkedProcs.length;
        forkedProcs.push(new MockSubProcess(count));

        return forkedProcs[count] as unknown as child_process.ChildProcess;
      });

      jest.spyOn(process, 'cwd').mockReturnValue('/tmp/test');
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'rmSync').mockReturnValue(undefined);
      jest.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number): true => {
        const code: number | null = typeof signal === 'number' ? signal : null;
        const signalStr: string | null = typeof signal === 'string' ? signal : null;

        forkedProcs[Math.abs(pid)].kill(code, signalStr);
        return true;
      });

      mockKvStore = new MockKVStore();
      const poolOptions: ExecutionPoolOptions = {
        poolSize: 1,
        kvStore: mockKvStore,
        executionEnvInclusionList: [],
        enabled: true
      };
      const execPoolPromise: Promise<ExecutionPool> = ExecutionPoolImpl.init(poolOptions, mockLogger);

      // Wait for exec pool to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Emit 'ready' message for each forked process
      forkedProcs.forEach((proc: MockSubProcess) => proc.emit('message', 'ready'));
      execPool = await execPoolPromise;
    });

    afterEach(async () => {
      if (forkedProcs.length > 1) {
        // Send ready message for pool process that was proactively created
        // when the initialized one began execution
        forkedProcs[1].emit('message', 'ready');
      }

      await execPool.close();
    });

    it('should return immediately with default output when execution pool is not enabled', async () => {
      const disabledExecPool: ExecutionPool = await ExecutionPoolImpl.init({
        poolSize: 0,
        enabled: false
      });

      expect(disabledExecPool).toBeInstanceOf(ExecutionPoolImpl);

      const defaultOutput = new ExecutionOutput();
      const output = await disabledExecPool.ExecutePlugin('javascript', {} as PluginProps, '' as RawRequest, {}, '5000', {});

      expect(output).toEqual(defaultOutput);

      await disabledExecPool.close();
    });

    it('should raise error when execution pool is shutting down', async () => {
      // Close execution pool
      await execPool.close();

      const executePromise = execPool.ExecutePlugin('javascript', {} as PluginProps, '' as RawRequest, {}, '5000', {});

      await expect(executePromise).rejects.toThrowError('Cannot execute plugin, execution pool is shutting down');
    });

    it.each([{ tags: { id: '123', name: 'plugin' } }, { tags: undefined }])(
      'should execute plugin in pool process and return output',
      async ({ tags }) => {
        const anyPluginProps = {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          quotas: { maxSize: 1000 },
          store: new MockKVStore(),
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        } as unknown as PluginProps;

        const anyRawRequest: RawRequest = anyPluginProps.actionConfiguration.body;
        const anyFilePaths: Record<string, string> = {};
        const expectedInheritedEnv: Array<string> = [];
        const anyTimeout = '5000';

        const validOutput = ExecutionOutput.fromJSONString(
          JSON.stringify({
            children: 'oh my god my children',
            executionTime: 42,
            log: ['tree trunks'],
            structuredLog: [{ msg: 'tree trunks', level: 'info' }],
            output: 'Superblocks',
            error: 'TestError',
            startTimeUtc: Date.now()
          })
        );

        const expectedExecRequest = {
          type: 'plugin_exec_request',
          poolId: 0,
          pluginProps: anyPluginProps,
          filePaths: anyFilePaths,
          inheritedEnv: expectedInheritedEnv
        };

        const expectedOutput = {
          request: anyRawRequest,
          output: validOutput.output,
          log: validOutput.log,
          structuredLog: validOutput.structuredLog,
          startTimeUtc: validOutput.startTimeUtc,
          executionTime: validOutput.executionTime,
          error: 'TestError'
        } as ExecutionOutput;

        const executePromise: Promise<ExecutionOutput> = execPool.ExecutePlugin(
          'javascript',
          anyPluginProps,
          anyRawRequest,
          anyFilePaths,
          anyTimeout,
          tags
        );

        // Wait for exec pool to send execute request to pool process
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(forkedProcs[0].sentData()).toEqual([expectedExecRequest]);

        // Emit success response from pool process
        forkedProcs[0].emit('message', {
          type: 'pool_exec_result',
          output: validOutput,
          err: undefined
        });

        const output: ExecutionOutput = await executePromise;

        expect(output).toEqual(expectedOutput);
      }
    );

    it.each([{ tags: { id: '123', name: 'plugin' } }, { tags: undefined }])(
      'should raise error when pool process returns successfully with error output',
      async ({ tags }) => {
        const anyPluginProps = {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          quotas: { maxSize: 1000 },
          store: new MockKVStore(),
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        } as unknown as PluginProps;

        const anyRawRequest: RawRequest = anyPluginProps.actionConfiguration.body;
        const anyFilePaths: Record<string, string> = {};
        const expectedInheritedEnv: Array<string> = [];
        const anyTimeout = '5000';

        const expectedExecRequest = {
          type: 'plugin_exec_request',
          poolId: 0,
          pluginProps: anyPluginProps,
          filePaths: anyFilePaths,
          inheritedEnv: expectedInheritedEnv
        };

        const executePromise: Promise<ExecutionOutput> = execPool.ExecutePlugin(
          'javascript',
          anyPluginProps,
          anyRawRequest,
          anyFilePaths,
          anyTimeout,
          tags
        );

        // Wait for exec pool to send execute request to pool process
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(forkedProcs[0].sentData()).toEqual([expectedExecRequest]);

        // Emit success response from pool process
        forkedProcs[0].emit('message', {
          type: 'pool_exec_result',
          output: undefined,
          err: { name: 'SystemError', message: 'System error executing plugin' }
        });

        await expect(executePromise).rejects.toEqual({ name: 'SystemError', message: 'System error executing plugin' });
      }
    );

    it.each([{ tags: { id: '123', name: 'plugin' } }, { tags: undefined }])(
      'should return output when pool process terminates due to timeout',
      async ({ tags }) => {
        const anyPluginProps = {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          quotas: { maxSize: 1000 },
          store: new MockKVStore(),
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        } as unknown as PluginProps;

        const anyRawRequest: RawRequest = anyPluginProps.actionConfiguration.body;
        const anyFilePaths: Record<string, string> = {};
        const expectedInheritedEnv: Array<string> = [];
        const anyTimeout = '5000';

        const expectedExecRequest = {
          type: 'plugin_exec_request',
          poolId: 0,
          pluginProps: anyPluginProps,
          filePaths: anyFilePaths,
          inheritedEnv: expectedInheritedEnv
        };

        const expectedOutput = {
          request: anyRawRequest,
          error: '[AbortError] Timed out after 5000ms',
          log: ['[ERROR] [AbortError] Timed out after 5000ms'],
          output: {}
        } as ExecutionOutput;

        const executePromise: Promise<ExecutionOutput> = execPool.ExecutePlugin(
          'javascript',
          anyPluginProps,
          anyRawRequest,
          anyFilePaths,
          anyTimeout,
          tags
        );

        // Wait for exec pool to send execute request to pool process
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(forkedProcs[0].sentData()).toEqual([expectedExecRequest]);

        // Emit error event from pool process
        forkedProcs[0].emit('error', {
          name: 'AbortError',
          message: 'AbortError'
        });

        const output: ExecutionOutput = await executePromise;

        expect(output).toBeDefined();
        expect(output.request).toEqual(expectedOutput.request);
        expect(output.error).toEqual(expectedOutput.error);
        expect(output.log).toEqual(expectedOutput.log);
        expect(output.output).toEqual(expectedOutput.output);
        expect(output.startTimeUtc).toBeDefined();
        expect(output.executionTime).toBeGreaterThan(0);
      }
    );

    it.each([{ tags: { id: '123', name: 'plugin' } }, { tags: undefined }])(
      'should raise error when pool process terminates due to non-timeout error',
      async ({ tags }) => {
        const anyPluginProps = {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          quotas: { maxSize: 1000 },
          store: new MockKVStore(),
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        } as unknown as PluginProps;

        const anyRawRequest: RawRequest = anyPluginProps.actionConfiguration.body;
        const anyFilePaths: Record<string, string> = {};
        const expectedInheritedEnv: Array<string> = [];
        const anyTimeout = '5000';

        const expectedExecRequest = {
          type: 'plugin_exec_request',
          poolId: 0,
          pluginProps: anyPluginProps,
          filePaths: anyFilePaths,
          inheritedEnv: expectedInheritedEnv
        };

        const executePromise: Promise<ExecutionOutput> = execPool.ExecutePlugin(
          'javascript',
          anyPluginProps,
          anyRawRequest,
          anyFilePaths,
          anyTimeout,
          tags
        );

        // Wait for exec pool to send execute request to pool process
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(forkedProcs[0].sentData()).toEqual([expectedExecRequest]);

        // Emit error event from pool process
        forkedProcs[0].emit('error', {
          name: 'FATAL ERROR: Heap out of memory',
          message: 'FATAL ERROR: Heap out of memory'
        });

        await expect(executePromise).rejects.toEqual({
          name: 'FATAL ERROR: Heap out of memory',
          message: 'FATAL ERROR: Heap out of memory'
        });
      }
    );
  });
});
