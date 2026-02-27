import Piscina from 'piscina';
import type { WorkerInput, WorkerTaskInput } from './worker-types';
import type { MessagePort } from 'worker_threads';

// Detect if running from TypeScript source (test/dev) or compiled JS (production)
const isTypeScript = __filename.endsWith('.ts');

export class WorkerPool {
  private static _instance: WorkerPool;
  private pool: Piscina;
  private activeTaskCount: number;

  private constructor() {
    const filename = isTypeScript ? __dirname + '/bootstrap.ts' : __dirname + '/bootstrap.js';

    this.pool = new Piscina({
      filename,
      // When running from TypeScript source, use @swc-node/register to transpile on-the-fly
      ...(isTypeScript && {
        execArgv: ['--require', '@swc-node/register']
      })
    });
    this.activeTaskCount = 0;
  }

  public static configure(): void {
    this._instance = new this();
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

  public static async run(input: WorkerTaskInput, signal: AbortSignal, port: MessagePort): Promise<string> {
    this._instance.activeTaskCount += 1;
    const workerInput: WorkerInput = { ...input, port };
    try {
      return await this.getPool().run(workerInput, { signal, transferList: [port] });
    } finally {
      this._instance.activeTaskCount -= 1;
    }
  }

  public static getPool(): Piscina {
    if (!this._instance) {
      throw Error('not initialized');
    }

    return this._instance.pool;
  }

  public static getTasksCount(): number {
    if (!this._instance) {
      throw Error('not initialized');
    }

    return this._instance.activeTaskCount;
  }
}
