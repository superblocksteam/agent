import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import { RelayDelegate } from '@superblocks/shared';
import { default as pino } from 'pino';
import { PluginProps } from '../../../plugin-property/plugin-props';
import { GC } from '../../../store/gc';
import { Redis, RedisTx } from '../../../store/redis';
import { KVStore, KVStoreTx, WorkerAPI } from '../../../types';
import { VariableMode, VariableType } from '../../../types';
import { REDIS_CLIENT_TYPE, client } from '../../utils';
import { WorkerAPIImpl } from '../client';

describe('variables', () => {
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
    await queueRedis.xAdd('agent.main.bucket.B1.plugin.javascript.event.execute;', '*', { foo: JSON.stringify({ frank: 'greco' }) });
  });

  afterAll(async (): Promise<void> => {
    await kvRedis?.quit();
    await queueRedis?.quit();
  });

  it('test variable read and write', async () => {
    const variables = {
      simpleVar1: {
        key: 'key1',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      simpleVar2: {
        key: 'key2',
        type: VariableType.Simple,
        mode: VariableMode.ReadWrite
      },
      advancedVar1: {
        key: 'key3',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      advancedVar2: {
        key: 'key4',
        type: VariableType.Advanced,
        mode: VariableMode.ReadWrite
      },
      nativeVar1: {
        key: 'key5',
        type: VariableType.NATIVE
      }
    };
    await kvStore.write('key1', 10);
    await kvStore.write('key2', 20);
    await kvStore.write('key3', 30);
    await kvStore.write('key4', 40);
    await kvStore.write('key5', 50);

    const props: PluginProps = {
      stepName: 'Step1',
      executionId: 'plugin-exec-js-' + Math.random().toString(36).slice(2),
      bindingKeys: [],
      environment: 'production',
      context: {
        outputs: {},
        globals: {}
      },
      redactedContext: {},
      agentCredentials: {},
      redactedDatasourceConfiguration: {},
      actionConfiguration: {
        body: 'simpleVar2.set(0); await advancedVar2.set(0); return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get() + nativeVar1;',
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
      variables: variables,
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
    logger.info(completed);
    expect(completed.err).not.toBeDefined();

    const output = await kvStore.read([completed.key]);
    // @ts-ignore
    expect(output.data[0].output).toEqual(90);
    // @ts-ignore
    expect(output.pinned.read).toBeGreaterThan(0);

    let value = (await kvStore.read(['key1'])).data[0];
    expect(value).toEqual(10);

    value = (await kvStore.read(['key2'])).data[0];
    expect(value).toEqual(0);

    value = (await kvStore.read(['key3'])).data[0];
    expect(value).toEqual(30);

    value = (await kvStore.read(['key4'])).data[0];
    expect(value).toEqual(0);

    value = (await kvStore.read(['key5'])).data[0];
    expect(value).toEqual(50);
  });

  it('test backfill bindingKeys', async () => {
    const executionId = 'plugin-exec-js-' + Math.random().toString(36).slice(2);
    const variables = {
      key1: {
        key: `${executionId}.context.output.key1`,
        type: VariableType.NATIVE
      },
      global1: {
        key: `${executionId}.context.global.global1`,
        type: VariableType.NATIVE
      }
    };

    await kvStore.write(`${executionId}.context.output.key1`, { output: 10 });
    await kvStore.write(`${executionId}.context.global.global1`, 10);

    const props: PluginProps = {
      stepName: 'Step1',
      executionId: executionId,
      bindingKeys: [],
      environment: 'production',
      context: {
        outputs: {},
        globals: {}
      },
      redactedContext: {},
      agentCredentials: {},
      redactedDatasourceConfiguration: {},
      actionConfiguration: {
        body: 'return key1.output + global1;'
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
      variables: variables,
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
    const completed = await result.data.result;
    expect(completed.err).not.toBeDefined();

    const output = await kvStore.read([completed.key]);
    // @ts-ignore
    expect(output.data[0].output).toEqual(20);
    // @ts-ignore
    expect(output.pinned.read).toBeGreaterThan(0);
  });

  it('test backwards compatibility', async () => {
    await kvStore.write('key1', 10);
    await kvStore.write('key2', 20);
    await kvStore.write('key3', 30);
    await kvStore.write('key4', 40);
    await kvStore.write('key5', 50);

    const props: PluginProps = {
      stepName: 'Step1',
      executionId: 'plugin-exec-js-' + Math.random().toString(36).slice(2),
      bindingKeys: [],
      environment: 'production',
      context: {
        outputs: {},
        globals: {}
      },
      redactedContext: {},
      agentCredentials: {},
      redactedDatasourceConfiguration: {},
      actionConfiguration: {
        body: 'return 123;',
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
    logger.info(completed);
    expect(completed.err).not.toBeDefined();

    const output = await kvStore.read([completed.key]);
    // @ts-ignore
    expect(output.data[0].output).toEqual(123);
  });
});
