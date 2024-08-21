import { randomUUID } from 'crypto';
import { describe, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import pino from 'pino';
import { Redis, RedisTx } from '../../../store/redis';
import { KVStoreTx, IO, Wrapped, KVStore } from '../../../types';
import { client, REDIS_CLIENT_TYPE } from '../../utils';

describe('Test KV Store - Redis', () => {
  jest.setTimeout(10000);

  let redis: KVStore;
  let redisEx: KVStore;
  let redisClient: RedisClientType;
  const seconds = 1;
  const logger = pino();

  beforeAll(async (): Promise<void> => {
    redisClient = await client(REDIS_CLIENT_TYPE.KVSTORE);

    redis = new Redis({ client: redisClient, seconds: -1, logger });
    redisEx = new Redis({ client: redisClient, seconds, logger });
  });

  afterAll(async (): Promise<void> => {
    await redis.close(`Test finished`);
  });

  it('Test read, write, delete', async () => {
    const key1 = randomUUID();
    const obj1 = { field1: 'val1', field2: 'val2' };

    const key2 = randomUUID();
    const obj2 = { field1: 'val3', field2: 'val4' };

    await redis.write(key1, obj1);
    await redis.write(key2, obj2);

    const actual = await redis.read([key1, key2]);
    const expected = [obj1, obj2];
    expect(actual.data).toEqual(expected);
    await redis.delete([key1, key2]);

    const actual2 = await redis.read([key1, key2]);
    const expected2 = [null, null];
    expect(actual2.data).toEqual(expected2);
  });

  it('should read and write using a transaction', async () => {
    const tx: KVStoreTx = new RedisTx({ client: redisClient, seconds: 60, logger: logger });

    const key1 = `DELETEME.${randomUUID()}`;
    const key2 = `DELETEME.${randomUUID()}`;
    const key3 = `DELETEME.${randomUUID()}`;

    tx.write(key1, { field1: 'val1', field2: 'val2' });
    tx.write(key2, { field1: 'val3', field2: 'val4' });

    tx.read(key1);
    tx.read(key2);
    tx.read(key3);

    const results: Wrapped<IO, Array<unknown>> = await tx.commit();
    expect(results.data).toEqual([{ field1: 'val1', field2: 'val2' }, { field1: 'val3', field2: 'val4' }, null]);

    // Cleanup.
    await redis.delete([key1, key2]);
  });

  it('Test write many', async () => {
    const key1 = randomUUID();
    const obj1 = { field1: 'val1', field2: 'val2' };

    const key2 = randomUUID();
    const obj2 = { field1: 'val3', field2: 'val4' };

    await redis.writeMany([
      { key: key1, value: obj1 },
      { key: key2, value: obj2 }
    ]);

    const actual = await redis.read([key1, key2]);
    const expected = [obj1, obj2];
    expect(actual.data).toEqual(expected);
    await redis.delete([key1, key2]);
  });

  it('Test reading non-existing key ', async () => {
    const key1 = randomUUID();
    const obj1 = { field1: 'val1', field2: 'val2' };

    const key2 = randomUUID();

    await redis.write(key1, obj1);

    const actual = await redis.read([key1, key2]);
    const expected = [obj1, null];
    expect(actual.data).toEqual(expected);
    await redis.delete([key1, key2]);
  });

  it('Test expiration', async () => {
    const key1 = `DELETEME.${randomUUID()}`;
    const key2 = `DELETEME.${randomUUID()}`;
    const key3 = `DELETEME.${randomUUID()}`;
    const key4 = `DELETEME.${randomUUID()}`;
    const key5 = `DELETEME.${randomUUID()}`;

    await redisEx.write(key1, { field1: 'val1', field2: 'val2' });
    await redisEx.write(key2, { field1: 'val3', field2: 'val4' });
    await redisEx.write(key3, { field1: 'val5', field2: 'val6' }, { expiration: 5 });
    await redisEx.writeMany([
      { key: key4, value: { field1: 'val7', field2: 'val8' }, expiration: 5 },
      { key: key5, value: { field1: 'val9', field2: 'val10' }, expiration: 5 }
    ]);

    await new Promise((resolve) => setTimeout(resolve, 3 * seconds * 1000));

    const a1 = await redisEx.read([key1, key2, key3, key4, key5]);
    const e1 = [null, null, { field1: 'val5', field2: 'val6' }, { field1: 'val7', field2: 'val8' }, { field1: 'val9', field2: 'val10' }];
    expect(a1.data).toEqual(e1);

    await new Promise((resolve) => setTimeout(resolve, 3 * seconds * 1000));

    const a2 = await redisEx.read([key1, key2, key3, key4, key5]);
    const e2 = [null, null, null, null, null];

    expect(a2.data).toEqual(e2);

    // FIXME(frank): We're leaking keys if the test fails.
    await redis.delete([key1, key2, key3, key4, key5]);
  });

  it.each([
    [`DELETEME.${randomUUID()}`, 10, 9],
    [`DELETEME.${randomUUID()}`, 0, -1],
    [`DELETEME.${randomUUID()}`, -1, -2]
  ])('should decrement', async (key: string, before: number, after: number) => {
    await redis.write(key, before);
    const value = await redis.decr(key);
    expect(value).toEqual(after);
    await redis.delete([key]);
  });
});
