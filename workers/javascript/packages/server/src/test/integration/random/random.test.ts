import { describe, expect, it, jest } from '@jest/globals';
import { RedisClientType } from '@redis/client';
import pino from 'pino';
import { TimeoutError } from '../../../errors';
import { StepPerformance } from '../../../performance/types';
import { MockKVStore } from '../../../store/mock';
import { WorkerAPIImpl } from '../../../test/integration/client';
import { Deferable, ExecuteResponse, QueueAPI, WorkerAPI, Wrapped } from '../../../types';
import { SUPERBLOCKS_EXCLUDE_TESTS } from '../../env';
import { code, client, REDIS_CLIENT_TYPE } from '../../utils';

describe('random', () => {
  jest.setTimeout(30000);

  let worker: WorkerAPI & QueueAPI;
  let redis: RedisClientType;

  beforeAll(async (): Promise<void> => {
    redis = await client(REDIS_CLIENT_TYPE.QUEUE);
    worker = new WorkerAPIImpl({ redis, kvStore: new MockKVStore(), agent: 'main', timeout: 4000, logger: pino() });
  });

  afterAll(async (): Promise<void> => {
    await redis.quit();
  });

  it('returns syntax error', async () => {
    const executionId = 'random-test-' + Math.random().toString(36).slice(2);
    const stepName = 'Step1';
    const result = await worker.execute(
      {
        name: 'javascript',
        bucket: 'B1'
      },
      code(executionId, stepName, 'console.log(;')
    );

    const execResult = await result.data.result;

    expect(execResult.key).toEqual(`${executionId}.context.output.${stepName}`);
    expect(execResult.err).toBeDefined();
    expect(execResult.err.name).toEqual('IntegrationError');

    const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();
    const expectedErr = `Error on line 1:
console.log(;
            ^
SyntaxError: Unexpected token ';'`;

    expect(normalizeWhitespace(execResult.err.message)).toEqual(normalizeWhitespace(expectedErr));

    expect(result.pinned).toBeDefined();
    expect(result.pinned.total.value).toBeGreaterThan(0);
  });

  // NOTE(frank): This test will fail if there is more
  //              than 1 worker that can accept the request.
  (SUPERBLOCKS_EXCLUDE_TESTS ? it.skip : it)('concurrent javascript requests should execute synchronously', async () => {
    const executionId = 'random-test-' + Math.random().toString(36).slice(2);
    const stepName1 = 'Step1';
    const stepName2 = 'Step2';
    const run: (stepName: string) => Promise<Wrapped<StepPerformance, Deferable<ExecuteResponse>>> = async (
      stepName: string
    ): Promise<Wrapped<StepPerformance, Deferable<ExecuteResponse>>> => {
      return worker.execute(
        {
          name: 'javascript',
          bucket: 'B1'
        },
        code(executionId, stepName, 'return await new Promise((resolve) => setTimeout(resolve, 1500))')
      );
    };

    const [result_one, result_two] = await Promise.all([run(stepName1), run(stepName2)]);

    await expect(result_one.data.result).resolves.toEqual({ err: undefined, key: `${executionId}.context.output.${stepName1}` });
    await expect(result_two.data.result).resolves.toEqual({ err: undefined, key: `${executionId}.context.output.${stepName2}` });

    const { start: x1, end: x2 } = result_one.pinned.pluginExecution;
    const { start: y1, end: y2 } = result_two.pinned.pluginExecution;

    // execution times must not overlap
    expect(x2 <= y1 || x1 >= y2).toBeTruthy();

    const { start: a1, end: a2 } = result_one.pinned.total;
    const { start: b1, end: b2 } = result_two.pinned.total;

    // total times must overlap
    expect(a2 >= b1 && a1 <= b2).toBeTruthy();
  });

  it('purges items that timeout', async () => {
    let messageID: string;

    // The client isn't allowed to create the stream if it doesn't exist.
    // Hence, we need to create it here. Adding an item is an easy way.
    await redis
      .xAdd('agent.main.bucket.B1.plugin.absent.event.execute', '*', { foo: JSON.stringify({ frank: 'greco' }) })
      .then((id: string) => {
        messageID = id;
      });

    await expect(redis.xDel('agent.main.bucket.B1.plugin.absent.event.execute', messageID)).resolves.toEqual(expect.anything());

    const executionId = 'random-test-' + Math.random().toString(36).slice(2);
    const stepName = 'Step1';

    const result = await worker.execute(
      {
        name: 'absent',
        bucket: 'B1'
      },
      code(executionId, stepName, 'console.log("hi")')
    );

    // NOTE(frank): Ideally we assert the item is actually on the stream here.
    await expect(result.data.result).rejects.toThrowError(TimeoutError);

    // NOTE(frank): I'm assuming the item actually makes it on the queue.
    await expect(worker.wait('agent.main.bucket.B1.plugin.absent.event.execute', 100)).rejects.toThrowError(TimeoutError);
  });
});
