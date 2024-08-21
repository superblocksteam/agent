import path from 'path';
import {
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  ErrorCode,
  ExecutionOutput,
  MongoDBActionConfiguration,
  MongoDBDatasourceConfiguration,
  MongoDBOperationType,
  PluginCommon,
  PluginExecutionProps,
  TableType
} from '@superblocks/shared';

import { PluginCommonV1 } from '@superblocksteam/types/src/plugins';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import { MongoClient } from 'mongodb';
import { Client as ssh2Client } from 'ssh2';
import MongoDBPlugin from '.';

jest.setTimeout(20000);

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd() + '/../baseplugin/', '.env') });
const BASTION_LOCAL_DEV = process.env.BASTION_LOCAL_DEV; // safeguard to prevent running these tests in CI
const BASTION_HOST = process.env.BASTION_HOST;
const BASTION_PORT = parseInt(process.env.BASTION_PORT ?? '22', 10);
const BASTION_USERNAME = process.env.BASTION_USERNAME;
const USER_DEFINED_PRIVATE_KEY = process.env.USER_DEFINED_PRIVATE_KEY_ED25519;

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.MONGO_LOCAL_DEV; // safeguard to prevent running these tests in CI
const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING ?? '';
const MONGO_DATABASE = process.env.MONGO_DATABASE;

const runTests = LOCAL_DEV ? describe : describe.skip;

const tunnelInputs: boolean[] = [];
if (BASTION_LOCAL_DEV) {
  tunnelInputs.push(true);
}

const plugin: MongoDBPlugin = new MongoDBPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = {
  authentication: {
    custom: {
      databaseName: {
        value: MONGO_DATABASE
      }
    }
  },
  endpoint: {
    host: MONGO_CONNECTION_STRING
  },
  tunnel: PluginCommonV1.SSHConfiguration.fromJson({
    authenticationMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY,
    enabled: false,
    host: BASTION_HOST ?? '',
    port: BASTION_PORT,
    username: BASTION_USERNAME ?? '',
    privateKey: USER_DEFINED_PRIVATE_KEY ?? ''
  })
} as MongoDBDatasourceConfiguration;

const actionConfiguration = {
  operation: MongoDBOperationType.findOne
} as MongoDBActionConfiguration;
const props: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration: {
    action: 'getItem'
  },
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

async function setupConnection(
  datasourceConfig: MongoDBDatasourceConfiguration,
  useTunnel: boolean
): Promise<{ client: MongoClient; tunnel: ssh2Client }> {
  if (useTunnel && datasourceConfig.tunnel) {
    datasourceConfig.tunnel.enabled = useTunnel;
  }
  const finalEndpoint = {
    host: datasourceConfig.endpoint?.host,
    port: 27017
  };
  const options = {};
  const client = {
    client: new MongoClient(MONGO_CONNECTION_STRING, options),
    tunnel: null
  };
  if (useTunnel && datasourceConfig.endpoint) {
    const clonedDatasourceConfig = cloneDeep(datasourceConfig);
    if (clonedDatasourceConfig.endpoint) {
      clonedDatasourceConfig.endpoint.host = plugin.extractUrlFromConnectionString(datasourceConfig.endpoint?.host ?? '');
      clonedDatasourceConfig.endpoint.port = plugin.extractPortFromConnectionString(datasourceConfig.endpoint?.host ?? '');
    }
    const tunneledAddress = await plugin.createTunnel(clonedDatasourceConfig);
    finalEndpoint.host = plugin.injectUrlAndPortIntoConnectionString(
      datasourceConfig.endpoint?.host ?? '',
      tunneledAddress?.host as string,
      tunneledAddress?.port as number
    );
    client.tunnel = tunneledAddress?.client;
    client.client = new MongoClient(finalEndpoint.host as string, options);
  }

  await client.client.connect();
  return client;
}

runTests('MongoDB Test Suite', () => {
  describe.each(tunnelInputs)('MongoDB Plugin', (useTunnel) => {
    beforeEach(async () => {
      props.mutableOutput = new ExecutionOutput();
    });

    afterEach(async () => {
      jest.restoreAllMocks();
    });

    it('test connection success', async () => {
      await plugin.test(datasourceConfiguration);
    });

    it('test connection with invalid connection string', async () => {
      const clonedDatasourceConfiguration = cloneDeep(datasourceConfiguration);
      if (clonedDatasourceConfiguration && clonedDatasourceConfiguration.endpoint) {
        clonedDatasourceConfiguration.endpoint.host = 'invalid connection string';
      }
      await plugin
        .test(clonedDatasourceConfiguration)
        .then((_) => {
          fail();
        })
        .catch((err) => {
          expect(err.message).toMatch('Invalid scheme, expected connection string to start with');
          expect(err.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
        });
    });

    it('get metadata', async () => {
      jest.setTimeout(60000);
      const DUMMY_EXPECTED_METADATA = {
        tables: [{ type: TableType.TABLE, name: 'people', columns: [] }]
      };
      const res = await plugin.metadata(datasourceConfiguration);
      const filteredMetadata = {
        tables: res.dbSchema?.tables
      };
      expect(filteredMetadata).toEqual(DUMMY_EXPECTED_METADATA);
    });

    it('execute valid findOne query', async () => {
      const client = await setupConnection(datasourceConfiguration, useTunnel);
      const localActionConfiguration = cloneDeep(actionConfiguration);
      localActionConfiguration.action = MongoDBOperationType.findOne;
      localActionConfiguration.resource = 'people';
      localActionConfiguration.query = "{ email: { $eq: 'jane@abc.com' }}";
      const localProps: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration> = {
        context,
        datasourceConfiguration,
        actionConfiguration: localActionConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };
      const executionOutput = await plugin.executePooled(localProps, client);

      // the _id is returned in an ObjectId so run it through JSON stringify/parse to clean it
      expect(JSON.parse(JSON.stringify(executionOutput.output))).toEqual({
        _id: '65e7eaef8ae71d6a0495b6c4',
        age: 26,
        email: 'jane@abc.com',
        hobbies: ['databases', 'painting', 'soccer'],
        name: 'Jane Doe'
      });
    });

    it('execute invalid findOne query', async () => {
      const client = {
        client: new MongoClient(MONGO_CONNECTION_STRING, {}),
        tunnel: null
      };

      const localActionConfiguration = cloneDeep(actionConfiguration);
      localActionConfiguration.action = MongoDBOperationType.findOne;
      localActionConfiguration.resource = 'people';
      localActionConfiguration.query = "{ email: { $eqbadparam: 'jane@abc.com' }}";
      const localProps: PluginExecutionProps<MongoDBDatasourceConfiguration, MongoDBActionConfiguration> = {
        context,
        datasourceConfiguration,
        actionConfiguration: localActionConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };
      await plugin.executePooled(localProps, client).catch((err) => {
        expect(err.message).toMatch('Operation failed: unknown operator: $eqbadparam');
        expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
      });
    });
  });
});
