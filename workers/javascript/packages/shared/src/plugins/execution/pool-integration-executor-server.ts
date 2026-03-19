import { MessageChannel, MessagePort } from 'worker_threads';
import { IntegrationExecutor, IntegrationCallDiagnostic } from '../../types';
import { truncateJson } from './truncate-json';

/** Maximum byte length for truncated JSON in diagnostic records. */
const DIAGNOSTICS_MAX_BYTES = 10_240;

/** Maximum number of diagnostic records per execution to prevent unbounded growth. */
const DIAGNOSTICS_MAX_ENTRIES = 10_000;

interface IntegrationExecutorRequest {
  id: number;
  type: 'executeIntegration';
  integrationId: string;
  pluginId: string;
  actionConfiguration?: Record<string, unknown>;
  metadata?: { label?: string; description?: string };
}

/**
 * Main-thread side of the integration executor MessagePort bridge.
 *
 * Receives integration execution requests from a Piscina worker thread,
 * delegates them to the real IntegrationExecutor (gRPC client), and sends
 * results back. Also captures per-call diagnostic records when enabled.
 */
export class PoolIntegrationExecutorServer {
  #serverPort: MessagePort;
  #clientPort: MessagePort;
  #diagnostics: IntegrationCallDiagnostic[] = [];
  #closed = false;

  constructor(executor: IntegrationExecutor, includeDiagnostics: boolean) {
    const { port1, port2 } = new MessageChannel();
    this.#serverPort = port1;
    this.#clientPort = port2;

    port1.on('message', (message: IntegrationExecutorRequest) => {
      void (async () => {
        const startMs = includeDiagnostics ? Date.now() : 0;
        let callOutput: unknown;
        let callError = '';

        try {
          const result = await executor.executeIntegration({
            integrationId: message.integrationId,
            pluginId: message.pluginId,
            actionConfiguration: message.actionConfiguration
          });

          if (result.error) {
            callOutput = undefined;
            callError = result.error;
            this.#trySend(port1, { id: message.id, error: result.error });
          } else {
            callOutput = result.output;
            this.#trySend(port1, { id: message.id, body: { output: result.output } });
          }
        } catch (error) {
          callError = error instanceof Error ? error.message : String(error);
          this.#trySend(port1, { id: message.id, error: callError });
        } finally {
          if (includeDiagnostics) {
            this.#recordDiagnostic(message, startMs, callOutput, callError);
          }
        }
      })();
    });
  }

  #trySend(port: MessagePort, message: unknown): void {
    if (this.#closed) return;
    try {
      port.postMessage(message);
    } catch {
      // Port was closed between the flag check and the send (hard timeout race).
    }
  }

  #recordDiagnostic(message: IntegrationExecutorRequest, startMs: number, callOutput: unknown, callError: string): void {
    if (this.#diagnostics.length >= DIAGNOSTICS_MAX_ENTRIES) {
      return;
    }

    const endMs = Date.now();
    const input = truncateJson(message.actionConfiguration, DIAGNOSTICS_MAX_BYTES);
    const output = truncateJson(callOutput, DIAGNOSTICS_MAX_BYTES);

    this.#diagnostics.push({
      integrationId: message.integrationId,
      pluginId: message.pluginId,
      input: input.json,
      output: output.json,
      startMs,
      endMs,
      durationMs: endMs - startMs,
      error: callError,
      sequence: this.#diagnostics.length,
      metadata: message.metadata,
      inputWasTruncated: input.truncated,
      outputWasTruncated: output.truncated
    });
  }

  clientPort(): MessagePort {
    return this.#clientPort;
  }

  diagnostics(): IntegrationCallDiagnostic[] {
    return this.#diagnostics;
  }

  close(): void {
    this.#closed = true;
    this.#serverPort.close();
  }
}
