/**
 * gRPC-backed integration executor for sandbox-to-host communication.
 *
 * Wraps the generated SandboxIntegrationExecutorServiceClient with
 * promise-based methods that implement the IntegrationExecutor interface.
 * Each instance is scoped to a single execution (by execution ID).
 */
import { IntegrationExecutor } from '@superblocks/shared';
import { JavaScriptValue, Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { SandboxIntegrationExecutorServiceClient } from './types/worker/v1/sandbox_integration_executor_grpc_pb';
import { ExecuteIntegrationRequest } from './types/worker/v1/sandbox_integration_executor_pb';

export class GrpcIntegrationExecutor implements IntegrationExecutor {
  private readonly executionId: string;
  private readonly client: SandboxIntegrationExecutorServiceClient;

  constructor(executionId: string, client: SandboxIntegrationExecutorServiceClient) {
    this.executionId = executionId;
    this.client = client;
  }

  async executeIntegration(params: {
    integrationId: string;
    pluginId: string;
    actionConfiguration?: Record<string, unknown>;
  }): Promise<{ executionId: string; output: unknown; error?: string }> {
    return new Promise((resolve, reject) => {
      const request = new ExecuteIntegrationRequest();
      request.setExecutionId(this.executionId);
      request.setIntegrationId(params.integrationId);
      request.setPluginId(params.pluginId);

      if (params.actionConfiguration) {
        request.setActionConfiguration(
          Struct.fromJavaScript(params.actionConfiguration as unknown as { [key: string]: JavaScriptValue })
        );
      }

      this.client.executeIntegration(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        const respError = response.getError();
        resolve({
          executionId: response.getExecutionId(),
          output: response.getOutput()?.toJavaScript(),
          error: respError || undefined
        });
      });
    });
  }
}
