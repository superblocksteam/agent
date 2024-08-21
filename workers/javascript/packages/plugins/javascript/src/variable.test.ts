import { describe, it } from '@jest/globals';
import { buildVariables } from '@superblocks/shared';

// eslint-disable-next-line
const { VariableType, VariableMode } = require('./constants');
// eslint-disable-next-line
const VariableClient = require('./variable-client');
// eslint-disable-next-line
const VariableServer = require('./variable-server');

export class MockKVStore {
  private _store: { [key: string]: unknown } = {};

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    const _matched: unknown[] = [];

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

describe('Test simple variables', () => {
  it('Test read', async () => {
    const input = {
      yamazaki: {
        key: 'aaaa',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      hibiki: {
        key: 'bbbb',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', { ok: 1 });
    await store.write('bbbb', { ok: 2 });

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    expect(built.yamazaki.value).toEqual({ ok: 1 });
    expect(built.hibiki.value).toEqual({ ok: 2 });

    await variableClient.close();
    await variableServer.close();
  });

  it('Test write', async () => {
    const input = {
      iniskillin: {
        key: 'aaaa',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      redrooster: {
        key: 'bbbb',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', 1000);
    await store.write('bbbb', 2000);

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    built.iniskillin.set(3000);
    built.redrooster.set(4000);

    expect(built.iniskillin.value).toEqual(3000);
    expect(built.redrooster.value).toEqual(4000);

    let data = (await store.read(['aaaa', 'bbbb'])).data;
    expect(data[0]).toBe(1000);
    expect(data[1]).toBe(2000);

    await variableClient.flush();
    data = (await store.read(['aaaa', 'bbbb'])).data;
    expect(data[0]).toBe(3000);
    expect(data[1]).toBe(4000);

    await variableClient.close();
    await variableServer.close();
  });

  it('Test permission', async () => {
    const input = {
      romaneeconti: {
        key: 'aaaa',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      petrus: {
        key: 'bbbb',
        type: VariableType.Simple,
        mode: VariableMode.Read
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', '123');
    await store.write('bbbb', '456');

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    expect(built.romaneeconti.value).toEqual('123');
    expect(built.petrus.value).toEqual('456');

    built.romaneeconti.set('abc');
    expect(built.romaneeconti.value).toEqual('abc');

    expect(() => built.petrus.set('def')).toThrow();

    await variableClient.close();
    await variableServer.close();
  });

  it('Test empty values', async () => {
    const input = {
      moutai: {
        key: 'aaaa',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      yanghe: {
        key: 'bbbb',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      wuliangye: {
        key: 'cccc',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      erguotou: {
        key: 'dddd',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      luzhoulaojiao: {
        key: 'eeee',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    built.moutai.set('');
    built.yanghe.set(0);
    built.wuliangye.set({});
    built.erguotou.set(null);
    built.luzhoulaojiao.set(undefined);

    expect(built.moutai.value).toEqual('');
    expect(built.yanghe.value).toEqual(0);
    expect(built.wuliangye.value).toEqual({});
    expect(built.erguotou.value).toEqual(null);
    expect(built.luzhoulaojiao.value).toEqual(undefined);

    await variableClient.close();
    await variableServer.close();
  });
});

describe('Test advanced variables', () => {
  it('Test read', async () => {
    const input = {
      yamazaki: {
        key: 'aaaa',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      hibiki: {
        key: 'bbbb',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', { ok: 1 });
    await store.write('bbbb', { ok: 2 });

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    expect(await built.yamazaki.get()).toEqual({ ok: 1 });
    expect(await built.hibiki.get()).toEqual({ ok: 2 });

    await variableClient.close();
    await variableServer.close();
  });

  it('Test write', async () => {
    const input = {
      iniskillin: {
        key: 'aaaa',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      redrooster: {
        key: 'bbbb',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', 1000);
    await store.write('bbbb', 2000);

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    await built.iniskillin.set(3000);
    await built.redrooster.set(4000);

    expect(await built.iniskillin.get()).toEqual(3000);
    expect(await built.redrooster.get()).toEqual(4000);

    await variableClient.close();
    await variableServer.close();
  });

  it('Test permission', async () => {
    const input = {
      romaneeconti: {
        key: 'aaaa',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      petrus: {
        key: 'bbbb',
        type: VariableType.Advanced,
        mode: VariableMode.Read
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', '123');
    await store.write('bbbb', '456');

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    expect(await built.romaneeconti.get()).toEqual('123');
    expect(await built.petrus.get()).toEqual('456');

    await built.romaneeconti.set('abc');
    expect(await built.romaneeconti.get()).toEqual('abc');

    await expect(built.petrus.set('def')).rejects.toThrow();

    await variableClient.close();
    await variableServer.close();
  });

  it('Test empty values', async () => {
    const input = {
      moutai: {
        key: 'aaaa',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      yanghe: {
        key: 'bbbb',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      wuliangye: {
        key: 'cccc',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      erguotou: {
        key: 'dddd',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      luzhoulaojiao: {
        key: 'eeee',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      }
    };

    const store = new MockKVStore();

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    await built.moutai.set('');
    await built.yanghe.set(0);
    await built.wuliangye.set({});
    await built.erguotou.set(null);
    await built.luzhoulaojiao.set(undefined);

    expect(await built.moutai.get()).toEqual('');
    expect(await built.yanghe.get()).toEqual(0);
    expect(await built.wuliangye.get()).toEqual({});
    expect(await built.erguotou.get()).toEqual(null);
    expect(await built.luzhoulaojiao.get()).toEqual(undefined);

    await variableClient.close();
    await variableServer.close();
  });
});

describe('Test native variables', () => {
  it('Test read', async () => {
    const input = {
      yamazaki: {
        key: 'aaaa',
        type: VariableType.Native
      },
      hibiki: {
        key: 'bbbb',
        type: VariableType.Native
      }
    };

    const store = new MockKVStore();
    await store.write('aaaa', { ok: 1 });
    await store.write('bbbb', { ok: 2 });

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built: Record<string, any> = await buildVariables(input, variableClient);

    expect(built.yamazaki).toEqual({ ok: 1 });
    expect(built.hibiki).toEqual({ ok: 2 });

    await variableClient.close();
    await variableServer.close();
  });
});
