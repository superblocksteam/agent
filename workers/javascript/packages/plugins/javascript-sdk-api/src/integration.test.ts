/**
 * Integration tests: validates the full sdk-api execution pipeline end-to-end.
 *
 * Unlike the contract tests (which mock __sb_execute), these tests use the REAL
 * executeApi function from @superblocksteam/sdk-api. This validates:
 * - Zod input validation rejects bad input
 * - Zod output validation rejects bad output
 * - The run() function executes with a properly constructed ApiContext
 * - The integration executor bridge correctly routes operations
 * - Error handling and response shapes match expectations
 *
 * The test simulates the same environment as production: a CJS bundle string
 * evaluated through the wrapper pattern with real sdk-api globals injected.
 */

// Dynamic import of the ESM sdk-api package (same approach as the plugin)
async function loadSdkApi(): Promise<{
  executeApi: (...args: unknown[]) => Promise<{ success: boolean; output?: unknown; error?: { code: string; message: string; details?: unknown } }>;
  api: (...args: unknown[]) => unknown;
  z: { object: (...args: unknown[]) => unknown; string: () => unknown; number: () => unknown };
}> {
  return await import('@superblocksteam/sdk-api') as never;
}

/**
 * Evaluates a wrapper script with injected globals, simulating the VM2 sandbox.
 */
function evaluateWrapper(
  wrapperScript: string,
  globals: Record<string, unknown> = {}
): Promise<unknown> {
  const globalNames = Object.keys(globals);
  const globalValues = Object.values(globals);

  const wrappedCode = `(async function(${globalNames.join(',')}) {\n${wrapperScript}\n})`;
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return ${wrappedCode}`);
  return fn()(...globalValues);
}

/**
 * Builds a wrapper script matching what generateWrapperScript produces in Go.
 * integrations is always [] because code-mode resolves them lazily via executeQuery.
 */
function buildWrapper(
  bundle: string,
  inputs = '{}',
  executionId = '"integration-test"'
) {
  return `"use strict";
var module = { exports: {} };
var exports = module.exports;

var __sb_context = {
  user: {"userId":"test-user","email":"test@example.com","groups":[],"customClaims":{}},
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
  user: __sb_context.user,
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

const TEST_USER = { userId: 'test-user', email: 'test@example.com', groups: [] as string[], customClaims: {} };

describe('sdk-api integration tests (real executeApi)', () => {
  let executeApi: (...args: unknown[]) => Promise<unknown>;
  let api: (...args: unknown[]) => unknown;
  let z: { object: (...args: unknown[]) => unknown; string: () => { uuid: () => unknown }; number: () => { min: (n: number) => unknown } };

  beforeAll(async () => {
    const sdkApi = await loadSdkApi();
    executeApi = sdkApi.executeApi;
    api = sdkApi.api;
    z = sdkApi.z as never;
  });

  describe('happy path: validated input → run → validated output', () => {
    it('executes a simple API with string input/output', async () => {
      // Build a CompiledApi using the real sdk-api api() function
      const compiledApi = api({
        name: 'test',
        input: z.object({ greeting: z.string() }),
        output: z.object({ message: z.string() }),
        integrations: {},
        async run(_ctx: unknown, input: { greeting: string }) {
          return { message: `${input.greeting}, world!` };
        }
      });

      // Serialize as a CJS bundle (simulating esbuild output)
      // We can't stringify the real CompiledApi (has Zod schemas), so we pass it directly
      // through the executeApi call — simulating what happens after the wrapper extracts it
      const result = await (executeApi as Function)(compiledApi, {
        input: { greeting: 'Hello' },
        integrations: [],
        executionId: 'test-exec-1',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      });

      expect(result).toEqual({
        success: true,
        output: { message: 'Hello, world!' }
      });
    });

    it('executes with numeric inputs', async () => {
      const compiledApi = api({
        name: 'test',
        input: z.object({ a: z.number(), b: z.number() }),
        output: z.object({ sum: z.number() }),
        integrations: {},
        async run(_ctx: unknown, input: { a: number; b: number }) {
          return { sum: input.a + input.b };
        }
      });

      const result = await (executeApi as Function)(compiledApi, {
        input: { a: 17, b: 25 },
        integrations: [],
        executionId: 'test-exec-2',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      });

      expect(result).toEqual({
        success: true,
        output: { sum: 42 }
      });
    });
  });

  describe('input validation', () => {
    it('rejects input that fails Zod validation', async () => {
      const compiledApi = api({
        name: 'test',
        input: z.object({ name: z.string() }),
        output: z.object({ ok: z.string() }),
        integrations: {},
        async run() {
          return { ok: 'should not reach here' };
        }
      });

      const result = await (executeApi as Function)(compiledApi, {
        input: { name: 12345 }, // number instead of string
        integrations: [],
        executionId: 'test-input-fail',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      }) as { success: boolean; error?: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INPUT_VALIDATION');
    });

    it('rejects missing required fields', async () => {
      const compiledApi = api({
        name: 'test',
        input: z.object({ requiredField: z.string() }),
        output: z.object({ ok: z.string() }),
        integrations: {},
        async run() {
          return { ok: 'should not reach here' };
        }
      });

      const result = await (executeApi as Function)(compiledApi, {
        input: {}, // missing requiredField
        integrations: [],
        executionId: 'test-input-missing',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      }) as { success: boolean; error?: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INPUT_VALIDATION');
    });
  });

  describe('output validation', () => {
    it('rejects output that fails Zod validation', async () => {
      const compiledApi = api({
        name: 'test',
        input: z.object({}),
        output: z.object({ count: z.number() }),
        integrations: {},
        async run() {
          return { count: 'not-a-number' } as never; // wrong type
        }
      });

      const result = await (executeApi as Function)(compiledApi, {
        input: {},
        integrations: [],
        executionId: 'test-output-fail',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      }) as { success: boolean; error?: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OUTPUT_VALIDATION');
    });
  });

  describe('run() errors', () => {
    it('catches thrown errors in run() and returns error response', async () => {
      const compiledApi = api({
        name: 'test',
        input: z.object({}),
        output: z.object({ ok: z.string() }),
        integrations: {},
        async run() {
          throw new Error('Something went wrong in user code');
        }
      });

      const result = await (executeApi as Function)(compiledApi, {
        input: {},
        integrations: [],
        executionId: 'test-run-error',
        env: {},
        user: TEST_USER,
        executeQuery: jest.fn()
      }) as { success: boolean; error?: { code: string; message: string } };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXECUTION_ERROR');
      expect(result.error?.message).toContain('Something went wrong in user code');
    });
  });

  describe('integration executor bridge (end-to-end with wrapper)', () => {
    it('routes integration calls through __sb_integrationExecutor', async () => {
      const mockIntegrationExecutor = jest.fn().mockResolvedValue([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      // Declare integrations on the CompiledApi so getIntegrationDeclarations builds ctx.integrations.db.
      // request.integrations stays [] (lazy resolution via executeQuery, matching production).
      const bundle = `
        module.exports = { default: {
          name: 'test',
          inputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          outputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          integrations: [{ key: 'db', pluginId: 'postgres', id: 'Production DB' }],
          run: async function(ctx) {
            var schema = { safeParse: function(v) { return { success: true, data: v }; } };
            var rows = await ctx.integrations.db.query('SELECT * FROM users', schema);
            return { users: rows };
          }
        }};`;

      const result = await evaluateWrapper(
        buildWrapper(bundle),
        {
          __sb_execute: executeApi,
          __sb_integrationExecutor: mockIntegrationExecutor
        }
      );

      expect(result).toEqual({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });

      // Verify the integration executor was called with the right params
      expect(mockIntegrationExecutor).toHaveBeenCalledTimes(1);
      const call = mockIntegrationExecutor.mock.calls[0][0];
      expect(call.integrationId).toBe('Production DB');
      expect(call.actionConfiguration).toEqual(
        expect.objectContaining({ body: 'SELECT * FROM users' })
      );
    });

    it('propagates integration executor errors as thrown exceptions', async () => {
      const mockIntegrationExecutor = jest.fn().mockRejectedValue(
        new Error('Connection refused')
      );

      const bundle = `
        module.exports = { default: {
          name: 'test',
          inputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          outputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          integrations: [{ key: 'db', pluginId: 'postgres', id: 'Broken DB' }],
          run: async function(ctx) {
            return await ctx.integrations.db.execute('DROP TABLE users');
          }
        }};`;

      await expect(
        evaluateWrapper(
          buildWrapper(bundle),
          {
            __sb_execute: executeApi,
            __sb_integrationExecutor: mockIntegrationExecutor
          }
        )
      ).rejects.toThrow(/Integration.*failed|Connection refused/);
    });
  });

  describe('wrapper + real executeApi with inline bundle', () => {
    it('end-to-end: wrapper evaluates bundle, executeApi validates, returns output', async () => {
      // An inline CJS bundle with safeParse that enforces types
      const bundle = `
        module.exports = { default: {
          name: 'test',
          inputSchema: {
            safeParse: function(v) {
              if (!v || typeof v.name !== 'string') return { success: false, error: { issues: [{ message: 'name must be a string' }] } };
              return { success: true, data: v };
            }
          },
          outputSchema: {
            safeParse: function(v) {
              if (!v || typeof v.greeting !== 'string') return { success: false, error: { issues: [{ message: 'greeting must be a string' }] } };
              return { success: true, data: v };
            }
          },
          integrations: [],
          run: async function(ctx, input) {
            return { greeting: 'Hello, ' + input.name + '!' };
          }
        }};`;

      const result = await evaluateWrapper(
        buildWrapper(bundle, '{"name":"Alice"}'),
        {
          __sb_execute: executeApi,
          __sb_integrationExecutor: jest.fn()
        }
      );

      expect(result).toEqual({ greeting: 'Hello, Alice!' });
    });

    it('end-to-end: executeApi rejects invalid input via wrapper', async () => {
      const bundle = `
        module.exports = { default: {
          name: 'test',
          inputSchema: {
            safeParse: function(v) {
              if (!v || typeof v.name !== 'string') return { success: false, error: { issues: [{ message: 'name required' }] } };
              return { success: true, data: v };
            }
          },
          outputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          integrations: [],
          run: async function(ctx) { return { ok: true }; }
        }};`;

      // Input is missing 'name' — should fail validation and throw
      await expect(
        evaluateWrapper(
          buildWrapper(bundle, '{}'), // empty input
          {
            __sb_execute: executeApi,
            __sb_integrationExecutor: jest.fn()
          }
        )
      ).rejects.toThrow('Input validation failed');
    });

    it('end-to-end: executeApi rejects invalid output via wrapper', async () => {
      const bundle = `
        module.exports = { default: {
          name: 'test',
          inputSchema: { safeParse: function(v) { return { success: true, data: v }; } },
          outputSchema: {
            safeParse: function(v) {
              if (!v || typeof v.count !== 'number') return { success: false, error: { issues: [{ message: 'count must be number' }] } };
              return { success: true, data: v };
            }
          },
          integrations: [],
          run: async function(ctx) {
            return { count: 'not-a-number' };
          }
        }};`;

      await expect(
        evaluateWrapper(
          buildWrapper(bundle, '{}'),
          {
            __sb_execute: executeApi,
            __sb_integrationExecutor: jest.fn()
          }
        )
      ).rejects.toThrow('Output validation failed');
    });
  });
});
