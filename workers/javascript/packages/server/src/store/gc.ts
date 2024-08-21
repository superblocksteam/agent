import P from 'pino';
import { KVStore } from '../types';

export class GC {
  private _logger;
  private _done = false;
  private _keys: string[] = [];

  constructor(logger?: P.Logger) {
    this._logger = logger;
  }

  record(payload: string | string[]): void {
    if (Array.isArray(payload)) {
      payload.forEach((p) => this._keys.push(p));
    } else {
      this._keys.push(payload);
    }
  }

  async run(store: KVStore): Promise<void> {
    if (this._done) {
      throw new Error('Already garbage collected. This should not happen');
    }
    await store.delete(this._keys);
    this._logger?.debug(`Successful GC: ${this._keys.length}.`);
    this._done = true;
  }
}
