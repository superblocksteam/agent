import { omit } from 'lodash';
import Piscina from 'piscina';
import { ErrorCode, IntegrationError } from '../../errors';
import { ExecutionOutput } from '../../types';
import { PoolVariableServer } from './pool-variable-server';
import type { WorkerInput, WorkerTaskInput } from './types';
import type { MessagePort } from 'worker_threads';

/**
 * Buffer time (ms) added to the hard timeout (worker termination) beyond the soft timeout.
 *
 * The soft timeout (timeLimitMs in the sandbox) is a best-effort limit that handles most cases
 * cheaply by cleanly aborting execution. The hard timeout (AbortSignal to Piscina) terminates
 * the worker process, which is expensive because:
 * - The worker must be recreated
 * - A new sandbox must be initialized
 * - The WASM module must be reloaded
 *
 * This buffer gives the soft timeout a chance to handle the timeout gracefully before we
 * resort to terminating the worker. The hard timeout is still there as a safety net for
 * cases where the soft timeout can't preempt (e.g., stuck in host functions or native code).
 */
const HARD_TIMEOUT_BUFFER_MS = 1000;

export interface WorkerPoolConfig {
  /**
   * Absolute path to the worker file. The file must export a default function that accepts
   * the task payload and returns a serializable value (or Promise thereof).
   */
  filename: string;
  /**
   * Optional Node exec flags for worker processes (e.g. ['--require', '@swc-node/register']
   * when the worker is TypeScript).
   */
  execArgv?: string[];
}

export interface WorkerPoolRunOptions {
  signal: AbortSignal;
  /**
   * MessagePort to pass to the worker (used for IPC communication).
   */
  port: MessagePort;
  /**
   * Override the worker file for this task. If omitted, uses the filename from configure().
   */
  filename?: string;
  /**
   * Override the exported function name. Can be used when the worker file exports multiple handlers
   * (see Piscina "Multiple Workers in One File"). If omitted, uses the default export.
   */
  name?: string;
}

export interface WorkerPoolExecuteOptions {
  input: WorkerTaskInput;
  options?: WorkerPoolRunOptions;
  pluginName?: string;
}

export class WorkerPool {
  private static _instance: WorkerPool;
  private pool: Piscina;
  private activeTaskCount: number;

  private constructor(config: WorkerPoolConfig) {
    const isTypeScript = config.filename.endsWith('.ts');

    this.pool = new Piscina({
      filename: config.filename,
      // When worker is TypeScript, use @swc-node/register; allow config override
      execArgv: config.execArgv ?? (isTypeScript ? ['--require', '@swc-node/register'] : undefined)
    });
    this.activeTaskCount = 0;
  }

  /**
   * Initialize the pool. Must be called before run(). Call from the consumer that owns
   * the worker file (e.g. JavascriptWasmPlugin passes its bootstrap path).
   */
  public static configure(config: WorkerPoolConfig): void {
    this._instance = new this(config);
  }

  // shutdown waits for active tasks to finish
  // active tasks include those being executed and those in thread pool queue
  // k8s will kill this process after grace period
  public static async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      // SUPERBLOCKS_AGENT_EXECUTION_JS_TIMEOUT_MS set in .env so this will resolve eventually
      // otherwise it will be killed when k8s pods is killed after grace period
      const waitForActiveTaskToFinish = setInterval(function () {
        if (WorkerPool.getTasksCount() == 0) {
          clearInterval(waitForActiveTaskToFinish);
          resolve();
        }
      }, 1000);
      void this._instance.pool.destroy();
    });
  }

  public static async ExecuteInWorkerPool(executeOptions: WorkerPoolExecuteOptions): Promise<ExecutionOutput> {
    const abortController = new AbortController();
    const { signal } = abortController;

    const { input } = executeOptions;
    const softTimeout = input.executionTimeout;
    const hardTimeout = softTimeout + HARD_TIMEOUT_BUFFER_MS;

    const timeoutWatcher = setTimeout(() => {
      abortController.abort();
    }, hardTimeout);

    const variableServer = new PoolVariableServer(input.context.kvStore!);

    try {
      const outputJSON = await WorkerPool.run(
        {
          context: omit(input.context, 'kvStore'),
          code: input.code,
          executionTimeout: input.executionTimeout,
          files: input.files,
          useSandboxFileFetcher: Boolean(
            (input.context.kvStore as unknown as { fetchFileCallback?: unknown } | undefined)?.fetchFileCallback
          )
        },
        {
          filename: executeOptions.options?.filename ?? undefined,
          name: executeOptions.options?.name ?? undefined,
          signal,
          port: variableServer.clientPort()
        }
      );
      return ExecutionOutput.fromJSONString(outputJSON);
    } catch (err) {
      // Annotate the AbortError, which is triggered by the hard timeout (worker termination).
      // This only fires if the soft timeout (inside the sandbox) failed to preempt execution.
      if ((err as Error).name === 'AbortError') {
        throw new IntegrationError(`[AbortError] Timed out after ${softTimeout}ms`, ErrorCode.INTEGRATION_QUERY_TIMEOUT, {
          pluginName: executeOptions.pluginName ?? undefined
        });
      }
      throw err;
    } finally {
      // Always attempt to clear timeout once the execution has completed.
      clearTimeout(timeoutWatcher);
      variableServer.close();
    }
  }

  /**
   * Execute a task in the pool. The worker receives WorkerInput (task payload + port).
   *
   * @param input - Task payload (context, code, etc.). The worker's default export receives
   *   WorkerInput = { ...input, port }.
   * @param options - signal, port (required), optional filename/name overrides.
   */
  private static async run(input: WorkerTaskInput, options: WorkerPoolRunOptions): Promise<string> {
    const { signal, port } = options;
    const workerInput: WorkerInput = { ...input, port };
    this._instance.activeTaskCount += 1;

    try {
      return await this.getPool().run(workerInput, {
        filename: options.filename ?? undefined,
        name: options.name ?? undefined,
        signal,
        transferList: [port]
      });
    } finally {
      this._instance.activeTaskCount -= 1;
    }
  }

  private static getPool(): Piscina {
    if (!this._instance) {
      throw Error('not initialized');
    }

    return this._instance.pool;
  }

  private static getTasksCount(): number {
    if (!this._instance) {
      throw Error('not initialized');
    }

    return this._instance.activeTaskCount;
  }
}
