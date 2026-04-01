import { createSandbox } from '@superblocks/wasm-sandbox-js';
import type { Sandbox } from '@superblocks/wasm-sandbox-js';
import { getSdkApiSandboxLibraries, REQUIRE_SHIM_SOURCE } from './sdk-api-sandbox';

describe('getSdkApiSandboxLibraries', () => {
  it('returns exactly two library entries', () => {
    const libs = getSdkApiSandboxLibraries();
    expect(libs).toHaveLength(2);
  });

  it('returns the sdk-api IIFE bundle as the first entry', () => {
    const libs = getSdkApiSandboxLibraries();
    const bundle = libs[0];
    expect(bundle.fileName).toBe('sdk-api.iife.js');
    expect(bundle.source.length).toBeGreaterThan(1000);
    expect(bundle.source).toContain('__sdkApiModule');
    expect(bundle.source).toContain('__zodModule');
    expect(bundle.lazyGlobalName).toBeUndefined();
  });

  it('returns the require shim as the second entry', () => {
    const libs = getSdkApiSandboxLibraries();
    const shim = libs[1];
    expect(shim.fileName).toBe('require-shim');
    expect(shim.source).toBe(REQUIRE_SHIM_SOURCE);
    expect(shim.lazyGlobalName).toBeUndefined();
  });

  it('caches the result across calls', () => {
    const a = getSdkApiSandboxLibraries();
    const b = getSdkApiSandboxLibraries();
    expect(a).toBe(b);
  });
});

describe('REQUIRE_SHIM_SOURCE', () => {
  it('defines require as a global function', () => {
    expect(REQUIRE_SHIM_SOURCE).toContain('globalThis.require = function require');
  });

  it('maps @superblocksteam/sdk-api to __sdkApiModule', () => {
    expect(REQUIRE_SHIM_SOURCE).toContain('"@superblocksteam/sdk-api"');
    expect(REQUIRE_SHIM_SOURCE).toContain('__sdkApiModule');
  });

  it('maps zod to __zodModule', () => {
    expect(REQUIRE_SHIM_SOURCE).toContain('"zod"');
    expect(REQUIRE_SHIM_SOURCE).toContain('__zodModule');
  });

  it('defines __sb_execute wrapper', () => {
    expect(REQUIRE_SHIM_SOURCE).toContain('globalThis.__sb_execute');
    expect(REQUIRE_SHIM_SOURCE).toContain('executeApi');
  });
});

describe('require-shim (sandbox integration)', () => {
  let sandbox: Sandbox;

  beforeEach(async () => {
    sandbox = await createSandbox({ libraries: getSdkApiSandboxLibraries() });
  });

  afterEach(() => {
    sandbox.dispose();
  });

  it('registers require as a global function', async () => {
    const result = await sandbox.evaluate('(async function() { return typeof globalThis.require; })()');
    expect(result).toBe('function');
  });

  it('eagerly initializes sdk-api module during sandbox creation', async () => {
    const result = await sandbox.evaluate(`(async function() {
      var descriptor = Object.getOwnPropertyDescriptor(globalThis, "__sdkApiModule");
      return {
        hasGetter: typeof (descriptor && descriptor.get),
        hasExecuteApi: typeof globalThis.__sdkApiModule.executeApi
      };
    })()`);
    expect(result).toEqual({
      hasGetter: 'undefined',
      hasExecuteApi: 'function'
    });
  });

  it('sets __sb_execute as a global function', async () => {
    const result = await sandbox.evaluate('(async function() { return typeof globalThis.__sb_execute; })()');
    expect(result).toBe('function');
  });

  it('resolves require("@superblocksteam/sdk-api") with api function', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof require("@superblocksteam/sdk-api").api; })()'
    );
    expect(result).toBe('function');
  });

  it('resolves require("@superblocksteam/sdk-api") with executeApi function', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof require("@superblocksteam/sdk-api").executeApi; })()'
    );
    expect(result).toBe('function');
  });

  it('resolves subpath require("@superblocksteam/sdk-api/runtime") to the same module', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof require("@superblocksteam/sdk-api/runtime").api; })()'
    );
    expect(result).toBe('function');
  });

  it('resolves require("zod") with z.object function', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof require("zod").z.object; })()'
    );
    expect(result).toBe('function');
  });

  it('resolves subpath require("zod/v4") to the zod module', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof require("zod/v4").z; })()'
    );
    expect(result).toBe('object');
  });

  it('throws for unknown modules', async () => {
    await expect(
      sandbox.evaluate('(async function() { return require("unknown-package"); })()')
    ).rejects.toThrow('Cannot require module "unknown-package" in WASM sandbox');
  });

  it('__sb_execute delegates to executeApi', async () => {
    const result = await sandbox.evaluate(
      '(async function() { return typeof __sb_execute === "function"; })()'
    );
    expect(result).toBe(true);
  });
});
