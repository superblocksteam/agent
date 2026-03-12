import { KVStore } from '../../types';
import { VariableClient } from './types';

export class VariableClientImpl implements VariableClient {
  #kvStore: KVStore;
  #writableBuffer: { key: string; value: unknown }[] = [];

  constructor(kvStore: KVStore) {
    this.#kvStore = kvStore;
  }

  async read(keys: string[]): ReturnType<KVStore['read']> {
    return await this.#kvStore.read(keys);
  }

  async write(key: string, value: string): Promise<void> {
    await this.#kvStore.write(key, value);
  }

  writeBuffer(key: string, value: unknown): void {
    this.#writableBuffer.push({ key: key, value: value });
  }

  fetchFileCallback(path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
    if (this.#kvStore.fetchFileCallback === undefined || typeof this.#kvStore.fetchFileCallback !== 'function') {
      throw new Error(
        'KVStore does not implement fetchFileCallback. useSandboxFileFetcher was enabled but the underlying kvStore lacks file fetching support.'
      );
    }

    this.#kvStore.fetchFileCallback(path, callback);
  }

  async flush(): Promise<void> {
    await this.#kvStore.writeMany(this.#writableBuffer);
  }
}
