const {
  decodeBytestringsExecutionContext,
  ExecutionOutput,
  addLogListenersToVM,
  getTreePathToDiskPath,
  nodeVMWithContext,
  buildVariables
} = require('@superblocks/shared');

const VariableClient = require('./variable-client');

const importString = `
    var _ = require('lodash');
    var moment = require('moment');
    var axios = require('axios');
    var fs = require('fs');
    var AWS = require('aws-sdk');
    var xmlbuilder2 = require('xmlbuilder2');
    var base64url = require('base64url');
    var deasync = require('deasync');
`;

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
  ${importString}

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

  function fetchFromController(location, callback) {
    require('http').get($fileServerUrl + '?location=' + location, {
      headers: { 'x-superblocks-agent-key': $agentKey }
    }, (response) => {
      if (response.statusCode != 200) {
        return callback(new Error('Internal Server Error'), null);
      }

      const chunks = [];
      let chunkStrings = '';
      response.on('data', (chunk) => {
        if ($fileServerUrl.includes('v2')) {
          const serialized = serialize(chunk)
          chunkStrings += serialized
        } else {
          chunks.push(Buffer.from(chunk))
        }
      });
      response.on('error', (err) => callback(err, null));
      response.on('end', () => {
        if ($fileServerUrl.includes('v2')) {
          const processed = chunkStrings
          .split('\\n')
          .filter((str) => str.length > 0)
          .map((str) => {
            const json = JSON.parse(str);
            return Buffer.from(json.result.data, 'base64');
          });
          callback(null, Buffer.concat(processed))
        } else {
          callback(null, Buffer.concat(chunks))
        }
      });
    })
  }

  Object.entries($superblocksFiles).forEach(([treePath, diskPath]) => {
    const file = _.get(global, treePath);
    _.set(global, treePath, {
      ...file,
      $superblocksId: undefined,
      previewUrl: undefined,
      readContentsAsync: async (mode) => {
        const contents = await require('util').promisify(fetchFromController)(diskPath);
        const response = await serialize(contents, mode);
        return response;
      },
      readContents: (mode) => {
        const contents = require('deasync')(fetchFromController)(diskPath);
        const response = serialize(contents, mode);
        return response;
      }
    });
  });

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

module.exports = async (workerData) => {
  const { context, code, files, executionTimeout, port } = workerData;

  const ret = new ExecutionOutput();
  const filePaths = getTreePathToDiskPath(context.globals, files);
  const codeLineNumberOffset = sharedCode.split('\n').length;
  let variableClient;

  try {
    const vm = nodeVMWithContext(context, filePaths, executionTimeout);
    if (context.variables && typeof context.variables === 'object') {
      variableClient = new VariableClient(port);
      const builtVariables = await buildVariables(context.variables, variableClient);
      for (const [k, v] of Object.entries(builtVariables)) {
        vm.setGlobal(k, v);
      }
    } else {
      throw new Error(`variables not defined`);
    }

    decodeBytestringsExecutionContext(context, true);
    addLogListenersToVM(vm, ret);
    ret.output = await vm.run(
      `${sharedCode}
  ${code}
}()`,
      __dirname
    );

    if (variableClient) {
      await variableClient.flush();
    }
  } catch (err) {
    ret.error = cleanStack(err.stack, codeLineNumberOffset);
  } finally {
    variableClient.close();
  }

  return JSON.stringify(ret);
};
