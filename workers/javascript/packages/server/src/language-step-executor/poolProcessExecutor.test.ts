import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ActionConfiguration, ExecutionContext } from '@superblocks/shared';
import { MockKVStore } from '../store/mock';
import { PoolExecResult } from '../types';
import { IPC_COMMAND_TYPE } from './ipcTypes';
import { ExecutionOutput } from './native-plugin/executionOutput';
import { NativeJavascriptPlugin } from './native-plugin/nativeJavascriptPlugin';
import { pluginExecutor } from './poolProcessExecutor';

jest.mock('../env');

// Send event to plugin executor that started on module load, so that it can
// complete executing before we begin testing
process.emit(
  'message',
  {
    type: 'plugin_exec_request',
    poolId: 0,
    pluginProps: {},
    filePaths: {},
    inheritedEnv: []
  },
  null
);

const mockProcess = {
  _sentData: [],
  _oneTimelisteners: {},

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (event: 'message', ...args: any[]): boolean => {
    if (mockProcess._oneTimelisteners[event]) {
      mockProcess._oneTimelisteners[event].forEach((listener) => listener(args[0], args[1]));
      mockProcess._oneTimelisteners[event] = [];
      return true;
    }

    return false;
  },

  once: jest.spyOn(process, 'once').mockImplementation((event: 'message', listener: NodeJS.MessageListener): NodeJS.Process => {
    if (!mockProcess._oneTimelisteners[event]) {
      mockProcess._oneTimelisteners[event] = [];
    }
    mockProcess._oneTimelisteners[event].push(listener);
    return mockProcess as unknown as NodeJS.Process;
  }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: jest
    .spyOn(process, 'send')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation((message: any, sendHandle?: any, options?: any, callback?: (error: Error | null) => void): boolean => {
      mockProcess._sentData.push(message);
      if (callback) {
        callback(null);
      }
      return true;
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sentData: (...excludedCommands: IPC_COMMAND_TYPE[]): any[] => {
    return mockProcess._sentData.filter((data) => !excludedCommands.includes(data.type));
  },

  clearSentData: (): void => {
    mockProcess._sentData = [];
  },

  clearListeners: (): void => {
    mockProcess._oneTimelisteners = {};
  }
};

describe('poolProcessExecutor', () => {
  describe('pluginExecutor', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockProcess.clearSentData();
      mockProcess.clearListeners();
    });

    it('should execute native plugin and send results back to main process', async () => {
      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          children: 'oh my god my children',
          executionTime: 42,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          startTimeUtc: new Date()
        })
      );

      const executeMock = jest
        .spyOn(NativeJavascriptPlugin.prototype, 'execute')
        .mockImplementation(
          ({
            context,
            actionConfiguration,
            filePaths,
            inheritedEnv
          }: {
            context: ExecutionContext;
            actionConfiguration: ActionConfiguration;
            filePaths: Record<string, string>;
            inheritedEnv: Array<string>;
          }): Promise<ExecutionOutput> => {
            expect(context.kvStore).toBeDefined();
            return Promise.resolve(anyValidOutput);
          }
        );

      const expectedOutput = anyValidOutput;
      expectedOutput.children = undefined;

      const expectedResult = {
        type: 'pool_exec_result',
        output: expectedOutput,
        err: undefined
      };

      const pluginPromise: Promise<void> = pluginExecutor();

      // Assert that the pool process executor has sent the 'ready' message
      expect(mockProcess.sentData(IPC_COMMAND_TYPE.LOG_REQUEST)).toEqual(['ready']);
      expect(executeMock).not.toHaveBeenCalled();

      // Send the execution request to the pool process executor so it can continue executing
      mockProcess.emit('message', {
        type: 'plugin_exec_request',
        poolId: 1,
        pluginProps: {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          quotas: { maxSize: 1000 },
          store: new MockKVStore(),
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        },
        filePaths: {},
        inheritedEnv: []
      });

      await pluginPromise;

      const actualResult = mockProcess.sentData(IPC_COMMAND_TYPE.LOG_REQUEST);
      expect(actualResult.length).toEqual(2);

      // Assert fields we can't know ahead of time (start time and duration)
      const returnedOutput = actualResult[1] as PoolExecResult;
      expect(returnedOutput.output.startTimeUtc.getTime()).toBeGreaterThan(expectedResult.output.startTimeUtc.getTime());
      expect(returnedOutput.output.executionTime).toBeGreaterThanOrEqual(0);

      // Set fields in expected result after asserting their data
      expectedResult.output.startTimeUtc = returnedOutput.output.startTimeUtc;
      expectedResult.output.executionTime = returnedOutput.output.executionTime;
      expect(actualResult).toEqual(['ready', expectedResult]);
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it('should send results back to main process when native plugin raises error', async () => {
      const executeMock = jest
        .spyOn(NativeJavascriptPlugin.prototype, 'execute')
        .mockImplementation(
          ({
            context,
            actionConfiguration,
            filePaths,
            inheritedEnv
          }: {
            context: ExecutionContext;
            actionConfiguration: ActionConfiguration;
            filePaths: Record<string, string>;
            inheritedEnv: Array<string>;
          }): Promise<ExecutionOutput> => {
            expect(context.kvStore).toBeDefined();
            return Promise.reject(new Error('DurationQuotaError: Execution timed out'));
          }
        );

      const expectedOutput = new ExecutionOutput();
      expectedOutput.error = 'DurationQuotaError: Execution timed out';
      expectedOutput.log.push('[ERROR] DurationQuotaError: Execution timed out');
      expectedOutput.structuredLog.push({ msg: 'DurationQuotaError: Execution timed out', level: 'error' });

      const expectedResult = {
        type: 'pool_exec_result',
        output: expectedOutput,
        err: undefined
      };

      const pluginPromise: Promise<void> = pluginExecutor();

      // Assert that the pool process executor has sent the 'ready' message
      expect(mockProcess.sentData(IPC_COMMAND_TYPE.LOG_REQUEST)).toEqual(['ready']);
      expect(executeMock).not.toHaveBeenCalled();

      // Send the execution request to the pool process executor so it can continue executing
      mockProcess.emit('message', {
        type: 'plugin_exec_request',
        poolId: 1,
        pluginProps: {
          executionId: '123',
          context: new ExecutionContext(),
          stepName: 'test_pool_process_execute',
          actionConfiguration: {
            body: 'console.log("hello world")'
          }
        },
        filePaths: {},
        inheritedEnv: []
      });

      await pluginPromise;

      const actualResult = mockProcess.sentData(IPC_COMMAND_TYPE.LOG_REQUEST);
      expect(actualResult.length).toEqual(2);

      // Assert fields we can't know ahead of time (start time and duration)
      const returnedOutput = actualResult[1] as PoolExecResult;
      expect(returnedOutput.output.startTimeUtc).toBeDefined();
      expect(returnedOutput.output.executionTime).toBeGreaterThanOrEqual(0);
      expect(returnedOutput.output.output).toEqual({});

      // Set fields in expected result after asserting their data
      expectedResult.output.startTimeUtc = returnedOutput.output.startTimeUtc;
      expectedResult.output.executionTime = returnedOutput.output.executionTime;
      expect(actualResult).toEqual(['ready', expectedResult]);
      expect(executeMock).toHaveBeenCalledTimes(1);
    });
  });
});
