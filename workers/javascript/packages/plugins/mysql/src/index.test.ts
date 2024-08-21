import {
  ClientWrapper,
  Column,
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ExecutionOutput,
  MySQLActionConfiguration,
  MySQLDatasourceConfiguration,
  PluginExecutionProps,
  SqlOperations
} from '@superblocks/shared';

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

import mariadb from 'mariadb';
import { Client as ssh2Client } from 'ssh2';
jest.mock('mariadb');

import MySQLPlugin from '.';

const plugin: MySQLPlugin = new MySQLPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };
plugin.getTempTableName = jest.fn().mockReturnValue('`mocktablename`');

const datasourceConfiguration = DUMMY_DB_DATASOURCE_CONFIGURATION as MySQLDatasourceConfiguration;
const actionConfiguration = {
  ...DUMMY_ACTION_CONFIGURATION,
  operation: SqlOperations.RUN_SQL
};
const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<MySQLDatasourceConfiguration, MySQLActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

const MOCK_PRIMARY_COLUMNS_FOR_UPDATE = [{ column_name: 'id', data_type: 'uuid' }];
const MOCK_ALL_COLUMNS_FOR_UPDATE = [
  { column_name: 'price', data_type: 'int4' },
  { column_name: 'id', data_type: 'uuid' },
  { column_name: 'updated', data_type: 'datetime' }
];

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

describe('MySQL Plugin', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientWrapper: ClientWrapper<any, ssh2Client> = {
    client,
    tunnel: null
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = mariadb;

  beforeEach(async () => {
    clientWrapper.client = {
      query: jest.fn()
    } as unknown as mariadb.Connection;
    props.mutableOutput = new ExecutionOutput();
  });

  afterEach(() => {
    // Only works with jest.spyOn()
    jest.restoreAllMocks();
    clientWrapper.client?.query?.mockReset?.();
  });

  it('test connection', async () => {
    const connection = {
      connect: () => undefined,
      on: () => undefined,
      query: jest.fn().mockImplementation((): void => undefined)
    };
    const clientWrapper = {
      client: connection,
      tunnel: null
    };
    jest.spyOn(db, 'createConnection').mockImplementation(() => clientWrapper.client);

    await plugin.test(datasourceConfiguration);

    expect(clientWrapper.client.query).toBeCalledTimes(1);
  });

  it('get metadata', async () => {
    const TABLES_RESULT = [
      {
        name: 'id',
        column_type: 'int(11)',
        table_name: 'orders'
      },
      {
        name: 'user_id',
        column_type: 'int(11)',
        table_name: 'orders'
      }
    ];

    const KEYS_RESULT = [
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
    ];

    const connection = {
      connect: () => undefined,
      on: () => undefined,
      query: jest.fn().mockReturnValueOnce(TABLES_RESULT).mockReturnValueOnce(KEYS_RESULT)
    };
    const clientWrapper = {
      client: connection,
      tunnel: null
    };
    jest.spyOn(db, 'createConnection').mockImplementation(() => clientWrapper.client);

    const res = await plugin.metadata(datasourceConfiguration);

    expect(res.dbSchema?.tables[0]).toEqual({
      name: 'orders',
      type: 'TABLE',
      columns: [new Column('id', 'int(11)'), new Column('user_id', 'int(11)')],
      keys: [{ name: 'orders', type: 'primary key', columns: ['id', 'user_id'] }],
      templates: []
    });
    expect(clientWrapper.client.query).toBeCalledTimes(2);
  });

  it('execute query', async () => {
    jest.spyOn(clientWrapper.client, 'query').mockReturnValue(DUMMY_QUERY_RESULT);

    await plugin.executePooled(props, clientWrapper);

    expect(props.mutableOutput.output).toEqual(DUMMY_QUERY_RESULT);
    expect(clientWrapper.client.query).toBeCalledTimes(1);
  });

  it('execute query with invalid syntax', async () => {
    jest.spyOn(clientWrapper.client, 'query').mockImplementation((query) => {
      throw new TypeError('Invalid syntax');
    });

    expect(props.mutableOutput.output).toEqual({});
    await expect(plugin.executePooled(props, clientWrapper)).rejects.toThrow('Query failed: Invalid syntax');

    expect(props.mutableOutput.output).toEqual({});
    expect(clientWrapper.client.query).toBeCalledTimes(1);
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
      [
        { table: 'products', newValues: 'asfd' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

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
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', newValues: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
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
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });

    it('fails if there are no primary keys', async () => {
      jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
        return [];
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
          clientWrapper
        );
      }).rejects.toThrow('Table public.products has no primary keys');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
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
        'Column "asdf" doesn\'t exist in table `public`.`products`'
      ],
      [
        {
          newValues: [
            { id: 'a1', price: 1234 },
            { id: 'a2', asdf: true }
          ]
        },
        'Column "asdf" doesn\'t exist in table `public`.`products`'
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
        `Manual mapping failed because asdf is not a valid column in \`products\``
      ]
    ])('invalid columns %o', (config, message) => {
      it('has expected error', async () => {
        jest
          .spyOn(clientWrapper.client, 'query')
          .mockImplementationOnce(() => {
            // Primary keys
            return [{ column_name: 'id', data_type: 'uuid' }];
          })
          .mockImplementationOnce(() => {
            return [
              { column_name: 'price', data_type: 'int4' },
              { column_name: 'id', data_type: 'uuid' },
              { column_name: 'updated', data_type: 'datetime' }
            ];
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
            clientWrapper
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
        jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
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
              newValues: [{ id: 'a1', price: 1000 }]
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = ?
AND TABLE_NAME = ?
AND CONSTRAINT_NAME = 'PRIMARY'
ORDER BY ORDINAL_POSITION;`,
          ['public', 'products']
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_PRIMARY_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `SELECT COLUMN_NAME as 'column_name', COLUMN_TYPE as 'data_type'
FROM information_schema.columns
WHERE table_schema = ?
AND table_name = ?;`,
          ['public', 'products']
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
      });

      it('commits on success', async () => {
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`INSERT INTO \`mocktablename\` VALUES (?, ?)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 1, non_null: 1 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price\`
WHERE \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('rolls back on failure during update step', async () => {
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`INSERT INTO \`mocktablename\` VALUES (?, ?)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 1, non_null: 1 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price\`
WHERE \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error('Permissions failure of some kind'));
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow('Query failed, Permissions failure of some kind');
      });

      it('rolls back on permissions failure in CREATE TEMPORARY TABLE', async () => {
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error("User doesn't have permissions"));
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(`Query failed, User doesn't have permissions`);
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`INSERT INTO \`mocktablename\` VALUES (?, ?)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 1, non_null: 0 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because you provided 1 rows, but table `products` contains 0 matching rows'
        );
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`INSERT INTO \`mocktablename\` VALUES (?, ?)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 2, non_null: 2 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because the uniqueness constraint was not met by `products`. You provided 1 rows, and 2 rows were matched.'
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
      [{ oldValues: {}, insertedRows: [] }, "Validation failed, Rows to Filter by is not an array. Given '{}'"],
      [{ oldValues: null, newValues: [] }, "Validation failed, Rows to Filter by is not an array. Given 'null'"],
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
        'Column "asdf" doesn\'t exist in table `public`.`products`'
      ],
      [
        {
          // Invalid newValues
          oldValues: [{ id: 'a1' }],
          newValues: [{ id: 'a1', asdf: true }],
          filterBy: ['id']
        },
        'Column "asdf" doesn\'t exist in table `public`.`products`'
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
        `Manual mapping failed because asdf is not a valid column in \`products\``
      ]
    ])('invalid query %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementationOnce(() => {
          return [
            { column_name: 'price', data_type: 'int4' },
            { column_name: 'id', data_type: 'uuid' },
            { column_name: 'updated', data_type: 'datetime' }
          ];
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
            clientWrapper
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
        jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
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
                { id: 'a1', price: 1000 },
                { id: 'a2', price: 25 }
              ],
              newValues: [
                { id: 'z5', price: 5 },
                { id: 'a2', price: 20 }
              ],
              filterBy: ['id', 'price']
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([
          { column_name: 'price', data_type: 'int4' },
          { column_name: 'price2', data_type: 'int4' },
          { column_name: 'price22', data_type: 'int4' },
          { column_name: 'id', data_type: 'uuid' },
          { column_name: 'id2', data_type: 'uuid' },
          { column_name: 'updated', data_type: 'datetime' }
        ]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price\` int4,
\`id22\` uuid,
\`price222\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `INSERT INTO \`mocktablename\` VALUES (?, ?, ?, ?),
(?, ?, ?, ?)`,
          ['a1', 1000, 'z5', 5, 'a2', 25, 'a2', 20]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`, \`price\`)`
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\` AND \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 2, non_null: 2 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id22\`, \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price222\`
WHERE \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\` AND \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

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
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price2\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `INSERT INTO \`mocktablename\` VALUES (?, ?),
(?, ?)`,
          ['a1', 5, 'a2', 10]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 2, non_null: 2 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price2\`
WHERE \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

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
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([
          { column_name: 'with spaces', data_type: 'int4' },
          { column_name: 'userId', data_type: 'uuid' },
          { column_name: 'updated', data_type: 'datetime' }
        ]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`userId\` uuid,
\`userId2\` uuid,
\`with spaces2\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `INSERT INTO \`mocktablename\` VALUES (?, ?, ?),
(?, ?, ?)`,
          ['a1', 'z5', 5, 'a2', 'a2', 20]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`userId\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`userId\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`userId\` = \`mocktablename\`.\`userId\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 2, non_null: 2 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`userId\` = \`mocktablename\`.\`userId2\`, \`public\`.\`products\`.\`with spaces\` = \`mocktablename\`.\`with spaces2\`
WHERE \`public\`.\`products\`.\`userId\` = \`mocktablename\`.\`userId\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

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
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE \`mocktablename\`
(
\`id\` uuid,
\`price2\` int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(
          `INSERT INTO \`mocktablename\` VALUES (?, ?),
(?, ?)`,
          ['a1', 1234, 'a2', 987]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`CREATE INDEX \`mocktablename_idx\` ON \`mocktablename\` (\`id\`)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`ANALYZE TABLE \`mocktablename\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as \`count\`, COUNT(\`public\`.\`products\`.\`id\`) as \`non_null\` FROM \`mocktablename\`
LEFT JOIN \`public\`.\`products\` ON \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\``);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([{ count: 2, non_null: 2 }]);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`UPDATE \`public\`.\`products\`, \`mocktablename\`
SET \`public\`.\`products\`.\`price\` = \`mocktablename\`.\`price2\`
WHERE \`public\`.\`products\`.\`id\` = \`mocktablename\`.\`id\`;`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

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
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([
          { column_name: 'price', data_type: 'int4' },
          { column_name: 'userId', data_type: 'uuid' },
          { column_name: 'updated', data_type: 'datetime' }
        ]);
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
          clientWrapper
        );

        await queryStartPromise;
        expect(clientWrapper.client.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver([
          { column_name: 'price', data_type: 'int4' },
          { column_name: 'id', data_type: 'uuid' },
          { column_name: 'updated', data_type: 'datetime' }
        ]);
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
          insertedRows: {} // should be []
        },
        "Validation failed, Inserted Rows is not an array. Given '{}'"
      ],
      [
        { table: 'products', insertedRows: 'asfd' },
        'Validation failed, list of Inserted Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

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
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', insertedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
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
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
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
        { table: 'products', deletedRows: 'asfd' },
        'Validation failed, list of Deleted Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

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
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', deletedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(clientWrapper.client, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(clientWrapper.client, 'query').mockImplementation(() => {
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
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });
  });
});
