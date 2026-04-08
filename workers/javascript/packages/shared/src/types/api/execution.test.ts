import { ExecutionContext, ExecutionOutput, IntegrationExecutor, KVStore } from './execution';

describe('ExecutionContext', () => {
  describe('constructor cloning', () => {
    test('clones globals, outputs, and preparedStatementContext', () => {
      const original = new ExecutionContext();
      original.globals = { foo: 'bar' };
      original.outputs = { step1: new ExecutionOutput() };
      original.preparedStatementContext = [{ key: 'value' }];

      const cloned = new ExecutionContext(original);

      expect(cloned.globals).toEqual({ foo: 'bar' });
      expect(cloned.outputs).toHaveProperty('step1');
      expect(cloned.preparedStatementContext).toEqual([{ key: 'value' }]);

      // Verify deep clone (mutations don't affect original).
      cloned.globals['foo'] = 'mutated';
      expect(original.globals['foo']).toBe('bar');
    });

    test('preserves kvStore reference', () => {
      const mockKvStore: KVStore = {
        read: jest.fn(),
        write: jest.fn(),
        writeMany: jest.fn(),
      };

      const original = new ExecutionContext();
      original.kvStore = mockKvStore;

      const cloned = new ExecutionContext(original);

      expect(cloned.kvStore).toBe(mockKvStore);
    });

    test('preserves integrationExecutor reference', () => {
      const mockExecutor: IntegrationExecutor = {
        executeIntegration: jest.fn(),
      };

      const original = new ExecutionContext();
      original.integrationExecutor = mockExecutor;

      const cloned = new ExecutionContext(original);

      expect(cloned.integrationExecutor).toBe(mockExecutor);
    });

    test('preserves variables', () => {
      const original = new ExecutionContext();
      original.variables = {
        myVar: { key: 'myVar', type: 'string', mode: 'readwrite' },
      };

      const cloned = new ExecutionContext(original);

      expect(cloned.variables).toEqual({
        myVar: { key: 'myVar', type: 'string', mode: 'readwrite' },
      });

      // Verify deep clone (mutations don't affect original).
      cloned.variables!['myVar'].mode = 'readonly';
      expect(original.variables!['myVar'].mode).toBe('readwrite');
    });

    test('preserves useWasmBindingsSandbox', () => {
      const original = new ExecutionContext();
      original.useWasmBindingsSandbox = true;

      const cloned = new ExecutionContext(original);

      expect(cloned.useWasmBindingsSandbox).toBe(true);
    });

    test('defaults to empty values when no context provided', () => {
      const ctx = new ExecutionContext();

      expect(ctx.globals).toEqual({});
      expect(ctx.outputs).toEqual({});
      expect(ctx.preparedStatementContext).toEqual([]);
      expect(ctx.kvStore).toBeUndefined();
      expect(ctx.integrationExecutor).toBeUndefined();
      expect(ctx.variables).toBeUndefined();
    });
  });
});

describe('ExecutionOutput.fromJSONString', () => {
  test('preserves _bootstrapTiming from JSON', () => {
    const json = JSON.stringify({
      output: { result: 'ok' },
      log: [],
      structuredLog: [],
      bootstrapTiming: {
        sdkImportMs: 10.5,
        bridgeSetupMs: 2.1,
        requireRootMs: 0.3,
        codeExecutionMs: 50.0,
        totalMs: 62.9,
      },
    });

    const output = ExecutionOutput.fromJSONString(json);

    expect(output.output).toEqual({ result: 'ok' });
    const bt = (output as unknown as Record<string, unknown>)._bootstrapTiming;
    expect(bt).toEqual({
      sdkImportMs: 10.5,
      bridgeSetupMs: 2.1,
      requireRootMs: 0.3,
      codeExecutionMs: 50.0,
      totalMs: 62.9,
    });
  });

  test('omits _bootstrapTiming when not in JSON', () => {
    const json = JSON.stringify({
      output: { result: 'ok' },
      log: [],
      structuredLog: [],
    });

    const output = ExecutionOutput.fromJSONString(json);

    const bt = (output as unknown as Record<string, unknown>)._bootstrapTiming;
    expect(bt).toBeUndefined();
  });

  test('omits _bootstrapTiming when bootstrapTiming is not an object', () => {
    const json = JSON.stringify({
      output: {},
      log: [],
      structuredLog: [],
      bootstrapTiming: 'not-an-object',
    });

    const output = ExecutionOutput.fromJSONString(json);

    const bt = (output as unknown as Record<string, unknown>)._bootstrapTiming;
    expect(bt).toBeUndefined();
  });
});
