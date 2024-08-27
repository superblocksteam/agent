import {
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_ORACLE_DB_ACTION_CONFIGURATION,
  ErrorCode,
  ExecutionOutput,
  OracleDbActionConfiguration,
  OracleDbDatasourceConfiguration,
  PluginExecutionProps,
  SQLMappingModeEnum,
  SQLMatchingModeEnum,
  SQLOperationEnum,
  Table,
  TableType
} from '@superblocks/shared';
import path from 'path';

import { OracleDbPluginV1 as Plugin, PluginCommonV1 } from '@superblocksteam/types';

import * as dotenv from 'dotenv';
import { cloneDeep, merge } from 'lodash';
import OracleDB from 'oracledb';

import OracleDbPlugin from '.';

jest.setTimeout(90000);

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const ORACLEDB_LOCAL_DEV = process.env.ORACLEDB_LOCAL_DEV; // safeguard to prevent running these tests in CI
const ORACLEDB_HOST_URL = process.env.ORACLEDB_HOST_URL;
const ORACLEDB_PORT = process.env.ORACLEDB_PORT;
const ORACLEDB_DATABASE_SERVICE = process.env.ORACLEDB_DATABASE_SERVICE;
const ORACLEDB_USER = process.env.ORACLEDB_USER;
const ORACLEDB_PASSWORD = process.env.ORACLEDB_PASSWORD;

const runTests = ORACLEDB_LOCAL_DEV ? describe : describe.skip;

const plugin: OracleDbPlugin = new OracleDbPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };
// plugin.getTempTableName = jest.fn().mockReturnValue('"mocktablename"');

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = {
  name: 'E2E Test Config',
  connection: {
    hostUrl: ORACLEDB_HOST_URL as string,
    port: parseInt(ORACLEDB_PORT as string, 10),
    databaseService: ORACLEDB_DATABASE_SERVICE as string,
    user: ORACLEDB_USER as string,
    password: ORACLEDB_PASSWORD as string,
    useTcps: true
  }
} as OracleDbDatasourceConfiguration;

const datasourceConfigurationBasedOnString = {
  name: 'E2E Test Config Connection String',
  connection: {
    user: ORACLEDB_USER as string,
    password: ORACLEDB_PASSWORD as string,
    connectionType: 'url'
  }
} as OracleDbDatasourceConfiguration;

const sqlActionConfiguration = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
sqlActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
const sqlProps: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration: Plugin.fromJson(sqlActionConfiguration),
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

const executeParams = {
  maxRows: 0,
  outFormat: OracleDB.OUT_FORMAT_OBJECT,
  autoCommit: true
};

const bulkActionConfiguration = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
bulkActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
const bulkProps: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration: Plugin.fromJson(bulkActionConfiguration),
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

function buildPropsWithActionConfiguration(
  actionConfiguration: OracleDbActionConfiguration
): PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> {
  return {
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  } as PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration>;
}
let client: OracleDB.Connection;

const resetTableToBaseState = async (client) => {
  // create EETEST if it doesn't exist
  try {
    await client.execute('DROP TABLE "EETEST"', [], executeParams);
  } catch (e) {
    // do nothing
  }
  await client.execute(`CREATE TABLE "EETEST" ("id" NUMBER, "Name" VARCHAR(128), "age" NUMBER, PRIMARY KEY("id"))`);

  // attempt to create the no primary key table if it doesn't exist yet
  try {
    await client.execute('DROP TABLE "EETEST_NOPK"', [], executeParams);
  } catch (e) {
    // do nothing
  }
  try {
    await client.execute(`CREATE TABLE "EETEST_NOPK" ("id" NUMBER, "Name" VARCHAR(128), "age" NUMBER)`);
  } catch (e) {
    // do nothing
  }

  // seed table
  await client.executeMany(
    'INSERT INTO "EETEST" VALUES (:id, :Name, :age)',
    [
      { id: 1, Name: 'Frank Basil', age: 29 },
      { id: 2, Name: 'Joey Antonio', age: 26 },
      { id: 3, Name: 'Domi James', age: 19 }
    ],
    executeParams
  );
};

runTests('OracleDb Plugin', () => {
  beforeEach(async () => {
    client = await OracleDB.getConnection({
      user: datasourceConfiguration.connection?.user,
      password: datasourceConfiguration.connection?.password,
      connectString: `tcp${datasourceConfiguration.connection?.useTcps ? 's' : ''}://${datasourceConfiguration.connection?.hostUrl}:${
        datasourceConfiguration.connection?.port ?? 1521
      }/${datasourceConfiguration.connection?.databaseService}?ssl_server_dn_match=yes`
    });
    sqlProps.mutableOutput = new ExecutionOutput();
    bulkProps.mutableOutput = new ExecutionOutput();
  });

  afterEach(async () => {
    await client.close();
  });

  it('test connection', async () => {
    await plugin.test(datasourceConfiguration);
  });

  it('test connection with connection string', async () => {
    datasourceConfigurationBasedOnString.connection.connectionUrl = `${ORACLEDB_HOST_URL}/${ORACLEDB_DATABASE_SERVICE}`;
    await plugin.test(datasourceConfigurationBasedOnString);
    datasourceConfigurationBasedOnString.connection.connectionUrl = `${ORACLEDB_HOST_URL}:${ORACLEDB_PORT}/${ORACLEDB_DATABASE_SERVICE}`;
    await plugin.test(datasourceConfigurationBasedOnString);
    datasourceConfigurationBasedOnString.connection.connectionUrl = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${ORACLEDB_HOST_URL})(PORT=${ORACLEDB_PORT}))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=${ORACLEDB_DATABASE_SERVICE})))`;
    await plugin.test(datasourceConfigurationBasedOnString);
  });

  it('test connection with bad connection string', async () => {
    datasourceConfigurationBasedOnString.connection.connectionUrl = 'bad-string';
    await expect(plugin.test(datasourceConfigurationBasedOnString)).rejects.toThrow();
  });

  it('get metadata', async () => {
    const DUMMY_EXPECTED_METADATA = {
      tables: [new Table('ORDERS', TableType.TABLE, 'ADMIN')],
      schemas: [
        {
          name: 'ADMIN'
        }
      ]
    };
    DUMMY_EXPECTED_METADATA.tables[0].columns = [new Column('ID', 'NUMBER NOT NULL', '"ID"'), new Column('USER_ID', 'NUMBER', '"USER_ID"')];
    DUMMY_EXPECTED_METADATA.tables[0].keys = [{ name: 'ORDERS', type: 'primary key', columns: ['ID'] }];
    DUMMY_EXPECTED_METADATA.tables[0].templates = [];

    const res = await plugin.metadata(datasourceConfiguration);
    expect(res.dbSchema?.schemas?.filter((schema) => schema.name === 'ADMIN')).toEqual(DUMMY_EXPECTED_METADATA.schemas);
    expect(res.dbSchema?.tables.filter((table) => table.name === 'ORDERS' && table.schema === 'ADMIN')).toEqual(
      DUMMY_EXPECTED_METADATA.tables
    );
  });

  it('execute valid syntax query using run SQL operation', async () => {
    const localActionConfiguration = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = `SELECT * FROM orders`;
    const localProps: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> = {
      context,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };
    await plugin.executePooled(localProps, client);

    expect(localProps.mutableOutput.output).toEqual([
      {
        ID: 1,
        USER_ID: 1001
      }
    ]);
  });

  it('execute invalid syntax query using run SQL operation', async () => {
    const localActionConfiguration = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = `SELECT_BAD_SYNTAX * FROM orders`;
    const localProps: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> = {
      context,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };

    expect(localProps.mutableOutput.output).toEqual({});
    await plugin
      .executePooled(localProps, client)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch(/Query failed, OracleDbPlugin query failed to execute: ORA-00900: invalid SQL statement/);
        expect(error.code).toEqual(ErrorCode.INTEGRATION_SYNTAX);
      });

    expect(localProps.mutableOutput.output).toEqual({});
  });

  it('execute with parameterized query using run SQL operation', async () => {
    const localActionConfiguration = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = `SELECT * FROM orders WHERE USER_ID = :1`;
    const localContext = cloneDeep(context);
    localContext.preparedStatementContext = [1001];
    const localProps: PluginExecutionProps<OracleDbDatasourceConfiguration, OracleDbActionConfiguration> = {
      context: localContext,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };
    await plugin.executePooled(localProps, client);

    expect(localProps.mutableOutput.output).toEqual([
      {
        ID: 1,
        USER_ID: 1001
      }
    ]);
  });

  // NB: null gets converted to '' in Plugin.fromJson(...)
  describe('update by primary key', () => {
    describe.each([
      [{ bulkEdit: { table: '' } }, 'Table is required'],
      [{ bulkEdit: { table: 'products' } }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          bulkEdit: {
            table: 'products',
            updatedRows: '{}' // should be []
          }
        },
        'Validation failed, Updated Rows is not an array. Given \'"{}"\''
      ],
      [
        { bulkEdit: { table: 'products', updatedRows: '{}', insertedRows: '[]' } },
        'Validation failed, Updated Rows is not an array. Given \'"{}"\''
      ],
      [
        { bulkEdit: { table: 'products', updatedRows: 'asfd' } },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config: { bulkEdit: { table: string; updatedRows?: string; insertedRows?: string } }, message) => {
      it('has expected error', async () => {
        const actionConfig = merge(cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION), config);
        if (config.bulkEdit?.updatedRows !== undefined) {
          actionConfig.bulkEdit.updatedRows = config.bulkEdit?.updatedRows;
        }
        const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
        await expect(async () => {
          await plugin.executePooled(newProps, client);
        }).rejects.toThrow(message);
      });
    });

    describe.each([[{ bulkEdit: { table: 'products', updatedRows: '[]' } }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        const actionConfig = merge(cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION), config);
        actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
        const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
        await plugin.executePooled(newProps, client);
        expect(newProps.mutableOutput.log).toHaveLength(0);
        expect(newProps.mutableOutput.error).not.toBeDefined();
        expect(newProps.mutableOutput.output).toBeNull();
      });
    });

    it('fails if the metadata fetch fails', async () => {
      await expect(async () => {
        const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
        actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
        actionConfig.bulkEdit.table = 'products';
        actionConfig.bulkEdit.updatedRows = JSON.stringify([
          {
            id: 'a1',
            price: 123.45
          }
        ]);
        const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
        await plugin.executePooled(newProps, client);
      }).rejects.toThrow('Table PRODUCTS has no primary keys');
      expect(bulkProps.mutableOutput.log).toHaveLength(0);
    });
  });

  describe('Bulk Edit Insert', () => {
    it('insert 3 rows with different columns given [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([
          { id: 4, Name: 'test 1' },
          { id: 5, age: 2 },
          { id: 6, Name: 'test 3', age: 3 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'test 1', age: null },
        { id: 5, Name: null, age: 2 },
        { id: 6, Name: 'test 3', age: 3 }
      ]);
    });

    it('insert 3 rows with different columns given [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([
          { m_id: 4, m_Name: 'test 2' },
          { m_id: 5, m_age: 4 },
          { m_id: 7, m_Name: 'test 3', m_age: 3 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_Name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'test 2', age: null },
        { id: 5, Name: null, age: 4 },
        { id: 7, Name: 'test 3', age: 3 }
      ]);
    });

    it('insert 3 rows without all mapped columns [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.schema = 'ADMIN';
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ m_id: 4 }, { m_id: 5, m_age: 4 }, { m_id: 7, m_age: 3 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: null, age: null },
        { id: 5, Name: null, age: 4 },
        { id: 7, Name: null, age: 3 }
      ]);
    });

    it('insert 3 rows into a table with no PK [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ age: 4 }, { Name: 'test 3', age: 3 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST_NOPK';
      }

      await expect(async () => {
        await plugin.executePooled(newProps, client);
      }).rejects.toThrow('Table EETEST_NOPK has no primary keys');

      const res = await client.execute('SELECT * FROM ADMIN.EETEST_NOPK', [], executeParams);
      expect(res.rows).toEqual([]);
    });

    it('insert 3 rows with different columns given [AUTO MAPPING] [ADVANCED MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([
          { id: 4, Name: 'test 1' },
          { id: 5, age: 2 },
          { id: 6, Name: 'test 3', age: 3 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_ADVANCED;
        newProps.actionConfiguration.bulkEdit.oldRows = JSON.stringify([]);
        newProps.actionConfiguration.bulkEdit.filterBy = ['id'];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'test 1', age: null },
        { id: 5, Name: null, age: 2 },
        { id: 6, Name: 'test 3', age: 3 }
      ]);
    });
  });

  describe('Bulk Edit Update', () => {
    it('update 2 rows with mixed case and incomplete row [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([
          { id: 2, Name: 'Monika Marie' },
          { id: 3, Name: 'Domi James Different' }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Monika Marie', age: 26 },
        { id: 3, Name: 'Domi James Different', age: 19 }
      ]);
    });

    it('update 2 rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([
          { m_id: 2, m_name: 'Monika Marie', m_age: 28 },
          { m_id: 3, m_name: 'Domi James Different 2', m_age: 30 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Monika Marie', age: 28 },
        { id: 3, Name: 'Domi James Different 2', age: 30 }
      ]);
    });
  });

  describe('Bulk Edit Delete', () => {
    it('delete a single row with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 2, Name: 'Joey Antonio', age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James', age: 19 }
      ]);
    });

    it('delete 2 rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([
          { id: 2, Name: 'Joey Antonio', age: 26 },
          { id: 3, Name: 'Domi James', age: 19 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([{ id: 1, Name: 'Frank Basil', age: 29 }]);
    });

    it('delete 2 rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([
          { m_id: 2, m_name: 'Joey Antonio', m_age: 26 },
          { m_id: 3, m_name: 'Domi James', m_age: 19 }
        ]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([{ id: 1, Name: 'Frank Basil', age: 29 }]);
    });

    it('delete a single row without all mapped columns [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ m_id: 2, m_name: 'Joey Antonio' }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James', age: 19 }
      ]);
    });

    it('delete 2 rows with different columns [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ Name: 'Joey Antonio' }, { age: 29 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([{ id: 3, Name: 'Domi James', age: 19 }]);
    });

    it('delete a single row that doesnt exist [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ m_id: 2, m_name: 'i do not exist' }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 }
      ]);
    });

    it('delete a single row that matches multiple rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      await client.execute(`INSERT INTO EETEST ("id", "Name", "age") VALUES (:1, :2, :3)`, [5, 'Frank Basil', 29], executeParams);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ Name: 'Frank Basil' }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await expect(async () => {
        await plugin.executePooled(newProps, client);
      }).rejects.toThrow('The number of rows given to delete (1) is less than the number of rows that would be deleted (2).');
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 }, // still there (the real frank)
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 5, Name: 'Frank Basil', age: 29 } // still there (the fake frank)
      ]);
    });

    it('delete a single row with a null value [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      await client.execute(`INSERT INTO EETEST ("id", "Name", "age") VALUES (:1, :2, :3)`, [4, null, 10], executeParams);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 4, Name: null, age: 10 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 }
      ]);
    });

    it('delete a single row with an undefined value [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      await client.execute(`INSERT INTO EETEST ("id", "Name", "age") VALUES (:1, :2, :3)`, [4, undefined, 10], executeParams);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 4, Name: undefined, age: 10 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Joey Antonio', age: 26 },
        { id: 3, Name: 'Domi James', age: 19 }
      ]);
    });
  });

  describe('Bulk Edit Combinations', () => {
    it('insert and update 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ id: 4, Name: 'Vincey Thomas', age: 18 }]);
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ id: 2, Name: 'Monika Marie', age: 27 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Monika Marie', age: 27 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });

    it('insert and update 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }]);
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ m_id: 2, m_name: 'Monika Marie', m_age: 27 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 2, Name: 'Monika Marie', age: 27 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });

    // INSERT AND DELETE

    it('insert and delete 2 single rows [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ id: 4, Name: 'Vincey Thomas', age: 18 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 2, Name: 'Joey Antonio', age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });

    it('insert and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });

    // UPDATE AND DELETE

    it('update and delete 2 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ id: 3, Name: 'Domi James Updated', age: 20 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 2, Name: 'Joey Antonio', age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James Updated', age: 20 }
      ]);
    });

    it('update and delete 2 single rows [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ m_id: 3, m_name: 'Domi James Updated', m_age: 20 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Frank Basil', age: 29 },
        { id: 3, Name: 'Domi James Updated', age: 20 }
      ]);
    });

    // INSERT, UPDATE, AND DELETE

    it('insert update and delete 3 single rows with mixed case [AUTO MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ id: 4, Name: 'Vincey Thomas', age: 18 }]);
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ id: 1, Name: 'Giovanna Joy', age: 23 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ id: 2, Name: 'Joey Antonio', age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Giovanna Joy', age: 23 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });

    it('insert update and delete 2 single rows with mixed case [MANUAL MAPPING] [AUTO MATCHING]', async () => {
      await resetTableToBaseState(client);
      const actionConfig = cloneDeep(DUMMY_ORACLE_DB_ACTION_CONFIGURATION);
      actionConfig.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
      const newProps = buildPropsWithActionConfiguration(Plugin.fromJson(actionConfig) as OracleDbActionConfiguration);
      if (newProps.actionConfiguration.bulkEdit) {
        newProps.actionConfiguration.bulkEdit.insertedRows = JSON.stringify([{ m_id: 4, m_name: 'Vincey Thomas', m_age: 18 }]);
        newProps.actionConfiguration.bulkEdit.updatedRows = JSON.stringify([{ m_id: 1, m_name: 'Giovanna Joy', m_age: 23 }]);
        newProps.actionConfiguration.bulkEdit.deletedRows = JSON.stringify([{ m_id: 2, m_name: 'Joey Antonio', m_age: 26 }]);
        newProps.actionConfiguration.bulkEdit.mappingMode = SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL;
        newProps.actionConfiguration.bulkEdit.matchingMode = SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO;
        newProps.actionConfiguration.bulkEdit.mappedColumns = [
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_id', sql: 'id' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_name', sql: 'Name' }),
          PluginCommonV1.SQLMappedColumns.fromJson({ json: 'm_age', sql: 'age' })
        ];
        newProps.actionConfiguration.bulkEdit.table = 'EETEST';
      }
      await plugin.executePooled(newProps, client);
      const res = await client.execute('SELECT * FROM EETEST ORDER BY "id" ASC', [], executeParams);
      expect(res.rows).toEqual([
        { id: 1, Name: 'Giovanna Joy', age: 23 },
        { id: 3, Name: 'Domi James', age: 19 },
        { id: 4, Name: 'Vincey Thomas', age: 18 }
      ]);
    });
  });
});
