jest.mock('@superblocks/shared', () => {
  class IntegrationError extends Error {
    code: string;
    constructor(message: string, code: string, _details?: Record<string, unknown>) {
      super(message);
      this.code = code;
    }
  }
  return {
    ErrorCode: {
      UNSPECIFIED: 'UNSPECIFIED',
      INTEGRATION_NETWORK: 'INTEGRATION_NETWORK',
    },
    IntegrationError,
    PoolIntegrationExecutorClient: class {}
  };
});

import { createWasmIntegrationExecutorBridge } from './integrationBridge';

describe('createWasmIntegrationExecutorBridge', () => {
  it('returns undefined when no client is provided', () => {
    expect(createWasmIntegrationExecutorBridge()).toBeUndefined();
    expect(createWasmIntegrationExecutorBridge(undefined)).toBeUndefined();
  });

  it('returns a function when a client is provided', () => {
    const client = { executeIntegration: jest.fn() };
    const bridge = createWasmIntegrationExecutorBridge(client);
    expect(typeof bridge).toBe('function');
  });

  it('forwards params to executeIntegration and returns the result', async () => {
    const client = { executeIntegration: jest.fn().mockResolvedValue({ rows: [1, 2, 3] }) };
    const bridge = createWasmIntegrationExecutorBridge(client)!;

    const params = { integrationId: 'pg-1', pluginId: 'postgres' };
    const result = await bridge(params);

    expect(client.executeIntegration).toHaveBeenCalledWith(params);
    expect(result).toEqual({ rows: [1, 2, 3] });
  });

  it('preserves the original error code on failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IntegrationError } = require('@superblocks/shared');
    const originalError = new IntegrationError('connection refused', 'INTEGRATION_NETWORK');
    const client = { executeIntegration: jest.fn().mockRejectedValue(originalError) };
    const bridge = createWasmIntegrationExecutorBridge(client)!;

    try {
      await bridge({ integrationId: 'pg-1', pluginId: 'postgres' });
      fail('expected error');
    } catch (e: unknown) {
      const err = e as { code: string; message: string };
      expect(err.code).toBe('INTEGRATION_NETWORK');
      expect(err.message).toBe('connection refused');
    }
  });

  it('falls back to UNSPECIFIED when error has no code', async () => {
    const client = { executeIntegration: jest.fn().mockRejectedValue(new Error('unknown')) };
    const bridge = createWasmIntegrationExecutorBridge(client)!;

    try {
      await bridge({ integrationId: 'pg-1', pluginId: 'postgres' });
      fail('expected error');
    } catch (e: unknown) {
      const err = e as { code: string; message: string };
      expect(err.code).toBe('UNSPECIFIED');
      expect(err.message).toBe('unknown');
    }
  });
});
