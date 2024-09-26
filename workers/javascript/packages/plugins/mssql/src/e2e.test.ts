import { promises as ps } from 'fs';
import { join } from 'path';
import {
  DUMMY_EXECUTION_CONTEXT,
  ErrorCode,
  ExecutionOutput,
  MsSqlActionConfiguration,
  MsSqlDatasourceConfiguration,
  PluginExecutionProps,
  RelayDelegate,
  SqlOperations
} from '@superblocks/shared';
import { cloneDeep } from 'lodash';
import sql, { ConnectionPool } from 'mssql';
import MicrosoftSQLPlugin from '.';

const MSSQL_HOST = 'localhost';
const MSSQL_PORT = 1433;
const MSSQL_USER = 'SA';
const MSSQL_PASSWORD = 'Password1.';
const MSSQL_DATABASE = 'master';

const config: sql.config = {
  user: MSSQL_USER,
  password: MSSQL_PASSWORD,
  server: MSSQL_HOST,
  database: MSSQL_DATABASE,
  options: {
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function resetDatabase() {
  try {
    const initScriptPath = join(__dirname, '../../scripts/initMsSql.sql');
    const initScript = await ps.readFile(initScriptPath, 'utf8');
    await pool.request().batch(initScript);
  } catch (err) {
    console.error('Error executing SQL script:', err);
    // NOTE: (joey) afterEach will handle closing pool
  }
}

const plugin: MicrosoftSQLPlugin = new MicrosoftSQLPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  connectionType: 'fields',
  endpoint: {
    port: MSSQL_PORT,
    host: MSSQL_HOST
  },
  connection: {
    useSsl: false,
    mode: 0
  },
  authentication: {
    custom: {
      databaseName: {
        key: 'databaseName',
        value: MSSQL_DATABASE
      },
      account: {
        value: 'test-account'
      }
    },
    password: MSSQL_PASSWORD,
    username: MSSQL_USER
  },
  superblocksMetadata: {
    pluginVersion: '0.0.10'
  },
  name: '[Demo] Unit Test'
} as MsSqlDatasourceConfiguration;

const CONNECTION_URL = `Server=${MSSQL_HOST},${MSSQL_PORT};Database=${MSSQL_DATABASE};User Id=${MSSQL_USER};Password=${MSSQL_PASSWORD};Encrypt=false`;

const actionConfiguration = {
  schema: 'dbo',
  usePreparedSql: true, // TODO: (JOEY) test with false
  superblocksMetadata: {
    pluginVersion: '0.0.10' // update as version changes
  },
  table: 'mytable', // update in individual tests as needed
  useAdvancedMatching: 'auto' // update in individual tests as needed
} as MsSqlActionConfiguration;

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
const props: PluginExecutionProps<MsSqlDatasourceConfiguration, MsSqlActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

let pool: ConnectionPool;

describe('MsSQL Test', () => {
  beforeEach(async () => {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    await resetDatabase();
  });
  afterEach(async () => {
    await pool.close();
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
      'Test connection failed: failed to create MicrosoftSQLPlugin connection: IntegrationError: Expected to receive connection url for connection type url (code undefined)'
    );
  });

  test('get metadata', async () => {
    // NOTE: (JOEY) this could probably be more explicit. for maintainablity, we can keep it like this for now to make writing tests easier
    const resp = await plugin.metadata(datasourceConfiguration);

    // TABLES
    // NOTE: (joey) this returns extra tables that seem default. we should probably remove them via the metadata query at some point
    const targetTableNames = ['commacolumntable', 'MixedCaseTable', 'mytable', 'mytable_nopk'];
    const filteredTables = resp.dbSchema?.tables.filter((table) => targetTableNames.includes(table.name));
    // table names
    expect(filteredTables?.map((table) => table.name)).toEqual(targetTableNames);
    // table schemas
    expect(filteredTables?.map((table) => table.schema)).toEqual(['dbo', 'dbo', 'dbo', 'dbo']);
    // types
    expect(filteredTables?.map((table) => table.type)).toEqual(['TABLE', 'TABLE', 'TABLE', 'TABLE']);
    // column names
    expect(filteredTables?.map((table) => table.columns.map((column) => column.name))).toEqual([
      ['id', 'column,name'],
      ['MixedPk', 'MixedName', 'ALLUPPER', 'age'],
      ['id', 'name', 'age'],
      ['name', 'age']
    ]);

    // SCHEMAS
    // names
    expect(resp.dbSchema?.schemas?.map((schema) => schema.name)).toEqual(['dbo']);
  });

  test('execute sql with no context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = `SELECT * FROM dbo.mytable where name = 'Frank Basil';`;
    await plugin.executePooled(newProps, pool);
    expect(newProps.mutableOutput.output).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('execute sql with context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'SELECT * FROM dbo.mytable where name = @PARAM_1;';
    newProps.context.preparedStatementContext = ['Frank Basil'];
    await plugin.executePooled(newProps, pool);
    expect(newProps.mutableOutput.output).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
  });

  test('execute invalid sql with context', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.RUN_SQL;
    newProps.actionConfiguration.body = 'SELECT * FROM dbo.mytabledoesnotexist where name = @PARAM_1;';
    newProps.context.preparedStatementContext = ['Frank Basil'];
    await plugin
      .executePooled(newProps, pool)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch(/Query failed: Invalid object name 'dbo.mytabledoesnotexist'/);
        expect(error.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
      });
  });

  // INSERT

  test('insert a single row [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name', age: 30 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);

    const res = await pool.request().query('SELECT * FROM dbo.mytable');

    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false },
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true },
      { MixedPk: 3, MixedName: 'test name', age: 30, ALLUPPER: true }
    ]);
  });

  test('insert 3 rows with different columns given [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test 1' }, { age: 2 }, { name: 'test 3', age: 3 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'test name', age: null }
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res1 = await pool.request().query('SELECT * FROM dbo.mytable WHERE id = 4');
    expect(res1.recordset).toEqual([{ id: 4, name: 'test name', age: null }]);
  });

  test('insert a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: undefined, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: null, age: 10 }
    ]);
  });

  test('insert a single row without giving schema [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'test name', age: 30 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    newProps.actionConfiguration.schema = undefined;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM  dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([
      { MixedPk: 1, MixedName: 'new name', age: 30, ALLUPPER: true },
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true }
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([{ MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true }]);
  });

  test('delete 2 rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([{ id: 1, name: 'Frank Basil', age: 29 }]);
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete 2 rows with different columns [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ name: 'Joey Antonio' }, { age: 29 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([{ id: 3, name: 'Domi James', age: 19 }]);
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await pool.request().query('insert into dbo.mytable (name, age) values (null, 10)');
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: null, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  test('delete a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
    await pool.request().query(`INSERT INTO dbo.mytable (name, age) values (null, 10)`);
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.deletedRows = [{ id: 4, name: undefined, age: 10 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 2, name: 'Joey Antonio', age: 26 },
      { id: 3, name: 'Domi James', age: 19 }
    ]);
  });

  // INSERT AND UPDATE

  test('insert and update 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.newValues = [{ id: 2, name: 'Monika Marie', age: 27 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    newProps.actionConfiguration.newValues = [{ MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: true }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([
      { MixedPk: 1, MixedName: 'Frank Basil', age: 29, ALLUPPER: false },
      { MixedPk: 2, MixedName: 'Monika Marie', age: 27, ALLUPPER: true },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: false }
    ]);
  });

  test('insert and update 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.newValues = [{ m_id: 2, m_name: 'Monika Marie', m_age: 27 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    newProps.actionConfiguration.insertedRows = [{ name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([
      { MixedPk: 2, MixedName: 'Joey Antonio', age: 26, ALLUPPER: true },
      { MixedPk: 3, MixedName: 'new name', age: 20, ALLUPPER: false }
    ]);
  });

  test('insert and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  // UPDATE AND DELETE

  test('update and delete 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([{ MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false }]);
  });

  test('update and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Frank Basil', age: 29 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });

  // INSERT, UPDATE, AND DELETE

  test('insert update and delete 3 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ name: 'Vincey Thomas', age: 18 }];
    newProps.actionConfiguration.newValues = [{ id: 1, name: 'Giovanna Joy', age: 23 }];
    newProps.actionConfiguration.deletedRows = [{ id: 2, name: 'Joey Antonio', age: 26 }];
    newProps.actionConfiguration.mappingMode = 'auto' as const;
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Giovanna Joy', age: 23 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
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
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo."MixedCaseTable"');
    expect(res.recordset).toEqual([
      { MixedPk: 2, MixedName: 'new name', age: 20, ALLUPPER: false },
      { MixedPk: 3, MixedName: 'Monika Marie', age: 27, ALLUPPER: true }
    ]);
  });

  test('insert update and delete 3 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration.operation = SqlOperations.UPDATE_ROWS;
    newProps.actionConfiguration.insertedRows = [{ m_name: 'Vincey Thomas', m_age: 18 }];
    newProps.actionConfiguration.newValues = [{ m_id: 1, m_name: 'Giovanna Joy', m_age: 23 }];
    newProps.actionConfiguration.deletedRows = [{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }];
    newProps.actionConfiguration.mappingMode = 'manual' as const;
    newProps.actionConfiguration.mappedColumns = [
      { json: 'm_id', sql: 'id' },
      { json: 'm_name', sql: 'name' },
      { json: 'm_age', sql: 'age' }
    ];
    await plugin.executePooled(newProps, pool);
    const res = await pool.request().query('SELECT * FROM dbo.mytable');
    expect(res.recordset).toEqual([
      { id: 1, name: 'Giovanna Joy', age: 23 },
      { id: 3, name: 'Domi James', age: 19 },
      { id: 4, name: 'Vincey Thomas', age: 18 }
    ]);
  });
});
