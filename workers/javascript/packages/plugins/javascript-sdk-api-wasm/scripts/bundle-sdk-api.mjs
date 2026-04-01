/**
 * Pre-bundles @superblocksteam/sdk-api and zod into a self-contained IIFE
 * for use in the QuickJS WASM sandbox.
 *
 * The output assigns sdk-api exports to `globalThis.__sdkApiModule` and
 * zod exports to `globalThis.__zodModule`, enabling the require() shim
 * to resolve both packages inside QuickJS where no native module system exists.
 *
 * Run: node scripts/bundle-sdk-api.mjs
 * Output: src/bundles/sdk-api.iife.js
 */
import * as esbuild from 'esbuild';
import { mkdirSync, copyFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'src', 'bundles');
const outfile = path.join(outDir, 'sdk-api.iife.js');

/**
 * Entry code that re-exports sdk-api and zod as separate globals.
 *
 * IMPORTANT: __zodModule must match the shape of `import * as zod from "zod"`
 * because esbuild generates `require("zod").z` for `import { z } from "zod"`.
 * Returning just `z` itself wouldn't work — we need the full module object.
 *
 * We construct __zodModule by spreading sdk-api's `z` (which is the zod namespace)
 * and adding a self-referencing `z` property, matching zod's actual module shape.
 */
const entryCode = `
import * as sdkApi from '@superblocksteam/sdk-api';
globalThis.__sdkApiModule = sdkApi;
// sdkApi.z IS the zod namespace (has .object, .string, etc.)
// but esbuild generates require("zod").z for \`import { z } from "zod"\`
// so the module object needs a .z property pointing to itself.
globalThis.__zodModule = Object.assign(Object.create(null), sdkApi.z, { z: sdkApi.z });
`;

// Ensure src/bundles/ exists (directory is not tracked in git).
mkdirSync(outDir, { recursive: true });

await esbuild.build({
  stdin: {
    contents: entryCode,
    resolveDir: path.join(__dirname, '..'),
    loader: 'js'
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  mainFields: ['module', 'main'],
  conditions: ['import', 'default'],
  minify: true,
  outfile,
  external: [],
  logLevel: 'info'
});

console.log(`sdk-api bundle written to ${outfile}`);

// Also copy to dist/ so the bundle survives `pnpm deploy --prod` (which strips src/).
const distBundleDir = path.join(__dirname, '..', 'dist', 'src', 'bundles');
mkdirSync(distBundleDir, { recursive: true });
copyFileSync(outfile, path.join(distBundleDir, 'sdk-api.iife.js'));
console.log(`sdk-api bundle copied to ${distBundleDir}`);
