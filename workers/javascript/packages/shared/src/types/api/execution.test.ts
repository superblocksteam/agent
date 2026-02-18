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
