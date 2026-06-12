import { describe, expect, it, jest } from '@jest/globals';

jest.mock('./remoteLogger', () => ({
  remoteError: jest.fn(),
  remoteInfo: jest.fn(),
  remoteLogStructured: jest.fn()
}));

import { Shim } from './shim';
import { Event } from './types';

function stubLogger(): any {
  const logger: any = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
  logger.child = jest.fn(() => logger);
  return logger;
}

describe('Shim.convertDatasourceConfig', () => {
  it('returns undefined for undefined datasource config in salesforce shim', () => {
    const shim = Object.create(Shim.prototype) as any;
    shim.name = 'salesforce';
    shim._logger = { warn: jest.fn() };

    expect(shim.convertDatasourceConfig(undefined)).toBeUndefined();
    expect(shim._logger.warn).not.toHaveBeenCalled();
  });
});

describe('Shim.run EXECUTE error propagation', () => {
  // Runs the EXECUTE branch with the plugin returning the given execution
  // output and returns the ExecuteResponse.
  async function runExecute(executionOutput: Record<string, unknown>): Promise<any> {
    const shim = Object.create(Shim.prototype) as any;
    shim.name = 'databricks';
    shim._logger = stubLogger();
    shim._kv = {
      writeMany: jest.fn(async () => ({ pinned: { write: 10 } }))
    };
    shim._plugin = {
      attachLogger: jest.fn(),
      setupAndExecute: jest.fn(async () => executionOutput)
    };
    shim.constructPluginProps = jest.fn(async () => ({
      executionId: 'exec-1',
      stepName: 'Step1',
      version: 'v2'
    }));

    return await shim.run({
      event: Event.EXECUTE,
      request: { props: { executionId: 'exec-1' } },
      perf: { pluginExecution: {}, kvStorePush: {}, bindings: {} }
    });
  }

  it('propagates the integration error code onto the response error', async () => {
    const response = await runExecute({
      error: '401 unauthorized',
      integrationErrorCode: 3,
      log: [],
      structuredLog: [],
      output: {}
    });

    expect(response.err).toEqual({ name: 'IntegrationError', message: '401 unauthorized', code: 3 });
    expect(response.key).toBeDefined();
  });

  it('omits the code field when the execution output has no integration error code', async () => {
    const response = await runExecute({
      error: '401 unauthorized',
      log: [],
      structuredLog: [],
      output: {}
    });

    expect(response.err).toEqual({ name: 'IntegrationError', message: '401 unauthorized' });
    expect('code' in response.err).toBe(false);
  });

  it('returns no error for a successful execution', async () => {
    const response = await runExecute({
      log: [],
      structuredLog: [],
      output: { rows: 1 }
    });

    expect(response.err).toBeUndefined();
    expect(response.key).toBeDefined();
  });
});

describe('Shim.run EXECUTE flush failures', () => {
  function makeShim(writeMany: (...args: any[]) => Promise<any>): any {
    const shim = Object.create(Shim.prototype) as any;
    shim.name = 'databricks';
    shim._logger = stubLogger();
    shim._kv = { writeMany: jest.fn(writeMany) };
    shim._plugin = {
      attachLogger: jest.fn(),
      setupAndExecute: jest.fn(async () => ({ log: [], structuredLog: [], output: { rows: 1 } }))
    };
    shim.constructPluginProps = jest.fn(async () => ({
      executionId: 'exec-1',
      stepName: 'Step1',
      version: 'v2'
    }));
    return shim;
  }

  const runOptions = {
    event: Event.EXECUTE,
    request: { props: { executionId: 'exec-1' } },
    perf: { pluginExecution: {}, kvStorePush: {}, bindings: {} }
  };

  it('clears the output and re-flushes when the store write exceeds the quota', async () => {
    let calls = 0;
    const shim = makeShim(async () => {
      calls += 1;
      if (calls === 1) {
        const quotaErr = new Error('over quota');
        quotaErr.name = 'QuotaError';
        throw quotaErr;
      }
      return { pinned: { write: 10 } };
    });

    const response = await shim.run(runOptions);

    expect(shim._kv.writeMany).toHaveBeenCalledTimes(2);
    expect(response.err.name).toBe('QuotaError');
    expect(response.key).toBeDefined();
  });

  it('rethrows non-quota flush errors', async () => {
    const shim = makeShim(async () => {
      throw new Error('redis write failed');
    });

    await expect(shim.run(runOptions)).rejects.toThrow('redis write failed');
  });
});

describe('Shim.run non-execute events', () => {
  // Uses a plugin name without a proto mapping so datasource/action configs
  // pass through conversion unchanged.
  function makeShim(plugin: Record<string, unknown>): any {
    const shim = Object.create(Shim.prototype) as any;
    shim.name = 'unmapped-plugin';
    shim._logger = stubLogger();
    shim._plugin = plugin;
    return shim;
  }

  it('TEST runs the plugin test with the converted configs', async () => {
    const test = jest.fn(async () => ({ message: 'connection ok' }));
    const shim = makeShim({ test });

    const response = await shim.run({
      event: Event.TEST,
      request: { dConfig: { host: 'db' }, aConfig: { query: 'select 1' } },
      perf: { pluginExecution: {} }
    });

    expect(response).toEqual({ message: 'connection ok' });
    expect(test).toHaveBeenCalledWith({ host: 'db' }, { query: 'select 1' });
  });

  it('PRE_DELETE runs the plugin preDelete with the datasource config', async () => {
    const preDelete = jest.fn(async () => undefined);
    const shim = makeShim({ preDelete });

    await shim.run({
      event: Event.PRE_DELETE,
      request: { dConfig: { host: 'db' } },
      perf: { pluginExecution: {} }
    });

    expect(preDelete).toHaveBeenCalledWith({ host: 'db' });
  });

  it('METADATA runs the plugin metadata with the converted configs', async () => {
    const metadata = jest.fn(async () => ({ tables: [] }));
    const shim = makeShim({ metadata });

    const response = await shim.run({
      event: Event.METADATA,
      request: { dConfig: { host: 'db' }, aConfig: { query: 'select 1' } },
      perf: { pluginExecution: {} }
    });

    expect(response).toEqual({ tables: [] });
    expect(metadata).toHaveBeenCalledWith({ host: 'db' }, { query: 'select 1' });
  });

  it('throws on an unrecognized event', async () => {
    const shim = makeShim({});

    await expect(shim.run({ event: 'bogus', request: {}, perf: {} })).rejects.toThrow('unrecognized event bogus');
  });
});
