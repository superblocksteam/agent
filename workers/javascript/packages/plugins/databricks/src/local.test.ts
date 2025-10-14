import { DBSQLClient } from '@databricks/sql';
import {
  DatabricksDatasourceConfiguration,
  DUMMY_BASE_SQL_ACTION_CONFIGURATION,
  DUMMY_BASE_SQL_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  ExecutionOutput,
  PluginExecutionProps,
  prepContextForBindings,
  Schema,
  SQLOperationEnum,
  Table,
  TableType
} from '@superblocks/shared';
import path from 'path';

import { DatabricksPluginV1 as Plugin } from '@superblocksteam/types';

import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import DatabricksPlugin from '.';

jest.setTimeout(20000);

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.DATABRICKS_LOCAL_DEV; // safeguard to prevent running these tests in CI
const DATABRICKS_HOST_URL = process.env.DATABRICKS_HOST_URL;
const DATABRICKS_PATH = process.env.DATABRICKS_PATH;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_CATALOG = 'eetest';
const DATABRICKS_SCHEMA = 'default';

// setup SQL tables for EE test
// TODO(jason4012) move these into an init.sql file to be run between tests
/*
DROP TABLE eetest.default.orders;
CREATE table eetest.default.orders (id INTEGER NOT NULL, user_id LONG, CONSTRAINT orders_pk PRIMARY KEY(id));
INSERT INTO eetest.default.orders (id, user_id) VALUES (1, 1000);
*/

const runTests = LOCAL_DEV ? describe : describe.skip;

const plugin: DatabricksPlugin = new DatabricksPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const DUMMY_DATABRICKS_QUERY_RESULT = {
  rows: [{ id: 1, user_id: 1000 }]
};

const client: DBSQLClient = new DBSQLClient();
const errClient = new DBSQLClient();
errClient.on('error', (error) => {
  console.log('error caught at thrift level:', error.message);
});

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = Plugin.fromJson(
  Object.assign(cloneDeep(DUMMY_BASE_SQL_DATASOURCE_CONFIGURATION), {
    connection: {
      hostUrl: (DATABRICKS_HOST_URL as string) ?? 'DUMMY_HOST_URL',
      path: (DATABRICKS_PATH as string) ?? 'DUMMY_PATH',
      token: (DATABRICKS_TOKEN as string) ?? 'DUMMY_TOKEN',
      defaultCatalog: DATABRICKS_CATALOG,
      defaultSchema: DATABRICKS_SCHEMA
    }
  })
) as DatabricksDatasourceConfiguration;
const actionConfiguration = cloneDeep(DUMMY_BASE_SQL_ACTION_CONFIGURATION);
actionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS;
const props: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration: Plugin.fromJson(actionConfiguration),
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

runTests('Databricks Plugin', () => {
  beforeEach(async () => {
    props.mutableOutput = new ExecutionOutput();
  });

  afterEach(async () => {
    try {
      await errClient.close();
    } catch (e) {
      // do nothing
    }
    jest.restoreAllMocks();
  });

  it('test connection success', async () => {
    await plugin.test(datasourceConfiguration);
  });

  it('test connection with invalid path', async () => {
    const clonedDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    if (clonedDatasourceConfiguration && clonedDatasourceConfiguration.connection) {
      clonedDatasourceConfiguration.connection.path = 'invalid path';
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(plugin.test(clonedDatasourceConfiguration)).rejects.toThrowError(`Test Databricks connection failed`);
  });

  it('test connection with invalid token', async () => {
    const clonedDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    if (clonedDatasourceConfiguration && clonedDatasourceConfiguration.connection) {
      clonedDatasourceConfiguration.connection.token = 'invalid token';
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(plugin.test(clonedDatasourceConfiguration)).rejects.toThrowError(`Test Databricks connection failed`);
  });

  it('test connection with invalid catalog', async () => {
    const clonedDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    if (clonedDatasourceConfiguration && clonedDatasourceConfiguration.connection) {
      clonedDatasourceConfiguration.connection.defaultCatalog = 'invalid catalog';
    }
    await plugin.test(clonedDatasourceConfiguration);
  });

  it('test connection with invalid schema', async () => {
    const clonedDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    if (clonedDatasourceConfiguration && clonedDatasourceConfiguration.connection) {
      clonedDatasourceConfiguration.connection.defaultSchema = 'invalid schema';
    }
    await plugin.test(clonedDatasourceConfiguration);
  });

  it('get metadata using Unity Catalog API', async () => {
    jest.setTimeout(60000);
    const res = await plugin.metadata(datasourceConfiguration);
    
    // Validate basic structure - Unity Catalog should return at least some schemas and tables
    expect(res.dbSchema?.schemas).toBeDefined();
    expect(Array.isArray(res.dbSchema?.schemas)).toBe(true);
    expect(res.dbSchema?.tables).toBeDefined();
    expect(Array.isArray(res.dbSchema?.tables)).toBe(true);
    
    // Check if our test catalog exists
    const testCatalogSchemas = res.dbSchema?.schemas.filter(schema => schema.name === DATABRICKS_CATALOG);
    if (testCatalogSchemas && testCatalogSchemas.length > 0) {
      // If test catalog exists, look for our test table
      const testTables = res.dbSchema?.tables.filter((table) => 
        table.schema === DATABRICKS_CATALOG && 
        table.name.includes('orders')
      );
      
      if (testTables && testTables.length > 0) {
        // Validate the structure of at least one table
        const testTable = testTables[0];
        expect(testTable.name).toContain('orders');
        expect(testTable.schema).toBe(DATABRICKS_CATALOG);
        expect(Array.isArray(testTable.columns)).toBe(true);
        
        // Check for expected columns if they exist
        const idColumn = testTable.columns.find(col => col.name === 'id');
        const userIdColumn = testTable.columns.find(col => col.name === 'user_id');
        
        if (idColumn) {
          expect(idColumn.type).toMatch(/INT|INTEGER/i);
        }
        if (userIdColumn) {
          expect(userIdColumn.type).toMatch(/LONG|BIGINT/i);
        }
      }
    }
    
    console.log(`Found ${res.dbSchema?.schemas.length} schemas and ${res.dbSchema?.tables.length} tables`);
  });

  it('execute valid syntax query using run SQL operation', async () => {
    await client.connect({
      host: datasourceConfiguration.connection?.hostUrl as string,
      path: datasourceConfiguration.connection?.path as string,
      token: datasourceConfiguration.connection?.token as string
    });

    const localActionConfiguration = cloneDeep(DUMMY_BASE_SQL_ACTION_CONFIGURATION);
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = 'SELECT * FROM orders WHERE id = 1;';
    const localProps: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration> = {
      context,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };
    await plugin.executePooled(localProps, client);
    await client.close();
    expect(localProps.mutableOutput.output).toEqual(DUMMY_DATABRICKS_QUERY_RESULT.rows);
  });

  it('execute invalid syntax query using run SQL operation', async () => {
    await client.connect({
      host: datasourceConfiguration.connection?.hostUrl as string,
      path: datasourceConfiguration.connection?.path as string,
      token: datasourceConfiguration.connection?.token as string
    });

    const localActionConfiguration = cloneDeep(DUMMY_BASE_SQL_ACTION_CONFIGURATION);
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = 'SELECT * FROM ordersdoesnotexist WHERE id = 1;';
    const localProps: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration> = {
      context,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };
    await plugin.executePooled(localProps, client);
    await client.close();
    expect(localProps.mutableOutput.output).toEqual(DUMMY_DATABRICKS_QUERY_RESULT.rows);
  });

  it('execute valid syntax query using run SQL operation and named parameter', async () => {
    await client.connect({
      host: datasourceConfiguration.connection?.hostUrl as string,
      path: datasourceConfiguration.connection?.path as string,
      token: datasourceConfiguration.connection?.token as string
    });

    const localActionConfiguration = cloneDeep(DUMMY_BASE_SQL_ACTION_CONFIGURATION);
    const clonedContext = cloneDeep(context);
    clonedContext.preparedStatementContext = [1] as unknown[];
    localActionConfiguration.operation = SQLOperationEnum.SQL_OPERATION_RUN_SQL;
    localActionConfiguration.runSql.sqlBody = 'SELECT * FROM orders WHERE id = :PARAM_1;';
    const localProps: PluginExecutionProps<DatabricksDatasourceConfiguration, DatabricksActionConfiguration> = {
      context: clonedContext,
      datasourceConfiguration,
      actionConfiguration: Plugin.fromJson(localActionConfiguration),
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };
    await plugin.executePooled(localProps, client);
    await client.close();
    expect(localProps.mutableOutput.output).toEqual(DUMMY_DATABRICKS_QUERY_RESULT.rows);
  });

  test('bindings resolve correctly when using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    if (newProps.actionConfiguration.runSql) {
      newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM orders LIMIT {{binding1}};`;
      newProps.actionConfiguration.runSql.useParameterized = true;
    }

    prepContextForBindings(newProps.context, { binding1: '1' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration as ActionConfiguration,
      files: null,
      property: 'runSql.sqlBody',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual('SELECT * FROM orders LIMIT :PARAM_1;');
    expect(resp.placeholdersInfo?.[':PARAM_1']?.value).toEqual('"1"');
  });

  test('bindings resolve correctly when using parameterized sql and duplicated parameters', async () => {
    const newProps = cloneDeep(props);
    if (newProps.actionConfiguration.runSql) {
      newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM orders LIMIT {{binding1}} OFFSET {{binding1}};`;
      newProps.actionConfiguration.runSql.useParameterized = true;
    }

    prepContextForBindings(newProps.context, { binding1: '1' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration as ActionConfiguration,
      files: null,
      property: 'runSql.sqlBody',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual('SELECT * FROM orders LIMIT :PARAM_1 OFFSET :PARAM_1;');
    expect(resp.placeholdersInfo?.[':PARAM_1']?.value).toEqual('"1"');
  });

  test('bindings dont resolve when not using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    if (newProps.actionConfiguration.runSql) {
      newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM orders LIMIT {{binding1}};`;
      newProps.actionConfiguration.runSql.useParameterized = false;
    }

    prepContextForBindings(newProps.context, { binding1: '1' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration as ActionConfiguration,
      files: null,
      property: 'runSql.sqlBody',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual('SELECT * FROM orders LIMIT 1;');
  });
});
