import { beforeAll, describe, expect, it } from '@jest/globals';
import { getQuickJS } from './quickjs';
import type { QuickJSWASMModule } from 'quickjs-emscripten-core';
import { createEventLoop } from './event-loop';

describe('createEventLoop', () => {
  let QuickJS: QuickJSWASMModule;

  beforeAll(async () => {
    QuickJS = await getQuickJS();
  });

  it('resolves fulfilled promises', async () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);

    const result = ctx.evalCode('Promise.resolve(7)', '<test>', {
      type: 'global',
      strict: false
    });
    if (result.error) {
      const dump = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(String(dump));
    }

    try {
      const state = await eventLoop.runUntilSettled(result.value);
      if (state.type !== 'fulfilled') {
        throw new Error(`Expected fulfilled, got ${state.type}`);
      }
      expect(ctx.getNumber(state.value)).toBe(7);
      state.value.dispose();
    } finally {
      if (result.value.alive) {
        result.value.dispose();
      }
      ctx.dispose();
      runtime.dispose();
    }
  });

  it('propagates rejected promises', async () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);

    const result = ctx.evalCode("Promise.reject(new Error('fail'))", '<test>', {
      type: 'global',
      strict: false
    });
    if (result.error) {
      const dump = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(String(dump));
    }

    try {
      const state = await eventLoop.runUntilSettled(result.value);
      if (state.type !== 'rejected') {
        throw new Error(`Expected rejected, got ${state.type}`);
      }

      const reason = (state as { error: unknown }).error;
      const dumped = ctx.dump(reason as Parameters<typeof ctx.dump>[0]);
      const message = typeof dumped === 'object' && dumped !== null ? (dumped as { message?: string }).message : dumped;
      expect(String(message)).toMatch(/fail/);

      if (reason && typeof (reason as { dispose?: () => void }).dispose === 'function') {
        (reason as { dispose: () => void }).dispose();
      }
    } finally {
      if (result.value.alive) {
        result.value.dispose();
      }
      ctx.dispose();
      runtime.dispose();
    }
  });

  it('throws when promises will never settle and no host ops are pending', async () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();
    const eventLoop = createEventLoop(ctx);

    const result = ctx.evalCode('new Promise(() => {})', '<test>', {
      type: 'global',
      strict: false
    });
    if (result.error) {
      const dump = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(String(dump));
    }

    await expect(eventLoop.runUntilSettled(result.value)).rejects.toThrow(/never settle/i);

    if (result.value.alive) {
      result.value.dispose();
    }
    ctx.dispose();
    runtime.dispose();
  });
});
