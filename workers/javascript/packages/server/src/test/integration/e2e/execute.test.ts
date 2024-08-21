import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import { RelayDelegate } from '@superblocks/shared';
import { default as pino } from 'pino';
import { InternalError } from '../../../errors';
import { PluginProps } from '../../../plugin-property/plugin-props';
import { GC } from '../../../store/gc';
import { Redis, RedisTx } from '../../../store/redis';
import { WorkerAPIImpl } from '../../../test/integration/client';
import { BindingType, KVStore, KVStoreTx, WorkerAPI } from '../../../types';
import { VariableType } from '../../../types';
import { SUPERBLOCKS_EXCLUDE_TESTS } from '../../env';
import { client, code, REDIS_CLIENT_TYPE } from '../../utils';

describe('execute', () => {
  describe('with redis transport and redis kvstore', () => {
    const logger = pino({ level: 'debug' });

    let kvRedis: RedisClientType;
    let queueRedis: RedisClientType;
    let kvStore: KVStore;
    let worker: WorkerAPI;

    beforeAll(async (): Promise<void> => {
      kvRedis = await client(REDIS_CLIENT_TYPE.KVSTORE);
      queueRedis = await client(REDIS_CLIENT_TYPE.QUEUE);

      kvStore = new Redis({ client: kvRedis, seconds: 600, slowThreshold: 2000000, logger });
      worker = new WorkerAPIImpl({
        kvStore,
        redis: queueRedis,
        agent: 'main',
        logger: logger,
        ackTimeoutMs: 3000
      });
    });

    afterAll(async (): Promise<void> => {
      await kvRedis?.quit();
      await queueRedis?.quit();
    });

    (SUPERBLOCKS_EXCLUDE_TESTS ? it.skip : it)('should fail for large payloads', async () => {
      const result = await worker.execute(
        {
          name: 'javascript',
          bucket: 'B1'
        },
        code(randomUUID(), 'TooLarge', 'return Buffer.alloc(5000001)')
      );

      await expect(result.data.result).rejects.toEqual({
        message: 'The serialized size of the output (11MB) exceeds to maxixum (10MB).',
        name: 'Error'
      });
    });

    it('should execute', async () => {
      const key1 = randomUUID();
      const key2 = randomUUID();
      const key3 = randomUUID();
      const key4 = randomUUID();
      const key5 = randomUUID();

      await kvStore.writeMany([
        { key: key1, value: { horsepower: 4 } },
        { key: key2, value: { horsepower: 5 } },
        { key: key3, value: { horsepower: 1 } },
        { key: key4, value: { horsepower: 2 } },
        { key: key5, value: { horsepower: 3 } }
      ]);

      const props: PluginProps = {
        stepName: 'Step1',
        executionId: 'plugin-exec-js-' + Math.random().toString(36).slice(2),
        bindingKeys: [
          { key: 'Cullinan', type: BindingType.Global },
          { key: 'Ghost', type: BindingType.Global },
          { key: 'Phantom', type: BindingType.Global },
          { key: 'ContinentalGT', type: BindingType.Output },
          { key: 'FlyingSpur', type: BindingType.Output }
        ],
        environment: 'production',
        context: {},
        variables: {
          ContinentalGT: {
            key: key1,
            type: VariableType.NATIVE
          },
          FlyingSpur: {
            key: key2,
            type: VariableType.NATIVE
          },
          Ghost: {
            key: key3,
            type: VariableType.NATIVE
          },
          Phantom: {
            key: key4,
            type: VariableType.NATIVE
          },
          Cullinan: {
            key: key5,
            type: VariableType.NATIVE
          }
        },
        redactedContext: {},
        agentCredentials: {},
        redactedDatasourceConfiguration: {},
        actionConfiguration: {
          body: 'return Ghost.horsepower + Cullinan.horsepower + Phantom.horsepower + ContinentalGT.horsepower + FlyingSpur.horsepower',
          spreadsheetId: '',
          sheetTitle: ''
        },
        datasourceConfiguration: {},
        files: {},
        recursionContext: {
          executedWorkflowsPath: [],
          isEvaluatingDatasource: false
        },
        relayDelegate: new RelayDelegate({
          body: {
            relays: {}
          }
        }),
        $fileServerUrl: undefined,
        $flagWorker: true
      };

      const tx: KVStoreTx = new RedisTx({ client: kvRedis, seconds: 600, logger });
      const gc = new GC();
      await WorkerAPIImpl.initApi(tx, props, gc);
      await tx.commit();

      const result = await worker.execute(
        {
          name: 'javascript',
          bucket: 'B1'
        },
        { props }
      );
      logger.info(result.pinned);
      logger.info(result.pinned.overhead());
      const completed = await result.data.result;
      expect(completed.err).not.toBeDefined();
      expect(result.pinned.kvStorePush.bytes).toBeGreaterThan(0);

      logger.info(completed);

      const output = await kvStore.read([completed.key]);

      // @ts-ignore
      expect(output.data[0].output).toEqual(15);
      // @ts-ignore
      expect(output.pinned.read).toBeGreaterThan(0);
    });

    it("should throw if the stream doesn't exist", async () => {
      const result = await worker.execute(
        {
          name: 'koalavirus',
          bucket: 'B1'
        },
        code(randomUUID(), 'Step1', 'console.log("hi")')
      );
      await expect(result.data.result).rejects.toEqual(new InternalError('stream does not exist'));
    });
  });
});
