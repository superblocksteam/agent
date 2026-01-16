import { MaybeError } from '@superblocks/shared';
import { IO, KVStore, KVStoreTx, WriteOps, Wrapped } from '@superblocks/worker.js';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';
import {
  GetVariablesRequest,
  SetVariableRequest,
  SetVariablesRequest,
  KeyValue,
  FetchFileRequest
} from './types/worker/v1/sandbox_variable_store_pb';

export class GrpcKvStore implements KVStore {
  private readonly executionId: string;
  private readonly client: SandboxVariableStoreServiceClient;
  private readonly fileCache: Map<string, Buffer> = new Map();

  public constructor(executionId: string, client: SandboxVariableStoreServiceClient) {
    this.executionId = executionId;
    this.client = client;
  }

  public async delete(keys: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async decr(key: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  public tx(): KVStoreTx {
    throw new Error('Method not implemented.');
  }

  public async read(keys: string[]): Promise<{ pinned: IO; data: unknown[] }> {
    return new Promise((resolve, reject) => {
      const request = new GetVariablesRequest();
      request.setExecutionId(this.executionId);
      request.setKeysList(keys);

      this.client.getVariables(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        const values = response.getValuesList();
        const data = values.map((value) => {
          if (value === '') {
            return null;
          }
          return JSON.parse(value);
        });

        // Calculate total bytes read
        const bytesRead = values.reduce((sum, v) => sum + v.length, 0);
        resolve({ pinned: { read: bytesRead }, data });
      });
    });
  }

  public async write(key: string, value: unknown, ops?: WriteOps): Promise<Wrapped<IO, void>> {
    return new Promise((resolve, reject) => {
      let jsonValue: string | undefined = JSON.stringify(value);
      if (value === undefined) {
        jsonValue = 'null';
      }

      const request = new SetVariableRequest();
      request.setExecutionId(this.executionId);
      request.setKey(key);
      request.setValue(jsonValue);

      this.client.setVariable(request, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ data: undefined });
      });
    });
  }

  public async writeMany(payload: Array<{ key: string; value: unknown }>, ops?: WriteOps): Promise<Wrapped<IO, void>> {
    return new Promise((resolve, reject) => {
      const request = new SetVariablesRequest();
      request.setExecutionId(this.executionId);

      const kvList = payload.map(({ key, value }) => {
        const kv = new KeyValue();
        kv.setKey(key);
        kv.setValue(JSON.stringify(value));
        return kv;
      });
      request.setKvsList(kvList);

      this.client.setVariables(request, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ data: undefined });
      });
    });
  }

  /**
   * Fetch file contents from the task-manager.
   * The task-manager handles authentication with the orchestrator's file server.
   */
  public async fetchFile(path: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.fetchFileCallback(path, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!);
        }
      });
    });
  }

  /**
   * Callback-style version of fetchFile
   */
  public fetchFileCallback(path: string, callback: (error: Error | null, result?: Buffer) => void): void {
    const request = new FetchFileRequest();
    request.setExecutionId(this.executionId);
    request.setPath(path);

    this.client.fetchFile(request, (error, response) => {
      if (error) {
        callback(error);
        return;
      }
      const errorMsg = response.getError();
      if (errorMsg) {
        callback(new Error(errorMsg));
        return;
      }
      callback(null, Buffer.from(response.getContents_asU8()));
    });
  }

  /**
   * Prefetch multiple files and store them in the cache.
   * Should be called before VM execution when sync file reads are needed.
   */
  public async prefetchFiles(paths: string[]): Promise<void> {
    const fetchPromises = paths.map(async (path) => {
      const contents = await this.fetchFile(path);
      this.fileCache.set(path, contents);
    });

    await Promise.all(fetchPromises);
  }

  /**
   * Get file contents from cache. Returns undefined if not cached.
   */
  public getFileFromCache(path: string): Buffer | undefined {
    return this.fileCache.get(path);
  }

  /**
   * Check if a file is in the cache.
   */
  public hasFileInCache(path: string): boolean {
    return this.fileCache.has(path);
  }

  public async close(reason?: string): Promise<MaybeError> {
    return;
  }
}
