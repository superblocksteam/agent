import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import http from 'http';
import { GrpcKvStore } from './grpcKvStore';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';
import {
  GetVariablesRequest,
  SetVariableRequest,
  SetVariableResponse,
  SetVariablesRequest,
  SetVariablesResponse,
} from './types/worker/v1/sandbox_variable_store_pb';
import { EventEmitter } from 'events';

jest.mock('http');

// Mock the gRPC client
const createMockClient = () => ({
  getVariables: jest.fn(),
  setVariable: jest.fn(),
  setVariables: jest.fn()
});

describe('GrpcKvStore', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let store: GrpcKvStore;
  const variableStoreHttpAddress = 'http://localhost:8080';
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockClient = createMockClient();
    store = new GrpcKvStore(executionId, mockClient as unknown as SandboxVariableStoreServiceClient, variableStoreHttpAddress);
  });

  describe('read', () => {
    const readTestCases: Array<{
      name: string;
      keys: string[];
      mockResponseValues: string[];
      expectedData: unknown[];
    }> = [
      {
        name: 'should read multiple keys and parse JSON values',
        keys: ['key1', 'key2', 'key3'],
        mockResponseValues: [JSON.stringify('value1'), JSON.stringify({ nested: { deep: 'value' } }), JSON.stringify(123), JSON.stringify([1, 2, 3])],
        expectedData: ['value1', { nested: { deep: 'value' } }, 123, [1, 2, 3]]
      },
      {
        name: 'should handle empty keys array',
        keys: [],
        mockResponseValues: [],
        expectedData: []
      },
      {
        name: 'should handle empty string value',
        keys: ['emptyStringKey'],
        mockResponseValues: [''],
        expectedData: [null]
      },
      {
        name: 'should handle null values',
        keys: ['nullKey'],
        mockResponseValues: [JSON.stringify(null)],
        expectedData: [null]
      },
    ];

    for (const { name, keys, mockResponseValues, expectedData } of readTestCases) {
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

        expect(result).toEqual({ data: expectedData });
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
      const fileContents = Buffer.from('Hello');
      const base64Contents = fileContents.toString('base64');

      const mockResponse = new EventEmitter() as EventEmitter & { statusCode: number };
      mockResponse.statusCode = 200;

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: typeof mockResponse) => void) => {
        expect(url).toContain('/fetch-file');
        expect(url).toContain(`executionId=${executionId}`);
        expect(url).toContain('path=%2Fpath%2Fto%2Ffile.txt');

        // Call the callback with mock response on next tick
        process.nextTick(() => {
          callback(mockResponse);
          // Emit the response data
          mockResponse.emit('data', Buffer.from(JSON.stringify({ contents: base64Contents })));
          mockResponse.emit('end');
        });

        return mockRequest;
      });

      const result = await store.fetchFile('/path/to/file.txt');

      expect(result).toEqual(fileContents);
      expect(http.request).toHaveBeenCalledTimes(1);
    });

    it('should reject on HTTP request error', async () => {
      const httpError = new Error('Connection refused');

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: unknown) => void) => {
        process.nextTick(() => {
          mockRequest.emit('error', httpError);
        });
        return mockRequest;
      });

      await expect(store.fetchFile('/path/to/file')).rejects.toThrow('Connection refused');
    });

    it('should reject when response contains an error message', async () => {
      const mockResponse = new EventEmitter() as EventEmitter & { statusCode: number };
      mockResponse.statusCode = 200;

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: typeof mockResponse) => void) => {
        process.nextTick(() => {
          callback(mockResponse);
          mockResponse.emit('data', Buffer.from(JSON.stringify({ error: 'File not found' })));
          mockResponse.emit('end');
        });
        return mockRequest;
      });

      await expect(store.fetchFile('/nonexistent/file')).rejects.toThrow('File not found');
    });

    it('should reject on non-200 status code', async () => {
      const mockResponse = new EventEmitter() as EventEmitter & { statusCode: number };
      mockResponse.statusCode = 500;

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: typeof mockResponse) => void) => {
        process.nextTick(() => {
          callback(mockResponse);
        });
        return mockRequest;
      });

      await expect(store.fetchFile('/path/to/file')).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('fetchFileCallback', () => {
    it('should call callback with file contents on success', (done) => {
      const fileContents = Buffer.from([1, 2, 3, 4]);
      const base64Contents = fileContents.toString('base64');

      const mockResponse = new EventEmitter() as EventEmitter & { statusCode: number };
      mockResponse.statusCode = 200;

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: typeof mockResponse) => void) => {
        process.nextTick(() => {
          callback(mockResponse);
          mockResponse.emit('data', Buffer.from(JSON.stringify({ contents: base64Contents })));
          mockResponse.emit('end');
        });
        return mockRequest;
      });

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBeNull();
        expect(result).toEqual(fileContents);
        done();
      });
    });

    it('should call callback with error on HTTP request failure', (done) => {
      const httpError = new Error('Connection lost');

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: unknown) => void) => {
        process.nextTick(() => {
          mockRequest.emit('error', httpError);
        });
        return mockRequest;
      });

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBe(httpError);
        expect(result).toBeNull();
        done();
      });
    });

    it('should call callback with error when response contains error message', (done) => {
      const mockResponse = new EventEmitter() as EventEmitter & { statusCode: number };
      mockResponse.statusCode = 200;

      const mockRequest = new EventEmitter() as EventEmitter & { end: jest.Mock };
      mockRequest.end = jest.fn();

      (http.request as jest.Mock).mockImplementation((url: string, options: unknown, callback: (res: typeof mockResponse) => void) => {
        process.nextTick(() => {
          callback(mockResponse);
          mockResponse.emit('data', Buffer.from(JSON.stringify({ error: 'Access denied' })));
          mockResponse.emit('end');
        });
        return mockRequest;
      });

      store.fetchFileCallback('/path/to/file', (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Access denied');
        expect(result).toBeNull();
        done();
      });
    });
  });
});
