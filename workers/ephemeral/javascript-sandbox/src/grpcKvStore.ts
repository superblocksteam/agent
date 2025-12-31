import { KVStore } from '@superblocks/shared';

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

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    return new Promise((resolve, reject) => {
      const request = new GetVariablesRequest();
      request.setExecutionId(this.executionId);
      request.setKeysList(keys);

      this.client.getVariables(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        const data = response.getValuesList().map((value) => JSON.parse(value));
        resolve({ data });
      });
    });
  }

  public async write(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new SetVariableRequest();
      request.setExecutionId(this.executionId);
      request.setKey(key);
      request.setValue(JSON.stringify(value));

      this.client.setVariable(request, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async writeMany(payload: Array<{ key: string; value: unknown }>): Promise<void> {
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
        resolve();
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
      try {
        const contents = await this.fetchFile(path);
        this.fileCache.set(path, contents);
      } catch (error) {
        console.error('failed to prefetch file:', path, error);
        throw error;
      }
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
}
