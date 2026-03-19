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

  const sdkApi = await getSdkApi();

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
          throw new IntegrationError(
            (e as Error).message,
            ErrorCode.INTEGRATION_SYNTAX,
            { pluginName: 'JavaScript SDK API' }
          );
        }
      }
    : undefined;

  const globals = {
    ...(context.globals ?? {}),
    __sb_execute: sdkApi.executeApi,
    __sb_integrationExecutor: integrationExecutorBridge
  };

  const requireRoot = buildRequireRoot();

  try {
    return await executeCode({
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
  } finally {
    integrationClient?.close();
  }
};
