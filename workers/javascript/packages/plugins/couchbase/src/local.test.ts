import {
  ClientWrapper,
  CouchbaseActionConfiguration,
  CouchbaseDatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate
} from '@superblocks/shared';
import { CouchbasePluginV1, PluginCommonV1 } from '@superblocksteam/types';
import { Cluster, connect } from 'couchbase';
import { Client as ssh2Client } from 'ssh2';
import { cloneDeep } from 'lodash';
import CouchbasePlugin from '.';
import { SQLExecution } from '@superblocksteam/types/dist/src/plugins/common/v1/plugin_pb';

jest.setTimeout(20000);

const COUCHBASE_URL = '';
const COUCHBASE_USER = '';
const COUCHBASE_PASSWORD = '';

let plugin: CouchbasePlugin = new CouchbasePlugin();

const datasourceConfiguration = {
  connection: CouchbasePluginV1.Plugin_CouchbaseConnection.fromJson({
    user: COUCHBASE_USER,
    password: COUCHBASE_PASSWORD,
    url: COUCHBASE_URL
  }),
  superblocksMetadata: {
    pluginVersion: '0.0.1'
  },
  name: 'Couchbase Local Tests'
} as CouchbaseDatasourceConfiguration;

const actionConfiguration = {
  couchbaseAction: {
    value: PluginCommonV1.SQLExecution.fromJson({
      sqlBody: ''
    }) as PluginCommonV1.SQLExecution,
    case: 'runSql'
  },
  superblocksMetadata: {
    pluginVersion: '0.0.1'
  }
} as CouchbaseActionConfiguration;

const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
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

const sqlActionConfiguration = cloneDeep(actionConfiguration);
const sqlProps: PluginExecutionProps<CouchbaseDatasourceConfiguration, CouchbaseActionConfiguration> = {
  context: DUMMY_EXECUTION_CONTEXT,
  datasourceConfiguration,
  actionConfiguration: sqlActionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

let clientWrapper: ClientWrapper<Cluster, ssh2Client>;
describe('test', () => {
  test('happy path', async () => {
    await plugin.test(datasourceConfiguration);
  });
});

describe('execute', () => {
  test('happy path', async () => {
    const client = await connect(COUCHBASE_URL, {
      username: COUCHBASE_USER,
      password: COUCHBASE_PASSWORD
    });
    (sqlProps.actionConfiguration.couchbaseAction?.value as SQLExecution).sqlBody =
      'select * FROM `travel-sample`.inventory.airline as t1 limit 10;';
    await plugin.executePooled(sqlProps, { client });

    const output = sqlProps.mutableOutput.output as { [key: string]: Record<string, unknown> };
    await client.close();
    expect(output.length).toEqual(10);
  });
});

describe.only('metadata', () => {
  test('happy path', async () => {
    const response = await plugin.metadata(datasourceConfiguration);
    console.log('RESPONSE', JSON.stringify(response, null, 2));
  });
});
