/**
 * SDK API sandbox configuration.
 *
 * Provides the WASM sandbox libraries needed for SDK API code-mode execution:
 * 1. The pre-built sdk-api IIFE bundle (assigns exports to globalThis.__sdkApiModule)
 * 2. A require() shim that resolves @superblocksteam/sdk-api and zod imports
 *
 * These are registered as custom `SandboxLibrary` entries via the generic
 * `libraries` option on `SandboxOptions`, keeping sdk-api knowledge out of
 * the wasm-sandbox-js package.
 */

import { readFileSync } from 'fs';
import * as path from 'path';
import type { SandboxLibrary } from '@superblocks/wasm-sandbox-js';

/**
 * JavaScript source for the require() shim, evaluated eagerly in QuickJS.
 *
 * Maps known package names to their pre-loaded global modules:
 * - `@superblocksteam/sdk-api` -> `globalThis.__sdkApiModule`
 * - `zod` -> `globalThis.__zodModule`
 *
 * Subpath imports (e.g. `@superblocksteam/sdk-api/runtime`) resolve
 * to the same top-level module since the pre-built bundle includes
 * all subpath exports.
 *
 * Also exposes `__sb_execute` as a wrapper around `executeApi` for the
 * Go wrapper script (`code_delivery.go`).
 */
export const REQUIRE_SHIM_SOURCE = `
(function() {
  var modules = {
    "@superblocksteam/sdk-api": function() { return globalThis.__sdkApiModule; },
    // __zodModule is set by the sdk-api IIFE, so accessing __sdkApiModule first
    // ensures the IIFE has run and __zodModule is available.
    "zod": function() { void globalThis.__sdkApiModule; return globalThis.__zodModule; }
  };

  globalThis.require = function require(name) {
    // Exact match
    if (modules[name]) {
      return modules[name]();
    }
    // Subpath match (e.g. "@superblocksteam/sdk-api/runtime" -> sdk-api module)
    for (var prefix in modules) {
      if (name.indexOf(prefix + "/") === 0) {
        return modules[prefix]();
      }
    }
    throw new Error('Cannot require module "' + name + '" in WASM sandbox');
  };

  // Wrapper around sdk-api executeApi exposed for the Go wrapper script.
  globalThis.__sb_execute = function() {
    return globalThis.__sdkApiModule.executeApi.apply(globalThis.__sdkApiModule, arguments);
  };
})();
`;

/**
 * Loads the pre-built sdk-api IIFE bundle from the bundles directory.
 * The bundle is generated at build time by scripts/bundle-sdk-api.mjs.
 */
function loadSdkApiBundleSource(): string {
  // Walk up from __dirname to find the package root via package.json.
  // __dirname varies between dev/test (src/) and built (dist/src/).
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    try {
      readFileSync(path.join(dir, 'package.json'));
      break;
    } catch {
      dir = path.dirname(dir);
    }
  }
  // Try dist/ first (production — pnpm deploy only includes dist/), then src/ (dev/test).
  for (const subdir of ['dist/src/bundles', 'src/bundles']) {
    try {
      return readFileSync(path.join(dir, subdir, 'sdk-api.iife.js'), 'utf8');
    } catch { /* try next */ }
  }
  throw new Error(`sdk-api.iife.js not found in dist/src/bundles/ or src/bundles/ under ${dir}`);
}

/** Cached libraries array (bundle is read from disk once). */
let cached: SandboxLibrary[] | null = null;

/**
 * Returns the `SandboxLibrary` entries needed for SDK API execution.
 *
 * The sdk-api IIFE bundle is loaded eagerly (no `lazyGlobalName`) because
 * SDK API workers need sdk-api + zod ready before first task execution.
 * The require shim is also eager since it wires up `require()` and `__sb_execute`.
 */
export function getSdkApiSandboxLibraries(): SandboxLibrary[] {
  if (cached) return cached;
  cached = [
    { source: loadSdkApiBundleSource(), fileName: 'sdk-api.iife.js' },
    { source: REQUIRE_SHIM_SOURCE, fileName: 'require-shim' }
  ];
  return cached;
}
