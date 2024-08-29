import {
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate,
  KinesisDatasourceConfiguration,
  KinesisActionConfiguration
} from '@superblocks/shared';
import KinesisPlugin from '.';

import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';

// THESE TESTS SHOULD ONLY EVER BE RUN LOCALLY, NOT IN CI

const ACCESS_KEY_ID = '';
const SECRET_KEY = '';
const REGION = '';
const ENDPOINT = '';

const plugin: KinesisPlugin = new KinesisPlugin();

export const datasourceConfiguration = {
  connection: {
    awsConfig: {
      auth: { accessKeyId: ACCESS_KEY_ID, secretKey: SECRET_KEY },
      region: REGION,
      endpoint: ENDPOINT
    }
  }
} as KinesisDatasourceConfiguration;

const actionConfiguration = {} as KinesisActionConfiguration;

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
const props: PluginExecutionProps<KinesisDatasourceConfiguration, KinesisActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

describe('test connection', () => {
  test('succeeds', async () => {
    await plugin.test(datasourceConfiguration);
  });
});

describe('produce', () => {
  test.only('happy path', async () => {
    props.actionConfiguration = new Plugin.Plugin({
      operation: {
        case: 'put',
        value: { partitionKey: 'pk', data: `[{"foo": "bar"}]`, streamArn: 'arn' }
      }
    });
    await plugin.execute(props);
  });
});

// describe('queries', () => {
//   test('basic query', async () => {
//     const client = new Snowflake({
//       account: DB_ACCOUNT,
//       username: USERNAME,
//       password: PASSWORD,
//       database: DB_NAME,
//       schema: '',
//       warehouse: '',
//       role: ''
//     });
//     await client.connect();
//     const resp = await plugin.executePooled(
//       {
//         ...props
//       },
//       client
//     );
//     expect(resp.output).toEqual(SHOW_TABLES_RESPONSE);
//   });
// });
