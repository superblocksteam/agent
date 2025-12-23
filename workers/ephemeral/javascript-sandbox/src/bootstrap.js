/* eslint-disable @typescript-eslint/no-require-imports */

const {
  addLogListenersToVM,
  buildVariables,
  decodeBytestringsExecutionContext,
  ExecutionOutput,
  VariableClient
} = require('@superblocks/shared');
const { EventEmitter } = require('events');
const { NodeVM } = require('vm2');

const eventEmitter = new EventEmitter();

function cleanStack(stack, lineOffset) {
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

const sharedCode = `
module.exports = async function() {
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

  {
    const _ = require('lodash');

    // $superblocksFiles is a pre-computed map of treePath -> remotePath
    // computed by the task-manager by traversing context to find filepicker objects
    Object.entries($superblocksFiles ?? {}).forEach(([treePath, remotePath]) => {
      if (!remotePath) return;
      const file = _.get(global, treePath);
      _.set(global, treePath, {
        ...file,
        $superblocksId: undefined,
        previewUrl: undefined,
        readContentsAsync: async (mode) => {
          // Use kvStore's fetchFile to get file contents from task-manager
          const contents = await $fetchFile(remotePath);
          const response = await serialize(contents, mode);
          return response;
        },
        readContents: (mode) => {
          // Use synchronous fetchFile
          const contents = $fetchFileSync(remotePath);
          const response = serialize(contents, mode);
          return response;
        }
      });
    });
  }

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

  const ret = new ExecutionOutput();
  const codeLineNumberOffset = sharedCode.split('\n').length;
  let variableClient;

  try {
    // Create file fetcher functions that use kvStore to fetch from task-manager
    // The task-manager handles authentication with the orchestrator
    const kvStore = context.kvStore;
    const fetchFile = async (path) => {
      if (kvStore && typeof kvStore.fetchFile === 'function') {
        return await kvStore.fetchFile(path);
      }
      throw new Error('File fetching not available');
    };
    const fetchFileSync = (path) => {
      if (kvStore && typeof kvStore.fetchFileSync === 'function') {
        return kvStore.fetchFileSync(path);
      }
      throw new Error('File fetching not available');
    };

    const execGlobalContext = {
      ...context.globals,
      ...context.outputs,
      $superblocksFiles: filePaths ?? {},
      $fetchFile: fetchFile,
      $fetchFileSync: fetchFileSync
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
        $fetchFile: fetchFile,
        $fetchFileSync: fetchFileSync
      },
      wasm: false
    });
    addLogListenersToVM(vm, ret);
    vm.setGlobals(execGlobalContext);

    const codeToExecute = `${sharedCode}
  ${code}
}()`;

    ret.output = await vm.run(codeToExecute, { filename: __dirname });
    eventEmitter.removeAllListeners();

    if (variableClient) {
      await variableClient.flush();
    }
  } catch (err) {
    eventEmitter.removeAllListeners();
    ret.error = cleanStack(err.stack, codeLineNumberOffset);
  }

  return ret;
};
