/**
 * Contract test: validates the wrapper script format produced by the orchestrator
 * (internal/transport/code_delivery.go generateWrapperScript).
 *
 * The worker wraps received code in (async function() { ${code} })() and awaits the result.
 * For async run() functions, the wrapper MUST use "return await __sb_run(__sb_context)"
 * so the worker captures the resolved value. Without it, the IIFE returns undefined.
 */

// Simulates how the worker evaluates the orchestrator's wrapper script
function evaluateWrapper(wrapperScript: string): Promise<unknown> {
  const wrappedCode = `(async function() {\n${wrapperScript}\n})()`;
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return ${wrappedCode}`);
  return fn();
}

describe('code-mode wrapper contract', () => {
  const userContext = { user: { email: 'test@example.com' }, inputs: {} };
  const asyncBundle = `module.exports={run:async function(ctx){return {sdkapi:"ok",from:"async"};}};`;

  it('captures async run() result when wrapper uses return await', async () => {
    const wrapperWithReturnAwait = `"use strict";
var module = { exports: {} };
var exports = module.exports;
const __sb_context = ${JSON.stringify(userContext)};

// --- begin bundle ---
${asyncBundle}
// --- end bundle ---

var __sb_run = module.exports.run || module.exports.default;
if (typeof __sb_run !== "function") {
  throw new Error("code-mode bundle does not export a run() function");
}
return await __sb_run(__sb_context);
`;

    const result = await evaluateWrapper(wrapperWithReturnAwait);
    expect(result).toEqual({ sdkapi: 'ok', from: 'async' });
  });

  it('loses async run() result when wrapper omits return await', async () => {
    const wrapperWithoutReturnAwait = `"use strict";
var module = { exports: {} };
var exports = module.exports;
const __sb_context = ${JSON.stringify(userContext)};

// --- begin bundle ---
${asyncBundle}
// --- end bundle ---

var __sb_run = module.exports.run || module.exports.default;
if (typeof __sb_run !== "function") {
  throw new Error("code-mode bundle does not export a run() function");
}
__sb_run(__sb_context);
`;

    const result = await evaluateWrapper(wrapperWithoutReturnAwait);
    expect(result).toBeUndefined();
  });
});
