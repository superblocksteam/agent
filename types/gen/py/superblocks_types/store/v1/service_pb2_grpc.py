# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from superblocks_types.store.v1 import service_pb2 as store_dot_v1_dot_service__pb2


class StoreServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Read = channel.unary_unary(
                '/store.v1.StoreService/Read',
                request_serializer=store_dot_v1_dot_service__pb2.ReadRequest.SerializeToString,
                response_deserializer=store_dot_v1_dot_service__pb2.ReadResponse.FromString,
                _registered_method=True)
        self.Write = channel.unary_unary(
                '/store.v1.StoreService/Write',
                request_serializer=store_dot_v1_dot_service__pb2.WriteRequest.SerializeToString,
                response_deserializer=store_dot_v1_dot_service__pb2.WriteResponse.FromString,
                _registered_method=True)


class StoreServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def Read(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def Write(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_StoreServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Read': grpc.unary_unary_rpc_method_handler(
                    servicer.Read,
                    request_deserializer=store_dot_v1_dot_service__pb2.ReadRequest.FromString,
                    response_serializer=store_dot_v1_dot_service__pb2.ReadResponse.SerializeToString,
            ),
            'Write': grpc.unary_unary_rpc_method_handler(
                    servicer.Write,
                    request_deserializer=store_dot_v1_dot_service__pb2.WriteRequest.FromString,
                    response_serializer=store_dot_v1_dot_service__pb2.WriteResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'store.v1.StoreService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('store.v1.StoreService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class StoreService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def Read(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/store.v1.StoreService/Read',
            store_dot_v1_dot_service__pb2.ReadRequest.SerializeToString,
            store_dot_v1_dot_service__pb2.ReadResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def Write(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/store.v1.StoreService/Write',
            store_dot_v1_dot_service__pb2.WriteRequest.SerializeToString,
            store_dot_v1_dot_service__pb2.WriteResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
