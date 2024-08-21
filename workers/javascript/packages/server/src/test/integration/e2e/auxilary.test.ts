import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import { default as pino } from 'pino';
import { Redis } from '../../../store/redis';
import { WorkerAPIImpl } from '../../../test/integration/client';
import { KVStore, WorkerAPI } from '../../../types';
import { REDIS_CLIENT_TYPE, client } from '../../utils';

describe('auxilary', () => {
  const logger = pino();

  let kvRedis: RedisClientType;
  let queueRedis: RedisClientType;
  let kvStore: KVStore;
  let worker: WorkerAPI;

  beforeAll(async (): Promise<void> => {
    kvRedis = await client(REDIS_CLIENT_TYPE.KVSTORE);
    queueRedis = await client(REDIS_CLIENT_TYPE.QUEUE);

    kvStore = new Redis({ client: kvRedis, seconds: 600, logger });
    worker = new WorkerAPIImpl({
      kvStore,
      redis: queueRedis,
      agent: 'main'
    });
  });

  afterAll(async (): Promise<void> => {
    await kvRedis?.quit();
    await queueRedis?.quit();
  });

  it('[language] should test', async () => {
    const result = await worker.test(
      {
        name: 'javascript',
        bucket: 'BA'
      },
      { dConfig: {} }
    );

    await expect(result.data.result).resolves.toEqual(undefined);
  });

  it('[language] should  metadata', async () => {
    const result = await worker.metadata(
      {
        name: 'javascript',
        bucket: 'BA'
      },
      {
        dConfig: {},
        aConfig: {
          spreadsheetId: '',
          sheetTitle: ''
        }
      }
    );

    await expect(result.data.result).resolves.toEqual({});
  });

  it('[language] should  pre_delete', async () => {
    const result = await worker.preDelete(
      {
        name: 'javascript',
        bucket: 'BA'
      },
      { dConfig: {} }
    );

    await expect(result.data.result).resolves.toEqual(undefined);
  });

  // TODO(frank): We're not actually testing that these execute in sync.
  //              Need to figure out if it's possible.
  it('should execute async', async () => {
    const [result_one, result_two] = await Promise.all([
      worker.preDelete(
        {
          name: 'javascript',
          bucket: 'BA'
        },
        { dConfig: {} }
      ),
      worker.test(
        {
          name: 'javascript',
          bucket: 'BA'
        },
        { dConfig: {} }
      )
    ]);

    await expect(result_one.data.result).resolves.toEqual(undefined);
    await expect(result_two.data.result).resolves.toEqual(undefined);
  });
});
