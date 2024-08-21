import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import { RelayDelegate } from '@superblocks/shared';
import pino from 'pino';
import { PluginProps } from '../../plugin-property/plugin-props';
import { Redis } from '../../store/redis';
import { KVStore, WorkerAPI } from '../../types';
import { percentile } from '../../utils';
import { SUPERBLOCKS_AGENT_LOAD_CONCURRENCY, SUPERBLOCKS_AGENT_LOAD_REQUESTS, SUPERBLOCKS_PYTHON_TESTS } from '../env';
import { WorkerAPIImpl } from '../integration/client';
import { REDIS_CLIENT_TYPE, client } from '../utils';

const performanceTest = async (worker: WorkerAPI, kvStore: KVStore, plugin: string) => {
  const props: PluginProps = {
    stepName: 'Step1',
    executionId: '<will overwrite per iteration>',
    // bindingKeys: [{ key: 'Cullinan', type: BindingType.Global }],
    bindingKeys: [],
    context: {
      outputs: {},
      globals: { Cullinan: { horsepower: 3 } }
    },
    environment: 'production',
    redactedContext: {},
    agentCredentials: {},
    redactedDatasourceConfiguration: {},
    actionConfiguration: {
      // body: 'return Cullinan.horsepower',
      body: 'return 3',
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

  const testStart: number = Date.now();
  const data: Array<number> = [];
  const queueResponse: Array<number> = [];

  await expect(
    Promise.all(
      [...Array(SUPERBLOCKS_AGENT_LOAD_CONCURRENCY)].map(async (): Promise<void> => {
        for (let i = 0; i < Math.ceil(SUPERBLOCKS_AGENT_LOAD_REQUESTS / SUPERBLOCKS_AGENT_LOAD_CONCURRENCY); i++) {
          const thisProps: PluginProps = { ...props, ...{ executionId: `plugin-exec-js-${randomUUID()}` } };

          await expect(worker.prepareApiExecution(thisProps)).resolves.not.toThrowError();

          const result = await worker.execute(
            {
              name: plugin,
              bucket: 'test'
            },
            { props: thisProps }
          );

          const completed = await result.data.result;

          if (plugin === 'python') {
            expect(completed.err).toBeNull();
          } else {
            expect(completed.err).not.toBeDefined();
          }

          const output = await kvStore.read([completed.key]);

          // @ts-ignore
          expect(output.data[0].output).toEqual(3);

          data.push(result.pinned.overhead().absolute);
          queueResponse.push(result.pinned.queueResponse.value);
        }
      })
    )
  ).resolves.toEqual(expect.anything());

  const duration = Date.now() - testStart;
  const rps = Math.floor(SUPERBLOCKS_AGENT_LOAD_REQUESTS / (duration / 1000));

  data.sort((a: number, b: number): number => a - b);
  queueResponse.sort((a: number, b: number): number => a - b);

  console.table([
    {
      'duration (ms)': duration,
      concurrency: SUPERBLOCKS_AGENT_LOAD_CONCURRENCY,
      requests: SUPERBLOCKS_AGENT_LOAD_REQUESTS,
      rps: Math.floor(rps)
    }
  ]);

  console.table([
    {
      percentile: '100th',
      'overhead (ms)': Math.floor(percentile(100, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(100, [...queueResponse]) / 1000)
    },
    {
      percentile: '99th',
      'overhead (ms)': Math.floor(percentile(99, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(99, [...queueResponse]) / 1000)
    },
    {
      percentile: '95th',
      'overhead (ms)': Math.floor(percentile(95, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(95, [...queueResponse]) / 1000)
    },
    {
      percentile: '90th',
      'overhead (ms)': Math.floor(percentile(90, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(90, [...queueResponse]) / 1000)
    },
    {
      percentile: '75th',
      'overhead (ms)': Math.floor(percentile(75, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(75, [...queueResponse]) / 1000)
    },
    {
      percentile: '50th',
      'overhead (ms)': Math.floor(percentile(50, [...data]) / 1000),
      'queue response (ms)': Math.floor(percentile(50, [...queueResponse]) / 1000)
    }
  ]);

  if (plugin === 'python') {
    expect(rps).toBeGreaterThan(25);
  } else {
    expect(rps).toBeGreaterThan(10);
  }
};

describe('load', () => {
  jest.setTimeout(120000);

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

  (SUPERBLOCKS_PYTHON_TESTS ? it.skip : it)('javascript should be performant', async () => {
    await performanceTest(worker, kvStore, 'javascript');
  });

  (SUPERBLOCKS_PYTHON_TESTS ? it : it.skip)('python should be performant', async () => {
    await performanceTest(worker, kvStore, 'python');
  });
});
