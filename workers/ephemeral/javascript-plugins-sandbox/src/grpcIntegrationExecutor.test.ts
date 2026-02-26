import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GrpcIntegrationExecutor } from './grpcIntegrationExecutor';
import { SandboxIntegrationExecutorServiceClient } from './types/worker/v1/sandbox_integration_executor_grpc_pb';
import { ExecuteIntegrationRequest } from './types/worker/v1/sandbox_integration_executor_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';

const createMockClient = () => ({
  executeIntegration: jest.fn()
});

describe('GrpcIntegrationExecutor', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let executor: GrpcIntegrationExecutor;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockClient = createMockClient();
    executor = new GrpcIntegrationExecutor(executionId, mockClient as unknown as SandboxIntegrationExecutorServiceClient);
  });

  describe('executeIntegration', () => {
    it('should set execution_id, integration_id, and plugin_id on the request', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          expect(request.getExecutionId()).toBe(executionId);
          expect(request.getIntegrationId()).toBe('my-integration');
          expect(request.getPluginId()).toBe('postgres');
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'my-integration',
        pluginId: 'postgres'
      });

      expect(mockClient.executeIntegration).toHaveBeenCalledTimes(1);
    });

    it('should return execution_id and output from the response', async () => {
      const outputValue = Value.fromJavaScript({ rows: [{ id: 1 }] });
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => outputValue,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (_request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          callback(null, mockResponse);
        }
      );

      const result = await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'postgres'
      });

      expect(result.executionId).toBe('resp-exec-id');
      expect(result.output).toEqual({ rows: [{ id: 1 }] });
      expect(result.error).toBeUndefined();
    });

    it('should return error from the response when present', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => 'integration not found'
      };

      mockClient.executeIntegration.mockImplementation(
        (_request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          callback(null, mockResponse);
        }
      );

      const result = await executor.executeIntegration({
        integrationId: 'missing',
        pluginId: 'postgres'
      });

      expect(result.error).toBe('integration not found');
      expect(result.output).toBeUndefined();
    });

    it('should set actionConfiguration as Struct when provided', async () => {
      const actionConfig = { query: 'SELECT 1', usePreparedSql: true };

      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          const struct = request.getActionConfiguration();
          expect(struct).toBeDefined();
          const jsObj = struct!.toJavaScript();
          expect(jsObj).toEqual(actionConfig);
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'postgres',
        actionConfiguration: actionConfig
      });

      expect(mockClient.executeIntegration).toHaveBeenCalledTimes(1);
    });

    it('should not set actionConfiguration when omitted', async () => {
      const mockResponse = {
        getExecutionId: () => '',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          expect(request.getActionConfiguration()).toBeUndefined();
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'restapi'
      });

      expect(mockClient.executeIntegration).toHaveBeenCalledTimes(1);
    });

    it('should reject on gRPC error', async () => {
      const grpcError = new Error('gRPC connection failed');

      mockClient.executeIntegration.mockImplementation(
        (_request: ExecuteIntegrationRequest, callback: (error: Error | null, response: unknown) => void) => {
          callback(grpcError, null);
        }
      );

      await expect(
        executor.executeIntegration({
          integrationId: 'int-1',
          pluginId: 'postgres'
        })
      ).rejects.toThrow('gRPC connection failed');
    });

    // Struct.fromJavaScript → Value.fromJavaScript throws "Unexpected struct type." for any
    // type that is not string, number, boolean, null, array, or plain object.
    // The JSON round-trip in executeIntegration must sanitize the config before serialization.

    it('should not throw when actionConfiguration contains undefined values', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (_request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          callback(null, mockResponse);
        }
      );

      // { body, parameters: undefined } is what PostgresClientImpl.buildRequest returns
      // for a no-param query. Without the JSON round-trip this throws "Unexpected struct type."
      await expect(
        executor.executeIntegration({
          integrationId: 'int-1',
          pluginId: 'postgres',
          actionConfiguration: { body: 'SELECT 1', parameters: undefined }
        })
      ).resolves.toBeDefined();
    });

    it('should strip undefined values from actionConfiguration before serialization', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          const struct = request.getActionConfiguration();
          expect(struct).toBeDefined();
          const jsObj = struct!.toJavaScript() as Record<string, unknown>;
          // undefined values must be absent; only the defined field remains
          expect(jsObj).toEqual({ body: 'SELECT 1' });
          expect('parameters' in jsObj).toBe(false);
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'postgres',
        actionConfiguration: { body: 'SELECT 1', parameters: undefined }
      });
    });

    it('should strip nested undefined values from actionConfiguration', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          const struct = request.getActionConfiguration();
          const jsObj = struct!.toJavaScript() as Record<string, unknown>;
          expect(jsObj).toEqual({ nested: { present: 'yes' } });
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'postgres',
        actionConfiguration: { nested: { present: 'yes', missing: undefined } }
      });
    });

    it('should preserve null values in actionConfiguration', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          const struct = request.getActionConfiguration();
          const jsObj = struct!.toJavaScript() as Record<string, unknown>;
          // null is a valid JSON/Struct value and must be preserved
          expect(jsObj).toEqual({ body: 'SELECT 1', filter: null });
          callback(null, mockResponse);
        }
      );

      await executor.executeIntegration({
        integrationId: 'int-1',
        pluginId: 'postgres',
        actionConfiguration: { body: 'SELECT 1', filter: null }
      });
    });

    it('should not throw when actionConfiguration contains function values', async () => {
      const mockResponse = {
        getExecutionId: () => 'resp-exec-id',
        getOutput: () => undefined,
        getError: () => ''
      };

      mockClient.executeIntegration.mockImplementation(
        (request: ExecuteIntegrationRequest, callback: (error: Error | null, response: typeof mockResponse) => void) => {
          const struct = request.getActionConfiguration();
          const jsObj = struct!.toJavaScript() as Record<string, unknown>;
          // functions are dropped by JSON.stringify, just like undefined
          expect('fn' in jsObj).toBe(false);
          callback(null, mockResponse);
        }
      );

      await expect(
        executor.executeIntegration({
          integrationId: 'int-1',
          pluginId: 'postgres',
          actionConfiguration: { body: 'SELECT 1', fn: () => 'ignored' }
        })
      ).resolves.toBeDefined();
    });
  });
});
