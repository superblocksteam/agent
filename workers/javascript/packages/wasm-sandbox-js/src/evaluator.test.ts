import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { evaluateExpressions, prewarmEvaluator } from './evaluator';
import { toVmValue, hostFunction } from './marshal';

describe('evaluateExpressions', () => {
  beforeAll(async () => {
    await prewarmEvaluator();
  });

  describe('basic expressions', () => {
    it('evaluates simple expressions', async () => {
      const results = await evaluateExpressions(['1 + 1']);

      expect(results['1 + 1']).toBe(2);
    });

    it('returns complex objects that contain arrays', async () => {
      const expression = "({user: {name: 'Ada Lovelace', roles: ['engineer', 'pioneer']}, flags: {active: true}})";
      const results = await evaluateExpressions([expression]);

      expect(results[expression]).toEqual({
        user: { name: 'Ada Lovelace', roles: ['engineer', 'pioneer'] },
        flags: { active: true }
      });
    });

    it('returns undefined for expressions that yield undefined', async () => {
      const expression = '(()=>{})()';
      const results = await evaluateExpressions([expression]);

      expect(results[expression]).toBeUndefined();
    });

    it('handles empty and whitespace-only expressions', async () => {
      const results = await evaluateExpressions(['', ' ', '  ', '\n', '\t']);

      expect(results['']).toBeUndefined();
      expect(results[' ']).toBeUndefined();
      expect(results['  ']).toBeUndefined();
      expect(results['\n']).toBeUndefined();
      expect(results['\t']).toBeUndefined();
    });

    it('evaluates multiple expressions and collects results', async () => {
      const expressions = ['1 + 2', "'a' + 'b'", '({value: 4}).value * 2'];
      const results = await evaluateExpressions(expressions);

      expect(results['1 + 2']).toBe(3);
      expect(results["'a' + 'b'"]).toBe('ab');
      expect(results['({value: 4}).value * 2']).toBe(8);
    });
  });

  describe('promises', () => {
    it('resolves promise expressions', async () => {
      const results = await evaluateExpressions(["Promise.resolve('ok')"]);

      expect(results["Promise.resolve('ok')"]).toBe('ok');
    });

    it('resolves promises that return objects', async () => {
      const expression = "Promise.resolve({status: 'ok', data: {count: 2}})";
      const results = await evaluateExpressions([expression]);

      expect(results[expression]).toEqual({ status: 'ok', data: { count: 2 } });
    });

    it('propagates rejected promises with Error instances', async () => {
      await expect(evaluateExpressions(["Promise.reject(new Error('boom'))"])).rejects.toThrow('boom');
    });

    it('throws when promises never settle and no host ops are pending', async () => {
      await expect(evaluateExpressions(['new Promise(() => {})'])).rejects.toThrow(/never settle/i);
    });
  });

  describe('globals', () => {
    it('uses injected globals when evaluating expressions', async () => {
      const expression = "globalValue + '!'"; // ensure globals are visible inside the VM
      const results = await evaluateExpressions([expression], {
        globals: { globalValue: 'hello' }
      });

      expect(results[expression]).toBe('hello!');
    });

    it('injects edge-case globals (null, undefined, nested objects)', async () => {
      const expression = '[globalNull, typeof globalUndefined, nested.value.deep, deepArray[1].flag]';
      const results = await evaluateExpressions([expression], {
        globals: {
          globalNull: null,
          globalUndefined: undefined,
          nested: { value: { deep: 42 } },
          deepArray: [{ flag: false }, { flag: true }]
        }
      });

      expect(results[expression]).toEqual([null, 'undefined', 42, true]);
    });
  });

  describe('globals with functions', () => {
    it('throws when passing unwrapped functions in globals', async () => {
      await expect(
        evaluateExpressions(['add(2, 3)'], {
          globals: { add: (a: number, b: number) => a + b }
        })
      ).rejects.toThrow(/Cannot expose function to sandbox without explicit opt-in/);
    });

    it('throws when passing unwrapped functions nested in objects', async () => {
      await expect(
        evaluateExpressions(['obj.fn()'], {
          globals: { obj: { fn: () => 'test' } }
        })
      ).rejects.toThrow(/Cannot expose function to sandbox without explicit opt-in/);
    });

    it('supports injected functions that can be called from VM', async () => {
      const results = await evaluateExpressions(['add(2, 3)'], {
        globals: { add: hostFunction((a: number, b: number) => a + b) }
      });

      expect(results['add(2, 3)']).toBe(5);
    });

    it('supports nested functions in objects', async () => {
      const results = await evaluateExpressions(['obj.math.double(4)'], {
        globals: { obj: { math: { double: hostFunction((x: number) => x * 2) } } }
      });

      expect(results['obj.math.double(4)']).toBe(8);
    });

    it('supports functions in arrays', async () => {
      const fns = [hostFunction((x: number) => x + 1), hostFunction((x: number) => x * 2)];
      const results = await evaluateExpressions(['fns[0](5) + fns[1](5)'], {
        globals: { fns }
      });

      expect(results['fns[0](5) + fns[1](5)']).toBe(16);
    });

    it('supports async functions that return promises', async () => {
      const asyncAdd = async (a: number, b: number) => {
        return a + b;
      };
      const expression = 'asyncAdd(10, 20)';
      const results = await evaluateExpressions([expression], {
        globals: { asyncAdd: hostFunction(asyncAdd) }
      });

      expect(results[expression]).toBe(30);
    });

    it('supports async functions with delayed resolution', async () => {
      const delayedValue = async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value;
      };
      const expression = "delayedValue('hello')";
      const results = await evaluateExpressions([expression], {
        globals: { delayedValue: hostFunction(delayedValue) },
        enableTimers: true
      });

      expect(results[expression]).toBe('hello');
    });

    it('supports await keyword in expressions', async () => {
      const getValue = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 42;
      };
      // Test that await can be used directly in expressions (not just calling async functions)
      const expression = '(await getValue()) * 2';
      const results = await evaluateExpressions([expression], {
        globals: { getValue: hostFunction(getValue) },
        enableTimers: true
      });

      expect(results[expression]).toBe(84);
    });

    it('supports await in complex expressions', async () => {
      const fetchValue = async (key: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { count: key === 'a' ? 10 : 20 };
      };
      const expression = '(await fetchValue("a")).count + (await fetchValue("b")).count';
      const results = await evaluateExpressions([expression], {
        globals: { fetchValue: hostFunction(fetchValue) },
        enableTimers: true
      });

      expect(results[expression]).toBe(30);
    });

    it('supports functions that return objects', async () => {
      const makeUser = (name: string, age: number) => ({ name, age, active: true });
      const expression = "makeUser('Alice', 30)";
      const results = await evaluateExpressions([expression], {
        globals: { makeUser: hostFunction(makeUser) }
      });

      expect(results[expression]).toEqual({ name: 'Alice', age: 30, active: true });
    });

    it('supports functions that receive object arguments', async () => {
      const getFullName = (user: { first: string; last: string }) => `${user.first} ${user.last}`;
      const expression = "getFullName({ first: 'Ada', last: 'Lovelace' })";
      const results = await evaluateExpressions([expression], {
        globals: { getFullName: hostFunction(getFullName) }
      });

      expect(results[expression]).toBe('Ada Lovelace');
    });

    it('supports functions that receive array arguments', async () => {
      const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);
      const expression = 'sum([1, 2, 3, 4, 5])';
      const results = await evaluateExpressions([expression], {
        globals: { sum: hostFunction(sum) }
      });

      expect(results[expression]).toBe(15);
    });

    it('supports class instances with toVmValue for custom marshalling (sync)', async () => {
      class Counter {
        value: number;
        constructor(initial: number) {
          this.value = initial;
        }
        increment() {
          this.value++;
        }
        getValue() {
          return this.value;
        }
        [toVmValue]() {
          return {
            value: this.value,
            increment: hostFunction(this.increment.bind(this)),
            getValue: hostFunction(this.getValue.bind(this))
          };
        }
      }

      const counter = new Counter(10);
      const expression = '(() => { counter.increment(); counter.increment(); return counter.getValue(); })()';
      const results = await evaluateExpressions([expression], {
        globals: { counter }
      });

      expect(results[expression]).toBe(12);
    });

    it('supports class instances with toVmValue for custom marshalling (async)', async () => {
      class AsyncStore {
        private data: Record<string, unknown> = {};
        async get(key: string): Promise<unknown> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return this.data[key];
        }
        async set(key: string, value: unknown): Promise<void> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          this.data[key] = value;
        }
        [toVmValue]() {
          return {
            get: hostFunction(this.get.bind(this)),
            set: hostFunction(this.set.bind(this))
          };
        }
      }

      const store = new AsyncStore();
      const expression = `(async () => {
        await store.set('count', 42);
        return await store.get('count');
      })()`;
      const results = await evaluateExpressions([expression], {
        globals: { store },
        enableTimers: true
      });

      expect(results[expression]).toBe(42);
    });

    describe('error handling in host functions', () => {
      describe('sync functions', () => {
        it('throws Error with message when host function throws Error', async () => {
          const throwsError = () => {
            throw new Error('sync error message');
          };

          await expect(
            evaluateExpressions(['throwsError()'], { globals: { throwsError: hostFunction(throwsError) } })
          ).rejects.toThrow('sync error message');
        });

        it('throws Error and VM can catch it', async () => {
          const throwsError = () => {
            throw new Error('catchable error');
          };
          const expression = `
            (() => {
              try {
                throwsError();
                return 'not caught';
              } catch (e) {
                return e instanceof Error ? 'caught Error: ' + e.message : 'caught non-Error';
              }
            })()
          `;

          const results = await evaluateExpressions([expression], { globals: { throwsError: hostFunction(throwsError) } });

          expect(results[expression]).toBe('caught Error: catchable error');
        });

        it('throws non-Error values as-is when host function throws non-Error', async () => {
          const throwsString = () => {
            throw 'string error';
          };
          const expression = `
            (() => {
              try {
                throwsString();
                return 'not caught';
              } catch (e) {
                return typeof e === 'string' ? 'caught string: ' + e : 'wrong type: ' + typeof e;
              }
            })()
          `;

          const results = await evaluateExpressions([expression], { globals: { throwsString: hostFunction(throwsString) } });

          expect(results[expression]).toBe('caught string: string error');
        });

        it('throws object values as-is when host function throws object', async () => {
          const throwsObject = () => {
            throw { code: 404, reason: 'not found' };
          };
          const expression = `
            (() => {
              try {
                throwsObject();
                return 'not caught';
              } catch (e) {
                return e && typeof e === 'object' ? 'caught object: ' + e.code + ' ' + e.reason : 'wrong type';
              }
            })()
          `;

          const results = await evaluateExpressions([expression], { globals: { throwsObject: hostFunction(throwsObject) } });

          expect(results[expression]).toBe('caught object: 404 not found');
        });
      });

      describe('async functions', () => {
        it('rejects with Error message when async host function rejects with Error', async () => {
          const asyncThrowsError = async () => {
            throw new Error('async error message');
          };

          await expect(
            evaluateExpressions(['asyncThrowsError()'], { globals: { asyncThrowsError: hostFunction(asyncThrowsError) } })
          ).rejects.toThrow('async error message');
        });

        it('rejects with Error and VM can catch it in async context', async () => {
          const asyncThrowsError = async () => {
            throw new Error('async catchable error');
          };
          const expression = `
            (async () => {
              try {
                await asyncThrowsError();
                return 'not caught';
              } catch (e) {
                return e instanceof Error ? 'caught Error: ' + e.message : 'caught non-Error';
              }
            })()
          `;

          const results = await evaluateExpressions([expression], {
            globals: { asyncThrowsError: hostFunction(asyncThrowsError) },
            enableTimers: true
          });

          expect(results[expression]).toBe('caught Error: async catchable error');
        });

        it('rejects with non-Error values as-is when async host function rejects with non-Error', async () => {
          const asyncThrowsString = async () => {
            throw 'async string error';
          };
          const expression = `
            (async () => {
              try {
                await asyncThrowsString();
                return 'not caught';
              } catch (e) {
                return typeof e === 'string' ? 'caught string: ' + e : 'wrong type: ' + typeof e;
              }
            })()
          `;

          const results = await evaluateExpressions([expression], {
            globals: { asyncThrowsString: hostFunction(asyncThrowsString) },
            enableTimers: true
          });

          expect(results[expression]).toBe('caught string: async string error');
        });

        it('rejects with object values as-is when async host function rejects with object', async () => {
          const asyncThrowsObject = async () => {
            throw { code: 500, reason: 'server error' };
          };
          const expression = `
            (async () => {
              try {
                await asyncThrowsObject();
                return 'not caught';
              } catch (e) {
                return e && typeof e === 'object' ? 'caught object: ' + e.code + ' ' + e.reason : 'wrong type';
              }
            })()
          `;

          const results = await evaluateExpressions([expression], {
            globals: { asyncThrowsObject: hostFunction(asyncThrowsObject) },
            enableTimers: true
          });

          expect(results[expression]).toBe('caught object: 500 server error');
        });

        it('does not deadlock when async host function rejects with a non-marshallable value (regression)', async () => {
          // If the async host function rejects with a value that cannot be marshalled into the VM,
          // the host-side promise bridge must still:
          // - settle the deferred VM promise, and
          // - decrement pending host ops (so runUntilSettled can make progress).
          const asyncRejectsBigInt = async () => {
            throw 1n;
          };

          const expression = 'asyncRejectsBigInt()';

          const evaluationPromise = evaluateExpressions([expression], {
            globals: { asyncRejectsBigInt: hostFunction(asyncRejectsBigInt) }
          });

          const timeoutMs = 1_000;
          const outcome = await Promise.race([
            evaluationPromise.then(
              () => ({ type: 'resolved' as const }),
              (err) => ({ type: 'rejected' as const, err })
            ),
            new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
          ]);

          if (outcome.type === 'timeout') {
            throw new Error(
              `evaluateExpressions hung for >${timeoutMs}ms when an async host function rejected with a BigInt. ` +
                'This indicates a deadlock in the async host function bridge (pending host ops not released).'
            );
          }

          expect(outcome.type).toBe('rejected');
        });

        it('does not deadlock when async host function resolves with a non-marshallable value (regression)', async () => {
          // If the async host function resolves with a value that cannot be marshalled into the VM,
          // the host-side promise bridge must still:
          // - reject the deferred VM promise with a marshalling error, and
          // - decrement pending host ops (so runUntilSettled can make progress).
          const asyncResolvesBigInt = async () => {
            return 1n;
          };

          const expression = 'asyncResolvesBigInt()';

          const evaluationPromise = evaluateExpressions([expression], {
            globals: { asyncResolvesBigInt: hostFunction(asyncResolvesBigInt) }
          });

          const timeoutMs = 1_000;
          const outcome = await Promise.race([
            evaluationPromise.then(
              () => ({ type: 'resolved' as const }),
              (err) => ({ type: 'rejected' as const, err })
            ),
            new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
          ]);

          if (outcome.type === 'timeout') {
            throw new Error(
              `evaluateExpressions hung for >${timeoutMs}ms when an async host function resolved with a BigInt. ` +
                'This indicates a deadlock in the async host function bridge (pending host ops not released).'
            );
          }

          // Should reject with the marshalling error, not resolve
          expect(outcome.type).toBe('rejected');
          if (outcome.type === 'rejected') {
            expect(outcome.err.message).toMatch(/Unsupported type.*bigint/i);
          }
        });
      });
    });
  });

  describe('libraries', () => {
    it('loads lodash lazily and executes its methods', async () => {
      const expression = '_.sum([1, 2, 3])';
      const results = await evaluateExpressions([expression], {
        libraries: ['lodash']
      });

      expect(results[expression]).toBe(6);
    });

    it('loads moment lazily and executes its methods', async () => {
      const expression = "moment('2020-05-02').year()";
      const results = await evaluateExpressions([expression], {
        libraries: ['moment']
      });

      expect(results[expression]).toBe(2020);
    });

    it('fails when calling a library that was not loaded', async () => {
      await expect(evaluateExpressions(['_.sum([1, 2, 3])'])).rejects.toThrow(/not defined/);
    });

    it('loads multiple libraries together and they interoperate', async () => {
      const expression = "moment('2020-05-02').add(_.sum([1, 2]), 'days').date()";
      const results = await evaluateExpressions([expression], {
        libraries: ['lodash', 'moment']
      });

      expect(results[expression]).toBe(5);
    });
  });

  describe('console logger', () => {
    it('routes console calls to the provided logger', async () => {
      const log = jest.fn();
      const warn = jest.fn();
      const error = jest.fn();
      const consoleLogger = { log, warn, error };
      const expression = "console.log('hello console')";

      const results = await evaluateExpressions([expression], { consoleLogger });

      expect(log).toHaveBeenCalledWith('hello console');
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(results[expression]).toBeUndefined();
    });

    it('routes warn and error calls to the provided logger', async () => {
      const log = jest.fn();
      const warn = jest.fn();
      const error = jest.fn();
      const consoleLogger = { log, warn, error };
      // Use comma operator to evaluate multiple console calls as a single expression
      const expression = "(console.warn('heads up'), console.error('bad'))";

      const results = await evaluateExpressions([expression], { consoleLogger });

      expect(results[expression]).toBeUndefined();
      expect(log).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('heads up');
      expect(error).toHaveBeenCalledWith('bad');
    });

    it('leaves console undefined when no logger is provided', async () => {
      await expect(evaluateExpressions(["console.log('should fail')"])).rejects.toThrow(/'console' is not defined/i);
    });
  });

  describe('timers', () => {
    it('resolves promises that rely on setTimeout when timers are enabled', async () => {
      const expression = "new Promise(resolve => setTimeout(() => resolve('done'), 5))";
      const results = await evaluateExpressions([expression], { enableTimers: true });

      expect(results[expression]).toBe('done');
    });

    it('errors when setTimeout is used without enabling timers', async () => {
      await expect(
        evaluateExpressions(["new Promise(resolve => setTimeout(() => resolve('never'), 5))"])
      ).rejects.toThrow(/ReferenceError/);
    });
  });

  describe('limits', () => {
    it('respects custom time limit', async () => {
      // Use an IIFE to make the infinite loop an expression
      await expect(
        evaluateExpressions(['(function() { while (true) {} })()'], { limits: { timeMs: 10 } })
      ).rejects.toThrow(/interrupt|deadline|time/i);
    });

    it('applies time limit while awaiting timers', async () => {
      // Previously, timeMs was only enforced while QuickJS was executing.
      // If evaluation awaited a host timer (via enableTimers), it could block forever.
      const expression = "new Promise(resolve => setTimeout(() => resolve('done'), 200))";

      const evaluationPromise = evaluateExpressions([expression], {
        enableTimers: true,
        limits: { timeMs: 50 }
      });

      const timeoutMs = 1_000;
      const outcome = await Promise.race([
        evaluationPromise.then(
          () => ({ type: 'resolved' as const }),
          (err) => ({ type: 'rejected' as const, err })
        ),
        new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
      ]);

      if (outcome.type === 'timeout') {
        throw new Error(
          `evaluateExpressions hung for >${timeoutMs}ms while awaiting a VM timer. ` +
            'This indicates timeMs is not enforced during host waits.'
        );
      }

      expect(outcome.type).toBe('rejected');
      if (outcome.type === 'rejected') {
        expect(outcome.err.message).toMatch(/timed out|interrupt|deadline|time/i);
      }
    });

    it('applies time limit while awaiting host async operations', async () => {
      // Host async operations (e.g., async hostFunction()) should not be able to extend evaluation
      // beyond timeMs, otherwise untrusted code can stall the worker indefinitely.
      const slow = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'ok';
      };

      const expression = 'slow()';
      const evaluationPromise = evaluateExpressions([expression], {
        globals: { slow: hostFunction(slow) },
        limits: { timeMs: 50 }
      });

      const timeoutMs = 1_000;
      const outcome = await Promise.race([
        evaluationPromise.then(
          () => ({ type: 'resolved' as const }),
          (err) => ({ type: 'rejected' as const, err })
        ),
        new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
      ]);

      if (outcome.type === 'timeout') {
        throw new Error(
          `evaluateExpressions hung for >${timeoutMs}ms while awaiting a host async op. ` +
            'This indicates timeMs is not enforced during host waits.'
        );
      }

      expect(outcome.type).toBe('rejected');
      if (outcome.type === 'rejected') {
        expect(outcome.err.message).toMatch(/timed out|interrupt|deadline|time/i);
      }

      // Allow the host promise to resolve later; this should not crash by calling into a disposed QuickJS context.
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    it('respects custom stack size limit', async () => {
      await expect(
        evaluateExpressions(['(function f(){ return f(); })()'], {
          limits: { stackBytes: 4 * 1024 }
        })
      ).rejects.toThrow(/stack/i);
    });

    it('respects custom memory limit', async () => {
      await expect(
        evaluateExpressions(['Array(1e6).fill(0)'], {
          limits: { memoryBytes: 64 * 1024 }
        })
      ).rejects.toThrow(/memory|allocate/i);
    });
  });

  describe('serialization and error handling', () => {
    it('fails when trying to serialize non-JSON-safe values (BigInt)', async () => {
      await expect(evaluateExpressions(['1n'])).rejects.toThrow(/BigInt/i);
    });

    it('fails when returning cyclic objects', async () => {
      const expression = '(()=>{ const obj = {}; obj.self = obj; return obj; })()';

      // QuickJS either throws a cyclic/circular error during serialization,
      // or fails with an internal assertion when disposing the runtime with leaked handles
      await expect(evaluateExpressions([expression])).rejects.toThrow(/cyclic|circular|gc_obj_list/i);
    });

    it('surfaces thrown string values', async () => {
      await expect(evaluateExpressions(["(()=>{ throw 'boom'; })()"])).rejects.toThrow('boom');
    });

    it('surfaces thrown objects by stringifying them', async () => {
      await expect(evaluateExpressions(["(()=>{ throw {reason: 'nope', code: 400}; })()"])).rejects.toThrow(
        /"reason":"nope"/
      );
    });

    it('returns undefined for symbol values (mimics JSON.stringify)', async () => {
      const expression = 'Symbol("test")';
      const results = await evaluateExpressions([expression]);

      expect(results[expression]).toBeUndefined();
    });

    it('returns undefined for function values (mimics JSON.stringify)', async () => {
      const expression = '(() => {})';
      const results = await evaluateExpressions([expression]);

      expect(results[expression]).toBeUndefined();
    });

    it('calls toJSON method on objects and returns wrapper with toJSON', async () => {
      const expression = '({ value: 42, toJSON: function() { return { serialized: this.value * 2 }; } })';
      const results = await evaluateExpressions([expression]);

      // Result is a wrapper with toJSON that returns the extracted value
      // When JSON.stringify is called, it produces the correct output
      expect(JSON.stringify(results[expression])).toBe('{"serialized":84}');
      // The wrapper's toJSON returns the extracted value
      expect((results[expression] as { toJSON: () => unknown }).toJSON()).toEqual({ serialized: 84 });
    });

    it('calls toJSON method and preserves string results via wrapper', async () => {
      const expression = '({ toJSON: function() { return "custom string"; } })';
      const results = await evaluateExpressions([expression]);

      // When JSON.stringify is called, it produces the correct output (with quotes)
      // This matches JSON.stringify behavior: JSON.stringify({toJSON: () => "x"}) === '"x"'
      expect(JSON.stringify(results[expression])).toBe('"custom string"');
    });

    it('calls toJSON method and preserves number results via wrapper', async () => {
      const expression = '({ toJSON: function() { return 42; } })';
      const results = await evaluateExpressions([expression]);

      // When JSON.stringify is called, it produces the correct output
      expect(JSON.stringify(results[expression])).toBe('42');
    });

    it('calls toJSON method and preserves null results via wrapper', async () => {
      const expression = '({ toJSON: function() { return null; } })';
      const results = await evaluateExpressions([expression]);

      // When JSON.stringify is called, it produces the correct output
      expect(JSON.stringify(results[expression])).toBe('null');
    });

    it('handles moment-like objects with toJSON returning ISO date strings', async () => {
      // This tests the exact pattern used by moment.js
      const expression = '({ _d: new Date(0), toJSON: function() { return this._d.toISOString(); } })';
      const results = await evaluateExpressions([expression]);

      // When JSON.stringify is called, the ISO date string is wrapped in quotes
      expect(JSON.stringify(results[expression])).toBe('"1970-01-01T00:00:00.000Z"');
    });

    it('handles nested objects with toJSON methods', async () => {
      const expression = '({ outer: { inner: 1, toJSON: function() { return { transformed: true }; } } })';
      const results = await evaluateExpressions([expression]);

      // Nested toJSON is also wrapped, so JSON.stringify produces correct output
      expect(JSON.stringify(results[expression])).toBe('{"outer":{"transformed":true}}');
    });

    describe('sparse arrays', () => {
      it('extracts sparse arrays efficiently without iterating all indices', async () => {
        // This would cause memory/CPU exhaustion if we iterated all 1e9 indices
        const expression = '(() => { const a = []; a[1000000000] = "last"; a[0] = "first"; return a; })()';
        const results = await evaluateExpressions([expression], { limits: { timeMs: 1000 } });

        const arr = results[expression] as unknown[];
        expect(arr[0]).toBe('first');
        expect(arr[1000000000]).toBe('last');
        expect(arr.length).toBe(1000000001);
        // Verify it's actually sparse (indices 1 through 999999999 are holes)
        expect(Object.keys(arr)).toEqual(['0', '1000000000']);
      });

      it('preserves holes vs explicit undefined in arrays', async () => {
        // [1, undefined, 3] has explicit undefined at index 1
        // [1, , 3] has a hole at index 1
        const explicitUndefined = '([1, undefined, 3])';
        const holeArray = '(() => { const a = [1]; a[2] = 3; return a; })()';

        const results = await evaluateExpressions([explicitUndefined, holeArray]);

        const explicit = results[explicitUndefined] as unknown[];
        const holey = results[holeArray] as unknown[];

        // Both have length 3
        expect(explicit.length).toBe(3);
        expect(holey.length).toBe(3);

        // Explicit undefined: index 1 exists as own property
        expect(Object.prototype.hasOwnProperty.call(explicit, 1)).toBe(true);
        expect(explicit[1]).toBeUndefined();

        // Hole: index 1 does NOT exist as own property
        expect(Object.prototype.hasOwnProperty.call(holey, 1)).toBe(false);
        expect(holey[1]).toBeUndefined();
      });

      it('handles dense arrays correctly', async () => {
        const expression = '([1, 2, 3, 4, 5])';
        const results = await evaluateExpressions([expression]);

        expect(results[expression]).toEqual([1, 2, 3, 4, 5]);
      });

      it('ignores non-index string keys on arrays', async () => {
        // Arrays can have string keys like arr.foo = 'bar', which should be ignored
        const expression = '(() => { const a = [1, 2, 3]; a.customProp = "ignored"; return a; })()';
        const results = await evaluateExpressions([expression]);

        const arr = results[expression] as unknown[];
        expect(arr).toEqual([1, 2, 3]);
        expect(arr.length).toBe(3);
        // The string key should not be present
        expect((arr as unknown as Record<string, unknown>).customProp).toBeUndefined();
      });

      it('does not treat non-canonical numeric-looking keys as indices (e.g. "01")', async () => {
        // "01" is not an array index key in JavaScript (it is a string property).
        // We intentionally skip non-index keys when extracting arrays.
        const expression = '(() => { const a = []; a["01"] = "nope"; a.length = 3; return a; })()';
        const results = await evaluateExpressions([expression]);

        const arr = results[expression] as unknown[];
        expect(arr.length).toBe(3);
        // No element should be set at index 1.
        expect(Object.prototype.hasOwnProperty.call(arr, 1)).toBe(false);
        expect(Object.keys(arr)).toEqual([]);
      });
    });
  });

  describe('misc sandbox security', () => {
    it('prototype pollution in VM does not affect host Object.prototype', async () => {
      // Attempt to pollute Object.prototype inside the VM
      await evaluateExpressions([
        'Object.prototype.pwned = true',
        '({}).__proto__.alsoPwned = 42'
      ]);

      // Verify host Object.prototype is unaffected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((({} as any).pwned)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((({} as any).alsoPwned)).toBeUndefined();
    });

    it('cannot escape sandbox via constructor chain', async () => {
      // Common sandbox escape attempts that work in Node.js vm module
      // We wrap each in a try/catch because some throw ReferenceError (which is also safe)
      const escapeAttempts = [
        '(() => { try { return this.constructor.constructor("return process")(); } catch { return undefined; } })()',
        '(() => { try { return (function(){return this})().process; } catch { return undefined; } })()',
        '(() => { try { return globalThis.process; } catch { return undefined; } })()',
        '(() => { try { return global; } catch { return undefined; } })()',
        '(() => { try { return require; } catch { return undefined; } })()',
        '(() => { try { return module; } catch { return undefined; } })()'
      ];

      const results = await evaluateExpressions(escapeAttempts);

      // All escape attempts should return undefined (the value doesn't exist or throws)
      for (const attempt of escapeAttempts) {
        expect(results[attempt]).toBeUndefined();
      }
    });
  });
});
