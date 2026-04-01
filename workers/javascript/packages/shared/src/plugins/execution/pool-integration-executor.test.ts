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

  it('captures errorCode from result.error in diagnostics', async () => {
    const executor: IntegrationExecutor = {
      async executeIntegration() {
        return {
          executionId: 'exec-err',
          output: undefined,
          error: 'Query timed out',
          errorCode: 'INTEGRATION_QUERY_TIMEOUT'
        };
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      await expect(
        client.executeIntegration({
          integrationId: 'sf-id',
          pluginId: 'snowflake',
          actionConfiguration: { body: 'SELECT 1' }
        })
      ).rejects.toThrow('Query timed out');

      const diag = server.diagnostics()[0];
      expect(diag).toBeDefined();
      expect(diag.error).toBe('Query timed out');
      expect(diag.errorCode).toBe('INTEGRATION_QUERY_TIMEOUT');
      expect(diag.integrationId).toBe('sf-id');
      expect(diag.pluginId).toBe('snowflake');
    } finally {
      client.close();
      server.close();
    }
  });

  it('captures errorCode from thrown IntegrationError in catch path', async () => {
    const executor: IntegrationExecutor = {
      async executeIntegration() {
        const err = new Error('connection refused') as Error & { code: string };
        err.code = 'INTEGRATION_NETWORK';
        throw err;
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      await expect(
        client.executeIntegration({
          integrationId: 'pg-id',
          pluginId: 'postgres',
          actionConfiguration: { body: 'SELECT 1' }
        })
      ).rejects.toThrow('connection refused');

      const diag = server.diagnostics()[0];
      expect(diag).toBeDefined();
      expect(diag.error).toBe('connection refused');
      expect(diag.errorCode).toBe('INTEGRATION_NETWORK');
    } finally {
      client.close();
      server.close();
    }
  });

  it('leaves errorCode empty when thrown error has no code property', async () => {
    const executor: IntegrationExecutor = {
      async executeIntegration() {
        throw new Error('something broke');
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      await expect(
        client.executeIntegration({
          integrationId: 'pg-id',
          pluginId: 'postgres'
        })
      ).rejects.toThrow('something broke');

      const diag = server.diagnostics()[0];
      expect(diag).toBeDefined();
      expect(diag.error).toBe('something broke');
      expect(diag.errorCode).toBe('');
    } finally {
      client.close();
      server.close();
    }
  });

  it('leaves errorCode empty when thrown non-Error value has no code', async () => {
    const executor: IntegrationExecutor = {
      async executeIntegration() {
        throw 'string error';
      }
    };

    const server = new PoolIntegrationExecutorServer(executor, true);
    const client = new PoolIntegrationExecutorClient(server.clientPort());

    try {
      await expect(
        client.executeIntegration({
          integrationId: 'pg-id',
          pluginId: 'postgres'
        })
      ).rejects.toThrow('string error');

      const diag = server.diagnostics()[0];
      expect(diag).toBeDefined();
      expect(diag.error).toBe('string error');
      expect(diag.errorCode).toBe('');
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
