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
  extLibs: string[] = [
    'lodash',
    'moment',
    'axios',
    'aws-sdk',
    'xmlbuilder2',
    'base64url',
    'jsonwebtoken',
    'deasync',
    'amazon-qldb-driver-nodejs',
    'webflow-api',
    'bcrypt',
    '@notionhq/client',
    'notion-to-md',
    '@paralleldrive/cuid2',
    'xml2json',
    'jmespath',
    'date-fns'
  ]
): NodeVM {
  const vm = new NodeVM({
    console: 'redirect',
    timeout: timeout,
    sandbox: { ...context.globals, ...context.outputs, $superblocksFiles: fileTreeToDisk },
    require: {
      builtin: ['*', '-child_process', '-process'],
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
