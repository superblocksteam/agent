import { RelayDelegate } from '@superblocks/shared';
import { DUMMY_EXECUTION_CONTEXT, PluginExecutionProps } from '@superblocks/shared';
import { ExecutionOutput, SnowflakeDatasourceConfiguration, SnowflakeActionConfiguration } from '@superblocks/shared';
import { Snowflake } from './Snowflake';
import { connectionOptionsFromDatasourceConfiguration } from './util';
import SnowflakePlugin from '.';

// THESE TESTS SHOULD ONLY EVER BE RUN LOCALLY, NOT IN CI

// okta
const OKTA_USERNAME = '';
const OKTA_PASSWORD = '';
const OKTA_ACCOUNT = '';
const OKTA_AUTHENTICATOR_URL = '';
const OKTA_SHOW_TABLES_RESPONSE = [];
// fields
const USERNAME = '';
const PASSWORD = '';
const DB_ACCOUNT = '';
const DB_NAME = '';
const SHOW_TABLES_RESPONSE = [];

const plugin: SnowflakePlugin = new SnowflakePlugin();
// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  authentication: {
    username: USERNAME,
    password: PASSWORD,
    custom: {
      databaseName: { value: DB_NAME },
      account: { value: DB_ACCOUNT }
    }
  },
  name: 'Snowflake Plugin Tests'
} as SnowflakeDatasourceConfiguration;

const actionConfiguration = {
  body: 'SHOW TABLES LIMIT 1;'
} as SnowflakeActionConfiguration;

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

const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<SnowflakeDatasourceConfiguration, SnowflakeActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

describe('test connection', () => {
  test('succeeds fields', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('succeeds okta', async () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {
        username: OKTA_USERNAME,
        password: OKTA_PASSWORD,
        custom: {
          account: { value: OKTA_ACCOUNT }
        }
      },
      okta: {
        authenticatorUrl: OKTA_AUTHENTICATOR_URL
      }
    } as SnowflakeDatasourceConfiguration;
    await plugin.test(datasourceConfiguration);
  });
});

describe('queries', () => {
  test('basic query with fields', async () => {
    const client = new Snowflake({
      account: DB_ACCOUNT,
      username: USERNAME,
      password: PASSWORD,
      database: DB_NAME,
      schema: '',
      warehouse: '',
      role: ''
    });
    await client.connect();
    const resp = await plugin.executePooled(
      {
        ...props
      },
      client
    );
    expect(resp.output).toEqual(SHOW_TABLES_RESPONSE);
  });

  test('basic query with okta', async () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {
        username: OKTA_USERNAME,
        password: OKTA_PASSWORD,
        custom: {
          account: { value: OKTA_ACCOUNT }
        }
      },
      okta: {
        authenticatorUrl: OKTA_AUTHENTICATOR_URL
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);
    const client = new Snowflake(connectionOptions);
    await client.connectAsync();
    const resp = await plugin.executePooled(
      {
        ...props
      },
      client
    );
    expect(resp.output).toEqual(OKTA_SHOW_TABLES_RESPONSE);
  });
});
