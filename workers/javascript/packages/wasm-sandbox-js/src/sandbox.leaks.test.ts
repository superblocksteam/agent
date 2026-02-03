/**
 * Memory leak detection tests for the WASM sandbox.
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
 * (likely in `sandbox.ts` or `marshal.ts`) that needs to be fixed.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TestQuickJSWASMModule, newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core';
import DEBUG_SYNC from '@jitl/quickjs-wasmfile-debug-sync';

type CreateSandbox = (typeof import('./sandbox'))['createSandbox'];
type HostFunction = (typeof import('./marshal'))['hostFunction'];
type HostGetter = (typeof import('./marshal'))['hostGetter'];

async function createLeakDetectingModule(): Promise<TestQuickJSWASMModule> {
  const wasmModule = await newQuickJSWASMModuleFromVariant(DEBUG_SYNC);
  return new TestQuickJSWASMModule(wasmModule);
}

describe('Sandbox leak checks', () => {
  let createSandbox: CreateSandbox;
  let hostFunction: HostFunction;
  let hostGetter: HostGetter;
  let leakModule: TestQuickJSWASMModule;

  beforeEach(async () => {
    jest.resetModules();

    leakModule = await createLeakDetectingModule();

    jest.unstable_mockModule('./quickjs', async () => {
      return {
        getQuickJS: async () => leakModule
      };
    });

    ({ createSandbox } = await import('./sandbox'));
    ({ hostFunction, hostGetter } = await import('./marshal'));
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
    const sandbox = await createSandbox();
    try {
      const result1 = await sandbox.evaluate('1 + 2');
      const result2 = await sandbox.evaluate("Promise.resolve('ok')");

      expect(result1).toBe(3);
      expect(result2).toBe('ok');
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when evaluation rejects', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate("Promise.reject(new Error('boom'))")).rejects.toThrow('boom');
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when injecting functions as globals', async () => {
    const sandbox = await createSandbox();
    try {
      sandbox.setGlobals({ add: hostFunction((a: number, b: number) => a + b) });
      const result = await sandbox.evaluate('add(2, 3)');
      expect(result).toBe(5);
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when injecting nested functions in objects', async () => {
    const sandbox = await createSandbox();
    try {
      sandbox.setGlobals({ obj: { math: { double: hostFunction((x: number) => x * 2) } } });
      const result = await sandbox.evaluate('obj.math.double(4)');
      expect(result).toBe(8);
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when injecting functions in arrays', async () => {
    const sandbox = await createSandbox();
    try {
      const fns = [hostFunction((x: number) => x + 1), hostFunction((x: number) => x * 2)];
      sandbox.setGlobals({ fns });
      const result = await sandbox.evaluate('fns[0](5) + fns[1](5)');
      expect(result).toBe(16);
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when async function resolves', async () => {
    const sandbox = await createSandbox();
    try {
      const asyncAdd = async (a: number, b: number) => a + b;
      sandbox.setGlobals({ asyncAdd: hostFunction(asyncAdd) });
      const result = await sandbox.evaluate('asyncAdd(10, 20)');
      expect(result).toBe(30);
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when async function rejects', async () => {
    const sandbox = await createSandbox();
    try {
      const asyncFail = async () => {
        throw new Error('async boom');
      };
      sandbox.setGlobals({ asyncFail: hostFunction(asyncFail) });
      await expect(sandbox.evaluate('asyncFail()')).rejects.toThrow('async boom');
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when function returns complex objects', async () => {
    const sandbox = await createSandbox();
    try {
      const makeUser = (name: string) => ({ name, roles: ['admin', 'user'], active: true });
      sandbox.setGlobals({ makeUser: hostFunction(makeUser) });
      const result = await sandbox.evaluate("makeUser('Alice')");
      expect(result).toEqual({ name: 'Alice', roles: ['admin', 'user'], active: true });
    } finally {
      sandbox.dispose();
    }
  });

  it('does not leak when using Buffer polyfill', async () => {
    const sandbox = await createSandbox({ enableBuffer: true });
    try {
      expect(await sandbox.evaluate('Array.from(Buffer.from("hello"))')).toEqual([104, 101, 108, 108, 111]);
      expect(await sandbox.evaluate('Array.from(Buffer.from("aGVsbG8=", "base64"))')).toEqual([
        104, 101, 108, 108, 111
      ]);
      expect(await sandbox.evaluate('Array.from(Buffer.from([1, 2, 3]))')).toEqual([1, 2, 3]);
      expect(await sandbox.evaluate('Buffer.isBuffer(Buffer.from("test"))')).toBe(true);
    } finally {
      sandbox.dispose();
    }
  });

  describe('hostGetter - leak checks', () => {
    it('does not leak when reading a hostGetter property once', async () => {
      const sandbox = await createSandbox();
      try {
        let value = 42;
        sandbox.setGlobals({ prop: hostGetter(() => value) });
        const result = await sandbox.evaluate('prop');
        expect(result).toBe(42);
      } finally {
        sandbox.dispose();
      }
    });

    it('does not leak when reading a hostGetter property multiple times', async () => {
      const sandbox = await createSandbox();
      try {
        let counter = 0;
        sandbox.setGlobals({ getCount: hostGetter(() => ++counter) });
        // Each access should create and dispose a handle without leaking
        const result = await sandbox.evaluate('getCount + getCount + getCount');
        expect(result).toBe(6); // 1 + 2 + 3
      } finally {
        sandbox.dispose();
      }
    });

    it('does not leak when hostGetter returns complex objects', async () => {
      const sandbox = await createSandbox();
      try {
        const state = { users: [{ name: 'Alice' }, { name: 'Bob' }], count: 2 };
        sandbox.setGlobals({ state: hostGetter(() => state) });
        const result = await sandbox.evaluate('state.users[0].name + state.users[1].name');
        expect(result).toBe('AliceBob');
      } finally {
        sandbox.dispose();
      }
    });

    it('does not leak when hostGetter is used with hostFunction (reactive pattern)', async () => {
      const sandbox = await createSandbox();
      try {
        let value = 100;
        sandbox.setGlobals({
          getValue: hostGetter(() => value),
          setValue: hostFunction((v: number) => {
            value = v;
          })
        });
        // Read, write, read pattern - tests the reactive use case
        const result = await sandbox.evaluate('(() => { const a = getValue; setValue(200); return a + getValue; })()');
        expect(result).toBe(300); // 100 + 200
      } finally {
        sandbox.dispose();
      }
    });

    it('does not leak when hostGetter is nested in objects', async () => {
      const sandbox = await createSandbox();
      try {
        let x = 1;
        let y = 2;
        sandbox.setGlobals({
          coords: {
            x: hostGetter(() => x),
            y: hostGetter(() => y)
          }
        });
        const result = await sandbox.evaluate('coords.x + coords.y');
        expect(result).toBe(3);
      } finally {
        sandbox.dispose();
      }
    });

    it('does not leak when hostGetter is accessed many times in a loop', async () => {
      const sandbox = await createSandbox();
      try {
        let counter = 0;
        sandbox.setGlobals({ tick: hostGetter(() => ++counter) });
        // Access the getter 100 times to stress test handle disposal
        const result = await sandbox.evaluate('(() => { let sum = 0; for (let i = 0; i < 100; i++) sum += tick; return sum; })()');
        // Sum of 1 to 100 = 5050
        expect(result).toBe(5050);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('host function error handling - leak checks', () => {
    describe('sync functions', () => {
      it('does not leak when sync function with complex args throws Error', async () => {
        const sandbox = await createSandbox();
        try {
          const processUser = (user: { name: string; roles: string[] }) => {
            throw new Error(`Failed to process user: ${user.name}`);
          };
          sandbox.setGlobals({ processUser: hostFunction(processUser) });
          await expect(
            sandbox.evaluate("processUser({ name: 'Bob', roles: ['admin', 'editor'] })")
          ).rejects.toThrow('Failed to process user: Bob');
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when sync function throws non-Error object', async () => {
        const sandbox = await createSandbox();
        try {
          const validateData = (data: { items: number[]; metadata: { version: string } }) => {
            throw { code: 'VALIDATION_ERROR', details: { field: 'items', received: data.items.length } };
          };
          sandbox.setGlobals({ validateData: hostFunction(validateData) });
          const result = await sandbox.evaluate(`
            (() => {
              try {
                validateData({ items: [1, 2, 3], metadata: { version: '1.0' } });
                return 'not caught';
              } catch (e) {
                return e.code + ':' + e.details.field;
              }
            })()
          `);
          expect(result).toBe('VALIDATION_ERROR:items');
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when sync function with complex args succeeds with complex return', async () => {
        const sandbox = await createSandbox();
        try {
          const transformData = (input: { users: { id: number; name: string }[]; settings: { active: boolean } }) => ({
            count: input.users.length,
            names: input.users.map((u) => u.name),
            isActive: input.settings.active,
            nested: { deep: { value: 42 } }
          });
          sandbox.setGlobals({ transformData: hostFunction(transformData) });
          const result = await sandbox.evaluate(`
            transformData({
              users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
              settings: { active: true }
            })
          `);
          expect(result).toEqual({
            count: 2,
            names: ['Alice', 'Bob'],
            isActive: true,
            nested: { deep: { value: 42 } }
          });
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when sync function throws and is caught multiple times', async () => {
        const sandbox = await createSandbox();
        try {
          const throwIfNegative = (nums: number[]) => {
            const negative = nums.find((n) => n < 0);
            if (negative !== undefined) {
              throw new Error(`Negative number found: ${negative}`);
            }
            return nums.reduce((a, b) => a + b, 0);
          };
          sandbox.setGlobals({ throwIfNegative: hostFunction(throwIfNegative) });
          const result = await sandbox.evaluate(`
            (() => {
              const results = [];
              try { results.push(throwIfNegative([1, 2, 3])); } catch (e) { results.push('err1'); }
              try { results.push(throwIfNegative([4, -5, 6])); } catch (e) { results.push('err2'); }
              try { results.push(throwIfNegative([7, 8, 9])); } catch (e) { results.push('err3'); }
              return results;
            })()
          `);
          expect(result).toEqual([6, 'err2', 24]);
        } finally {
          sandbox.dispose();
        }
      });
    });

    describe('async functions', () => {
      it('does not leak when async function with complex args rejects with Error', async () => {
        const sandbox = await createSandbox();
        try {
          const asyncProcessUser = async (user: { name: string; permissions: string[] }) => {
            throw new Error(`Async failed for user: ${user.name}`);
          };
          sandbox.setGlobals({ asyncProcessUser: hostFunction(asyncProcessUser) });
          await expect(
            sandbox.evaluate("asyncProcessUser({ name: 'Charlie', permissions: ['read', 'write'] })")
          ).rejects.toThrow('Async failed for user: Charlie');
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when async function rejects with non-Error object', async () => {
        const sandbox = await createSandbox();
        try {
          const asyncValidate = async (config: { rules: { name: string; enabled: boolean }[] }) => {
            throw { errorType: 'CONFIG_INVALID', ruleCount: config.rules.length, timestamp: 12345 };
          };
          sandbox.setGlobals({ asyncValidate: hostFunction(asyncValidate) });
          const result = await sandbox.evaluate(`
            (async () => {
              try {
                await asyncValidate({ rules: [{ name: 'rule1', enabled: true }, { name: 'rule2', enabled: false }] });
                return 'not caught';
              } catch (e) {
                return e.errorType + ':' + e.ruleCount;
              }
            })()
          `);
          expect(result).toBe('CONFIG_INVALID:2');
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when async function with complex args resolves with complex return', async () => {
        const sandbox = await createSandbox();
        try {
          const asyncTransform = async (data: { entries: { key: string; values: number[] }[] }) => {
            return {
              summary: data.entries.map((e) => ({ key: e.key, sum: e.values.reduce((a, b) => a + b, 0) })),
              metadata: { processedAt: 'now', count: data.entries.length }
            };
          };
          sandbox.setGlobals({ asyncTransform: hostFunction(asyncTransform) });
          const result = await sandbox.evaluate(`
            asyncTransform({
              entries: [
                { key: 'a', values: [1, 2, 3] },
                { key: 'b', values: [4, 5] }
              ]
            })
          `);
          expect(result).toEqual({
            summary: [
              { key: 'a', sum: 6 },
              { key: 'b', sum: 9 }
            ],
            metadata: { processedAt: 'now', count: 2 }
          });
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when async function rejects and is caught multiple times', async () => {
        const sandbox = await createSandbox();
        try {
          const asyncMayFail = async (config: { shouldFail: boolean; data: { id: number }[] }) => {
            if (config.shouldFail) {
              throw new Error(`Failed with ${config.data.length} items`);
            }
            return config.data.map((d) => d.id * 2);
          };
          sandbox.setGlobals({ asyncMayFail: hostFunction(asyncMayFail) });
          const result = await sandbox.evaluate(`
            (async () => {
              const results = [];
              try { results.push(await asyncMayFail({ shouldFail: false, data: [{ id: 1 }] })); } catch (e) { results.push('err1'); }
              try { results.push(await asyncMayFail({ shouldFail: true, data: [{ id: 2 }, { id: 3 }] })); } catch (e) { results.push('err2'); }
              try { results.push(await asyncMayFail({ shouldFail: false, data: [{ id: 4 }, { id: 5 }] })); } catch (e) { results.push('err3'); }
              return results;
            })()
          `);
          expect(result).toEqual([[2], 'err2', [8, 10]]);
        } finally {
          sandbox.dispose();
        }
      });

      it('does not leak when mixing sync and async functions with errors', async () => {
        const sandbox = await createSandbox();
        try {
          const syncDouble = (nums: number[]) => nums.map((n) => n * 2);
          const syncFail = (msg: string) => {
            throw new Error(msg);
          };
          const asyncTriple = async (nums: number[]) => nums.map((n) => n * 3);
          const asyncFail = async (msg: string) => {
            throw new Error(msg);
          };
          sandbox.setGlobals({
            syncDouble: hostFunction(syncDouble),
            syncFail: hostFunction(syncFail),
            asyncTriple: hostFunction(asyncTriple),
            asyncFail: hostFunction(asyncFail)
          });
          const result = await sandbox.evaluate(`
            (async () => {
              const results = [];
              results.push(syncDouble([1, 2]));
              try { syncFail('sync error'); } catch (e) { results.push('caught sync'); }
              results.push(await asyncTriple([3, 4]));
              try { await asyncFail('async error'); } catch (e) { results.push('caught async'); }
              return results;
            })()
          `);
          expect(result).toEqual([[2, 4], 'caught sync', [9, 12], 'caught async']);
        } finally {
          sandbox.dispose();
        }
      });
    });
  });
});
