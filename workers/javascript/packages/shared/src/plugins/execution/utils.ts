import { spawn } from 'child_process';
import _, { get, isArray, isBuffer, isObject, isPlainObject, isString } from 'lodash';
import { render } from 'mustache';
import { IntegrationError } from '../../errors';
import {
  ActionConfiguration,
  ExecutionContext,
  ExecutionOutput,
  isReadableFile,
  KVStore,
  Property,
  ResolvedActionConfigurationProperty
} from '../../types';
import { RequestFile, RequestFiles } from '../files';
import { extractMustacheStrings, FlatContext } from './mustache';
import { ProcessInput } from './types';
import { buildVariables } from './variable';
import { nodeVMWithContext } from './vm';

const DATA_TAG = 'SUPERBLOCKSDATA';
const completeDataRegex = new RegExp(`^${DATA_TAG}(.*?)${DATA_TAG}$`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function spawnStdioProcess(cmd: string, args: string[], input: ProcessInput, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args);
    const ret = new ExecutionOutput();
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const timeoutWatcher = setTimeout(() => {
      try {
        process.kill();
        reject(new IntegrationError(`Timed out after ${timeout}ms`));
      } catch (e) {
        // Noop
      }
    }, timeout);

    process.stdout.on('data', function (data: Buffer) {
      stdoutChunks.push(Buffer.from(data));
    });

    process.stderr.on('data', function (data: Buffer) {
      stderrChunks.push(data);
    });

    process.on('error', (err: Error) => {
      reject(err);
      process.kill();
    });

    process.on('close', (code) => {
      try {
        const lines = Buffer.concat(stdoutChunks).toString('utf-8').split('\n');
        const errLines = Buffer.concat(stderrChunks).toString('utf-8').split('\n');

        for (const line of lines) {
          const matches = completeDataRegex.exec(line);
          if (matches?.[1]) {
            ret.output = JSON.parse(matches[1]);
          } else {
            ret.logInfo(line);
          }
        }
        for (const line of errLines) {
          ret.logError(line);
        }
      } catch (err) {
        ret.output = {};
        ret.logError(err);
      }
      clearTimeout(timeoutWatcher);
      resolve(ret);
    });

    try {
      // TODO Type this properly
      const inputJson = JSON.stringify({
        meta: { dataTag: DATA_TAG },
        ...input
      });
      process.stdin.write(inputJson);
      process.stdin.end();
    } catch (err) {
      process.kill();
      reject(err);
    }
  });
}

export const resolveAllBindings = async (
  unresolvedValue: string,
  context: ExecutionContext,
  filePaths: Record<string, string>,
  escapeStrings: boolean
): Promise<Record<string, unknown>> => {
  // TODO: pass in the timeout from the caller side
  // const vm = nodeVMWithContext(context, filePaths, Number(envs.get('SUPERBLOCKS_AGENT_EXECUTION_JS_TIMEOUT_MS')));
  const vm = nodeVMWithContext(context, filePaths, 500 * 1000);
  if (context.variables && typeof context.variables === 'object') {
    const toRead: Array<[string, string]> = [];
    for (const [variableName, variableProperty] of Object.entries(context.variables)) {
      if (!isObject(variableProperty)) {
        throw new Error(`Failed to build the variable: ${variableName}`);
      }

      // Currently we only support native variables in bindings
      // @ts-ignore
      const { key } = variableProperty;
      toRead.push([variableName, key]);
    }

    const results = await context.kvStore?.read(toRead.map((t) => t[1]));

    if (results === undefined) {
      throw new IntegrationError('Failed to read variables in bindings.');
    }
    for (let i = 0; i < toRead.length; i++) {
      vm.setGlobal(toRead[i][0], results.data[i]);
    }
  }

  // TODO: remove when we fully evaluate bindings on orchestrator
  let variableClient: VariableClient;
  if (context.variables && typeof context.variables === 'object') {
    variableClient = new VariableClient(context.kvStore as KVStore);
    const builtVariables = await buildVariables(context.variables, variableClient);
    for (const [k, v] of Object.entries(builtVariables)) {
      vm.setGlobal(k, v);
    }
  }

  const ret = {};
  for (const toEval of extractMustacheStrings(unresolvedValue)) {
    // TODO may need to create a new VM each time to not pollute scope
    try {
      const val = await vm.run(
        `
module.exports = async function() {
  ${generateJSLibrariesImportString()}

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
    // Leaving $superblocksId set because it's required by our S3.
    _.set(global, treePath, {
      ...file,
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

  return ${toEval};
}()`,
        __dirname
      );
      if (isBuffer(val)) {
        ret[toEval] = val;
        continue;
      } else if (val && val.type === 'Buffer') {
        ret[toEval] = Buffer.from(val);
        continue;
      } else if (isObject(val)) {
        ret[toEval] = JSON.stringify(val);
        continue;
      }
      try {
        if (isObject(JSON.parse(val))) {
          ret[toEval] = val;
          continue;
        }
      } catch (_) {
        // let it fallthrough
      }
      if (isString(val) && escapeStrings) {
        // escape strings and remove extra quotes added by stringify
        ret[toEval] = JSON.stringify(val).slice(1, -1);
        continue;
      }
      ret[toEval] = val;
    } catch (err) {
      throw new Error(`error evaluating '${toEval}': ${err.message}`);
    }
  }

  // @ts-ignore
  if (variableClient !== undefined) {
    await variableClient.flush();
  }
  return ret;
};

export const resolveActionConfiguration = async (
  context: ExecutionContext,
  actionConfiguration: ActionConfiguration,
  files: RequestFiles,
  property: string,
  escapeStrings: boolean
): Promise<ResolvedActionConfigurationProperty> => {
  let toResolve = _.get(actionConfiguration, property);
  const filePaths = getTreePathToDiskPath(context.globals, files as Array<RequestFile>);
  // TODO(saksham): Clean this up alongside ActionConfiguration refactor
  if (isPlainObject(toResolve)) {
    toResolve = Object.entries(toResolve ?? {}).map(([key, property]: [string, Property]) => ({
      key: property.key ?? key,
      value: property.value
    }));
  }
  if (isArray(toResolve)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedProperties: any[] = [];
    for (const property of toResolve) {
      const resolvedPropery = { ...property };

      const propertyKeyResolution = await resolveAllBindings(property.key, context, filePaths, escapeStrings);
      let resolvedPropertyKey = '';
      if (property.key) {
        resolvedPropertyKey = render(property.key, new FlatContext(propertyKeyResolution));
      }
      resolvedPropery.key = resolvedPropertyKey;

      const resolvedValueResolution = await resolveAllBindings(property.value, context, filePaths, escapeStrings);
      let resolvedPropertyValue;
      if (property.value) {
        const bufferBindingResolution = resolveBuffer(resolvedValueResolution);
        if (bufferBindingResolution !== undefined) {
          resolvedPropertyValue = bufferBindingResolution;
        } else {
          resolvedPropertyValue = render(property.value, new FlatContext(resolvedValueResolution));
        }
      }
      resolvedPropery.value = resolvedPropertyValue;

      // filename for a file field in a multipart/form-data body
      if (property.file?.filename) {
        const resolvedValueResolution = await resolveAllBindings(property.file.filename, context, filePaths, escapeStrings);
        resolvedPropery.file = {
          filename: render(property.file.filename, new FlatContext(resolvedValueResolution))
        };
      }

      resolvedProperties.push(resolvedPropery);
    }
    return { resolved: resolvedProperties };
  }
  if (typeof toResolve === 'number') {
    toResolve = toResolve.toString();
  }
  const bindingResolution: Record<string, unknown> = await resolveAllBindings(toResolve, context, filePaths, escapeStrings);

  const bufferBindingResolution = resolveBuffer(bindingResolution);
  if (bufferBindingResolution !== undefined) {
    return {
      resolved: bufferBindingResolution
    };
  }

  return {
    resolved: render(toResolve, new FlatContext(bindingResolution))
  };
};

// Bypass render if the binding resolves to a Buffer
export const resolveBuffer = (bindingResolution: Record<string, unknown>): Buffer | undefined => {
  if (Object.values(bindingResolution).length === 1) {
    for (const key of Object.keys(bindingResolution)) {
      // @ts-ignore
      if (isBuffer(bindingResolution[key]) || bindingResolution[key]?.type === 'Buffer') {
        return bindingResolution[key] as Buffer;
      }
    }
  }
  return;
};

export const resolveConfigurationRecursive = async (
  context: ExecutionContext,
  files: RequestFiles,
  obj: Record<string, unknown>
): Promise<void> => {
  try {
    // TODO: Factor out of recursive calls.
    const filePaths = getTreePathToDiskPath(context.globals, files as Array<RequestFile>);

    for (const property in obj) {
      if (!_.get(obj, property, undefined)) {
        // TODO: Should never happen.
        continue;
      }

      if (typeof obj[property] === 'object') {
        await resolveConfigurationRecursive(context, files, obj[property] as Record<string, unknown>);
      } else if (typeof obj[property] === 'string') {
        const bindingResolution = await resolveAllBindings(obj[property] as string, context, filePaths, false);
        obj[property] = render(obj[property] as string, new FlatContext(bindingResolution));
      }
    }
  } catch (err) {
    throw new IntegrationError(err.message);
  }
};

export function getTreePathToDiskPath(tree: Record<string, unknown>, files: Array<RequestFile>): Record<string, string> {
  const filePaths = getFilePaths(tree);
  const fileDiskPaths = filePaths.map((path) => {
    const { $superblocksId } = get(tree, path);
    const match = (files as Array<RequestFile>)?.find((f) => {
      return f.originalname === $superblocksId;
    });
    return match?.path;
  });
  return Object.fromEntries(filePaths.map((p, i) => [p.join('.'), fileDiskPaths[i]]));
}

export function getFilePaths(root: unknown, path: string[] = []): string[][] {
  const paths: string[][] = [];
  if (!root || !(typeof root === 'object')) {
    return paths;
  }
  if (Array.isArray(root)) {
    root.forEach((v, i) => {
      paths.push(...getFilePaths(v, [...path, i.toString()]));
    });
    return paths;
  }
  if (isReadableFile(root)) {
    return [path];
  }
  Object.entries(root as Record<string, unknown>).forEach(([key, value]) => {
    if (isReadableFile(value)) {
      paths.push([...path, key]);
    } else if (value && Array.isArray(value)) {
      value.forEach((v, i) => {
        paths.push(...getFilePaths(v, [...path, key, i.toString()]));
      });
    } else if (value && typeof value === 'object') {
      paths.push(...getFilePaths(value, [...path, key]));
    }
  });
  return paths;
}

// this string is used to determine which libraries are imported in the VM implicitly
export function generateJSLibrariesImportString(): string {
  return `
    var _ = require('lodash');
    var moment = require('moment');
    var axios = require('axios');
    var fs = require('fs');
    var xmlbuilder2 = require('xmlbuilder2');
    var base64url = require('base64url');
    var deasync = require('deasync');
  `;
}

export const buildContextFromBindings = (bindingPathToValue: Record<string, unknown>): Array<[string, unknown]> => {
  const globalContext = {};
  for (const key in bindingPathToValue) {
    _.set(globalContext, key, bindingPathToValue[key]);
  }
  return Object.entries(globalContext).map((entry) => [entry[0], entry[1]]);
};

export class VariableClient {
  #kvStore: KVStore;
  #writableBuffer: { key: string; value: unknown }[] = [];

  constructor(kvStore: KVStore) {
    this.#kvStore = kvStore;
  }

  async read(keys: string[]): ReturnType<KVStore['read']> {
    return await this.#kvStore.read(keys);
  }

  async write(key: string, value: string): Promise<void> {
    await this.#kvStore.write(key, value);
  }

  writeBuffer(key: string, value: unknown): void {
    this.#writableBuffer.push({ key: key, value: value });
  }

  async flush(): Promise<void> {
    await this.#kvStore.writeMany(this.#writableBuffer);
  }
}
