import { describe, it } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import JavascriptPlugin from './index';

// eslint-disable-next-line
const { VariableType, VariableMode } = require('./constants');

export class MockKVStore {
  private _store: { [key: string]: unknown } = {};

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    const _matched: unknown[] = [];

    // eslint-disable-next-line
    keys.forEach((item: string) => {
      _matched.push(this._store[item]);
    });

    return { data: _matched };
  }

  public async write(key: string, value: unknown): Promise<void> {
    this._store[key] = value;
  }

  public async writeMany(payload: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
  }

  public async delete(keys: string[]): Promise<void> {
    for (const key of keys) {
      delete this._store[key];
    }
  }

  public async close(reason: string | undefined): Promise<void> {
    // do nothing
  }
}

describe('Test E2E', () => {
  it('Test simple execution', async () => {
    const js = new JavascriptPlugin();
    await js.init();

    const store = new MockKVStore();

    const result = await js.executeInWorker({
      context: {
        globals: {},
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: 'return 123',
      executionTimeout: 10000
    });

    await js.shutdown();
    expect(result.output).toBe(123);
  });

  it('Test execute with variables', async () => {
    const js = new JavascriptPlugin();
    await js.init();

    const store = new MockKVStore();
    await store.write('key1', 10);
    await store.write('key2', 20);
    await store.write('key3', 30);
    await store.write('key4', 40);
    await store.write('key5', 50);

    const variables = {
      simpleVar1: {
        key: 'key1',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      simpleVar2: {
        key: 'key2',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      advancedVar1: {
        key: 'key3',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      advancedVar2: {
        key: 'key4',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      nativeVar1: {
        key: 'key5',
        type: VariableType.Native
      }
    };

    let result = await js.executeInWorker({
      context: {
        globals: {},
        variables: variables,
        kvStore: store
      } as unknown as ExecutionContext,
      code: 'return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get();',
      executionTimeout: 10000
    });
    expect(result.output).toBe(100);

    result = await js.executeInWorker({
      context: {
        globals: {},
        variables: variables,
        kvStore: store
      } as unknown as ExecutionContext,
      code: 'simpleVar2.set(0); await advancedVar2.set(0); return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get();',
      executionTimeout: 10000
    });

    expect(result.output).toBe(40);

    result = await js.executeInWorker({
      context: {
        globals: {},
        variables: variables,
        kvStore: store
      } as unknown as ExecutionContext,
      code: 'return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get();',
      executionTimeout: 10000
    });

    expect(result.output).toBe(40);

    result = await js.executeInWorker({
      context: {
        globals: {},
        variables: variables,
        kvStore: store
      } as unknown as ExecutionContext,
      code: 'return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get() + nativeVar1;',
      executionTimeout: 10000
    });

    expect(result.output).toBe(90);

    await js.shutdown();
  });
});
