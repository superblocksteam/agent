/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-var-requires */
const { EventEmitter } = require('events');
const { Parser } = require('acorn');
const walk = require('acorn-walk');
const MagicString = require('magic-string');
const { decodeBytestringsExecutionContext } = require('./bytestring');
const { ExecutionOutput } = require('./executionOutput');
const { buildVariables } = require('./variable');
const { VariableClient } = require('./variableClient');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
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

function throwSyntaxErrorWithLineNum(code, err, lineOffset) {
  const { Script } = require('vm');
  new Script(code, { filename: __dirname, lineOffset: lineOffset });

  // We expect the compilation of the Script to raise a SyntaxError, if it doesn't rethrow the original error
  throw err;
}

function addLogListenersToUserScript(output) {
  const outputLogInfo = (...data) => output.logInfo(data.join(' '));
  eventEmitter.on('log', outputLogInfo);
  eventEmitter.on('dir', outputLogInfo);

  const outputLogWarn = (...data) => output.logWarn(data.join(' '));
  eventEmitter.on('warn', outputLogWarn);

  const outputLogError = (...data) => output.logError(data.join(' '));
  eventEmitter.on('error', outputLogError);
}

function rewriteDynamicImports(source, ecmaVersion) {
  const ast = Parser.parse(source, {
    ecmaVersion,
    sourceType: 'script',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    locations: false,
    ranges: true
  });

  const ms = new MagicString(source);
  walk.simple(ast, {
    ImportExpression(node) {
      // node.start => beginning of "import"
      // node.source.start => beginning of the argument expression (right after "(" and any spaces)
      ms.overwrite(node.start, node.source.start, '__dynamicImport__(');
    }
  });

  return {
    code: ms.toString()
  };
}

const patchedDynamicImport = function (restrictedProcess, restrictedModules) {
  return async function (specifier) {
    if (typeof specifier !== 'string') {
      return Promise.reject(new TypeError('import specifier must be a string'));
    }

    if (specifier === 'process' || specifier === 'node:process') {
      return Promise.resolve(restrictedProcess);
    }

    if (restrictedModules.includes(specifier)) {
      return Promise.reject(new Error(`Cannot find module '${specifier}'`));
    }

    return import(specifier);
  };
};

const patchedRequire = function (req, restrictedProcess, restrictedModules) {
  return function (module) {
    if (module === 'process' || module === 'node:process') {
      return restrictedProcess;
    }

    if (restrictedModules.includes(module)) {
      throw new Error(`Cannot find module '${module}'`);
    }

    return req(module);
  };
};

const sharedCode = `
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

  {
    const _ = require('lodash');

    Object.entries($superblocksFiles).forEach(([treePath, diskPath]) => {
      const file = _.get(localVariables, treePath);
      _.set(localVariables, treePath, {
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

    // Remove the localVariables variable from the context
    localVariables = undefined;
  }

  var $augmentedConsole = (function(cons, eventEmitter) {
    const util = require('util');

    return {
        ...cons,
        log(...args) {
          const formattedArgs = util.format(...args);
          cons.log(formattedArgs);
          eventEmitter.emit('log', formattedArgs);
        },
        dir(obj) {
          const formattedObj = util.inspect(obj);
          cons.log(formattedObj);
          eventEmitter.emit('dir', formattedObj);
        },
        warn(...args) {
          const formattedArgs = util.format(...args);
          cons.warn(formattedArgs);
          eventEmitter.emit('warn', formattedArgs);
        },
        error(...args) {
          const formattedArgs = util.format(...args);
          cons.error(formattedArgs);
          eventEmitter.emit('error', formattedArgs);
        }
    };
  }(console, this.eventEmitter));
  console = $augmentedConsole;

  // Prevent access to the Function objects' constructor
  Object.getPrototypeOf(function () {}).constructor = {};

  {
    // Prevent access to the AsyncFunction objects' constructor, by explicitly defining it as an empty object
    const AsyncFunctionConstructor = Object.getPrototypeOf(async function(){}).constructor;

    if (
      AsyncFunctionConstructor &&
      AsyncFunctionConstructor.prototype &&
      Object.prototype.hasOwnProperty.call(AsyncFunctionConstructor.prototype, "constructor")
    ) {

      const ctrDesc = Object.getOwnPropertyDescriptor(AsyncFunctionConstructor.prototype, "constructor");
      if (ctrDesc && ctrDesc.configurable) {
        Object.defineProperty(AsyncFunctionConstructor.prototype, "constructor", {
          value: {},
          writable: false,
          enumerable: false,
          configurable: true
        });
      }
    }
  }
`;

module.exports.executeCode = async (workerData) => {
  const { context, code, filePaths, inheritedEnv } = workerData;

  const ret = new ExecutionOutput();
  const codeLineNumberOffset = sharedCode.split('\n').length + 2; // +2 for the function wrapper
  let variableClient;

  try {
    const execGlobalContext = { ...context.globals, ...context.outputs, $superblocksFiles: filePaths };

    if (context.variables && typeof context.variables === 'object') {
      variableClient = new VariableClient(context.kvStore);
      const builtVariables = await buildVariables(context.variables, variableClient);
      for (const [k, v] of Object.entries(builtVariables)) {
        execGlobalContext[k] = v;
      }
    } else {
      throw new Error(`variables not defined`);
    }

    const execGlobalContextKeys = Object.keys(execGlobalContext);
    const execGlobalContextValues = Object.values(execGlobalContext);

    addLogListenersToUserScript(ret);
    decodeBytestringsExecutionContext(context, true);

    // Build environment for user script
    const userProcessEnv = {};
    for (const key of inheritedEnv || []) {
      if (process.env[key]) {
        userProcessEnv[key] = process.env[key];
      }
    }

    // Set environment for user script
    const userProcess = {
      ...process,
      abort: () => {},
      allowedNodeEnvironmentFlags: new Set(),
      availableMemory: () => 0,
      channel: undefined,
      chdir: (diretory) => {
        throw new Error('Unable to change directory in a sandboxed environment');
      },
      config: {},
      connected: false,
      constrainedMemory: () => 0,
      cpuUsage: () => {
        return {
          user: 0,
          system: 0
        };
      },
      disconnect: () => {},
      dlopen: (module, filename, flags) => {},
      emitWarning: (...args) => {},
      env: userProcessEnv,
      execArgv: [],
      execPath: '',
      exit: (code) => {},
      getActiveResourcesInfo: () => {
        return [];
      },
      getegid: () => -1,
      geteuid: () => -1,
      getgid: () => -1,
      getgroups: () => [],
      getuid: () => -1,
      setegid: (gid) => {},
      seteuid: (uid) => {},
      setgid: (gid) => {},
      setgroups: (groups) => {},
      setuid: (uid) => {},
      kill: (pid, signal) => {},
      loadEnvFile: (path) => {},
      mainModule: undefined,
      memoryUsage: Object.assign(
        () => {
          return {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0
          };
        },
        { rss: () => 0 }
      ),
      permission: {
        has: (scope, reference) => {
          return false;
        }
      },
      ppid: process.pid,
      send: undefined
    };

    let rewrittenCode = code;
    try {
      const { code: updatedCode } = rewriteDynamicImports(code, 'latest');
      rewrittenCode = updatedCode;
    } catch (err) {
      // Ignore error rewriting dynamic imports
      // Syntax errors will be caught and handled when building the AsyncFunction
    }

    const blockedBuiltIn = (builtIn) => {
      const refErr = () => new ReferenceError(`${builtIn} is not defined`);

      const stubbedCallable = (...args) => {
        throw refErr();
      };

      return new Proxy(stubbedCallable, {
        get() {
          throw refErr();
        },
        apply() {
          throw refErr();
        },
        construct() {
          throw refErr();
        },
        has() {
          throw refErr();
        },
        set() {
          throw refErr();
        },
        getPrototypeOf() {
          throw refErr();
        }
      });
    };

    let userScript;
    try {
      userScript = AsyncFunction(
        '__dynamicImport__',
        'exports',
        'require',
        'module',
        'eval',
        'AsyncFunction',
        'Function',
        '__dirname',
        '__filename',
        'process',
        'localVariables',
        ...execGlobalContextKeys,
        `${sharedCode}
    ${rewrittenCode}`
      ).bind({ eventEmitter: eventEmitter });
    } catch (err) {
      eventEmitter.removeAllListeners();

      if (!(err instanceof SyntaxError)) {
        throw new Error('failed to build code');
      }

      // Compile the JavaScript to determine the line number of the error
      throwSyntaxErrorWithLineNum(code, err, codeLineNumberOffset);
    }

    const restrictedPackages = ['child_process', 'node:child_process'];
    const restrictedDynamicImport = patchedDynamicImport(userProcess, restrictedPackages);
    const restrictedRequire = patchedRequire(require, userProcess, restrictedPackages);
    const restrictedModule = {
      ...module,
      parent: {
        ...module.parent,
        require: restrictedRequire
      },
      require: restrictedRequire
    };

    ret.output = await userScript(
      restrictedDynamicImport,
      exports,
      restrictedRequire,
      restrictedModule,
      blockedBuiltIn('eval'),
      blockedBuiltIn('AsyncFunction'),
      blockedBuiltIn('Function'),
      __dirname,
      __dirname,
      userProcess,
      execGlobalContext,
      ...execGlobalContextValues
    );
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
