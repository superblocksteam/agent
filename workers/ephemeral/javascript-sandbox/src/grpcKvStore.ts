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
      const request = new FetchFileRequest();
      request.setExecutionId(this.executionId);
      request.setPath(path);

      this.client.fetchFile(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        const errorMsg = response.getError();
        if (errorMsg) {
          reject(new Error(errorMsg));
          return;
        }
        resolve(Buffer.from(response.getContents_asU8()));
      });
    });
  }

  /**
   * Synchronous version of fetchFile using deasync.
   * Used by readContents() in user scripts.
   */
  public fetchFileSync(path: string): Buffer {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const deasync = require('deasync');
    return deasync(this.fetchFile.bind(this))(path);
  }
}
