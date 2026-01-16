import { createEventLoop } from './event-loop';
import { registerGlobalBuffer } from './globals/buffer';
import { CommonLibrary, registerCommonLazyLibrary } from './globals/common-libraries';
import { registerGlobalConsole } from './globals/console';
import { registerGlobalSetTimeout } from './globals/timers';
import { createMarshaller } from './marshal';
import { getQuickJS } from './quickjs';

type EvaluateLimits = {
  /**
   * Maximum execution time in milliseconds. This is a best-effort (soft) limit.
   * For a hard wall-clock timeout, run evaluation in a dedicated Worker thread and terminate it on deadline.
   *
   * If omitted, the evaluation will not be interrupted based on time.
   */
  timeMs?: number;
  /**
   * Maximum stack size for the QuickJS runtime, in bytes.
   */
  stackBytes?: number;
  /**
   * Maximum heap size for the QuickJS runtime, in bytes. If omitted, memory is
   * unlimited.
   */
  memoryBytes?: number;
};

export type EvaluateOptions = {
  /**
   * Global variables to inject into the VM. Supports primitives, objects, and arrays.
   *
   * To expose functions callable from the sandbox, wrap them with {@link hostFunction}:
   * @example
   * ```typescript
   * import { evaluateExpressions, hostFunction } from '@superblocks/wasm-sandbox-js';
   * await evaluateExpressions(['getData()'], {
   *   globals: { getData: hostFunction(() => 'result') }
   * });
   * ```
   */
  globals?: Record<string, unknown>;
  /**
   * Common libraries to lazily expose in the VM.
   */
  libraries?: CommonLibrary[];
  /**
   * Whether to enable timer APIs; currently only `setTimeout` is partially supported.
   */
  enableTimers?: boolean;
  /**
   * Whether to enable the Buffer API polyfill. Implements `Buffer.from` and `Buffer.isBuffer` only.
   */
  enableBuffer?: boolean;
  /**
   * Logger that will back the VM's `console`. If omitted, `console` will not be defined in the VM.
   */
  consoleLogger?: Pick<Console, 'log' | 'warn' | 'error'> | null;
  /**
   * Resource limits applied to the QuickJS runtime.
   */
  limits?: EvaluateLimits;
};

const defaultLimits: EvaluateLimits = {
  stackBytes: 1024 * 1024, // 1 MiB
  timeMs: 10_000, // 10 seconds
  memoryBytes: undefined
};

export const defaultOptions: Required<EvaluateOptions> = {
  globals: {},
  libraries: [],
  enableTimers: false,
  enableBuffer: false,
  consoleLogger: null,
  limits: defaultLimits
};

export async function prewarmEvaluator() {
  await getQuickJS();
}

export async function evaluateExpressions(expressions: string[], options: EvaluateOptions = {}): Promise<Record<string, unknown>> {
  const opts: Required<EvaluateOptions> = {
    ...defaultOptions,
    ...options,
    limits: { ...defaultLimits, ...options.limits }
  };
  const QuickJS = await getQuickJS();

  const runtime = QuickJS.newRuntime();
  // Use a monotonic clock for deadlines so host clock adjustments (NTP, manual changes)
  // can't cause timeouts to trigger early/late.
  const deadlineMs = opts.limits.timeMs !== undefined ? performance.now() + opts.limits.timeMs : undefined;
  if (opts.limits.stackBytes !== undefined) {
    runtime.setMaxStackSize(opts.limits.stackBytes);
  }
  if (opts.limits.memoryBytes !== undefined) {
    runtime.setMemoryLimit(opts.limits.memoryBytes);
  }
  if (deadlineMs !== undefined) {
    runtime.setInterruptHandler(() => performance.now() >= deadlineMs);
  }

  const ctx = runtime.newContext();

  // Register Buffer before creating marshaller (marshaller needs `Buffer` to be available in the VM)
  if (opts.enableBuffer) {
    registerGlobalBuffer(ctx, { memoryLimitBytes: opts.limits.memoryBytes });
  }

  const eventLoop = createEventLoop(ctx, { deadlineMs });
  const marshaller = createMarshaller(ctx, { eventLoop, enableBuffer: opts.enableBuffer });
  const { extractValue, injectValue } = marshaller;

  try {
    const results: Record<string, unknown> = {};

    if (opts.consoleLogger) {
      registerGlobalConsole(ctx, opts.consoleLogger);
    }

    if (opts.enableTimers) {
      registerGlobalSetTimeout(ctx, eventLoop);
    }

    if (opts.libraries.includes('lodash')) {
      registerCommonLazyLibrary(ctx, 'lodash');
    }
    if (opts.libraries.includes('moment')) {
      registerCommonLazyLibrary(ctx, 'moment');
    }

    for (const [name, value] of Object.entries(opts.globals)) {
      const handle = injectValue(value);
      ctx.setProp(ctx.global, name, handle);
      handle.dispose();
    }

    for (const expression of expressions) {
      // Handle empty or whitespace-only expressions
      // These would result in invalid syntax like `(async () => ( ))()` if we tried to evaluate them
      const trimmedExpression = expression.trim();
      if (trimmedExpression === '') {
        results[expression] = undefined;
        continue;
      }

      // Wrap expression in an async IIFE to:
      // 1. Disambiguate object literals `{a: 1}` from block statements
      // 2. Enable top-level `await` in expressions (QuickJS doesn't support top-level await outside modules)
      // The async IIFE returns a Promise that runUntilSettled handles.
      const wrappedExpression = `(async () => (${trimmedExpression}))()`;
      const result = ctx.evalCode(wrappedExpression, '<expression>', {
        type: 'global',
        strict: false
      });

      if (result.error) {
        const error = ctx.dump(result.error);
        result.error.dispose();

        throw new Error(errorValueToMessage(error));
      } else {
        try {
          // Run event loop until the promise settles
          const promiseState = await eventLoop.runUntilSettled(result.value);

          if (promiseState.type === 'fulfilled') {
            const valueHandle = promiseState.value;
            try {
              const value = extractValue(valueHandle);
              results[expression] = value;
            } catch (error) {
              // Cyclic objects cause marshal recursion to overflow, so surface a clearer error
              if (error instanceof RangeError) {
                throw new Error('Failed to serialize value: possible cyclic structure');
              }
              throw error;
            } finally {
              if (valueHandle.alive) {
                valueHandle.dispose();
              }
            }
          } else if (promiseState.error instanceof Error) {
            throw promiseState.error;
          } else {
            const errorHandle = promiseState.error;
            const errorDump = (() => {
              try {
                return ctx.dump(errorHandle);
              } finally {
                if (errorHandle.alive) {
                  errorHandle.dispose();
                }
              }
            })();
            throw new Error(errorValueToMessage(errorDump));
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(String(error));
        } finally {
          // promiseState.value/error may be the same handle as result.value (for non-promises or already-settled),
          // so it might have been disposed already. Check if it's still alive before disposing.
          if (result.value.alive) {
            result.value.dispose();
          }
        }
      }
    }

    return results;
  } finally {
    // Ensure any pending host operations (timers / host promises) are cancelled/cleaned up
    // before disposing the QuickJS context/runtime.
    eventLoop.dispose();
    marshaller.dispose();
    ctx.dispose();
    runtime.dispose();
  }
}

function errorValueToMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  try {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
