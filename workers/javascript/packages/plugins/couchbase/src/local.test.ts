import {
  ClientWrapper,
  CouchbaseActionConfiguration,
  CouchbaseDatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginCommon,
  PluginExecutionProps,
  RelayDelegate
} from '@superblocks/shared';
import { CouchbasePluginV1, PluginCommonV1 } from '@superblocksteam/types';
import { Cluster, connect } from 'couchbase';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import path from 'path';
import { Client as ssh2Client } from 'ssh2';
import CouchbasePlugin from '.';

jest.setTimeout(20000);

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd() + '/../baseplugin/', '.env') });
// const BASTION_LOCAL_DEV = process.env.BASTION_LOCAL_DEV; // safeguard to prevent running these tests in CI
const BASTION_PRIVATE_KEY_RSA = process.env.BASTION_PRIVATE_KEY_RSA;

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const COUCHBASE_LOCAL_DEV = process.env.COUCHBASE_LOCAL_DEV;
const COUCHBASE_HOST = process.env.COUCHBASE_HOST ?? '';
const COUCHBASE_PORT = parseInt(process.env.COUCHBASE_PORT ?? '443', 10);
const COUCHBASE_USE_TLS = process.env.COUCHBASE_USE_TLS === 'true' ? true : false;
const COUCHBASE_USER = process.env.COUCHBASE_USER ?? '';
const COUCHBASE_PASSWORD = process.env.COUCHBASE_PASSWORD ?? '';
const COUCHBASE_BUCKET = process.env.COUCHBASE_BUCKET ?? '';
let couchbaseHostStr = `couchbase${COUCHBASE_USE_TLS ? 's' : ''}://${COUCHBASE_HOST}:${COUCHBASE_PORT}`;

const runTests = COUCHBASE_LOCAL_DEV ? describe : describe.skip;

let clientWrapper: ClientWrapper<Cluster, ssh2Client>;

// helper functions
// async function resetDatabase(useTunnel: boolean) {
//   if (useTunnel && datasourceConfiguration.tunnel) {
//     datasourceConfiguration.tunnel.enabled = useTunnel;
//   }
//   let tunneledAddress;
//   if (useTunnel && datasourceConfiguration.endpoint) {
//     datasourceConfiguration.endpoint.host = COUCHBASE_BASTION_DESTINATION_HOST;
//     datasourceConfiguration.endpoint.port = COUCHBASE_BASTION_DESTINATION_PORT;
//     tunneledAddress = await plugin.createTunnel(datasourceConfiguration);
//   }

//   // Connect to the cluster without specifying a collection/scope
//   const cluster = await connect(tunneledAddress ? tunneledAddress.host : COUCHBASE_HOST, {
//     username: COUCHBASE_USER,
//     password: COUCHBASE_PASSWORD
//   });

//   await cluster.query(`DROP TABLE;`);
//   await cluster.close();
// }

// async function runQuery(query: string, params: (string | number | null)[] = []) {
//   const rows: Record<string, unknown>[] = [];

//   const res = await clientWrapper.client.query(query, params);
//   if (!res.insertId) {
//     res.forEach((row) => {
//       rows.push(row);
//     });
//   }
//   return rows;
// }

const plugin: CouchbasePlugin = new CouchbasePlugin({ PRIVATE_KEY_RSA: BASTION_PRIVATE_KEY_RSA });

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const datasourceConfiguration = {
  connection: CouchbasePluginV1.Plugin_CouchbaseConnection.fromJson({
    user: COUCHBASE_USER,
    password: COUCHBASE_PASSWORD,
    bucket: COUCHBASE_BUCKET,
    useTls: true
  }),
  endpoint: CouchbasePluginV1.Plugin_CouchbaseEndpoint.fromJson({
    host: COUCHBASE_HOST,
    port: COUCHBASE_PORT
  }),
  tunnel: PluginCommonV1.SSHConfiguration.fromJson({
    authenticationMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA,
    enabled: false,
    host: '18.237.161.89', // ssh host
    port: 22, // ssh port
    username: 'ec2-user', // ssh username
    privateKey: ''
  }),
  superblocksMetadata: {
    pluginVersion: '0.0.1'
  },
  name: '[Demo] Unit Test'
} as CouchbaseDatasourceConfiguration;

const actionConfiguration = {
  couchbaseAction: {
    value: PluginCommonV1.SQLExecution.fromJson({
      sqlBody: ''
    }) as PluginCommonV1.SQLExecution,
    case: 'runSql'
  },
  superblocksMetadata: {
    pluginVersion: '0.0.1' // update as version changes
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

const context = DUMMY_EXECUTION_CONTEXT;

const sqlActionConfiguration = cloneDeep(actionConfiguration);
const sqlProps: PluginExecutionProps<CouchbaseDatasourceConfiguration, CouchbaseActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration: sqlActionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

const tunnelInputs = [false];
// if (BASTION_LOCAL_DEV) {
//   tunnelInputs.push(true);
// }

runTests.each(tunnelInputs)('Couchbase Test', (useTunnel) => {
  beforeAll(async () => {
    let tunneledAddress;
    let tunnel = null;
    if (useTunnel && datasourceConfiguration.endpoint && datasourceConfiguration.tunnel) {
      datasourceConfiguration.tunnel.enabled = useTunnel;
      // datasourceConfiguration.endpoint.host = COUCHBASE_BASTION_DESTINATION_HOST;
      // datasourceConfiguration.endpoint.port = COUCHBASE_BASTION_DESTINATION_PORT;
      tunneledAddress = await plugin.createTunnel(datasourceConfiguration);
      tunnel = tunneledAddress.client;
      couchbaseHostStr = `couchbase${COUCHBASE_USE_TLS ? 's' : ''}://${tunneledAddress.host}:${tunneledAddress.port}`;
    }

    clientWrapper = {
      client: await connect(couchbaseHostStr, {
        username: COUCHBASE_USER,
        password: COUCHBASE_PASSWORD
      }),
      tunnel
    };
  });

  afterAll(async () => {
    try {
      await clientWrapper.client?.close();
    } catch (e) {
      // do nothing
    }
  });

  // beforeEach(async () => {
  //   await resetDatabase(useTunnel);
  // });

  // BASE CASES

  test('test connection', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('get metadata', async () => {
    // NOTE: (JOEY) this could probably be more explicit. for maintainablity, we can keep it like this for now to make writing tests easier
    const resp = await plugin.metadata(datasourceConfiguration);

    // TABLES
    // names
    expect(resp.dbSchema?.tables?.filter((table) => table.name === '_default')?.map((table) => table.name)).toEqual(['_default']);
    // table schemas
    expect(resp.dbSchema?.tables?.filter((table) => table.name === '_default')?.map((table) => table.schema)).toEqual(['_default']);
    // types
    expect(resp.dbSchema?.tables?.filter((table) => table.name === '_default')?.map((table) => table.type)).toEqual(['COLLECTION']);
    // column names
    expect(
      resp.dbSchema?.tables?.filter((table) => table.name === '_default')?.map((table) => table.columns.map((column) => column.name))
    ).toEqual([[]]);

    // SCHEMAS
    // names
    expect(resp.dbSchema?.schemas?.filter((schema) => schema.name === '_default')?.map((schema) => schema.name)).toEqual(['_default']);
  });

  test('execute sql with no context', async () => {
    const newProps = cloneDeep(sqlProps);
    if (newProps.actionConfiguration.couchbaseAction && newProps.actionConfiguration.couchbaseAction.value) {
      (newProps.actionConfiguration.couchbaseAction.value as PluginCommon.SQLExecution).sqlBody =
        'select * from `travel-sample`.inventory.airline order by id asc limit 1;';
    }
    await plugin.executePooled(newProps, clientWrapper);
    expect(newProps.mutableOutput.output).toEqual([
      {
        airline: {
          id: 10,
          type: 'airline',
          name: '40-Mile Air',
          iata: 'Q5',
          icao: 'MLA',
          callsign: 'MILE-AIR',
          country: 'United States'
        }
      }
    ]);
  });

  test('execute invalid sql with no context', async () => {
    const newProps = cloneDeep(sqlProps);
    if (newProps.actionConfiguration.couchbaseAction && newProps.actionConfiguration.couchbaseAction.value) {
      (newProps.actionConfiguration.couchbaseAction.value as PluginCommon.SQLExecution).sqlBody =
        'select * from `travel-sample`.inventory.airline limit notanumber;';
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(plugin.executePooled(newProps, clientWrapper)).rejects.toThrowError();
  });

  test('uses connection configuration correctly', async () => {
    const datasourceConfiguration = {
      connection: CouchbasePluginV1.Plugin_CouchbaseConnection.fromJson({
        user: COUCHBASE_USER,
        password: COUCHBASE_PASSWORD,
        bucket: COUCHBASE_BUCKET,
        useTls: true
      }),
      endpoint: CouchbasePluginV1.Plugin_CouchbaseEndpoint.fromJson({
        host: 'somehost',
        port: '123'
      }),
      tunnel: PluginCommonV1.SSHConfiguration.fromJson({
        authenticationMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA,
        enabled: false,
        host: '18.237.161.89', // ssh host
        port: 22, // ssh port
        username: 'ec2-user', // ssh username
        privateKey: ''
      }),
      superblocksMetadata: {
        pluginVersion: '0.0.1'
      },
      name: '[Demo] Unit Test'
    } as CouchbaseDatasourceConfiguration;

    const result1 = plugin.getConnectionStringFromDatasourceConfiguration(datasourceConfiguration, {
      host: 'localhost',
      port: 8091
    });
    expect(result1).toEqual('couchbase://somehost:22');

    const datasourceConfigurationWithUrl = {
      connection: CouchbasePluginV1.Plugin_CouchbaseConnection.fromJson({
        user: COUCHBASE_USER,
        password: COUCHBASE_PASSWORD,
        bucket: COUCHBASE_BUCKET,
        useTls: true,
        url: 'couchbase://foobar:8091,foobar2:8091'
      }),
      endpoint: CouchbasePluginV1.Plugin_CouchbaseEndpoint.fromJson({
        host: 'somehost',
        port: '123'
      }),
      tunnel: PluginCommonV1.SSHConfiguration.fromJson({
        authenticationMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA,
        enabled: false,
        host: '18.237.161.89', // ssh host
        port: 22, // ssh port
        username: 'ec2-user', // ssh username
        privateKey: ''
      }),
      superblocksMetadata: {
        pluginVersion: '0.0.1'
      },
      name: '[Demo] Unit Test'
    } as CouchbaseDatasourceConfiguration;

    const result2 = plugin.getConnectionStringFromDatasourceConfiguration(datasourceConfigurationWithUrl, {
      host: 'localhost',
      port: 8091
    });
    expect(result2).toEqual('couchbase://foobar:8091,foobar2:8091');
  });
});
/*
  test('execute sql with context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'select * from public.mytable limit ?;';
    newProps.context.preparedStatementContext = [1];
    await plugin.executePooled(newProps, clientWrapper);
    const output = newProps.mutableOutput.output as { [key: string]: Record<string, unknown> };
    expect(output['0']).toEqual({ id: 1, name: 'Frank Basil', age: 29 });
  });

  test('bindings resolve correctly when using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.body = `SELECT * FROM public.myTable LIMIT {{binding1}};`;
    newProps.actionConfiguration.usePreparedSql = true;

    prepContextForBindings(newProps.context, { binding1: '1' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration as ActionConfiguration,
      files: null,
      property: 'body',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual('SELECT * FROM public.myTable LIMIT ?;');
    expect(resp.placeholdersInfo?.['?']?.value).toEqual('"1"');
  });

  test('bindings dont resolve when not using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.body = `SELECT * FROM public.myTable LIMIT {{binding1}};`;
    newProps.actionConfiguration.usePreparedSql = false;

    prepContextForBindings(newProps.context, { binding1: '1' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration as ActionConfiguration,
      files: null,
      property: 'body',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual('SELECT * FROM public.myTable LIMIT 1;');
  });

  // INSERT

  test('insert a single row [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name', age: 30 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'test name', age: 30, ALLUPPER: true }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 },
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: 1 },
      { MixedPk: 3, MixedName: 'test name', age: 30, ALLUPPER: 1 }
    ]);
  });

  test('insert a single row with null in a non-nullable column [AUTO MAPPING] [AUTO MATCHING] [SYNTAX SPECIFIC BEHAVIOR]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: null, name: 'test name', age: 30 }]; // id is not nullable
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert 3 rows with different columns given [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test 1' }, { age: 2 }, { name: 'test 3', age: 3 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test 1', age: null },
      { id: 5, name: null, age: 2 },
      { id: 6, name: 'test 3', age: 3 }
    ]);
  });

  test('insert 3 rows with different columns given [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'test 1' }, { m_age: 2 }, { m_name: 'test 3', m_age: 3 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test 1', age: null },
      { id: 5, name: null, age: 2 },
      { id: 6, name: 'test 3', age: 3 }
    ]);
  });

  test('insert 3 rows with different columns given [AUTO MAPPING] [ADVANCED MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test 1' }, { age: 2 }, { name: 'test 3', age: 3 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    newProps.actionConfiguration.useAdvancedMatching = 'advanced' as const;
    newProps.actionConfiguration.oldValues = [];
    newProps.actionConfiguration.filterBy = ['id'];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test 1', age: null },
      { id: 5, name: null, age: 2 },
      { id: 6, name: 'test 3', age: 3 }
    ]);
  });

  test('insert a single row [AUTO MAPPING] [ADVANCED MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name', age: 30 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    newProps.actionConfiguration.useAdvancedMatching = 'advanced' as const;
    newProps.actionConfiguration.oldValues = [];
    newProps.actionConfiguration.filterBy = ['id'];

    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert a single row without a nullable column [AUTO MAPPING] [ADVANCED MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name' }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    newProps.actionConfiguration.useAdvancedMatching = 'advanced' as const;
    newProps.actionConfiguration.oldValues = [];
    newProps.actionConfiguration.filterBy = ['id'];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: null }
    ]);
  });

  test('insert a single row [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_id: 4, m_name: 'test name', m_age: 30 }];
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert a single row without a nullable column [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'test name', m_age: 30 }];
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert a single row with extra columns [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'test name', m_age: 30, extra: 1 }];
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  test('insert a single row without all mapped columns [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'test name' }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable WHERE id = ?', [4]);
    expect(rows).toEqual([{ id: 4, name: 'test name', age: null }]);
  });

  test('insert a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: null, age: 10 }
    ]);
  });

  test('insert a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: null, age: 10 }
    ]);
  });

  test('insert a single row into a table with no PK [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'foo', age: 10 }];
    newProps.actionConfiguration.table = 'mytable_nopk';

    await expect(async () => {
      await plugin.executePooled(newProps, clientWrapper);
    }).rejects.toThrow('Table public.mytable_nopk has no primary keys');

    const rows = await runQuery('SELECT * FROM public.mytable_nopk');
    expect(rows).toEqual([
      { name: 'Frank Basil', age: 29 },
      { name: 'Joey Antonio', age: 26 },
      { name: 'Domi James', age: 19 }
    ]);
  });

  test('insert a single row without giving schema [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name', age: 30 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    newProps.actionConfiguration.schema = undefined;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: 30 }
    ]);
  });

  // UPDATE

  test('update a single row [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ id: 2, name: 'Monika Marie', age: 27 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Monika Marie', age: 27 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('update a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ MixedPk: 1, MixedName: 'new name', age: 30, ALLUPPER: true }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([
      { MixedPk: 1, MixedName: 'new name', age: 30, ALLUPPER: 1 },
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: 1 }
    ]);
  });

  test('update a single row [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ m_id: 2, m_name: 'Monika Marie', m_age: 27 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Monika Marie', age: 27 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  // DELETE

  test('delete a single row [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([{ MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: 1 }]);
  });

  test('delete 2 rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('delete a single row [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [
      { m_id: 2, m_name: 'Joey Antonio', m_age: 26 },
      { m_id: 3, m_name: 'Domi James', m_age: 19 }
    ];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('delete a single row without all mapped columns [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio' }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete 2 rows with different columns [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ name: 'Joey Antonio' }, { age: 29 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([{ id: 3, name: 'Domi James', age: 19 }]);
  });

  test('delete a single row that doesnt exist [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'i do not exist', m_age: 29 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row that matches multiple rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await runQuery(`INSERT INTO public.mytable (id, name, age) values (?, ?, ?)`, [5, 'Frank Basil', 29]); // a row with this name already exists!
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ name: 'Frank Basil' }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;

    await expect(async () => {
      await plugin.executePooled(newProps, clientWrapper);
    }).rejects.toThrow('The number of rows given to delete (1) is less than the number of rows that would be deleted (2).');
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 }, // still there (the real frank)
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 5, name: 'Frank Basil', age: 29 } // still there (the fake frank)
    ]);
  });

  test('delete a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await runQuery(`INSERT INTO public.mytable (id, name, age) values (?, ?, ?)`, [4, null, 10]);
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await runQuery(`INSERT INTO public.mytable (id, name, age) values (?, ?, ?)`, [4, null, 10]);
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: undefined, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row from a table with a comma column name [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'commacolumntable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ 'column,name': 'foo' }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.commacolumntable');
    expect(rows).toEqual([
      { 'column,name': 'baz', id: 2 },
      { 'column,name': 'bar', id: 3 }
    ]);
  });

  // INSERT AND UPDATE

  test('insert and update 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.newValues = [{ id: 2, name: 'Monika Marie', age: 27 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Monika Marie', age: 27 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  test('insert and update 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'new name', age: 20, ALLUPPER: false }];
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: 1 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 },
      { MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: 1 },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: 0 }
    ]);
  });

  test('insert and update 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.newValues = [{ m_id: 2, m_name: 'Monika Marie', m_age: 27 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Monika Marie', age: 27 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  // INSERT AND DELETE

  test('insert and delete 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  test('insert and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'new name', age: 20, ALLUPPER: false }];
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: 1 },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: 0 }
    ]);
  });

  test('insert and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  // UPDATE AND DELETE

  test('update and delete 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  test('update and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: 0 }];
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: 0 }]);
  });

  test('update and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  // INSERT, UPDATE, AND DELETE

  test('insert update and delete 3 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.newValues = [{ id: 1, name: 'Giovanna Joy', age: 23 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Giovanna Joy', age: 23 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  test('insert update and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'Monika Marie', age: 27, ALLUPPER: 1 }];
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: 0 }];
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: 0 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.MixedCaseTable');
    expect(rows).toEqual([
      { MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: 0 },
      { MixedPk: 3, MixedName: 'Monika Marie', age: 27, ALLUPPER: 1 }
    ]);
  });

  test('insert update and delete 3 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.newValues = [{ m_id: 1, m_name: 'Giovanna Joy', m_age: 23 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, clientWrapper);
    const rows = await runQuery('SELECT * FROM public.mytable');
    expect(rows).toEqual([
      { id: 1, name: 'Giovanna Joy', age: 23 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });
});
*/
