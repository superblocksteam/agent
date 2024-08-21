import path from 'path';
import { CosmosClient } from '@azure/cosmos';
import {
  CosmosDbActionConfiguration,
  CosmosDbDatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate
} from '@superblocks/shared';
import { AuthCommonV1, CosmosDbPluginV1 } from '@superblocksteam/types/src/plugins';
import { Plugin } from '@superblocksteam/types/src/plugins/cosmosdb/v1/plugin_pb';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import CosmosDbPlugin from '.';

// THESE TESTS SHOULD ONLY BE RUN
// 1. DURING LOCAL DEVELOPMENT
// 2. (TODO - joey) during a daily CI deploy
// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.LOCAL_DEV; // safeguard to prevent running these tests in CI

const HOST = process.env.HOST || '';
const PORT = process.env.PORT || 0;
const DATABASE_ID = process.env.DATABASE_ID || '';
const MASTER_KEY = process.env.MASTER_KEY || '';
const CONTAINER_1_ID = process.env.CONTAINER_1_ID || '';
const CONTAINER_2_ID = process.env.CONTAINER_2_ID || '';
const CONTAINER_1_PARTITION_KEY = process.env.CONTAINER_1_PARTITION_KEY || '';
const CONTAINER_2_PARTITION_KEY = process.env.CONTAINER_2_PARTITION_KEY || '';
const PARTITION_KEY_VALUE_1 = `${CONTAINER_1_PARTITION_KEY}-1`;
const PARTITION_KEY_VALUE_2 = `${CONTAINER_1_PARTITION_KEY}-2`;

// used to inspect the state of the DB
let cosmosClient: CosmosClient;
let DEFAULT_DB_STATE;

const runTests = LOCAL_DEV ? describe : describe.skip;

// helper test functions
async function resetDatabase(): Promise<void> {
  const database = cosmosClient.database(DATABASE_ID);
  const container = database.container(CONTAINER_1_ID);

  // Delete all documents in the container
  const querySpec = {
    query: `SELECT * FROM c`
  };

  const { resources: documents } = await container.items.query(querySpec).fetchAll();

  for (const document of documents) {
    try {
      await container.item(document.id, document[CONTAINER_1_PARTITION_KEY]).delete();
    } catch (e) {
      console.error(
        `failed to delete item with id ${document.id}, partition key: ${document[CONTAINER_1_PARTITION_KEY]}: ${e.body.message}`
      );
      throw e;
    }
  }

  const initialState = [
    {
      id: 'document1',
      [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
      age: 30,
      city: 'New York'
    },
    {
      id: 'document2',
      [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
      age: 25,
      city: 'Los Angeles'
    },
    {
      id: 'document3',
      [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_2,
      age: 35,
      city: 'Chicago'
    },
    {
      id: 'document4',
      age: 55,
      city: 'Paris'
    }
  ];

  for (const item of initialState) {
    try {
      await container.items.create(item);
    } catch (e) {
      console.error(`failed to create item with id ${item.id}, partition key: ${document[CONTAINER_1_PARTITION_KEY]}: ${e.body.message}`);
      throw e;
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAllData(): Promise<any[]> {
  const database = cosmosClient.database(DATABASE_ID);
  const container = database.container(CONTAINER_1_ID);

  const querySpec = {
    query: `SELECT * FROM c`
  };
  const { resources: documents } = await container.items.query(querySpec).fetchAll();

  // Remove specified keys from each document and log the partition key
  const filteredDocuments = documents.map((document) => {
    for (const key of ['_attachments', '_etag', '_rid', '_self', '_ts']) {
      delete document[key];
    }
    return document;
  });

  return filteredDocuments;
}

async function assertDbStateHasNotChanged(): Promise<void> {
  // checks that the db state is the same as before any test
  expect(await getAllData()).toEqual(DEFAULT_DB_STATE);
}

const __DELETED_ITEM__ = Symbol('DELETED_ITEM');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertDbStateWithChanges(changes: Record<string, typeof __DELETED_ITEM__ | Record<string, any>>): Promise<void> {
  // Clone the default database state to work with
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataWithChanges: Array<Record<string, any>> = cloneDeep(DEFAULT_DB_STATE);

  // Iterate through the changes and apply them to the cloned data
  for (const [id, value] of Object.entries(changes)) {
    if (value === __DELETED_ITEM__) {
      // If the value is the remove symbol, find and remove the entry
      const indexToRemove = dataWithChanges.findIndex((item) => item.id === id);
      if (indexToRemove !== -1) {
        dataWithChanges.splice(indexToRemove, 1);
      }
    } else {
      // Update the data with the new value, assuming 'id' as the key field
      const indexToUpdate = dataWithChanges.findIndex((item) => item.id === id);
      if (indexToUpdate !== -1) {
        // Update existing entry
        dataWithChanges[indexToUpdate] = { ...dataWithChanges[indexToUpdate], ...value };
      } else {
        // Add new entry if the key does not exist
        dataWithChanges.push({ id, ...value });
      }
    }
  }
  // Compare the modified data with the actual database state (getAllData())
  expect(dataWithChanges).toEqual(await getAllData());
}

function buildPropsWithActionConfiguration(
  actionConfiguration: CosmosDbActionConfiguration
): PluginExecutionProps<CosmosDbDatasourceConfiguration, CosmosDbActionConfiguration> {
  return {
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  } as PluginExecutionProps<CosmosDbDatasourceConfiguration, CosmosDbActionConfiguration>;
}

const plugin: CosmosDbPlugin = new CosmosDbPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  connection: CosmosDbPluginV1.Plugin_CosmosDbConnection.fromJson({
    host: HOST,
    port: PORT,
    databaseId: DATABASE_ID,
    auth: {
      key: {
        masterKey: MASTER_KEY
      }
    }
  }),
  name: 'CosmosDB Plugin Tests'
} as CosmosDbDatasourceConfiguration;

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

beforeAll(async () => {
  cosmosClient = new CosmosClient({
    endpoint: HOST,
    key: MASTER_KEY
  });
});

beforeEach(async () => {
  await resetDatabase();
  // used for easy assertion to ensure that the state of the DB has not changed
  DEFAULT_DB_STATE = await getAllData();
});

runTests('connection', () => {
  test('connection succeeds with basic config [FIELDS]', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('connection fails with bad host [FIELDS]', async () => {
    const badDatasourceConfiguration = {
      connection: CosmosDbPluginV1.Plugin_CosmosDbConnection.fromJson({
        host: 'im_a_bad_host',
        port: PORT,
        databaseId: DATABASE_ID,
        auth: {
          key: {
            masterKey: MASTER_KEY
          }
        }
      }),
      auth: AuthCommonV1.Auth.fromJson({
        key: {
          masterKey: MASTER_KEY
        }
      }),
      name: 'CosmosDB Plugin Tests'
    } as CosmosDbDatasourceConfiguration;

    await expect(async () => {
      await plugin.test(badDatasourceConfiguration);
    }).rejects.toThrowError(
      /CosmosDB test connection failed: failed to create CosmosDbPlugin connection: TypeError: Invalid URL: im_a_bad_host/
    );
  });

  test('connection fails with bad master key [FIELDS]', async () => {
    const badDatasourceConfiguration = {
      connection: CosmosDbPluginV1.Plugin_CosmosDbConnection.fromJson({
        host: HOST,
        port: PORT,
        databaseId: DATABASE_ID,
        auth: {
          key: {
            masterKey: 'im a bad master key'
          }
        }
      }),
      name: 'CosmosDB Plugin Tests'
    } as CosmosDbDatasourceConfiguration;

    await expect(async () => {
      await plugin.test(badDatasourceConfiguration);
    }).rejects.toThrowError(
      /CosmosDB test connection failed: The input authorization token can't serve the request. The wrong key is being used or the expected payload is not built as per the protocol./
    );
  });
});

runTests('sql command', () => {
  test('command succeeds for cross partition query', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        sql: {
          singleton: {
            containerId: CONTAINER_1_ID,
            query: `SELECT * FROM c`,
            crossPartition: true
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document1',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 30,
        city: 'New York'
      },
      {
        id: 'document2',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 25,
        city: 'Los Angeles'
      },
      {
        id: 'document3',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_2,
        age: 35,
        city: 'Chicago'
      },
      {
        id: 'document4',
        age: 55,
        city: 'Paris'
      }
    ]);
    expect(newProps.mutableOutput.log).toEqual(['Cross-partition enabled.', `Query: SELECT * FROM c`]);
    await assertDbStateHasNotChanged();
  });

  test('command succeeds with partition given', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        sql: {
          singleton: {
            containerId: CONTAINER_1_ID,
            query: `SELECT * FROM c`,
            crossPartition: false,
            partitionKey: PARTITION_KEY_VALUE_1
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document1',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 30,
        city: 'New York'
      },
      {
        id: 'document2',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 25,
        city: 'Los Angeles'
      }
    ]);
    expect(newProps.mutableOutput.log).toEqual([`Using partition key: ${PARTITION_KEY_VALUE_1}`, `Query: SELECT * FROM c`]);
    await assertDbStateHasNotChanged();
  });

  test('invalid sql query fails', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        sql: {
          singleton: {
            containerId: CONTAINER_1_ID,
            query: 'im a bad query',
            crossPartition: true
          }
        }
      }) as CosmosDbActionConfiguration
    );
    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/Error executing query:/);
    await assertDbStateHasNotChanged();
  });
});

runTests('structured read', () => {
  test('finds item [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          read: {
            id: 'document1',
            partitionKey: PARTITION_KEY_VALUE_1
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document1',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 30,
        city: 'New York'
      }
    ]);
    await assertDbStateHasNotChanged();
  });

  test('finds item [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          read: {
            id: 'document4',
            partitionKey: ''
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document4',
        age: 55,
        city: 'Paris'
      }
    ]);
    await assertDbStateHasNotChanged();
  });

  test('does not find item', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          read: {
            id: 'i dont exist'
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([]);
    await assertDbStateHasNotChanged();
  });
});

runTests('structured replace', () => {
  test('replaces item [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          replace: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: JSON.stringify({
              id: 'document1',
              [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
              age: 31,
              city: 'New New York'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document1',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 31,
        city: 'New New York'
      }
    ]);
    await assertDbStateWithChanges({
      document1: {
        id: 'document1',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 31,
        city: 'New New York'
      }
    });
  });

  test('replaces item [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          replace: {
            partitionKey: '',
            body: JSON.stringify({
              id: 'document4',
              age: 65,
              city: 'New Paris'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document4',
        age: 65,
        city: 'New Paris'
      }
    ]);
    await assertDbStateWithChanges({
      document4: {
        id: 'document4',
        age: 65,
        city: 'New Paris'
      }
    });
  });

  test('cannot find item', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          replace: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: JSON.stringify({
              id: 'i dont exist',
              [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
              age: 31,
              city: 'New New York'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/Replace operation failed: Entity with the specified id does not exist in the system/);
    await assertDbStateHasNotChanged();
  });

  test('malformed JSON body', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          replace: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: 'im a bad body'
          }
        }
      }) as CosmosDbActionConfiguration
    );
    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/Unexpected token/);
    await assertDbStateHasNotChanged();
  });

  test('JSON list instead of single item', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          replace: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: JSON.stringify([{ foo: 'bar' }])
          }
        }
      }) as CosmosDbActionConfiguration
    );
    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/CosmosDB expected single JSON object, received array/);
    await assertDbStateHasNotChanged();
  });
});

runTests('structured upsert', () => {
  test('adds item that does not exist [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          upsert: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: JSON.stringify({
              id: 'document5',
              [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
              age: 26,
              city: 'Green Bay'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document5',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 26,
        city: 'Green Bay'
      }
    ]);
    await assertDbStateWithChanges({
      document5: {
        id: 'document5',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 26,
        city: 'Green Bay'
      }
    });
  });

  test('adds item that does not exist [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          upsert: {
            partitionKey: '',
            body: JSON.stringify({
              id: 'document5',
              age: 26,
              city: 'Green Bay'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document5',
        age: 26,
        city: 'Green Bay'
      }
    ]);
    await assertDbStateWithChanges({
      document5: {
        id: 'document5',
        age: 26,
        city: 'Green Bay'
      }
    });
  });

  test('updates item that already exists [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          upsert: {
            partitionKey: PARTITION_KEY_VALUE_2,
            body: JSON.stringify({
              id: 'document3',
              [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_2,
              age: 36,
              city: 'NEW Chicago'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document3',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_2,
        age: 36,
        city: 'NEW Chicago'
      }
    ]);
    await assertDbStateWithChanges({
      document3: {
        id: 'document3',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_2,
        age: 36,
        city: 'NEW Chicago'
      }
    });
  });

  test('updates item that already exists [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          upsert: {
            partitionKey: '',
            body: JSON.stringify({
              id: 'document4',
              age: 36,
              city: 'NEW Chicago'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document4',
        age: 36,
        city: 'NEW Chicago'
      }
    ]);
    await assertDbStateWithChanges({
      document4: {
        id: 'document4',
        age: 36,
        city: 'NEW Chicago'
      }
    });
  });

  test('fails when trying to add item that does not exist because partition key value is not in body [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          upsert: {
            partitionKey: PARTITION_KEY_VALUE_1,
            body: JSON.stringify({
              id: 'document5',
              age: 26,
              city: 'Green Bay'
            })
          }
        }
      }) as CosmosDbActionConfiguration
    );
    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(
      /Upsert operation failed: CosmosDB Given partition key value does not match the body's partition key value STATUS CODE: 400, SUBSTATUS: 1001/
    );
    await assertDbStateHasNotChanged();
  });
});

runTests('structured delete', () => {
  test('delete item that already exists [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          delete: {
            id: 'document1',
            partitionKey: PARTITION_KEY_VALUE_1
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual({});
    await assertDbStateWithChanges({
      document1: __DELETED_ITEM__
    });
  });

  test('delete item that already exists [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          delete: {
            id: 'document4',
            partitionKey: ''
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual({});
    await assertDbStateWithChanges({
      document4: __DELETED_ITEM__
    });
  });

  test('fails to delete item that does not exist [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          delete: {
            id: 'i do not exist',
            partitionKey: PARTITION_KEY_VALUE_1
          }
        }
      }) as CosmosDbActionConfiguration
    );

    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/Delete operation failed: Entity with the specified id does not exist in the system/);
    await assertDbStateHasNotChanged();
  });

  test('fails to delete item that does not exist [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          delete: {
            partitionKey: '',
            id: 'i do not exist'
          }
        }
      }) as CosmosDbActionConfiguration
    );

    await expect(async () => {
      await plugin.execute(newProps);
    }).rejects.toThrowError(/Delete operation failed: Entity with the specified id does not exist in the system/);
    await assertDbStateHasNotChanged();
  });
});

runTests('structured create', () => {
  test('create item [PARTITION KEY GIVEN]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          create: {
            body: JSON.stringify({
              id: 'document5',
              [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
              age: 26,
              city: 'Green Bay'
            }),
            partitionKey: PARTITION_KEY_VALUE_1
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document5',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 26,
        city: 'Green Bay'
      }
    ]);
    await assertDbStateWithChanges({
      document5: {
        id: 'document5',
        [CONTAINER_1_PARTITION_KEY]: PARTITION_KEY_VALUE_1,
        age: 26,
        city: 'Green Bay'
      }
    });
  });

  test('create item [PARTITION KEY GIVEN AS EMPTY STRING]', async () => {
    const newProps = buildPropsWithActionConfiguration(
      Plugin.fromJson({
        point_operation: {
          containerId: CONTAINER_1_ID,
          create: {
            body: JSON.stringify({
              id: 'document5',
              age: 26,
              city: 'Green Bay'
            }),
            partitionKey: ''
          }
        }
      }) as CosmosDbActionConfiguration
    );
    const resp = await plugin.execute(newProps);
    expect(resp.output).toEqual([
      {
        id: 'document5',
        age: 26,
        city: 'Green Bay'
      }
    ]);
    await assertDbStateWithChanges({
      document5: {
        id: 'document5',
        age: 26,
        city: 'Green Bay'
      }
    });
  });
});

runTests('get single json body', () => {
  test('valid single json item with escape strings', async () => {
    // eslint-disable-next-line no-useless-escape
    const resp = plugin.getValidateSingleJsonItem(`{\"id\": \"21\", \"partitionKey\": \"abc\"}`);
    expect(resp).toEqual({
      id: '21',
      partitionKey: 'abc'
    });
  });

  test('valid single json item without escape strings', async () => {
    const resp = plugin.getValidateSingleJsonItem('{"id": "21", "partitionKey": "abc"}');
    expect(resp).toEqual({
      id: '21',
      partitionKey: 'abc'
    });
  });

  test('valid json list errors', async () => {
    await expect(async () => {
      plugin.getValidateSingleJsonItem('[{"id": "21", "partitionKey": "abc"}]');
    }).rejects.toThrowError(/CosmosDB expected single JSON object, received array/);
  });

  test('invalid single json item errors', async () => {
    await expect(async () => {
      plugin.getValidateSingleJsonItem('{"id"}');
    }).rejects.toThrowError();
  });
});

runTests('metadata', () => {
  test('metadata has correct body', async () => {
    const resp = await plugin.metadata(datasourceConfiguration);
    expect(resp.cosmosdb?.toJson()).toEqual({
      containers: [
        {
          id: CONTAINER_1_ID,
          partitionKey: { kind: 'Hash', paths: [`/${CONTAINER_1_PARTITION_KEY}`], version: 0 }
        },
        {
          id: CONTAINER_2_ID,
          partitionKey: { kind: 'Hash', paths: [`/${CONTAINER_2_PARTITION_KEY}`], version: 0 }
        }
      ]
    });
  });
});
