import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { getQuickJS } from '../quickjs';
import type { QuickJSWASMModule } from 'quickjs-emscripten-core';
import { createEventLoop } from '../event-loop';
import { registerGlobalSetTimeout } from './timers';

describe('globals/timers', () => {
  let QuickJS: QuickJSWASMModule;

  beforeAll(async () => {
    QuickJS = await getQuickJS();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws TypeError when callback is not a function', () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);

    registerGlobalSetTimeout(ctx, eventLoop);

    const result = ctx.evalCode('setTimeout(123, 0)', '<setTimeout>', {
      type: 'global',
      strict: false
    });

    expect(result.error).toBeDefined();
    if (!result.error) {
      throw new Error('Expected setTimeout to throw for invalid callback');
    }
    const errorDump = ctx.dump(result.error);
    const message =
      typeof errorDump === 'object' && errorDump !== null
        ? (errorDump as { message?: string }).message ?? JSON.stringify(errorDump)
        : String(errorDump);
    expect(message).toMatch(/Callback must be a function/);
    result.error?.dispose();

    eventLoop.dispose();
    ctx.dispose();
    runtime.dispose();
  });

  it('resolves the promise when the timeout callback fires once', async () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);
    const trackHostOpSpy = jest.spyOn(eventLoop, 'trackHostOp');

    registerGlobalSetTimeout(ctx, eventLoop);

    const promiseResult = ctx.evalCode("new Promise(resolve => setTimeout(() => resolve('done'), 0))", '<promise>', {
      type: 'global',
      strict: false
    });
    if (promiseResult.error) {
      const dump = ctx.dump(promiseResult.error);
      promiseResult.error.dispose();
      throw new Error(String(dump));
    }

    try {
      const state = await eventLoop.runUntilSettled(promiseResult.value);
      if (state.type !== 'fulfilled') {
        throw new Error(`Expected fulfilled, got ${state.type}`);
      }
      expect(ctx.getString(state.value)).toBe('done');
      state.value.dispose();
    } finally {
      if (promiseResult.value.alive) {
        promiseResult.value.dispose();
      }
      eventLoop.dispose();
      ctx.dispose();
      runtime.dispose();
    }

    expect(trackHostOpSpy).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when scheduling a timeout', async () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);

    registerGlobalSetTimeout(ctx, eventLoop);

    const typeofResult = ctx.evalCode('typeof setTimeout(() => {}, 0)', '<typeof>', {
      type: 'global',
      strict: false
    });
    if (typeofResult.error) {
      const dump = ctx.dump(typeofResult.error);
      typeofResult.error.dispose();
      throw new Error(String(dump));
    }
    // TODO: update this test once the `setTimeout` is updated to return a timeout ID
    expect(ctx.getString(typeofResult.value)).toBe('undefined');
    typeofResult.value.dispose();

    // Cancel any scheduled timeouts to avoid callbacks into a disposed QuickJS context.
    eventLoop.dispose();
    ctx.dispose();
    runtime.dispose();
  });
});
