import { describe, it, expect } from '@jest/globals';
import { buildVariables } from '@superblocks/shared';
import { VariableType, VariableMode } from './constants';
import { VariableClient } from './variable-client';
import { VariableServer } from './variable-server';

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

  public async writeMany(payload: { key: string; value: unknown }[]): Promise<void> {
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

class FlakyReadKVStore extends MockKVStore {
  private failNextRead = true;

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    if (this.failNextRead) {
      this.failNextRead = false;
      throw new Error('read failed once');
    }
    return super.read(keys);
  }
}

class FailingWriteKVStore extends MockKVStore {
  public async write(key: string, value: unknown): Promise<void> {
    throw new Error('write failed');
  }
}

class FailingWriteManyKVStore extends MockKVStore {
  public async writeMany(payload: { key: string; value: unknown }[]): Promise<void> {
    throw new Error('writeMany failed');
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    expect(built.yamazaki.value).toEqual({ ok: 1 });
    expect(built.hibiki.value).toEqual({ ok: 2 });

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

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

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    expect(built.romaneeconti.value).toEqual('123');
    expect(built.petrus.value).toEqual('456');

    built.romaneeconti.set('abc');
    expect(built.romaneeconti.value).toEqual('abc');

    expect(() => built.petrus.set('def')).toThrow();

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

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

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    expect(await built.yamazaki.get()).toEqual({ ok: 1 });
    expect(await built.hibiki.get()).toEqual({ ok: 2 });

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    await built.iniskillin.set(3000);
    await built.redrooster.set(4000);

    expect(await built.iniskillin.get()).toEqual(3000);
    expect(await built.redrooster.get()).toEqual(4000);

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    expect(await built.romaneeconti.get()).toEqual('123');
    expect(await built.petrus.get()).toEqual('456');

    await built.romaneeconti.set('abc');
    expect(await built.romaneeconti.get()).toEqual('abc');

    await expect(built.petrus.set('def')).rejects.toThrow();

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

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

    variableClient.close();
    variableServer.close();
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
    const built: Record<string, any> = await buildVariables(input, variableClient as any);

    expect(built.yamazaki).toEqual({ ok: 1 });
    expect(built.hibiki).toEqual({ ok: 2 });

    variableClient.close();
    variableServer.close();
  });
});

/**
 * MockKVStore with fetchFileCallback support for sandbox worker testing.
 */
export class MockKVStoreWithFileFetch extends MockKVStore {
  private _files: { [path: string]: Buffer } = {};

  public setFile(path: string, content: Buffer): void {
    this._files[path] = content;
  }

  public fetchFileCallback(path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
    const file = this._files[path];
    if (file) {
      // Simulate async behavior
      setImmediate(() => callback(null, file));
    } else {
      setImmediate(() => callback(new Error(`File not found: ${path}`), null));
    }
  }
}

describe('Test fetchFile (sandbox worker path)', () => {
  it('should fetch file successfully via VariableClient', async () => {
    const store = new MockKVStoreWithFileFetch();
    const fileContent = Buffer.from('hello world');
    store.setFile('/tmp/test.txt', fileContent);

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    const result = await new Promise<Buffer>((resolve, reject) => {
      variableClient.fetchFileCallback('/tmp/test.txt', (err, data) => {
        if (err) reject(err);
        else resolve(data!);
      });
    });

    expect(result).toEqual(fileContent);
    expect(result.toString()).toBe('hello world');

    variableClient.close();
    variableServer.close();
  });

  it('should handle file not found error', async () => {
    const store = new MockKVStoreWithFileFetch();

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    await expect(
      new Promise<Buffer>((resolve, reject) => {
        variableClient.fetchFileCallback('/nonexistent/file.txt', (err, data) => {
          if (err) reject(err);
          else resolve(data!);
        });
      })
    ).rejects.toThrow('File not found: /nonexistent/file.txt');

    variableClient.close();
    variableServer.close();
  });

  it('should fetch binary file content', async () => {
    const store = new MockKVStoreWithFileFetch();
    // Create binary content with various byte values
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
    store.setFile('/tmp/binary.bin', binaryContent);

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    const result = await new Promise<Buffer>((resolve, reject) => {
      variableClient.fetchFileCallback('/tmp/binary.bin', (err, data) => {
        if (err) reject(err);
        else resolve(data!);
      });
    });

    expect(result).toEqual(binaryContent);
    expect(Buffer.isBuffer(result)).toBe(true);

    variableClient.close();
    variableServer.close();
  });

  it('should return error when fetchFileCallback is not available on kvStore', async () => {
    // Use MockKVStore without fetchFileCallback (simulates mode without sandbox file fetching)
    const store = new MockKVStore();

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    await expect(
      new Promise<Buffer>((resolve, reject) => {
        variableClient.fetchFileCallback('/tmp/test.txt', (err, data) => {
          if (err) reject(err);
          else resolve(data!);
        });
      })
    ).rejects.toThrow('fetchFileCallback is not available (not running in sandbox worker)');

    variableClient.close();
    variableServer.close();
  });
});

describe('Test variable transport error handling', () => {
  it('should propagate read errors and keep serving subsequent requests', async () => {
    const store = new FlakyReadKVStore();
    await store.write('ok-key', { ok: true });

    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    await expect(variableClient.read(['ok-key'])).rejects.toThrow('read failed once');
    await expect(variableClient.read(['ok-key'])).resolves.toEqual({ data: [{ ok: true }] });

    variableClient.close();
    variableServer.close();
  });

  it('should propagate writeStore errors', async () => {
    const store = new FailingWriteKVStore();
    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    await expect(variableClient.write('some-key', 'value')).rejects.toThrow('write failed');

    variableClient.close();
    variableServer.close();
  });

  it('should propagate writeStoreMany errors', async () => {
    const store = new FailingWriteManyKVStore();
    const variableServer = new VariableServer(store);
    const variableClient = new VariableClient(variableServer.clientPort());

    variableClient.writeBuffer('some-key', 'value');
    await expect(variableClient.flush()).rejects.toThrow('writeMany failed');

    variableClient.close();
    variableServer.close();
  });
});
