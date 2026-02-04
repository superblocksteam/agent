import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import JavascriptWasmPlugin from './index';
import { VariableType, VariableMode } from './constants';

export class MockKVStore {
  private _store: { [key: string]: unknown } = {};

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    const _matched: unknown[] = [];

    keys.forEach((item: string) => {
      _matched.push(this._store[item]);
    });

    return { data: _matched };
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

  public async close(reason: string | undefined): Promise<void> {
    // do nothing
  }
}

describe('JavaScript WASM Plugin E2E Tests', () => {
  let plugin: JavascriptWasmPlugin;

  beforeAll(async () => {
    plugin = new JavascriptWasmPlugin();
    await plugin.init();
  });

  afterAll(async () => {
    await plugin.shutdown();
  });

  describe('Basic execution', () => {
    it('should execute simple return statement', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return 123',
        executionTimeout: 10000
      });

      expect(result.output).toBe(123);
    });

    it('should execute code with arithmetic', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return 10 + 20 * 3',
        executionTimeout: 10000
      });

      expect(result.output).toBe(70);
    });

    it('should execute code with string operations', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return "hello" + " " + "world"',
        executionTimeout: 10000
      });

      expect(result.output).toBe('hello world');
    });

    it('should execute code with objects', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return { name: "test", value: 42 }',
        executionTimeout: 10000
      });

      expect(result.output).toEqual({ name: 'test', value: 42 });
    });

    it('should execute async code', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: `
          const delay = () => new Promise(resolve => resolve());
          await delay();
          return "async completed"
        `,
        executionTimeout: 10000
      });

      expect(result.output).toBe('async completed');
    });
  });

  describe('Context globals', () => {
    it('should access globals from context', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {
            myValue: 100,
            myString: 'hello'
          },
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return myValue + myString.length',
        executionTimeout: 10000
      });

      expect(result.output).toBe(105);
    });

    it('should access nested globals', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {
            user: {
              name: 'John',
              age: 30
            }
          },
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return `${user.name} is ${user.age} years old`',
        executionTimeout: 10000
      });

      expect(result.output).toBe('John is 30 years old');
    });
  });

  describe('Variables', () => {
    it('should execute with simple variables', async () => {
      const store = new MockKVStore();
      await store.write('key1', 10);
      await store.write('key2', 20);

      const variables = {
        simpleVar1: {
          key: 'key1',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        },
        simpleVar2: {
          key: 'key2',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        }
      };

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return simpleVar1.value + simpleVar2.value',
        executionTimeout: 10000
      });

      expect(result.output).toBe(30);
    });

    it('should execute with advanced variables', async () => {
      const store = new MockKVStore();
      await store.write('key3', 30);
      await store.write('key4', 40);

      const variables = {
        advancedVar1: {
          key: 'key3',
          type: VariableType.Advanced,
          mode: VariableMode.ReadWrite
        },
        advancedVar2: {
          key: 'key4',
          type: VariableType.Advanced,
          mode: VariableMode.ReadWrite
        }
      };

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return await advancedVar1.get() + await advancedVar2.get()',
        executionTimeout: 10000
      });

      expect(result.output).toBe(70);
    });

    it('should execute with native variables', async () => {
      const store = new MockKVStore();
      await store.write('key5', 50);

      const variables = {
        nativeVar1: {
          key: 'key5',
          type: VariableType.Native
        }
      };

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return nativeVar1',
        executionTimeout: 10000
      });

      expect(result.output).toBe(50);
    });

    it('should execute with mixed variable types', async () => {
      const store = new MockKVStore();
      await store.write('key1', 10);
      await store.write('key2', 20);
      await store.write('key3', 30);
      await store.write('key4', 40);
      await store.write('key5', 50);

      const variables = {
        simpleVar1: {
          key: 'key1',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        },
        simpleVar2: {
          key: 'key2',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        },
        advancedVar1: {
          key: 'key3',
          type: VariableType.Advanced,
          mode: VariableMode.ReadWrite
        },
        advancedVar2: {
          key: 'key4',
          type: VariableType.Advanced,
          mode: VariableMode.ReadWrite
        },
        nativeVar1: {
          key: 'key5',
          type: VariableType.Native
        }
      };

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return simpleVar1.value + simpleVar2.value + await advancedVar1.get() + await advancedVar2.get() + nativeVar1',
        executionTimeout: 10000
      });

      expect(result.output).toBe(150);
    });

    it('should persist simple variable writes', async () => {
      const store = new MockKVStore();
      await store.write('key1', 10);
      await store.write('key2', 20);

      const variables = {
        simpleVar1: {
          key: 'key1',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        },
        simpleVar2: {
          key: 'key2',
          type: VariableType.Simple,
          mode: VariableMode.ReadWrite
        }
      };

      // First execution: write new values
      let result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'simpleVar1.set(100); simpleVar2.set(200); return simpleVar1.value + simpleVar2.value',
        executionTimeout: 10000
      });

      expect(result.output).toBe(300);

      // Second execution: verify persisted values
      result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: variables,
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return simpleVar1.value + simpleVar2.value',
        executionTimeout: 10000
      });

      expect(result.output).toBe(300);
    });
  });

  describe('Console logging', () => {
    it('should capture console.log output', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'console.log("test message"); return 42',
        executionTimeout: 10000
      });

      expect(result.output).toBe(42);
      expect(result.log).toContain('test message');
    });

    it('should capture console.warn output', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'console.warn("warning message"); return 42',
        executionTimeout: 10000
      });

      expect(result.output).toBe(42);
      // logWarn adds [WARN] prefix to log entries
      expect(result.log).toContain('[WARN] warning message');
    });
  });

  describe('Error handling', () => {
    it('should capture syntax errors', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return {invalid syntax',
        executionTimeout: 10000
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('SyntaxError');
    });

    it('should capture runtime errors', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'throw new Error("test error")',
        executionTimeout: 10000
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('test error');
    });

    it('should capture reference errors', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return undefinedVariable',
        executionTimeout: 10000
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('undefinedVariable');
    });
  });

  describe('Buffer support', () => {
    it('should support Buffer.from', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return Buffer.from("hello").toString("base64")',
        executionTimeout: 10000
      });

      expect(result.output).toBe('aGVsbG8=');
    });

    it('should support Buffer.isBuffer', async () => {
      const store = new MockKVStore();

      const result = await plugin.executeInWorker({
        context: {
          globals: {},
          variables: {},
          kvStore: store
        } as unknown as ExecutionContext,
        code: 'return Buffer.isBuffer(Buffer.from("test"))',
        executionTimeout: 10000
      });

      expect(result.output).toBe(true);
    });
  });

  describe('File fetching (ephemeral worker path)', () => {
    /**
     * MockKVStore with fetchFileCallback support for ephemeral worker testing.
     * This simulates the GrpcKvStore used in ephemeral workers.
     */
    class MockKVStoreWithFileFetch extends MockKVStore {
      private _files: { [path: string]: Buffer } = {};

      public setFile(path: string, content: Buffer): void {
        this._files[path] = content;
      }

      public fetchFileCallback(path: string, callback: (error: Error | null, result: Buffer | null) => void): void {
        const file = this._files[path];
        // Use setTimeout(0) to simulate async behavior like the real GrpcKvStore HTTP request
        // This allows the event loop to process the callback properly with deasync
        setTimeout(() => {
          if (file) {
            callback(null, file);
          } else {
            callback(new Error(`File not found: ${path}`), null);
          }
        }, 0);
      }
    }

    it('should fetch text file via ephemeral path using sync readContents()', async () => {
      const store = new MockKVStoreWithFileFetch();
      const diskPath = '/tmp/uploads/ephemeral-file-sync.txt';
      const fileContent = 'Hello from ephemeral worker (sync)!';
      store.setFile(diskPath, Buffer.from(fileContent));

      const result = await plugin.executeInWorker({
        context: {
          globals: {
            FilePicker1: {
              files: [
                {
                  name: 'ephemeral-file-sync.txt',
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
        executionTimeout: 10000,
        executionId: 'test-execution-id' // Triggers ephemeral path
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe(fileContent);
    });

    it('should fetch text file via ephemeral path using readContentsAsync()', async () => {
      const store = new MockKVStoreWithFileFetch();
      const diskPath = '/tmp/uploads/ephemeral-file.txt';
      const fileContent = 'Hello from ephemeral worker!';
      store.setFile(diskPath, Buffer.from(fileContent));

      const result = await plugin.executeInWorker({
        context: {
          globals: {
            FilePicker1: {
              files: [
                {
                  name: 'ephemeral-file.txt',
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
            // originalname must match $superblocksId for getTreePathToDiskPath to find the file
            originalname: diskPath,
            path: diskPath
          }
        ],
        executionTimeout: 10000,
        executionId: 'test-execution-id' // Triggers ephemeral path
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe(fileContent);
    });

    it('should fetch binary file via ephemeral path using readContentsAsync(raw)', async () => {
      const store = new MockKVStoreWithFileFetch();
      const diskPath = '/tmp/uploads/binary.bin';
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
      store.setFile(diskPath, binaryContent);

      const result = await plugin.executeInWorker({
        context: {
          globals: {
            FilePicker1: {
              files: [
                {
                  name: 'binary.bin',
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
          const contents = await file.readContentsAsync('raw');
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
        executionTimeout: 10000,
        executionId: 'test-execution-id'
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toEqual({
        isBuffer: true,
        length: 6,
        bytes: [0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]
      });
    });

    it('should handle file not found in ephemeral path using readContentsAsync()', async () => {
      const store = new MockKVStoreWithFileFetch();
      const diskPath = '/tmp/uploads/nonexistent.txt';
      // Don't add file to store

      const result = await plugin.executeInWorker({
        context: {
          globals: {
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
          const contents = await file.readContentsAsync('text');
          return contents;
        `,
        files: [
          {
            originalname: diskPath,
            path: diskPath
          }
        ],
        executionTimeout: 10000,
        executionId: 'test-execution-id'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('File not found');
    });

    it('should fetch multiple files via ephemeral path using readContentsAsync()', async () => {
      const store = new MockKVStoreWithFileFetch();
      const diskPath1 = '/tmp/uploads/file1.txt';
      const diskPath2 = '/tmp/uploads/file2.txt';
      store.setFile(diskPath1, Buffer.from('Ephemeral file 1'));
      store.setFile(diskPath2, Buffer.from('Ephemeral file 2'));

      const result = await plugin.executeInWorker({
        context: {
          globals: {
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
          const file1 = await FilePicker1.files[0].readContentsAsync('text');
          const file2 = await FilePicker1.files[1].readContentsAsync('text');
          return { file1, file2 };
        `,
        files: [
          { originalname: diskPath1, path: diskPath1 },
          { originalname: diskPath2, path: diskPath2 }
        ],
        executionTimeout: 10000,
        executionId: 'test-execution-id'
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toEqual({
        file1: 'Ephemeral file 1',
        file2: 'Ephemeral file 2'
      });
    });
  });
});
