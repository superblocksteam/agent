import { format } from 'node:util';
import {
  buildVariables,
  decodeBytestringsExecutionContext,
  ExecutionOutput,
  getTreePathToDiskPath,
  PoolVariableClient,
  type FileFetcher,
  type WorkerInput
} from '@superblocks/shared';
import { prepareGlobalsWithFileMethods } from '@superblocks/shared/dist/src/plugins/execution/worker-file-utils';
import * as wasmSandbox from '@superblocks/wasm-sandbox-js';
import type { Sandbox, SandboxOptions } from '@superblocks/wasm-sandbox-js';

// Sandbox configuration (constant for worker lifetime).
const sandboxOptions: SandboxOptions = {
  enableBuffer: true,
  enableAtob: true,
  globalLibraries: ['lodash', 'moment']
};

// Promise for the next sandbox. We store a Promise (not a resolved Sandbox) so that:
// 1. The current task can return immediately without waiting for the next sandbox
// 2. The next task awaits the Promise at start, blocking only if the sandbox isn't ready yet
// This decouples response latency from sandbox initialization time.
//
// Limitation: When a worker returns, Piscina considers it "free" even though the next
// sandbox may still be initializing. If multiple workers are free and a new task arrives,
// Piscina might route it to a worker that's still initializing (causing a brief wait at
// the start of handleTask) rather than one that's already ready. Piscina doesn't support
// custom worker selection based on internal readiness state. In practice this is minor:
// the worst-case added latency is one sandbox init time, and only occurs when tasks
// arrive while some workers are mid-initialization.
let nextSandboxPromise: Promise<Sandbox> = wasmSandbox.createSandbox(sandboxOptions);

/**
 * Initialize the worker by waiting for the first sandbox to be ready.
 * Piscina will wait for this Promise to resolve before marking the worker as "ready".
 */
async function initialize(): Promise<typeof handleTask> {
  // Wait for the first sandbox to be ready before accepting tasks
  await nextSandboxPromise;
  return handleTask;
}

/**
 * Handle a task using the pre-warmed sandbox.
 * After execution, dispose the sandbox and return immediately.
 * The next sandbox is created in parallel but we don't wait for it.
 */
async function handleTask(workerData: WorkerInput): Promise<string> {
  const { context, code, files, executionTimeout, port, useSandboxFileFetcher } = workerData;

  // Wait for the sandbox (usually already resolved from previous task or init)
  const sandbox = await nextSandboxPromise;

  // Immediately start creating the next sandbox in parallel
  // This prepares the next task to have a warm sandbox ready
  nextSandboxPromise = wasmSandbox.createSandbox(sandboxOptions);

  const ret = new ExecutionOutput();
  const filePaths = getTreePathToDiskPath(context.globals, files ?? []);
  const variableClient = new PoolVariableClient(port);

  try {
    // Determine file fetcher based on worker mode
    let fileFetcher: FileFetcher;
    if (useSandboxFileFetcher) {
      fileFetcher = {
        type: 'sandbox',
        client: variableClient
      };
    } else {
      // Old worker: use controller for file fetching
      const fileServerUrl = context.globals['$fileServerUrl'] as string;
      const agentKey = context.globals['$agentKey'] as string;
      fileFetcher = {
        type: 'controller',
        fileServerUrl,
        agentKey
      };
    }

    // Build globals object with context.globals and context.outputs
    const globals: Record<string, unknown> = {
      ...context.globals,
      ...context.outputs
    };

    // Remove sensitive values from globals (they're only needed for file methods)
    delete globals['$agentKey'];
    delete globals['$fileServerUrl'];
    delete globals['$superblocksFiles'];

    // Build variables from kvStore
    // Cast variableClient since our implementation uses MessagePort while shared expects KVStore-based client
    // The interface is structurally compatible (same methods: read, write, writeBuffer, flush)
    if (context.variables && typeof context.variables === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builtVariables = await buildVariables(context.variables, variableClient as any);
      for (const [k, v] of Object.entries(builtVariables)) {
        globals[k] = v;
      }
    } else {
      throw new Error('variables not defined');
    }

    // Decode bytestrings in context
    decodeBytestringsExecutionContext(context, true);

    // Prepare file picker methods as host functions
    prepareGlobalsWithFileMethods(globals, filePaths, fileFetcher, wasmSandbox.hostFunction);

    // Set up console logger to capture logs for this task
    sandbox.setConsole({
      log: (...args: unknown[]) => ret.logInfo(format(...args)),
      warn: (...args: unknown[]) => ret.logWarn(format(...args)),
      error: (...args: unknown[]) => ret.logError(format(...args))
    });

    // Set up globals for this task
    sandbox.setGlobals(globals);

    // Wrap user code in an async IIFE to support top-level return statements.
    // The newline before user code ensures it starts at line 2, column 1.
    // This allows error position adjustment to work correctly by only adjusting line numbers.
    const wrappedCode = `(async function() {\n${code}\n})()`;

    // Execute code in sandbox
    ret.output = await sandbox.evaluate(wrappedCode, {
      timeLimitMs: executionTimeout,
      // Tell evaluate about our wrapper line so error positions are adjusted correctly
      wrapperPrefixLines: 1,
      wrapperSuffixLines: 1
    });

    // Flush any buffered variable writes
    await variableClient.flush();
  } catch (err) {
    const error = err as Error;
    ret.error = error.stack || String(err);
  } finally {
    variableClient.close();

    // Dispose the used sandbox
    sandbox.dispose();
  }

  return JSON.stringify(ret);
}

// Export a Promise that resolves to the handler function
// Piscina will wait for initialization before accepting tasks
export = initialize();
