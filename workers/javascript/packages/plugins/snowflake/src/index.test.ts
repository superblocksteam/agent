import {
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ErrorCode,
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

  describe('error handling', () => {
    it('maps Snowflake SDK timeout "Network error" with ETIMEDOUT cause to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      // The SDK wraps timeout errors as "Network error. Could not reach Snowflake."
      // but preserves the underlying ETIMEDOUT in the cause chain.
      const timeoutError = new Error(
        'Network error. Could not reach Snowflake. Check that the account URL is correct and verify your network policy: https://myaccount.snowflakecomputing.com:443'
      );
      (timeoutError as any).cause = { message: 'connect ETIMEDOUT', code: 'ETIMEDOUT' };
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps explicit ETIMEDOUT errors to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const timeoutError = new Error('connect ETIMEDOUT 10.0.0.1:443');
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps errors with timeout cause to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const cause = new Error('ETIMEDOUT');
      const timeoutError = new Error('Network error. Could not reach Snowflake.');
      (timeoutError as any).cause = cause;
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps errors with ETIMEDOUT code (not in message) to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const timeoutError = new Error('connect failed');
      (timeoutError as any).code = 'ETIMEDOUT';
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps errors with deeply nested timeout cause to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const innerCause = new Error('socket hang up');
      (innerCause as any).code = 'ETIMEDOUT';
      const middleCause = new Error('request failed');
      (middleCause as any).cause = innerCause;
      const timeoutError = new Error('Network error. Could not reach Snowflake.');
      (timeoutError as any).cause = middleCause;
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps cause with code ETIMEDOUT and non-timeout message to INTEGRATION_QUERY_TIMEOUT', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const cause = { message: 'connect failed', code: 'ETIMEDOUT' };
      const timeoutError = new Error('Network error. Could not reach Snowflake.');
      (timeoutError as any).cause = cause;
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(timeoutError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_QUERY_TIMEOUT
      });
    });

    it('maps SDK "Network error" without timeout cause to INTEGRATION_NETWORK (not timeout)', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      // Same SDK message but without a timeout indicator in the cause chain —
      // this is a genuine network error (e.g. firewall block) and must NOT be
      // misclassified as a timeout.
      const networkError = new Error(
        'Network error. Could not reach Snowflake. Check that the account URL is correct and verify your network policy: https://myaccount.snowflakecomputing.com:443'
      );
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(networkError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_NETWORK
      });
    });

    it('does not false-positive on cross-boundary "timeout" matches from joined strings', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      // "Network error...invalid datetime" + cause "output format error" would
      // falsely match `timed?\s*out` if we joined all texts into one string.
      // This should map to INTEGRATION_NETWORK (not timeout).
      const error = new Error('Network error. invalid datetime');
      (error as any).cause = { message: 'output format error' };
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(error);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_NETWORK
      });
    });

    it('still maps genuine network errors to INTEGRATION_NETWORK', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const networkError = new Error('Network error. DNS resolution failed.');
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(networkError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_NETWORK
      });
    });

    it('maps syntax errors to INTEGRATION_SYNTAX', async () => {
      jest.spyOn(Snowflake.prototype, 'connectAsync').mockResolvedValue();

      const syntaxError = new Error('SQL compilation error: syntax error');
      jest.spyOn(Snowflake.prototype, 'execute').mockRejectedValue(syntaxError);

      const client = new Snowflake({
        account: 'myaccount',
        username: 'user',
        password: 'pass'
      });

      await expect(
        plugin.executePooled(
          { ...props, mutableOutput: new ExecutionOutput() },
          client
        )
      ).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_SYNTAX
      });
    });
  });
});
