import {
  ErrorCode,
  EvaluationPair,
  ExecutionContext,
  ExecutionOutput,
  extractJsEvaluationPairsWithTokenizer,
  IntegrationError,
  JavascriptActionConfiguration,
  JavascriptDatasourceConfiguration,
  LanguagePlugin,
  PluginExecutionProps,
  RequestFiles
} from '@superblocks/shared';
import { tokenize } from 'esprima';
import { omit } from 'lodash';
import { WorkerPool } from './pool';

// eslint-disable-next-line
const VariableServer = require('./variable-server.js');

export type JavascriptProcessInput = {
  context: ExecutionContext;
  code: string;
  files?: RequestFiles;
  executionTimeout: number;
};

export default class JavascriptPlugin extends LanguagePlugin {
  pluginName = 'JavaScript';

  async init(): Promise<void> {
    WorkerPool.configure();
  }

  async shutdown(): Promise<void> {
    await WorkerPool.shutdown();
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
  }: PluginExecutionProps<JavascriptDatasourceConfiguration, JavascriptActionConfiguration> & {
    quotas?: Record<string, number>;
  }): Promise<ExecutionOutput> {
    try {
      const executionTimeout = quotas?.duration || Number(this.pluginConfiguration.javascriptExecutionTimeoutMs);
      // TODO: Wrap the user's code in a library that handles the FileReader abstraction
      if (!actionConfiguration.body) {
        return ExecutionOutput.fromJSONString('null');
      }

      const output = await this.executeInWorker({
        context: context,
        code: actionConfiguration.body,
        files,
        executionTimeout
      });
      return output;
    } catch (err) {
      throw new IntegrationError(err, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: err.stack });
    }
  }

  async executeInWorker(input: JavascriptProcessInput): Promise<ExecutionOutput> {
    const abortController = new AbortController();
    const { signal } = abortController;
    const timeout = input.executionTimeout;

    const timeoutWatcher = setTimeout(() => {
      abortController.abort();
      clearTimeout(timeoutWatcher);
    }, timeout);

    const variableServer = new VariableServer(input.context.kvStore!);

    try {
      const outputJSON = await WorkerPool.run(
        {
          context: omit(input.context, 'kvStore'),
          code: input.code,
          executionTimeout: input.executionTimeout,
          files: input.files
        },
        signal,
        variableServer.clientPort()
      );
      return ExecutionOutput.fromJSONString(outputJSON);
    } catch (err) {
      // Annotate the AbortError, which is triggered by the timeout.
      if (err.name === 'AbortError') {
        throw new IntegrationError(`[AbortError] Timed out after ${timeout}ms`, ErrorCode.INTEGRATION_QUERY_TIMEOUT, {
          pluginName: this.pluginName
        });
      }
      throw err;
    } finally {
      // Always attempt to clear timeout once the execution
      // has completed.
      clearTimeout(timeoutWatcher);
      variableServer.close();
    }
  }
}
