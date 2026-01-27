import * as grpc from '@grpc/grpc-js';

import { executeCode } from './bootstrap';
import {
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_HTTP_ADDRESS
} from './env';
import { GrpcKvStore } from './grpcKvStore';
import {
  ISandboxExecutorTransportServiceServer,
  SandboxExecutorTransportServiceService
} from './types/worker/v1/sandbox_executor_transport_grpc_pb';
import { ExecuteRequestV1, ExecuteResponseV1 } from './types/worker/v1/sandbox_executor_transport_pb';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';

const SandboxExecutorTransportServiceImpl: ISandboxExecutorTransportServiceServer = {
  execute: (call: grpc.ServerUnaryCall<ExecuteRequestV1, ExecuteResponseV1>, callback: grpc.sendUnaryData<ExecuteResponseV1>) => {
    const request = call.request;
    const variableStoreClient = new SandboxVariableStoreServiceClient(request.getVariableStoreAddress(), grpc.credentials.createInsecure());
    const kvStore = new GrpcKvStore(
      request.getExecutionId(),
      variableStoreClient,
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_HTTP_ADDRESS
    );

    const ctx = JSON.parse(request.getContextJson());
    const variables = JSON.parse(request.getVariablesJson());

    // Extract pre-computed superblocksFiles map (treePath -> remotePath)
    // This is computed in the task-manager by traversing context to find filepicker objects
    const superblocksFiles: Record<string, string> = {};
    const filesMap = request.getFilesMap();
    filesMap.forEach((value: string, key: string) => {
      superblocksFiles[key] = value;
    });

    executeCode({
      context: {
        globals: ctx.globals ?? {},
        outputs: ctx.outputs ?? {},
        variables: variables ?? {},
        kvStore: kvStore
      },
      code: request.getScript(),
      filePaths: superblocksFiles,
      inheritedEnv: []
    })
      .then((execOutput) => {
        const response = new ExecuteResponseV1();
        response.setResult(JSON.stringify(execOutput.output));
        response.setStdoutList(execOutput.structuredLog.filter((log) => log.level === 'info').map((log) => log.msg));
        response.setStderrList(execOutput.structuredLog.filter((log) => log.level !== 'info').map((log) => log.msg));
        response.setExitCode(!execOutput.error ? 0 : 1);
        if (execOutput.error) {
          response.setError(execOutput.error);
        }
        callback(null, response);
      })
      .catch((err) => {
        callback({
          code: grpc.status.INTERNAL,
          message: err instanceof Error ? err.message : String(err)
        });
      });
  }
};

// Start server
function main() {
  const server = new grpc.Server({
    'grpc.max_receive_message_length': SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    'grpc.max_send_message_length': SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE
  });
  server.addService(SandboxExecutorTransportServiceService, SandboxExecutorTransportServiceImpl);

  const addr = `0.0.0.0:${SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT}`;
  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      throw err;
    }

    console.log(`gRPC server running on ${addr}`);
  });
}

main();
