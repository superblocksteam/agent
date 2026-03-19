/**
 * JavaScript SDK API Plugin.
 *
 * Executes TypeScript-based APIs defined with @superblocksteam/sdk-api
 * in an isolated Piscina worker thread. The worker runs user code in a
 * VM2 sandbox with `executeApi` and an integration executor bridge
 * injected as globals.
 *
 * Integration execution is proxied across the worker thread boundary
 * via a MessagePort-based IPC bridge. Diagnostics (per-call timing,
 * truncated I/O) are captured on the main thread and attached to the
 * ExecutionOutput after the worker completes.
 */
import * as path from 'node:path';
import {
  ErrorCode,
  EvaluationPair,
  ExecutionOutput,
  IntegrationError,
  LanguageActionConfiguration,
  LanguagePlugin,
  PluginExecutionProps,
  WorkerPool
} from '@superblocks/shared';

const bootstrapExt = __filename.endsWith('.ts') ? '.ts' : '.js';
const bootstrapPath = path.join(__dirname, `bootstrap${bootstrapExt}`);

export default class JavascriptSdkApiPlugin extends LanguagePlugin {
  pluginName = 'JavaScript SDK API';

  async init(): Promise<void> {
    WorkerPool.configure({ name: this.pluginName, filename: bootstrapPath });
  }

  async shutdown(): Promise<void> {
    await WorkerPool.shutdown(this.pluginName);
  }

  async evaluateBindingPairs(
    _code: string,
    _entitiesToExtract: Set<string>,
    _dataContext: Record<string, unknown>
  ): Promise<EvaluationPair[]> {
    return [];
  }

  async execute({
    context,
    actionConfiguration,
    files,
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

    try {
      return await WorkerPool.ExecuteInWorkerPool({
        poolName: this.pluginName,
        input: {
          context,
          code,
          files,
          executionTimeout
        },
        pluginName: this.pluginName,
        integrationExecutor: context.integrationExecutor,
        includeDiagnostics: Boolean(context.includeDiagnostics)
      });
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError((err as Error).message, ErrorCode.UNSPECIFIED, {
        pluginName: this.pluginName,
        stack: (err as Error).stack
      });
    }
  }
}
