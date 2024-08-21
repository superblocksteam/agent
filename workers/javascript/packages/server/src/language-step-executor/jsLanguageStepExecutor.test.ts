import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Tracer, trace } from '@opentelemetry/api';
import { ExecutionContext, LanguageActionConfiguration, MaybeError } from '@superblocks/shared';
import JavascriptPlugin from '@superblocksteam/javascript';
import P from 'pino';
import { QuotaError } from '../errors';
import { StepPerformanceImpl } from '../performance/step';
import { metaStore } from '../plugin-property/decorators';
import { PluginProps } from '../plugin-property/plugin-props';
import * as remoteLogger from '../remoteLogger';
import { MockKVStore } from '../store/mock';
import { ExecuteRequest, ExecuteResponse, IO, KV, KVStore, Wrapped } from '../types';
import { ExecutionPool } from './executionPool';
import { JsLanguageStepExecutor } from './jsLanguageStepExecutor';
import { ExecutionOutput, RawRequest } from './native-plugin/executionOutput';

jest.mock('@superblocksteam/javascript');
jest.mock('../env');
jest.mock('../remoteLogger');
jest.mock('./executionPool');

const mockLogger: P.Logger = P({ level: 'silent' });

const mockExecPool: ExecutionPool = {
  ExecutePlugin: jest.fn((...args: unknown[]): Promise<ExecutionOutput> => {
    return Promise.resolve({} as ExecutionOutput);
  }),
  close: jest.fn((...args: unknown[]): Promise<MaybeError> => {
    return;
  })
};

describe('JsLanguageStepExecutor', () => {
  describe('init', () => {
    it('init should create a new JsLanguageStepExecutor', async () => {
      const mockStore = new MockKVStore();
      const anyTimeoutValue = '1000';
      const tracer = trace.getTracer('test-jsLanguageStepExecutor', 'v0.0.0');

      const jsLangExecutor = JsLanguageStepExecutor.init(mockStore, mockExecPool, anyTimeoutValue, mockLogger, tracer);

      expect(jsLangExecutor).toBeInstanceOf(JsLanguageStepExecutor);
    });
  });

  describe('ExecuteStep', () => {
    let mockStore: KVStore;
    let tracer: Tracer;
    let perf: StepPerformanceImpl;
    let baggage: Record<string, string>;
    let executor: JsLanguageStepExecutor;

    beforeEach(async () => {
      jest.clearAllMocks();
      JavascriptPlugin.mockClear();

      mockStore = new MockKVStore();
      tracer = trace.getTracer('test-jsLanguageStepExecutor', 'v0.0.0');
      perf = new StepPerformanceImpl();
      baggage = { spanId: 'test-span-id', traceId: 'test-trace-id' };

      metaStore.addStreamProperty('actionConfiguration');
      metaStore.addStreamProperty('executionId');
      metaStore.addStreamProperty('files');
      metaStore.addStreamProperty('stepName');
      metaStore.addStreamProperty('variables');

      executor = JsLanguageStepExecutor.init(mockStore, mockExecPool, '1000', mockLogger, tracer);
    });

    it('should execute JavaScript code and return key of output with no errors', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          children: 'oh my god my children',
          executionTime: 42,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          startTimeUtc: Date.now()
        })
      );

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.resolve(anyValidOutput);
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      const expectedWrittenData = JSON.stringify({
        children: 'oh my god my children',
        executionTime: anyValidOutput.executionTime,
        log: anyValidOutput.log,
        output: anyValidOutput.output,
        startTimeUtc: anyValidOutput.startTimeUtc
      });
      const expectedResponse = {
        err: undefined,
        key: 'test-execution-id.context.output.test-javascript-step-name'
      } as ExecuteResponse;

      const result = await executor.ExecuteStep(request, baggage, perf);

      expect(result).toEqual(expectedResponse);
      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).toHaveBeenCalledTimes(1);
      expect(remoteErrorMock).not.toHaveBeenCalled();

      const writtenData = await mockStore.read([expectedResponse.key]);
      expect(writtenData.data).toBeDefined();
      expect(writtenData.data.length).toEqual(1);
      expect(JSON.parse(JSON.stringify(writtenData.data[0]))).toEqual(JSON.parse(expectedWrittenData));
    });

    it('should execute JavaScript code and return key of output and error, when output has error', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          executionTime: 42,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          error: 'TestError',
          startTimeUtc: Date.now()
        })
      );

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.resolve(anyValidOutput);
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      const expectedWrittenData = JSON.stringify({
        executionTime: anyValidOutput.executionTime,
        log: anyValidOutput.log,
        output: anyValidOutput.output,
        error: anyValidOutput.error,
        startTimeUtc: anyValidOutput.startTimeUtc
      });
      const expectedResponse = {
        err: { name: 'IntegrationError', message: 'TestError' },
        key: 'test-execution-id.context.output.test-javascript-step-name'
      } as ExecuteResponse;

      const result = await executor.ExecuteStep(request, baggage, perf);

      expect(result).toEqual(expectedResponse);
      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).toHaveBeenCalledTimes(1);
      expect(remoteErrorMock).toHaveBeenCalledTimes(1);

      const writtenData = await mockStore.read([expectedResponse.key]);
      expect(writtenData.data).toBeDefined();
      expect(writtenData.data.length).toEqual(1);
      expect(JSON.parse(JSON.stringify(writtenData.data[0]))).toEqual(JSON.parse(expectedWrittenData));
    });

    it('should execute JavaScript code and return key of output and error, when execution times out', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          executionTime: 2500,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          error: '[AbortError] Execution timed out',
          startTimeUtc: Date.now()
        })
      );

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.resolve(anyValidOutput);
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      const expectedWrittenData = JSON.stringify({
        executionTime: anyValidOutput.executionTime,
        log: [],
        output: anyValidOutput.output,
        error: 'DurationQuotaError',
        startTimeUtc: anyValidOutput.startTimeUtc
      });
      const expectedResponse = {
        err: { name: 'DurationQuotaError', message: 'DurationQuotaError' },
        key: 'test-execution-id.context.output.test-javascript-step-name'
      } as ExecuteResponse;

      const result = await executor.ExecuteStep(request, baggage, perf);

      expect(result).toEqual(expectedResponse);
      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).toHaveBeenCalledTimes(1);
      expect(remoteErrorMock).toHaveBeenCalledTimes(1);

      const writtenData = await mockStore.read([expectedResponse.key]);
      expect(writtenData.data).toBeDefined();
      expect(writtenData.data.length).toEqual(1);
      expect(JSON.parse(JSON.stringify(writtenData.data[0]))).toEqual(JSON.parse(expectedWrittenData));
    });

    it('should return key of output and error, when flush data fails with quota error', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          executionTime: 42,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          startTimeUtc: Date.now()
        })
      );

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.resolve(anyValidOutput);
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      const writeManyMock = jest
        .spyOn(MockKVStore.prototype, 'writeMany')
        .mockImplementationOnce((payload: KV[]): Promise<Wrapped<IO, void>> => {
          return Promise.reject(new QuotaError('Quota exceeded'));
        });

      const expectedWrittenData = JSON.stringify({
        executionTime: anyValidOutput.executionTime,
        log: anyValidOutput.log,
        output: {},
        error: 'QuotaError',
        startTimeUtc: anyValidOutput.startTimeUtc
      });
      const expectedResponse = {
        err: { name: 'QuotaError', message: 'QuotaError' },
        key: 'test-execution-id.context.output.test-javascript-step-name'
      } as ExecuteResponse;

      const result = await executor.ExecuteStep(request, baggage, perf);

      expect(result).toEqual(expectedResponse);
      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).toHaveBeenCalledTimes(1);
      expect(remoteErrorMock).not.toHaveBeenCalled();
      expect(writeManyMock).toHaveBeenCalledTimes(2);

      const writtenData = await mockStore.read([expectedResponse.key]);
      expect(writtenData.data).toBeDefined();
      expect(writtenData.data.length).toEqual(1);
      expect(JSON.parse(JSON.stringify(writtenData.data[0]))).toEqual(JSON.parse(expectedWrittenData));
    });

    it('should raise error, when javascript plugin raises an error', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.reject("TypeError: Cannot read property 'label' of undefined");
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      await expect(executor.ExecuteStep(request, baggage, perf)).rejects.toEqual("TypeError: Cannot read property 'label' of undefined");

      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).not.toHaveBeenCalled();
      expect(remoteErrorMock).not.toHaveBeenCalled();
    });

    it('should raise error, when flush data fails with non-quota error', async () => {
      const request = {
        props: {
          actionConfiguration: {},
          executionId: 'test-execution-id',
          files: [],
          stepName: 'test-javascript-step-name',
          variables: {
            'var1.output.number': 1,
            'var2.output.string': 'test',
            'var3.global.string': 'global_var',
            'var4.input.number': 1738
          }
        }
      } as ExecuteRequest;

      const anyValidLangActionConfig: LanguageActionConfiguration = { body: 'return 123' };

      const anyValidOutput = ExecutionOutput.fromJSONString(
        JSON.stringify({
          children: 'oh my god my children',
          executionTime: 42,
          log: ['tree trunks'],
          structuredLog: [{ msg: 'tree trunks', level: 'info' }],
          output: 'Superblocks',
          startTimeUtc: Date.now()
        })
      );

      const evaluateActionConfigMock = jest.spyOn(JavascriptPlugin.prototype, 'evaluateActionConfig').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        (context: ExecutionContext, actionConfig: LanguageActionConfiguration): Promise<LanguageActionConfiguration> => {
          return Promise.resolve(anyValidLangActionConfig);
        }
      );

      const executePluginMock = jest
        .spyOn(mockExecPool, 'ExecutePlugin')
        .mockImplementation(
          (
            functionName: string,
            props: PluginProps,
            rawRequest: RawRequest,
            filePaths: Record<string, string>,
            executionTimeoutMs?: string
          ): Promise<ExecutionOutput> => {
            return Promise.resolve(anyValidOutput);
          }
        );

      const remoteLogStructuredMock = jest.spyOn(remoteLogger, 'remoteLogStructured');
      const remoteErrorMock = jest.spyOn(remoteLogger, 'remoteError');

      const writeManyMock = jest
        .spyOn(MockKVStore.prototype, 'writeMany')
        .mockImplementation((payload: KV[]): Promise<Wrapped<IO, void>> => {
          return Promise.reject('Flushing step output to store failed: Redis connection error');
        });

      await expect(executor.ExecuteStep(request, baggage, perf)).rejects.toEqual(
        'Flushing step output to store failed: Redis connection error'
      );

      expect(evaluateActionConfigMock).toHaveBeenCalledTimes(1);
      expect(executePluginMock).toHaveBeenCalledTimes(1);
      expect(remoteLogStructuredMock).toHaveBeenCalledTimes(1);
      expect(remoteErrorMock).not.toHaveBeenCalled();
      expect(writeManyMock).toHaveBeenCalledTimes(1);
    });

    it('should throw error on execute if the executor is shutdown', async () => {
      await executor.close();
      const request = {} as ExecuteRequest;
      await expect(executor.ExecuteStep(request, baggage, perf)).rejects.toThrowError(
        'Cannot execute step, JavaScript Language Executor is shutting down'
      );
    });
  });
});
