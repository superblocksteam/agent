import {
  EvaluationPair,
  ExecutionOutput,
  extractJsEvaluationPairsWithTokenizer,
  JavascriptActionConfiguration,
  JavascriptDatasourceConfiguration,
  LanguagePlugin,
  PluginExecutionProps,
  getTreePathToDiskPath
} from '@superblocks/shared';
import { tokenize } from 'esprima';
import { executeCode } from './bootstrap';

export default class JavascriptPlugin extends LanguagePlugin {
  pluginName = 'JavaScript';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateBindingPairs(code: string, entitiesToExtract: Set<string>, dataContext: Record<string, any>): Promise<EvaluationPair[]> {
    return extractJsEvaluationPairsWithTokenizer(code, entitiesToExtract, dataContext, tokenize);
  }

  async execute({
    context,
    actionConfiguration,
    files
  }: PluginExecutionProps<JavascriptDatasourceConfiguration, JavascriptActionConfiguration>): Promise<ExecutionOutput> {
    const filePaths = getTreePathToDiskPath(context.globals, files);
    return await executeCode({
      context: context,
      code: actionConfiguration.body,
      filePaths: filePaths,
      inheritedEnv: []
    });
  }
}
