/**
 * Sandbox-level benchmarks measuring QuickJS WASM init and evaluation latency.
 *
 * These isolate the WASM execution cost without any gRPC, Redis, or network overhead.
 * Run with: cd workers/javascript && NODE_OPTIONS=--experimental-vm-modules npx jest --verbose --no-coverage --runInBand sandbox.bench
 *
 * Key phases measured:
 * - WASM module load (getQuickJS singleton — cold start only)
 * - Sandbox creation (runtime + context + marshaller + polyfills)
 * - Globals injection (setGlobals with varying payload sizes)
 * - Code evaluation (evaluate with fixture bundles)
 * - Full cycle (create → setGlobals → evaluate → dispose)
 */
import { createSandbox, type SandboxOptions } from './sandbox';
import { getQuickJS } from './quickjs';

// ---------------------------------------------------------------------------
// Fixture code strings (simulating orchestrator wrapper scripts)
// ---------------------------------------------------------------------------

const MINIMAL_CODE = `
(async function() {
"use strict";
var module = { exports: {} };
var exports = module.exports;
module.exports.default = {
  run: async function(context) {
    return { message: "hello", input: context.input };
  },
  integrations: []
};
var __sb_api = module.exports.default;
var __sb_result = await __sb_api.run({
  input: __sb_context.inputs,
  user: __sb_context.user,
});
return __sb_result;
})()
`;

// ~2KB of code simulating a CRUD app wrapper
const CRUD_CODE = `
(async function() {
"use strict";
var module = { exports: {} };
var exports = module.exports;

function validateInput(input) {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  return input;
}

async function getUsers(ctx) {
  var validated = validateInput(ctx.input);
  return { users: [], pagination: { limit: validated.limit || 10, offset: validated.offset || 0 } };
}

async function createUser(ctx) {
  var validated = validateInput(ctx.input);
  return { user: { name: validated.name, email: validated.email } };
}

module.exports.default = {
  run: async function(context) {
    if (context.input && context.input.action === "create") {
      return createUser(context);
    }
    return getUsers(context);
  },
  integrations: [
    { id: "postgres-1", pluginId: "postgres" },
    { id: "slack-1", pluginId: "slack" }
  ]
};
var __sb_api = module.exports.default;
var __sb_result = await __sb_api.run({
  input: __sb_context.inputs,
  user: __sb_context.user,
});
return __sb_result;
})()
`;

/** Options matching the plain javascript-wasm plugin (lodash + moment). */
const JS_WASM_OPTIONS: SandboxOptions = {
  enableAtob: true,
  enableBuffer: true,
  globalLibraries: ['lodash', 'moment'],
};

/** Minimal options (no polyfills/libraries) — baseline for comparison. */
const LEAN_OPTIONS: SandboxOptions = {};

function makeGlobals(numInputs: number) {
  const inputs: Record<string, unknown> = {};
  for (let i = 0; i < numInputs; i++) {
    inputs[`input_${i}`] = `value_${i}`;
  }
  return {
    __sb_context: {
      user: { userId: 'bench-user', email: 'bench@test.com', name: 'Bench', groups: [], customClaims: {} },
      inputs,
    },
    __sb_executionId: 'bench-exec',
  };
}

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------

async function measure(fn: () => Promise<void>, iterations: number): Promise<{ mean: number; min: number; max: number; p99: number }> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    mean: times.reduce((s, t) => s + t, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

function fmt(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

// ---------------------------------------------------------------------------
// Tests (used as benchmarks via timing)
// ---------------------------------------------------------------------------

describe('WASM sandbox benchmarks', () => {
  // Warm up QuickJS WASM module once before all tests
  beforeAll(async () => {
    await getQuickJS();
  }, 30_000);

  describe('createSandbox latency', () => {
    it('with full options (atob + buffer + lodash + moment)', async () => {
      const N = 50;
      const result = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.dispose();
      }, N);
      console.log(`createSandbox (full options) [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });

    it('with lean options (no polyfills)', async () => {
      const N = 50;
      const result = await measure(async () => {
        const sandbox = await createSandbox(LEAN_OPTIONS);
        sandbox.dispose();
      }, N);
      console.log(`createSandbox (lean options) [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });
  });

  describe('setGlobals latency', () => {
    it('with 2 inputs', async () => {
      const N = 50;
      const globals = makeGlobals(2);
      const result = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.setGlobals(globals);
        sandbox.dispose();
      }, N);
      console.log(`createSandbox + setGlobals (2 inputs) [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });

    it('with 50 inputs', async () => {
      const N = 50;
      const globals = makeGlobals(50);
      const result = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.setGlobals(globals);
        sandbox.dispose();
      }, N);
      console.log(`createSandbox + setGlobals (50 inputs) [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });
  });

  describe('full cycle latency (create → setGlobals → evaluate → dispose)', () => {
    it('minimal code', async () => {
      const N = 30;
      const globals = makeGlobals(2);
      const result = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.setGlobals(globals);
        await sandbox.evaluate(MINIMAL_CODE, { timeLimitMs: 5000, wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
        sandbox.dispose();
      }, N);
      console.log(`full cycle — minimal [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });

    it('CRUD app code', async () => {
      const N = 30;
      const globals = makeGlobals(5);
      const result = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.setGlobals(globals);
        await sandbox.evaluate(CRUD_CODE, { timeLimitMs: 5000, wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
        sandbox.dispose();
      }, N);
      console.log(`full cycle — CRUD [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
    });

    it('lean options vs full options (minimal code)', async () => {
      const N = 30;
      const globals = makeGlobals(2);

      const fullResult = await measure(async () => {
        const sandbox = await createSandbox(JS_WASM_OPTIONS);
        sandbox.setGlobals(globals);
        await sandbox.evaluate(MINIMAL_CODE, { timeLimitMs: 5000, wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
        sandbox.dispose();
      }, N);

      const leanResult = await measure(async () => {
        const sandbox = await createSandbox(LEAN_OPTIONS);
        sandbox.setGlobals(globals);
        await sandbox.evaluate(MINIMAL_CODE, { timeLimitMs: 5000, wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
        sandbox.dispose();
      }, N);

      console.log(`full options [N=${N}]: mean=${fmt(fullResult.mean)} min=${fmt(fullResult.min)} p99=${fmt(fullResult.p99)}`);
      console.log(`lean options [N=${N}]: mean=${fmt(leanResult.mean)} min=${fmt(leanResult.min)} p99=${fmt(leanResult.p99)}`);
      console.log(`savings: ${fmt(fullResult.mean - leanResult.mean)} (${((1 - leanResult.mean / fullResult.mean) * 100).toFixed(1)}%)`);
    });
  });

});
