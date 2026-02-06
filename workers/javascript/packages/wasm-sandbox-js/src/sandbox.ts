import type { QuickJSContext, QuickJSRuntime } from 'quickjs-emscripten-core';
import { createEventLoop, EventLoop } from './event-loop';
import { INTERNAL_WRAPPER_LINES, adjustErrorLineNumbers, createErrorFromQuickJS } from './error';
import { registerGlobalAtob } from './globals/atob';
import { registerGlobalBuffer } from './globals/buffer';
import { CommonLibrary, registerCommonLazyLibrary } from './globals/common-libraries';
import { registerGlobalConsole } from './globals/console';
import { registerGlobalSetTimeout } from './globals/timers';
import { createMarshaller, Marshaller, HostGetterWrapper } from './marshal';
import { getQuickJS } from './quickjs';

type SandboxLimits = {
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

/**
 * Options for creating a sandbox.
 * These are "fixed" options that apply to the sandbox lifetime.
 */
export interface SandboxOptions {
  /**
   * Resource limits applied to the QuickJS runtime.
   * These cannot be changed after sandbox creation.
   */
  limits?: SandboxLimits;
  /**
   * Whether to enable the `atob` and `btoa` Base64 encoding/decoding polyfills.
   */
  enableAtob?: boolean;
  /**
   * Whether to enable the Buffer API polyfill.
   */
  enableBuffer?: boolean;
  /**
   * Whether to enable timer APIs (setTimeout).
   */
  enableTimers?: boolean;
  /**
   * Common libraries to automatically expose as globals (lodash, moment).
   */
  globalLibraries?: CommonLibrary[];
}

/**
 * Options for a single evaluation within a sandbox.
 * These are "per-evaluation" options that can vary between evaluations.
 */
export interface SandboxEvaluateOptions {
  /**
   * Maximum execution time in milliseconds. This is a best-effort (soft) limit.
   * For a hard wall-clock timeout, run evaluation in a dedicated Worker thread and terminate it on deadline.
   *
   * If omitted, defaults to 10 seconds.
   */
  timeLimitMs?: number;
  /**
   * If the caller wraps the user expression (e.g. in an IIFE), error locations will be shifted.
   * Use this setting to specify how many whole lines the wrapper adds before the user expression,
   * so reported line numbers can be adjusted back to match the original user code.
   *
   * The wrapper MUST add lines using '\n' (not inline prefixes), so column positions remain accurate.
   * For example:
   * @example
   * ```typescript
   * // Newline before user code, so it starts at line 2, column 1
   * const wrapped = `(async function () {\n${userCode}\n})()`;
   * await sandbox.evaluate(wrapped, { wrapperPrefixLines: 1, wrapperSuffixLines: 1 });
   * ```
   *
   * Default: 0 (no wrapper)
   */
  wrapperPrefixLines?: number;
  /**
   * How many whole lines the wrapper adds after the user expression.
   * Used to trim wrapper frames from stack traces so they reference only the user expression.
   *
   * Default: 0 (no wrapper)
   */
  wrapperSuffixLines?: number;
}

type ConsoleLogger = Pick<Console, 'log' | 'warn' | 'error'>;

const defaultSandboxOptions: Required<SandboxOptions> = {
  limits: {
    stackBytes: 1024 * 1024, // 1 MiB
    memoryBytes: undefined,
  },
  enableAtob: false,
  enableBuffer: false,
  enableTimers: false,
  globalLibraries: [],
};

const defaultEvaluateOptions: Required<SandboxEvaluateOptions> = {
  timeLimitMs: 10_000, // 10 seconds
  wrapperPrefixLines: 0,
  wrapperSuffixLines: 0
};

/**
 * A JavaScript sandbox.
 *
 * The sandbox is "warmed up" with the QuickJS runtime and context already
 * created, so evaluation can begin immediately when code arrives.
 *
 * **Lifecycle:**
 * 1. Create sandbox via `createSandbox(options)`
 * 2. Set console logger via `setConsole(logger)` (optional)
 * 3. Set globals via `setGlobals(globals)`
 * 4. Evaluate expressions via `evaluate(expression, options)`
 * 5. Dispose sandbox via `dispose()` or use `using sandbox = await createSandbox()`
 *
 * **Important:** After evaluation, the sandbox state may be contaminated
 * by user code. For isolation between executions, dispose and create
 * a new sandbox.
 *
 * Implements `Disposable` for use with the `using` statement.
 */
export interface Sandbox extends Disposable {
  /**
   * Set the console logger for this sandbox.
   * Can be called multiple times; replaces the previous logger.
   * Logs from subsequent evaluate() calls will go to this logger.
   * Pass null to disable console output.
   */
  setConsole(logger: ConsoleLogger | null): void;

  /**
   * Inject global variables into the VM.
   * These become properties on globalThis, accessible to all subsequent evaluate() calls.
   *
   * Can be called multiple times:
   * - New keys are added
   * - Existing keys are overwritten
   *
   * Note: Globals persist for the sandbox lifetime and cannot be removed.
   * User code can also modify globals (e.g., `x = 5` creates/modifies global `x`).
   * If you need isolation between evaluations, create a new sandbox.
   */
  setGlobals(globals: Record<string, unknown>): void;

  /**
   * Evaluate a single expression and return its result.
   */
  evaluate(expression: string, options?: SandboxEvaluateOptions): Promise<unknown>;

  /**
   * Dispose of all resources. Must be called when done.
   */
  dispose(): void;

  /**
   * Whether the sandbox is still usable (not disposed).
   */
  readonly isAlive: boolean;
}

/**
 * Internal sandbox implementation.
 */
class SandboxImpl implements Sandbox {
  private runtime: QuickJSRuntime;
  private ctx: QuickJSContext;
  private eventLoop: EventLoop;
  private marshaller: Marshaller;
  private disposed = false;

  // Mutable console logger - can be changed via setConsole()
  private currentConsoleLogger: ConsoleLogger | null = null;
  private consoleRegistered = false;

  constructor(runtime: QuickJSRuntime, ctx: QuickJSContext, eventLoop: EventLoop, marshaller: Marshaller) {
    this.runtime = runtime;
    this.ctx = ctx;
    this.eventLoop = eventLoop;
    this.marshaller = marshaller;
  }

  get isAlive(): boolean {
    return !this.disposed;
  }

  setConsole(logger: ConsoleLogger | null): void {
    this.ensureAlive();
    this.currentConsoleLogger = logger;

    // Register console only once, with a proxy that delegates to currentConsoleLogger
    if (!this.consoleRegistered && logger !== null) {
      const loggerProxy: ConsoleLogger = {
        log: (...args: unknown[]) => this.currentConsoleLogger?.log(...args),
        warn: (...args: unknown[]) => this.currentConsoleLogger?.warn(...args),
        error: (...args: unknown[]) => this.currentConsoleLogger?.error(...args)
      };
      registerGlobalConsole(this.ctx, loggerProxy);
      this.consoleRegistered = true;
    }
  }

  setGlobals(globals: Record<string, unknown>): void {
    this.ensureAlive();
    const { injectValue } = this.marshaller;

    for (const [name, value] of Object.entries(globals)) {
      if (value instanceof HostGetterWrapper) {
        // Define a getter property that calls the host function on each access
        this.ctx.defineProp(this.ctx.global, name, {
          enumerable: true,
          configurable: true,
          get: () => injectValue(value.fn())
        });
      } else {
        const handle = injectValue(value);
        this.ctx.setProp(this.ctx.global, name, handle);
        handle.dispose();
      }
    }
  }

  async evaluate(expression: string, options: SandboxEvaluateOptions = {}): Promise<unknown> {
    this.ensureAlive();

    const opts: Required<SandboxEvaluateOptions> = {
      ...defaultEvaluateOptions,
      ...options,
    };

    // Set up deadline for this evaluation
    // Use a monotonic clock for deadlines so host clock adjustments (NTP, manual changes)
    // can't cause timeouts to trigger early/late.
    const deadlineMs = performance.now() + opts.timeLimitMs;

    // Always set the interrupt handler to ensure any previous handler is replaced.
    // If deadlineMs is undefined, the handler always returns false (never interrupts).
    this.runtime.setInterruptHandler(() => performance.now() >= deadlineMs);

    // Update event loop deadline
    this.eventLoop.setDeadline(deadlineMs);

    const { extractValue } = this.marshaller;

    // Handle empty or whitespace-only expressions
    const trimmedExpression = expression.trim();
    if (trimmedExpression === '') {
      return undefined;
    }

    // Calculate total wrapper lines for error position adjustment
    const totalWrapperLines = INTERNAL_WRAPPER_LINES + opts.wrapperPrefixLines;

    // Maximum user line number used to trim wrapper frames from stack traces.
    const expressionLineCount = countLines(trimmedExpression);
    const maxUserLine = Math.max(1, expressionLineCount - opts.wrapperPrefixLines - opts.wrapperSuffixLines);

    // Wrap expression in an async IIFE to:
    // 1. Disambiguate object literals `{a: 1}` from block statements
    // 2. Enable top-level `await` in expressions
    const wrappedExpression = `(async () => (\n${trimmedExpression}\n))()`;
    const result = this.ctx.evalCode(wrappedExpression, '<expression>', {
      type: 'global',
      strict: false
    });

    if (result.error) {
      const errorDump = this.ctx.dump(result.error);
      result.error.dispose();

      const adjustedError = adjustErrorLineNumbers(errorDump, totalWrapperLines, maxUserLine);
      throw createErrorFromQuickJS(adjustedError);
    }

    try {
      // Run event loop until the promise settles
      const promiseState = await this.eventLoop.runUntilSettled(result.value);

      if (promiseState.type === 'fulfilled') {
        const valueHandle = promiseState.value;
        try {
          const value = extractValue(valueHandle);
          return value;
        } catch (error) {
          // Cyclic objects cause marshal recursion to overflow
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
            return this.ctx.dump(errorHandle);
          } finally {
            if (errorHandle.alive) {
              errorHandle.dispose();
            }
          }
        })();
        const adjustedError = adjustErrorLineNumbers(errorDump, totalWrapperLines, maxUserLine);
        throw createErrorFromQuickJS(adjustedError);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    } finally {
      if (result.value.alive) {
        result.value.dispose();
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;

    this.eventLoop.dispose();
    this.marshaller.dispose();
    this.ctx.dispose();
    this.runtime.dispose();
    this.disposed = true;
  }

  /**
   * Supports the `using` statement for automatic resource cleanup.
   * Requires Node.js 18.18.0+ (Symbol.dispose was added in that version).
   * @example
   * ```typescript
   * using sandbox = await createSandbox();
   * await sandbox.evaluate('1 + 1');
   * // sandbox.dispose() called automatically at end of scope
   * ```
   */
  [Symbol.dispose](): void {
    this.dispose();
  }

  private ensureAlive(): void {
    if (this.disposed) {
      throw new Error('Sandbox has been disposed');
    }
  }
}

/**
 * Creates a sandbox.
 *
 * **Important**: After calling evaluate(), you should dispose the sandbox
 * and create a new one for the next evaluation. This prevents state
 * leakage between untrusted code executions.
 *
 * @example
 * ```typescript
 * // Pre-create sandbox during worker initialization
 * const sandbox = await createSandbox({ enableBuffer: true });
 *
 * // Set up console and globals
 * sandbox.setConsole({ log: console.log, warn: console.warn, error: console.error });
 * sandbox.setGlobals({ user: { name: 'Alice' } });
 *
 * // Evaluate expressions
 * try {
 *   const result = await sandbox.evaluate('user.name', { timeLimitMs: 5000 });
 *   console.log(result); // 'Alice'
 * } finally {
 *   sandbox.dispose();
 * }
 * ```
 */
export async function createSandbox(options: SandboxOptions = {}): Promise<Sandbox> {
  const opts: Required<SandboxOptions> = {
    ...defaultSandboxOptions,
    ...options,
    limits: { ...defaultSandboxOptions.limits, ...options.limits }
  };

  const QuickJS = await getQuickJS();

  const runtime = QuickJS.newRuntime();
  if (opts.limits.stackBytes !== undefined) {
    runtime.setMaxStackSize(opts.limits.stackBytes);
  }
  if (opts.limits.memoryBytes !== undefined) {
    runtime.setMemoryLimit(opts.limits.memoryBytes);
  }

  const ctx = runtime.newContext();

  // Register Buffer before creating marshaller (marshaller needs `Buffer` to be available)
  if (opts.enableBuffer) {
    registerGlobalBuffer(ctx, { memoryLimitBytes: opts.limits.memoryBytes });
  }

  // Create event loop without deadline initially (deadline set per-evaluation)
  const eventLoop = createEventLoop(ctx, { deadlineMs: undefined });
  const marshaller = createMarshaller(ctx, { eventLoop, enableBuffer: opts.enableBuffer });

  // Register atob/btoa if enabled
  if (opts.enableAtob) {
    registerGlobalAtob(ctx);
  }

  // Register timers if enabled
  if (opts.enableTimers) {
    registerGlobalSetTimeout(ctx, eventLoop);
  }

  // Register libraries
  if (opts.globalLibraries.includes('lodash')) {
    registerCommonLazyLibrary(ctx, 'lodash');
  }
  if (opts.globalLibraries.includes('moment')) {
    registerCommonLazyLibrary(ctx, 'moment');
  }

  return new SandboxImpl(runtime, ctx, eventLoop, marshaller);
}

/** Counts the number of lines in a string (1 + number of newline characters). */
function countLines(str: string): number {
  let count = 1;
  let pos = -1;
  while ((pos = str.indexOf('\n', pos + 1)) !== -1) {
    count++;
  }
  return count;
}
