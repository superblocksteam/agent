import { describe, expect, it } from '@jest/globals';
import { NodeVM } from 'vm2';
import { ExecutionContext } from '../../types';
import { nodeVMWithContext } from './vm';

describe('vm', () => {
  describe('nodeVMWithContext', () => {
    describe('importing modules via require', () => {
      const forbiddenBuiltinModules = ['process', 'child_process', 'os', 'fs', 'http'];
      // We are not explicitly allowing any external modules in the instanciation of the sandbox below,
      // so importing any external module should fail.
      const forbiddenExternalModules = ['lodash'];
      const modulesToTest = [
        ...forbiddenBuiltinModules,
        ...forbiddenBuiltinModules.map((moduleName) => `node:${moduleName}`),
        ...forbiddenExternalModules,
      ];

      modulesToTest.forEach((moduleName) => {
        it(`should fail when attempting to import ${moduleName}`, async () => {
          const context: ExecutionContext = new ExecutionContext();
          const code = `require('${moduleName}')`;
          const filePaths: Record<string, string> = {};
          const sandbox: NodeVM = nodeVMWithContext(context, filePaths, undefined, []);
          const executeCode = () => {
            sandbox.run(code, __dirname);
          };
          expect(executeCode).toThrowError(`Cannot find module '${moduleName}'`);
        });
      });
    });

    it('importing of allowed modules via require', async () => {
      const context: ExecutionContext = new ExecutionContext();
      const moduleName = 'lodash';
      const code = `require('${moduleName}')`;
      const filePaths: Record<string, string> = {};
      const sandbox: NodeVM = nodeVMWithContext(context, filePaths, undefined, [moduleName]);
      const executeCode = () => {
        sandbox.run(code, __dirname);
      };
      expect(executeCode).not.toThrow();
    });

    describe('importing modules via dynamic import', () => {
      const moduleName = 'lodash';

      it(`dynamic imports should fail`, async () => {
        // Even though we are explicitly allowing the module in the sandbox,
        // dynamic imports should still fail.
        const context: ExecutionContext = new ExecutionContext();
        const code = `import('${moduleName}')`;
        const filePaths: Record<string, string> = {};
        const sandbox: NodeVM = nodeVMWithContext(context, filePaths, undefined, [moduleName]);
        const executeCode = () => {
          sandbox.run(code, __dirname);
        };
        expect(executeCode).toThrowError("Dynamic Import not supported");
      });

      it(`obfuscated dynamic imports should fail`, async () => {
        const context: ExecutionContext = new ExecutionContext();
        const code = `
          const obfuscatedImportCode = "im" + "port" + "('" + ${JSON.stringify(moduleName)} + "')";
          // recover the Function constructor in case it has been overridden by the sandbox
          const Function = (() => {}).constructor;
          new Function('return ' + obfuscatedImportCode)();
        `;
        const filePaths: Record<string, string> = {};
        const sandbox: NodeVM = nodeVMWithContext(context, filePaths, undefined, [moduleName]);
        const executeCode = () => {
          sandbox.run(code, __dirname);
        };
        expect(executeCode).toThrowError("Dynamic Import not supported");
      });
    });
  });
});
