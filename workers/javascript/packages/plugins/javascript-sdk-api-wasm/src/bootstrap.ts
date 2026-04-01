/**
 * Bootstrap / worker entry point for the JavaScript SDK API WASM plugin.
 *
 * Each Piscina worker thread runs this module. It pre-warms a QuickJS WASM
 * sandbox on startup and handles tasks by evaluating user code inside the
 * sandbox with SDK API globals (__sb_execute, __sb_integrationExecutor).
 *
 * Key differences from the plain javascript-wasm bootstrap:
 * - No lodash/moment in sandbox options (SDK API bundles are self-contained CJS)
 * - Integration executor is always wired when integrationPort is present
 * - __sb_execute is provided by the in-sandbox require shim
 * - Timing instrumentation for operational observability
 */

import { format } from 'node:util';
import {
  buildVariables,
  decodeBytestringsExecutionContext,
  ExecutionOutput,
  getTreePathToDiskPath,
  PoolIntegrationExecutorClient,
  PoolVariableClient,
  type FileFetcher,
  type WorkerInput
} from '@superblocks/shared';
import { prepareGlobalsWithFileMethods } from '@superblocks/shared/dist/src/plugins/execution/worker-file-utils';
import * as wasmSandbox from '@superblocks/wasm-sandbox-js';
import type { Sandbox, SandboxOptions } from '@superblocks/wasm-sandbox-js';
import { createWasmIntegrationExecutorBridge } from './integrationBridge';
import { getSdkApiSandboxLibraries } from './sdk-api-sandbox';

// ---------------------------------------------------------------------------
// Sandbox & SDK API configuration
// ---------------------------------------------------------------------------

/** Sandbox options: sdk-api + require shim loaded via custom libraries. */
const sandboxOptions: SandboxOptions = {
  enableAtob: true,
  enableBuffer: true,
  libraries: getSdkApiSandboxLibraries()
};

/** Whether to emit per-task timing to stderr for operational observability. */
const shouldLogTiming = process.env.SUPERBLOCKS_ORCHESTRATOR_WASM_TIMING_LOGS === 'true';

// Pre-warm the first sandbox while the worker initializes.
let nextSandboxPromise: Promise<Sandbox> = wasmSandbox.createSandbox(sandboxOptions);

// ---------------------------------------------------------------------------
// Worker lifecycle
// ---------------------------------------------------------------------------

/**
 * Initialize the worker by waiting for the first sandbox to be ready.
 * Piscina will wait for this Promise to resolve before marking the worker as "ready".
 */
async function initialize(): Promise<typeof handleTask> {
  await nextSandboxPromise;
  return handleTask;
}

/**
 * Handle a task using the pre-warmed sandbox.
 *
 * After execution, the sandbox is disposed and a new one is created in parallel.
 * The next task will await that sandbox Promise, blocking only if it is not yet ready.
 *
 * @param workerData - Task payload from the worker pool
 * @returns JSON-serialized ExecutionOutput
 */
async function handleTask(workerData: WorkerInput): Promise<string> {
  const round = (v: number): number => Math.round(v * 100) / 100;
  const timing: Record<string, number> = {};
  const totalStart = performance.now();
  let phaseStart = performance.now();

  const { context, code, executionTimeout, files, port, integrationPort, useSandboxFileFetcher } = workerData;

  // Acquire the pre-warmed sandbox (usually already resolved)
  const sandbox = await nextSandboxPromise;

  // Immediately start creating the next sandbox in parallel
  nextSandboxPromise = wasmSandbox.createSandbox(sandboxOptions);
  timing.sandbox_acquire_ms = round(performance.now() - phaseStart);

  const ret = new ExecutionOutput();
  const variableClient = new PoolVariableClient(port);
  const integrationClient = integrationPort ? new PoolIntegrationExecutorClient(integrationPort) : undefined;
  const filePaths = getTreePathToDiskPath(context.globals, files ?? []);

  try {
    if (!context.variables || typeof context.variables !== 'object') {
      throw new Error('variables not defined');
    }

    // Decode bytestrings in context
    phaseStart = performance.now();
    decodeBytestringsExecutionContext(context, true);
    timing.decode_context_ms = round(performance.now() - phaseStart);

    // Build globals object with context.globals and context.outputs
    const globals: Record<string, unknown> = {
      ...(context.globals ?? {}),
      ...(context.outputs ?? {})
    };

    // Remove sensitive values from globals (used for file fetching, not needed in VM)
    delete globals['$agentKey'];
    delete globals['$fileServerUrl'];
    // Keep $superblocksFiles — the Go wrapper script uses it to copy file methods
    // from globals to __sb_context.inputs (WASM path where $prepareGlobalObjectForFiles
    // is not available).

    // Build variables from kvStore
    phaseStart = performance.now();
    // Cast variableClient since our implementation uses MessagePort while shared expects KVStore-based client
    // The interface is structurally compatible (same methods: read, write, writeBuffer, flush)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builtVariables = await buildVariables(context.variables, variableClient as any);
    for (const [k, v] of Object.entries(builtVariables)) {
      globals[k] = v;
    }
    timing.build_variables_ms = round(performance.now() - phaseStart);

    phaseStart = performance.now();

    // Determine file fetcher based on worker mode
    let fileFetcher: FileFetcher;
    if (useSandboxFileFetcher) {
      fileFetcher = {
        type: 'sandbox',
        client: variableClient
      };
    } else {
      const fileServerUrl = context.globals['$fileServerUrl'] as string;
      const agentKey = context.globals['$agentKey'] as string;
      fileFetcher = {
        type: 'controller',
        fileServerUrl,
        agentKey
      };
    }

    // Prepare file picker methods on the globals tree as host functions.
    // The Go wrapper script copies these to __sb_context.inputs via the
    // $superblocksFiles path map (see code_delivery.go).
    prepareGlobalsWithFileMethods(globals, filePaths, fileFetcher, wasmSandbox.hostFunction);

    // Expose the file path map so the Go wrapper script can copy file methods
    // from globals to __sb_context.inputs (which is built from JSON and has no functions).
    // Without this, $superblocksFiles is undefined in the VM and the copy is skipped.
    globals.$superblocksFiles = filePaths;

    const integrationExecutorBridge = createWasmIntegrationExecutorBridge(integrationClient);

    // __sb_execute is installed inside QuickJS by the require shim when
    // globalLibraries includes sdk-api. Do not override it with a host function
    // because VM->host marshalling strips function-typed properties.
    globals.__sb_integrationExecutor = integrationExecutorBridge
      ? wasmSandbox.hostFunction(integrationExecutorBridge)
      : undefined;

    // Set up console logger to capture logs for this task
    sandbox.setConsole({
      error: (...args: unknown[]) => ret.logError(format(...args)),
      log: (...args: unknown[]) => ret.logInfo(format(...args)),
      warn: (...args: unknown[]) => ret.logWarn(format(...args))
    });

    // Set up globals for this task
    sandbox.setGlobals(globals);
    timing.setup_globals_ms = round(performance.now() - phaseStart);

    // Wrap user code in an async IIFE to support top-level return statements.
    // The newline before user code ensures it starts at line 2, column 1.
    // This allows error position adjustment to work correctly by only adjusting line numbers.
    phaseStart = performance.now();
    const wrappedCode = `(async function() {\n${code}\n})()`;

    // Execute code in sandbox
    ret.output = await sandbox.evaluate(wrappedCode, {
      timeLimitMs: executionTimeout,
      // Tell evaluate about our wrapper line so error positions are adjusted correctly
      wrapperPrefixLines: 1,
      wrapperSuffixLines: 1
    });
    timing.evaluate_ms = round(performance.now() - phaseStart);

    // Flush any buffered variable writes
    phaseStart = performance.now();
    await variableClient.flush();
    timing.flush_ms = round(performance.now() - phaseStart);
  } catch (err) {
    const error = err as Error;
    ret.error = error.stack || String(err);
  } finally {
    timing.total_ms = round(performance.now() - totalStart);
    if (shouldLogTiming) {
      // Write to worker stderr so timing is operational/debug output only
      // and never mixed into user-visible execution stdout.
      process.stderr.write(`[TIMING] ${JSON.stringify(timing)}\n`);
    }

    integrationClient?.close();
    variableClient.close();

    // Dispose the used sandbox
    sandbox.dispose();
  }

  return JSON.stringify(ret);
}

// Export a Promise that resolves to the handler function.
// Piscina will wait for initialization before accepting tasks.
export = initialize();
