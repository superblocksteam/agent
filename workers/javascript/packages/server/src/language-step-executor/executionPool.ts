import { ChildProcess, fork } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { Closer, MaybeError } from '@superblocks/shared';
import { Heap } from 'heap-js';
import P from 'pino';
import { SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS, SUPERBLOCKS_WORKER_NODE_USER_ID } from '../env';
import logger from '../logger';
import { PluginProps } from '../plugin-property/plugin-props';
import { shutdown } from '../runtime';
import { ExecutionPoolOptions } from '../types';
import { IpcLogCommitter } from './ipcLogger';
import { IpcStoreExecutor } from './ipcStore';
import { ExecutionOutput, RawRequest } from './native-plugin/executionOutput';
import { IntegrationError } from './native-plugin/integrationError';

interface poolProcess {
  poolId: number;
  process: ChildProcess;
  initTime: number;
  workingDir: string;
  ipcStoreExecutor: IpcStoreExecutor;
  ipcLogCommitter: IpcLogCommitter;
  finishedExecuting: boolean;
  abortController: AbortController;
}

enum PoolEvents {
  PROC_MOVED_TO_BUSY = 'procMovedToBusy',
  BUSY_PROC_MOVED_TO_RECYCLED = 'busyProcMovedToRecycled'
}

export interface ExecutionPool extends Closer {
  ExecutePlugin(
    functionName: string,
    props: PluginProps,
    rawRequest: RawRequest,
    filePaths: Record<string, string>,
    executionTimeoutMs?: string,
    observabilityTags?: Record<string, string>
  ): Promise<ExecutionOutput>;
}

export class ExecutionPoolImpl implements ExecutionPool {
  private _logger: P.Logger;
  private _emitter: EventEmitter;
  private _availableProcs: Heap<poolProcess>;
  private _availablePoolIds: Heap<number>;
  private _maxPoolId: number;
  private _initializingProcs: Map<number, Promise<poolProcess>>;
  private _busyProcs: Map<number, poolProcess>;
  private _recycledProcs: Map<number, poolProcess>;
  private _boundCreateNewProcessHandler: () => void;
  private _boundCleanupProcessHandler: (poolId: number) => void;
  private _options: ExecutionPoolOptions;
  private _shuttingDown: boolean;

  private constructor(poolOptions: ExecutionPoolOptions, eventEmitter: EventEmitter, logClient?: P.Logger) {
    this._logger = logClient ?? logger.child({ who: 'execution_pool' });
    this._emitter = eventEmitter;
    this._availableProcs = new Heap<poolProcess>((a, b) => a.initTime - b.initTime);
    this._availablePoolIds = new Heap<number>(Heap.minComparator);
    this._maxPoolId = 0;
    this._initializingProcs = new Map<number, Promise<poolProcess>>();
    this._busyProcs = new Map<number, poolProcess>();
    this._recycledProcs = new Map<number, poolProcess>();
    this._options = poolOptions;

    this._boundCreateNewProcessHandler = this.createNewProcessHandler.bind(this);
    this._boundCleanupProcessHandler = this.cleanupProcessHandler.bind(this);

    this._shuttingDown = false;
  }

  public static async init(poolOptions: ExecutionPoolOptions, logClient?: P.Logger, eventEmitter?: EventEmitter): Promise<ExecutionPool> {
    const emitter = eventEmitter ?? new EventEmitter();
    const execPool = new ExecutionPoolImpl(poolOptions, emitter, logClient);
    await execPool.initPool();

    return execPool;
  }

  private async initPool(): Promise<void> {
    if (!this._options.enabled) {
      return;
    }

    if (this._shuttingDown) {
      throw new Error('Cannot initialize execution pool, execution pool is shutting down');
    }

    this._logger.info({ poolSize: this._options.poolSize }, 'Initializing new execution pool');

    // Initialize the execution pool with the specified number of processes
    const procs = Array.from({ length: this._options.poolSize }, () => this.initNewProcess(this.getNextAvailablePoolId()));

    for (let i = 0; i < this._options.poolSize; i++) {
      this._availableProcs.push(await procs[i]);
    }

    // Set up event handlers for process pool events
    this._emitter.on(PoolEvents.PROC_MOVED_TO_BUSY, this._boundCreateNewProcessHandler);
    this._emitter.on(PoolEvents.BUSY_PROC_MOVED_TO_RECYCLED, this._boundCleanupProcessHandler);

    this._logger.info({ poolSize: this._options.poolSize }, 'Successfully initialized execution pool');
  }

  private async initNewProcess(poolId: number): Promise<poolProcess> {
    this._logger.debug({ poolId: poolId }, 'Initializing new process for execution pool');

    // Create working directory for this process
    const procWorkingDir = path.join(process.cwd(), 'node_worker', `tmp_${poolId}_${Date.now()}`);
    await fs.promises.mkdir(procWorkingDir, { recursive: true });

    // Spawn a new node process to execute plugins
    const abortController = new AbortController();
    const proc = fork(path.join(__dirname, './poolProcessExecutor' + path.extname(__filename)), {
      uid: SUPERBLOCKS_WORKER_NODE_USER_ID,
      env: this.buildPoolProcEnv(),
      detached: true,
      silent: true,
      cwd: procWorkingDir,
      signal: abortController.signal,
      killSignal: 'SIGTERM'
    });

    // Set up IPC log committer for the spawned process here, as the subprocess will send logs
    // during initialization that need to be received (and logged) by the parent process
    const ipcLogCommitter = new IpcLogCommitter(this._logger, proc);

    // Wait for ready signal from spawned process, before returning
    await new Promise((resolve) => {
      proc.on('message', (msg) => {
        if (msg === 'ready') {
          this._logger.debug({ poolId: poolId }, 'Process ready for execution pool');
          resolve(msg);
        }
      });
    });

    return {
      poolId: poolId,
      process: proc,
      initTime: Date.now(),
      workingDir: procWorkingDir,
      ipcStoreExecutor: IpcStoreExecutor.init(proc, proc, this._options.kvStore, this._logger),
      ipcLogCommitter: ipcLogCommitter,
      finishedExecuting: false,
      abortController: abortController
    };
  }

  private buildPoolProcEnv(): Record<string, string> {
    const envVars: Record<string, string> = {};
    for (const key of this._options.executionEnvInclusionList ?? []) {
      if (key in process.env) {
        envVars[key] = process.env[key];
      } else {
        this._logger.debug({ key }, 'Environment variable in inclusion list not found in host process environment');
      }
    }

    return envVars;
  }

  private getNextAvailablePoolId(): number {
    if (this._availablePoolIds.isEmpty()) {
      this._availablePoolIds.push(this._maxPoolId++);
    }

    return this._availablePoolIds.pop();
  }

  private async getNextAvailableProc(): Promise<poolProcess> {
    while (this._availableProcs.isEmpty()) {
      await new Promise((resolve) => setImmediate(resolve));
    }

    return this._availableProcs.pop();
  }

  private createNewProcessHandler(): void {
    // If we're shutting down, don't spawn any new processes
    if (this._shuttingDown) {
      return;
    }

    const id = this.getNextAvailablePoolId();
    const procProm: Promise<poolProcess> = this.initNewProcess(id);
    this._initializingProcs.set(id, procProm);

    // Set up handlers for process initializing promise, so that we can know once the process
    // is ready (or failed to initialize)
    procProm
      .then((proc) => {
        this._availableProcs.push(proc);
      })
      .catch((err) => {
        this._logger.error({ poolId: id, err }, 'Failed to initialize process for execution pool');
        this._availablePoolIds.push(id);

        // Resend event to trigger another attempt at replenishing the pool
        this._emitter.emit(PoolEvents.PROC_MOVED_TO_BUSY);
      })
      .finally(() => {
        this._initializingProcs.delete(id);
      });
  }

  private cleanupProcessHandler(poolId: number): void {
    const proc = this._recycledProcs.get(poolId);
    if (!proc) {
      return;
    }

    const termProm: Promise<void> = this.stopAndCleanupProcess(proc);
    termProm
      .catch((err) => {
        this._logger.error({ poolId: poolId, err }, 'Failed to terminate and cleanup process for execution pool');
      })
      .finally(() => {
        this._recycledProcs.delete(poolId);
        this._availablePoolIds.push(poolId);
      });
  }

  private async stopAndCleanupProcess(proc: poolProcess): Promise<void> {
    this._logger.debug({ poolId: proc.poolId }, 'Cleaning up process for execution pool');

    await shutdown('terminating pool process', proc.ipcStoreExecutor);
    await shutdown('terminating pool process', proc.ipcLogCommitter);
    await this.terminateProcessFamily(proc);
    await this.cleanupFilesOnDisk(proc);
  }

  private static isProcessTerminated(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return false;
    } catch (err) {
      return true;
    }
  }

  private async terminateProcessFamily(proc: poolProcess): Promise<void> {
    proc.process.removeAllListeners();
    if (proc.process.connected) {
      proc.process.disconnect();
    }
    proc.process.unref();

    // Attempt to kill the process group gracefully
    let termAttempts = 0;

    while (proc.process.exitCode === null && termAttempts < 2) {
      // Check if process still exists, if it's terminated return
      if (ExecutionPoolImpl.isProcessTerminated(proc.process.pid)) {
        return;
      }

      try {
        process.kill(-proc.process.pid, 'SIGTERM');
      } catch (err) {
        if (err.code === 'ESRCH') {
          // Process group has already exited, return
          return;
        }

        this._logger.debug({ poolId: proc.poolId, error: err }, 'Attempt to terminate process group for execution pool failed');
      }

      termAttempts++;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Forcibly kill the process group, if the parent has not exited
    if (proc.process.exitCode === null && !ExecutionPoolImpl.isProcessTerminated(proc.process.pid)) {
      try {
        process.kill(-proc.process.pid, 'SIGKILL');
      } catch (err) {
        // Failed to kill process group, log error and continue
        this._logger.error(
          { poolId: proc.poolId, pid: proc.process.pid, error: err },
          'Failed to terminate process group after sending SIGKILL'
        );
      }
    }
  }

  private async cleanupFilesOnDisk(proc: poolProcess): Promise<void> {
    // Clean up all files and directories under the process's working directory
    await new Promise<void>((resolve) => {
      fs.rmSync(proc.workingDir, { recursive: true, force: true });
      resolve();
    });
  }

  public async ExecutePlugin(
    pluginName: string,
    props: PluginProps,
    rawRequest: RawRequest,
    filePaths: Record<string, string>,
    executionTimeoutMs?: string,
    observabilityTags?: Record<string, string>
  ): Promise<ExecutionOutput> {
    if (!this._options.enabled) {
      return new ExecutionOutput();
    }

    if (this._shuttingDown) {
      throw new Error('Cannot execute plugin, execution pool is shutting down');
    }

    const proc = await this.getNextAvailableProc();
    this._busyProcs.set(proc.poolId, proc);
    this._emitter.emit(PoolEvents.PROC_MOVED_TO_BUSY);

    const executionLogger = this._logger.child({ pluginName: pluginName, poolId: proc.poolId, ...observabilityTags });
    proc.ipcLogCommitter.attachLogger(executionLogger);

    const defaultTimeout = executionTimeoutMs ?? SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS;
    const javascriptExecutionTimeoutMs: number = props.quotas?.duration || Number(defaultTimeout);
    try {
      const execStartTime = new Date();

      proc.process.send({
        type: 'plugin_exec_request',
        poolId: proc.poolId,
        pluginProps: props,
        filePaths: filePaths,
        inheritedEnv: this._options.executionEnvInclusionList ?? []
      });

      proc.process.on('exit', (code, signal) => {
        if (code !== 0) {
          executionLogger.warn(
            { pluginName: pluginName, poolId: proc.poolId, code, signal },
            'Subprocess executing plugin exited with code'
          );
        }
      });

      const execTimeoutWatcher = setTimeout(() => {
        if (!proc.finishedExecuting) {
          proc.abortController.abort();

          executionLogger.debug(
            { pluginName: pluginName, poolId: proc.poolId, timeoutMs: javascriptExecutionTimeoutMs },
            'Subprocess executing plugin timed out'
          );
        }

        // Clear the timeout before completing the callback
        clearTimeout(execTimeoutWatcher);
      }, javascriptExecutionTimeoutMs);

      const output = new ExecutionOutput();
      output.request = rawRequest;
      output.startTimeUtc = execStartTime;

      const responseHandler = new Promise<void>((resolve, reject) => {
        proc.process.on('message', (result) => {
          if (result['type'] === 'pool_exec_result') {
            proc.finishedExecuting = true;
            clearTimeout(execTimeoutWatcher);
            executionLogger.debug({ pluginName: pluginName, poolId: proc.poolId }, 'Pool process executing plugin returned response');

            // Check if the result has an error, and if so throw
            if (result['err']) {
              const err = result['err'] as Error;
              executionLogger.error({ pluginName: pluginName, poolId: proc.poolId, err }, 'Pool process executing plugin returned error');
              reject(err);
              return;
            }

            // Update the output object with the results from the pool process execution
            const execOutput = result['output'] as ExecutionOutput;
            output.error = execOutput.error;
            output.log = output.log.concat(execOutput.log);
            output.structuredLog = output.structuredLog.concat(execOutput.structuredLog);
            output.output = execOutput.output;
            output.startTimeUtc = execOutput.startTimeUtc;
            output.executionTime = execOutput.executionTime;

            resolve();
          }
        });
      });

      const errorHandler = new Promise<void>((resolve, reject) => {
        proc.process.on('error', (err) => {
          clearTimeout(execTimeoutWatcher);

          if (err.name !== 'AbortError') {
            executionLogger.error({ pluginName: pluginName, poolId: proc.poolId, err }, 'Subprocess executing plugin raised error');
            reject(err);
            return;
          }

          // Set full execution time on the execution output if a timeout error occurred
          output.executionTime = Date.now() - execStartTime.getTime();

          // Handle updating execution output wih timeout error
          const timeoutErr = new IntegrationError(`[AbortError] Timed out after ${javascriptExecutionTimeoutMs}ms`);
          executionLogger.info(`Executing API step ${pluginName} failed with error: ${timeoutErr.message}`);
          output.logError(timeoutErr.message);
          resolve();
        });
      });

      await Promise.race([responseHandler, errorHandler]);

      return output;
    } finally {
      this._recycledProcs.set(proc.poolId, proc);
      this._busyProcs.delete(proc.poolId);
      this._emitter.emit(PoolEvents.BUSY_PROC_MOVED_TO_RECYCLED, proc.poolId);
    }
  }

  public async close(reason?: string): Promise<MaybeError> {
    if (!this._options.enabled) {
      return;
    }

    this._logger.info(
      { numAvail: this._availableProcs.size(), numBusy: this._busyProcs.size, numRecycled: this._recycledProcs.size, reason },
      'Shutting down execution pool'
    );
    this._shuttingDown = true;

    // Remove event handlers for process pool events
    this._emitter.removeListener(PoolEvents.PROC_MOVED_TO_BUSY, this._boundCreateNewProcessHandler);
    this._emitter.removeListener(PoolEvents.BUSY_PROC_MOVED_TO_RECYCLED, this._boundCleanupProcessHandler);

    // Wait for any processes currently initializing to finish
    while (this._initializingProcs.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Forcibely terminate all idle processes waiting for work
    await Promise.all(Array.from(this._availableProcs).map((proc) => this.stopAndCleanupProcess(proc)));

    // Wait for all busy processes to finish (or timeout)
    while (this._busyProcs.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Wait for the remaining recycled processes to be terminated
    while (this._recycledProcs.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this._logger.info({ reason }, 'Successfully shutdown execution pool');
  }
}
