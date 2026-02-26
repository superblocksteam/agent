/**
 * Contract test: validates the wrapper script format produced by the orchestrator
 * (internal/transport/code_delivery.go generateWrapperScript).
 *
 * The worker wraps received code in (async function() { ${code} })() and awaits the result.
 * The wrapper calls __sb_execute (sdk-api's executeApi) with the CompiledApi object
 * and returns __sb_result.output on success.
 */

// Simulates how the worker evaluates the orchestrator's wrapper script
function evaluateWrapper(
  wrapperScript: string,
  globals: Record<string, unknown> = {}
): Promise<unknown> {
  // Inject globals into scope via function parameters
  const globalNames = Object.keys(globals);
  const globalValues = Object.values(globals);

  const wrappedCode = `(async function(${globalNames.join(',')}) {\n${wrapperScript}\n})`;
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return ${wrappedCode}`);
  return fn()(...globalValues);
}

describe('code-mode wrapper contract', () => {
  const mockExecuteApi = jest.fn();
  const mockIntegrationExecutor = jest.fn();

  beforeEach(() => {
    mockExecuteApi.mockReset();
    mockIntegrationExecutor.mockReset();
  });

  const asyncBundle = `module.exports={default:{
    inputSchema:{safeParse:function(v){return{success:true,data:v}}},
    outputSchema:{safeParse:function(v){return{success:true,data:v}}},
    run:async function(ctx){return {sdkapi:"ok",input:ctx.input};}
  }};`;

  function buildWrapper(bundle: string, inputs = '{}', executionId = '"test-exec"', user = '{"userId":"test-user","email":"test@example.com","groups":[],"customClaims":{}}') {
    return `"use strict";
var module = { exports: {} };
var exports = module.exports;

var __sb_context = {
  user: ${user},
  inputs: ${inputs},
};
var __sb_executionId = ${executionId};

// --- begin bundle ---
${bundle}
// --- end bundle ---

var __sb_api = module.exports.default || module.exports;
if (!__sb_api || typeof __sb_api.run !== "function") {
  throw new Error("code-mode bundle does not export a valid CompiledApi (missing run function)");
}

if (typeof __sb_execute !== "function") {
  throw new Error("__sb_execute (sdk-api executeApi) not injected into sandbox");
}

var __sb_pluginIdMap = {};
if (__sb_api.integrations) {
  for (var __sb_i = 0; __sb_i < __sb_api.integrations.length; __sb_i++) {
    var __sb_decl = __sb_api.integrations[__sb_i];
    if (__sb_decl && __sb_decl.id && __sb_decl.pluginId) {
      __sb_pluginIdMap[__sb_decl.id] = __sb_decl.pluginId;
    }
  }
}

async function __sb_executeQuery(integrationId, request) {
  if (typeof __sb_integrationExecutor !== "function") {
    throw new Error("Integration operations require an integration executor (not available in this execution context)");
  }
  var pluginId = __sb_pluginIdMap[integrationId] || "";
  return __sb_integrationExecutor({
    integrationId: integrationId,
    pluginId: pluginId,
    actionConfiguration: request
  });
}

var __sb_result = await __sb_execute(__sb_api, {
  input: __sb_context.inputs,
  integrations: [],
  executionId: __sb_executionId,
  env: {},
  executeQuery: __sb_executeQuery,
});

if (!__sb_result.success) {
  var __sb_err = __sb_result.error || {};
  var __sb_msg = __sb_err.message || "SDK API execution failed";
  if (__sb_err.details) {
    var __sb_cause = __sb_err.details.cause;
    if (__sb_cause) {
      __sb_msg += ": " + (typeof __sb_cause === "string" ? __sb_cause : (__sb_cause.message || JSON.stringify(__sb_cause)));
    }
    if (__sb_err.details.issues) {
      __sb_msg += ": " + JSON.stringify(__sb_err.details.issues);
    }
  }
  throw new Error(__sb_msg);
}
return __sb_result.output;
`;
  }

  it('calls __sb_execute with CompiledApi and returns output on success', async () => {
    mockExecuteApi.mockResolvedValue({ success: true, output: { sdkapi: 'ok' } });

    const result = await evaluateWrapper(buildWrapper(asyncBundle, '{"name":"world"}'), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(result).toEqual({ sdkapi: 'ok' });
    expect(mockExecuteApi).toHaveBeenCalledTimes(1);

    const [api, request] = mockExecuteApi.mock.calls[0];
    expect(typeof api.run).toBe('function');
    expect(request.input).toEqual({ name: 'world' });
    expect(request.executionId).toBe('test-exec');
    expect(request.integrations).toEqual([]);
    expect(typeof request.executeQuery).toBe('function');
  });

  it('throws on execution failure', async () => {
    mockExecuteApi.mockResolvedValue({
      success: false,
      error: { code: 'INPUT_VALIDATION', message: 'Bad input' }
    });

    await expect(
      evaluateWrapper(buildWrapper(asyncBundle), {
        __sb_execute: mockExecuteApi,
        __sb_integrationExecutor: mockIntegrationExecutor
      })
    ).rejects.toThrow('Bad input');
  });

  it('throws when __sb_execute is not injected', async () => {
    await expect(evaluateWrapper(buildWrapper(asyncBundle), {})).rejects.toThrow(
      '__sb_execute (sdk-api executeApi) not injected'
    );
  });

  it('throws when bundle does not export a valid CompiledApi', async () => {
    const badBundle = 'module.exports = { notAnApi: true };';

    await expect(
      evaluateWrapper(buildWrapper(badBundle), {
        __sb_execute: mockExecuteApi,
        __sb_integrationExecutor: mockIntegrationExecutor
      })
    ).rejects.toThrow('does not export a valid CompiledApi');
  });

  it('defaults pluginId to empty for unknown integrationId', async () => {
    mockIntegrationExecutor.mockResolvedValue('ok');

    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>) => Promise<unknown> }) => {
      await req.executeQuery('unknown-integration', { action: 'test' });
      return { success: true, output: 'done' };
    });

    await evaluateWrapper(buildWrapper(asyncBundle), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(mockIntegrationExecutor).toHaveBeenCalledWith({
      integrationId: 'unknown-integration',
      pluginId: '',
      actionConfiguration: { action: 'test' }
    });
  });

  it('surfaces error details.cause in the thrown error message', async () => {
    mockExecuteApi.mockResolvedValue({
      success: false,
      error: {
        code: 'INTEGRATION_ERROR',
        message: 'Integration "db" failed during "query"',
        details: {
          integrationName: 'db',
          operation: 'query',
          cause: { message: 'ECONNREFUSED 127.0.0.1:5432' }
        }
      }
    });

    await expect(
      evaluateWrapper(buildWrapper(asyncBundle), {
        __sb_execute: mockExecuteApi,
        __sb_integrationExecutor: mockIntegrationExecutor
      })
    ).rejects.toThrow('ECONNREFUSED 127.0.0.1:5432');
  });

  it('surfaces string cause in the thrown error message', async () => {
    mockExecuteApi.mockResolvedValue({
      success: false,
      error: {
        code: 'INTEGRATION_ERROR',
        message: 'Integration "db" failed during "query"',
        details: { cause: 'connection timeout after 30s' }
      }
    });

    await expect(
      evaluateWrapper(buildWrapper(asyncBundle), {
        __sb_execute: mockExecuteApi,
        __sb_integrationExecutor: mockIntegrationExecutor
      })
    ).rejects.toThrow('connection timeout after 30s');
  });

  it('surfaces validation issues in the thrown error message', async () => {
    mockExecuteApi.mockResolvedValue({
      success: false,
      error: {
        code: 'INPUT_VALIDATION',
        message: 'Input validation failed',
        details: { issues: [{ path: ['name'], message: 'Required' }] }
      }
    });

    await expect(
      evaluateWrapper(buildWrapper(asyncBundle), {
        __sb_execute: mockExecuteApi,
        __sb_integrationExecutor: mockIntegrationExecutor
      })
    ).rejects.toThrow('Required');
  });

  // Bundle whose CompiledApi includes integration declarations in the post-compilation
  // array form produced by api() → extractIntegrationDeclarations(). In source code the
  // user writes `integrations: { db: postgres('uuid') }` but api() transforms that into
  // `[{ key: 'db', pluginId: 'postgres', id: 'uuid' }]`. The integration tests verify
  // this transformation using the real api() + postgres() functions.
  const bundleWithIntegrations = `module.exports={default:{
    inputSchema:{safeParse:function(v){return{success:true,data:v}}},
    outputSchema:{safeParse:function(v){return{success:true,data:v}}},
    integrations:[{key:"db",pluginId:"postgres",id:"pg-uuid-123"},{key:"cache",pluginId:"redis",id:"redis-uuid-456"}],
    run:async function(ctx){return {ok:true};}
  }};`;

  it('resolves pluginId from api.integrations when metadata is absent (real SDK path)', async () => {
    mockIntegrationExecutor.mockResolvedValue({ rows: [{ id: 1 }] });

    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>) => Promise<unknown> }) => {
      const queryResult = await req.executeQuery('pg-uuid-123', { body: 'SELECT 1' });
      return { success: true, output: queryResult };
    });

    const result = await evaluateWrapper(buildWrapper(bundleWithIntegrations), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(result).toEqual({ rows: [{ id: 1 }] });
    expect(mockIntegrationExecutor).toHaveBeenCalledWith({
      integrationId: 'pg-uuid-123',
      pluginId: 'postgres',
      actionConfiguration: { body: 'SELECT 1' }
    });
  });

  it('resolves pluginId for multiple integrations from api.integrations', async () => {
    mockIntegrationExecutor.mockResolvedValueOnce({ rows: [] });
    mockIntegrationExecutor.mockResolvedValueOnce('OK');

    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>) => Promise<unknown> }) => {
      const pgResult = await req.executeQuery('pg-uuid-123', { body: 'SELECT 1' });
      const redisResult = await req.executeQuery('redis-uuid-456', { command: 'GET key' });
      return { success: true, output: { pgResult, redisResult } };
    });

    const result = await evaluateWrapper(buildWrapper(bundleWithIntegrations), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(result).toEqual({ pgResult: { rows: [] }, redisResult: 'OK' });
    expect(mockIntegrationExecutor).toHaveBeenNthCalledWith(1, {
      integrationId: 'pg-uuid-123',
      pluginId: 'postgres',
      actionConfiguration: { body: 'SELECT 1' }
    });
    expect(mockIntegrationExecutor).toHaveBeenNthCalledWith(2, {
      integrationId: 'redis-uuid-456',
      pluginId: 'redis',
      actionConfiguration: { command: 'GET key' }
    });
  });

  it('throws when executeQuery called without integration executor', async () => {
    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>) => Promise<unknown> }) => {
      await req.executeQuery('some-integration', { action: 'test' });
      return { success: true, output: 'done' };
    });

    await expect(
      evaluateWrapper(buildWrapper(asyncBundle), {
        __sb_execute: mockExecuteApi
        // __sb_integrationExecutor intentionally omitted
      })
    ).rejects.toThrow('Integration operations require an integration executor');
  });
});
