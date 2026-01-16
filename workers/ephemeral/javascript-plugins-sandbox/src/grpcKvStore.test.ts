import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GrpcKvStore } from './grpcKvStore';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';
import {
  GetVariablesRequest,
  SetVariableRequest,
  SetVariableResponse,
  SetVariablesRequest,
  SetVariablesResponse,
  FetchFileRequest,
  FetchFileResponse
} from './types/worker/v1/sandbox_variable_store_pb';

// Mock the gRPC client
const createMockClient = () => ({
  getVariables: jest.fn(),
  setVariable: jest.fn(),
  setVariables: jest.fn(),
  fetchFile: jest.fn()
});

describe('GrpcKvStore', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let store: GrpcKvStore;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockClient = createMockClient();
    store = new GrpcKvStore(executionId, mockClient as unknown as SandboxVariableStoreServiceClient);
  });

  describe('read', () => {
    const readTestCases: Array<{
      name: string;
      keys: string[];
      mockResponseValues: string[];
      expectedData: unknown[];
      expectedBytesRead: number;
    }> = [
      {
        name: 'should read multiple keys and parse JSON values',
        keys: ['key1', 'key2', 'key3'],
        mockResponseValues: [JSON.stringify('value1'), JSON.stringify({ nested: { deep: 'value' } }), JSON.stringify(123), JSON.stringify([1, 2, 3])],
        expectedData: ['value1', { nested: { deep: 'value' } }, 123, [1, 2, 3]],
        expectedBytesRead: JSON.stringify('value1').length + JSON.stringify({ nested: { deep: 'value' } }).length + JSON.stringify(123).length + JSON.stringify([1, 2, 3]).length
      },
      {
        name: 'should handle empty keys array',
        keys: [],
        mockResponseValues: [],
        expectedData: [],
        expectedBytesRead: 0
      },
      {
        name: 'should handle empty string value',
        keys: ['emptyStringKey'],
        mockResponseValues: [''],
        expectedData: [null],
        expectedBytesRead: 0
      },
      {
        name: 'should handle null values',
        keys: ['nullKey'],
        mockResponseValues: [JSON.stringify(null)],
        expectedData: [null],
        expectedBytesRead: JSON.stringify(null).length
      },
    ];

    for (const { name, keys, mockResponseValues, expectedData, expectedBytesRead } of readTestCases) {
      it(name, async () => {
        const mockResponse = {
          getValuesList: () => mockResponseValues
        };

        mockClient.getVariables.mockImplementation(
          (request: GetVariablesRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
            expect(request.getExecutionId()).toBe(executionId);
            expect(request.getKeysList()).toEqual(keys);
            callback(null, mockResponse);
          }
        );

        const result = await store.read(keys);

        expect(result).toEqual({ pinned: { read: expectedBytesRead }, data: expectedData });
        expect(mockClient.getVariables).toHaveBeenCalledTimes(1);
      });
    }

    it('should reject on gRPC error', async () => {
      const grpcError = new Error('gRPC connection failed');

      mockClient.getVariables.mockImplementation(
        (request: GetVariablesRequest, callback: (error: Error | null, response: unknown) => void) => {
          callback(grpcError, null);
        }
      );

      await expect(store.read(['key1'])).rejects.toThrow('gRPC connection failed');
    });
  });

  describe('write', () => {
    const writeTestCases: Array<{
      name: string;
      key: string;
      value: unknown;
      expectedSerializedValue: string;
    }> = [
      {
        name: 'should write an object value',
        key: 'myKey',
        value: { nested: 'value' },
        expectedSerializedValue: JSON.stringify({ nested: 'value' })
      },
      {
        name: 'should write a string value',
        key: 'stringKey',
        value: 'simple string',
        expectedSerializedValue: JSON.stringify('simple string')
      },
      {
        name: 'should write an empty string value',
        key: 'emptyStringKey',
        value: '',
        expectedSerializedValue: JSON.stringify('')
      },
      {
        name: 'should write a number value',
        key: 'numberKey',
        value: 42,
        expectedSerializedValue: JSON.stringify(42)
      },
      {
        name: 'should write a null value',
        key: 'nullKey',
        value: null,
        expectedSerializedValue: JSON.stringify(null)
      },
      {
        name: 'should write a null value for undefined',
        key: 'undefinedKey',
        value: undefined,
        expectedSerializedValue: JSON.stringify(null)
      },
      {
        name: 'should write an array value',
        key: 'arrayKey',
        value: [1, 2, 3],
        expectedSerializedValue: JSON.stringify([1, 2, 3])
      }
    ];

    for (const { name, key, value, expectedSerializedValue } of writeTestCases) {
      it(name, async () => {
        mockClient.setVariable.mockImplementation(
          (request: SetVariableRequest, callback: (error: Error | null, response: SetVariableResponse) => void) => {
            expect(request.getExecutionId()).toBe(executionId);
            expect(request.getKey()).toBe(key);
            expect(request.getValue()).toBe(expectedSerializedValue);
            callback(null, {} as SetVariableResponse);
          }
        );

        await store.write(key, value);

        expect(mockClient.setVariable).toHaveBeenCalledTimes(1);
      });
    }

    it('should reject on gRPC error', async () => {
      const grpcError = new Error('Write failed');

      mockClient.setVariable.mockImplementation(
        (request: SetVariableRequest, callback: (error: Error | null, response: SetVariableResponse | null) => void) => {
          callback(grpcError, null);
        }
      );

      await expect(store.write('key', 'value')).rejects.toThrow('Write failed');
    });
  });

  describe('writeMany', () => {
    const writeManyTestCases: Array<{
      name: string;
      payload: Array<{ key: string; value: unknown }>;
      expectedKvs: Array<{ key: string; serializedValue: string }>;
    }> = [
      {
        name: 'should write multiple key-value pairs',
        payload: [
          { key: 'emptyStringKey', value: '' },
          { key: 'str', value: 'value1' },
          { key: 'num', value: 42 },
          { key: 'arr', value: [1, 2] },
          { key: 'obj', value: { complex: 'object' } },
          { key: 'nullKey', value: null }
        ],
        expectedKvs: [
          { key: 'emptyStringKey', serializedValue: JSON.stringify('') },
          { key: 'str', serializedValue: JSON.stringify('value1') },
          { key: 'num', serializedValue: JSON.stringify(42) },
          { key: 'arr', serializedValue: JSON.stringify([1, 2]) },
          { key: 'obj', serializedValue: JSON.stringify({ complex: 'object' }) },
          { key: 'nullKey', serializedValue: JSON.stringify(null) },
        ]
      },
      {
        name: 'should handle empty payload',
        payload: [],
        expectedKvs: []
      },
      {
        name: 'should write single key-value pair',
        payload: [{ key: 'onlyKey', value: 123 }],
        expectedKvs: [{ key: 'onlyKey', serializedValue: JSON.stringify(123) }]
      }
    ];

    for (const { name, payload, expectedKvs } of writeManyTestCases) {
      it(name, async () => {
        mockClient.setVariables.mockImplementation(
          (request: SetVariablesRequest, callback: (error: Error | null, response: SetVariablesResponse) => void) => {
            expect(request.getExecutionId()).toBe(executionId);
            const kvsList = request.getKvsList();
            expect(kvsList.length).toBe(expectedKvs.length);
            for (let i = 0; i < expectedKvs.length; i++) {
              expect(kvsList[i].getKey()).toBe(expectedKvs[i].key);
              expect(kvsList[i].getValue()).toBe(expectedKvs[i].serializedValue);
            }
            callback(null, {} as SetVariablesResponse);
          }
        );

        await store.writeMany(payload);

        expect(mockClient.setVariables).toHaveBeenCalledTimes(1);
      });
    }

    it('should reject on gRPC error', async () => {
      const grpcError = new Error('Batch write failed');

      mockClient.setVariables.mockImplementation(
        (request: SetVariablesRequest, callback: (error: Error | null, response: SetVariablesResponse | null) => void) => {
          callback(grpcError, null);
        }
      );

      await expect(store.writeMany([{ key: 'k', value: 'v' }])).rejects.toThrow('Batch write failed');
    });
  });

  describe('fetchFile', () => {
    it('should fetch file contents successfully', async () => {
      const fileContents = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          expect(request.getExecutionId()).toBe(executionId);
          expect(request.getPath()).toBe('/path/to/file.txt');
          callback(null, {
            getError: () => '',
            getContents_asU8: () => fileContents
          } as unknown as FetchFileResponse);
        }
      );

      const result = await store.fetchFile('/path/to/file.txt');

      expect(result).toEqual(Buffer.from(fileContents));
      expect(mockClient.fetchFile).toHaveBeenCalledTimes(1);
    });

    it('should reject on gRPC error', async () => {
      const grpcError = new Error('File fetch gRPC error');

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse | null) => void) => {
          callback(grpcError, null);
        }
      );

      await expect(store.fetchFile('/path/to/file')).rejects.toThrow('File fetch gRPC error');
    });

    it('should reject when response contains an error message', async () => {
      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          callback(null, {
            getError: () => 'File not found',
            getContents_asU8: () => new Uint8Array()
          } as unknown as FetchFileResponse);
        }
      );

      await expect(store.fetchFile('/nonexistent/file')).rejects.toThrow('File not found');
    });
  });

  describe('fetchFileCallback', () => {
    it('should call callback with file contents on success', (done) => {
      const fileContents = new Uint8Array([1, 2, 3, 4]);

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          callback(null, {
            getError: () => '',
            getContents_asU8: () => fileContents
          } as unknown as FetchFileResponse);
        }
      );

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBeNull();
        expect(result).toEqual(Buffer.from(fileContents));
        done();
      });
    });

    it('should call callback with error on gRPC failure', (done) => {
      const grpcError = new Error('Connection lost');

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse | null) => void) => {
          callback(grpcError, null);
        }
      );

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBe(grpcError);
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should call callback with error when response contains error message', (done) => {
      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          callback(null, {
            getError: () => 'Access denied',
            getContents_asU8: () => new Uint8Array()
          } as unknown as FetchFileResponse);
        }
      );

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Access denied');
        expect(result).toBeUndefined();
        done();
      });
    });
  });

  describe('prefetchFiles', () => {
    it('should prefetch multiple files and store them in cache', async () => {
      const file1Contents = new Uint8Array([65, 66, 67]); // "ABC"
      const file2Contents = new Uint8Array([68, 69, 70]); // "DEF"

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          const path = request.getPath();
          if (path === '/file1.txt') {
            callback(null, {
              getError: () => '',
              getContents_asU8: () => file1Contents
            } as unknown as FetchFileResponse);
          } else if (path === '/file2.txt') {
            callback(null, {
              getError: () => '',
              getContents_asU8: () => file2Contents
            } as unknown as FetchFileResponse);
          }
        }
      );

      await store.prefetchFiles(['/file1.txt', '/file2.txt']);

      expect(store.hasFileInCache('/file1.txt')).toBe(true);
      expect(store.hasFileInCache('/file2.txt')).toBe(true);
      expect(store.getFileFromCache('/file1.txt')).toEqual(Buffer.from(file1Contents));
      expect(store.getFileFromCache('/file2.txt')).toEqual(Buffer.from(file2Contents));
      expect(mockClient.fetchFile).toHaveBeenCalledTimes(2);
    });

    it('should handle empty paths array', async () => {
      await store.prefetchFiles([]);

      expect(mockClient.fetchFile).not.toHaveBeenCalled();
    });

    it('should reject if any file fetch fails', async () => {
      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse | null) => void) => {
          callback(new Error('Fetch error'), null);
        }
      );

      await expect(store.prefetchFiles(['/file.txt'])).rejects.toThrow('Fetch error');
    });
  });

  describe('getFileFromCache', () => {
    it('should return undefined for uncached files', () => {
      const result = store.getFileFromCache('/not/in/cache');

      expect(result).toBeUndefined();
    });

    it('should return cached file contents', async () => {
      const fileContents = new Uint8Array([1, 2, 3]);

      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          callback(null, {
            getError: () => '',
            getContents_asU8: () => fileContents
          } as unknown as FetchFileResponse);
        }
      );

      await store.prefetchFiles(['/cached/file']);

      expect(store.getFileFromCache('/cached/file')).toEqual(Buffer.from(fileContents));
    });
  });

  describe('hasFileInCache', () => {
    it('should return false for uncached files', () => {
      expect(store.hasFileInCache('/not/cached')).toBe(false);
    });

    it('should return true for cached files', async () => {
      mockClient.fetchFile.mockImplementation(
        (request: FetchFileRequest, callback: (error: Error | null, response: FetchFileResponse) => void) => {
          callback(null, {
            getError: () => '',
            getContents_asU8: () => new Uint8Array([1])
          } as unknown as FetchFileResponse);
        }
      );

      await store.prefetchFiles(['/exists']);

      expect(store.hasFileInCache('/exists')).toBe(true);
    });
  });
});
