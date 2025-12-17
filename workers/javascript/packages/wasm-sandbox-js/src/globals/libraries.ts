import type { QuickJSContext } from 'quickjs-emscripten';

/**
 * Loads a library into the VM's global scope by evaluating its source code.
 *
 * Requirements for `source`:
 * - The string must be fully self contained (no imports/requires or external dependencies).
 * - The code is responsible for whatever globals it needs to create; this helper
 *   simply executes the source.
 * If the library does not ship such a bundle, produce one yourself (e.g. rollup/webpack
 * IIFE/UMD build) and use that output as `source`.
 * `fileName` is used only for error/stack trace context in QuickJS.
 */
export function registerGlobalLibrary(ctx: QuickJSContext, source: string, fileName: string) {
  const result = ctx.evalCode(source, fileName, { type: 'global', strict: false });

  if (result.error) {
    const error = ctx.dump(result.error);
    result.error.dispose();
    throw new Error(`Failed to load ${fileName}: ${JSON.stringify(error)}`);
  }
  result.value.dispose();
}

/**
 * Factory function that receives a `loadLibrary` helper and the global name,
 * then defines a lazy getter on `globalThis`. When the getter is triggered,
 * it calls the host function which evaluates the library code directly via
 * `ctx.evalCode`.
 */
const LAZY_LIBRARY_FACTORY = `
(function(loadLibrary, globalName) {
  Object.defineProperty(globalThis, globalName, {
    configurable: true,
    enumerable: true,
    get() {
      // Remove the getter so the library can define the property
      delete globalThis[globalName];

      // Call host to load the library
      loadLibrary();

      // Return the now-defined library
      return globalThis[globalName];
    }
  });
})
`;

/**
 * Exposes a library as a lazy-loaded global in the VM.
 *
 * Instead of immediately parsing and executing the library code, this defines
 * a getter on globalThis that loads the library on first access. Once loaded,
 * the getter is replaced with the actual library object.
 *
 * Requirements for `source`:
 * - The string must be fully self contained (no imports/requires or external dependencies).
 * - The code itself must assign the exported value to `globalThis[globalName]`
 *   (this loader does not perform that assignment).
 * If the library does not ship such a bundle, produce one yourself (e.g. rollup/webpack
 * IIFE/UMD build that writes to the expected global) and use that output as `source`.
 *
 * @param ctx - The QuickJS context
 * @param source - The library source code as a string
 * @param globalName - The name to expose on globalThis (e.g., "_" for lodash, "moment" for moment)
 * @param fileName - The filename to use for error messages (e.g., "lodash.min.js")
 */
export function registerGlobalLazyLibrary(ctx: QuickJSContext, source: string, globalName: string, libraryName: string, librarySourceFileName: string) {
  // Create host function that loads the library via reentrant evalCode
  const loadLibraryFn = ctx.newFunction('loadLibrary', () => {
    registerGlobalLibrary(ctx, source, librarySourceFileName);
    return ctx.undefined;
  });

  // Create handle for globalName string
  const globalNameHandle = ctx.newString(globalName);

  // Evaluate the factory function.
  const factoryResult = ctx.evalCode(LAZY_LIBRARY_FACTORY, `"<lazy-library-setup:${libraryName}>`, {
    type: 'global',
    strict: true
  });

  if (factoryResult.error) {
    const error = ctx.dump(factoryResult.error);
    factoryResult.error.dispose();
    loadLibraryFn.dispose();
    globalNameHandle.dispose();
    throw new Error(`Failed to setup lazy library factory: ${JSON.stringify(error)}`);
  }

  // Call the factory function with loadLibrary and globalName
  const installResult = ctx.callFunction(factoryResult.value, ctx.undefined, [loadLibraryFn, globalNameHandle]);
  factoryResult.value.dispose();
  loadLibraryFn.dispose();
  globalNameHandle.dispose();

  if (installResult.error) {
    const error = ctx.dump(installResult.error);
    installResult.error.dispose();
    throw new Error(`Failed to setup lazy loader for ${globalName}: ${JSON.stringify(error)}`);
  }
  installResult.value.dispose();
}
