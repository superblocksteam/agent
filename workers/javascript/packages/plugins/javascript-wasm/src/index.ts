import * as path from 'node:path';
import {
  ErrorCode,
  EvaluationPair,
  ExecutionOutput,
  extractJsEvaluationPairsWithTokenizer,
  IntegrationError,
  JavascriptActionConfiguration,
  JavascriptDatasourceConfiguration,
  LanguagePlugin,
  PluginExecutionProps,
  WorkerPool
} from '@superblocks/shared';
import { tokenize } from 'esprima';

// Worker file: .ts when running from source, .js when built
const bootstrapExt = __filename.endsWith('.ts') ? '.ts' : '.js';
const bootstrapPath = path.join(__dirname, `bootstrap${bootstrapExt}`);

interface JavascriptWasmPluginExecutionProps
  extends PluginExecutionProps<JavascriptDatasourceConfiguration, JavascriptActionConfiguration> {
  quotas?: Record<string, number>;
}

export default class JavascriptWasmPlugin extends LanguagePlugin {
  pluginName = 'JavaScriptWASM';

  private parseExecutionTimeoutMs(): number {
    // Accept numeric strings that may include separators (e.g. "1_200_000").
    const raw = String(this.pluginConfiguration.javascriptExecutionTimeoutMs ?? '').replaceAll('_', '');
    const parsed = Number(raw);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    // Fall back to the same timeout used by the plugin loader default
    // (javascriptExecutionTimeoutMs = "1_200_000"), when config is missing/invalid.
    return 1_200_000;
  }

  async init(): Promise<void> {
    WorkerPool.configure({ filename: bootstrapPath });
  }

  async shutdown(): Promise<void> {
    await WorkerPool.shutdown();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateBindingPairs(code: string, entitiesToExtract: Set<string>, dataContext: Record<string, any>): Promise<EvaluationPair[]> {
    return extractJsEvaluationPairsWithTokenizer(code, entitiesToExtract, dataContext, tokenize);
  }

  async execute({ context, actionConfiguration, files, quotas }: JavascriptWasmPluginExecutionProps): Promise<ExecutionOutput> {
    try {
      const configuredTimeout = this.parseExecutionTimeoutMs();
      const executionTimeout = quotas?.duration && quotas.duration > 0 ? quotas.duration : configuredTimeout;
      if (!actionConfiguration.body) {
        return ExecutionOutput.fromJSONString('null');
      }

      return await WorkerPool.ExecuteInWorkerPool({
        input: {
          context: context,
          code: actionConfiguration.body,
          files,
          executionTimeout
        },
        pluginName: this.pluginName
      });
    } catch (err) {
      throw new IntegrationError(err, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: (err as Error).stack });
    }
  }
}
