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
const path = require('path');
const { NodeVM } = require('vm2');

const eventEmitter = new EventEmitter();

const INLINE_SOURCEMAP_REGEX = /\/\/# sourceMappingURL=data:application\/json;base64,(.+)/;
const BUNDLE_BEGIN_MARKER = '// --- begin bundle ---';
const BUNDLE_END_MARKER = '// --- end bundle ---';
const CODE_MODE_VM_FILENAME = 'code-mode-bundle';
const VIRTUAL_PATH_RE = /^.*\/virtual\/backend\//;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decodes a single VLQ value from a string, returns { value, rest }.
 * Based on source map spec: 6 bits per char, bit 0 = continuation, bit 1 = sign.
 */
function decodeVlq(str, pos) {
  let value = 0;
  let shift = 0;
  let digit;
  do {
    if (pos >= str.length) return { value: 0, pos };
    const idx = BASE64_CHARS.indexOf(str[pos]);
    if (idx === -1) return { value: 0, pos };
    pos += 1;
    digit = idx;
    value |= (digit & 31) << shift;
    shift += 5;
  } while (digit & 32);
  const signed = value & 1 ? -(value >>> 1) : value >>> 1;
  return { value: signed, pos };
}

/**
 * Parses source map mappings and returns an array of { line, col, source, sourceLine, sourceCol }.
 * Each line has segments; we keep the last segment per (line, col) for lookup.
 */
function parseMappings(mappingsStr, sources) {
  const mappings = [];
  let genLine = 1;
  let genCol = 0;
  let srcIdx = 0;
  let srcLine = 1;
  let srcCol = 0;

  let pos = 0;
  const lines = mappingsStr.split(';');

  for (let i = 0; i < lines.length; i++) {
    genCol = 0;
    const segments = lines[i].split(',');
    for (const seg of segments) {
      if (!seg) continue;
      const { value: dGenCol, pos: p1 } = decodeVlq(seg, 0);
      genCol += dGenCol;
      if (p1 >= seg.length) {
        mappings.push({ line: genLine, col: genCol, source: sources[srcIdx], sourceLine: srcLine, sourceCol: srcCol });
        continue;
      }
      const { value: dSrcIdx, pos: p2 } = decodeVlq(seg, p1);
      srcIdx += dSrcIdx;
      if (p2 >= seg.length) {
        mappings.push({ line: genLine, col: genCol, source: sources[srcIdx], sourceLine: srcLine, sourceCol: srcCol });
        continue;
      }
      const { value: dSrcLine, pos: p3 } = decodeVlq(seg, p2);
      srcLine += dSrcLine;
      if (p3 >= seg.length) {
        mappings.push({ line: genLine, col: genCol, source: sources[srcIdx], sourceLine: srcLine, sourceCol: srcCol });
        continue;
      }
      const { value: dSrcCol, pos: _p4 } = decodeVlq(seg, p3);
      srcCol += dSrcCol;
      mappings.push({ line: genLine, col: genCol, source: sources[srcIdx], sourceLine: srcLine, sourceCol: srcCol });
    }
    genLine += 1;
  }
  return mappings;
}

/**
 * Binary search for the last mapping with (line, col) <= the given position.
 * Mappings are already sorted by (line, col) from parseMappings.
 */
function lookupPosition(mappings, line, col) {
  let lo = 0;
  let hi = mappings.length - 1;
  let best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const m = mappings[mid];
    if (m.line < line || (m.line === line && m.col <= col)) {
      best = m;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/**
 * Extracts the inline source map from a bundle string (same logic as
 * getApplicationCode.ts). Returns null if no inline source map is found.
 */
function extractInlineSourceMap(bundle) {
  const match = bundle.match(INLINE_SOURCEMAP_REGEX);
  if (!match) return null;
  try {
    return Buffer.from(match[1], 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Builds a lookup function: (fullScriptLine, col) -> { source, line, col }.
 * The bundle's source map uses bundle-relative lines; we subtract bundleStartLine - 1
 * to convert full script line to bundle line.
 */
function buildSourceMapLookup(bundleSourceMapJson, bundleStartLine) {
  let map;
  try {
    map = JSON.parse(bundleSourceMapJson);
  } catch {
    return null;
  }
  const sources = map.sources ?? [];
  const mappings = parseMappings(map.mappings ?? '', sources);
  const lineOffset = bundleStartLine - 1;

  return (fullScriptLine, col) => {
    const bundleLine = fullScriptLine - lineOffset;
    if (bundleLine < 1) return null;
    const m = lookupPosition(mappings, bundleLine, col);
    return m ? { source: m.source, line: m.sourceLine, col: m.sourceCol } : null;
  };
}

/**
 * Rewrites a stack trace using the source map. Replaces "path:line:col" with
 * "source:originalLine:originalCol" for frames that match the virtual filename.
 */
function rewriteStackWithSourceMap(stack, virtualFilename, lookup) {
  if (!stack || !lookup) return stack;
  const basename = path.basename(virtualFilename);
  const re = /(\s+at\s+.*?)(\s+\()?([^\s(]+?):(\d+):(\d+)(\))?/g;

  return stack.replace(re, (match, prefix, openParen, file, lineStr, colStr, closeParen) => {
    if (file !== virtualFilename && path.basename(file) !== basename) return match;
    const line = parseInt(lineStr, 10);
    const col = Math.max(0, parseInt(colStr, 10) - 1);
    const orig = lookup(line, col);
    if (!orig) return match;
    const open = openParen ?? '';
    const close = closeParen ?? '';
    const displayPath = orig.source.replace(VIRTUAL_PATH_RE, '');
    return `${prefix}${open}${displayPath}:${orig.line}:${orig.col + 1}${close}`;
  });
}

/**
 * Extracts bundle and source map from codeToExecute, builds lookup, and returns
 * { lookup, bundleStartLine } or null. No global install - we rewrite stacks manually on catch.
 */
function prepareSourceMapLookup(codeToExecute) {
  const bundleBeginIdx = codeToExecute.indexOf(BUNDLE_BEGIN_MARKER);
  if (bundleBeginIdx === -1) return null;

  const bundleStartLine = codeToExecute.substring(0, bundleBeginIdx).split('\n').length + 1;
  const bundleEndIdx = codeToExecute.indexOf(BUNDLE_END_MARKER, bundleBeginIdx);
  if (bundleEndIdx === -1) return null;

  const bundle = codeToExecute.substring(
    bundleBeginIdx + BUNDLE_BEGIN_MARKER.length + 1,
    bundleEndIdx
  );
  const sourceMapJson = extractInlineSourceMap(bundle);
  if (!sourceMapJson) return null;

  const lookup = buildSourceMapLookup(sourceMapJson, bundleStartLine);
  if (!lookup) return null;

  return { lookup, bundleStartLine, virtualFilename: path.join(__dirname, CODE_MODE_VM_FILENAME) };
}

function cleanStack(stack, lineOffset, sourceMapApplied) {
  if (!stack) {
    return undefined;
  }

  const extractPathRegex = /\s+at.*[(\s](.*)\)?/;

  // When the source map has rewritten frames, extract the original source
  // position from the first .ts/.tsx frame and use it directly (the line
  // number already refers to the user's source, so no offset subtraction).
  if (sourceMapApplied) {
    const sourceMatch = stack.match(/([\w/.-]+\.tsx?):(\d+):\d+/);
    if (sourceMatch) {
      const sourcePath = sourceMatch[1];
      const sourceLine = parseInt(sourceMatch[2], 10);
      const errorLines = stack.replace(/\\/g, '/').split('\n');
      const errorStack = errorLines
        .filter((line) => {
          const pathMatches = line.match(extractPathRegex);
          return !pathMatches && !line.startsWith('/');
        })
        .filter((line) => line.trim() !== '')
        .join('\n');
      return `Error on line ${sourceLine} (${sourcePath}):\n${errorStack}`;
    }
  }

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
  const { context, code, filePaths, inheritedEnv, requireRoot } = workerData;

  // Add 3 lines for the newline, module export declaration and the function call to create file objects
  const codeLineNumberOffset = sharedCode.split('\n').length + 3;
  const ret = new ExecutionOutput();
  let variableClient;
  let hasSourceMap = false;
  let sourceMapCtx = null;

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
    const requireOpts = {
      builtin: ['*', '-child_process', '-process'],
      external: true
    };
    if (requireRoot && requireRoot.length > 0) {
      requireOpts.root = requireRoot;
      // customResolver: when VM2 cannot find a module via normal lookup (e.g. pnpm's
      // .pnpm layout), try resolving from requireRoot so @superblocksteam/sdk-api works.
      requireOpts.resolve = (moduleName, dirname) => {
        try {
          return require.resolve(moduleName, { paths: requireRoot });
        } catch {
          return undefined;
        }
      };
    }
    const vm = new NodeVM({
      argv: [],
      console: 'redirect',
      env: userProcessEnv,
      eval: false,
      require: requireOpts,
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

    const codeModeFilename = path.join(__dirname, CODE_MODE_VM_FILENAME);
    sourceMapCtx = prepareSourceMapLookup(codeToExecute);
    hasSourceMap = !!sourceMapCtx;
    const vmFilename = hasSourceMap ? codeModeFilename : __dirname;

    ret.output = await vm.run(codeToExecute, { filename: vmFilename });
    eventEmitter.removeAllListeners();

    if (variableClient) {
      await variableClient.flush();
    }
  } catch (err) {
    eventEmitter.removeAllListeners();

    const defaultErrMsg = err instanceof Error ? err.message : String(err);
    let stack = err instanceof Error ? err.stack : undefined;
    if (stack && sourceMapCtx) {
      stack = rewriteStackWithSourceMap(stack, sourceMapCtx.virtualFilename, sourceMapCtx.lookup);
    }
    ret.error = cleanStack(stack, codeLineNumberOffset, hasSourceMap) ?? defaultErrMsg;
  }

  return ret;
};
