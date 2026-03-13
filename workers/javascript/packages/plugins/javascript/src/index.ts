import * as path from 'node:path';
import {
  EvaluationPair,
  ExecutionOutput,
  extractJsEvaluationPairsWithTokenizer,
  JavascriptActionConfiguration,
  JavascriptDatasourceConfiguration,
  LanguagePlugin,
  PluginExecutionProps,
  WorkerPool
} from '@superblocks/shared';
import { tokenize } from 'esprima';
import { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } from './env';
// Worker file: .ts when running from source, .js when built
const bootstrapExt = __filename.endsWith('.ts') ? '.ts' : '.js';
const bootstrapPath = path.join(__dirname, `bootstrap${bootstrapExt}`);

export default class JavascriptPlugin extends LanguagePlugin {
  pluginName = 'JavaScript';

  async init(): Promise<void> {
    WorkerPool.configure({ name: this.pluginName, filename: bootstrapPath });
  }

  async shutdown(): Promise<void> {
    await WorkerPool.shutdown(this.pluginName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateBindingPairs(code: string, entitiesToExtract: Set<string>, dataContext: Record<string, any>): Promise<EvaluationPair[]> {
    return extractJsEvaluationPairsWithTokenizer(code, entitiesToExtract, dataContext, tokenize);
  }

  async execute({
    context,
    actionConfiguration,
    files,
    quotas
  }: PluginExecutionProps<JavascriptDatasourceConfiguration, JavascriptActionConfiguration>): Promise<ExecutionOutput> {
    const configuredTimeout = this.parseExecutionTimeoutMs();
    const executionTimeout = quotas?.duration && quotas.duration > 0 ? quotas.duration : configuredTimeout;

    return await WorkerPool.ExecuteInWorkerPool({
      poolName: this.pluginName,
      input: {
        context: context,
        code: actionConfiguration.body,
        files,
        inheritedEnv: SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST,
        executionTimeout
      },
      options: { name: 'executeCode' },
      pluginName: this.pluginName
    });
  }
}
