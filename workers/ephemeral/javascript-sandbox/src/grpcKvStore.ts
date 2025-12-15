import { KVStore } from '@superblocks/shared';

import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';
import { GetVariablesRequest, SetVariableRequest, SetVariablesRequest, KeyValue } from './types/worker/v1/sandbox_variable_store_pb';

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
}
