import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ActionConfiguration, ExecutionContext } from '@superblocks/shared';
import * as bootstrap from './bootstrap';
import { ExecutionOutput } from './executionOutput';
import { IntegrationError } from './integrationError';
import { JavascriptProcessInput, NativeJavascriptPlugin } from './nativeJavascriptPlugin';

jest.mock('./bootstrap');

describe('NativeJavascriptPlugin', () => {
  describe('execute', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the code and return the result', async () => {
      const context = new ExecutionContext();
      const actionConfiguration = {
        body: 'return 1 + 2'
      } as ActionConfiguration;
      const filePaths = {};
      const inheritedEnv = [];

      const expectedOutput = ExecutionOutput.fromJSONString(
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

      const mockExecCode = jest.spyOn(bootstrap, 'executeCode').mockResolvedValue(expectedOutput);

      const nativePlugin = new NativeJavascriptPlugin();
      const output = await nativePlugin.execute({
        context,
        actionConfiguration,
        filePaths,
        inheritedEnv
      });

      expect(output).toEqual(expectedOutput);
      expect(mockExecCode).toHaveBeenCalledTimes(1);
      expect(mockExecCode).toHaveBeenCalledWith({ context, code: 'return 1 + 2', filePaths, inheritedEnv } as JavascriptProcessInput);
    });

    it('should return immediately if there is no code to execute', async () => {
      const context = new ExecutionContext();
      const actionConfiguration = { body: undefined } as ActionConfiguration;
      const filePaths = {};
      const inheritedEnv = [];

      const expectedOutput = ExecutionOutput.fromJSONString('{}');

      const mockExecCode = jest.spyOn(bootstrap, 'executeCode');

      const nativePlugin = new NativeJavascriptPlugin();
      const output = await nativePlugin.execute({
        context,
        actionConfiguration,
        filePaths,
        inheritedEnv
      });

      expect(JSON.stringify(output)).toEqual(JSON.stringify(expectedOutput));
      expect(mockExecCode).not.toBeCalled();
    });

    it('should raise integration error when execute code raises error', async () => {
      const context = new ExecutionContext();
      const actionConfiguration = {
        body: 'return 1 + 2'
      } as ActionConfiguration;
      const filePaths = {};
      const inheritedEnv = ['ANY_ENV_VAR'];

      const mockExecCode = jest
        .spyOn(bootstrap, 'executeCode')
        .mockRejectedValue(new Error('TypeError: Cannot read property of undefined'));

      const nativePlugin = new NativeJavascriptPlugin();
      const executePromise = nativePlugin.execute({
        context,
        actionConfiguration,
        filePaths,
        inheritedEnv
      });

      await expect(executePromise).rejects.toThrow(IntegrationError);
      expect(mockExecCode).toHaveBeenCalledTimes(1);
      expect(mockExecCode).toHaveBeenCalledWith({ context, code: 'return 1 + 2', filePaths, inheritedEnv } as JavascriptProcessInput);
    });
  });
});
