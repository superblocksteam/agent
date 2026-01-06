import type { EventLoop } from './event-loop';
import type { QuickJSContext, QuickJSHandle } from 'quickjs-emscripten-core';

/**
 * Symbol used to define custom marshalling behavior when injecting objects into the VM.
 * When an object has a method keyed by this symbol, that method is called and
 * its return value is marshalled instead of the original object.
 *
 * This is useful for class instances where you want to expose prototype methods
 * (which are not enumerable and would otherwise be excluded).
 *
 * Similar to how `toJSON` works for `JSON.stringify`.
 *
 * @example
 * ```typescript
 * import { toVmValue, hostFunction } from '@superblocks/wasm-sandbox-js';
 *
 * class MyClass {
 *   private secret = 'hidden';
 *   public data = 'visible';
 *
 *   getData() {
 *     return this.data;
 *   }
 *
 *   [toVmValue]() {
 *     return {
 *       data: this.data,
 *       getData: hostFunction(this.getData.bind(this))
 *     };
 *   }
 * }
 * ```
 */
export const toVmValue = Symbol('toVmValue');

/**
 * Wrapper class for functions that should be callable from the sandbox.
 * The class is not exported - only the hostFunction() factory is public.
 */
class HostFunctionWrapper<T extends (...args: unknown[]) => unknown> {
  constructor(public readonly fn: T) {}
}

/**
 * Marks a function as safe to expose to the sandbox.
 *
 * Use this to explicitly opt-in when passing functions via `globals` to
 * `evaluateExpressions`. Functions not wrapped with `hostFunction()` will
 * throw an error when marshalling to the VM.
 *
 * When the sandbox calls this function:
 * - Arguments are extracted from the VM and passed to the host function
 * - `this` is bound to `undefined` (use arrow functions or `.bind()` if you need a specific context)
 * - Return values (including Promises) are marshalled back to the VM
 * - Thrown errors are propagated to the VM as exceptions
 *
 * @example
 * ```typescript
 * import { evaluateExpressions, hostFunction } from '@superblocks/wasm-sandbox-js';
 *
 * await evaluateExpressions(['getData()'], {
 *   globals: {
 *     getData: hostFunction(() => ({ foo: 'bar' }))
 *   }
 * });
 * ```
 *
 * @param fn - The function to expose to the sandbox
 * @returns A wrapped function that can be passed in globals
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hostFunction<T extends (...args: any[]) => any>(fn: T): HostFunctionWrapper<T> {
  return new HostFunctionWrapper(fn);
}

type ToVmHelpers = {
  extractValue: (handle: QuickJSHandle) => unknown;
  eventLoop: EventLoop;
  /** Only provided when Buffer support is enabled */
  createBuffer?: (bytes: Buffer) => QuickJSHandle;
};

type DeferredPromise = ReturnType<QuickJSContext['newPromise']>;

function safeDisposeDeferred(deferred: DeferredPromise): void {
  try {
    deferred.dispose();
  } catch {
    // best-effort: context may already be in teardown
  }
}

function settleDeferredFulfilled(
  ctx: QuickJSContext,
  deferred: DeferredPromise,
  value: unknown,
  helpers: ToVmHelpers
): void {
  let handle: QuickJSHandle | undefined;
  let errorHandle: QuickJSHandle | undefined;

  try {
    // Marshal using a fresh cycle detector for each settlement.
    handle = marshalToVm(ctx, value, helpers);
    deferred.resolve(handle);
  } catch (marshalError) {
    // If marshalling (or resolving) fails (e.g., value is a BigInt),
    // reject with an error describing the failure.
    errorHandle = marshalError instanceof Error ? ctx.newError(marshalError.message) : ctx.newError(String(marshalError));
    try {
      deferred.reject(errorHandle);
    } catch {
      // best-effort: context may already be in teardown
    }
  } finally {
    handle?.dispose();
    errorHandle?.dispose();
    safeDisposeDeferred(deferred);
  }
}

function settleDeferredRejected(ctx: QuickJSContext, deferred: DeferredPromise, err: unknown, helpers: ToVmHelpers): void {
  let errHandle: QuickJSHandle | undefined;
  let fallbackHandle: QuickJSHandle | undefined;

  try {
    // If the rejection reason is an Error, create a VM Error.
    // Otherwise, marshal the value as-is to preserve JavaScript semantics
    // where any value can be thrown/rejected.
    // Marshal using a fresh cycle detector for each settlement.
    errHandle = err instanceof Error ? ctx.newError(err.message) : marshalToVm(ctx, err, helpers);
    deferred.reject(errHandle);
  } catch (marshalError) {
    // If marshalling (or rejecting) fails (e.g., rejection reason is a BigInt),
    // reject with a fallback error describing the failure.
    fallbackHandle = marshalError instanceof Error ? ctx.newError(marshalError.message) : ctx.newError(String(marshalError));
    try {
      deferred.reject(fallbackHandle);
    } catch {
      // best-effort: context may already be in teardown
    }
  } finally {
    errHandle?.dispose();
    fallbackHandle?.dispose();
    safeDisposeDeferred(deferred);
  }
}

/**
 * Creates a VM-callable wrapper for an explicitly allowed host function.
 * This is a key sandbox boundary: it extracts args from the VM, invokes the host,
 * then marshals the result/error back into the VM. Async results are bridged via
 * the EventLoop so timeouts/teardown can abort pending work safely.
 */
function createVmHostFunction<T extends (...args: unknown[]) => unknown>(
  ctx: QuickJSContext,
  fn: T,
  helpers: ToVmHelpers
): QuickJSHandle {
  const { extractValue, eventLoop } = helpers;

  return ctx.newFunction(fn.name || '', (...argHandles: QuickJSHandle[]) => {
    const args = argHandles.map((h) => extractValue(h));

    let result: unknown;
    try {
      result = fn(...args);
    } catch (err) {
      // If the thrown value is an Error, create a VM Error.
      // Otherwise, marshal the value as-is to preserve JavaScript semantics
      // where any value can be thrown (not just Error objects).
      // Throwing a handle directly transfers it as an exception in the VM.
      const errHandle = err instanceof Error ? ctx.newError(err.message) : marshalToVm(ctx, err, helpers);
      throw errHandle;
    }

    // Handle async functions that return Promises
    if (result instanceof Promise) {
      const deferred = ctx.newPromise();

      eventLoop.trackPromise(result, {
        onFulfilled(value) {
          settleDeferredFulfilled(ctx, deferred, value, helpers);
        },
        onRejected(err) {
          settleDeferredRejected(ctx, deferred, err, helpers);
        },
        onAbort() {
          // If the sandbox times out/tears down before the host promise settles,
          // ensure we don't call back into QuickJS from a later settlement.
          safeDisposeDeferred(deferred);
        }
      });

      // Return the promise handle - ownership transfers to caller
      // The deferred will be disposed when the promise settles or on sandbox disposal
      return deferred.handle;
    }

    // Marshal using a fresh cycle detector for each call.
    return marshalToVm(ctx, result, helpers);
  });
}

type FromVmHelpers = {
  isArray: (handle: QuickJSHandle) => boolean;
  /** Only provided when Buffer support is enabled */
  isBuffer?: (handle: QuickJSHandle) => boolean;
  getObjectKeys: (handle: QuickJSHandle) => string[];
  /** WeakSet of visited objects to detect cycles during extraction from VM */
  visitedSet: QuickJSHandle;
  /** Helper to check membership in the visited set */
  weakSetHas: (visited: QuickJSHandle, handle: QuickJSHandle) => boolean;
  /** Helper to add to the visited set */
  weakSetAdd: (visited: QuickJSHandle, handle: QuickJSHandle) => void;
};

export type MarshallerOptions = {
  eventLoop: EventLoop;
  /** Whether Buffer support is enabled (requires Buffer to be registered on ctx.global) */
  enableBuffer?: boolean;
};

export type Marshaller = {
  /** Converts a QuickJS handle to a host value. Caller retains ownership of handle. */
  extractValue: (handle: QuickJSHandle) => unknown;
  /** Converts a host value to a QuickJS handle. Caller owns returned handle. */
  injectValue: (value: unknown) => QuickJSHandle;
  /** Disposes all internal VM handles. Must be called when done. */
  dispose: () => void;
};

/**
 * Converts a host value to a QuickJS value handle by recursively walking
 * the value structure. Supports primitives, arrays, objects, functions
 * (including async functions that return Promises), and Buffers (when
 * Buffer support is enabled via createBuffer option).
 *
 * @param ctx - The QuickJS context
 * @param hostValue - The host value to marshal into the VM
 * @param helpers - Helper functions for host-to-VM conversion including extractValue, eventLoop, and optional createBuffer
 * @param seen - Internal set of visited host objects/arrays used for cycle detection (injected for recursion)
 * @returns A QuickJSHandle representing the value in the VM. Caller owns the returned handle.
 */
export function marshalToVm(
  ctx: QuickJSContext,
  hostValue: unknown,
  helpers: ToVmHelpers,
  seen: WeakSet<object> = new WeakSet()
): QuickJSHandle {
  // Primitives - static handles have static lifetime, safe to return
  if (hostValue === null) return ctx.null;
  if (hostValue === undefined) return ctx.undefined;
  if (typeof hostValue === 'boolean') return hostValue ? ctx.true : ctx.false;
  if (typeof hostValue === 'number') return ctx.newNumber(hostValue);
  if (typeof hostValue === 'string') return ctx.newString(hostValue);

  // Host functions - must be wrapped with hostFunction() for explicit opt-in
  if (hostValue instanceof HostFunctionWrapper) {
    return createVmHostFunction(ctx, hostValue.fn, helpers);
  }

  // Raw functions without hostFunction() wrapper - throw helpful error
  if (typeof hostValue === 'function') {
    throw new Error(
      'Cannot expose function to sandbox without explicit opt-in. ' +
        'Use hostFunction() to mark functions as safe to expose:\n' +
        "  import { hostFunction } from '@superblocks/wasm-sandbox-js';\n" +
        '  globals: { myFn: hostFunction(myFn) }'
    );
  }

  // Buffer - check before Array since Buffer is array-like
  if (Buffer.isBuffer(hostValue)) {
    if (!helpers.createBuffer) {
      throw new Error('Cannot marshal Buffer: Buffer support is not enabled');
    }
    return helpers.createBuffer(hostValue);
  }

  // Arrays
  if (Array.isArray(hostValue)) {
    if (seen.has(hostValue)) {
      throw new Error('Cannot marshal cyclic structures');
    }
    seen.add(hostValue);

    const arr = ctx.newArray();
    try {
      for (let i = 0; i < hostValue.length; i++) {
        const elemHandle = marshalToVm(ctx, hostValue[i], helpers, seen);
        ctx.setProp(arr, i, elemHandle);
        elemHandle.dispose();
      }
      return arr;
    } catch (err) {
      arr.dispose();
      throw err;
    }
  }

  // Objects (including class instances with prototype methods)
  if (typeof hostValue === 'object') {
    if (seen.has(hostValue)) {
      throw new Error('Cannot marshal cyclic structures');
    }
    seen.add(hostValue);

    // Check for custom marshalling method (similar to toJSON for JSON.stringify)
    const customMarshal = (hostValue as Record<symbol, unknown>)[toVmValue];
    if (typeof customMarshal === 'function') {
      return marshalToVm(ctx, customMarshal.call(hostValue), helpers, seen);
    }

    const obj = ctx.newObject();
    try {
      for (const [key, val] of Object.entries(hostValue)) {
        const valHandle = marshalToVm(ctx, val, helpers, seen);
        ctx.setProp(obj, key, valHandle);
        valHandle.dispose();
      }
      return obj;
    } catch (err) {
      obj.dispose();
      throw err;
    }
  }

  throw new Error(`Unsupported type: ${typeof hostValue}`);
}

const ARRAY_INDEX_KEY_RE = /^(0|[1-9]\d*)$/;

/**
 * Checks if an array property as returned by Object.keys() is a valid array index within `length`.
 * Returns the numeric index for valid indices, or `null` for non-index keys (e.g. "01", "1e9", "foo") or out-of-range indices.
 */
function extractValidArrayIndex(key: string, length: number): number | null {
  // JS array indices are canonical unsigned integer strings in the range [0, 2^32 - 2].
  // See: https://tc39.es/ecma262/#array-index
  if (!ARRAY_INDEX_KEY_RE.test(key)) return null;

  const index = Number(key);
  // 2^32 - 1 is not a valid array index (it's reserved for the `length` sentinel).
  if (!Number.isSafeInteger(index) || index < 0 || index >= 2 ** 32 - 1) return null;

  if (index >= length) return null;
  return index;
}

/**
 * Converts a QuickJS value handle to a host value by recursively walking
 * the value structure. Supports primitives, arrays, objects, and Buffers
 * (when Buffer support is enabled).
 *
 * @param ctx - The QuickJS context
 * @param handle - The QuickJS handle to extract. Caller retains ownership.
 * @param helpers - Helper functions for type checking (isArray, isBuffer, getObjectKeys)
 * @returns The extracted host value
 */
export function marshalFromVm(ctx: QuickJSContext, handle: QuickJSHandle, helpers: FromVmHelpers): unknown {
  const { isArray, isBuffer, getObjectKeys, visitedSet, weakSetAdd, weakSetHas } = helpers;

  const type = ctx.typeof(handle);

  // Primitives
  if (type === 'undefined') return undefined;
  if (type === 'boolean') return ctx.sameValue(handle, ctx.true);
  if (type === 'number') return ctx.getNumber(handle);
  if (type === 'string') return ctx.getString(handle);

  // null is typeof 'object' in JS, so we need to check explicitly
  if (type === 'object') {
    // Check for null before any cycle detection or property access (avoid expensive dump of large objects)
    if (ctx.sameValue(handle, ctx.null)) return null;

    // Detect cycles using a WeakSet of visited objects.
    if (weakSetHas(visitedSet, handle)) {
      throw new Error('Cannot serialize cyclic structures');
    }
    weakSetAdd(visitedSet, handle);

    // Check for toJSON method (mimics JSON.stringify behavior)
    // We call toJSON() inside the VM (where the method exists), then return an object
    // with a toJSON method that returns the extracted value. This preserves the
    // serialization behavior so that when the caller calls JSON.stringify, it will
    // produce the same result as if JSON.stringify were called inside the VM.
    const toJsonHandle = ctx.getProp(handle, 'toJSON');
    const toJsonType = ctx.typeof(toJsonHandle);
    if (toJsonType === 'function') {
      const result = ctx.callFunction(toJsonHandle, handle, []);
      toJsonHandle.dispose();
      if (result.error) {
        result.error.dispose();
        // If toJSON throws, fall through to normal object handling
      } else {
        try {
          const extractedValue = marshalFromVm(ctx, result.value, helpers);
          // Return a wrapper that preserves the toJSON behavior for the caller
          return { toJSON: () => extractedValue };
        } finally {
          result.value.dispose();
        }
      }
    } else {
      toJsonHandle.dispose();
    }

    // Check for Buffer first (before array, since Buffer extends Uint8Array)
    if (isBuffer?.(handle)) {
      // Bulk extract bytes: read Buffer's underlying ArrayBuffer once, then copy the view into a Node.js Buffer.
      // We intentionally copy (not share) because the VM and its allocations are about to be disposed.
      const bufferHandle = ctx.getProp(handle, 'buffer');
      const byteOffsetHandle = ctx.getProp(handle, 'byteOffset');
      const byteLengthHandle = ctx.getProp(handle, 'byteLength');

      const byteOffset = ctx.getNumber(byteOffsetHandle);
      const byteLength = ctx.getNumber(byteLengthHandle);

      byteOffsetHandle.dispose();
      byteLengthHandle.dispose();

      const arrayBufferView = ctx.getArrayBuffer(bufferHandle);
      bufferHandle.dispose();
      try {
        const slice = arrayBufferView.value.subarray(byteOffset, byteOffset + byteLength);
        return Buffer.from(slice);
      } finally {
        arrayBufferView.dispose();
      }
    }

    // Check for array
    // We use Object.keys to get only defined indices, avoiding CPU/memory exhaustion
    // from sparse arrays with huge length but few elements (e.g., `a = []; a[1e9] = 1`)
    if (isArray(handle)) {
      const lengthHandle = ctx.getProp(handle, 'length');
      const length = ctx.getNumber(lengthHandle);
      lengthHandle.dispose();

      const keys = getObjectKeys(handle);
      const arr: unknown[] = [];
      arr.length = length; // Preserve original length (keeps array sparse if it was sparse)

      for (const key of keys) {
        const index = extractValidArrayIndex(key, length);
        if (index === null) continue;

        const elemHandle = ctx.getProp(handle, index);
        try {
          arr[index] = marshalFromVm(ctx, elemHandle, helpers);
        } finally {
          elemHandle.dispose();
        }
      }
      return arr;
    }

    // Regular object - get keys and recursively extract
    const keys = getObjectKeys(handle);
    const obj: Record<string, unknown> = {};
    for (const key of keys) {
      const valHandle = ctx.getProp(handle, key);
      try {
        obj[key] = marshalFromVm(ctx, valHandle, helpers);
      } finally {
        valHandle.dispose();
      }
    }
    return obj;
  }

  // Functions are not supported for extraction.
  // Functions and symbols return undefined (mimics JSON.stringify behavior)
  if (type === 'function') {
    return undefined;
  }
  if (type === 'symbol') {
    return undefined;
  }

  // BigInt throws (mimics JSON.stringify behavior which throws TypeError for BigInt)
  if (type === 'bigint') {
    throw new Error('Cannot serialize BigInt value');
  }

  // Unknown types return undefined (mimics JSON.stringify behavior)
  return undefined;
}

/**
 * Creates a marshaller for converting values between host and VM.
 * Sets up all necessary VM handles and helper functions.
 *
 * @param ctx - The QuickJS context
 * @param options - Configuration including eventLoop and whether Buffer is enabled
 * @returns A Marshaller with extractValue, injectValue, and dispose methods
 */
export function createMarshaller(ctx: QuickJSContext, options: MarshallerOptions): Marshaller {
  const { eventLoop, enableBuffer } = options;

  // Get VM handles for type checking
  const vmArrayHandle = ctx.getProp(ctx.global, 'Array');
  const vmArrayIsArrayFn = ctx.getProp(vmArrayHandle, 'isArray');
  const vmObjectHandle = ctx.getProp(ctx.global, 'Object');
  const vmObjectKeysFn = ctx.getProp(vmObjectHandle, 'keys');

  // WeakSet handles for cycle detection
  const vmWeakSetCtor = ctx.getProp(ctx.global, 'WeakSet');
  const vmWeakSetPrototype = ctx.getProp(vmWeakSetCtor, 'prototype');
  const vmWeakSetHasFn = ctx.getProp(vmWeakSetPrototype, 'has');
  const vmWeakSetAddFn = ctx.getProp(vmWeakSetPrototype, 'add');

  // Buffer support handles (only if enabled)
  let vmBufferHandle: QuickJSHandle | undefined;
  let vmBufferIsBufferFn: QuickJSHandle | undefined;
  let vmBufferFromFn: QuickJSHandle | undefined;

  if (enableBuffer) {
    vmBufferHandle = ctx.getProp(ctx.global, 'Buffer');
    vmBufferIsBufferFn = ctx.getProp(vmBufferHandle, 'isBuffer');
    vmBufferFromFn = ctx.getProp(vmBufferHandle, 'from');
  }

  // Helper to check if a VM value is an array
  const isArray = (handle: QuickJSHandle): boolean => {
    const result = ctx.callFunction(vmArrayIsArrayFn, vmArrayHandle, [handle]);
    if (result.error) {
      result.error.dispose();
      return false;
    }
    const isArr = ctx.sameValue(result.value, ctx.true);
    result.value.dispose();
    return isArr;
  };

  // Helper to check if a VM value is a Buffer
  const isBuffer: FromVmHelpers['isBuffer'] = vmBufferIsBufferFn
    ? (handle: QuickJSHandle): boolean => {
        const result = ctx.callFunction(vmBufferIsBufferFn, vmBufferHandle!, [handle]);
        if (result.error) {
          result.error.dispose();
          return false;
        }
        const isBuf = ctx.sameValue(result.value, ctx.true);
        result.value.dispose();
        return isBuf;
      }
    : undefined;

  // Helper to get object keys from a VM object
  const getObjectKeys = (handle: QuickJSHandle): string[] => {
    const result = ctx.callFunction(vmObjectKeysFn, vmObjectHandle, [handle]);
    if (result.error) {
      result.error.dispose();
      return [];
    }
    const keysHandle = result.value;
    const lengthHandle = ctx.getProp(keysHandle, 'length');
    const length = ctx.getNumber(lengthHandle);
    lengthHandle.dispose();

    const keys: string[] = [];
    for (let i = 0; i < length; i++) {
      const keyHandle = ctx.getProp(keysHandle, i);
      keys.push(ctx.getString(keyHandle));
      keyHandle.dispose();
    }
    keysHandle.dispose();
    return keys;
  };

  // Helper to create a VM Buffer from host bytes
  const createBuffer = vmBufferFromFn
    ? (bytes: Buffer): QuickJSHandle => {
        // Copy the exact bytes into the VM as an ArrayBuffer and then call Buffer.from(ArrayBuffer).
        // We avoid passing pooled Buffer backing stores because that would expose extra bytes to the sandbox.
        const exactArrayBuffer =
          bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
            ? bytes.buffer
            : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        const arrayBufferHandle = ctx.newArrayBuffer(exactArrayBuffer);
        const result = ctx.callFunction(vmBufferFromFn!, vmBufferHandle!, [arrayBufferHandle]);
        arrayBufferHandle.dispose();

        if (result.error) {
          const errorDump = ctx.dump(result.error);
          result.error.dispose();
          throw new Error(`Failed to create Buffer in VM: ${JSON.stringify(errorDump)}`);
        }
        return result.value;
      }
    : undefined;

  const createVisitedSet = (): QuickJSHandle => {
    const result = ctx.evalCode('new WeakSet()', '<weakset>', { type: 'global', strict: false });
    if (result.error) {
      const errorDump = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(`Failed to create WeakSet for cycle detection: ${JSON.stringify(errorDump)}`);
    }
    return result.value;
  };

  const weakSetHas = (visited: QuickJSHandle, handle: QuickJSHandle): boolean => {
    const result = ctx.callFunction(vmWeakSetHasFn, visited, [handle]);
    if (result.error) {
      result.error.dispose();
      return false;
    }
    const exists = ctx.sameValue(result.value, ctx.true);
    result.value.dispose();
    return exists;
  };

  const weakSetAdd = (visited: QuickJSHandle, handle: QuickJSHandle): void => {
    const result = ctx.callFunction(vmWeakSetAddFn, visited, [handle]);
    if (result.error) {
      const errorDump = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(`Failed to track object for cycle detection: ${JSON.stringify(errorDump)}`);
    }
    result.value.dispose();
  };

  const baseFromVmHelpers = { isArray, isBuffer, getObjectKeys, weakSetHas, weakSetAdd } as const;

  const extractValue = (handle: QuickJSHandle): unknown => {
    const visitedSet = createVisitedSet();
    try {
      const helpers: FromVmHelpers = { ...baseFromVmHelpers, visitedSet };
      return marshalFromVm(ctx, handle, helpers);
    } finally {
      visitedSet.dispose();
    }
  };

  const injectValue = (value: unknown): QuickJSHandle => {
    return marshalToVm(ctx, value, { extractValue, eventLoop, createBuffer });
  };

  const dispose = (): void => {
    vmBufferFromFn?.dispose();
    vmBufferIsBufferFn?.dispose();
    vmBufferHandle?.dispose();
    vmWeakSetAddFn.dispose();
    vmWeakSetHasFn.dispose();
    vmWeakSetPrototype.dispose();
    vmWeakSetCtor.dispose();
    vmObjectKeysFn.dispose();
    vmObjectHandle.dispose();
    vmArrayIsArrayFn.dispose();
    vmArrayHandle.dispose();
  };

  return { extractValue, injectValue, dispose };
}
