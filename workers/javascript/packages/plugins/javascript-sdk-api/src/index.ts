import {
  ErrorCode,
  EvaluationPair,
  ExecutionOutput,
  IntegrationError,
  LanguageActionConfiguration,
  LanguagePlugin,
  PluginExecutionProps
} from '@superblocks/shared';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

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

    const runPromise = executeCode({
      context: {
        ...context,
        globals: context.globals ?? {},
        outputs: context.outputs ?? {},
        variables: context.variables ?? {}
      },
      code,
      filePaths: {},
      inheritedEnv: []
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
