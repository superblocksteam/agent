import { describe, expect, it, test } from '@jest/globals';
import { ExecutionContext, KVStore } from '@superblocks/shared';
import { MockKVStore } from '../../store/mock';
import { executeCode } from './bootstrap';
import { ExecutionOutput } from './executionOutput';
import { VariableType } from './variable';

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
      const inheritedEnv: Array<string> = ['AWS_DEFAULT_REGION', 'AWS_TOKEN_FILE', 'AWS_REGION'];

      const existingEnv = process.env;
      process.env = {
        AWS_DEFAULT_REGION: 'us-east-1',
        AWS_WEB_IDENTITY_TOKEN_FILE: '/tmp/token',
        AWS_REGION: 'us-east-1'
      };

      const expectedOutput = ['AWS_DEFAULT_REGION', 'AWS_REGION', '/tmp/test_data/TestFunc', 'test'];

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      process.env = existingEnv;

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
      const inheritedEnv: Array<string> = [];

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
            path: '/tmp/00000000-0000-0000-0000-00000000000a',
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
            path: '/tmp/00000000-0000-0000-0000-000000000002',
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

        validateFilePickerObject(SampleFiles, 2, ['SuperBlocks Image.png', undefined]);
        validateFilePickerObject(ExtraFiles, 1, ['SuperBlocks Image (2).png']);

        return localVariables === undefined;
            `;
      const filePaths: Record<string, string> = {
        'SampleFiles.files.0': '/tmp/00000000-0000-0000-0000-00000000000a',
        'SampleFiles.files.1': '/tmp/00000000-0000-0000-0000-000000000001',
        'ExtraFiles.files.0': '/tmp/00000000-0000-0000-0000-000000000002'
      };
      const inheritedEnv: Array<string> = [];

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
      const inheritedEnv: Array<string> = [];

      const expectedErr = `Error on line 79:
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
                    ^^^^^^^^^^^^^^^^^^^^
SyntaxError: missing ) after argument list`;

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
      const inheritedEnv: Array<string> = [];

      const expectedErr = `Error on line 6:
ReferenceError: userName is not defined`;

      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);
    });
  });

  describe('system modules', () => {
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
      const inheritedEnv: Array<string> = [];

      const expectedErr = `Error on line -36:
Error: Cannot find module 'child_process'`;

      let code = `var childProc = require('child_process');
        console.log(childProc.execSync('env').toString());
            `;
      const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(result).toBeDefined();
      expect(result.output).toEqual({});
      expect(result.error).toEqual(expectedErr);

      const expectedErrNode = `Error on line -36:
Error: Cannot find module 'node:child_process'`;

      code = `var childProc = require('node:child_process');
        console.log(childProc.execSync('env').toString());
            `;
      const resultNode: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

      expect(resultNode).toBeDefined();
      expect(resultNode.output).toEqual({});
      expect(resultNode.error).toEqual(expectedErrNode);
    });
  });

  describe('Imports of process should return santized process object', () => {
    const testCases: Array<[string, string[] | null | undefined, Record<string, string>, string[]]> = [
      ['populated', ['VAR_1', 'VAR_2', 'VAR_3'], { VAR_1: 'val1', VAR_3: 'val3', OTHER_VAR: 'otherValue' }, ['VAR_1', 'VAR_3']],
      ['empty', [], { VAR_1: 'val1', VAR_3: 'val3', OTHER_VAR: 'otherValue' }, []],
      ['null', null, { VAR_1: 'val1', VAR_3: 'val3', OTHER_VAR: 'otherValue' }, []],
      ['undefined', undefined, { VAR_1: 'val1', VAR_3: 'val3', OTHER_VAR: 'otherValue' }, []]
    ];

    for (const [testName, inheritedEnv, testEnv, expectedOutput] of testCases) {
      test(`Process env for ${testName} inherited env`, async () => {
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

        const codeProcess = `var nodeProcess = require('process');
          return Object.keys(nodeProcess.env);
              `;

        const existingEnv = process.env;
        process.env = testEnv;

        const resultProcess: ExecutionOutput = await executeCode({ context, code: codeProcess, filePaths, inheritedEnv });

        expect(resultProcess).toBeDefined();
        expect(resultProcess.error).not.toBeDefined();
        expect(resultProcess.output).toEqual(expectedOutput);

        const codeNodeProcess = `var nodeProcess = require('node:process');
          return Object.keys(nodeProcess.env);
              `;
        const resultNodeProcess: ExecutionOutput = await executeCode({ context, code: codeNodeProcess, filePaths, inheritedEnv });

        process.env = existingEnv;

        expect(resultNodeProcess).toBeDefined();
        expect(resultNodeProcess.output).toEqual(expectedOutput);
        expect(resultNodeProcess.error).not.toBeDefined();
      });
    }
  });

  describe('Restricted Process Methods', () => {
    const testCases: Array<[string, unknown[], unknown]> = [
      ['abort', [], undefined],
      ['disconnect', [], undefined],
      ['dlopen', ['process', `'node_modules/.bin'`], undefined],
      ['dlopen', ['process', `'node_modules/.bin'`, 0], undefined],
      ['emitWarning', [`'Failed to terminate process'`, `{ detail: 'pid 2156' }`], undefined],
      ['emitWarning', [`'Failed to terminate process'`, `'ERROR'`, `'256'`, null], undefined],
      ['exit', [0], undefined],
      ['getActiveResourcesInfo', [], []],
      ['kill', [2156], undefined],
      ['kill', [2156, `'SIGTERM'`], undefined],
      ['send?.', [], undefined]
    ];

    for (const [restrictedMethod, args, expectedOutput] of testCases) {
      test(`${restrictedMethod} should return expected output for inputs`, async () => {
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

        const code = `return process.${restrictedMethod}(${args.join(', ')});`;
        const filePaths: Record<string, string> = {};
        const inheritedEnv: Array<string> = [];

        const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

        expect(result).toBeDefined();
        expect(result.output).toEqual(expectedOutput);
        expect(result.error).not.toBeDefined();
      });
    }
  });

  describe('Restricted Process Methods Throw Errors', () => {
    const testCases: Array<[string, unknown[], unknown]> = [
      ['channel.ref', [], "Error on line 1:\nTypeError: Cannot read properties of undefined (reading 'ref')"],
      ['channel.unref', [], "Error on line 1:\nTypeError: Cannot read properties of undefined (reading 'unref')"],
      ['chdir', [`'/root'`], 'Error on line 103:\nError: Unable to change directory in a sandboxed environment']
    ];

    for (const [restrictedMethod, args, expectedErr] of testCases) {
      test(`${restrictedMethod} should throw error when invoked`, async () => {
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

        const code = `return process.${restrictedMethod}(${args.join(', ')});`;
        const filePaths: Record<string, string> = {};
        const inheritedEnv: Array<string> = [];

        const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

        expect(result).toBeDefined();
        expect(result.output).toEqual({});
        expect(result.error).toEqual(expectedErr);
      });
    }
  });

  describe('Restricted Process Properties', () => {
    const testCases: Array<[string, unknown]> = [
      ['allowedNodeEnvironmentFlags', new Set()],
      ['channel', undefined],
      ['config', {}],
      ['connected', false],
      [
        'env',
        {
          AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
          AWS_ROLE_ARN: process.env.AWS_ROLE_ARN,
          AWS_WEB_IDENTITY_TOKEN_FILE: process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
          AWS_REGION: process.env.AWS_REGION
        }
      ],
      ['ppid', process.pid],
      ['send', undefined]
    ];

    for (const [restrictedProperty, expected] of testCases) {
      test(`${restrictedProperty} should return expected value`, async () => {
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
        const inheritedEnv: Array<string> = [];

        const result: ExecutionOutput = await executeCode({ context, code, filePaths, inheritedEnv });

        expect(result).toBeDefined();
        expect(result.output).toEqual(expected);
        expect(result.error).not.toBeDefined();
      });
    }
  });
});
