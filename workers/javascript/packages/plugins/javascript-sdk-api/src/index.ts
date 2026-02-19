import {
  EvaluationPair,
  ExecutionOutput,
  LanguageActionConfiguration,
  LanguagePlugin,
  PluginExecutionProps
} from '@superblocks/shared';

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

  async execute({ actionConfiguration }: PluginExecutionProps): Promise<ExecutionOutput> {
    const output = new ExecutionOutput();
    const code = (actionConfiguration as LanguageActionConfiguration).body;

    if (!code) {
      output.logError('No code provided for SDK API execution');
      return output;
    }

    // Stub: proves the plugin was dispatched and received code.
    // Full SDK API execution (inputSchema/outputSchema/run) will be implemented separately.
    output.output = { pluginName: 'javascriptsdkapi', received: true };
    return output;
  }
}
