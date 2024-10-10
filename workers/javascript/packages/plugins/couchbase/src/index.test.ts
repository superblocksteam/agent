import {
  CouchbaseDatasourceConfiguration,
  CouchbaseActionConfiguration,
  ExecutionOutput,
  ClientWrapper,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
} from '@superblocks/shared';
import { expect, it } from '@jest/globals';

import { Client as ssh2Client } from 'ssh2';

import * as couchbaseClient from 'couchbase';

import CouchbasePlugin from '.';
import {
  CollectionManager,
  QueryMetaData,
  GetResult,
  Bucket,
  MutationResult,
  InsertOptions,
  Scope,
  ScopeSpec,
  QueryResult,
  StreamableRowPromise,
  Cluster,
  NodeCallback,
  ConnectOptions,
  GetOptions,
  RemoveOptions
} from 'couchbase';

jest.mock('couchbase');

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

function propsFromConfigs({
  actionConfiguration,
  datasourceConfiguration
}: {
  actionConfiguration: CouchbaseActionConfiguration;
  datasourceConfiguration: CouchbaseDatasourceConfiguration;
}): any {
  return {
    context: DUMMY_EXECUTION_CONTEXT,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  };
}

let plugin: CouchbasePlugin;

function mockClient({
  connectFn,
  queryFn,
  insertFn,
  getFn,
  removeFn,
  getAllBucketsFn,
  mockBucketCalls = []
}: {
  connectFn?: (connStr: string, options?: ConnectOptions, callback?: NodeCallback<Cluster>) => Promise<Cluster>;
  queryFn?: (statement: string, options?: any) => StreamableRowPromise<QueryResult, any, QueryMetaData>;
  insertFn?: (key: string, value: any, options?: InsertOptions, callback?: NodeCallback<MutationResult>) => Promise<MutationResult>;
  getFn?: (key: string, options?: GetOptions, callback?: NodeCallback<GetResult>) => Promise<GetResult>;
  removeFn?: (key: string, options?: RemoveOptions, callback?: NodeCallback<MutationResult>) => Promise<MutationResult>;
  getAllBucketsFn?: () => any;
  mockBucketCalls?: { collectionManagerScopeSpecs: ScopeSpec[] }[];
}): {
  client: ClientWrapper<Cluster, ssh2Client>;
  queryMock: jest.Mock;
  getAllBucketsMock: jest.Mock;
  bucketMock: jest.Mock;
  insertMock: jest.Mock;
  getMock: jest.Mock;
  removeMock: jest.Mock;
} {
  const queryMock = queryFn ? jest.fn(queryFn) : jest.fn().mockResolvedValue({});
  let insertMock;
  let getMock;
  let removeMock;
  const getAllBucketsMock = getAllBucketsFn ? jest.fn(getAllBucketsFn) : jest.fn().mockResolvedValue({});

  const bucketMock = jest.fn();
  // this loop is only called and used when we are mocking for the plugin metadata call
  for (const mockBucketCall of mockBucketCalls) {
    const mockCollectionManagerObj = {
      getAllScopes: jest.fn().mockResolvedValue(mockBucketCall.collectionManagerScopeSpecs)
    };
    const mockBucketObj = {
      collections: jest.fn().mockReturnValue(mockCollectionManagerObj)
    };
    bucketMock.mockImplementationOnce(() => mockBucketObj);
  }

  // mock for the plugin execute call
  if (insertFn || getFn || removeFn) {
    insertMock = jest.fn(insertFn);
    getMock = jest.fn(getFn);
    removeMock = jest.fn(removeFn);
    const mockCollectionObj = {
      insert: insertMock,
      get: getMock,
      remove: removeMock
    };
    const mockScopeObj = {
      collection: jest.fn().mockReturnValue(mockCollectionObj)
    };
    const mockBucketObj = {
      scope: jest.fn().mockReturnValue(mockScopeObj)
    };
    bucketMock.mockImplementationOnce(() => mockBucketObj);
  }

  const mockCluster: Partial<Cluster> = {
    buckets: jest.fn().mockReturnValue({
      getAllBuckets: getAllBucketsMock
    }),
    bucket: bucketMock,
    query: queryMock
  };
  jest.spyOn(couchbaseClient, 'connect').mockImplementationOnce(
    connectFn ||
      ((connStr, options, callback) => {
        return Promise.resolve(mockCluster as Cluster);
      })
  );
  return { client: { client: mockCluster as Cluster }, queryMock, getAllBucketsMock, bucketMock, insertMock, getMock, removeMock };
}

beforeEach(() => {
  plugin = new CouchbasePlugin();
});

describe('test', () => {
  it.each([
    {
      description: 'happy path',
      datasourceConfiguration: { connection: { url: 'url', user: 'user', password: 'password' } },
      connectCalledWith: ['url', { username: 'user', password: 'password' }]
    },
    {
      description: 'throws',
      datasourceConfiguration: { connection: { url: 'url', user: 'user', password: 'password' } },
      connectFn: () => {
        throw new Error('foo');
      },
      expectErrorMsg: 'failed to create CouchbasePlugin connection: IntegrationError: Failed to create Couchbase connection: foo',
      connectCalledWith: ['url', { username: 'user', password: 'password' }]
    }
  ])('$description', async ({ datasourceConfiguration, expectErrorMsg, connectCalledWith, connectFn }) => {
    mockClient({ connectFn });
    if (expectErrorMsg) {
      await expect(plugin.test(datasourceConfiguration as CouchbaseDatasourceConfiguration)).rejects.toThrow(expectErrorMsg);
    } else {
      await plugin.test(datasourceConfiguration as CouchbaseDatasourceConfiguration);
    }
    expect(couchbaseClient.connect).toHaveBeenCalledWith(...connectCalledWith);
    expect(couchbaseClient.connect).toHaveBeenCalledTimes(1);
  });
});

describe('execute', () => {
  it.each([
    {
      description: 'happy path',
      operation: 'runSql',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: { couchbaseAction: { case: 'runSql', value: { sqlBody: 'select * from foo' } } },
      queryCalledWith: ['select * from foo', { parameters: [] }]
    },
    {
      description: 'throws',
      operation: 'runSql',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: { couchbaseAction: { case: 'runSql', value: { sqlBody: 'select * from foo' } } },
      queryFn: () => {
        throw new Error('foo');
      },
      expectErrorMsg: 'Operation failed: foo',
      queryCalledWith: ['select * from foo', { parameters: [] }]
    },
    {
      description: 'happy path',
      operation: 'insert',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'insert',
          value: { key: 'key', value: { foo: 'bar' }, identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      insertFn: (key: string, value: any, options?: InsertOptions, callback?: NodeCallback<MutationResult>) => {
        return Promise.resolve({} as MutationResult);
      },
      insertCalledWith: ['key', { foo: 'bar' }]
    },
    {
      description: 'throws',
      operation: 'insert',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'insert',
          value: { key: 'key', value: { foo: 'bar' }, identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      insertFn: () => {
        throw new Error('foo');
      },
      expectErrorMsg: 'Operation failed: foo',
      insertCalledWith: ['key', { foo: 'bar' }]
    },
    {
      description: 'happy path',
      operation: 'get',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'get',
          value: { key: 'key', identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      getFn: (key: string, options?: GetOptions, callback?: NodeCallback<GetResult>) => {
        return Promise.resolve({} as GetResult);
      },
      getCalledWith: ['key']
    },
    {
      description: 'throws',
      operation: 'get',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'get',
          value: { key: 'key', identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      getFn: (key: string, options?: GetOptions, callback?: NodeCallback<GetResult>) => {
        throw new Error('foo');
      },
      getCalledWith: ['key'],
      expectErrorMsg: 'Operation failed: foo'
    },
    {
      description: 'happy path',
      operation: 'remove',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'remove',
          value: { key: 'key', identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      removeFn: (key: string, options?: RemoveOptions, callback?: NodeCallback<MutationResult>) => {
        return Promise.resolve({} as MutationResult);
      },
      removeCalledWith: ['key']
    },
    {
      description: 'throws',
      operation: 'remove',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'remove',
          value: { key: 'key', identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      removeFn: (key: string, options?: RemoveOptions, callback?: NodeCallback<MutationResult>) => {
        throw new Error('foo');
      },
      removeCalledWith: ['key'],
      expectErrorMsg: 'Operation failed: foo'
    },
    {
      description: 'invalid operation',
      operation: 'foo',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      actionConfiguration: {
        bucketName: 'bucket',
        couchbaseAction: {
          case: 'foo',
          value: { key: 'key', identifier: { scope: 'scope', collection: 'collection' } }
        }
      },
      expectErrorMsg: 'Operation failed: invalid operation: foo'
    }
  ])(
    'OPERATION: "$operation" - $description',
    async ({
      datasourceConfiguration,
      operation,
      actionConfiguration,
      expectErrorMsg,
      queryFn,
      insertFn,
      getFn,
      removeFn,
      queryCalledWith,
      insertCalledWith,
      getCalledWith,
      removeCalledWith
    }) => {
      const props = propsFromConfigs({
        datasourceConfiguration: datasourceConfiguration as CouchbaseDatasourceConfiguration,
        actionConfiguration: actionConfiguration as CouchbaseActionConfiguration
      });
      const {
        client: mockedClient,
        bucketMock,
        queryMock,
        insertMock,
        getMock,
        removeMock
      } = mockClient({ queryFn, insertFn, getFn, removeFn });
      if (expectErrorMsg) {
        await expect(plugin.executePooled(props, mockedClient)).rejects.toThrow(expectErrorMsg);
      } else {
        await plugin.executePooled(props, mockedClient);
      }
      if (queryCalledWith) {
        expect(queryMock).toHaveBeenCalledWith(...queryCalledWith);
        expect(queryMock).toHaveBeenCalledTimes(1);
      }
      if (insertCalledWith) {
        expect(insertMock).toHaveBeenCalledWith(...insertCalledWith);
        expect(insertMock).toHaveBeenCalledTimes(1);
      }
      if (getCalledWith) {
        expect(getMock).toHaveBeenCalledWith(...getCalledWith);
        expect(getMock).toHaveBeenCalledTimes(1);
      }
      if (removeCalledWith) {
        expect(removeMock).toHaveBeenCalledWith(...removeCalledWith);
        expect(removeMock).toHaveBeenCalledTimes(1);
      }
      if (['insert', 'get', 'remove'].includes(operation)) {
        expect(bucketMock).toHaveBeenCalledTimes(1);
        expect(bucketMock).toHaveBeenCalledWith(actionConfiguration.bucketName);
      }
    }
  );
});

describe('metadata', () => {
  it.each([
    {
      description: 'happy path',
      datasourceConfiguration: { connection: { user: 'user', password: 'password' } },
      getAllBucketsFn: () => {
        return [{ name: 'bucket_1' }, { name: 'bucket_2' }];
      },
      mockBucketCalls: [
        {
          collectionManagerScopeSpecs: [
            {
              name: 'scope_1',
              collections: [{ name: 'collection_1' }]
            }
          ] as ScopeSpec[]
        },
        {
          collectionManagerScopeSpecs: [
            {
              name: 'scope_2',
              collections: [{ name: 'collection_2' }, { name: 'collection_2b' }]
            },
            {
              name: 'scope_2b',
              collections: [{ name: 'collection_2c' }]
            }
          ] as ScopeSpec[]
        }
      ],
      expectedMetadata: {
        couchbase: {
          buckets: [
            { name: 'bucket_1', scopes: [{ name: 'scope_1', collections: [{ name: 'collection_1' }] }] },
            {
              name: 'bucket_2',
              scopes: [
                { name: 'scope_2', collections: [{ name: 'collection_2' }, { name: 'collection_2b' }] },
                { name: 'scope_2b', collections: [{ name: 'collection_2c' }] }
              ]
            }
          ]
        }
      }
    },
    {
      description: 'throws',
      datasourceConfiguration: {},
      getAllBucketsFn: () => {
        throw new Error('foo');
      },
      expectErrorMsg: 'Metadata operation failed: foo'
    }
  ])('$description', async ({ datasourceConfiguration, getAllBucketsFn, mockBucketCalls, expectedMetadata, expectErrorMsg }) => {
    const { getAllBucketsMock, bucketMock } = mockClient({ getAllBucketsFn, mockBucketCalls });
    if (expectErrorMsg) {
      await expect(plugin.metadata(datasourceConfiguration as CouchbaseDatasourceConfiguration)).rejects.toThrow(expectErrorMsg);
    } else {
      const response = await plugin.metadata(datasourceConfiguration as CouchbaseDatasourceConfiguration);
      expect(response).toEqual(expectedMetadata);
      expect(bucketMock).toHaveBeenCalledTimes(expectedMetadata ? expectedMetadata.couchbase.buckets.length : 0);
    }
    expect(getAllBucketsMock).toHaveBeenCalledTimes(1);
    expect(getAllBucketsMock).toHaveBeenCalledWith();
  });
});
