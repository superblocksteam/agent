# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from superblocks_types.api.v1 import integration_auth_service_pb2 as api_dot_v1_dot_integration__auth__service__pb2
from google.protobuf import empty_pb2 as google_dot_protobuf_dot_empty__pb2


class IntegrationAuthServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.CheckAuth = channel.unary_unary(
                '/api.v1.IntegrationAuthService/CheckAuth',
                request_serializer=api_dot_v1_dot_integration__auth__service__pb2.CheckAuthRequest.SerializeToString,
                response_deserializer=api_dot_v1_dot_integration__auth__service__pb2.CheckAuthResponse.FromString,
                _registered_method=True)
        self.Login = channel.unary_unary(
                '/api.v1.IntegrationAuthService/Login',
                request_serializer=api_dot_v1_dot_integration__auth__service__pb2.LoginRequest.SerializeToString,
                response_deserializer=api_dot_v1_dot_integration__auth__service__pb2.LoginResponse.FromString,
                _registered_method=True)
        self.Logout = channel.unary_unary(
                '/api.v1.IntegrationAuthService/Logout',
                request_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                _registered_method=True)
        self.ExchangeOauthCodeForToken = channel.unary_unary(
                '/api.v1.IntegrationAuthService/ExchangeOauthCodeForToken',
                request_serializer=api_dot_v1_dot_integration__auth__service__pb2.ExchangeOauthCodeForTokenRequest.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                _registered_method=True)
        self.RequestOauthPasswordToken = channel.unary_unary(
                '/api.v1.IntegrationAuthService/RequestOauthPasswordToken',
                request_serializer=api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenRequest.SerializeToString,
                response_deserializer=api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenResponse.FromString,
                _registered_method=True)


class IntegrationAuthServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def CheckAuth(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def Login(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def Logout(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ExchangeOauthCodeForToken(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def RequestOauthPasswordToken(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_IntegrationAuthServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'CheckAuth': grpc.unary_unary_rpc_method_handler(
                    servicer.CheckAuth,
                    request_deserializer=api_dot_v1_dot_integration__auth__service__pb2.CheckAuthRequest.FromString,
                    response_serializer=api_dot_v1_dot_integration__auth__service__pb2.CheckAuthResponse.SerializeToString,
            ),
            'Login': grpc.unary_unary_rpc_method_handler(
                    servicer.Login,
                    request_deserializer=api_dot_v1_dot_integration__auth__service__pb2.LoginRequest.FromString,
                    response_serializer=api_dot_v1_dot_integration__auth__service__pb2.LoginResponse.SerializeToString,
            ),
            'Logout': grpc.unary_unary_rpc_method_handler(
                    servicer.Logout,
                    request_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
            'ExchangeOauthCodeForToken': grpc.unary_unary_rpc_method_handler(
                    servicer.ExchangeOauthCodeForToken,
                    request_deserializer=api_dot_v1_dot_integration__auth__service__pb2.ExchangeOauthCodeForTokenRequest.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
            'RequestOauthPasswordToken': grpc.unary_unary_rpc_method_handler(
                    servicer.RequestOauthPasswordToken,
                    request_deserializer=api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenRequest.FromString,
                    response_serializer=api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'api.v1.IntegrationAuthService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('api.v1.IntegrationAuthService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class IntegrationAuthService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def CheckAuth(request,
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
            '/api.v1.IntegrationAuthService/CheckAuth',
            api_dot_v1_dot_integration__auth__service__pb2.CheckAuthRequest.SerializeToString,
            api_dot_v1_dot_integration__auth__service__pb2.CheckAuthResponse.FromString,
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
    def Login(request,
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
            '/api.v1.IntegrationAuthService/Login',
            api_dot_v1_dot_integration__auth__service__pb2.LoginRequest.SerializeToString,
            api_dot_v1_dot_integration__auth__service__pb2.LoginResponse.FromString,
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
    def Logout(request,
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
            '/api.v1.IntegrationAuthService/Logout',
            google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
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
    def ExchangeOauthCodeForToken(request,
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
            '/api.v1.IntegrationAuthService/ExchangeOauthCodeForToken',
            api_dot_v1_dot_integration__auth__service__pb2.ExchangeOauthCodeForTokenRequest.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
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
    def RequestOauthPasswordToken(request,
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
            '/api.v1.IntegrationAuthService/RequestOauthPasswordToken',
            api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenRequest.SerializeToString,
            api_dot_v1_dot_integration__auth__service__pb2.RequestOauthPasswordTokenResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)