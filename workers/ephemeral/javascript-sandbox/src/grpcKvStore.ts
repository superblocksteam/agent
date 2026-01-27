import http from 'http';
import { KVStore } from '@superblocks/shared';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';
import { GetVariablesRequest, SetVariableRequest, SetVariablesRequest, KeyValue } from './types/worker/v1/sandbox_variable_store_pb';

export class GrpcKvStore implements KVStore {
  private readonly executionId: string;
  private readonly client: SandboxVariableStoreServiceClient;
  private readonly variableStoreHttpAddress: string;

  public constructor(executionId: string, client: SandboxVariableStoreServiceClient, variableStoreHttpAddress: string) {
    this.executionId = executionId;
    this.client = client;
    this.variableStoreHttpAddress =
      variableStoreHttpAddress.startsWith('http://') || variableStoreHttpAddress.startsWith('https://')
        ? variableStoreHttpAddress
        : `http://${variableStoreHttpAddress}`;
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

        const data = response.getValuesList().map((value) => {
          if (value === '') {
            return null;
          }
          return JSON.parse(value);
        });
        resolve({ data });
      });
    });
  }

  public async write(key: string, value: unknown): Promise<void> {
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
  public fetchFileCallback(path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
    const url = new URL('/fetch-file', this.variableStoreHttpAddress);
    url.searchParams.set('executionId', this.executionId);
    url.searchParams.set('path', path);

    const options = {
      method: 'GET'
    };

    const req = http.request(url.toString(), options, (response: http.IncomingMessage) => {
      if (response.statusCode !== 200) {
        return callback(new Error(`HTTP ${response.statusCode}: Internal Server Error`), null);
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      response.on('error', (error) => callback(error, null));
      response.on('end', () => {
        try {
          const responseBody = Buffer.concat(chunks as unknown as Uint8Array[]).toString('utf8');
          const jsonResponse = JSON.parse(responseBody);

          // Check for error field in response
          if (jsonResponse.error) {
            return callback(new Error(jsonResponse.error), null);
          }

          // Decode base64 contents to Buffer
          if (jsonResponse.contents) {
            const contents = Buffer.from(jsonResponse.contents, 'base64');
            callback(null, contents);
          } else {
            callback(new Error('Response missing contents field'), null);
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error('Failed to parse response'), null);
        }
      });
    });

    req.on('error', (error) => {
      callback(error, null);
    });

    req.end();
  }
}
