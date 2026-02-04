import { MessageChannel, MessagePort } from 'worker_threads';
import { KVStore } from '@superblocks/shared';

interface VariableMessage {
  id: number;
  type: 'readStore' | 'writeStore' | 'writeStoreMany' | 'fetchFile';
  keys?: string[];
  key?: string;
  value?: unknown;
  payload?: Array<{ key: string; value: unknown }>;
  path?: string;
}

/**
 * Extended KVStore interface that includes the fetchFileCallback method.
 * This method is only available when running under an ephemeral worker,
 * where the KVStore is a GrpcKvStore instance.
 */
interface KVStoreWithFileFetch extends KVStore {
  fetchFileCallback?: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;
}

export class VariableServer {
  #serverPort: MessagePort;
  #clientPort: MessagePort;

  constructor(kvStore: KVStoreWithFileFetch) {
    const { port1, port2 } = new MessageChannel();
    this.#serverPort = port1;
    this.#clientPort = port2;

    port1.on('message', (message: VariableMessage) => {
      (async () => {
        if (message.type === 'readStore') {
          const resp = await kvStore.read(message.keys!);
          port1.postMessage({ id: message.id, body: resp });
        } else if (message.type === 'writeStore') {
          await kvStore.write(message.key!, message.value as string);
          port1.postMessage({ id: message.id });
        } else if (message.type === 'writeStoreMany') {
          await kvStore.writeMany(message.payload!);
          port1.postMessage({ id: message.id });
        } else if (message.type === 'fetchFile') {
          // fetchFileCallback is only available in ephemeral workers (GrpcKvStore)
          if (!kvStore.fetchFileCallback) {
            port1.postMessage({
              id: message.id,
              error: 'fetchFileCallback is not available (not running in ephemeral worker)'
            });
            return;
          }
          kvStore.fetchFileCallback(message.path!, (error, result) => {
            if (error) {
              port1.postMessage({ id: message.id, error: error.message });
            } else {
              // Buffer (Uint8Array subclass) is supported by structured clone algorithm
              port1.postMessage({ id: message.id, body: { data: result } });
            }
          });
        }
      })();
    });
  }

  clientPort(): MessagePort {
    return this.#clientPort;
  }

  close(): void {
    this.#serverPort.close();
  }
}
