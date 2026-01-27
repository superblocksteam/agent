/* eslint-disable @typescript-eslint/no-require-imports */

const {
  addLogListenersToVM,
  buildVariables,
  decodeBytestringsExecutionContext,
  ExecutionOutput,
  VariableClient
} = require('@superblocks/shared');
const deasync = require('deasync');
const { EventEmitter } = require('events');
const _ = require('lodash');
const { NodeVM } = require('vm2');

const eventEmitter = new EventEmitter();

function cleanStack(stack, lineOffset) {
  if (!stack) {
    return undefined;
  }

  const extractPathRegex = /\s+at.*[(\s](.*)\)?/;

  const errorLines = stack.replace(/\\/g, '/').split('\n');

  // Find error line number
  let errorLineNumber = parseInt(errorLines[0].split(':').pop() ?? '');

  const errorStack = errorLines
    .filter((line) => {
      const pathMatches = line.match(extractPathRegex);
      /*
       Some error stacks have the erroring line number set in a stack line after the error message.
       For example, ReferenceError stacks show up as the following, where the second line contains
       the erroring line number and character/column number at the end in that order:

       ReferenceError: y is not defined
          at ...:67:1
      */
      if (isNaN(errorLineNumber) && pathMatches) {
        const lineSplit = line.split(':');
        errorLineNumber = parseInt(lineSplit[lineSplit.length - 2]);
      }
      return !pathMatches && !line.startsWith('/');
    })
    .filter((line) => line.trim() !== '')
    .join('\n');

  return isNaN(errorLineNumber) ? errorStack : `Error on line ${errorLineNumber - lineOffset}:\n${errorStack}`;
}

function serialize(buffer, mode) {
  if (mode === 'raw') {
    return buffer;
  }
  if (mode === 'binary' || mode === 'text') {
    // utf8 encoding is lossy for truly binary data, but not an error in JS
    return buffer.toString(mode === 'binary' ? 'base64' : 'utf8');
  }
  // Otherwise, detect mode from first 1024 chars
  const chunk = buffer.slice(0, 1024).toString('utf8');
  if (chunk.indexOf('\u{FFFD}') > -1) {
    return buffer.toString('base64');
  }
  return buffer.toString('utf8');
}

function createFunctionForPreparingGlobalObjectForFiles(kvStore, filePaths) {
  return (globalObject) => {
    Object.entries(filePaths).forEach(([treePath, remotePath]) => {
      const readContentsAsync = async (mode) => {
        if (!kvStore || typeof kvStore.fetchFile !== 'function') {
           throw new Error('File fetching not available');
        }

        const contents = await kvStore.fetchFile(remotePath);
        return serialize(contents, mode);
      };
      // hide the implementation of the function
      readContentsAsync.toString = () => 'function readContentsAsync() { [native code] }';

      const readContents = (mode) => {
        if (!kvStore || typeof kvStore.fetchFile !== 'function') {
          throw new Error('File fetching not available');
        }

        // Use the callback-based version for better deasync compatibility
        const contents = deasync(kvStore.fetchFileCallback.bind(kvStore))(remotePath);
        return serialize(contents, mode);
      };
      // hide the implementation of the function
      readContents.toString = () => 'function readContents() { [native code] }';

      const file = _.get(globalObject, treePath);
      _.set(globalObject, treePath, {
        ...file,
        $superblocksId: undefined,
        previewUrl: undefined,
        readContentsAsync,
        readContents,
      });
    });
  };
}

const sharedCode = `
  // Augment console object to support log and dir methods
  var $augmentedConsole = (function(cons) {
    const util = require('util');
    return {
        ...cons,
        log(...args) {
          cons.log(util.format(...args));
        },
        dir(obj) {
          cons.log(util.inspect(obj));
        }
    };
  }(console));
  console = $augmentedConsole;
`;

module.exports.executeCode = async (workerData) => {
  const { context, code, filePaths, inheritedEnv } = workerData;

  // Add 3 lines for the newline, module export declaration and the function call to create file objects
  const codeLineNumberOffset = sharedCode.split('\n').length + 3;
  const ret = new ExecutionOutput();
  let variableClient;

  try {
    const execGlobalContext = {
      ...context.globals,
      ...context.outputs,
      $superblocksFiles: filePaths ?? {},
    };

    if (context.variables && typeof context.variables === 'object') {
      variableClient = new VariableClient(context.kvStore);
      const builtVariables = await buildVariables(context.variables, variableClient);
      for (const [k, v] of Object.entries(builtVariables)) {
        execGlobalContext[k] = v;
      }
    } else {
      throw new Error(`variables not defined`);
    }

    decodeBytestringsExecutionContext(context, true);

    const prepareGlobalObjectForFiles = createFunctionForPreparingGlobalObjectForFiles(context.kvStore, filePaths);

    // Build environment for user script
    const userProcessEnv = {};
    for (const key of inheritedEnv ?? []) {
      if (process.env[key]) {
        userProcessEnv[key] = process.env[key];
      }
    }

    // Create vm2 sandbox for user script execution
    const vm = new NodeVM({
      argv: [],
      console: 'redirect',
      env: userProcessEnv,
      eval: false,
      require: {
        builtin: ['*', '-child_process', '-process'],
        external: true
      },
      sandbox: {
        ...context.globals,
        ...context.outputs,
        $superblocksFiles: filePaths ?? {},
      },
      wasm: false
    });
    addLogListenersToVM(vm, ret);
    vm.setGlobals(execGlobalContext);
    vm.setGlobal('$prepareGlobalObjectForFiles', prepareGlobalObjectForFiles);

    const codeToExecute = `
module.exports = async function() {
  $prepareGlobalObjectForFiles(globalThis);
  ${sharedCode}
  ${code}
}()`;

    ret.output = await vm.run(codeToExecute, { filename: __dirname });
    eventEmitter.removeAllListeners();

    if (variableClient) {
      await variableClient.flush();
    }
  } catch (err) {
    eventEmitter.removeAllListeners();

    const defaultErrMsg = err instanceof Error ? err.message : String(err);
    ret.error = cleanStack(err.stack, codeLineNumberOffset) ?? defaultErrMsg;
  }

  return ret;
};
