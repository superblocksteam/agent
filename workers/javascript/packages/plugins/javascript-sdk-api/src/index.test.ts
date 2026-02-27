import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, ExecutionOutput } from '@superblocks/shared';

import JavascriptSdkApiPlugin from './index';

jest.mock('@superblocksteam/javascript/bootstrap', () => ({
  executeCode: jest.fn()
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

describe('JavascriptSdkApiPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes computed filePaths from globals and files', async () => {
    const output = new ExecutionOutput();
    output.output = { ok: true };
    (executeCode as jest.Mock).mockResolvedValue(output);

    const context = new ExecutionContext();
    context.globals = {
      SampleFiles: {
        files: [
          {
            $superblocksId: 'upload-1',
            encoding: 'text',
            extension: 'txt',
            name: 'demo.txt',
            size: 25,
            type: 'text/plain'
          }
        ]
      }
    };
    context.kvStore = {
      read: async () => ({ data: [] }),
      write: async () => undefined,
      writeMany: async () => undefined
    } as never;
    context.variables = {};

    const plugin = new JavascriptSdkApiPlugin();
    await plugin.execute({
      actionConfiguration: { body: 'return true;' } as never,
      context: context as never,
      files: [
        {
          originalname: 'upload-1',
          path: '/tmp/upload-1'
        }
      ] as never
    } as never);

    expect(executeCode).toHaveBeenCalledTimes(1);
    const call = (executeCode as jest.Mock).mock.calls[0][0];
    expect(call.filePaths).toEqual({
      'SampleFiles.files.0': '/tmp/upload-1'
    });
  });
});
