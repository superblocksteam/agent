import type { EventLoop } from '../event-loop';
import type { QuickJSContext, QuickJSHandle } from 'quickjs-emscripten-core';

/**
 * Exposes a partial implementation of `setTimeout` to the VM.
 *
 * Limitations:
 * - Does not return a timeout ID
 * - No `clearTimeout` implementation
 * - Does not accept additional arguments to pass to the callback
 * - No `setInterval`/`clearInterval` implementation
 * - Does not support string callbacks (e.g., `setTimeout("console.log('hi')", 100)`)
 * - Callback is invoked with `this` set to `undefined` (browsers use `globalThis`, Node.js uses the `Timeout` object)
 *
 * Note: Errors thrown in callbacks are silently discarded. A more complete implementation
 * might want to log them or surface them through an error handler.
 */
export function registerGlobalSetTimeout(ctx: QuickJSContext, eventLoop: EventLoop) {
  const setTimeoutHandle = ctx.newFunction('setTimeout', (callbackHandle: QuickJSHandle, delayHandle?: QuickJSHandle) => {
    if (ctx.typeof(callbackHandle) !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // Argument handles are automatically disposed when the host function returns,
    // so we must `.dup()` to create an owned copy that survives until the timeout fires
    const callback = callbackHandle.dup();

    const delay = delayHandle ? ctx.getNumber(delayHandle) : 0;

    eventLoop.trackHostOp((op) => {
      const timeoutId = setTimeout(() => {
        // If the sandbox timed out or is tearing down, do NOT call into QuickJS.
        if (op.signal.aborted) {
          if (callback.alive) {
            callback.dispose();
          }
          op.complete();
          return;
        }

        const callResult = ctx.callFunction(callback, ctx.undefined);
        if (callback.alive) {
          callback.dispose();
        }

        if (callResult.error) {
          callResult.error.dispose();
        } else {
          callResult.value.dispose();
        }

        op.complete();
      }, delay);

      // Ensure we don't leave timers/handles active after evaluation ends.
      op.onCleanup(() => {
        clearTimeout(timeoutId);
        if (callback.alive) {
          callback.dispose();
        }
      });
    });

    return ctx.undefined;
  });

  ctx.setProp(ctx.global, 'setTimeout', setTimeoutHandle);
  setTimeoutHandle.dispose();
}
