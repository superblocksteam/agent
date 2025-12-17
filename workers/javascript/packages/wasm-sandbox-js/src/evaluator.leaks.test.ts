/**
 * Memory leak detection tests for the WASM sandbox evaluator.
 *
 * QuickJS (the JavaScript engine we use inside WebAssembly) requires manual memory
 * management - every handle created must be explicitly disposed. Failing to dispose
 * handles leads to memory leaks that accumulate over time and can crash the process.
 *
 * These tests use quickjs-emscripten's TestQuickJSWASMModule which tracks all
 * allocations and verifies that everything is properly cleaned up after each test.
 * The afterEach hook checks:
 *   - QTS_RecoverableLeakCheck() returns 0 (no leaked handles)
 *   - All contexts are disposed
 *   - All runtimes are disposed
 *   - assertNoMemoryAllocated() passes
 *
 * If any of these checks fail, it indicates a bug in our handle management code
 * (likely in `evaluator.ts` or `marshal.ts`) that needs to be fixed.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

type EvaluateExpressions = (typeof import('./evaluator'))['evaluateExpressions'];
type HostFunction = (typeof import('./marshal'))['hostFunction'];

type QuickJSTestCtor = NonNullable<(typeof import('quickjs-emscripten'))['TestQuickJSWASMModule']>;
type LeakDetectingModule = InstanceType<QuickJSTestCtor>;

async function createLeakDetectingModule(): Promise<LeakDetectingModule> {
  const quickjs = await import('quickjs-emscripten');
  const wasmModule = await quickjs.newQuickJSWASMModule(quickjs.DEBUG_SYNC);

  const TestModuleCtor = quickjs.TestQuickJSWASMModule as QuickJSTestCtor | undefined;

  if (!TestModuleCtor) {
    throw new Error('TestQuickJSWASMModule export not found');
  }

  return new TestModuleCtor(wasmModule);
}

describe('evaluateExpressions leak checks', () => {
  let evaluateExpressions: EvaluateExpressions;
  let hostFunction: HostFunction;
  let leakModule: LeakDetectingModule;

  beforeEach(async () => {
    jest.resetModules();

    leakModule = await createLeakDetectingModule();

    jest.unstable_mockModule('quickjs-emscripten', async () => {
      const actual = await jest.requireActual<typeof import('quickjs-emscripten')>('quickjs-emscripten');

      return {
        ...actual,
        getQuickJS: async () => leakModule
      };
    });

    ({ evaluateExpressions } = await import('./evaluator'));
    ({ hostFunction } = await import('./marshal'));
  });

  afterEach(() => {
    expect(leakModule.getFFI().QTS_RecoverableLeakCheck()).toBe(0);
    expect(leakModule.contexts.size).toBe(0);

    for (const runtime of leakModule.runtimes) {
      expect(runtime.alive).toBe(false);
    }

    leakModule.disposeAll();
    leakModule.assertNoMemoryAllocated();
  });

  it('does not leak when evaluation succeeds', async () => {
    const expressions = ['1 + 2', "Promise.resolve('ok')"];
    const results = await evaluateExpressions(expressions);

    expect(results['1 + 2']).toBe(3);
    expect(results["Promise.resolve('ok')"]).toBe('ok');
  });

  it('does not leak when evaluation rejects', async () => {
    await expect(evaluateExpressions(["Promise.reject(new Error('boom'))"])).rejects.toThrow('boom');
  });

  it('does not leak when injecting functions as globals', async () => {
    const results = await evaluateExpressions(['add(2, 3)'], {
      globals: { add: hostFunction((a: number, b: number) => a + b) }
    });

    expect(results['add(2, 3)']).toBe(5);
  });

  it('does not leak when injecting nested functions in objects', async () => {
    const results = await evaluateExpressions(['obj.math.double(4)'], {
      globals: { obj: { math: { double: hostFunction((x: number) => x * 2) } } }
    });

    expect(results['obj.math.double(4)']).toBe(8);
  });

  it('does not leak when injecting functions in arrays', async () => {
    const fns = [hostFunction((x: number) => x + 1), hostFunction((x: number) => x * 2)];
    const results = await evaluateExpressions(['fns[0](5) + fns[1](5)'], {
      globals: { fns }
    });

    expect(results['fns[0](5) + fns[1](5)']).toBe(16);
  });

  it('does not leak when async function resolves', async () => {
    const asyncAdd = async (a: number, b: number) => a + b;
    const results = await evaluateExpressions(['asyncAdd(10, 20)'], {
      globals: { asyncAdd: hostFunction(asyncAdd) }
    });

    expect(results['asyncAdd(10, 20)']).toBe(30);
  });

  it('does not leak when async function rejects', async () => {
    const asyncFail = async () => {
      throw new Error('async boom');
    };

    await expect(
      evaluateExpressions(['asyncFail()'], {
        globals: { asyncFail: hostFunction(asyncFail) }
      })
    ).rejects.toThrow('async boom');
  });

  it('does not leak when function returns complex objects', async () => {
    const makeUser = (name: string) => ({ name, roles: ['admin', 'user'], active: true });
    const results = await evaluateExpressions(["makeUser('Alice')"], {
      globals: { makeUser: hostFunction(makeUser) }
    });

    expect(results["makeUser('Alice')"]).toEqual({ name: 'Alice', roles: ['admin', 'user'], active: true });
  });

  it('does not leak when using Buffer polyfill', async () => {
    const results = await evaluateExpressions(
      [
        'Array.from(Buffer.from("hello"))',
        'Array.from(Buffer.from("aGVsbG8=", "base64"))',
        'Array.from(Buffer.from([1, 2, 3]))',
        'Buffer.isBuffer(Buffer.from("test"))'
      ],
      { enableBuffer: true }
    );

    expect(results['Array.from(Buffer.from("hello"))']).toEqual([104, 101, 108, 108, 111]);
    expect(results['Array.from(Buffer.from("aGVsbG8=", "base64"))']).toEqual([104, 101, 108, 108, 111]);
    expect(results['Array.from(Buffer.from([1, 2, 3]))']).toEqual([1, 2, 3]);
    expect(results['Buffer.isBuffer(Buffer.from("test"))']).toBe(true);
  });

  describe('host function error handling - leak checks', () => {
    describe('sync functions', () => {
      it('does not leak when sync function with complex args throws Error', async () => {
        const processUser = (user: { name: string; roles: string[] }) => {
          throw new Error(`Failed to process user: ${user.name}`);
        };
        const expression = "processUser({ name: 'Bob', roles: ['admin', 'editor'] })";

        await expect(
          evaluateExpressions([expression], { globals: { processUser: hostFunction(processUser) } })
        ).rejects.toThrow('Failed to process user: Bob');
      });

      it('does not leak when sync function throws non-Error object', async () => {
        const validateData = (data: { items: number[]; metadata: { version: string } }) => {
          throw { code: 'VALIDATION_ERROR', details: { field: 'items', received: data.items.length } };
        };
        const expression = `
          (() => {
            try {
              validateData({ items: [1, 2, 3], metadata: { version: '1.0' } });
              return 'not caught';
            } catch (e) {
              return e.code + ':' + e.details.field;
            }
          })()
        `;

        const results = await evaluateExpressions([expression], { globals: { validateData: hostFunction(validateData) } });
        expect(results[expression]).toBe('VALIDATION_ERROR:items');
      });

      it('does not leak when sync function with complex args succeeds with complex return', async () => {
        const transformData = (input: { users: { id: number; name: string }[]; settings: { active: boolean } }) => ({
          count: input.users.length,
          names: input.users.map((u) => u.name),
          isActive: input.settings.active,
          nested: { deep: { value: 42 } }
        });
        const expression = `
          transformData({
            users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
            settings: { active: true }
          })
        `;

        const results = await evaluateExpressions([expression], { globals: { transformData: hostFunction(transformData) } });
        expect(results[expression]).toEqual({
          count: 2,
          names: ['Alice', 'Bob'],
          isActive: true,
          nested: { deep: { value: 42 } }
        });
      });

      it('does not leak when sync function throws and is caught multiple times', async () => {
        const throwIfNegative = (nums: number[]) => {
          const negative = nums.find((n) => n < 0);
          if (negative !== undefined) {
            throw new Error(`Negative number found: ${negative}`);
          }
          return nums.reduce((a, b) => a + b, 0);
        };
        const expression = `
          (() => {
            const results = [];
            try { results.push(throwIfNegative([1, 2, 3])); } catch (e) { results.push('err1'); }
            try { results.push(throwIfNegative([4, -5, 6])); } catch (e) { results.push('err2'); }
            try { results.push(throwIfNegative([7, 8, 9])); } catch (e) { results.push('err3'); }
            return results;
          })()
        `;

        const results = await evaluateExpressions([expression], { globals: { throwIfNegative: hostFunction(throwIfNegative) } });
        expect(results[expression]).toEqual([6, 'err2', 24]);
      });
    });

    describe('async functions', () => {
      it('does not leak when async function with complex args rejects with Error', async () => {
        const asyncProcessUser = async (user: { name: string; permissions: string[] }) => {
          throw new Error(`Async failed for user: ${user.name}`);
        };
        const expression = "asyncProcessUser({ name: 'Charlie', permissions: ['read', 'write'] })";

        await expect(
          evaluateExpressions([expression], { globals: { asyncProcessUser: hostFunction(asyncProcessUser) } })
        ).rejects.toThrow('Async failed for user: Charlie');
      });

      it('does not leak when async function rejects with non-Error object', async () => {
        const asyncValidate = async (config: { rules: { name: string; enabled: boolean }[] }) => {
          throw { errorType: 'CONFIG_INVALID', ruleCount: config.rules.length, timestamp: 12345 };
        };
        const expression = `
          (async () => {
            try {
              await asyncValidate({ rules: [{ name: 'rule1', enabled: true }, { name: 'rule2', enabled: false }] });
              return 'not caught';
            } catch (e) {
              return e.errorType + ':' + e.ruleCount;
            }
          })()
        `;

        const results = await evaluateExpressions([expression], { globals: { asyncValidate: hostFunction(asyncValidate) } });
        expect(results[expression]).toBe('CONFIG_INVALID:2');
      });

      it('does not leak when async function with complex args resolves with complex return', async () => {
        const asyncTransform = async (data: { entries: { key: string; values: number[] }[] }) => {
          return {
            summary: data.entries.map((e) => ({ key: e.key, sum: e.values.reduce((a, b) => a + b, 0) })),
            metadata: { processedAt: 'now', count: data.entries.length }
          };
        };
        const expression = `
          asyncTransform({
            entries: [
              { key: 'a', values: [1, 2, 3] },
              { key: 'b', values: [4, 5] }
            ]
          })
        `;

        const results = await evaluateExpressions([expression], { globals: { asyncTransform: hostFunction(asyncTransform) } });
        expect(results[expression]).toEqual({
          summary: [
            { key: 'a', sum: 6 },
            { key: 'b', sum: 9 }
          ],
          metadata: { processedAt: 'now', count: 2 }
        });
      });

      it('does not leak when async function rejects and is caught multiple times', async () => {
        const asyncMayFail = async (config: { shouldFail: boolean; data: { id: number }[] }) => {
          if (config.shouldFail) {
            throw new Error(`Failed with ${config.data.length} items`);
          }
          return config.data.map((d) => d.id * 2);
        };
        const expression = `
          (async () => {
            const results = [];
            try { results.push(await asyncMayFail({ shouldFail: false, data: [{ id: 1 }] })); } catch (e) { results.push('err1'); }
            try { results.push(await asyncMayFail({ shouldFail: true, data: [{ id: 2 }, { id: 3 }] })); } catch (e) { results.push('err2'); }
            try { results.push(await asyncMayFail({ shouldFail: false, data: [{ id: 4 }, { id: 5 }] })); } catch (e) { results.push('err3'); }
            return results;
          })()
        `;

        const results = await evaluateExpressions([expression], { globals: { asyncMayFail: hostFunction(asyncMayFail) } });
        expect(results[expression]).toEqual([[2], 'err2', [8, 10]]);
      });

      it('does not leak when mixing sync and async functions with errors', async () => {
        const syncDouble = (nums: number[]) => nums.map((n) => n * 2);
        const syncFail = (msg: string) => {
          throw new Error(msg);
        };
        const asyncTriple = async (nums: number[]) => nums.map((n) => n * 3);
        const asyncFail = async (msg: string) => {
          throw new Error(msg);
        };

        const expression = `
          (async () => {
            const results = [];
            results.push(syncDouble([1, 2]));
            try { syncFail('sync error'); } catch (e) { results.push('caught sync'); }
            results.push(await asyncTriple([3, 4]));
            try { await asyncFail('async error'); } catch (e) { results.push('caught async'); }
            return results;
          })()
        `;

        const results = await evaluateExpressions([expression], {
          globals: {
            syncDouble: hostFunction(syncDouble),
            syncFail: hostFunction(syncFail),
            asyncTriple: hostFunction(asyncTriple),
            asyncFail: hostFunction(asyncFail)
          }
        });
        expect(results[expression]).toEqual([[2, 4], 'caught sync', [9, 12], 'caught async']);
      });
    });
  });
});
