import type { QuickJSContext, QuickJSHandle } from 'quickjs-emscripten-core';

/**
 * Exposes `atob` and `btoa` polyfills to the VM by delegating to the host
 * environment's native implementations.
 *
 * - `btoa(string)` encodes a binary string (each character in 0-255) to Base64.
 * - `atob(string)` decodes a Base64 string to a binary string.
 *
 * Both functions match the browser specification (WindowOrWorkerGlobalScope).
 * Validation (e.g., character range for `btoa`, invalid Base64 for `atob`)
 * is handled by the host's native implementation.
 */
export function registerGlobalAtob(ctx: QuickJSContext) {
  const btoa_handle = ctx.newFunction('btoa', (strHandle: QuickJSHandle) => {
    const str = ctx.getString(strHandle);
    try {
      return ctx.newString(btoa(str));
    } catch (e) {
      throw ctx.newError(e instanceof Error ? e.message : String(e));
    }
  });

  const atob_handle = ctx.newFunction('atob', (strHandle: QuickJSHandle) => {
    const str = ctx.getString(strHandle);
    try {
      return ctx.newString(atob(str));
    } catch (e) {
      throw ctx.newError(e instanceof Error ? e.message : String(e));
    }
  });

  ctx.setProp(ctx.global, 'btoa', btoa_handle);
  ctx.setProp(ctx.global, 'atob', atob_handle);
  btoa_handle.dispose();
  atob_handle.dispose();
}
