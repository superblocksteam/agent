import { NodeVM } from 'vm2';
import {
  ENV_VAR_AWS_DEFAULT_REGION,
  ENV_VAR_AWS_REGION,
  ENV_VAR_AWS_ROLE_ARN,
  ENV_VAR_AWS_WEB_IDENTITY_TOKEN_FILE,
  ExecutionContext,
  ExecutionOutput
} from '../../types';

export function nodeVMWithContext(
  context: ExecutionContext,
  // Keys are the path in the data tree, values are the path on disk
  fileTreeToDisk?: Record<string, string>,
  timeout = 5000,
  extLibs: string[] = [],
  builtinLibs: string[] = []
): NodeVM {
  const vm = new NodeVM({
    console: 'redirect',
    timeout: timeout,
    // TODO(george): our wrapper code that runs in the sandbox doesn't use `$superblocksFiles` anymore,
    // so we can remove it from the sandbox so as to not pollute the sandbox's global object. Similarly,
    // it doesn't use `$fileServerUrl` and `$agentKey` anymore, so we can remove them as well.
    sandbox: { ...context.globals, ...context.outputs, $superblocksFiles: fileTreeToDisk },
    require: {
      builtin: builtinLibs,
      external: extLibs
    },
    env: {
      [ENV_VAR_AWS_DEFAULT_REGION]: process.env[ENV_VAR_AWS_DEFAULT_REGION],
      [ENV_VAR_AWS_ROLE_ARN]: process.env[ENV_VAR_AWS_ROLE_ARN],
      [ENV_VAR_AWS_WEB_IDENTITY_TOKEN_FILE]: process.env[ENV_VAR_AWS_WEB_IDENTITY_TOKEN_FILE],
      [ENV_VAR_AWS_REGION]: process.env[ENV_VAR_AWS_REGION]
    }
  });
  return vm;
}

export function addLogListenersToVM(vm: NodeVM, output: ExecutionOutput): void {
  if (output) {
    vm.on('console.log', (...data) => {
      output.logInfo(data.join(' '));
    });
    vm.on('console.dir', (...data) => {
      output.logInfo(data.join(' '));
    });
    vm.on('console.warn', (...data) => {
      output.logWarn(data.join(' '));
    });
    vm.on('console.error', (...data) => {
      output.logError(data.join(' '));
    });
  }
}
