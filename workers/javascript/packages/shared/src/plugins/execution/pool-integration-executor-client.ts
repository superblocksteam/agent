import { MessagePort } from 'worker_threads';

interface IntegrationExecutorResponse {
  id: number;
  body?: { output: unknown };
  error?: string;
}

/**
 * Worker-thread side of the integration executor MessagePort bridge.
 *
 * Sends integration execution requests to the main thread via a MessagePort
 * and returns results. This is the worker-side counterpart to
 * PoolIntegrationExecutorServer.
 */
export class PoolIntegrationExecutorClient {
  private port: MessagePort;
  private nextId = 0;
  private pendingResolvers: Record<number, (message: IntegrationExecutorResponse) => void> = {};

  constructor(port: MessagePort) {
    this.port = port;
    port.on('message', (message: IntegrationExecutorResponse) => {
      if (!message) return;
      const resolver = this.pendingResolvers[message.id];
      if (resolver) {
        resolver(message);
        delete this.pendingResolvers[message.id];
      }
    });
  }

  async executeIntegration(params: {
    integrationId: string;
    pluginId: string;
    actionConfiguration?: Record<string, unknown>;
    metadata?: { label?: string; description?: string };
  }): Promise<unknown> {
    const id = this.nextId++;
    this.port.postMessage({
      id,
      type: 'executeIntegration',
      integrationId: params.integrationId,
      pluginId: params.pluginId,
      actionConfiguration: params.actionConfiguration,
      metadata: params.metadata
    });
    const response = await this.awaitResponse(id);
    return response.body?.output;
  }

  private awaitResponse(id: number): Promise<IntegrationExecutorResponse> {
    return new Promise((resolve, reject) => {
      this.pendingResolvers[id] = (message) => {
        if (message.error !== undefined) {
          reject(new Error(message.error));
        } else {
          resolve(message);
        }
      };
    });
  }

  close(): void {
    this.port.close();
  }
}
