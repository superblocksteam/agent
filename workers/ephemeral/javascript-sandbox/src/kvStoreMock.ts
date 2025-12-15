import { KVStore } from '@superblocks/shared';

export class MockKVStore implements KVStore {
  private _store: { [key: string]: unknown } = {};

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    const _matched: unknown[] = [];

    for (const item of keys) {
      _matched.push(this._store[item]);
    }

    return Promise.resolve({ data: _matched });
  }

  public async writeMany(payload: Array<{ key: string; value: unknown }>): Promise<void> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
    return Promise.resolve();
  }

  public async write(key: string, value: unknown): Promise<void> {
    this._store[key] = value;
    return Promise.resolve();
  }
}
