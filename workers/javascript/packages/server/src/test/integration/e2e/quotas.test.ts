import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import { default as pino } from 'pino';
import { Redis } from '../../../store/redis';
import { WorkerAPIImpl } from '../../../test/integration/client';
import { KVStore, WorkerAPI } from '../../../types';
import { REDIS_CLIENT_TYPE, client, code } from '../../utils';

describe('quotas', () => {
  const logger = pino({ level: 'debug' });

  let kvRedis: RedisClientType;
  let queueRedis: RedisClientType;
  let kvStore: KVStore;
  let worker: WorkerAPI;

  beforeEach(() => {
    jest.setTimeout(60000);
  });

  beforeAll(async (): Promise<void> => {
    jest.useRealTimers();
    kvRedis = await client(REDIS_CLIENT_TYPE.KVSTORE);
    queueRedis = await client(REDIS_CLIENT_TYPE.QUEUE);

    kvStore = new Redis({ client: kvRedis, seconds: 600, slowThreshold: 2000000, logger });
    worker = new WorkerAPIImpl({
      kvStore,
      redis: queueRedis,
      agent: 'main',
      logger: logger,
      ackTimeoutMs: 10000
    });
  });

  afterAll(async (): Promise<void> => {
    await kvRedis?.quit();
    await queueRedis?.quit();
  });

  it('should violate the size quota', async () => {
    const id: string = randomUUID();
    const result = await worker.execute(
      {
        name: 'javascript',
        bucket: 'B1'
      },
      { ...{ quotas: { size: 1000 } }, ...code(id, 'TooLarge', 'return Buffer.alloc(500)') }
    );

    await expect(result.data.result).resolves.toMatchObject({
      err: {
        name: 'QuotaError',
        message: 'QuotaError'
      },
      key: `${id}.context.output.TooLarge`
    });
  });

  it('should violate the duration quota', async () => {
    const plugin = {
      name: 'javascript',
      bucket: 'B1'
    };
    const duration = 100;
    const runTime = 1000;
    const start = Date.now();

    const id: string = randomUUID();
    const result = await worker.execute(plugin, {
      ...{ quotas: { duration } },
      ...code(id, 'Timeout', `return await new Promise((r) => setTimeout(r, ${runTime}))`)
    });
    await expect(result.data.result).resolves.toMatchObject({
      err: {
        name: 'DurationQuotaError',
        message: 'DurationQuotaError'
      },
      key: `${id}.context.output.Timeout`
    });

    const id2: string = randomUUID();
    const result2 = await worker.execute(plugin, {
      ...{ quotas: { duration } },
      ...code(id2, 'TimeoutAgain', `return await new Promise((r) => setTimeout(r, ${runTime}))`)
    });
    await expect(result2.data.result).resolves.toMatchObject({
      err: {
        name: 'DurationQuotaError',
        message: 'DurationQuotaError'
      },
      key: `${id2}.context.output.TimeoutAgain`
    });

    const end = Date.now();
    expect(end - start < runTime).toBe(true);
  });

  it('should NOT violate the duration quota', async () => {
    const id: string = randomUUID();
    const result = await worker.execute(
      {
        name: 'javascript',
        bucket: 'B1'
      },
      {
        ...{ quotas: { duration: 100 } },
        ...code(id, 'NoDurationQuotaViolation', 'return await new Promise((r) => setTimeout(r, 50))')
      }
    );

    await expect(result.data.result).resolves.toMatchObject({});
  });
});
