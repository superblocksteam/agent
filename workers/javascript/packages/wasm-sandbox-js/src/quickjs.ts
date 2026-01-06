/**
 * Local wrapper for quickjs-emscripten to avoid importing all variant packages.
 * This uses only the release-sync variant that we need.
 */
import { newQuickJSWASMModuleFromVariant, type QuickJSWASMModule } from 'quickjs-emscripten-core';
import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';

let singletonPromise: Promise<QuickJSWASMModule> | undefined = undefined;

/**
 * Get a shared singleton QuickJSWASMModule. Use this to evaluate code
 * or create Javascript environments.
 */
export async function getQuickJS(): Promise<QuickJSWASMModule> {
  singletonPromise ??= newQuickJSWASMModuleFromVariant(RELEASE_SYNC);
  return await singletonPromise;
}
