import { promises as fs } from 'fs';
import path from 'path';
import { MongoDBDatasourceConfiguration } from '@superblocks/shared';
import { MongoClient } from 'mongodb';

import MongoDbPlugin from '.';

const MONGODB_ADMIN_USER_URL = 'mongodb://root:example@127.0.0.1:27017';
const MONGODB_NON_ADMIN_USER_URL = 'mongodb://nonAdminUser:password@127.0.0.1:27017';
const MONDODB_DATABASE_NAME = 'admin';

const plugin: MongoDbPlugin = new MongoDbPlugin();

const datasourceConfiguration = {
  endpoint: { host: MONGODB_ADMIN_USER_URL },
  authentication: { custom: { databaseName: { value: MONDODB_DATABASE_NAME } } }
} as MongoDBDatasourceConfiguration;

let client: MongoClient;

async function resetDatabase(): Promise<void> {
  // delete all databases
  const admin = client.db().admin();
  const { databases } = await admin.listDatabases();

  for (const dbInfo of databases) {
    const dbName = dbInfo.name;
    if (!['admin', 'local', 'config'].includes(dbName)) {
      await client.db(dbName).dropDatabase();
    }
  }

  // hydrate with dummy default data
  const filePath = path.join(__dirname, 'initialMongoState.json');
  const rawData = await fs.readFile(filePath, 'utf-8');
  const initialState = JSON.parse(rawData);

  for (const record of initialState) {
    const curDb = client.db(record['database']);
    const collection = curDb.collection(record['collection']);
    await collection.insertOne(record['data']);
  }
}

beforeAll(async () => {
  client = new MongoClient(MONGODB_ADMIN_USER_URL);
  await client.connect();
  // create a non-admin user
  const adminDb = client.db('admin');
  // remove the user if they exist
  try {
    await adminDb.command({ dropUser: 'nonAdminUser' });
  } catch {
    // noop
  }

  // create a non-admin user
  await adminDb.command({
    createUser: 'nonAdminUser',
    pwd: 'password',
    roles: [{ role: 'read', db: 'db_1' }]
  });
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('Test Connection', () => {
  test('connection succeeds with admin user', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('connection succeeds with non-admin user', async () => {
    const datasourceConfiguration: MongoDBDatasourceConfiguration = {
      endpoint: { host: MONGODB_NON_ADMIN_USER_URL },
      authentication: { custom: { databaseName: { value: 'db_1' } } }
    };
    await plugin.test(datasourceConfiguration);
  });

  test('connection fails with invalid database name', async () => {
    const badDatasourceConfig: MongoDBDatasourceConfiguration = {
      endpoint: { host: MONGODB_ADMIN_USER_URL },
      authentication: { custom: { databaseName: { value: 'i am invalid' } } }
    };
    await expect(plugin.test(badDatasourceConfig)).rejects.toThrow();
  });

  test('connection fails when user does not have access to given database but passes when they do', async () => {
    // non admin user does not have access to db_2
    let datasourceConfiguration: MongoDBDatasourceConfiguration = {
      endpoint: { host: MONGODB_NON_ADMIN_USER_URL },
      authentication: { custom: { databaseName: { value: 'db_2' } } }
    };
    await expect(plugin.test(datasourceConfiguration)).rejects.toThrow();
    // admin has access to db_2
    datasourceConfiguration = {
      endpoint: { host: MONGODB_ADMIN_USER_URL },
      authentication: { custom: { databaseName: { value: 'db_2' } } }
    };
    await plugin.test(datasourceConfiguration);
  });
});
