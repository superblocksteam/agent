import {
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ExecutionOutput,
  SnowflakeDatasourceConfiguration
} from '@superblocks/shared';

jest.mock('@superblocks/shared', () => {
  const originalModule = jest.requireActual('@superblocks/shared');
  return {
    __esModule: true,
    ...originalModule,
    CreateConnection: jest.fn((target, name, descriptor) => {
      return descriptor;
    }),
    DestroyConnection: jest.fn((target, name, descriptor) => {
      return descriptor;
    })
  };
});

import { Snowflake } from './Snowflake';
jest.mock('./Snowflake', () => {
  const mockStatement = {
    execute: jest.fn(),
    getRows: jest.fn().mockResolvedValue([]) // Adjust based on expected result
  };

  class MockSnowflake {
    constructor(connectionOptions, loggingOptions, configureOptions) {}
    connectAsync() {
      // Simulate successful async connection
      return Promise.resolve();
    }
    destroy() {
      // Simulate successful destruction
      return Promise.resolve();
    }
    createStatement(options) {
      // Return the mock statement
      return mockStatement;
    }
    execute(sqlText, binds) {
      // Simulate execute behavior. Adjust as necessary.
      mockStatement.execute();
      return mockStatement.getRows();
    }
    // Mimic other methods and properties as needed
  }

  return { Snowflake: MockSnowflake };
});

import SnowflakePlugin from '.';

const plugin: SnowflakePlugin = new SnowflakePlugin();
// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const DUMMY_SNOWFLAKE_TABLE_RESULT = [
  {
    COLUMN_NAME: 'id',
    DATA_TYPE: 'int4',
    TABLE_NAME: 'orders',
    TABLE_TYPE: 'BASE TABLE'
  },
  {
    COLUMN_NAME: 'user_id',
    DATA_TYPE: 'int8',
    TABLE_NAME: 'orders',
    TABLE_TYPE: 'BASE TABLE'
  }
];

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = DUMMY_DB_DATASOURCE_CONFIGURATION as SnowflakeDatasourceConfiguration;
const actionConfiguration = DUMMY_ACTION_CONFIGURATION;
const props = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Snowflake Plugin', () => {
  it('test connection', async () => {
    jest.spyOn(Snowflake.prototype, 'connectAsync').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100));
    });
    jest.spyOn(Snowflake.prototype, 'execute').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100));
    });

    await plugin.test(datasourceConfiguration);

    expect(Snowflake.prototype.connectAsync).toBeCalledTimes(1);
    expect(Snowflake.prototype.execute).toBeCalledTimes(1);
  });

  it('get metadata', async () => {
    jest.spyOn(Snowflake.prototype, 'connectAsync').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100));
    });

    jest.spyOn(Snowflake.prototype, 'execute').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100)).then(() => DUMMY_SNOWFLAKE_TABLE_RESULT);
    });

    const res = await plugin.metadata(datasourceConfiguration);

    expect(res.dbSchema?.tables[0]).toEqual({
      name: 'orders',
      type: 'TABLE',
      columns: [
        { name: 'id', type: 'int4' },
        { name: 'user_id', type: 'int8' }
      ],
      // TODO: Missing keys
      keys: [],
      templates: []
    });
  });

  it('execute query', async () => {
    jest.spyOn(Snowflake.prototype, 'connectAsync').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100));
    });

    jest.spyOn(Snowflake.prototype, 'execute').mockImplementation(() => {
      return new Promise((_) => setTimeout(_, 100)).then(() => DUMMY_QUERY_RESULT);
    });

    const auth = datasourceConfiguration.authentication || {};
    const client = new Snowflake({
      account: auth.custom?.account?.value ?? '',
      username: auth.username ?? '',
      password: auth.password ?? '',
      database: auth.custom?.databaseName?.value ?? '',
      schema: auth.custom?.schema?.value ?? '',
      warehouse: auth.custom?.warehouse?.value ?? '',
      role: auth.custom?.role?.value ?? ''
    });

    const res = await plugin.executePooled(
      {
        ...props,
        mutableOutput: new ExecutionOutput()
      },
      client
    );

    expect(res.output).toEqual(DUMMY_QUERY_RESULT);
    expect(client.execute).toBeCalledTimes(1);
  });
});
