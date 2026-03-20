import { describe, expect, it } from '@jest/globals';
import type { IntegrationExecutor } from '../../types';
import { PoolIntegrationExecutorClient } from './pool-integration-executor-client';
import { PoolIntegrationExecutorServer } from './pool-integration-executor-server';

describe('PoolIntegrationExecutor bridge', () => {
  it('sanitizes proxy-like metadata before sending it across the worker bridge', async () => {
    let receivedActionConfiguration: Record<string, unknown> | undefined;

    const executor: IntegrationExecutor = {
      async executeIntegration(params) {
        receivedActionConfiguration = params.actionConfiguration;

        return {
          executionId: 'exec-1',
          output: [{ id: 1, nested: { ok: true } }]
        };
      }
    };

    const metadata = new Proxy({ label: 'proxy test', description: 'desc' }, {});
    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      const result = await client.executeIntegration({
        integrationId: 'pg-id',
        pluginId: 'postgres',
        actionConfiguration: {
          body: 'SELECT 1'
        },
        metadata
      });

      expect(receivedActionConfiguration).toEqual({ body: 'SELECT 1' });
      expect(result).toEqual([{ id: 1, nested: { ok: true } }]);
      expect(server.diagnostics()[0]?.metadata).toEqual({
        label: 'proxy test',
        description: 'desc'
      });
    } finally {
      client.close();
      server.close();
    }
  });

  it('preserves nested actionConfiguration payloads without extra serialization', async () => {
    let receivedActionConfiguration: Record<string, unknown> | undefined;

    const executor: IntegrationExecutor = {
      async executeIntegration(params) {
        receivedActionConfiguration = params.actionConfiguration;

        return {
          executionId: 'exec-2',
          output: { ok: true }
        };
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, false);
    const client = new PoolIntegrationExecutorClient(server.clientPort());
    const actionConfiguration = {
      body: 'SELECT * FROM users WHERE id = {{ userId }}',
      params: {
        userId: 123,
        filters: ['active', 'staff']
      },
      options: [{ limit: 10 }, { offset: 0 }]
    };

    try {
      const result = await client.executeIntegration({
        integrationId: 'pg-id',
        pluginId: 'postgres',
        actionConfiguration
      });

      expect(receivedActionConfiguration).toEqual(actionConfiguration);
      expect(result).toEqual({ ok: true });
    } finally {
      client.close();
      server.close();
    }
  });

  it('allows metadata to be omitted', async () => {
    const executor: IntegrationExecutor = {
      async executeIntegration(params) {
        return {
          executionId: 'exec-3',
          output: {
            actionConfiguration: params.actionConfiguration
          }
        };
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      const result = await client.executeIntegration({
        integrationId: 'pg-id',
        pluginId: 'postgres',
        actionConfiguration: { body: 'SELECT 1' },
        metadata: undefined
      });

      expect(result).toEqual({
        actionConfiguration: { body: 'SELECT 1' }
      });
      expect(server.diagnostics()[0]?.metadata).toBeUndefined();
    } finally {
      client.close();
      server.close();
    }
  });
});
