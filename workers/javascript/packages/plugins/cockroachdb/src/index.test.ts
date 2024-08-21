import {
  CockroachDBActionConfiguration,
  CockroachDBDatasourceConfiguration,
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ExecutionOutput,
  PluginExecutionProps
} from '@superblocks/shared';

const DUMMY_TABLE_RESULT = [
  {
    name: 'id',
    column_type: 'int4',
    default_expr: null,
    kind: 'r',
    table_name: 'orders',
    schema_name: 'public'
  },
  {
    name: 'user_id',
    column_type: 'int8',
    default_expr: null,
    kind: 'r',
    table_name: 'orders',
    schema_name: 'public'
  }
];

const DUMMY_EXPECTED_METADATA = {
  name: 'orders',
  type: 'TABLE',
  columns: [
    { name: 'id', type: 'int4', escapedName: '"id"' },
    { name: 'user_id', type: 'int8', escapedName: '"user_id"' }
  ],
  keys: [],
  templates: []
};

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

import { Client } from 'pg';
jest.mock('pg');

import { KeysQuery, TableQuery } from './queries';
import CockroachDBPlugin from '.';

const plugin: CockroachDBPlugin = new CockroachDBPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const DUMMY_COCKROACHDB_QUERY_RESULT = {
  rows: DUMMY_QUERY_RESULT
};
const DUMMY_COCKROACHDB_TABLE_RESULT = {
  rows: DUMMY_TABLE_RESULT
};
const DUMMY_COCKROACHDB_KEY_RESULT = {
  rows: [
    {
      constraint_name: 'orders_pkey',
      constraint_type: 'p',
      self_schema: 'public',
      self_table: 'orders',
      self_columns: ['id'],
      foreign_schema: null,
      foreign_table: null,
      foreign_columns: '{NULL}',
      definition: 'PRIMARY KEY (id)'
    }
  ]
};
const DUMMY_COCKROACHDB_EXPECTED_METADATA = {
  ...DUMMY_EXPECTED_METADATA,
  keys: [{ name: 'orders_pkey', type: 'primary key', columns: ['id'] }]
};

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = DUMMY_DB_DATASOURCE_CONFIGURATION as CockroachDBDatasourceConfiguration;
const actionConfiguration = DUMMY_ACTION_CONFIGURATION;
const props: PluginExecutionProps<CockroachDBDatasourceConfiguration, CockroachDBActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CockroachDB Plugin', () => {
  it('test connection', async () => {
    jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
    jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

    await plugin.test(datasourceConfiguration);

    expect(Client.prototype.connect).toBeCalledTimes(1);
    expect(Client.prototype.connect).toBeCalledTimes(1);
  });

  it('get metadata', async () => {
    jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      if (query === KeysQuery) {
        return DUMMY_COCKROACHDB_KEY_RESULT;
      } else if (query === TableQuery) {
        return DUMMY_COCKROACHDB_TABLE_RESULT;
      } else {
        return {};
      }
    });

    const res = await plugin.metadata(datasourceConfiguration);

    expect(res.dbSchema?.tables[0]).toEqual(DUMMY_COCKROACHDB_EXPECTED_METADATA);
  });

  it('execute query', async () => {
    const client = new Client({});
    jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      if (query === actionConfiguration.body) {
        return DUMMY_COCKROACHDB_QUERY_RESULT;
      } else {
        return {};
      }
    });

    const res = await plugin.executePooled({ ...props, mutableOutput: new ExecutionOutput() }, client);

    expect(res.output).toEqual(DUMMY_COCKROACHDB_QUERY_RESULT.rows);
    expect(client.query).toBeCalledTimes(1);
  });
});
