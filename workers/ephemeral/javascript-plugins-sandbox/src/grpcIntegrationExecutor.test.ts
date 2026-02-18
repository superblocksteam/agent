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
  });
});
