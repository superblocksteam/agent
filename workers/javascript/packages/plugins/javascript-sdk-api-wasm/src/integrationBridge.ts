/**
 * Integration executor bridge for WASM sandbox.
 *
 * Creates a host-side async function that bridges __sb_integrationExecutor
 * calls from QuickJS back to the orchestrator via MessagePort IPC.
 */

import { ErrorCode, IntegrationError, PoolIntegrationExecutorClient } from '@superblocks/shared';

/** Parameters passed from the Go wrapper script's __sb_executeQuery. */
interface IntegrationExecuteParams {
  integrationId: string;
  pluginId: string;
  actionConfiguration?: Record<string, unknown>;
  metadata?: { label?: string; description?: string };
}

/**
 * Creates a WASM-compatible integration executor bridge function.
 *
 * When an integration client is available, returns an async function that
 * forwards execution requests to the orchestrator. Returns undefined when
 * no client is provided (no integration executor available).
 *
 * @param integrationClient - The pool integration executor client (or undefined)
 * @returns An async bridge function, or undefined if no client is provided
 */
export function createWasmIntegrationExecutorBridge(
  integrationClient?: Pick<PoolIntegrationExecutorClient, 'executeIntegration'>
): ((params: IntegrationExecuteParams) => Promise<unknown>) | undefined {
  if (!integrationClient) {
    return undefined;
  }

  return async (params: IntegrationExecuteParams): Promise<unknown> => {
    try {
      return await integrationClient.executeIntegration(params);
    } catch (e) {
      const orig = e as IntegrationError;
      throw new IntegrationError(
        orig.message,
        orig.code ?? ErrorCode.UNSPECIFIED,
        { pluginName: 'JavaScript SDK API WASM', stack: orig.stack }
      );
    }
  };
}
