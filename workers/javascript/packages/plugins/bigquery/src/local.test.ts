import { BigqueryDatasourceConfiguration, RelayDelegate } from '@superblocks/shared';
import BigqueryPlugin from '.';

const plugin: BigqueryPlugin = new BigqueryPlugin();

const SERVICE_ACCOUNT_KEY = JSON.stringify({
  put: 'your service account key here as an object'
});

export const datasourceConfiguration = {
  authentication: { custom: { googleServiceAccount: { value: SERVICE_ACCOUNT_KEY } } },
  name: 'local tests'
} as BigqueryDatasourceConfiguration;

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

describe('connection', () => {
  test('connection succeeds with basic config', async () => {
    await plugin.test(datasourceConfiguration);
  });
});

describe('metadata', () => {
  test('metadata is formatted correctly', async () => {
    const resp = await plugin.metadata(datasourceConfiguration);
    expect(resp).toEqual({
      dbSchema: {
        tables: expect.arrayContaining([
          expect.objectContaining({
            name: 'joey_g_dataset.example_table',
            type: 'TABLE',
            columns: expect.arrayContaining([
              expect.objectContaining({ name: 'id', type: 'INTEGER' }),
              expect.objectContaining({ name: 'name', type: 'STRING' }),
              expect.objectContaining({ name: 'created_at', type: 'TIMESTAMP' })
            ])
          }),
          expect.objectContaining({
            name: 'joey_g_dataset.example_table_3',
            type: 'TABLE',
            columns: expect.arrayContaining([
              expect.objectContaining({ name: 'foo', type: 'STRING' }),
              expect.objectContaining({ name: 'bar', type: 'TIMESTAMP' })
            ])
          }),
          expect.objectContaining({
            name: 'joey_g_dataset_2.example_table_2',
            type: 'TABLE',
            columns: expect.arrayContaining([
              expect.objectContaining({ name: 'id', type: 'INTEGER' }),
              expect.objectContaining({ name: 'name', type: 'STRING' }),
              expect.objectContaining({ name: 'created_at', type: 'TIMESTAMP' })
            ])
          })
        ])
      }
    });
  });
});
