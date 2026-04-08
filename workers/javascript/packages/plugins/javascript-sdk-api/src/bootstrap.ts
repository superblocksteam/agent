import { performance } from 'node:perf_hooks';
import { ErrorCode, IntegrationError, PoolIntegrationExecutorClient, type WorkerInput } from '@superblocks/shared';

import { buildRequireRoot } from './buildRequireRoot';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

let sdkApiPromise: Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> | null = null;

function getSdkApi(): Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> {
  if (!sdkApiPromise) {
    sdkApiPromise = import('@superblocksteam/sdk-api') as Promise<{
      executeApi: (...args: unknown[]) => Promise<unknown>;
    }>;
  }
  return sdkApiPromise;
}

export = async function handleTask(workerData: WorkerInput): Promise<string> {
  const { context, code, files, integrationPort, port } = workerData;

  const t0 = performance.now();

  const sdkApi = await getSdkApi();
  const t1 = performance.now();

  let integrationClient: PoolIntegrationExecutorClient | undefined;

  if (integrationPort) {
    integrationClient = new PoolIntegrationExecutorClient(integrationPort);
  }

  const integrationExecutorBridge = integrationClient
    ? async (params: {
        integrationId: string;
        pluginId: string;
        actionConfiguration?: Record<string, unknown>;
        metadata?: { label?: string; description?: string };
      }) => {
        try {
          return await integrationClient!.executeIntegration(params);
        } catch (e) {
          throw new IntegrationError((e as Error).message, ErrorCode.INTEGRATION_SYNTAX, { pluginName: 'JavaScript SDK API' });
        }
      }
    : undefined;

  const globals = {
    ...(context.globals ?? {}),
    __sb_execute: sdkApi.executeApi,
    __sb_integrationExecutor: integrationExecutorBridge
  };
  const t2 = performance.now();

  const requireRoot = buildRequireRoot();
  const t3 = performance.now();

  try {
    const result: string = await executeCode({
      context: {
        ...context,
        globals,
        outputs: context.outputs ?? {},
        variables: context.variables ?? {}
      },
      code,
      files,
      inheritedEnv: [],
      requireRoot,
      port
    });
    const t4 = performance.now();

    // Inject bootstrap phase timing into the result so it flows through
    // to the Performance proto. Fall back to the raw result if injection fails.
    try {
      const parsed = JSON.parse(result);
      if (parsed != null && typeof parsed === 'object') {
        parsed.bootstrapTiming = {
          sdkImportMs: round(t1 - t0),
          bridgeSetupMs: round(t2 - t1),
          requireRootMs: round(t3 - t2),
          codeExecutionMs: round(t4 - t3),
          totalMs: round(t4 - t0)
        };
        return JSON.stringify(parsed);
      }
    } catch {
      // executeCode returned non-JSON — return as-is
    }
    return result;
  } finally {
    integrationClient?.close();
  }
};

function round(ms: number): number {
  return Math.round(ms * 100) / 100;
}
