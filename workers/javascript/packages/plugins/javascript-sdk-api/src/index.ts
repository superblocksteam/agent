/**
 * JavaScript SDK API Plugin.
 *
 * Executes TypeScript-based APIs defined with @superblocksteam/sdk-api.
 * Bridges the ESM sdk-api package into the VM2 sandbox by injecting
 * `executeApi` and an integration executor bridge as sandbox globals.
 */
import {
  ErrorCode,
  EvaluationPair,
  ExecutionOutput,
  IntegrationError,
  LanguageActionConfiguration,
  LanguagePlugin,
  PluginExecutionProps
} from '@superblocks/shared';
import { buildRequireRoot } from './buildRequireRoot';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

/**
 * Dynamically imports the ESM @superblocksteam/sdk-api package.
 * Cached after first load to avoid repeated dynamic imports.
 */
let sdkApiPromise: Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> | null = null;

function getSdkApi(): Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> {
  if (!sdkApiPromise) {
    sdkApiPromise = import('@superblocksteam/sdk-api') as Promise<{
      executeApi: (...args: unknown[]) => Promise<unknown>;
    }>;
  }
  return sdkApiPromise;
}

export default class JavascriptSdkApiPlugin extends LanguagePlugin {
  pluginName = 'JavaScript SDK API';

  async evaluateBindingPairs(
    _code: string,
    _entitiesToExtract: Set<string>,
    _dataContext: Record<string, unknown>
  ): Promise<EvaluationPair[]> {
    // SDK APIs receive pre-bundled code; no binding resolution needed.
    return [];
  }

  async execute({
    context,
    actionConfiguration,
    quotas
  }: PluginExecutionProps): Promise<ExecutionOutput> {
    const code = (actionConfiguration as LanguageActionConfiguration).body;

    if (!code) {
      const output = new ExecutionOutput();
      output.logError('No code provided for SDK API execution');
      return output;
    }

    const executionTimeout =
      quotas?.duration || Number(this.pluginConfiguration?.javascriptExecutionTimeoutMs ?? 30_000);

    if (!context.kvStore) {
      const output = new ExecutionOutput();
      output.logError('kvStore not available for SDK API execution');
      return output;
    }

    // Load the ESM sdk-api package and extract executeApi.
    const sdkApi = await getSdkApi();

    // Build the integration executor bridge.
    // This wraps context.integrationExecutor (a GrpcIntegrationExecutor) as a
    // plain async function that can be passed through the VM2 sandbox boundary.
    // The wrapper script calls this with {integrationId, pluginId, actionConfiguration}.
    const integrationExecutorBridge = context.integrationExecutor
      ? async (params: { integrationId: string; pluginId: string; actionConfiguration?: Record<string, unknown> }) => {
          const result = await context.integrationExecutor!.executeIntegration(params);
          if (result.error) {
            throw new IntegrationError(result.error, ErrorCode.INTEGRATION_SYNTAX, {
              pluginName: this.pluginName
            });
          }
          return result.output;
        }
      : undefined;

    const globals = {
      ...(context.globals ?? {}),
      __sb_execute: sdkApi.executeApi,
      __sb_integrationExecutor: integrationExecutorBridge
    };

    const requireRoot = buildRequireRoot();

    const runPromise = executeCode({
      context: {
        ...context,
        globals,
        outputs: context.outputs ?? {},
        variables: context.variables ?? {}
      },
      code,
      filePaths: {},
      inheritedEnv: [],
      requireRoot
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new IntegrationError(
              `Timed out after ${executionTimeout}ms`,
              ErrorCode.INTEGRATION_QUERY_TIMEOUT,
              { pluginName: this.pluginName }
            )
          ),
        executionTimeout
      );
    });

    try {
      return await Promise.race([runPromise, timeoutPromise]);
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError((err as Error).message, ErrorCode.UNSPECIFIED, {
        pluginName: this.pluginName,
        stack: (err as Error).stack
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
