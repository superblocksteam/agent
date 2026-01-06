import { describe, expect, it } from '@jest/globals';
import { ExecutionContext, ExecutionOutput, KVStore, VariableType } from '@superblocks/shared';

import { executeCode } from './bootstrap';
import { MockKVStore } from './kvStoreMock';

describe('bootstrap', () => {
  describe('executeCode', () => {
    it('should execute javascript and return result', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;

      const code = `var path = require('path');
        var _ = require('lodash');

        console.log("Starting script...");
        const env = Object.keys(process.env);

        if (__dirname.length > 0) {
          env.push(path.join('/tmp', 'test_data', name));
        }

        const result = env.filter((item) => !_.isError(item));

        return [...result, 'test'];
            `;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = ['AWS_DEFAULT_REGION', 'AWS_TOKEN_FILE', 'AWS_REGION'];

      const existingEnv = process.env;
      process.env = {
        AWS_DEFAULT_REGION: 'us-east-1',
        AWS_WEB_IDENTITY_TOKEN_FILE: '/tmp/token',
        AWS_REGION: 'us-east-1'
      };

      const expectedOutput = ['AWS_DEFAULT_REGION', 'AWS_REGION', '/tmp/test_data/TestFunc', 'test'];

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      process.env = existingEnv;

      console.log(JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.log.length).toEqual(1);
      expect(result.output).toEqual(expectedOutput);
      expect(result.error).not.toBeDefined();
    });

    it('supports implicit global variables', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;

      const code = `var path = require('path');
        var _ = require('lodash');

        globalResult = path.join('/tmp', 'test_data', name);
        return _.trim(globalResult);
            `;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      const expectedOutput = '/tmp/test_data/TestFunc';

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual(expectedOutput);
      expect(result.error).not.toBeDefined();
    });

    it('updates file picker objects with readContents methods', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('SampleFiles', {
        files: [
          {
            $superblocksId: 'sb-id-001',
            encoding: 'text',
            extension: 'png',
            name: 'SuperBlocks Image.png',
            previewUrl: 'blob:https://website.hook/preview/00000000-0000-0000-0000-00000000000a',
            size: 256,
            type: 'image/png'
          }
        ]
      });
      await mockStore.write('ExtraFiles', {
        files: [
          {
            $superblocksId: 'sb-id-003',
            encoding: 'text',
            extension: 'png',
            name: 'SuperBlocks Image (2).png',
            previewUrl: 'blob:https://website.hook/preview/00000000-0000-0000-0000-000000000002',
            size: 512,
            type: 'image/png'
          }
        ]
      });

      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        SampleFiles: {
          key: 'SampleFiles',
          type: VariableType.Native,
          mode: 'read'
        },
        ExtraFiles: {
          key: 'ExtraFiles',
          type: VariableType.Native,
          mode: 'read'
        }
      };

      context.kvStore = mockStore as unknown as KVStore;

      const code = `function validateFilePickerObject(obj, numFiles, expectedNames) {
          if (obj.files.length != numFiles) {
            throw new Error(\`Incorrect number of items in file picker object: expected=\${numFiles}, actual=\${obj.files.length}\`);
          }

          for (let i = 0; i < numFiles; i++) {
            const file = obj.files[i];
            if (file.readContents === undefined || typeof file.readContents !== 'function') {
              throw new Error("Failed to add 'readContents' method to file picker object");
            }

            if (file.readContentsAsync === undefined || typeof file.readContentsAsync !== 'function') {
              throw new Error("Failed to add 'readContentsAsync' method to file picker object");
            }

            if (file.$superblocksId !== undefined || file.previewUrl !== undefined) {
              throw new Error('Failed to clear Superblocks ID and preview URL from file picker object');
            }

            if (file.name !== expectedNames[i]) {
              throw new Error("Failed to maintain existing property from original object ('name')");
            }
          }
        }

        // SampleFiles has 1 file, ExtraFiles has 1 file
        validateFilePickerObject(SampleFiles, 1, ['SuperBlocks Image.png']);
        validateFilePickerObject(ExtraFiles, 1, ['SuperBlocks Image (2).png']);

        return true;
            `;
      // Pre-computed map of treePath -> remotePath (computed by task-manager in production)
      const filePaths: Record<string, string> = {
        'SampleFiles.files.0': '/tmp/00000000-0000-0000-0000-00000000000a',
        'ExtraFiles.files.0': '/tmp/00000000-0000-0000-0000-000000000002'
      };
      const inheritedEnv: string[] = [];

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual(true);
    });

    it('should throw error when variables are not set', async () => {
      const context: ExecutionContext = new ExecutionContext();
      context.variables = undefined;

      const code = `var path = require('path');
        var _ = require('lodash');

        console.log("Starting script...");
        const env = Object.keys(process.env);

        if (__dirname.length > 0) {
          env.push(path.join('/tmp', 'test_data', name));
        }

        const result = env.filter((item) => !_.isError(item));

        return [...result, 'test'];
            `;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      const expectedErr = `Error on line 133:
Error: variables not defined`;

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.log.length).toEqual(0);
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);
    });

    it('should throw syntax error', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;

      const code = `var path = require('path');
        var _ = require('lodash');

        console.log("Starting script...";
        const env = Object.keys(process.env);

        if (__dirname.length > 0) {
          env.push(path.join('/tmp', 'test_data', name));
        }

        const result = env.filter((item) => !_.isError(item));

        return [...result, 'test'];
            `;
      const filePaths: Record<string, string> = {};

      const expectedErr = `Error on line 4:
        console.log("Starting script...";
                                        ^
SyntaxError: Unexpected token ';'`;

      const result: ExecutionOutput = await executeCode({ context, code, filePaths });

      expect(result).toBeDefined();
      expect(result.log.length).toEqual(0);
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);
    });

    it('should throw runtime error', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;

      const code = `var path = require('path');
        var _ = require('lodash');

        const env = Object.keys(process.env);
        if (__dirname.length > 0) {
          env.push(path.join('/tmp', 'test_data', userName));
        }

        const result = env.filter((item) => !_.isError(item));

        return [...result, 'test'];
            `;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      const expectedErr = `Error on line 6:
ReferenceError: userName is not defined`;

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);
    });

    it.only('should throw error when user code throws', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;

      const code = `throw 'string instead of error';`;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      const expectedErr = 'string instead of error';

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);
    });
  });

  describe('system modules', () => {
    it('imports of process throw an error', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      let code = `var nodeProcess = require('process');
        return Object.keys(nodeProcess.env);
            `;
      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toContain("Cannot find module 'process'");

      code = `console.log('hello'); var nodeProcess = require('node:process');
        console.log(nodeProcess.env);
        return Object.keys(nodeProcess.env);
            `;
      const resultNode: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(resultNode).toBeDefined();
      expect(resultNode.output).toEqual({});
      expect(resultNode.error).toContain("Cannot find module 'node:process'");
    });

    it('imports of child_process throw an error', async () => {
      const mockStore = new MockKVStore();
      await mockStore.write('name', 'TestFunc');
      const context: ExecutionContext = new ExecutionContext();
      context.variables = {
        name: {
          key: 'name',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore as unknown as KVStore;
      const filePaths: Record<string, string> = {};
      const inheritedEnv: string[] = [];

      let code = `var childProc = require('child_process');
        console.log(childProc.execSync('env').toString());
            `;
      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toContain("Cannot find module 'child_process'");

      code = `var childProc = require('node:child_process');
        console.log(childProc.execSync('env').toString());
            `;
      const resultNode: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(resultNode).toBeDefined();
      expect(resultNode.output).toEqual({});
      expect(resultNode.error).toContain("Cannot find module 'node:child_process'");
    });
  });

  describe('indirect imports should throw errors', () => {
    const moduleName = 'child_process';

    const testCases: Array<[string, string, RegExp]> = [
      ['require through module', `module.require('${moduleName}')`, /^Error on line -?\d+:\s+VMError: Cannot find module '\w+'$/],
      [
        'require through module.parent',
        `module.parent.require('${moduleName}')`,
        /^Error on line -?\d+:\s+TypeError: Cannot read properties of undefined \(reading 'require'\)$/
      ],
      ['dynamic import', `await import('${moduleName}')`, /^Error on line -?\d+:\s+VMError: Dynamic Import not supported$/],
      [
        'dynamic import through eval',
        `await eval("(async () => { return await import('${moduleName}') })()")`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'dynamic import through indirect eval',
        `await ('', eval)("(async () => { return await import('${moduleName}') })()")`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'require through Function.constructor',
        `Function.constructor("return require('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'dynamic import through Function.constructor',
        `await Function.constructor("return import('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'require through anonymous function constructor',
        `(() => {}).constructor("return require('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'dynamic import through anonymous function constructor',
        `await (() => {}).constructor("return import('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'require through AsyncFunction.constructor',
        `await AsyncFunction.constructor("return require('${moduleName}')")()`,
        /^Error on line -?\d+:\s+ReferenceError: AsyncFunction is not defined$/
      ],
      [
        'dynamic import through AsyncFunction.constructor',
        `await AsyncFunction.constructor("return import('${moduleName}')")()`,
        /^Error on line -?\d+:\s+ReferenceError: AsyncFunction is not defined$/
      ],
      [
        'require through anonymous async function constructor',
        `await (async () => {}).constructor("return require('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ],
      [
        'dynamic import through anonymous async function constructor',
        `await (async () => {}).constructor("return import('${moduleName}')")()`,
        /^Error on line \d+:\s+EvalError: Code generation from strings disallowed for this context$/
      ]
    ];
    for (const [name, importExpr, expectedErr] of testCases) {
      it(`should throw error when importing ${name}`, async () => {
        const mockStore = new MockKVStore();
        await mockStore.write('name', 'TestFunc');
        const context: ExecutionContext = new ExecutionContext();
        context.variables = {
          name: {
            key: 'name',
            type: VariableType.Native,
            mode: 'read'
          }
        };
        context.kvStore = mockStore as unknown as KVStore;
        const filePaths: Record<string, string> = {};
        const inheritedEnv: string[] = [];

        const code = `const childProc = ${importExpr};
        console.log(childProc.execSync('echo $HOME').toString());
            `;
        const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

        expect(result).toBeDefined();
        expect(result.output).toEqual({});
        expect(result.error).toMatch(expectedErr);
      });
    }
  });

  describe('Restricted Process Properties', () => {
    const testCases: string[] = [
      'abort',
      'allowedNodeEnvironmentFlags',
      'binding',
      'channel',
      'chdir',
      'config',
      'connected',
      'disconnect',
      'dlopen',
      'dlopen',
      'emitWarning',
      'exit',
      'kill',
      'mainModule',
      'ppid',
      'send'
    ];
    for (const restrictedProperty of testCases) {
      it(`${restrictedProperty} should be undefined`, async () => {
        const mockStore = new MockKVStore();
        await mockStore.write('name', 'TestFunc');
        const context: ExecutionContext = new ExecutionContext();
        context.variables = {
          name: {
            key: 'name',
            type: VariableType.Native,
            mode: 'read'
          }
        };
        context.kvStore = mockStore as unknown as KVStore;

        const code = `return process.${restrictedProperty};`;
        const filePaths: Record<string, string> = {};
        const inheritedEnv: string[] = [];

        const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

        expect(result).toBeDefined();
        expect(result.output).not.toBeDefined();
        expect(result.error).not.toBeDefined();
      });
    }
  });
});
