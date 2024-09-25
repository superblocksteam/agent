import { RedisClientType } from '@redis/client';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { MaybeError } from '@superblocks/shared';
import { Logger } from 'pino';
import { QuotaError } from '../errors';
import { IO, KV, KVOps, KVStore, KVStoreTx, RedisOptions, Wrapped, WriteOps } from '../types';

export class RedisTx implements KVStoreTx {
  /**
   * DEFAULTS
   */
  private readonly MAX_BYTES = 500000000;
  private readonly SLOW_THRESHOLD = 100000000;

  private _ops: { op: 'read' | 'write'; key: string; value?: string; expiration?: number }[];
  private _fastClient: RedisClientType;
  private _slowClient: RedisClientType;
  private _ttl?: number;
  private _logger?: Logger;
  private _maxBytes: number;
  private _slowThreshold: number;
  private _bytes: number;
  private _committed: boolean;

  constructor(options: RedisOptions) {
    this._ops = [];
    this._fastClient = options.client;
    this._slowClient = options.slowClient || this._fastClient;
    this._logger = options.logger?.child({ who: 'kvstore' });
    this._maxBytes = options.maxBytes || this.MAX_BYTES;
    this._slowThreshold = options.slowThreshold || this.SLOW_THRESHOLD;
    this._committed = false;
    this._bytes = 0;

    if (options.seconds > 0) {
      this._ttl = options.seconds;
    }
  }

  public read(key: string): void {
    if (key === '') {
      throw Error('key must be defined');
    }

    this._ops.push({ op: 'read', key });
  }

  public write(key: string, value: unknown, ops?: WriteOps): void {
    if (key === '') {
      throw Error('key must be defined');
    }

    // NOTE(frank): This scares me. I'm not sure what the side effects are of this.
    // NOTE(dlamotte): previous check was !value, which when dropped led to the following error:
    //   The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received undefined
    if (value === undefined) {
      return;
    }

    const encoded: string = JSON.stringify(value);
    const bytes: number = Buffer.byteLength(encoded);

    /**
     * QUOTA ENFORCEMENT
     */
    if (ops?.maxSize && bytes > ops.maxSize) {
      this._logger?.warn({ ...ops?.baggage, ...{ size: bytes, limit: ops.maxSize } }, "This value's size has exceeded the limit.");
      throw new QuotaError(`This value's size (${bytes}) has exceed the limit (${ops.maxSize}).`);
    }

    if (bytes > this._maxBytes) {
      // NOTE(frank): Should we clear out the ops? Should we add an abort() method an call it to cleanup?
      throw new Error(
        `The serialized size of the output (${Math.ceil(bytes / 1000000)}MB) exceeds to maxixum (${Math.floor(
          this._maxBytes / 1000000
        )}MB).`
      );
    }

    this._bytes += bytes;
    this._ops.push({ op: 'write', key, value: encoded, expiration: ops?.expiration || this._ttl });
  }

  public async commit(ops?: KVOps): Promise<Wrapped<IO, Array<unknown>>> {
    if (this._committed) {
      throw Error('this transaction has already been committed');
    }

    const io: IO = {};

    if (this._ops.length < 1) {
      return { pinned: io, data: [] };
    }

    io.write = this._bytes;

    let tx = (this._bytes > this._slowThreshold ? this._slowClient : this._fastClient).multi();
    const reads: string[] = [];
    const writes: string[] = [];

    this._ops.forEach(({ op, key, value, expiration }): void => {
      switch (op) {
        case 'read':
          reads.push(key);
          tx = tx.get(key);
          break;
        case 'write':
          writes.push(key);
          tx = tx.set(key, value, expiration ? { EX: expiration } : {});
          break;
        default:
          return;
      }
    });

    this._logger?.debug({ ...ops?.baggage, ...{ io, reads: reads.length, writes: writes.length } }, 'before committing transaction');

    const data: Array<unknown> = [];

    let results: RedisCommandRawReply;
    {
      try {
        results = await tx.exec();
      } catch (err) {
        this._logger?.error(
          {
            ...ops?.baggage,
            ...{ io, reads: reads.length, writes: writes.length, err }
          },
          'error committing transaction'
        );
        throw Error('could not commit transaction');
      } finally {
        this._committed = true;
      }
    }

    if (results.length != this._ops.length) {
      throw Error(`Executed ${this._ops.length} ops but only received ${results.length} results.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results.forEach((result: any, idx: number): void => {
      switch (this._ops[idx].op) {
        case 'read':
          if (!result) {
            // This is the 'null' or 'undefined' case.
            io.read = (io.read || 0) + 1;
          } else {
            try {
              io.read = (io.read || 0) + Buffer.byteLength(result);
            } catch (err) {
              this._logger?.error(`could not determine size of response due to a type issue (${typeof result})`);
            }
          }
          data.push(JSON.parse(result));
          break;
        case 'write':
          if (result != 'OK') {
            // NOTE(frank): Perhaps we don't want to throw as we're swalling the successful read ops.
            throw Error(`There was an issue writing ${this._ops[idx].key}=${this._ops[idx].value}`);
          }
          break;
        default:
          return;
      }
    });

    this._logger?.debug({ ...ops?.baggage, ...{ io, reads: reads.length, writes: writes.length } }, 'committed transaction');

    return { pinned: io, data };
  }
}

export class Redis implements KVStore {
  private _options: RedisOptions;
  private _client: RedisClientType;

  constructor(options: RedisOptions) {
    this._options = options;
    this._client = options.client;
  }

  public async decr(key: string): Promise<number> {
    return await this._client.decr(key);
  }

  public tx(): KVStoreTx {
    return new RedisTx(this._options);
  }

  public async read(keys: string[]): Promise<Wrapped<IO, Array<unknown>>> {
    const tx: KVStoreTx = new RedisTx(this._options);

    keys.forEach((key: string): void => {
      tx.read(key);
    });

    return await tx.commit();
  }

  public async write(key: string, value: unknown, ops: WriteOps = {}): Promise<Wrapped<IO, void>> {
    return this.writeMany([{ key, value, expiration: ops?.expiration }]);
  }

  public async writeMany(payload: KV[], ops: WriteOps = {}): Promise<Wrapped<IO, void>> {
    const tx: KVStoreTx = new RedisTx(this._options);

    payload.forEach(({ key, value, expiration }: KV): void => {
      tx.write(key, value, { ...ops, ...{ expiration } });
    });

    return { pinned: (await tx.commit(ops)).pinned, data: undefined };
  }

  public async delete(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      const resp = await this._client.del(keys);
      if (typeof resp !== 'number') {
        throw new Error(`Unexpected response while deleting redis keys: ${resp}.`);
      }
    } catch (err) {
      this._options.logger?.error({ err, keys }, 'Failed to write to redis.');
      throw err;
    }
  }

  public async close(reason?: string): Promise<MaybeError> {
    try {
      await this._client.disconnect();
    } catch (err) {
      this._options.logger?.error({ err, reason }, 'Failed to close redis connection.');
      return err;
    }
  }
}
