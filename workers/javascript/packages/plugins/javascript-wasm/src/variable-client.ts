import { MessagePort } from 'worker_threads';

interface VariableMessage {
  id: number;
  body?: { data: unknown };
  error?: string;
}

interface WriteBufferEntry {
  key: string;
  value: unknown;
}

// Callback type for fetchFile operations - called directly from message handler for deasync compatibility
type FetchFileCallback = (error: Error | null, result: Buffer | null) => void;

export class VariableClient {
  private port: MessagePort;
  private nextId = 0;
  private pendingResolvers: Record<number, (message: VariableMessage) => void> = {};
  private pendingFetchCallbacks: Record<number, FetchFileCallback> = {};
  private writableBuffer: WriteBufferEntry[] = [];

  constructor(port: MessagePort) {
    this.port = port;
    port.on('message', (message: VariableMessage) => {
      if (!message) {
        return;
      }

      // Check if this is a fetchFile callback - handle directly for deasync compatibility
      const fetchCallback = this.pendingFetchCallbacks[message.id];
      if (fetchCallback) {
        delete this.pendingFetchCallbacks[message.id];
        if (message.error) {
          fetchCallback(new Error(message.error), null);
        } else {
          // Data arrives as Uint8Array (Buffer subclass) via structured clone
          const data = message.body?.data as Uint8Array;
          fetchCallback(null, Buffer.from(data));
        }
        return;
      }

      // Handle Promise-based resolvers (for async methods)
      const resolver = this.pendingResolvers[message.id];
      if (resolver) {
        resolver(message);
        delete this.pendingResolvers[message.id];
      }
    });
  }

  // For advanced variable
  async read(keys: string[]): Promise<{ data: unknown[] }> {
    const id = this.nextId++;
    this.port.postMessage({ id: id, type: 'readStore', keys: keys });
    const responseMessage = await this.allocatePromise(id);
    return responseMessage.body as { data: unknown[] };
  }

  // For advanced variable - value is string to match shared VariableClient interface
  async write(key: string, value: string): Promise<void> {
    if (value === undefined) {
      return;
    }

    const id = this.nextId++;
    let sanitizedValue: unknown;
    try {
      sanitizedValue = JSON.parse(JSON.stringify(value));
    } catch (e) {
      throw new Error(`Attempt to write a variable which is not json serializable.`);
    }

    this.port.postMessage({ id: id, type: 'writeStore', key: key, value: sanitizedValue });
    await this.allocatePromise(id);
  }

  // For simple variable
  writeBuffer(key: string, value: unknown): void {
    if (value === undefined) {
      return;
    }

    let sanitizedValue: unknown;
    try {
      sanitizedValue = JSON.parse(JSON.stringify(value));
    } catch (e) {
      throw new Error(`Attempt to write a variable which is not json serializable.`);
    }

    this.writableBuffer.push({ key: key, value: sanitizedValue });
  }

  // For simple variable
  async flush(): Promise<void> {
    const id = this.nextId++;
    this.port.postMessage({ id: id, type: 'writeStoreMany', payload: this.writableBuffer });
    await this.allocatePromise(id);
  }

  /**
   * Fetch file contents via the KVStore proxy.
   * This method is only functional when running under an ephemeral worker,
   * where the KVStore is a GrpcKvStore instance with fetchFileCallback support.
   *
   * Callback-style API to match the interface expected by deasync.
   * The callback is registered directly and called synchronously from the
   * message handler (not via Promise.then) for deasync compatibility.
   */
  fetchFileCallback(path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
    const id = this.nextId++;
    // Register callback directly - will be called from message handler, not via Promise
    // This is necessary for deasync to work properly (avoids microtask scheduling)
    this.pendingFetchCallbacks[id] = callback;
    this.port.postMessage({ id: id, type: 'fetchFile', path: path });
  }

  private allocatePromise(id: number): Promise<VariableMessage> {
    return new Promise((resolve) => {
      this.pendingResolvers[id] = resolve;
    });
  }

  close(): void {
    this.port.close();
  }
}
