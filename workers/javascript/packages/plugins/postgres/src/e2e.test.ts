import fs from 'fs';
import path from 'path';
import {
  ActionConfiguration,
  ClientWrapper,
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginExecutionProps,
  PostgresActionConfiguration,
  PostgresDatasourceConfiguration,
  RelayDelegate,
  SharedSSHAuthMethod,
  SqlOperations,
  prepContextForBindings
} from '@superblocks/shared';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import { Client } from 'pg';
import { Client as ssh2Client } from 'ssh2';
import PostgresPlugin from '.';

jest.setTimeout(20000);

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd() + '/../baseplugin/', '.env') });
const BASTION_LOCAL_DEV = process.env.BASTION_LOCAL_DEV; // safeguard to prevent running these tests in CI
const BASTION_PRIVATE_KEY_RSA = process.env.BASTION_PRIVATE_KEY_RSA;

const POSTGRES_HOST = 'localhost';
const POSTGRES_PORT = 15432;
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'password';
const POSTGRES_DATABASE = 'postgres';
const POSTGRES_BASTION_DESTINATION_HOST = 'plugin-postgres';
const POSTGRES_BASTION_DESTINATION_PORT = 5432;

// helper functions
async function resetDatabase() {
  const initScriptPath = path.join(__dirname, '../../scripts/initPostgres.sql');
  const initScript = await fs.promises.readFile(initScriptPath, 'utf8');
  await clientWrapper.client.query(initScript);
}

async function insertRow(row: Row) {
  const insertSQL = `
    INSERT INTO ${actionConfiguration.table}(id, name, age)
    VALUES($1, $2, $3);
  `;

  await clientWrapper.client.query(insertSQL, [row.id, row.name, row.age]);
}

const clientWrapper: ClientWrapper<Client, ssh2Client> = {
  client: null,
  tunnel: null
};

const plugin: PostgresPlugin = new PostgresPlugin({ PRIVATE_KEY_RSA: BASTION_PRIVATE_KEY_RSA });

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  connectionType: 'fields',
  endpoint: {
    port: POSTGRES_PORT,
    host: POSTGRES_HOST
  },
  connection: {
    useSsl: false,
    mode: 0
  },
  authentication: {
    custom: {
      databaseName: {
        value: POSTGRES_DATABASE
      }
    },
    password: POSTGRES_PASSWORD,
    username: POSTGRES_USER
  },
  tunnel: {
    authMethod: SharedSSHAuthMethod.PUB_KEY_RSA,
    enabled: false,
    host: '127.0.0.1', // ssh host
    port: 22222, // ssh port
    username: 'bastion', // ssh username
    privateKey: ''
  },
  superblocksMetadata: {
    pluginVersion: '0.0.10'
  },
  name: '[Demo] Unit Test'
} as PostgresDatasourceConfiguration;

const CONNECTION_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`;

const actionConfiguration = {
  schema: 'public',
  usePreparedSql: true, // TODO: (JOEY) test with false
  superblocksMetadata: {
    pluginVersion: '0.0.10' // update as version changes
  },
  table: 'mytable', // update in individual tests as needed
  useAdvancedMatching: 'auto' // update in individual tests as needed
} as PostgresActionConfiguration;

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
const props: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

interface Row {
  id: number;
  name: string | null;
  age: number | null;
}

const tunnelInputs: boolean[] = [false];
if (BASTION_LOCAL_DEV) {
  tunnelInputs.push(true);
}

describe.each(tunnelInputs)('Postgres Test', (useTunnel) => {
  beforeAll(async () => {
    if (useTunnel && datasourceConfiguration.tunnel) {
      datasourceConfiguration.tunnel.enabled = useTunnel;
    }
    let tunneledAddress;
    if (useTunnel && datasourceConfiguration.endpoint) {
      datasourceConfiguration.endpoint = {
        host: POSTGRES_BASTION_DESTINATION_HOST,
        port: POSTGRES_BASTION_DESTINATION_PORT
      };
      tunneledAddress = await plugin.createTunnel(datasourceConfiguration);
    }

    clientWrapper.client = new Client({
      host: useTunnel ? tunneledAddress?.host : POSTGRES_HOST,
      port: useTunnel ? tunneledAddress?.port : POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DATABASE
    });

    await clientWrapper.client.connect();
  });

  afterAll(async () => {
    await clientWrapper.client.end();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  // BASE CASES

  test('connection fields', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('connection url', async () => {
    await plugin.test({ connectionType: 'url', connectionUrl: CONNECTION_URL });
  });

  test('connection url errors if no url given', async () => {
    await expect(plugin.test({ connectionType: 'url', connectionUrl: '' })).rejects.toThrow(
      'Test connection failed: failed to create PostgresPlugin connection: IntegrationError: Expected to receive connection url for connection type url'
    );
  });

  test('get metadata', async () => {
    // NOTE: (JOEY) this could probably be more explicit. for maintainablity, we can keep it like this for now to make writing tests easier
    const resp = await plugin.metadata(datasourceConfiguration);

    // TABLES
    // names
    expect(resp.dbSchema?.tables.map((table) => table.name)).toEqual(['MixedCaseTable', 'commacolumntable', 'mytable', 'mytable_nopk']);
    // table schemas
    expect(resp.dbSchema?.tables?.map((table) => table.schema)).toEqual(['public', 'public', 'public', 'public']);
    // types
    expect(resp.dbSchema?.tables?.map((table) => table.type)).toEqual(['TABLE', 'TABLE', 'TABLE', 'TABLE']);
    // column names
    expect(resp.dbSchema?.tables?.map((table) => table.columns.map((column) => column.name))).toEqual([
      ['MixedPk', 'MixedName', 'ALLUPPER', 'age'],
      ['id', 'column,name'],
      ['id', 'name', 'age'],
      ['name', 'age']
    ]);

    // SCHEMAS
    // names
    expect(resp.dbSchema?.schemas?.map((schema) => schema.name)).toEqual(['public']);
  });

  test('execute sql with no context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'select * from  public.mytable limit 1;';
    await plugin.executePooled(newProps, clientWrapper);
    expect(newProps.mutableOutput.output).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('execute sql with context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'select * from public.mytable limit $1;';
    newProps.context.preparedStatementContext = [1];
    await plugin.executePooled(newProps, clientWrapper);
    expect(newProps.mutableOutput.output).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('execute sql with no context, invalid statement', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'select * from public.mytabledoesnotexist limit 1;';
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(plugin.executePooled(newProps, clientWrapper)).rejects.toThrowError(
      'Query failed: relation "public.mytabledoesnotexist" does not exist'
    );
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
    expect(resp.resolved).toEqual('SELECT * FROM public.myTable LIMIT $1;');
    expect(resp.placeholdersInfo?.['$1']?.value).toEqual('"1"');
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false },
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true },
      { MixedPk: 3, MixedName: 'test name', age: 30, ALLUPPER: true }
    ]);
  });

  test('insert a single row with null in a non-nullable column [AUTO MAPPING] [AUTO MATCHING] [SYNTAX SPECIFIC BEHAVIOR]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: null, name: 'test name', age: 30 }]; // id is not nullable
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await expect(async () => {
      await plugin.executePooled(newProps, clientWrapper);
    }).rejects.toThrow('Query failed, null value in column "id" of relation "mytable" violates not-null constraint');
  });

  test('insert 3 rows with different columns given [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test 1' }, { age: 2 }, { name: 'test 3', age: 3 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res1 = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable WHERE id = $1', [4]);
    expect(res1.rows).toEqual([{ id: 4, name: 'test name', age: null }]);
  });

  test('insert a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: null, age: 10 }
    ]);
  });

  test('insert a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ id: 4, name: undefined, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    }).rejects.toThrow('Table "public"."mytable_nopk" has no primary keys');

    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable_nopk');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM  public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 2, name: 'Monika Marie', age: 27 }
    ]);
  });

  test('update a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ MixedPk: 1, MixedName: 'new name', age: 30, ALLUPPER: true }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true },
      { MixedPk: 1, MixedName: 'new name', age: 30, ALLUPPER: true }
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 2, name: 'Monika Marie', age: 27 }
    ]);
  });

  // DELETE

  test('delete a single row [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([{ MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true }]);
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete 2 rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([{ id: 3, name: 'Domi James', age: 19 }]);
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row that matches multiple rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await insertRow({ id: 5, name: 'Frank Basil', age: 29 }); // a row with this name already exists!
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ name: 'Frank Basil' }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;

    await expect(async () => {
      await plugin.executePooled(newProps, clientWrapper);
    }).rejects.toThrow('The number of rows given to delete (1) is less than the number of rows that would be deleted (2).');
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 }, // still there (the real frank)
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 5, name: 'Frank Basil', age: 29 } // still there (the fake frank)
    ]);
  });

  test('delete a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await insertRow({ id: 4, name: null, age: 10 });
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await clientWrapper.client.query(`INSERT INTO public.mytable (id, name, age) values ($1, $2, $3)`, [4, null, 10]);
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: undefined, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.commacolumntable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 },
      { id: 2, name: 'Monika Marie', age: 27 }
    ]);
  });

  test('insert and update 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'new name', age: 20, ALLUPPER: false }];
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: true }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: false },
      { MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: true }
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 },
      { id: 2, name: 'Monika Marie', age: 27 }
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: false }
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  test('update and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false }];
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false }]);
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 },
      { id: 1, name: 'Giovanna Joy', age: 23 }
    ]);
  });

  test('insert update and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.table = 'MixedCaseTable';
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ MixedName: 'Monika Marie', age: 27, ALLUPPER: true }];
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false }];
    newProps.actionConfiguration.deletedRows = [{ MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, clientWrapper);
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public."MixedCaseTable"');
    expect(res.rows).toEqual([
      { MixedPk: 3, MixedName: 'Monika Marie', age: 27, ALLUPPER: true },
      { MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false }
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
    const res = await clientWrapper.client.query<Row>('SELECT * FROM public.mytable');
    expect(res.rows).toEqual([
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 },
      { id: 1, name: 'Giovanna Joy', age: 23 }
    ]);
  });
});
