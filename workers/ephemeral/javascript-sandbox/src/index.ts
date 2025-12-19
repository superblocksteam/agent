import * as grpc from '@grpc/grpc-js';

import { executeCode } from './bootstrap';
import {
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

const SandboxExecutorTransportServiceImpl: ISandboxExecutorTransportServiceServer = {
  execute: (call: grpc.ServerUnaryCall<ExecuteRequest, ExecuteResponse>, callback: grpc.sendUnaryData<ExecuteResponse>) => {
    const request = call.request;
    const variableStoreClient = new SandboxVariableStoreServiceClient(request.getVariableStoreAddress(), grpc.credentials.createInsecure());
    const kvStore = new GrpcKvStore(request.getExecutionId(), variableStoreClient);

    const ctx = JSON.parse(request.getContextJson());
    executeCode({
      context: {
        globals: ctx.globals ?? {},
        outputs: ctx.outputs ?? {},
        variables: ctx.variables ?? {},
        kvStore: kvStore
      },
      code: request.getScript(),
      filePaths: [],
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
