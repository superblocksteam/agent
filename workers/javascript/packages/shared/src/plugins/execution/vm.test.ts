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
  });
});
