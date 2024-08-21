import {
  Column,
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ExecutionOutput,
  MsSqlActionConfiguration,
  MsSqlDatasourceConfiguration,
  PluginExecutionProps,
  SqlOperations
} from '@superblocks/shared';

import mssql from 'mssql';
jest.mock('mssql');

import { SQL_SINGLE_TABLE_METADATA } from './queries';
import MicrosoftSQLPlugin from '.';

const plugin: MicrosoftSQLPlugin = new MicrosoftSQLPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };
plugin.getTempTableName = jest.fn().mockReturnValue('##mocktablename');

const datasourceConfiguration = DUMMY_DB_DATASOURCE_CONFIGURATION as MsSqlDatasourceConfiguration;
const actionConfiguration = {
  ...DUMMY_ACTION_CONFIGURATION,
  operation: SqlOperations.RUN_SQL
};
const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<MsSqlDatasourceConfiguration, MsSqlActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

const MOCK_PRIMARY_COLUMNS_FOR_UPDATE = { recordset: [{ column_name: 'id', data_type: 'bigint' }] };
const MOCK_ALL_COLUMNS_FOR_UPDATE = {
  recordset: [
    { column_name: 'price', data_type: 'bigint' },
    { column_name: 'id', data_type: 'bigint' },
    { column_name: 'updated', data_type: 'datetime' },
    { column_name: 'name', data_type: 'nvarchar', max_length: 23 },
    { column_name: 'max_name', data_type: 'nvarchar', max_length: -1 } // shows up as -1 for MAX
  ]
};

function makeTestablePromise() {
  let resolver;
  let rejecter;
  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (promise as any).resolver = resolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (promise as any).rejecter = rejecter;
  return promise as Promise<unknown> & {
    resolver: (...args: unknown[]) => void;
    rejecter: (...args: unknown[]) => void;
  };
}

describe('Microsoft SQL Plugin', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = mssql;

  beforeEach(async () => {
    client = {
      transaction: jest.fn().mockImplementation(() => client),
      begin: jest.fn().mockImplementation(() => client),
      commit: jest.fn(),
      rollback: jest.fn(),

      request: jest.fn().mockImplementation(() => client),
      query: jest.fn().mockImplementation(() => ({ recordset: [] })),
      input: jest.fn().mockImplementation(() => client)
    } as Partial<mssql.ConnectionPool>;
    jest.spyOn(db, 'Transaction').mockReturnValue(client);
    props.mutableOutput = new ExecutionOutput();
  });

  afterEach(() => {
    // Only works with jest.spyOn()
    jest.restoreAllMocks();
    client?.query?.mockReset?.();
  });

  it('test connection', async () => {
    const connection = {
      connect: () => undefined,
      on: () => undefined,
      query: jest.fn().mockImplementation((): void => undefined)
    };
    jest.spyOn(db, 'ConnectionPool').mockImplementation(() => connection);

    await plugin.test(datasourceConfiguration);

    expect(connection.query).toBeCalledTimes(1);
  });

  it('get metadata', async () => {
    const TABLES_RESULT = {
      recordset: [
        {
          column_name: 'id',
          data_type: 'int',
          table_name: 'orders'
        },
        {
          column_name: 'user_id',
          data_type: 'int',
          table_name: 'orders'
        }
      ]
    };

    const KEYS_RESULT = {
      recordset: [
        {
          table_name: 'different',
          column_name: 'asdf'
        },
        {
          table_name: 'orders',
          column_name: 'id'
        },
        {
          table_name: 'orders',
          column_name: 'user_id'
        }
      ]
    };

    const connection = {
      connect: () => undefined,
      on: () => undefined,
      query: jest.fn().mockReturnValueOnce(TABLES_RESULT).mockReturnValueOnce(KEYS_RESULT)
    };
    jest.spyOn(db, 'ConnectionPool').mockImplementation(() => connection);

    const res = await plugin.metadata(datasourceConfiguration);

    expect(res.dbSchema?.tables[0]).toEqual({
      name: 'orders',
      type: 'TABLE',
      columns: [new Column('id', 'int'), new Column('user_id', 'int')],
      keys: [{ name: 'orders', type: 'primary key', columns: ['id', 'user_id'] }],
      templates: []
    });
    expect(connection.query).toBeCalledTimes(2);
  });

  it('execute query', async () => {
    jest.spyOn(client, 'query').mockReturnValue({ recordset: DUMMY_QUERY_RESULT });

    await plugin.executePooled(props, client);

    expect(props.mutableOutput.output).toEqual(DUMMY_QUERY_RESULT);
    expect(client.query).toBeCalledTimes(1);
  });

  it('execute query with invalid syntax', async () => {
    jest.spyOn(client, 'query').mockImplementation((query) => {
      throw new TypeError('Invalid syntax');
    });

    expect(props.mutableOutput.output).toEqual({});
    await expect(plugin.executePooled(props, client)).rejects.toThrow('Query failed: Invalid syntax');

    expect(props.mutableOutput.output).toEqual({});
    expect(client.query).toBeCalledTimes(1);
  });

  describe('update by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          newValues: {} // should be []
        },
        "Validation failed, Updated Rows is not an array. Given '{}'"
      ],
      [{ table: 'products', newValues: null }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        { table: 'products', newValues: 'asfd' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            client
          );
        }).rejects.toThrow(message);
        expect(client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', newValues: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          client
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(client, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          client
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });

    it('fails if there are no primary keys', async () => {
      jest.spyOn(client, 'query').mockImplementation(() => {
        return { recordset: [] };
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          client
        );
      }).rejects.toThrow('Table public.products has no primary keys');
      expect(client.query).toBeCalledTimes(1);
    });

    describe.each([
      [{ newValues: [null] }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ newValues: [undefined] }, "Validation failed, Updated Rows has a row that is not a plain object: 'undefined'"],
      [
        {
          newValues: [{ id: 'a1' }, new Promise((r) => r)]
        },
        'Validation failed, Updated Rows must not contain any empty rows. Given \'[{"id":"a1"},{}]\''
      ],
      [
        {
          newValues: [{ id: 'a1', asdf: true }]
        },
        'Column "asdf" doesn\'t exist in table [public].[products]'
      ],
      [
        {
          newValues: [
            { id: 'a1', price: 1234 },
            { id: 'a2', asdf: true }
          ]
        },
        'Column "asdf" doesn\'t exist in table [public].[products]'
      ],
      [
        {
          newValues: [{ price: 1000 }]
        },
        `Missing primary key column "id" in row: {"price":1000}`
      ],
      [
        {
          newValues: [{ id: 'a1' }]
        },
        `Couldn't detect any columns to update in the list of new rows`
      ],
      [
        {
          newValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ]
        },
        `Null is not allowed in primary key column "id" in row: {"id":null,"price":1234}`
      ],
      [
        {
          newValues: [{ id: '1234', price: 1234 }],
          mappingMode: 'manual' as const,
          // simulating bad input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedColumns: '' as any
        },
        `Query failed, manual mappings are not defined`
      ],
      [
        {
          newValues: [{ id: '1234', price: 1234 }],
          mappingMode: 'manual' as const,
          mappedColumns: [{ json: 'asdf', sql: 'asdf' }]
        },
        `Manual mapping failed because asdf is not a valid column in [products]`
      ]
    ])('invalid columns %o', (config, message) => {
      it('has expected error', async () => {
        jest
          .spyOn(client, 'query')
          .mockImplementationOnce(() => {
            // Primary keys
            return { recordset: [{ column_name: 'id', data_type: 'bigint' }] };
          })
          .mockImplementationOnce(() => {
            return {
              recordset: [
                { column_name: 'price', data_type: 'decimal' },
                { column_name: 'id', data_type: 'bigint' },
                { column_name: 'updated', data_type: 'datetime' }
              ]
            };
          });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                table: 'products',
                ...config
              }
            },
            client
          );
        }).rejects.toThrow(message);
      });
    });

    describe('transactions', () => {
      let queryStartPromise = makeTestablePromise();
      let queryResponsePromise = makeTestablePromise();
      let promise: Promise<undefined>;

      beforeEach(async () => {
        queryStartPromise = makeTestablePromise();
        queryResponsePromise = makeTestablePromise();
        jest.spyOn(client, 'query').mockImplementation(() => {
          queryStartPromise.resolver();
          return queryResponsePromise;
        });

        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [{ id: 'a1', price: 1000, name: 'new_name', max_name: 'max_name' }]
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.input).toHaveBeenLastCalledWith('PARAM_2', 'products');
        expect(client.query).toHaveBeenLastCalledWith(
          `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
  AND TABLE_SCHEMA = @PARAM_1
  AND TABLE_NAME = @PARAM_2;`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_PRIMARY_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenLastCalledWith('PARAM_2', 'products');
        expect(client.query).toHaveBeenLastCalledWith(SQL_SINGLE_TABLE_METADATA);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();
      });

      it('commits on success', async () => {
        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[name] nvarchar(12),
[max_name] nvarchar(MAX)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenCalledWith('PARAM_2', 1000);
        expect(client.input).toHaveBeenCalledWith('PARAM_3', 'new_name');
        expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 'max_name');
        expect(client.query).toHaveBeenLastCalledWith(`INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3, @PARAM_4)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 1, non_null: 1 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [price] = ##mocktablename.[price], [name] = ##mocktablename.[name], [max_name] = ##mocktablename.[max_name]
FROM ##mocktablename
WHERE [public].[products].[id] = ##mocktablename.[id];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('rolls back on failure during update step', async () => {
        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[name] nvarchar(12),
[max_name] nvarchar(MAX)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenCalledWith('PARAM_2', 1000);
        expect(client.input).toHaveBeenCalledWith('PARAM_3', 'new_name');
        expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 'max_name');
        expect(client.query).toHaveBeenLastCalledWith(`INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3, @PARAM_4)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 1, non_null: 1 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [price] = ##mocktablename.[price], [name] = ##mocktablename.[name], [max_name] = ##mocktablename.[max_name]
FROM ##mocktablename
WHERE [public].[products].[id] = ##mocktablename.[id];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error('Permissions failure of some kind'));
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow('Query failed, Permissions failure of some kind');
      });

      it('rolls back on permissions failure in CREATE TABLE', async () => {
        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[name] nvarchar(12),
[max_name] nvarchar(MAX)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error("User doesn't have permissions"));
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(`Query failed, User doesn't have permissions`);
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[name] nvarchar(12),
[max_name] nvarchar(MAX)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenCalledWith('PARAM_2', 1000);
        expect(client.input).toHaveBeenCalledWith('PARAM_3', 'new_name');
        expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 'max_name');
        expect(client.query).toHaveBeenLastCalledWith(`INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3, @PARAM_4)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 1, non_null: 0 }] });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because you provided 1 rows, but table [products] contains 0 matching rows'
        );
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[name] nvarchar(12),
[max_name] nvarchar(MAX)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenCalledWith('PARAM_2', 1000);
        expect(client.input).toHaveBeenCalledWith('PARAM_3', 'new_name');
        expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 'max_name');
        expect(client.query).toHaveBeenLastCalledWith(`INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3, @PARAM_4)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 2, non_null: 2 }] });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because the uniqueness constraint was not met by [products]. You provided 1 rows, and 2 rows were matched.'
        );
      });
    });
  });

  describe('update by any columns', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{}, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        { oldValues: 'asfd', newValues: [] },
        'Validation failed, list of Rows to Filter by must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ],
      [{ oldValues: {} }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ oldValues: null }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ oldValues: [] }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ oldValues: null, newValues: null }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ oldValues: [], newValues: {} }, "Validation failed, Updated Rows is not an array. Given '{}'"],
      [{ oldValues: [], newValues: null }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ oldValues: [], newValues: [] }, 'Query failed, no columns to filter by'],
      [
        { oldValues: [], newValues: 'asdf' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asdf"\'. Bindings {{}} are recommended.'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: null
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: [null]
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: 'asdf'
        },
        'Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: []
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: ['asdf']
        },
        `Can't filter using column asdf, that column name is missing in table products`
      ],
      [
        {
          oldValues: [{}],
          newValues: [{}, {}],
          filterBy: ['asdf']
        },
        "Validation failed, Rows to Filter by must not contain any empty rows. Given '[{}]'"
      ],
      [
        { oldValues: [{ id: 'a1' }], newValues: [null], filterBy: ['id'] },
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'
      ],
      [
        { oldValues: [{ id: 'a1' }], newValues: [undefined], filterBy: ['id'] },
        "Validation failed, Updated Rows has a row that is not a plain object: 'undefined'"
      ],
      [
        {
          // Invalid oldValues
          oldValues: [{ id: 'a1', asdf: true }],
          newValues: [{ id: 'a1', price: 1 }],
          filterBy: ['id']
        },
        'Column "asdf" doesn\'t exist in table [public].[products]'
      ],
      [
        {
          // Invalid newValues
          oldValues: [{ id: 'a1' }],
          newValues: [{ id: 'a1', asdf: true }],
          filterBy: ['id']
        },
        'Column "asdf" doesn\'t exist in table [public].[products]'
      ],
      [
        {
          oldValues: [{ price: 1000 }],
          newValues: [{ price: 1000, id: 'a1' }],
          filterBy: ['id']
        },
        `Missing filter column "id" in row: {"price":1000}`
      ],
      [
        {
          oldValues: [{ id: 'a1', price: 1000 }],
          newValues: [{ updated: '', price: 1000 }],
          filterBy: ['id', 'updated']
        },
        `Missing filter column "updated" in row: {"id":"a1","price":1000}`
      ],
      [
        {
          oldValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ],
          newValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ],
          filterBy: ['id']
        },
        `Null is not allowed in filter column "id" in row: {"id":null,"price":1234}`
      ],
      [
        {
          oldValues: [{ id: '1234' }],
          newValues: [{ id: '1234', price: 1234 }],
          filterBy: ['id'],
          mappingMode: 'manual' as const,
          // simulating bad input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedColumns: '' as any
        },
        `Query failed, manual mappings are not defined`
      ],
      [
        {
          oldValues: [{ id: '1234' }],
          newValues: [{ id: '1234', price: 1234 }],
          filterBy: ['id'],
          mappingMode: 'manual' as const,
          mappedColumns: [{ json: 'asdf', sql: 'asdf' }]
        },
        `Manual mapping failed because asdf is not a valid column in [products]`
      ]
    ])('invalid query %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(client, 'query').mockImplementationOnce(() => {
          return {
            recordset: [
              { column_name: 'price', data_type: 'bigint' },
              { column_name: 'id', data_type: 'bigint' },
              { column_name: 'updated', data_type: 'datetime' }
            ]
          };
        });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                useAdvancedMatching: 'advanced',
                table: 'products',
                ...config
              }
            },
            client
          );
        }).rejects.toThrow(message);
      });
    });

    describe('behavior in doUpdate transaction', () => {
      let queryStartPromise = makeTestablePromise();
      let queryResponsePromise = makeTestablePromise();
      let promise: Promise<undefined>;

      beforeEach(async () => {
        queryStartPromise = makeTestablePromise();
        queryResponsePromise = makeTestablePromise();
        jest.spyOn(client, 'query').mockImplementation(() => {
          queryStartPromise.resolver();
          return queryResponsePromise;
        });
      });

      it('commits on success', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // We want to test queries where the primary keys are modified
              oldValues: [
                { id: 'a1', price: 1000, name: 'old_name_1', dollars: 10.0 },
                { id: 'a2', price: 25, name: 'old_name_2', dollars: 0.25 }
              ],
              newValues: [
                { id: 'z5', price: 5, name: 'new_name_1', dollars: 0.05 },
                { id: 'a2', price: 20, name: 'new_name_2', dollars: 0.2 }
              ],
              filterBy: ['id', 'price']
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          recordset: [
            { column_name: 'price', data_type: 'bigint' },
            { column_name: 'price2', data_type: 'bigint' },
            { column_name: 'price22', data_type: 'bigint' },
            { column_name: 'id', data_type: 'bigint' },
            { column_name: 'id2', data_type: 'bigint' },
            { column_name: 'updated', data_type: 'datetime' },
            { column_name: 'name', data_type: 'varchar', max_length: 255 },
            { column_name: 'dollars', data_type: 'decimal', precision: 10, scale: 2 }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price] bigint,
[id22] bigint,
[price222] bigint,
[name2] varchar(255),
[dollars2] decimal(10,2)
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenLastCalledWith('PARAM_12', 0.2);
        expect(client.query).toHaveBeenLastCalledWith(
          `INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3, @PARAM_4, @PARAM_5, @PARAM_6),
(@PARAM_7, @PARAM_8, @PARAM_9, @PARAM_10, @PARAM_11, @PARAM_12)`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id], [price])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id] AND [public].[products].[price] = ##mocktablename.[price]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 2, non_null: 2 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [id] = ##mocktablename.[id22], [price] = ##mocktablename.[price222], [name] = ##mocktablename.[name2], [dollars] = ##mocktablename.[dollars2]
FROM ##mocktablename
WHERE [public].[products].[id] = ##mocktablename.[id] AND [public].[products].[price] = ##mocktablename.[price];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('commits on success where oldValues only has id and newValues only has updates', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // No schema overlap
              oldValues: JSON.stringify([{ id: 'a1' }, { id: 'a2' }]),
              newValues: JSON.stringify([{ price: 5 }, { price: 10 }]),
              filterBy: JSON.stringify(['id'])
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price2] bigint
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 10);
        expect(client.query).toHaveBeenLastCalledWith(
          `INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2),
(@PARAM_3, @PARAM_4)`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 2, non_null: 2 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [price] = ##mocktablename.[price2]
FROM ##mocktablename
WHERE [public].[products].[id] = ##mocktablename.[id];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('automatically escapes special chars', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // We want to test queries where the primary keys are modified
              mappingMode: 'auto',
              oldValues: [
                { userId: 'a1', 'with spaces': 1000 },
                { userId: 'a2', 'with spaces': 25 }
              ],
              newValues: [
                { userId: 'z5', 'with spaces': 5 },
                { userId: 'a2', 'with spaces': 20 }
              ],
              filterBy: ['userId']
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          recordset: [
            { column_name: 'with spaces', data_type: 'bigint' },
            { column_name: 'userId', data_type: 'bigint' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[userId] bigint,
[userId2] bigint,
[with spaces2] bigint
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.input).toHaveBeenLastCalledWith('PARAM_6', 20);
        expect(client.query).toHaveBeenLastCalledWith(
          `INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2, @PARAM_3),
(@PARAM_4, @PARAM_5, @PARAM_6)`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([userId])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[userId]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[userId] = ##mocktablename.[userId]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 2, non_null: 2 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [userId] = ##mocktablename.[userId2], [with spaces] = ##mocktablename.[with spaces2]
FROM ##mocktablename
WHERE [public].[products].[userId] = ##mocktablename.[userId];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('succeeds when mapping columns values', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // No schema overlap
              oldValues: JSON.stringify([{ id: 'a1' }, { id: 'a2' }]),
              newValues: JSON.stringify([{ customColumn: 1234 }, { customColumn: 987 }]),
              filterBy: JSON.stringify(['id']),
              mappingMode: 'manual',
              mappedColumns: [
                {
                  json: 'id',
                  sql: 'id'
                },
                {
                  json: 'customColumn',
                  sql: 'price'
                }
              ]
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE TABLE ##mocktablename
(
[id] bigint,
[price2] bigint
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        // expect(client.input).toHaveBeenLastCalledWith('PARAM_4', 987);
        expect(client.query).toHaveBeenLastCalledWith(
          `INSERT INTO ##mocktablename VALUES (@PARAM_1, @PARAM_2),
(@PARAM_3, @PARAM_4)`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`CREATE INDEX mocktablename_idx ON ##mocktablename ([id])`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE STATISTICS ##mocktablename`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as [count], COUNT([public].[products].[id]) as [non_null] FROM ##mocktablename
LEFT JOIN [public].[products] ON [public].[products].[id] = ##mocktablename.[id]`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ recordset: [{ count: 2, non_null: 2 }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(`UPDATE [public].[products]
SET [price] = ##mocktablename.[price2]
FROM ##mocktablename
WHERE [public].[products].[id] = ##mocktablename.[id];`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('throws a validation error if manual mapping is missing filters', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              mappingMode: 'manual',
              oldValues: [
                { userId: 'a1', price: 1000 },
                { userId: 'a2', price: 25 }
              ],
              newValues: [
                { userId: 'z5', price: 5 },
                { userId: 'a2', price: 20 }
              ],
              filterBy: ['userId'],
              mappedColumns: [
                {
                  json: 'p',
                  sql: 'price'
                }
              ]
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          recordset: [
            { column_name: 'price', data_type: 'bigint' },
            { column_name: 'userId', data_type: 'bigint' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(`Can't filter by "userId" because it's missing in the column mapping`);
      });

      it('throws a validation error if filters are duplicated', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              mappingMode: 'auto',
              oldValues: [
                { id: 'a1', price: 1000 },
                { id: 'a1', price: 25 }
              ],
              newValues: [
                { id: 'a2', price: 5 },
                { id: 'a2', price: 20 }
              ],
              filterBy: ['id']
            }
          },
          client
        );

        await queryStartPromise;
        expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('SYS.TABLES'));
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          recordset: [
            { column_name: 'price', data_type: 'bigint' },
            { column_name: 'id', data_type: 'bigint' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(`Some rows are duplicates, found ["a1"]`);
      });
    });
  });

  describe('insert by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          newValues: {} // should be []
        },
        "Validation failed, Updated Rows is not an array. Given '{}'"
      ],
      [{ table: 'products', newValues: null }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        { table: 'products', newValues: 'asfd' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            client
          );
        }).rejects.toThrow(message);
        expect(client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', insertedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          client
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(client, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              insertedRows: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          client
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });
  });

  describe('delete by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          deletedRows: {} // should be []
        },
        "Validation failed, Deleted Rows is not an array. Given '{}'"
      ],
      [
        { table: 'products', deletedRows: null },
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'
      ],
      [
        { table: 'products', deletedRows: 'asfd' },
        'Validation failed, list of Deleted Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            client
          );
        }).rejects.toThrow(message);
        expect(client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', deletedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          client
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(client, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              deletedRows: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          client
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });
  });
});
