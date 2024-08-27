import {
    ExecutionContext,
    ExecutionOutput,
    IntegrationError,
    PluginExecutionProps,
    RelayDelegate,
    SalesforceActionConfiguration,
    SalesforceDatasourceConfiguration
} from '@superblocks/shared';
import { SalesforcePluginV1 } from '@superblocksteam/types';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import SalesforcePlugin, { COMMON_OBJECTS } from '.';

// THESE TESTS SHOULD ONLY BE RUN
// 1. DURING LOCAL DEVELOPMENT
// 2. (TODO) during a daily CI deploy
// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const LOCAL_DEV = process.env.SALESFORCE_LOCAL_DEV; // safeguard to prevent running these tests in CI
const runTests = LOCAL_DEV ? describe : describe.skip;

const TOKEN_URL = process.env.SALESFORCE_TOKEN_URL;
const CONSUMER_KEY = process.env.SALESFORCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.SALESFORCE_CONSUMER_SECRET;
const INSTANCE_URL = process.env.SALESFORCE_INSTANCE_URL;

const plugin: SalesforcePlugin = new SalesforcePlugin();

// @ts-ignore
plugin.logger = { info: (): void => undefined };

const _fetchTokenForTests = async (): Promise<string> => {
  const formData = {
    grant_type: 'client_credentials',
    client_id: CONSUMER_KEY,
    client_secret: CONSUMER_SECRET
  };

  const params = new URLSearchParams();
  Object.entries(formData).map(([key, value]) => {
    params.append(key, value as string);
  });

  try {
    const resp = await axios.post(TOKEN_URL as string, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return resp.data.access_token;
  } catch (e) {
    throw new IntegrationError(`Failed to get access token via password grant flow, error=${JSON.stringify(e.response?.data)}`);
  }
};

function buildDatasourceConfiguration(token?: string): SalesforceDatasourceConfiguration {
  const datasourceConfiguration = {
    connection: {
      instanceUrl: INSTANCE_URL
    },
    name: 'Salesforce Plugin Local Tests'
  } as SalesforceDatasourceConfiguration;

  // TODO [ro] we shouldn't rely on this, token should be in execution context
  // but it's not available in metadata nor test for now
  if (token !== undefined) {
    datasourceConfiguration.authConfig = {
      authToken: token
    };
  }

  return datasourceConfiguration;
}

function buildPropsWithActionConfiguration(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionConfiguration: Record<string, any>,
  context: ExecutionContext,
  token?: string
): PluginExecutionProps<SalesforceDatasourceConfiguration, SalesforceActionConfiguration> {
  const datasourceConfiguration = buildDatasourceConfiguration(token);
  return {
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  } as PluginExecutionProps<SalesforceDatasourceConfiguration, SalesforceActionConfiguration>;
}

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

let context: ExecutionContext;
let token: string;

runTests('Salesforce Plugin E2E Tests', () => {
  beforeAll(async () => {
    token = await _fetchTokenForTests();
    context = {
      globals: {
        params: { environment: 'dev' },
        body: {},
        Env: {},
        token: token
      },
      outputs: {},
      preparedStatementContext: [],
      addGlobalVariable: (): void => undefined,
      addGlobalsOverride: (): void => undefined,
      addGlobalVariableOverride: (): void => undefined,
      addOutput: (): void => undefined,
      merge: (): void => undefined,
      globalBindingKeys: (): string[] => [],
      outputBindingKeys: (): string[] => []
    };
  });

  test('query with pagination', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: 'select Id, CreatedDate from Lead limit 2010'
        }
      }),
      context
    );

    const res = await plugin.execute(executionProps);
    expect(res?.error).toBeUndefined();
    expect(res?.output).toHaveLength(2010);
  });

  test('query without pagination', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: 'select Id, CreatedDate from Lead limit 10'
        }
      }),
      context
    );

    const res = await plugin.execute(executionProps);
    expect(res?.error).toBeUndefined();
    expect(res?.output).toHaveLength(10);
  });

  test('malformatted query', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: 'select Id CreatedDate from Lead limit 10'
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('MALFORMED_QUERY');
    }
  });

  test('malformatted query semicolon', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: 'select Id CreatedDate from Lead limit 10;'
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('MALFORMED_QUERY');
    }
  });

  test('malformatted query need limit', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: 'select FIELDS(all) CreatedDate from Lead'
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('MALFORMED_QUERY');
    }
  });

  test('metadata query', async () => {
    const result = await plugin.metadata(buildDatasourceConfiguration(token));
    expect(result.dbSchema?.tables).toHaveLength(COMMON_OBJECTS.length);
  });

  test('test salesforce connection', async () => {
    await plugin.test(buildDatasourceConfiguration(token));
  });

  test('crud update', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.UPDATE,
          resourceId: '0038H00000LzaXzQAJ',
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            FirstName: `${new Date().toISOString()}`
          })
        }
      }),
      context
    );

    const res = await plugin.execute(executionProps);
    expect(res?.error).toBeUndefined();
  });

  test('crud create with wrong column', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            Name: `${new Date().toISOString()}`,
            Email: `${new Date().valueOf()}@test.com`
          })
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
      fail('It should throw instead of reach here');
    } catch (e) {
      expect(e.message).toContain('Unable to create/update fields: Name');
    }
  });

  test('crud create and delete', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            FirstName: `${new Date().toISOString()}`,
            LastName: `${new Date().toISOString()}`,
            Email: `${new Date().valueOf()}@test.com`
          })
        }
      }),
      context
    );

    const res = await plugin.execute(executionProps);
    // @ts-ignore
    const resourceId = res.output?.id;
    expect(resourceId).toBeDefined();

    const executionPropsForDelete = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.DELETE,
          resourceId: resourceId,
          resourceType: 'Contact'
        }
      }),
      context
    );
    const resForDelete = await plugin.execute(executionPropsForDelete);
    expect(resForDelete?.error).toBeUndefined();
  });

  test('crud read', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.READ,
          resourceId: '0038H00000LzaXzQAJ',
          resourceType: 'Contact'
        }
      }),
      context
    );

    const res = await plugin.execute(executionProps);
    expect(res?.error).toBeUndefined();
    expect(res.output).toBeDefined();
  });

  test('crud read invalid id', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.READ,
          resourceId: '0038H00000LzaXzZAJ',
          resourceType: 'Contact'
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('Failed to read');
    }
  });

  test('crud delete invalid id', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.DELETE,
          resourceId: '0038H00000LzaXzZAJ',
          resourceType: 'Contact'
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('Failed to delete');
    }
  });

  test('crud update with bad payload', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.UPDATE,
          resourceId: '0038H00000LzaXzQAJ',
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            UnknownField: `${new Date().toISOString()}`
          })
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('Failed to update');
    }
  });

  test('crud create with bad payload', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            UnknownField: `${new Date().toISOString()}`
          })
        }
      }),
      context
    );

    try {
      await plugin.execute(executionProps);
    } catch (e) {
      expect(e.message).toContain('Failed to create');
    }
  });
});

runTests('Salesforce Plugin E2E Bulk Tests', () => {
  beforeAll(async () => {
    token = await _fetchTokenForTests();
    context = {
      globals: {
        params: { environment: 'dev' },
        body: {},
        Env: {},
        token: token
      },
      outputs: {},
      preparedStatementContext: [],
      addGlobalVariable: (): void => undefined,
      addGlobalsOverride: (): void => undefined,
      addGlobalVariableOverride: (): void => undefined,
      addOutput: (): void => undefined,
      merge: (): void => undefined,
      globalBindingKeys: (): string[] => [],
      outputBindingKeys: (): string[] => []
    };
  });

  test('bulk job create', async () => {
    const n1 = `${new Date().toISOString()} RoTestBulk2 Account`;
    const n2 = `${new Date().toISOString()} RoTestBulk2 Account`;
    const n3 = `${new Date().toISOString()} RoTestBulk2 Account`;

    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.CREATE,
          resourceType: 'Account',
          resourceBody: JSON.stringify([
            {
              Name: n1
            },
            {
              Name: n2
            },
            {
              Name: n3
            }
          ])
        }
      }),
      context
    );

    const resp = await plugin.execute(executionProps);
    // @ts-ignore
    expect(resp.output?.numberRecordsProcessed).toEqual(3);
  });

  test('bulk insert job with bad csv', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify([
            {
              FirstName: `${new Date().toISOString()}RoTestBulkInsert`,
              LastName: new Date().toISOString(),
              InvalidColumn: `${new Date().valueOf()}@test.com`
            }
          ])
        }
      }),
      context
    );

    const resp = await plugin.execute(executionProps);
    // @ts-ignore
    expect(resp.output?.errorMessage).toContain('Field name not found : InvalidColumn');
  });

  test('bulk insert job with dup record', async () => {
    const firstName = new Date().toISOString();
    const lastName = new Date().toISOString();
    const email = `${new Date().valueOf()}@test.com`;
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            FirstName: firstName,
            LastName: lastName,
            Email: email
          })
        }
      }),
      context
    );
    await plugin.execute(executionProps);

    const bulkExecutionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify([
            {
              FirstName: firstName,
              LastName: lastName,
              Email: email
            }
          ])
        }
      }),
      context
    );

    const bulkResp = await plugin.execute(bulkExecutionProps);
    // @ts-ignore
    expect(bulkResp.output?.numberRecordsFailed).toEqual(1);
  });

  test('bulk delete job', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Account',
          resourceBody: JSON.stringify({
            Name: `${new Date().toISOString()} This will be deleted`
          })
        }
      }),
      context
    );
    const resp = await plugin.execute(executionProps);
    // @ts-ignore
    const aId = resp.output.id;
    expect(aId).toBeDefined();

    const bulkExecutionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.DELETE,
          resourceType: 'Account',
          resourceBody: JSON.stringify([{ Id: aId }])
        }
      }),
      context
    );

    const bulkResp = await plugin.execute(bulkExecutionProps);
    // @ts-ignore
    expect(bulkResp.output?.numberRecordsProcessed).toEqual(1);
  });

  test('bulk update job', async () => {
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Account',
          resourceBody: JSON.stringify({
            Name: `${new Date().toISOString()} This will be updated`
          })
        }
      }),
      context
    );
    const resp = await plugin.execute(executionProps);
    // @ts-ignore
    const aId = resp.output.id;
    expect(aId).toBeDefined();

    const bulkExecutionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.UPDATE,
          resourceType: 'Account',
          resourceBody: JSON.stringify([
            {
              Id: aId,
              Name: 'This is a new name'
            }
          ])
        }
      }),
      context
    );

    const bulkResp = await plugin.execute(bulkExecutionProps);
    // @ts-ignore
    expect(bulkResp.output?.numberRecordsProcessed).toEqual(1);
  });

  test('bulk upsert job 1 insert 1 update', async () => {
    const firstName = new Date().toISOString();
    const lastName = new Date().toISOString();
    const email = `${new Date().valueOf()}@test.com`;
    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        crud: {
          action: SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify({
            FirstName: firstName,
            LastName: lastName,
            Email: email
          })
        }
      }),
      context
    );
    await plugin.execute(executionProps);

    const bulkExecutionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.UPSERT,
          externalId: 'Email',
          resourceType: 'Contact',
          resourceBody: JSON.stringify([
            {
              FirstName: firstName,
              LastName: lastName,
              Email: email
            },
            {
              FirstName: new Date().toISOString(),
              LastName: new Date().toISOString(),
              Email: `${new Date().valueOf()}@test.com`
            }
          ])
        }
      }),
      context
    );

    const bulkResp = await plugin.execute(bulkExecutionProps);
    // @ts-ignore
    expect(bulkResp.output?.numberRecordsProcessed).toEqual(2);
  });

  test('bulk upsert payload with different fields', async () => {
    const n1 = `TestContact1${new Date().valueOf()}`;
    const n2 = `TestContact2${new Date().valueOf()}`;
    const n3 = `TestContact3${new Date().valueOf()}`;

    const executionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.CREATE,
          resourceType: 'Contact',
          resourceBody: JSON.stringify([
            {
              FirstName: n1,
              LastName: n1,
              Email: `${n1}@test.com`
            },
            {
              FirstName: n2,
              LastName: n2,
              Email: `${n2}@test.com`
            },
            {
              FirstName: n3,
              LastName: n3,
              Email: `${n3}@test.com`
            }
          ])
        }
      }),
      context
    );

    const resp = await plugin.execute(executionProps);
    // @ts-ignore
    expect(resp.output?.numberRecordsProcessed).toEqual(3);

    const bulkExecutionProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        bulk: {
          action: SalesforcePluginV1.Plugin_Bulk_BulkAction.UPSERT,
          externalId: 'Email',
          resourceType: 'Contact',
          resourceBody: JSON.stringify([
            {
              FirstName: 'Updated',
              Email: `${n1}@test.com`
            },
            {
              Title: 'Added',
              Email: `${n2}@test.com`
            },
            {
              Department: 'Added',
              Email: `${n3}@test.com`
            }
          ])
        }
      }),
      context
    );

    const bulkResp = await plugin.execute(bulkExecutionProps);
    // @ts-ignore
    expect(bulkResp.output?.numberRecordsProcessed).toEqual(3);

    const queryProps = buildPropsWithActionConfiguration(
      SalesforcePluginV1.Plugin.fromJson({
        soql: {
          sqlBody: `select Id, Email, FirstName, LastName, Title, Department from Contact where Email in ('${n1}@test.com', '${n2}@test.com', '${n3}@test.com')`
        }
      }),
      context
    );

    const res = await plugin.execute(queryProps);

    // @ts-ignore
    expect(res.output[0].FirstName).toEqual('Updated');
    // @ts-ignore
    expect(res.output[0].Title).toBeNull();
    // @ts-ignore
    expect(res.output[0].Department).toBeNull();
    // @ts-ignore
    expect(res.output[1].Title).toEqual('Added');
    // @ts-ignore
    expect(res.output[2].Department).toEqual('Added');
  });
});
