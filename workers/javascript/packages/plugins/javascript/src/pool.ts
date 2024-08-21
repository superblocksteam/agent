import Piscina from 'piscina';

export class WorkerPool {
  private static _instance: WorkerPool;
  private pool: Piscina;
  private activeTaskCount: number;

  private constructor() {
    this.pool = new Piscina({
      filename: __dirname + '/bootstrap.js'
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
    return new Promise((resolve, reject) => {
      // JavaScript have SUPERBLOCKS_AGENT_EXECUTION_JS_TIMEOUT_MS set
      // in .env so this will resolve eventually
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public static async run(input: any, signal: AbortSignal, port: MessagePort): Promise<string> {
    this._instance.activeTaskCount += 1;
    input.port = port;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await this.getPool().run(input, { signal, transferList: [port as any] });
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
