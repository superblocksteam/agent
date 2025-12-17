import type { JSPromiseState, QuickJSContext, QuickJSHandle } from 'quickjs-emscripten';

/**
 * Best-effort function invocation helper.
 *
 * Use this for cleanup/teardown paths where throwing would be harmful (e.g. it
 * could prevent other cleanups from running, or trigger unhandled rejections).
 */
function safeCall<A extends unknown[]>(fn: ((...args: A) => void) | undefined | null, ...args: A): void {
  try {
    fn?.(...args);
  } catch {
    // best-effort: swallow errors in cleanup/handler paths
  }
}

export type EventLoopOptions = {
  /**
   * Absolute monotonic timestamp in milliseconds (from {@link performance.now})
   * after which the event loop should stop waiting for host operations and fail
   * with a timeout.
   */
  deadlineMs?: number;
};

/** Controller for a tracked host async operation. */
export type HostOp = {
  /**
   * Aborted when the evaluator times out or is disposed. Host work should stop
   * calling into QuickJS when this is aborted.
   */
  signal: AbortSignal;
  /**
   * Registers cleanup that will run exactly once, either when the op completes
   * or when the event loop is disposed/times out.
   */
  onCleanup(fn: () => void): void;
  /** Mark operation complete (idempotent). */
  complete(): void;
};

/** Handlers for {@link EventLoop.trackPromise}. */
export type TrackPromiseHandlers<T> = {
  /** Called when the promise fulfills (if not aborted). */
  onFulfilled?(value: T): void;
  /** Called when the promise rejects (if not aborted). */
  onRejected?(reason: unknown): void;
  /**
   * Called if the event loop is disposed/timed out before the promise settles.
   * This is the place to dispose QuickJS handles (e.g. deferred promises) and/or
   * mark cancellation flags so late promise settlement doesn't call into QuickJS.
   */
  onAbort?(): void;
  /** Called exactly once after fulfilled/rejected/abort. */
  onSettled?(): void;
};

/**
 * Drives QuickJS pending jobs and tracks host async operations, enforcing deadlines and safe teardown.
 */
export class EventLoop {
  /** Aborted when the evaluator is disposed or times out. */
  public readonly signal: AbortSignal;

  private pendingHostOps = 0;
  private wakeUp: (() => void) | null = null;
  private disposed = false;

  private readonly abortController = new AbortController();
  private readonly activeCompletes = new Set<() => void>();

  public constructor(
    private readonly ctx: QuickJSContext,
    private readonly options: EventLoopOptions = {}
  ) {
    this.signal = this.abortController.signal;
  }

  /** Disposes the event loop, aborting all tracked host ops. Idempotent. */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    safeCall(() => this.abortController.abort());

    // Wake up any waiter so it can observe disposal/timeout.
    this.wake();

    // Complete all active ops (runs their cleanups).
    for (const complete of Array.from(this.activeCompletes)) {
      safeCall(complete);
    }
    this.activeCompletes.clear();
  }

  /**
   * Support Explicit Resource Management (`using`) and mirror the QuickJS API surface.
   * This is equivalent to calling {@link dispose}.
   */
  public [Symbol.dispose](): void {
    this.dispose();
  }

  /**
   * Tracks a host async operation (timers, host I/O, etc). The callback receives
   * a controller that can be completed and can register cleanup hooks.
   */
  public trackHostOp(start: (op: HostOp) => void | (() => void)): void {
    if (this.disposed) {
      throw new Error('Event loop disposed');
    }

    this.pendingHostOps++;

    let completed = false;
    const cleanupFns: Array<() => void> = [];

    const runCleanups = (): void => {
      // Run in reverse registration order (LIFO), similar to stack unwinding.
      for (let i = cleanupFns.length - 1; i >= 0; i--) {
        safeCall(cleanupFns[i]);
      }
      cleanupFns.length = 0;
    };

    const complete = (): void => {
      if (completed) return;
      completed = true;

      this.activeCompletes.delete(complete);

      runCleanups();
      this.pendingHostOps = Math.max(0, this.pendingHostOps - 1);
      this.wake();
    };

    this.activeCompletes.add(complete);

    const onCleanup: HostOp['onCleanup'] = (fn) => {
      if (completed) {
        // If the operation is already completed, run the cleanup immediately.
        safeCall(fn);
        return;
      }
      cleanupFns.push(fn);
    };

    const op: HostOp = {
      signal: this.abortController.signal,
      onCleanup,
      complete
    };

    try {
      const maybeCleanup = start(op);
      if (typeof maybeCleanup === 'function') {
        onCleanup(maybeCleanup);
      }
    } catch (err) {
      complete();
      throw err;
    }
  }

  /**
   * Convenience helper for promise-based host work. Internally uses `trackHostOp`.
   */
  public trackPromise<T>(promise: PromiseLike<T>, handlers: TrackPromiseHandlers<T>): void {
    this.trackHostOp((op) => {
      let finished = false;

      const finish = (kind: 'fulfilled' | 'rejected' | 'aborted', value?: unknown) => {
        if (finished) return;
        finished = true;

        if (kind === 'fulfilled') safeCall(handlers.onFulfilled as ((v: unknown) => void) | undefined, value);
        if (kind === 'rejected') safeCall(handlers.onRejected, value);
        if (kind === 'aborted') safeCall(handlers.onAbort);
        safeCall(handlers.onSettled);

        op.complete();
      };

      // If we get disposed/timed-out before the promise settles, treat it as abort.
      op.onCleanup(() => {
        if (!finished) {
          finish('aborted');
        }
      });

      Promise.resolve(promise).then(
        (value) => {
          if (op.signal.aborted) return;
          finish('fulfilled', value);
        },
        (reason) => {
          if (op.signal.aborted) return;
          finish('rejected', reason);
        }
      );
    });
  }

  /** Pump QuickJS jobs + host ops until the promise settles (or times out). */
  public async runUntilSettled(promiseHandle: QuickJSHandle): Promise<JSPromiseState> {
    for (;;) {
      if (this.disposed) {
        throw new Error('Event loop disposed');
      }

      this.throwIfTimedOut();
      this.ctx.runtime.executePendingJobs();

      const state = this.ctx.getPromiseState(promiseHandle);
      if (state.type !== 'pending') {
        return state;
      }

      if (this.pendingHostOps > 0) {
        await this.waitForHostOpOrTimeout();
      } else {
        throw new Error('Promise will never settle: no async operations are pending');
      }
    }
  }

  private wake(): void {
    safeCall(this.wakeUp);
    this.wakeUp = null;
  }

  private throwIfTimedOut(): void {
    const deadlineMs = this.options.deadlineMs;
    if (deadlineMs !== undefined && performance.now() >= deadlineMs) {
      this.dispose();
      throw new Error('Execution timed out');
    }
  }

  private async waitForHostOpOrTimeout(): Promise<void> {
    if (this.disposed) {
      throw new Error('Event loop disposed');
    }

    const deadlineMs = this.options.deadlineMs;
    if (deadlineMs === undefined) {
      await new Promise<void>((resolve) => {
        this.wakeUp = resolve;
      });
      this.wakeUp = null;
      return;
    }

    const remainingMs = deadlineMs - performance.now();
    if (remainingMs <= 0) {
      this.dispose();
      throw new Error('Execution timed out');
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      await Promise.race<void>([
        new Promise<void>((resolve) => {
          this.wakeUp = resolve;
        }),
        new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            timedOut = true;
            resolve();
          }, remainingMs);
        })
      ]);

      if (timedOut) {
        this.dispose();
        throw new Error('Execution timed out');
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.wakeUp = null;
    }
  }
}

/** Create an {@link EventLoop} bound to this QuickJS context. */
export function createEventLoop(ctx: QuickJSContext, options: EventLoopOptions = {}): EventLoop {
  return new EventLoop(ctx, options);
}
