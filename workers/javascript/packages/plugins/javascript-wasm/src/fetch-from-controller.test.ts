import * as http from 'node:http';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import JavascriptWasmPlugin from './index';

/**
 * Tests for the orchestrator file fetching path (mode without sandbox file fetching).
 * This path is used when useSandboxFileFetcher is false/undefined, and files are fetched
 * via HTTP from the orchestrator's file server using $fileServerUrl and $agentKey.
 */

// MockKVStore for the plugin (required but not used for file fetching in controller mode)
class MockKVStore {
  private _store: { [key: string]: unknown } = {};

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    return { data: keys.map((k) => this._store[k]) };
  }

  public async write(key: string, value: unknown): Promise<void> {
    this._store[key] = value;
  }

  public async writeMany(payload: { key: string; value: unknown }[]): Promise<void> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
  }

  public async delete(keys: string[]): Promise<void> {
    for (const key of keys) {
      delete this._store[key];
    }
  }

  public async close(): Promise<void> {
    // noop
  }
}

describe('fetchFromController (controller file fetching path)', () => {
  let plugin: JavascriptWasmPlugin;
  let server: http.Server;
  let serverPort: number;
  let fileStore: { [location: string]: Buffer };

  beforeAll(async () => {
    plugin = new JavascriptWasmPlugin();
    await plugin.init();

    // Create a simple HTTP server that simulates the controller file server
    fileStore = {};

    server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost`);
      const location = url.searchParams.get('location');
      const agentKey = req.headers['x-superblocks-agent-key'];

      // Validate agent key
      if (agentKey !== 'test-agent-key') {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      // Return file if found
      if (location && fileStore[location]) {
        res.writeHead(200);
        res.end(fileStore[location]);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Start server on random available port
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await plugin.shutdown();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    // Clear file store before each test
    fileStore = {};
  });

  it('should fetch text file via controller and use readContents()', async () => {
    const diskPath = '/tmp/uploads/test-file.txt';
    const fileContent = 'Hello from controller!';
    fileStore[diskPath] = Buffer.from(fileContent);

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'test-agent-key',
          FilePicker1: {
            files: [
              {
                name: 'test-file.txt',
                $superblocksId: diskPath
              }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: `
        const file = FilePicker1.files[0];
        return file.readContents('text');
      `,
      files: [
        {
          // originalname must match $superblocksId for getTreePathToDiskPath to find the file
          originalname: diskPath,
          path: diskPath
        }
      ],
      executionTimeout: 10000
      // Note: useSandboxFileFetcher is not set, so controller path is used
    });

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(fileContent);
  });

  it('should fetch binary file via controller and use readContents(raw)', async () => {
    const diskPath = '/tmp/uploads/binary-file.bin';
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
    fileStore[diskPath] = binaryContent;

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'test-agent-key',
          FilePicker1: {
            files: [
              {
                name: 'binary-file.bin',
                $superblocksId: diskPath
              }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      // Use 'raw' mode to get actual Buffer; 'binary' mode returns base64 string
      code: `
        const file = FilePicker1.files[0];
        const contents = file.readContents('raw');
        return {
          isBuffer: Buffer.isBuffer(contents),
          length: contents.length,
          bytes: Array.from(contents)
        };
      `,
      files: [
        {
          originalname: diskPath,
          path: diskPath
        }
      ],
      executionTimeout: 10000
    });

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({
      isBuffer: true,
      length: 6,
      bytes: [0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]
    });
  });

  it('should fetch file via controller using async readContentsAsync()', async () => {
    const diskPath = '/tmp/uploads/async-file.txt';
    const fileContent = 'Async content from controller';
    fileStore[diskPath] = Buffer.from(fileContent);

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'test-agent-key',
          FilePicker1: {
            files: [
              {
                name: 'async-file.txt',
                $superblocksId: diskPath
              }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: `
        const file = FilePicker1.files[0];
        const contents = await file.readContentsAsync('text');
        return contents;
      `,
      files: [
        {
          originalname: diskPath,
          path: diskPath
        }
      ],
      executionTimeout: 10000
    });

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(fileContent);
  });

  it('should handle file server error (non-200 response)', async () => {
    const diskPath = '/tmp/uploads/nonexistent.txt';
    // Don't add file to fileStore, so server returns 404

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'test-agent-key',
          FilePicker1: {
            files: [
              {
                name: 'nonexistent.txt',
                $superblocksId: diskPath
              }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: `
        const file = FilePicker1.files[0];
        return file.readContents('text');
      `,
      files: [
        {
          originalname: diskPath,
          path: diskPath
        }
      ],
      executionTimeout: 10000
    });

    expect(result.error).toBeDefined();
    expect(result.error).toContain('Internal Server Error');
  });

  it('should handle invalid agent key', async () => {
    const diskPath = '/tmp/uploads/test.txt';
    fileStore[diskPath] = Buffer.from('content');

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'wrong-key', // Wrong agent key
          FilePicker1: {
            files: [
              {
                name: 'test.txt',
                $superblocksId: diskPath
              }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: `
        const file = FilePicker1.files[0];
        return file.readContents('text');
      `,
      files: [
        {
          originalname: diskPath,
          path: diskPath
        }
      ],
      executionTimeout: 10000
    });

    expect(result.error).toBeDefined();
    expect(result.error).toContain('Internal Server Error');
  });

  it('should fetch multiple files via controller', async () => {
    const diskPath1 = '/tmp/uploads/file1.txt';
    const diskPath2 = '/tmp/uploads/file2.txt';
    fileStore[diskPath1] = Buffer.from('Content of file 1');
    fileStore[diskPath2] = Buffer.from('Content of file 2');

    const store = new MockKVStore();
    const fileServerUrl = `http://127.0.0.1:${serverPort}/files`;

    const result = await plugin.executeInWorker({
      context: {
        globals: {
          $fileServerUrl: fileServerUrl,
          $agentKey: 'test-agent-key',
          FilePicker1: {
            files: [
              { name: 'file1.txt', $superblocksId: diskPath1 },
              { name: 'file2.txt', $superblocksId: diskPath2 }
            ]
          }
        },
        variables: {},
        kvStore: store
      } as unknown as ExecutionContext,
      code: `
        const file1Content = FilePicker1.files[0].readContents('text');
        const file2Content = FilePicker1.files[1].readContents('text');
        return { file1: file1Content, file2: file2Content };
      `,
      files: [
        { originalname: diskPath1, path: diskPath1 },
        { originalname: diskPath2, path: diskPath2 }
      ],
      executionTimeout: 10000
    });

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({
      file1: 'Content of file 1',
      file2: 'Content of file 2'
    });
  });
});
