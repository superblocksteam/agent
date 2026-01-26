import * as grpc from '@grpc/grpc-js';
import { IntegrationError } from '@superblocks/shared';
import { ExecuteRequest, KVStore, MetadataRequest, PreDeleteRequest, StreamRequest, TestRequest } from '@superblocks/worker.js';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import {
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_PORT,
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_STREAMING_PROXY_ADDRESS,
  SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_ADDRESS
} from './env';
import { GrpcKvStore } from './grpcKvStore';
import logger from './logger';
import { MessageTransformer, MessageTransformerImpl, NativeRequest, NativeResponse, ProtoResponse } from './messageTransformer';
import { ALL_PLUGINS, loadPlugins } from './pluginsLoader';
import { PluginsRouter } from './pluginsRouter';
import { Response as ProtoTransportResponse } from './types/transport/v1/transport_pb';
import { SandboxStreamingProxyServiceClient } from './types/worker/v1/sandbox_streaming_proxy_grpc_pb';
import { ISandboxTransportServiceServer, SandboxTransportServiceService } from './types/worker/v1/sandbox_transport_grpc_pb';
import {
  ExecuteRequest as ProtoExecuteRequest,
  ExecuteResponse as ProtoExecuteResponse,
  MetadataRequest as ProtoMetadataRequest,
  PreDeleteRequest as ProtoPreDeleteRequest,
  StreamRequest as ProtoStreamRequest,
  TestRequest as ProtoTestRequest
} from './types/worker/v1/sandbox_transport_pb';
import { SandboxVariableStoreServiceClient } from './types/worker/v1/sandbox_variable_store_grpc_pb';

function createSandboxTransportService(
  pluginsRouter: PluginsRouter,
  messageTransformer: MessageTransformer,
  variableStoreClient: SandboxVariableStoreServiceClient
): ISandboxTransportServiceServer {
  function handleEvent(
    func: (
      pluginName: string,
      request: NativeRequest,
      kvStore: KVStore | undefined
    ) => Promise<NativeResponse | google_protobuf_empty_pb.Empty>,
    pluginName: string,
    req: NativeRequest,
    callback: grpc.sendUnaryData<ProtoResponse | google_protobuf_empty_pb.Empty>,
    kvStore: KVStore | undefined
  ) {
    return func(pluginName, req, kvStore)
      .then((response: NativeResponse | google_protobuf_empty_pb.Empty) => {
        let protoResponse: ProtoResponse | google_protobuf_empty_pb.Empty;

        if (response instanceof google_protobuf_empty_pb.Empty) {
          protoResponse = new google_protobuf_empty_pb.Empty();
        } else {
          protoResponse = messageTransformer.nativeResponseToProto(response) as ProtoResponse;
        }

        callback(null, protoResponse);
      })
      .catch((err) => {
        if (err instanceof IntegrationError) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: err.message
          });
        } else {
          callback({
            code: grpc.status.INTERNAL,
            message: err instanceof Error ? err.message : String(err)
          });
        }
      });
  }

  return {
    execute(call: grpc.ServerUnaryCall<ProtoExecuteRequest, ProtoExecuteResponse>, callback: grpc.sendUnaryData<ProtoExecuteResponse>) {
      const pluginName = call.request.getMetadata()?.getPluginname() ?? '';
      const nativeRequest: ExecuteRequest = messageTransformer.protoRequestToNative(call.request) as ExecuteRequest;
      const executionId = nativeRequest.props?.executionId ?? '';
      const kvStore = new GrpcKvStore(executionId, variableStoreClient);

      void handleEvent(pluginsRouter.handleExecuteEvent.bind(pluginsRouter), pluginName, nativeRequest, callback, kvStore);
    },

    stream(
      call: grpc.ServerWritableStream<ProtoStreamRequest, google_protobuf_empty_pb.Empty>,
      callback: grpc.sendUnaryData<google_protobuf_empty_pb.Empty>
    ) {
      const pluginName = call.request.getRequest()?.getMetadata()?.getPluginname() ?? '';
      const nativeRequest: StreamRequest = messageTransformer.protoRequestToNative(call.request) as StreamRequest;
      const executionId = nativeRequest.props?.executionId ?? '';
      const kvStore = new GrpcKvStore(executionId, variableStoreClient);

      void handleEvent(pluginsRouter.handleStreamEvent.bind(pluginsRouter), pluginName, nativeRequest, callback, kvStore);
    },

    metadata(
      call: grpc.ServerUnaryCall<ProtoMetadataRequest, ProtoTransportResponse.Data.Data>,
      callback: grpc.sendUnaryData<ProtoTransportResponse.Data.Data>
    ) {
      const pluginName = call.request.getMetadata()?.getPluginname() ?? '';
      const nativeRequest: MetadataRequest = messageTransformer.protoRequestToNative(call.request) as MetadataRequest;
      void handleEvent(pluginsRouter.handleMetadataEvent.bind(pluginsRouter), pluginName, nativeRequest, callback, undefined);
    },

    test(
      call: grpc.ServerUnaryCall<ProtoTestRequest, google_protobuf_empty_pb.Empty>,
      callback: grpc.sendUnaryData<google_protobuf_empty_pb.Empty>
    ) {
      const pluginName = call.request.getMetadata()?.getPluginname() ?? '';
      const nativeRequest: TestRequest = messageTransformer.protoRequestToNative(call.request) as TestRequest;
      void handleEvent(pluginsRouter.handleTestEvent.bind(pluginsRouter), pluginName, nativeRequest, callback, undefined);
    },

    preDelete(
      call: grpc.ServerUnaryCall<ProtoPreDeleteRequest, google_protobuf_empty_pb.Empty>,
      callback: grpc.sendUnaryData<google_protobuf_empty_pb.Empty>
    ) {
      const pluginName = call.request.getMetadata()?.getPluginname() ?? '';
      const nativeRequest: PreDeleteRequest = messageTransformer.protoRequestToNative(call.request) as PreDeleteRequest;
      void handleEvent(pluginsRouter.handlePreDeleteEvent.bind(pluginsRouter), pluginName, nativeRequest, callback, undefined);
    }
  };
}

// Start server
function main() {
  const variableStoreClient = new SandboxVariableStoreServiceClient(
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_ADDRESS,
    grpc.credentials.createInsecure()
  );

  const streamingClient = new SandboxStreamingProxyServiceClient(
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_STREAMING_PROXY_ADDRESS,
    grpc.credentials.createInsecure()
  );

  const pluginsRouter = new PluginsRouter(logger, streamingClient);
  const plugins = loadPlugins(Object.keys(ALL_PLUGINS));
  Object.entries(plugins).forEach(([pluginId, plugin]) => {
    pluginsRouter.registerPlugin(pluginId, plugin);
  });

  const messageTransformer = new MessageTransformerImpl();
  const server = new grpc.Server({
    'grpc.max_receive_message_length': SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    'grpc.max_send_message_length': SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE
  });
  server.addService(SandboxTransportServiceService, createSandboxTransportService(pluginsRouter, messageTransformer, variableStoreClient));

  const addr = `0.0.0.0:${SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_PORT}`;
  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      throw err;
    }

    console.log(`gRPC server running on ${addr}`);
  });
}

main();
