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

export type RegisterGlobalBufferOptions = {
  /**
   * Upper bound on the number of bytes `Buffer.from(string)` is allowed to allocate on the host and
   * copy into the VM. This is intended to be wired to the evaluator's `limits.memoryBytes` so host
   * allocations can't bypass the VM memory limit.
   *
   * Note: this is a strict cap on this host-side encoding step. Even if the encoded output fits
   * under this cap, QuickJS may still throw a memory error when copying the bytes into the VM if
   * the runtime is already close to its own heap limit.
   */
  memoryLimitBytes?: number;
};

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
export function registerGlobalBuffer(ctx: QuickJSContext, options: RegisterGlobalBufferOptions = {}) {
  const { memoryLimitBytes } = options;

  // Create host function for fast string encoding using native Node.js Buffer
  const encodeStringFn = ctx.newFunction('encodeString', (strHandle: QuickJSHandle, encodingHandle: QuickJSHandle) => {
    // `ctx.getString(...)` allocates a UTF-8 C string inside the QuickJS runtime.
    // If the runtime is at/near its memory limit, that allocation can fail and return a null pointer.
    // quickjs-emscripten converts that null pointer to an empty string, which would silently corrupt data.
    const str = ctx.getString(strHandle);
    // Detect that case by comparing the VM string length to the extracted host string length.
    // We only do the extra `.length` property access on the rare empty-string path.
    if (str.length === 0) {
      const lengthHandle = ctx.getProp(strHandle, 'length');
      const vmStringLength = ctx.getNumber(lengthHandle);
      lengthHandle.dispose();

      // Fail closed: if we couldn't reliably read the VM length, or it indicates the VM string is non-empty,
      // treat this as an out-of-memory read failure.
      if (!Number.isFinite(vmStringLength) || vmStringLength > 0) {
        throw ctx.newError('Buffer.from(string): failed to read string from VM (out of memory)');
      }
    }
    const encoding = ctx.getString(encodingHandle) as BufferEncoding;

    // Preflight the *maximum* encoded size before allocating a potentially huge host Buffer.
    // For base64/hex, Buffer.byteLength may overestimate for invalid inputs; this is OK (conservative).
    if (memoryLimitBytes !== undefined) {
      const estimatedByteLength = Buffer.byteLength(str, encoding);
      if (estimatedByteLength > memoryLimitBytes) {
        throw ctx.newError(
          `Buffer.from(string): encoded size (${estimatedByteLength} bytes) exceeds memory limit (${memoryLimitBytes} bytes)`
        );
      }
    }

    // Use native Node.js Buffer for correct encoding/decoding semantics.
    const nodeBuffer = Buffer.from(str, encoding);

    // Defensive check in case the preflight estimate is not exact for some encodings.
    if (memoryLimitBytes !== undefined && nodeBuffer.byteLength > memoryLimitBytes) {
      throw ctx.newError(
        `Buffer.from(string): encoded size (${nodeBuffer.byteLength} bytes) exceeds memory limit (${memoryLimitBytes} bytes)`
      );
    }

    // `ctx.newArrayBuffer(...)` copies the *entire* provided ArrayBuffer into the VM.
    // Node's `Buffer.from(string, encoding)` may return a view into a larger ArrayBuffer,
    // so `nodeBuffer.buffer` can be larger than `nodeBuffer.byteLength`. Passing it through would
    // over-copy and potentially expose unrelated bytes (which could be a security risk) to the sandbox.
    // If the Buffer already spans its entire backing store we can pass it directly; otherwise
    // slice out the exact region (host copy).
    const exactArrayBuffer =
      nodeBuffer.byteOffset === 0 && nodeBuffer.byteLength === nodeBuffer.buffer.byteLength
        ? nodeBuffer.buffer
        : nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

    return ctx.newArrayBuffer(exactArrayBuffer);
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
