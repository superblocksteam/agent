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
import { VariableServer } from './variable-server';

/**
 * Buffer time (ms) added to the hard timeout (worker termination) beyond the soft timeout.
 *
 * The soft timeout (timeLimitMs in the sandbox) is a best-effort limit that handles most cases
 * cheaply by cleanly aborting execution. The hard timeout (AbortSignal to Piscina) terminates
 * the worker process, which is expensive because:
 * - The worker must be recreated
 * - A new sandbox must be initialized
 * - The WASM module must be reloaded
 *
 * This buffer gives the soft timeout a chance to handle the timeout gracefully before we
 * resort to terminating the worker. The hard timeout is still there as a safety net for
 * cases where the soft timeout can't preempt (e.g., stuck in host functions or native code).
 */
const HARD_TIMEOUT_BUFFER_MS = 1000;

export type JavascriptWasmProcessInput = {
  context: ExecutionContext;
  code: string;
  files?: RequestFiles;
  executionTimeout: number;
  executionId?: string;
};

/**
 * Extended props interface that includes executionId.
 * In the ephemeral worker context, executionId is provided by the pluginsRouter.
 */
interface JavascriptWasmPluginExecutionProps
  extends PluginExecutionProps<JavascriptDatasourceConfiguration, JavascriptActionConfiguration> {
  quotas?: Record<string, number>;
  executionId?: string;
}

export default class JavascriptWasmPlugin extends LanguagePlugin {
  pluginName = 'JavaScriptWASM';

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
    quotas,
    executionId
  }: JavascriptWasmPluginExecutionProps): Promise<ExecutionOutput> {
    try {
      const executionTimeout = quotas?.duration || Number(this.pluginConfiguration.javascriptExecutionTimeoutMs);
      if (!actionConfiguration.body) {
        return ExecutionOutput.fromJSONString('null');
      }

      const output = await this.executeInWorker({
        context: context,
        code: actionConfiguration.body,
        files,
        executionTimeout,
        executionId
      });
      return output;
    } catch (err) {
      throw new IntegrationError(err, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: (err as Error).stack });
    }
  }

  async executeInWorker(input: JavascriptWasmProcessInput): Promise<ExecutionOutput> {
    const abortController = new AbortController();
    const { signal } = abortController;
    const softTimeout = input.executionTimeout;
    const hardTimeout = softTimeout + HARD_TIMEOUT_BUFFER_MS;

    const timeoutWatcher = setTimeout(() => {
      abortController.abort();
    }, hardTimeout);

    const variableServer = new VariableServer(input.context.kvStore!);

    try {
      const outputJSON = await WorkerPool.run(
        {
          context: omit(input.context, 'kvStore'),
          code: input.code,
          executionTimeout: input.executionTimeout,
          files: input.files,
          executionId: input.executionId
        },
        signal,
        variableServer.clientPort()
      );
      return ExecutionOutput.fromJSONString(outputJSON);
    } catch (err) {
      // Annotate the AbortError, which is triggered by the hard timeout (worker termination).
      // This only fires if the soft timeout (inside the sandbox) failed to preempt execution.
      if ((err as Error).name === 'AbortError') {
        throw new IntegrationError(`[AbortError] Timed out after ${softTimeout}ms`, ErrorCode.INTEGRATION_QUERY_TIMEOUT, {
          pluginName: this.pluginName
        });
      }
      throw err;
    } finally {
      // Always attempt to clear timeout once the execution has completed.
      clearTimeout(timeoutWatcher);
      variableServer.close();
    }
  }
}
