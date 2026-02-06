import * as http from 'node:http';
import { format, promisify } from 'node:util';
import { MessagePort } from 'worker_threads';
import {
  buildVariables,
  decodeBytestringsExecutionContext,
  ExecutionContext,
  ExecutionOutput,
  getTreePathToDiskPath,
  RequestFile,
  serialize,
} from '@superblocks/shared';
import * as wasmSandbox from '@superblocks/wasm-sandbox-js';
import type { Sandbox, SandboxOptions } from '@superblocks/wasm-sandbox-js';
import deasync from 'deasync';
import _ from 'lodash';
import { VariableClient } from './variable-client';

/**
 * Fetch file from the controller (non-ephemeral worker mode).
 * Uses fileServerUrl and agentKey from context.globals.
 */
function fetchFromController(
  fileServerUrl: string,
  agentKey: string,
  location: string,
  callback: (err: Error | null, result: Buffer | null) => void
): void {
  const url = new URL(fileServerUrl);
  url.searchParams.set('location', location);
  http.get(
    url.toString(),
    {
      headers: { 'x-superblocks-agent-key': agentKey }
    },
    (response) => {
      if (response.statusCode != 200) {
        return callback(new Error('Internal Server Error'), null);
      }
      const chunks: Buffer[] = [];
      let chunkStrings = '';
      response.on('data', (chunk: Buffer) => {
        if (fileServerUrl.includes('v2')) {
          const serialized = serialize(chunk);
          chunkStrings += serialized;
        } else {
          chunks.push(chunk);
        }
      });
      response.on('error', (err) => callback(err, null));
      response.on('end', () => {
        if (fileServerUrl.includes('v2')) {
          const processed = chunkStrings
            .split('\n')
            .filter((str) => str.length > 0)
            .map((str) => {
              const json = JSON.parse(str);
              return Buffer.from(json.result.data, 'base64');
            });
          // Cast needed: TS 5.6+ made Uint8Array generic, causing type incompatibility with Buffer
          callback(null, Buffer.concat(processed as unknown as Uint8Array[]));
        } else {
          // Cast needed: TS 5.6+ made Uint8Array generic, causing type incompatibility with Buffer
          // even though Buffer extends Uint8Array at runtime. Fixed in @types/node@25+ (Node 25).
          callback(null, Buffer.concat(chunks as unknown as Uint8Array[]));
        }
      });
    }
  );
}

/**
 * File fetcher configuration for old (non-ephemeral) workers.
 * Uses the controller's file server with agent key authentication.
 */
interface ControllerFileFetcher {
  type: 'controller';
  fileServerUrl: string;
  agentKey: string;
}

/**
 * File fetcher configuration for ephemeral workers.
 * Uses the VariableClient to proxy file fetching through the KVStore (GrpcKvStore).
 */
interface EphemeralFileFetcher {
  type: 'ephemeral';
  variableClient: VariableClient;
}

type FileFetcher = ControllerFileFetcher | EphemeralFileFetcher;

function prepareGlobalsWithFileMethods(
  globals: Record<string, unknown>,
  filePaths: Record<string, string>,
  fetcher: FileFetcher
): void {
  Object.entries(filePaths).forEach(([treePath, diskPath]) => {
    if (!diskPath) return;

    let readContentsAsync: (mode?: 'raw' | 'binary' | 'text' | unknown) => Promise<string | Buffer>;
    let readContents: (mode?: 'raw' | 'binary' | 'text' | unknown) => string | Buffer;

    if (fetcher.type === 'controller') {
      // Old worker: fetch from controller
      readContentsAsync = async (mode?: 'raw' | 'binary' | 'text' | unknown): Promise<string | Buffer> => {
        const contents = await promisify(fetchFromController)(fetcher.fileServerUrl, fetcher.agentKey, diskPath);
        return serialize(contents, mode);
      };

      readContents = (mode?: 'raw' | 'binary' | 'text' | unknown): string | Buffer => {
        const contents = deasync(fetchFromController)(fetcher.fileServerUrl, fetcher.agentKey, diskPath);
        return serialize(contents, mode);
      };
    } else {
      // Ephemeral worker: fetch via VariableClient (proxied through KVStore/GrpcKvStore)
      const { variableClient } = fetcher;
      const fetchFileCallback = (path: string, cb: (err: Error | null, result: Buffer | null) => void): void => {
        variableClient.fetchFileCallback(path, cb);
      };

      readContentsAsync = async (mode?: 'raw' | 'binary' | 'text' | unknown): Promise<string | Buffer> => {
        const contents = await promisify(fetchFileCallback)(diskPath);
        return serialize(contents, mode);
      };

      readContents = (mode?: 'raw' | 'binary' | 'text' | unknown): string | Buffer => {
        const contents = deasync(fetchFileCallback)(diskPath);
        return serialize(contents, mode);
      };
    }

    const file = _.get(globals, treePath) as object | undefined;
    // Leaving $superblocksId set because it's required by our S3.
    _.set(globals, treePath, {
      ...file,
      previewUrl: undefined,
      readContentsAsync: wasmSandbox.hostFunction(readContentsAsync),
      readContents: wasmSandbox.hostFunction(readContents)
    });
  });
}

interface WorkerInput {
  context: ExecutionContext;
  code: string;
  files?: RequestFile[];
  executionTimeout: number;
  port: MessagePort;
  executionId?: string;
}

// Sandbox configuration (constant for worker lifetime)
const sandboxOptions: SandboxOptions = {
  enableBuffer: true,
  enableAtob: true,
  // when this plugin is used to resolve bindings, these libraries need to be available
  globalLibraries: ['lodash', 'moment'],
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
  const { context, code, files, executionTimeout, port, executionId } = workerData;

  // Wait for the sandbox (usually already resolved from previous task or init)
  const sandbox = await nextSandboxPromise;

  // Immediately start creating the next sandbox in parallel
  // This prepares the next task to have a warm sandbox ready
  nextSandboxPromise = wasmSandbox.createSandbox(sandboxOptions);

  const ret = new ExecutionOutput();
  const filePaths = getTreePathToDiskPath(context.globals, files ?? []);
  const variableClient = new VariableClient(port);

  try {
    // Determine file fetcher based on worker mode
    let fileFetcher: FileFetcher;
    if (executionId) {
      // Ephemeral worker: fetch files via VariableClient (proxied through KVStore/GrpcKvStore)
      fileFetcher = {
        type: 'ephemeral',
        variableClient
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
    prepareGlobalsWithFileMethods(globals, filePaths, fileFetcher);

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
      wrapperSuffixLines: 1,
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
