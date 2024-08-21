import { MaybeError } from '@superblocks/shared';
import { IO, KVStore, KVStoreTx, Wrapped } from '../types';

export class MockKVStore implements KVStore {
  private _store: { [key: string]: unknown } = {};

  public tx(): KVStoreTx {
    throw new Error('Method not implemented.');
  }

  public async decr(key: string): Promise<number> {
    if (typeof this._store[key] === 'number') {
      this._store[key] = (this._store[key] as number) - 1;
      return this._store[key] as number;
    }

    throw new Error(`Failed to decrement value for key: ${key}`);
  }

  public async read(keys: string[]): Promise<Wrapped<IO, Array<object>>> {
    const _matched = [];

    keys.forEach((item: string) => {
      _matched.push(this._store[item]);
    });

    return { pinned: { read: 0, write: 0 }, data: _matched };
  }

  public async writeMany(payload: { key: string; value: object }[]): Promise<Wrapped<IO, void>> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
    return { pinned: { read: 0, write: 0 }, data: undefined };
  }

  public async write(key: string, value: unknown): Promise<Wrapped<IO, void>> {
    this._store[key] = value;
    return { data: undefined };
  }

  public async delete(keys: string[]): Promise<void> {
    for (const key of keys) {
      this._store[key] = undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async close(reason: string | undefined): Promise<MaybeError> {}
}
