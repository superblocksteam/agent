import type { QuickJSContext, QuickJSHandle } from 'quickjs-emscripten';

/**
 * Factory function that receives the host's encodeString helper and installs
 * the Buffer class on globalThis. This pattern avoids polluting the global
 * namespace with the helper function.
 */
const BUFFER_POLYFILL = `
(function(encodeString) {
  class Buffer extends Uint8Array {
    static from(input, offsetOrEncoding, length) {
      if (typeof input === 'string') {
        const bytes = encodeString(input, offsetOrEncoding || 'utf-8');
        return new Buffer(bytes);
      }
      if (input instanceof ArrayBuffer) {
        return new Buffer(input, offsetOrEncoding, length);
      }
      return new Buffer(input);
    }

    static isBuffer(obj) {
      return obj instanceof Buffer;
    }
  }
  globalThis.Buffer = Buffer;
})
`;

/**
 * Exposes a minimal `Buffer` polyfill to the VM.
 *
 * This provides a subset of Node.js Buffer API:
 * - `Buffer.from(input, encoding?)` - Creates a Buffer from a string (with encoding) or array
 * - `Buffer.isBuffer(obj)` - Checks if an object is a Buffer instance
 *
 * Supported encodings: 'utf-8' (default), 'base64', 'hex', 'binary', 'latin1'
 *
 * The Buffer class extends Uint8Array, so all TypedArray methods are available.
 *
 * Implementation uses a hybrid approach:
 * - The Buffer class is defined in the VM (so `instanceof Buffer` works)
 * - String encoding is delegated to a host function using Node.js native Buffer (for performance)
 */
export function registerGlobalBuffer(ctx: QuickJSContext) {
  // Create host function for fast string encoding using native Node.js Buffer
  const encodeStringFn = ctx.newFunction('encodeString', (strHandle: QuickJSHandle, encodingHandle: QuickJSHandle) => {
    const str = ctx.getString(strHandle);
    const encoding = ctx.getString(encodingHandle) as BufferEncoding;

    // Use native Node.js Buffer for fast encoding
    const nodeBuffer = Buffer.from(str, encoding);
    const bytes = Array.from(nodeBuffer);

    // Marshal the byte array back to the VM
    const arr = ctx.newArray();
    for (let i = 0; i < bytes.length; i++) {
      const numHandle = ctx.newNumber(bytes[i]);
      ctx.setProp(arr, i, numHandle);
      numHandle.dispose();
    }
    return arr;
  });

  // Evaluate the factory function.
  // We use 'global' mode (not 'module') because we need to get the function expression's value back.
  // Strict mode is enabled for safety since our polyfill code is strict-mode compatible.
  const factoryResult = ctx.evalCode(BUFFER_POLYFILL, '<buffer-polyfill>', {
    type: 'global',
    strict: true
  });

  if (factoryResult.error) {
    const error = ctx.dump(factoryResult.error);
    factoryResult.error.dispose();
    encodeStringFn.dispose();
    throw new Error(`Failed to load Buffer polyfill: ${JSON.stringify(error)}`);
  }

  // Call the factory function with the encodeString helper
  const installResult = ctx.callFunction(factoryResult.value, ctx.undefined, [encodeStringFn]);
  factoryResult.value.dispose();
  encodeStringFn.dispose();

  if (installResult.error) {
    const error = ctx.dump(installResult.error);
    installResult.error.dispose();
    throw new Error(`Failed to install Buffer polyfill: ${JSON.stringify(error)}`);
  }
  installResult.value.dispose();
}
