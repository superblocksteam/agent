import { beforeAll, describe, expect, it } from '@jest/globals';
import { getQuickJS } from '../quickjs';
import type { QuickJSWASMModule } from 'quickjs-emscripten-core';
import { registerGlobalLazyLibrary, registerGlobalLibrary } from './libraries';

describe('globals/libraries', () => {
  let QuickJS: QuickJSWASMModule;

  beforeAll(async () => {
    QuickJS = await getQuickJS();
  });

  it('loads an eager library into global scope', () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();

    try {
      registerGlobalLibrary(ctx, 'globalThis.lib = {value: 10};', '<lib-eager>');

      const result = ctx.evalCode('lib.value', '<check>', {
        type: 'global',
        strict: false
      });
      if (result.error) {
        const dump = ctx.dump(result.error);
        result.error.dispose();
        throw new Error(String(dump));
      }
      expect(ctx.getNumber(result.value)).toBe(10);
      result.value.dispose();
    } finally {
      ctx.dispose();
      runtime.dispose();
    }
  });

  it('throws when eager library source fails', () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();

    expect(() => registerGlobalLibrary(ctx, "throw new Error('boom')", '<lib-eager>')).toThrow(
      /Failed to load <lib-eager>/
    );

    ctx.dispose();
    runtime.dispose();
  });

  it('lazy-loads a library on first access and memoizes the value', () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();

    try {
      registerGlobalLazyLibrary(
        ctx,
        `
				globalThis.__count = (globalThis.__count || 0) + 1;
				globalThis.lazyLib = {loaded: true, id: globalThis.__count};
			`,
        'lazyLib',
        'lazy-lib',
        '<lazy-lib>'
      );

      const preAccess = ctx.evalCode(
        `
				[
					typeof __count,
					Object.prototype.hasOwnProperty.call(globalThis, "lazyLib"),
					typeof Object.getOwnPropertyDescriptor(globalThis, "lazyLib")?.get
				]
			`,
        '<pre-access>',
        { type: 'global', strict: false }
      );
      if (preAccess.error) {
        const dump = ctx.dump(preAccess.error);
        preAccess.error.dispose();
        throw new Error(String(dump));
      }
      const [preCountType, hasLazyLibProp, getterType] = ctx.dump(preAccess.value) as [string, boolean, string];
      expect(preCountType).toBe('undefined');
      expect(hasLazyLibProp).toBe(true);
      expect(getterType).toBe('function'); // getter defined but not yet executed
      preAccess.value.dispose();

      const firstAccess = ctx.evalCode('lazyLib.loaded && lazyLib.id', '<load>', {
        type: 'global',
        strict: false
      });
      if (firstAccess.error) {
        const dump = ctx.dump(firstAccess.error);
        firstAccess.error.dispose();
        throw new Error(String(dump));
      }
      expect(ctx.getNumber(firstAccess.value)).toBe(1);
      firstAccess.value.dispose();

      const memoized = ctx.evalCode('[lazyLib.id, __count]', '<memo>', {
        type: 'global',
        strict: false
      });
      if (memoized.error) {
        const dump = ctx.dump(memoized.error);
        memoized.error.dispose();
        throw new Error(String(dump));
      }
      const [id, count] = ctx.dump(memoized.value) as [number, number];
      expect(id).toBe(1); // same id, not re-loaded
      expect(count).toBe(1); // library source executed only once
      memoized.value.dispose();
    } finally {
      ctx.dispose();
      runtime.dispose();
    }
  });

  it('surfaces errors when a lazy library fails to load', () => {
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();

    registerGlobalLazyLibrary(ctx, "throw new Error('kaboom');", 'lazyFail', 'lazy-fail', '<lazy-fail>');

    const result = ctx.evalCode('lazyFail', '<load-fail>', {
      type: 'global',
      strict: false
    });

    if (!result.error) {
      throw new Error('Expected lazy library load to fail');
    }
    const dumped = ctx.dump(result.error);
    const message =
      typeof dumped === 'object' && dumped !== null
        ? (dumped as { message?: string }).message ?? JSON.stringify(dumped)
        : String(dumped);
    expect(message).toMatch(/Failed to load <lazy-fail>:.*kaboom/);
    result.error?.dispose();

    ctx.dispose();
    runtime.dispose();
  });
});
