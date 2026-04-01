/**
 * SDK API WASM sandbox benchmarks measuring init and evaluation latency
 * with the sdk-api bundle + require shim loaded.
 *
 * Run with: NODE_OPTIONS=--experimental-vm-modules npx jest --verbose --no-coverage --runInBand sandbox.bench
 */
import { createSandbox, type SandboxOptions } from '@superblocks/wasm-sandbox-js';
import { getQuickJS } from '@superblocks/wasm-sandbox-js/dist/src/quickjs';
import { getSdkApiSandboxLibraries } from './sdk-api-sandbox';

const SDK_API_OPTIONS: SandboxOptions = {
  enableAtob: true,
  enableBuffer: true,
  libraries: getSdkApiSandboxLibraries()
};

const MINIMAL_CODE = `
(async function() {
"use strict";
var sdkApi = require("@superblocksteam/sdk-api");
return { hasExecuteApi: typeof sdkApi.executeApi === "function" };
})()
`;

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

describe('SDK API WASM sandbox benchmarks', () => {
  beforeAll(async () => {
    await getQuickJS();
  }, 30_000);

  it('full cycle (create → setGlobals → evaluate → dispose)', async () => {
    const N = 30;
    const globals = makeGlobals(2);
    const result = await measure(async () => {
      const sandbox = await createSandbox(SDK_API_OPTIONS);
      sandbox.setGlobals(globals);
      await sandbox.evaluate(MINIMAL_CODE, { timeLimitMs: 5000, wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
      sandbox.dispose();
    }, N);
    console.log(`SDK API WASM full cycle [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
  });

  it('createSandbox latency (sdk-api + require shim)', async () => {
    const N = 50;
    const result = await measure(async () => {
      const sandbox = await createSandbox(SDK_API_OPTIONS);
      sandbox.dispose();
    }, N);
    console.log(`createSandbox (sdk-api) [N=${N}]: mean=${fmt(result.mean)} min=${fmt(result.min)} max=${fmt(result.max)} p99=${fmt(result.p99)}`);
  });
});
