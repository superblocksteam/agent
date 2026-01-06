import * as grpc from '@grpc/grpc-js';

import { executeCode } from './bootstrap';
import {
  SUPERBLOCKS_WORKER_PROXY_ENABLED,
  SUPERBLOCKS_WORKER_PROXY_HOST,
  SUPERBLOCKS_WORKER_PROXY_PORT,
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
  SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE
} from './env';
import { GrpcKvStore } from './grpcKvStore';
import {
  ISandboxExecutorTransportServiceServer,
  SandboxExecutorTransportServiceService
} from './types/worker/v1/sandbox_executor_transport_grpc_pb';
import { ExecuteRequest, ExecuteResponse } from './types/worker/v1/sandbox_executor_transport_pb';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';

// Set up proxy URL for vm2 sandbox to use.
// This must happen before any user code execution but after imports.
if (SUPERBLOCKS_WORKER_PROXY_ENABLED && SUPERBLOCKS_WORKER_PROXY_HOST) {
  // Validate proxy port configuration
  if (!SUPERBLOCKS_WORKER_PROXY_PORT || SUPERBLOCKS_WORKER_PROXY_PORT <= 0 || SUPERBLOCKS_WORKER_PROXY_PORT > 65535) {
    throw new Error(`Invalid SUPERBLOCKS_WORKER_PROXY_PORT: ${SUPERBLOCKS_WORKER_PROXY_PORT}. Must be a valid port number (1-65535).`);
  }

  // Store proxy URL for bootstrap.js to create mocked http/https modules.
  // The mocked modules force ALL traffic through the proxy - no env vars needed.
  process.env.__SUPERBLOCKS_PROXY_URL = `http://${SUPERBLOCKS_WORKER_PROXY_HOST}:${SUPERBLOCKS_WORKER_PROXY_PORT}`;
  console.log(`Network proxy enabled: ${process.env.__SUPERBLOCKS_PROXY_URL}`);
}

const SandboxExecutorTransportServiceImpl: ISandboxExecutorTransportServiceServer = {
  execute: (call: grpc.ServerUnaryCall<ExecuteRequest, ExecuteResponse>, callback: grpc.sendUnaryData<ExecuteResponse>) => {
    const request = call.request;
    const variableStoreClient = new SandboxVariableStoreServiceClient(request.getVariableStoreAddress(), grpc.credentials.createInsecure());
    const kvStore = new GrpcKvStore(request.getExecutionId(), variableStoreClient);

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
        const response = new ExecuteResponse();
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
