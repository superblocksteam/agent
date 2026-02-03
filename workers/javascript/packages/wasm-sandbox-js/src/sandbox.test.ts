import { describe, expect, it, jest } from '@jest/globals';
import { createSandbox, Sandbox } from './sandbox';
import { toVmValue, hostFunction, hostGetter } from './marshal';

describe('Sandbox', () => {
  describe('basic expressions', () => {
    it('evaluates simple expressions', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate('1 + 1');
        expect(result).toBe(2);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns complex objects that contain arrays', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = "({user: {name: 'Ada Lovelace', roles: ['engineer', 'pioneer']}, flags: {active: true}})";
        const result = await sandbox.evaluate(expression);
        expect(result).toEqual({
          user: { name: 'Ada Lovelace', roles: ['engineer', 'pioneer'] },
          flags: { active: true }
        });
      } finally {
        sandbox.dispose();
      }
    });

    it('returns undefined for expressions that yield undefined', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate('(()=>{})()');
        expect(result).toBeUndefined();
      } finally {
        sandbox.dispose();
      }
    });

    it('handles empty and whitespace-only expressions', async () => {
      const sandbox = await createSandbox();
      try {
        expect(await sandbox.evaluate('')).toBeUndefined();
        expect(await sandbox.evaluate(' ')).toBeUndefined();
        expect(await sandbox.evaluate('  ')).toBeUndefined();
        expect(await sandbox.evaluate('\n')).toBeUndefined();
        expect(await sandbox.evaluate('\t')).toBeUndefined();
      } finally {
        sandbox.dispose();
      }
    });

    it('evaluates multiple expressions and collects results', async () => {
      const sandbox = await createSandbox();
      try {
        expect(await sandbox.evaluate('1 + 2')).toBe(3);
        expect(await sandbox.evaluate("'a' + 'b'")).toBe('ab');
        expect(await sandbox.evaluate('({value: 4}).value * 2')).toBe(8);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('promises', () => {
    it('resolves promise expressions', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate("Promise.resolve('ok')");
        expect(result).toBe('ok');
      } finally {
        sandbox.dispose();
      }
    });

    it('resolves promises that return objects', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate("Promise.resolve({status: 'ok', data: {count: 2}})");
        expect(result).toEqual({ status: 'ok', data: { count: 2 } });
      } finally {
        sandbox.dispose();
      }
    });

    it('propagates rejected promises with Error instances', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("Promise.reject(new Error('boom'))")).rejects.toThrow('boom');
      } finally {
        sandbox.dispose();
      }
    });

    it('throws when promises never settle and no host ops are pending', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate('new Promise(() => {})')).rejects.toThrow(/never settle/i);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('globals', () => {
    it('uses injected globals when evaluating expressions', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({ globalValue: 'hello' });
        const result = await sandbox.evaluate("globalValue + '!'");
        expect(result).toBe('hello!');
      } finally {
        sandbox.dispose();
      }
    });

    it('injects edge-case globals (null, undefined, nested objects)', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({
          globalNull: null,
          globalUndefined: undefined,
          nested: { value: { deep: 42 } },
          deepArray: [{ flag: false }, { flag: true }]
        });
        const result = await sandbox.evaluate(
          '[globalNull, typeof globalUndefined, nested.value.deep, deepArray[1].flag]'
        );
        expect(result).toEqual([null, 'undefined', 42, true]);
      } finally {
        sandbox.dispose();
      }
    });

    it('can be called multiple times to add more globals', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({ a: 1 });
        sandbox.setGlobals({ b: 2 });
        const result = await sandbox.evaluate('a + b');
        expect(result).toBe(3);
      } finally {
        sandbox.dispose();
      }
    });

    it('overwrites existing globals with the same name', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({ value: 'original' });
        expect(await sandbox.evaluate('value')).toBe('original');

        sandbox.setGlobals({ value: 'updated' });
        expect(await sandbox.evaluate('value')).toBe('updated');
      } finally {
        sandbox.dispose();
      }
    });

    it('persists globals set by user code for subsequent evaluations', async () => {
      const sandbox = await createSandbox();
      try {
        await sandbox.evaluate('globalThis.userGlobal = 42');
        const result = await sandbox.evaluate('userGlobal');
        expect(result).toBe(42);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('globals with functions', () => {
    it('throws when passing unwrapped functions in globals', async () => {
      const sandbox = await createSandbox();
      try {
        expect(() => {
          sandbox.setGlobals({ add: (a: number, b: number) => a + b });
        }).toThrow(/Cannot expose function to sandbox without explicit opt-in/);
      } finally {
        sandbox.dispose();
      }
    });

    it('throws when passing unwrapped functions nested in objects', async () => {
      const sandbox = await createSandbox();
      try {
        expect(() => {
          sandbox.setGlobals({ obj: { fn: () => 'test' } });
        }).toThrow(/Cannot expose function to sandbox without explicit opt-in/);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports injected functions that can be called from VM', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({ add: hostFunction((a: number, b: number) => a + b) });
        const result = await sandbox.evaluate('add(2, 3)');
        expect(result).toBe(5);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports nested functions in objects', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({ obj: { math: { double: hostFunction((x: number) => x * 2) } } });
        const result = await sandbox.evaluate('obj.math.double(4)');
        expect(result).toBe(8);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports functions in arrays', async () => {
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

    it('supports async functions that return promises', async () => {
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

    it('supports async functions with delayed resolution', async () => {
      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const delayedValue = async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return value;
        };
        sandbox.setGlobals({ delayedValue: hostFunction(delayedValue) });
        const result = await sandbox.evaluate("delayedValue('hello')");
        expect(result).toBe('hello');
      } finally {
        sandbox.dispose();
      }
    });

    it('supports await keyword in expressions', async () => {
      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const getValue = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 42;
        };
        sandbox.setGlobals({ getValue: hostFunction(getValue) });
        const result = await sandbox.evaluate('(await getValue()) * 2');
        expect(result).toBe(84);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports await in complex expressions', async () => {
      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const fetchValue = async (key: string) => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return { count: key === 'a' ? 10 : 20 };
        };
        sandbox.setGlobals({ fetchValue: hostFunction(fetchValue) });
        const result = await sandbox.evaluate(
          '(await fetchValue("a")).count + (await fetchValue("b")).count'
        );
        expect(result).toBe(30);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports functions that return objects', async () => {
      const sandbox = await createSandbox();
      try {
        const makeUser = (name: string, age: number) => ({ name, age, active: true });
        sandbox.setGlobals({ makeUser: hostFunction(makeUser) });
        const result = await sandbox.evaluate("makeUser('Alice', 30)");
        expect(result).toEqual({ name: 'Alice', age: 30, active: true });
      } finally {
        sandbox.dispose();
      }
    });

    it('supports functions that receive object arguments', async () => {
      const sandbox = await createSandbox();
      try {
        const getFullName = (user: { first: string; last: string }) => `${user.first} ${user.last}`;
        sandbox.setGlobals({ getFullName: hostFunction(getFullName) });
        const result = await sandbox.evaluate("getFullName({ first: 'Ada', last: 'Lovelace' })");
        expect(result).toBe('Ada Lovelace');
      } finally {
        sandbox.dispose();
      }
    });

    it('supports functions that receive array arguments', async () => {
      const sandbox = await createSandbox();
      try {
        const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);
        sandbox.setGlobals({ sum: hostFunction(sum) });
        const result = await sandbox.evaluate('sum([1, 2, 3, 4, 5])');
        expect(result).toBe(15);
      } finally {
        sandbox.dispose();
      }
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

      const sandbox = await createSandbox();
      try {
        const counter = new Counter(10);
        sandbox.setGlobals({ counter });
        const result = await sandbox.evaluate(
          '(() => { counter.increment(); counter.increment(); return counter.getValue(); })()'
        );
        expect(result).toBe(12);
      } finally {
        sandbox.dispose();
      }
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

      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const store = new AsyncStore();
        sandbox.setGlobals({ store });
        const result = await sandbox.evaluate(`(async () => {
          await store.set('count', 42);
          return await store.get('count');
        })()`);
        expect(result).toBe(42);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports hostGetter for reactive property access', async () => {
      let currentValue = 10;

      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({
          obj: {
            value: hostGetter(() => currentValue)
          }
        });

        // Initial read
        const result1 = await sandbox.evaluate('obj.value');
        expect(result1).toBe(10);

        // Update the host-side value
        currentValue = 42;

        // Read again - should see updated value
        const result2 = await sandbox.evaluate('obj.value');
        expect(result2).toBe(42);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports hostGetter with toVmValue for reactive class properties', async () => {
      class Variable {
        private _value: number;

        constructor(initial: number) {
          this._value = initial;
        }

        set(newValue: number): void {
          this._value = newValue;
        }

        [toVmValue]() {
          return {
            value: hostGetter(() => this._value),
            set: hostFunction(this.set.bind(this))
          };
        }
      }

      const sandbox = await createSandbox();
      try {
        const variable = new Variable(100);
        sandbox.setGlobals({ myVar: variable });

        // Read initial value
        const result1 = await sandbox.evaluate('myVar.value');
        expect(result1).toBe(100);

        // Set new value and read back in the same evaluation
        const result2 = await sandbox.evaluate('(myVar.set(200), myVar.value)');
        expect(result2).toBe(200);

        // Verify the value persists across evaluations
        const result3 = await sandbox.evaluate('myVar.value');
        expect(result3).toBe(200);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports hostGetter returning complex objects', async () => {
      const state = { users: [{ name: 'Alice' }, { name: 'Bob' }], count: 2 };

      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({
          getState: hostGetter(() => state)
        });

        const result = await sandbox.evaluate('getState.users[0].name + " and " + getState.users[1].name');
        expect(result).toBe('Alice and Bob');

        // Modify host-side state
        state.users.push({ name: 'Charlie' });
        state.count = 3;

        // Read again - should see updated state
        const result2 = await sandbox.evaluate('getState.count');
        expect(result2).toBe(3);

        const result3 = await sandbox.evaluate('getState.users[2].name');
        expect(result3).toBe('Charlie');
      } finally {
        sandbox.dispose();
      }
    });

    it('supports multiple hostGetters on the same object', async () => {
      let x = 1;
      let y = 2;

      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({
          coords: {
            x: hostGetter(() => x),
            y: hostGetter(() => y)
          }
        });

        const result1 = await sandbox.evaluate('coords.x + coords.y');
        expect(result1).toBe(3);

        x = 10;
        y = 20;

        const result2 = await sandbox.evaluate('coords.x + coords.y');
        expect(result2).toBe(30);
      } finally {
        sandbox.dispose();
      }
    });

    it('hostGetter properties are enumerable', async () => {
      const sandbox = await createSandbox();
      try {
        sandbox.setGlobals({
          obj: {
            staticProp: 'static',
            dynamicProp: hostGetter(() => 'dynamic')
          }
        });

        const result = await sandbox.evaluate('Object.keys(obj).sort()');
        expect(result).toEqual(['dynamicProp', 'staticProp']);
      } finally {
        sandbox.dispose();
      }
    });

    describe('error handling in host functions', () => {
      describe('sync functions', () => {
        it('throws Error with message when host function throws Error', async () => {
          const sandbox = await createSandbox();
          try {
            const throwsError = () => {
              throw new Error('sync error message');
            };
            sandbox.setGlobals({ throwsError: hostFunction(throwsError) });
            await expect(sandbox.evaluate('throwsError()')).rejects.toThrow('sync error message');
          } finally {
            sandbox.dispose();
          }
        });

        it('throws Error and VM can catch it', async () => {
          const sandbox = await createSandbox();
          try {
            const throwsError = () => {
              throw new Error('catchable error');
            };
            sandbox.setGlobals({ throwsError: hostFunction(throwsError) });
            const result = await sandbox.evaluate(`
              (() => {
                try {
                  throwsError();
                  return 'not caught';
                } catch (e) {
                  return e instanceof Error ? 'caught Error: ' + e.message : 'caught non-Error';
                }
              })()
            `);
            expect(result).toBe('caught Error: catchable error');
          } finally {
            sandbox.dispose();
          }
        });

        it('throws non-Error values as-is when host function throws non-Error', async () => {
          const sandbox = await createSandbox();
          try {
            const throwsString = () => {
              throw 'string error';
            };
            sandbox.setGlobals({ throwsString: hostFunction(throwsString) });
            const result = await sandbox.evaluate(`
              (() => {
                try {
                  throwsString();
                  return 'not caught';
                } catch (e) {
                  return typeof e === 'string' ? 'caught string: ' + e : 'wrong type: ' + typeof e;
                }
              })()
            `);
            expect(result).toBe('caught string: string error');
          } finally {
            sandbox.dispose();
          }
        });

        it('throws object values as-is when host function throws object', async () => {
          const sandbox = await createSandbox();
          try {
            const throwsObject = () => {
              throw { code: 404, reason: 'not found' };
            };
            sandbox.setGlobals({ throwsObject: hostFunction(throwsObject) });
            const result = await sandbox.evaluate(`
              (() => {
                try {
                  throwsObject();
                  return 'not caught';
                } catch (e) {
                  return e && typeof e === 'object' ? 'caught object: ' + e.code + ' ' + e.reason : 'wrong type';
                }
              })()
            `);
            expect(result).toBe('caught object: 404 not found');
          } finally {
            sandbox.dispose();
          }
        });
      });

      describe('async functions', () => {
        it('rejects with Error message when async host function rejects with Error', async () => {
          const sandbox = await createSandbox();
          try {
            const asyncThrowsError = async () => {
              throw new Error('async error message');
            };
            sandbox.setGlobals({ asyncThrowsError: hostFunction(asyncThrowsError) });
            await expect(sandbox.evaluate('asyncThrowsError()')).rejects.toThrow('async error message');
          } finally {
            sandbox.dispose();
          }
        });

        it('rejects with Error and VM can catch it in async context', async () => {
          const sandbox = await createSandbox({ enableTimers: true });
          try {
            const asyncThrowsError = async () => {
              throw new Error('async catchable error');
            };
            sandbox.setGlobals({ asyncThrowsError: hostFunction(asyncThrowsError) });
            const result = await sandbox.evaluate(`
              (async () => {
                try {
                  await asyncThrowsError();
                  return 'not caught';
                } catch (e) {
                  return e instanceof Error ? 'caught Error: ' + e.message : 'caught non-Error';
                }
              })()
            `);
            expect(result).toBe('caught Error: async catchable error');
          } finally {
            sandbox.dispose();
          }
        });

        it('rejects with non-Error values as-is when async host function rejects with non-Error', async () => {
          const sandbox = await createSandbox({ enableTimers: true });
          try {
            const asyncThrowsString = async () => {
              throw 'async string error';
            };
            sandbox.setGlobals({ asyncThrowsString: hostFunction(asyncThrowsString) });
            const result = await sandbox.evaluate(`
              (async () => {
                try {
                  await asyncThrowsString();
                  return 'not caught';
                } catch (e) {
                  return typeof e === 'string' ? 'caught string: ' + e : 'wrong type: ' + typeof e;
                }
              })()
            `);
            expect(result).toBe('caught string: async string error');
          } finally {
            sandbox.dispose();
          }
        });

        it('rejects with object values as-is when async host function rejects with object', async () => {
          const sandbox = await createSandbox({ enableTimers: true });
          try {
            const asyncThrowsObject = async () => {
              throw { code: 500, reason: 'server error' };
            };
            sandbox.setGlobals({ asyncThrowsObject: hostFunction(asyncThrowsObject) });
            const result = await sandbox.evaluate(`
              (async () => {
                try {
                  await asyncThrowsObject();
                  return 'not caught';
                } catch (e) {
                  return e && typeof e === 'object' ? 'caught object: ' + e.code + ' ' + e.reason : 'wrong type';
                }
              })()
            `);
            expect(result).toBe('caught object: 500 server error');
          } finally {
            sandbox.dispose();
          }
        });

        it('does not deadlock when async host function rejects with a non-marshallable value (regression)', async () => {
          const sandbox = await createSandbox();
          try {
            const asyncRejectsBigInt = async () => {
              throw 1n;
            };
            sandbox.setGlobals({ asyncRejectsBigInt: hostFunction(asyncRejectsBigInt) });

            const timeoutMs = 1_000;
            const outcome = await Promise.race([
              sandbox.evaluate('asyncRejectsBigInt()').then(
                () => ({ type: 'resolved' as const }),
                (err) => ({ type: 'rejected' as const, err })
              ),
              new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
            ]);

            if (outcome.type === 'timeout') {
              throw new Error(
                `evaluate hung for >${timeoutMs}ms when an async host function rejected with a BigInt. ` +
                  'This indicates a deadlock in the async host function bridge (pending host ops not released).'
              );
            }

            expect(outcome.type).toBe('rejected');
          } finally {
            sandbox.dispose();
          }
        });

        it('does not deadlock when async host function resolves with a non-marshallable value (regression)', async () => {
          const sandbox = await createSandbox();
          try {
            const asyncResolvesBigInt = async () => {
              return 1n;
            };
            sandbox.setGlobals({ asyncResolvesBigInt: hostFunction(asyncResolvesBigInt) });

            const timeoutMs = 1_000;
            const outcome = await Promise.race([
              sandbox.evaluate('asyncResolvesBigInt()').then(
                () => ({ type: 'resolved' as const }),
                (err) => ({ type: 'rejected' as const, err })
              ),
              new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
            ]);

            if (outcome.type === 'timeout') {
              throw new Error(
                `evaluate hung for >${timeoutMs}ms when an async host function resolved with a BigInt. ` +
                  'This indicates a deadlock in the async host function bridge (pending host ops not released).'
              );
            }

            // Should reject with the marshalling error, not resolve
            expect(outcome.type).toBe('rejected');
            if (outcome.type === 'rejected') {
              expect(outcome.err.message).toMatch(/Unsupported type.*bigint/i);
            }
          } finally {
            sandbox.dispose();
          }
        });
      });
    });
  });

  describe('globalLibraries', () => {
    it('loads lodash lazily and executes its methods', async () => {
      const sandbox = await createSandbox({ globalLibraries: ['lodash'] });
      try {
        const result = await sandbox.evaluate('_.sum([1, 2, 3])');
        expect(result).toBe(6);
      } finally {
        sandbox.dispose();
      }
    });

    it('loads moment lazily and executes its methods', async () => {
      const sandbox = await createSandbox({ globalLibraries: ['moment'] });
      try {
        const result = await sandbox.evaluate("moment('2020-05-02').year()");
        expect(result).toBe(2020);
      } finally {
        sandbox.dispose();
      }
    });

    it('fails when calling a library that was not loaded', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate('_.sum([1, 2, 3])')).rejects.toThrow(/not defined/);
      } finally {
        sandbox.dispose();
      }
    });

    it('loads multiple libraries together and they interoperate', async () => {
      const sandbox = await createSandbox({ globalLibraries: ['lodash', 'moment'] });
      try {
        const result = await sandbox.evaluate("moment('2020-05-02').add(_.sum([1, 2]), 'days').date()");
        expect(result).toBe(5);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('console logger', () => {
    it('routes console calls to the provided logger', async () => {
      const log = jest.fn();
      const warn = jest.fn();
      const error = jest.fn();

      const sandbox = await createSandbox();
      try {
        sandbox.setConsole({ log, warn, error });
        await sandbox.evaluate("console.log('hello console')");

        expect(log).toHaveBeenCalledWith('hello console');
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      } finally {
        sandbox.dispose();
      }
    });

    it('routes warn and error calls to the provided logger', async () => {
      const log = jest.fn();
      const warn = jest.fn();
      const error = jest.fn();

      const sandbox = await createSandbox();
      try {
        sandbox.setConsole({ log, warn, error });
        await sandbox.evaluate("(console.warn('heads up'), console.error('bad'))");

        expect(log).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith('heads up');
        expect(error).toHaveBeenCalledWith('bad');
      } finally {
        sandbox.dispose();
      }
    });

    it('leaves console undefined when no logger is provided', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("console.log('should fail')")).rejects.toThrow(/'console' is not defined/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('can change the logger between evaluations', async () => {
      const logger1 = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
      const logger2 = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

      const sandbox = await createSandbox();
      try {
        sandbox.setConsole(logger1);
        await sandbox.evaluate("console.log('first')");

        sandbox.setConsole(logger2);
        await sandbox.evaluate("console.log('second')");

        expect(logger1.log).toHaveBeenCalledWith('first');
        expect(logger1.log).toHaveBeenCalledTimes(1);
        expect(logger2.log).toHaveBeenCalledWith('second');
        expect(logger2.log).toHaveBeenCalledTimes(1);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('timers', () => {
    it('resolves promises that rely on setTimeout when timers are enabled', async () => {
      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const result = await sandbox.evaluate("new Promise(resolve => setTimeout(() => resolve('done'), 5))");
        expect(result).toBe('done');
      } finally {
        sandbox.dispose();
      }
    });

    it('errors when setTimeout is used without enabling timers', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(
          sandbox.evaluate("new Promise(resolve => setTimeout(() => resolve('never'), 5))")
        ).rejects.toThrow(/setTimeout.*not defined/i);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('buffer', () => {
    it('creates a sandbox with buffer support', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        // Buffer polyfill only supports Buffer.from() and Buffer.isBuffer()
        const result = await sandbox.evaluate("Buffer.isBuffer(Buffer.from('hello'))");
        expect(result).toBe(true);

        // Verify the buffer contains the correct bytes
        const bytes = await sandbox.evaluate("Array.from(Buffer.from('hello'))");
        expect(bytes).toEqual([104, 101, 108, 108, 111]); // ASCII codes for 'hello'
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('limits', () => {
    it('respects custom time limit', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(
          sandbox.evaluate('(function() { while (true) {} })()', { timeLimitMs: 10 })
        ).rejects.toThrow(/interrupt|deadline|time/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('applies time limit while awaiting timers', async () => {
      const sandbox = await createSandbox({ enableTimers: true });
      try {
        const expression = "new Promise(resolve => setTimeout(() => resolve('done'), 200))";

        const timeoutMs = 1_000;
        const outcome = await Promise.race([
          sandbox.evaluate(expression, { timeLimitMs: 50 }).then(
            () => ({ type: 'resolved' as const }),
            (err) => ({ type: 'rejected' as const, err })
          ),
          new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
        ]);

        if (outcome.type === 'timeout') {
          throw new Error(
            `evaluate hung for >${timeoutMs}ms while awaiting a VM timer. ` +
              'This indicates timeLimitMs is not enforced during host waits.'
          );
        }

        expect(outcome.type).toBe('rejected');
        if (outcome.type === 'rejected') {
          expect(outcome.err.message).toMatch(/timed out|interrupt|deadline|time/i);
        }
      } finally {
        sandbox.dispose();
      }
    });

    it('applies time limit while awaiting host async operations', async () => {
      const sandbox = await createSandbox();
      try {
        const slow = async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return 'ok';
        };
        sandbox.setGlobals({ slow: hostFunction(slow) });

        const timeoutMs = 1_000;
        const outcome = await Promise.race([
          sandbox.evaluate('slow()', { timeLimitMs: 50 }).then(
            () => ({ type: 'resolved' as const }),
            (err) => ({ type: 'rejected' as const, err })
          ),
          new Promise<{ type: 'timeout' }>((resolve) => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
        ]);

        if (outcome.type === 'timeout') {
          throw new Error(
            `evaluate hung for >${timeoutMs}ms while awaiting a host async op. ` +
              'This indicates timeLimitMs is not enforced during host waits.'
          );
        }

        expect(outcome.type).toBe('rejected');
        if (outcome.type === 'rejected') {
          expect(outcome.err.message).toMatch(/timed out|interrupt|deadline|time/i);
        }

        // Allow the host promise to resolve later; this should not crash by calling into a disposed QuickJS context.
        await new Promise((resolve) => setTimeout(resolve, 250));
      } finally {
        sandbox.dispose();
      }
    });

    it('respects custom stack size limit', async () => {
      const sandbox = await createSandbox({ limits: { stackBytes: 4 * 1024 } });
      try {
        await expect(sandbox.evaluate('(function f(){ return f(); })()')).rejects.toThrow(/stack/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('respects custom memory limit', async () => {
      const sandbox = await createSandbox({ limits: { memoryBytes: 64 * 1024 } });
      try {
        await expect(sandbox.evaluate('Array(1e6).fill(0)')).rejects.toThrow(/memory|allocate/i);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('serialization and error handling', () => {
    it('fails when trying to serialize non-JSON-safe values (BigInt)', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate('1n')).rejects.toThrow(/BigInt/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('fails when returning cyclic objects', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '(()=>{ const obj = {}; obj.self = obj; return obj; })()';
        await expect(sandbox.evaluate(expression)).rejects.toThrow(/cyclic|circular|gc_obj_list/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('surfaces thrown string values', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("(()=>{ throw 'boom'; })()")).rejects.toThrow('boom');
      } finally {
        sandbox.dispose();
      }
    });

    it('surfaces thrown objects by stringifying them', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("(()=>{ throw {reason: 'nope', code: 400}; })()")).rejects.toThrow(
          /"reason":"nope"/
        );
      } finally {
        sandbox.dispose();
      }
    });

    it('returns undefined for symbol values (mimics JSON.stringify)', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate('Symbol("test")');
        expect(result).toBeUndefined();
      } finally {
        sandbox.dispose();
      }
    });

    it('returns undefined for function values (mimics JSON.stringify)', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate('(() => {})');
        expect(result).toBeUndefined();
      } finally {
        sandbox.dispose();
      }
    });

    it('calls toJSON method on objects and returns wrapper with toJSON', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ value: 42, toJSON: function() { return { serialized: this.value * 2 }; } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('{"serialized":84}');
        expect((result as { toJSON: () => unknown }).toJSON()).toEqual({ serialized: 84 });
      } finally {
        sandbox.dispose();
      }
    });

    it('calls toJSON method and preserves string results via wrapper', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ toJSON: function() { return "custom string"; } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('"custom string"');
      } finally {
        sandbox.dispose();
      }
    });

    it('calls toJSON method and preserves number results via wrapper', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ toJSON: function() { return 42; } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('42');
      } finally {
        sandbox.dispose();
      }
    });

    it('calls toJSON method and preserves null results via wrapper', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ toJSON: function() { return null; } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('null');
      } finally {
        sandbox.dispose();
      }
    });

    it('handles moment-like objects with toJSON returning ISO date strings', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ _d: new Date(0), toJSON: function() { return this._d.toISOString(); } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('"1970-01-01T00:00:00.000Z"');
      } finally {
        sandbox.dispose();
      }
    });

    it('handles nested objects with toJSON methods', async () => {
      const sandbox = await createSandbox();
      try {
        const expression = '({ outer: { inner: 1, toJSON: function() { return { transformed: true }; } } })';
        const result = await sandbox.evaluate(expression);
        expect(JSON.stringify(result)).toBe('{"outer":{"transformed":true}}');
      } finally {
        sandbox.dispose();
      }
    });

    describe('sparse arrays', () => {
      it('extracts sparse arrays efficiently without iterating all indices', async () => {
        const sandbox = await createSandbox();
        try {
          const expression = '(() => { const a = []; a[1000000000] = "last"; a[0] = "first"; return a; })()';
          const result = (await sandbox.evaluate(expression, { timeLimitMs: 1000 })) as unknown[];

          expect(result[0]).toBe('first');
          expect(result[1000000000]).toBe('last');
          expect(result.length).toBe(1000000001);
          expect(Object.keys(result)).toEqual(['0', '1000000000']);
        } finally {
          sandbox.dispose();
        }
      });

      it('preserves holes vs explicit undefined in arrays', async () => {
        const sandbox = await createSandbox();
        try {
          const explicit = (await sandbox.evaluate('([1, undefined, 3])')) as unknown[];
          const holey = (await sandbox.evaluate('(() => { const a = [1]; a[2] = 3; return a; })()')) as unknown[];

          expect(explicit.length).toBe(3);
          expect(holey.length).toBe(3);

          expect(Object.prototype.hasOwnProperty.call(explicit, 1)).toBe(true);
          expect(explicit[1]).toBeUndefined();

          expect(Object.prototype.hasOwnProperty.call(holey, 1)).toBe(false);
          expect(holey[1]).toBeUndefined();
        } finally {
          sandbox.dispose();
        }
      });

      it('handles dense arrays correctly', async () => {
        const sandbox = await createSandbox();
        try {
          const result = await sandbox.evaluate('([1, 2, 3, 4, 5])');
          expect(result).toEqual([1, 2, 3, 4, 5]);
        } finally {
          sandbox.dispose();
        }
      });

      it('ignores non-index string keys on arrays', async () => {
        const sandbox = await createSandbox();
        try {
          const expression = '(() => { const a = [1, 2, 3]; a.customProp = "ignored"; return a; })()';
          const result = (await sandbox.evaluate(expression)) as unknown[];

          expect(result).toEqual([1, 2, 3]);
          expect(result.length).toBe(3);
          expect((result as unknown as Record<string, unknown>).customProp).toBeUndefined();
        } finally {
          sandbox.dispose();
        }
      });

      it('does not treat non-canonical numeric-looking keys as indices (e.g. "01")', async () => {
        const sandbox = await createSandbox();
        try {
          const expression = '(() => { const a = []; a["01"] = "nope"; a.length = 3; return a; })()';
          const result = (await sandbox.evaluate(expression)) as unknown[];

          expect(result.length).toBe(3);
          expect(Object.prototype.hasOwnProperty.call(result, 1)).toBe(false);
          expect(Object.keys(result)).toEqual([]);
        } finally {
          sandbox.dispose();
        }
      });
    });
  });

  describe('Date objects', () => {
    it('passes Date from host to VM via globals and preserves value', async () => {
      const sandbox = await createSandbox();
      try {
        const hostDate = new Date('2024-06-15T12:30:45.123Z');
        sandbox.setGlobals({ myDate: hostDate });
        const result = await sandbox.evaluate('myDate.getTime()');
        expect(result).toBe(hostDate.getTime());
      } finally {
        sandbox.dispose();
      }
    });

    it('allows Date methods to be called in VM when passed from host', async () => {
      const sandbox = await createSandbox();
      try {
        const hostDate = new Date('2024-06-15T12:30:45.123Z');
        sandbox.setGlobals({ myDate: hostDate });
        const result = await sandbox.evaluate(
          '[myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate(), myDate.getUTCHours()]'
        );
        expect(result).toEqual([2024, 5, 15, 12]); // Month is 0-indexed
      } finally {
        sandbox.dispose();
      }
    });

    it('returns Date from VM as a real Date instance', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate("new Date('2024-06-15T12:30:45.123Z')");
        expect(result).toBeInstanceOf(Date);
        expect((result as Date).getTime()).toBe(new Date('2024-06-15T12:30:45.123Z').getTime());
      } finally {
        sandbox.dispose();
      }
    });

    it('preserves Date timestamp in round-trip (host → VM → host)', async () => {
      const sandbox = await createSandbox();
      try {
        const hostDate = new Date('2024-06-15T12:30:45.123Z');
        sandbox.setGlobals({ myDate: hostDate });
        const result = await sandbox.evaluate('myDate');
        expect(result).toBeInstanceOf(Date);
        expect((result as Date).getTime()).toBe(hostDate.getTime());
      } finally {
        sandbox.dispose();
      }
    });

    it('handles epoch date (Unix timestamp 0)', async () => {
      const sandbox = await createSandbox();
      try {
        const epochDate = new Date(0);
        sandbox.setGlobals({ myDate: epochDate });
        const result = await sandbox.evaluate('myDate.getTime()');
        expect(result).toBe(0);
      } finally {
        sandbox.dispose();
      }
    });

    it('handles future dates', async () => {
      const sandbox = await createSandbox();
      try {
        const futureDate = new Date('2099-12-31T23:59:59.999Z');
        sandbox.setGlobals({ myDate: futureDate });
        const result = await sandbox.evaluate('myDate.toISOString()');
        expect(result).toBe('2099-12-31T23:59:59.999Z');
      } finally {
        sandbox.dispose();
      }
    });

    it('handles invalid dates (NaN timestamp)', async () => {
      const sandbox = await createSandbox();
      try {
        const invalidDate = new Date('invalid');
        sandbox.setGlobals({ myDate: invalidDate });
        const result = await sandbox.evaluate('Number.isNaN(myDate.getTime())');
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns invalid Date from VM correctly', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate("new Date('not a date')");
        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN((result as Date).getTime())).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('handles Date nested in objects', async () => {
      const sandbox = await createSandbox();
      try {
        const hostDate = new Date('2024-06-15T12:30:45.123Z');
        sandbox.setGlobals({ myDate: hostDate });
        const result = (await sandbox.evaluate('({ created: myDate, updated: myDate })')) as {
          created: Date;
          updated: Date;
        };
        expect(result.created).toBeInstanceOf(Date);
        expect(result.updated).toBeInstanceOf(Date);
        expect(result.created.getTime()).toBe(hostDate.getTime());
        expect(result.updated.getTime()).toBe(hostDate.getTime());
      } finally {
        sandbox.dispose();
      }
    });

    it('handles Date nested in arrays', async () => {
      const sandbox = await createSandbox();
      try {
        const date1 = new Date('2024-01-01T00:00:00.000Z');
        const date2 = new Date('2024-12-31T23:59:59.999Z');
        sandbox.setGlobals({ date1, date2 });
        const result = (await sandbox.evaluate('[date1, date2]')) as Date[];
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(Date);
        expect(result[1]).toBeInstanceOf(Date);
        expect(result[0].getTime()).toBe(date1.getTime());
        expect(result[1].getTime()).toBe(date2.getTime());
      } finally {
        sandbox.dispose();
      }
    });

    it('creates Date inside VM and returns it', async () => {
      const sandbox = await createSandbox();
      try {
        const result = await sandbox.evaluate('new Date(1718451045123)');
        expect(result).toBeInstanceOf(Date);
        expect((result as Date).getTime()).toBe(1718451045123);
      } finally {
        sandbox.dispose();
      }
    });

    it('supports Date arithmetic in VM', async () => {
      const sandbox = await createSandbox();
      try {
        const startDate = new Date('2024-06-15T00:00:00.000Z');
        sandbox.setGlobals({ startDate });
        const result = (await sandbox.evaluate(
          'new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)'
        )) as Date;
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('2024-06-22T00:00:00.000Z');
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('misc sandbox security', () => {
    it('prototype pollution in VM does not affect host Object.prototype', async () => {
      const sandbox = await createSandbox();
      try {
        await sandbox.evaluate('Object.prototype.pwned = true');
        await sandbox.evaluate('({}).__proto__.alsoPwned = 42');

        // Verify host Object.prototype is unaffected
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((({} as any).pwned)).toBeUndefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((({} as any).alsoPwned)).toBeUndefined();
      } finally {
        sandbox.dispose();
      }
    });

    it('cannot escape sandbox via constructor chain', async () => {
      const sandbox = await createSandbox();
      try {
        const escapeAttempts = [
          '(() => { try { return this.constructor.constructor("return process")(); } catch { return undefined; } })()',
          '(() => { try { return (function(){return this})().process; } catch { return undefined; } })()',
          '(() => { try { return globalThis.process; } catch { return undefined; } })()',
          '(() => { try { return global; } catch { return undefined; } })()',
          '(() => { try { return require; } catch { return undefined; } })()',
          '(() => { try { return module; } catch { return undefined; } })()'
        ];

        for (const attempt of escapeAttempts) {
          const result = await sandbox.evaluate(attempt);
          expect(result).toBeUndefined();
        }
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('dispose', () => {
    it('marks sandbox as not alive after dispose', async () => {
      const sandbox = await createSandbox();
      expect(sandbox.isAlive).toBe(true);

      sandbox.dispose();
      expect(sandbox.isAlive).toBe(false);
    });

    it('throws when trying to use a disposed sandbox', async () => {
      const sandbox = await createSandbox();
      sandbox.dispose();

      await expect(sandbox.evaluate('1 + 1')).rejects.toThrow('Sandbox has been disposed');
      expect(() => sandbox.setGlobals({ a: 1 })).toThrow('Sandbox has been disposed');
      expect(() => sandbox.setConsole({ log: jest.fn(), warn: jest.fn(), error: jest.fn() })).toThrow(
        'Sandbox has been disposed'
      );
    });

    it('is idempotent (can be called multiple times safely)', async () => {
      const sandbox = await createSandbox();

      sandbox.dispose();
      sandbox.dispose();
      sandbox.dispose();

      expect(sandbox.isAlive).toBe(false);
    });
  });

  describe('isolation', () => {
    it('sandboxes are isolated from each other', async () => {
      const sandbox1 = await createSandbox();
      const sandbox2 = await createSandbox();

      try {
        sandbox1.setGlobals({ value: 'sandbox1' });
        sandbox2.setGlobals({ value: 'sandbox2' });

        expect(await sandbox1.evaluate('value')).toBe('sandbox1');
        expect(await sandbox2.evaluate('value')).toBe('sandbox2');
      } finally {
        sandbox1.dispose();
        sandbox2.dispose();
      }
    });

    it('user code in one sandbox does not affect another', async () => {
      const sandbox1 = await createSandbox();
      const sandbox2 = await createSandbox();

      try {
        await sandbox1.evaluate('globalThis.leaked = "from sandbox1"');

        // sandbox2 should not see the global set in sandbox1
        await expect(sandbox2.evaluate('leaked')).rejects.toThrow(/not defined/i);
      } finally {
        sandbox1.dispose();
        sandbox2.dispose();
      }
    });
  });

  describe('wrapperPrefixLines', () => {
    it('adjusts error line numbers with wrapperPrefixLines', async () => {
      const sandbox = await createSandbox();
      try {
        // Wrap user code in an IIFE (1 prefix line, 1 suffix line)
        const userCode = 'throw new Error("test")';
        const wrappedCode = `(async function() {\n${userCode}\n})()`;

        await expect(
          sandbox.evaluate(wrappedCode, { wrapperPrefixLines: 1, wrapperSuffixLines: 1 })
        ).rejects.toThrow('test');
      } finally {
        sandbox.dispose();
      }
    });
  });
});
