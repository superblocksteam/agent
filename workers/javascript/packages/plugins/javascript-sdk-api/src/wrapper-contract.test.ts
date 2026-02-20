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

async function __sb_executeQuery(integrationId, request, metadata) {
  if (typeof __sb_integrationExecutor !== "function") {
    throw new Error("Integration operations require an integration executor (not available in this execution context)");
  }
  var pluginId = (metadata && metadata.pluginId) || "";
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
  throw new Error(__sb_result.error ? __sb_result.error.message || JSON.stringify(__sb_result.error) : "SDK API execution failed");
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

  it('bridges executeQuery to __sb_integrationExecutor with pluginId', async () => {
    mockIntegrationExecutor.mockResolvedValue({ rows: [{ id: 1 }] });

    // Set up __sb_execute to call executeQuery from the request
    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>, meta: { pluginId: string }) => Promise<unknown> }) => {
      const queryResult = await req.executeQuery('my-postgres', { body: 'SELECT 1' }, { pluginId: 'postgres' });
      return { success: true, output: queryResult };
    });

    const result = await evaluateWrapper(buildWrapper(asyncBundle), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(result).toEqual({ rows: [{ id: 1 }] });
    expect(mockIntegrationExecutor).toHaveBeenCalledWith({
      integrationId: 'my-postgres',
      pluginId: 'postgres',
      actionConfiguration: { body: 'SELECT 1' }
    });
  });

  it('executeQuery defaults pluginId to empty when metadata is absent', async () => {
    mockIntegrationExecutor.mockResolvedValue('ok');

    mockExecuteApi.mockImplementation(async (_api: unknown, req: { executeQuery: (id: string, request: Record<string, unknown>) => Promise<unknown> }) => {
      await req.executeQuery('some-integration', { action: 'test' });
      return { success: true, output: 'done' };
    });

    await evaluateWrapper(buildWrapper(asyncBundle), {
      __sb_execute: mockExecuteApi,
      __sb_integrationExecutor: mockIntegrationExecutor
    });

    expect(mockIntegrationExecutor).toHaveBeenCalledWith({
      integrationId: 'some-integration',
      pluginId: '',
      actionConfiguration: { action: 'test' }
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
