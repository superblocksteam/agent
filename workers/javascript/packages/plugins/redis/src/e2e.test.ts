import {
  DUMMY_EXECUTION_CONTEXT,
  ErrorCode,
  ExecutionOutput,
  PluginExecutionProps,
  RedisActionConfiguration,
  RedisDatasourceConfiguration,
  RelayDelegate
} from '@superblocks/shared';
import { RedisPluginV1 as RedisTypes } from '@superblocksteam/types';
import { promises as fs } from 'fs';
import { Redis } from 'ioredis';
import { cloneDeep } from 'lodash';
import path from 'path';
import RedisPlugin from '.';

// all connection info
const REDIS_HOST = '127.0.0.1';
const REDIS_PORT = 61379;
const REDIS_PASSWORD = 'pass';
const REDIS_DATABASE_NUMBER = 0;
const REDIS_USER_USERNAME = 'some_user';
const REDIS_USER_PASSWORD = 'some_password';

const REDIS_URL = `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DATABASE_NUMBER}`;
const REDIS_URL_USER = `redis://${REDIS_USER_USERNAME}:${REDIS_USER_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DATABASE_NUMBER}`;

const { Plugin_Connection, Plugin_Expire_Option, Plugin: RedisPluginV1 } = RedisTypes;

// helper functions
async function resetDatabase(): Promise<Redis> {
  const filePath = path.join(__dirname, 'initialRedisState.json');

  const rawData = await fs.readFile(filePath, 'utf-8');
  const initialState = JSON.parse(rawData);

  await test_client.flushall();

  for (const item of initialState) {
    switch (item.type) {
      case 'kv':
        await test_client.set(item.key, item.value);
        break;

      case 'hash':
        for (const field in item.fields) {
          await test_client.hset(item.key, field, item.fields[field]);
        }
        break;

      case 'list':
        for (const value of item.values) {
          await test_client.rpush(item.key, value);
        }
        break;

      case 'set':
        await test_client.sadd(item.key, ...item.values);
        break;

      case 'zset':
        for (const value of item.values) {
          await test_client.zadd(item.key, value[0], value[1]);
        }
        break;

      default:
        throw new Error(`Unhandled Redis type: ${item.type}`);
    }
  }

  // clear all users except default
  try {
    // Fetch all user names
    const userList = await test_client.acl('LIST');
    const userNames = userList
      .map((u) => {
        const match = u.match(/user (\w+) on/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    // Delete each user
    for (const userName of userNames) {
      if (userName !== 'default') {
        // NOTE: (joey) we do this "as any" since the .acl method only accepts 'SETUSER'
        // there does not seem to be a direct way (even with a raw command) to send this command.
        // for now, this does work.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (test_client as any).acl('DELUSER', userName);
      }
    }
  } catch (err) {
    console.error('Failed to clear users:', err);
    throw err;
  }
  // create test user
  await test_client.acl('SETUSER', REDIS_USER_USERNAME, 'on', `>${REDIS_USER_PASSWORD}`, 'allcommands', 'allkeys');

  return test_client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAllData(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultObject: any = {};

  // Get all keys in the database
  const keys = await test_client.keys('*');

  for (const key of keys) {
    const type = await test_client.type(key);

    switch (type) {
      case 'string':
        resultObject[key] = await test_client.get(key);
        break;

      case 'hash':
        resultObject[key] = await test_client.hgetall(key);
        break;

      case 'list':
        resultObject[key] = await test_client.lrange(key, 0, -1);
        break;

      case 'set':
        resultObject[key] = new Set(await test_client.smembers(key));
        break;

      case 'zset': {
        const zsetWithScores = await test_client.zrange(key, 0, -1, 'WITHSCORES');
        const zsetArray: { member: string; score: number }[] = [];

        for (let i = 0; i < zsetWithScores.length; i += 2) {
          const member = zsetWithScores[i];
          const score = parseFloat(zsetWithScores[i + 1]);
          zsetArray.push({ member, score });
        }

        resultObject[key] = zsetArray;
        break;
      }
      default:
        throw new Error(`Unhandled Redis type: '${type}' for key: '${key}'`);
    }
  }

  return resultObject;
}

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function arraysHaveSameValues<T>(arr1: T[], arr2: T[]): boolean {
  // sometimes, lists are returned in a random order.
  // we can use this for consistency in test assertions where we do not care about order.
  if (arr1.length !== arr2.length) return false;

  const sortedArr1 = arr1.slice().sort();
  const sortedArr2 = arr2.slice().sort();

  for (let i = 0; i < sortedArr1.length; i++) {
    if (sortedArr1[i] !== sortedArr2[i]) {
      return false;
    }
  }

  return true;
}

// helper test functions
async function assertDbStateHasNotChanged(): Promise<void> {
  // checks that the db state is the same as before any test
  expect(await getAllData()).toEqual(DEFAULT_DB_STATE);
}

const __KEY_TO_REMOVE__ = Symbol('REMOVE_KEY');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertDbStateWithChanges(changes: Record<string, any>): Promise<void> {
  // checks that the db state is the same as before any test
  // AFTER the given keys have been swapped in
  const dataWithChanges = cloneDeep(DEFAULT_DB_STATE);
  for (const [key, value] of Object.entries(changes)) {
    if (value === __KEY_TO_REMOVE__) {
      delete dataWithChanges[key];
    } else {
      dataWithChanges[key] = value;
    }
  }
  expect(dataWithChanges).toEqual(await getAllData());
}

function buildPropsWithActionConfiguration(
  actionConfiguration: RedisActionConfiguration
): PluginExecutionProps<RedisDatasourceConfiguration, RedisActionConfiguration> {
  return {
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  } as PluginExecutionProps<RedisDatasourceConfiguration, RedisActionConfiguration>;
}

// used to inspect the state of the DB
let test_client: Redis;
let DEFAULT_DB_STATE;

const plugin: RedisPlugin = new RedisPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  name: 'Redis Plugin Tests',
  connection: Plugin_Connection.fromJson({
    fields: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      databaseNumber: REDIS_DATABASE_NUMBER
    }
  })
} as RedisDatasourceConfiguration;

const context = DUMMY_EXECUTION_CONTEXT;
export const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
  files: [],
  agentCredentials: {},
  recursionContext: {
    executedWorkflowsPath: [],
    isEvaluatingDatasource: false
  },
  environment: 'dev',
  relayDelegate: new RelayDelegate({
    body: {},
    headers: {},
    query: {}
  })
};

type RawOutput = { response: unknown };

beforeAll(async () => {
  test_client = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DATABASE_NUMBER
  });
});
afterAll(async () => {
  test_client.disconnect();
});

beforeEach(async () => {
  await resetDatabase();
  // used for easy assertion to ensure that the state of the DB has not changed
  DEFAULT_DB_STATE = await getAllData();
});

describe('Redis Connection', () => {
  test('connection succeeds with basic config [FIELDS]', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('connection succeeds with user and password given [FIELDS]', async () => {
    const fieldsConnection = Plugin_Connection.fromJson({
      fields: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_USER_PASSWORD,
        databaseNumber: REDIS_DATABASE_NUMBER,
        username: REDIS_USER_USERNAME
      }
    });
    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: fieldsConnection } as RedisDatasourceConfiguration;
    await plugin.test(newDatasourceConfiguration);
  });

  test('connection succeeds with basic config [URL]', async () => {
    const urlConnection = Plugin_Connection.fromJson({
      url: {
        urlString: REDIS_URL
      }
    });

    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: urlConnection } as RedisDatasourceConfiguration;
    await plugin.test(newDatasourceConfiguration);
  });

  test('connection succeeds with user and password given [URL]', async () => {
    const urlConnection = Plugin_Connection.fromJson({
      url: {
        urlString: REDIS_URL_USER
      }
    });

    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: urlConnection } as RedisDatasourceConfiguration;
    await plugin.test(newDatasourceConfiguration);
  });

  test('connection fails with bad hostname', async () => {
    const fieldsConnection = Plugin_Connection.fromJson({
      fields: {
        host: 'foo',
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        databaseNumber: REDIS_DATABASE_NUMBER
      }
    });

    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: fieldsConnection } as RedisDatasourceConfiguration;

    await plugin
      .test(newDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('Test connection failed: Connection timed out after 3000ms.');
        expect(err.code).toEqual(ErrorCode.INTEGRATION_NETWORK);
      });
  }, 10000);

  test('connection fails with bad port', async () => {
    const fieldsConnection = Plugin_Connection.fromJson({
      fields: {
        host: REDIS_HOST,
        port: 1,
        password: REDIS_PASSWORD,
        databaseNumber: REDIS_DATABASE_NUMBER
      }
    });

    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: fieldsConnection } as RedisDatasourceConfiguration;

    await plugin
      .test(newDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('Test connection failed: Connection timed out after 3000ms.');
        expect(err.code).toEqual(ErrorCode.INTEGRATION_NETWORK);
      });
  }, 10000);

  test('connection fails with bad password', async () => {
    const fieldsConnection = Plugin_Connection.fromJson({
      fields: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: 'im a bad password lolz',
        databaseNumber: REDIS_DATABASE_NUMBER
      }
    });

    const newDatasourceConfiguration = { name: 'Redis Plugin Tests', connection: fieldsConnection } as RedisDatasourceConfiguration;

    await plugin
      .test(newDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('Test connection failed: WRONGPASS invalid username-password pair or user is disabled.');
        expect(err.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });
});
describe('Redis Raw Commands', () => {
  test('executing an empty raw command does nothing', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: ''
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual({});
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [GET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'get name'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect((resp.output as RawOutput).response).toEqual('joey');
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: GET name');
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [SET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'set name frank'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect((resp.output as RawOutput).response).toEqual('OK');
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: SET name frank');
    await assertDbStateWithChanges({ name: 'frank' });
  });

  test('executing a raw command works [DEL]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'del name'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect((resp.output as RawOutput).response).toEqual(1);
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: DEL name');
    await assertDbStateWithChanges({ name: __KEY_TO_REMOVE__ });
  });

  test('executing a raw command works [KEYS]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'keys *'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(
      arraysHaveSameValues((resp.output as RawOutput).response as string[], ['nfcnorth', 'movies', 'hashbrowns', 'name', 'colors', 'age'])
    ).toBeTruthy();
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: KEYS *');
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [MGET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'mget name age'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(arraysHaveSameValues((resp.output as RawOutput).response as string[], ['joey', '26'])).toBeTruthy();
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: MGET name age');
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [HGET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'hget hashbrowns price'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect((resp.output as RawOutput).response).toEqual('2.50');
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: HGET hashbrowns price');
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [HMGET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'hmget hashbrowns price taste'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect((resp.output as RawOutput).response).toEqual(['2.50', 'yummy']);
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: HMGET hashbrowns price taste');
    await assertDbStateHasNotChanged();
  });

  test('executing a raw command works [HSET]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'hset hashbrowns taste super price 3.50 color brownish'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual({ response: 1 });
    expect(newProps.mutableOutput.log[0]).toEqual('Running command: HSET hashbrowns taste super price 3.50 color brownish');
    await assertDbStateWithChanges({ hashbrowns: { color: 'brownish', price: '3.50', taste: 'super' } });
  });

  // TODO: (joey) test more/all raw commands
});

describe('Redis Structured Commands', () => {
  test('executing a structured GET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          get: {
            key: 'name'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual('joey');
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          set: {
            key: 'name',
            value: 'frank'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual('OK');
    await assertDbStateWithChanges({ name: 'frank' });
  });

  test('executing a structured SET command works [WITH EXPIRATION MS]', async () => {
    // check that it expires
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          set: {
            key: 'imgunnaexpire',
            value: 'weeee',
            expirationMs: 1
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    expect(resp1.output).toEqual('OK');
    await sleep(0.1);
    await assertDbStateHasNotChanged();
    // check that it is there before it expires
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          set: {
            key: 'iwontexpireyet',
            value: 'woooo',
            expirationMs: 1000000
          }
        }
      })
    );
    const resp2 = await plugin.execute(newProps);
    expect(resp2.output).toEqual('OK');
    await assertDbStateWithChanges({ iwontexpireyet: 'woooo' });
  });

  test('executing a structured DEL command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          del: {
            key: 'name'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ name: __KEY_TO_REMOVE__ });
  });

  test('executing a structured KEYS command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          keys: {
            pattern: '*'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(arraysHaveSameValues(resp.output as string[], ['nfcnorth', 'movies', 'hashbrowns', 'name', 'colors', 'age'])).toBeTruthy();
    await assertDbStateHasNotChanged();
  });

  test('executing a structured MGET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          mget: {
            keys: 'name, age'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['joey', '26']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HGET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hget: {
            key: 'hashbrowns',
            field: 'price'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual('2.50');
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HMGET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hmget: {
            key: 'hashbrowns',
            fields: 'price, taste'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['2.50', 'yummy']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HGETALL command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hgetall: {
            key: 'hashbrowns'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual({ price: '2.50', taste: 'yummy' });
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HSET command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hset: {
            key: 'hashbrowns',
            field: 'taste',
            value: 'scrumptious'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(0);
    await assertDbStateWithChanges({ hashbrowns: { taste: 'scrumptious', price: '2.50' } });
  });

  test('executing a structured HSETNX command works [with change]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hsetnx: {
            key: 'hashbrowns',
            field: 'delicious',
            value: 'yes'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ hashbrowns: { taste: 'yummy', price: '2.50', delicious: 'yes' } });
  });

  test('executing a structured HSETNX command works [without change]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hsetnx: {
            key: 'hashbrowns',
            field: 'price',
            value: '2.51'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(0);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HLEN command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hlen: {
            key: 'hashbrowns'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(2);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HDEL command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hdel: {
            key: 'hashbrowns',
            field: 'price'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ hashbrowns: { taste: 'yummy' } });
  });

  test('executing a structured HKEYS command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hkeys: {
            key: 'hashbrowns'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['taste', 'price']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured HVALS command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          hvals: {
            key: 'hashbrowns'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['yummy', '2.50']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured LINDEX command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          lindex: {
            key: 'nfcnorth',
            index: 0
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual('packers');
    await assertDbStateHasNotChanged();
  });

  test('executing a structured LLEN command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          llen: {
            key: 'nfcnorth'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(4);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured LPUSH command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          lpush: {
            key: 'nfcnorth',
            value: 'buccaneers'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(5);
    await assertDbStateWithChanges({ nfcnorth: ['buccaneers', 'packers', 'bears', 'vikings', 'lions'] });
  });

  test('executing a structured LREM command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          lrem: {
            key: 'nfcnorth',
            count: 0,
            value: 'bears'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ nfcnorth: ['packers', 'vikings', 'lions'] });
  });

  test('executing a structured LRANGE command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          lrange: {
            key: 'nfcnorth',
            start: 1,
            stop: 2
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['bears', 'vikings']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SADD command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          sadd: {
            key: 'colors',
            member: 'violet'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ colors: new Set(['purple', 'pink', 'teal', 'violet']) });
  });

  test('executing a structured SCARD command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          scard: {
            key: 'colors'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(3);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SMEMBERS command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          smembers: {
            key: 'colors'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(arraysHaveSameValues(resp.output as string[], ['purple', 'pink', 'teal'])).toBeTruthy();
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SISMEMBER command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          sismember: {
            key: 'colors',
            member: 'teal'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SRANDMEMBER command works [count given]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          srandmember: {
            key: 'colors',
            count: 1
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((resp.output as any[]).length).toEqual(1);
    expect(['purple', 'teal', 'pink']).toContain((resp.output as string[])[0]);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SRANDMEMBER command works [count not given]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          srandmember: {
            key: 'colors'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(['purple', 'teal', 'pink']).toContain(resp.output);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured SREM command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          srem: {
            key: 'colors',
            member: 'teal'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({ colors: new Set(['purple', 'pink']) });
  });

  test('executing a structured ZADD command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zadd: {
            key: 'movies',
            score: 10,
            member: 'inception'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({
      movies: [
        { member: 'barbie', score: 7 },
        { member: 'hotrod', score: 8.5 },
        { member: 'the prestige', score: 9 },
        { member: 'inception', score: 10 }
      ]
    });
  });

  test('executing a structured ZCARD command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zcard: {
            key: 'movies'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(3);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured ZCOUNT command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zcount: {
            key: 'movies',
            min: 7,
            max: 8.5
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(2);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured ZRANGE command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zrange: {
            key: 'movies',
            start: 0,
            stop: 1
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(['barbie', 'hotrod']);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured ZRANK command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zrank: {
            key: 'movies',
            member: 'the prestige'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(2);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured ZREM command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zrem: {
            key: 'movies',
            member: 'the prestige'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual(1);
    await assertDbStateWithChanges({
      movies: [
        { member: 'barbie', score: 7 },
        { member: 'hotrod', score: 8.5 }
      ]
    });
  });

  test('executing a structured ZSCORE command works', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          zscore: {
            key: 'movies',
            member: 'the prestige'
          }
        }
      })
    );

    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual('9');
    await assertDbStateHasNotChanged();
  });

  test('executing a structured EXPIRE command works [NO OPTIONS]', async () => {
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    expect(resp1.output).toEqual(1);
    // long expiry, should still be there
    await assertDbStateHasNotChanged();
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1
          }
        }
      })
    );

    const resp2 = await plugin.execute(newProps);
    expect(resp2.output).toEqual(1);
    await sleep(1.1);
    // short expiry that we waited for, should not be there
    await assertDbStateWithChanges({ name: __KEY_TO_REMOVE__ });
  });

  test('executing a structured EXPIRE command works [NX OPTION]', async () => {
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000,
            option: Plugin_Expire_Option.NX
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    // has no existing expiry, works
    expect(resp1.output).toEqual(1);
    await assertDbStateHasNotChanged();

    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000,
            option: Plugin_Expire_Option.NX
          }
        }
      })
    );

    const resp2 = await plugin.execute(newProps);
    // has an existing expiry, does not work
    expect(resp2.output).toEqual(0);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured EXPIRE command works [XX OPTION]', async () => {
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000,
            option: Plugin_Expire_Option.XX
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    // has no existing expiry, does not work
    expect(resp1.output).toEqual(0);
    await assertDbStateHasNotChanged();

    // set expiry
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000
          }
        }
      })
    );

    const resp2 = await plugin.execute(newProps);
    expect(resp2.output).toEqual(1);

    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000,
            option: Plugin_Expire_Option.XX
          }
        }
      })
    );

    const resp3 = await plugin.execute(newProps);
    // has an existing expiry, works
    expect(resp3.output).toEqual(1);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured EXPIRE command works [GT OPTION]', async () => {
    // first, set an expiry
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    expect(resp1.output).toEqual(1);
    // set a longer expiry -> works
    await assertDbStateHasNotChanged();
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1001,
            option: Plugin_Expire_Option.GT
          }
        }
      })
    );

    const resp2 = await plugin.execute(newProps);
    expect(resp2.output).toEqual(1);
    // set a shorter expiry -> does not work
    await assertDbStateHasNotChanged();
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 100,
            option: Plugin_Expire_Option.GT
          }
        }
      })
    );

    const resp3 = await plugin.execute(newProps);
    expect(resp3.output).toEqual(0);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured EXPIRE command works [LT OPTION]', async () => {
    // first, set an expiry
    let newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 1000
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    expect(resp1.output).toEqual(1);
    // set a shorter expiry -> works
    await assertDbStateHasNotChanged();
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 900,
            option: Plugin_Expire_Option.LT
          }
        }
      })
    );

    const resp2 = await plugin.execute(newProps);
    expect(resp2.output).toEqual(1);
    // set a longer expiry -> does not work
    await assertDbStateHasNotChanged();
    newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          expire: {
            key: 'name',
            seconds: 10000,
            option: Plugin_Expire_Option.LT
          }
        }
      })
    );

    const resp3 = await plugin.execute(newProps);
    expect(resp3.output).toEqual(0);
    await assertDbStateHasNotChanged();
  });

  test('executing a structured TTL command works', async () => {
    // no expiry set
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          ttl: {
            key: 'name'
          }
        }
      })
    );

    const resp1 = await plugin.execute(newProps);
    expect(resp1.output).toEqual(-1);
    await assertDbStateHasNotChanged();
    // expiry set
    await test_client.expire('name', 10000);
    const resp2 = await plugin.execute(newProps);
    // let's just approximate
    expect(resp2.output).toBeGreaterThan(9990);
    expect(resp2.output).toBeLessThanOrEqual(10000);
    await assertDbStateHasNotChanged();
  });
});

describe('Redis Misc. Checks', () => {
  test('changing the database number works', async () => {
    // set a key with db 1
    let props1 = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          set: {
            key: 'newDb',
            value: 'foo'
          }
        }
      })
    );
    props1.datasourceConfiguration = {
      name: 'Redis Plugin Tests',
      connection: Plugin_Connection.fromJson({
        fields: {
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: REDIS_PASSWORD,
          databaseNumber: 1
        }
      })
    } as RedisDatasourceConfiguration;

    const resp1Set = await plugin.execute(props1);
    expect(resp1Set.output).toEqual('OK');
    // can get with db 1
    props1 = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          get: {
            key: 'newDb'
          }
        }
      })
    );

    props1.datasourceConfiguration = {
      name: 'Redis Plugin Tests',
      connection: Plugin_Connection.fromJson({
        fields: {
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: REDIS_PASSWORD,
          databaseNumber: 1
        }
      })
    } as RedisDatasourceConfiguration;

    const resp1Get = await plugin.execute(props1);
    expect(resp1Get.output).toEqual('foo');
    // cannot get with db 2
    const props2 = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        structured: {
          get: {
            key: 'newDb'
          }
        }
      })
    );
    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    props2.datasourceConfiguration = {
      name: 'Redis Plugin Tests',
      connection: Plugin_Connection.fromJson({
        fields: {
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: REDIS_PASSWORD,
          databaseNumber: 2
        }
      })
    } as RedisDatasourceConfiguration;

    const resp2 = await plugin.execute(props2);
    expect(resp2.output).toBeNull();
  });
  test('giving an invalid command errors [RAW]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'GET'
          }
        }
      })
    );

    await plugin
      .execute(newProps)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch(`Invalid command. Received 'GET'`);
        expect(err.code).toEqual(ErrorCode.INTEGRATION_SYNTAX);
      });
  });

  test('giving an invalid raw command errors', async () => {
    const newProps = buildPropsWithActionConfiguration(
      RedisPluginV1.fromJson({
        raw: {
          singleton: {
            query: 'foo bar baz'
          }
        }
      })
    );

    await plugin
      .execute(newProps)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch(`ERR unknown command 'foo', with args beginning with: 'bar' 'baz'`);
        expect(err.code).toEqual(ErrorCode.INTEGRATION_SYNTAX);
      });
  });
});
