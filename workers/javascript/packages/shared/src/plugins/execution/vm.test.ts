import { describe, expect, it } from '@jest/globals';
import { NodeVM } from 'vm2';
import { ExecutionContext } from '../../types';
import { nodeVMWithContext } from './vm';

describe('vm', () => {
  describe('nodeVMWithContext', () => {
    it('should fail when attempting to import process', async () => {
      const context: ExecutionContext = new ExecutionContext();
      const code = `var proc = require('process');
        console.log(JSON.stringify(proc.env));
            `;
      const filePaths: Record<string, string> = {};
      const sandbox: NodeVM = nodeVMWithContext(context, filePaths);

      const executeCode = () => {
        sandbox.run(code, __dirname);
      };

      expect(executeCode).toThrowError("Cannot find module 'process'");
    });

    it('should fail when attempting to import child_process', async () => {
      const context: ExecutionContext = new ExecutionContext();
      const code = `var proc = require('child_process');
        console.log(proc.execSync('ls -la').toString());
            `;
      const filePaths: Record<string, string> = {};
      const sandbox: NodeVM = nodeVMWithContext(context, filePaths);

      const executeCode = () => {
        sandbox.run(code, __dirname);
      };

      expect(executeCode).toThrowError("Cannot find module 'child_process'");
    });

    it('should expose crypto as a global', async () => {
      const context: ExecutionContext = new ExecutionContext();
      const code = `module.exports = crypto.randomUUID();`;
      const filePaths: Record<string, string> = {};
      const sandbox: NodeVM = nodeVMWithContext(context, filePaths);

      const result = sandbox.run(code, __dirname);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should prefer user-defined crypto global over built-in crypto', async () => {
      const context: ExecutionContext = new ExecutionContext();
      context.globals = {
        crypto: {
          randomUUID: () => 'user-defined-uuid'
        }
      };
      const code = `module.exports = crypto.randomUUID();`;
      const filePaths: Record<string, string> = {};
      const sandbox: NodeVM = nodeVMWithContext(context, filePaths);

      const result = sandbox.run(code, __dirname);
      expect(result).toBe('user-defined-uuid');
    });
  });
});
