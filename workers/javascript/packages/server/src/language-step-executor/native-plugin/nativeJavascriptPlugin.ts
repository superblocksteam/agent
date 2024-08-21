import { ActionConfiguration, ExecutionContext } from '@superblocks/shared';
import { executeCode } from './bootstrap';
import { ExecutionOutput } from './executionOutput';
import { IntegrationError } from './integrationError';

export type JavascriptProcessInput = {
  context: ExecutionContext;
  code: string;
  filePaths?: Record<string, string>;
  inheritedEnv?: Array<string>;
};

export class NativeJavascriptPlugin {
  async execute({
    context,
    actionConfiguration,
    filePaths,
    inheritedEnv
  }: {
    context: ExecutionContext;
    actionConfiguration: ActionConfiguration;
    filePaths: Record<string, string>;
    inheritedEnv: Array<string>;
  }): Promise<ExecutionOutput> {
    try {
      // TODO: Wrap the user's code in a library that handles the FileReader abstraction
      if (!('body' in actionConfiguration) || !actionConfiguration.body) {
        return ExecutionOutput.fromJSONString('{}');
      }

      return await executeCode({
        context: context,
        code: actionConfiguration.body as string,
        filePaths: filePaths,
        inheritedEnv: inheritedEnv
      });
    } catch (err) {
      throw new IntegrationError(err);
    }
  }
}
