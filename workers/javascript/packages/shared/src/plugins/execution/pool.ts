import type { MessagePort } from 'worker_threads';

import { omit } from 'lodash';
import Piscina from 'piscina';

import { ErrorCode, IntegrationError } from '../../errors';
import { ExecutionOutput, IntegrationExecutor } from '../../types';
import { PoolIntegrationExecutorServer } from './pool-integration-executor-server';
import { PoolVariableServer } from './pool-variable-server';
import type { WorkerInput, WorkerTaskInput } from './types';

/**
 * Buffer time (ms) added to the hard timeout (worker termination) beyond the soft timeout.
 *
 * The soft timeout is the execution timeout that is passed to the task as part of the WorkerTaskInput.
 * This is treated as a best-effort timeout that the task can try to enforce as best it can. The hard
 * timeout (AbortSignal to Piscina) terminates the worker process.
 *
 * This buffer gives the soft timeout a chance to handle the timeout gracefully before we
 * resort to terminating the worker. The hard timeout is here as a safety net for
 * cases where the task is unable to enforce the soft timeout (e.g. can't preempt the task due to execution
 * being stuck in native code, etc.).
 */
const HARD_TIMEOUT_BUFFER_MS = 1000;

export interface WorkerPoolConfig {
  /**
   * Unique name for this pool. Each caller uses its own named pool
   */
  name: string;
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

export interface WorkerPoolExecuteOptions {
  /**
   * Name of the pool to use. Must match a name passed to configure().
   */
  poolName: string;
  /**
   * The task input.
   */
  input: WorkerTaskInput;
  /**
   * The name of the plugin that is executing the task.
   */
  pluginName?: string;
  /**
   * Options for the worker pool run.
   */
  options?: {
    /**
     * Override the exported function name. Can be used when the worker file exports multiple handlers
     * (see Piscina "Multiple Workers in One File"). If omitted, uses the default export.
     */
    name?: string;
  };
  /**
   * When provided, a MessagePort-based proxy is created so the worker thread
   * can call executeIntegration on the main thread's gRPC client.
   * Diagnostics are captured on the main thread and attached to the output.
   */
  integrationExecutor?: IntegrationExecutor;
  /**
   * When true (and integrationExecutor is set), per-call diagnostic records
   * are collected and attached to the ExecutionOutput.
   */
  includeDiagnostics?: boolean;
}

interface PoolEntry {
  pool: Piscina;
  activeTaskCount: number;
  draining: boolean;
}

interface WorkerPoolRunOptions {
  signal: AbortSignal;
  /**
   * MessagePort to pass to the worker (used for KV store IPC).
   */
  port: MessagePort;
  /**
   * Optional MessagePort for integration executor IPC.
   */
  integrationPort?: MessagePort;
  /**
   * Overrides the exported function name allowing the pool to
   * execute the specified function instead of the default export.
   */
  name?: string;
}

export class WorkerPool {
  private static _pools: Map<string, PoolEntry> = new Map();

  private static getOrCreatePool(name: string): PoolEntry {
    const entry = this._pools.get(name);
    if (!entry) {
      throw new Error(`Unknown WorkerPool: '${name}'. WorkerPool with name '${name}' not configured.`);
    }
    return entry;
  }

  /**
   * Initialize a new named pool
   */
  public static configure(config: WorkerPoolConfig): void {
    const isTypeScript = config.filename.endsWith('.ts');

    const pool = new Piscina({
      filename: config.filename,
      execArgv: config.execArgv ?? (isTypeScript ? ['--require', '@swc-node/register'] : undefined)
    });

    this._pools.set(config.name, { pool, activeTaskCount: 0, draining: false });
  }

  /**
   * Shut down a pool (or all pools if no name given). Waits for active tasks to finish.
   */
  public static async shutdown(poolName?: string): Promise<void> {
    const names = poolName ? [poolName] : [...this._pools.keys()];

    for (const name of names) {
      const entry = this._pools.get(name);
      if (!entry) {
        continue;
      }

      // Stop accepting new work immediately (new run() calls will reject)
      entry.draining = true;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (entry.activeTaskCount === 0) {
            clearInterval(interval);
            void entry.pool.destroy();
            this._pools.delete(name);
            resolve();
          }
        }, 1000);
      });
    }
  }

  /**
   * Execute a task in the pool
   */
  public static async ExecuteInWorkerPool(executeOptions: WorkerPoolExecuteOptions): Promise<ExecutionOutput> {
    const abortController = new AbortController();
    const { signal } = abortController;

    const { input, poolName } = executeOptions;
    const softTimeout = input.executionTimeout;
    const hardTimeout = softTimeout + HARD_TIMEOUT_BUFFER_MS;

    const timeoutWatcher = setTimeout(() => {
      abortController.abort();
    }, hardTimeout);

    const variableServer = new PoolVariableServer(input.context.kvStore!);

    let integrationServer: PoolIntegrationExecutorServer | undefined;
    if (executeOptions.integrationExecutor) {
      integrationServer = new PoolIntegrationExecutorServer(executeOptions.integrationExecutor, executeOptions.includeDiagnostics ?? false);
    }

    try {
      const outputJSON = await WorkerPool.run(poolName, input, {
        name: executeOptions.options?.name ?? undefined,
        signal,
        port: variableServer.clientPort(),
        integrationPort: integrationServer?.clientPort()
      });
      const result = ExecutionOutput.fromJSONString(outputJSON);

      if (integrationServer) {
        const diagnostics = integrationServer.diagnostics();
        if (diagnostics.length > 0) {
          result.diagnostics = diagnostics;
        }
      }

      return result;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new IntegrationError(`[AbortError] Timed out after ${softTimeout}ms`, ErrorCode.INTEGRATION_QUERY_TIMEOUT, {
          pluginName: executeOptions.pluginName ?? undefined
        });
      }
      throw err;
    } finally {
      clearTimeout(timeoutWatcher);
      variableServer.close();
      integrationServer?.close();
    }
  }

  private static async run(poolName: string, input: WorkerTaskInput, options: WorkerPoolRunOptions): Promise<string> {
    const { signal, port, integrationPort } = options;
    const entry = this.getOrCreatePool(poolName);
    if (entry.draining) {
      throw new IntegrationError('WorkerPool is shutting down', ErrorCode.UNSPECIFIED);
    }

    const workerInput: WorkerInput = {
      ...input,
      context: omit(input.context, 'kvStore', 'integrationExecutor'),
      useSandboxFileFetcher: Boolean((input.context.kvStore as unknown as { fetchFileCallback?: unknown } | undefined)?.fetchFileCallback),
      port,
      integrationPort
    };

    const transferList: MessagePort[] = [port];
    if (integrationPort) {
      transferList.push(integrationPort);
    }

    entry.activeTaskCount += 1;

    try {
      return await entry.pool.run(workerInput, {
        name: options.name ?? undefined,
        signal,
        transferList
      });
    } finally {
      entry.activeTaskCount -= 1;
    }
  }

  static getTasksCount(): number {
    return Array.from(this._pools.values()).reduce((sum, e) => sum + e.activeTaskCount, 0);
  }
}
