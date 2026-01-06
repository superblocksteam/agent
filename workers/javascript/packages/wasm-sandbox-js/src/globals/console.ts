import type { QuickJSContext, QuickJSHandle } from 'quickjs-emscripten-core';

type VMConsoleLogger = Pick<Console, 'log' | 'warn' | 'error'>;

/**
 * Exposes a minimal `console` to the VM.
 */
export function registerGlobalConsole(ctx: QuickJSContext, consoleLogger: VMConsoleLogger) {
  const consoleObject = ctx.newObject();
  const makeConsoleMethod = (name: keyof VMConsoleLogger) =>
    ctx.newFunction(name, (...argHandles: QuickJSHandle[]) => {
      const args = argHandles.map((handle) => ctx.dump(handle));
      consoleLogger[name](...args);
      return ctx.undefined;
    });

  const consoleLog = makeConsoleMethod('log');
  const consoleWarn = makeConsoleMethod('warn');
  const consoleError = makeConsoleMethod('error');

  ctx.setProp(consoleObject, 'log', consoleLog);
  ctx.setProp(consoleObject, 'warn', consoleWarn);
  ctx.setProp(consoleObject, 'error', consoleError);
  ctx.setProp(ctx.global, 'console', consoleObject);

  consoleLog.dispose();
  consoleWarn.dispose();
  consoleError.dispose();
  consoleObject.dispose();
}
