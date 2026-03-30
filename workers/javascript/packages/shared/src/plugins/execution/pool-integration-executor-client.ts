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
    const metadata = this.#sanitizeMetadataForPostMessage(params.metadata) as { label?: string; description?: string } | undefined;
    const message = {
      id,
      type: 'executeIntegration',
      integrationId: params.integrationId,
      pluginId: params.pluginId,
      actionConfiguration: params.actionConfiguration,
      metadata
    } as const;
    this.port.postMessage(message);
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

  #sanitizeMetadataForPostMessage<T>(value: T): T {
    if (value === undefined) {
      return value;
    }

    // The SDK runtime can pass metadata as a proxy-like wrapper object that
    // fails structured clone even though its fields are plain values.
    return JSON.parse(JSON.stringify(value)) as T;
  }

  close(): void {
    this.port.close();
  }
}
