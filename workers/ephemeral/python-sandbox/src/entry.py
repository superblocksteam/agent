#!/usr/bin/env python3
"""Entry point for the Python sandbox gRPC server."""

from concurrent import futures

import grpc

from superblocks_types.worker.v1 import sandbox_executor_transport_pb2_grpc as executor_pb2_grpc
from src.constants import (
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_MAX_WORKERS,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
    SUPERBLOCKS_WORKER_PROXY_ENABLED,
    SUPERBLOCKS_WORKER_PROXY_HOST,
    SUPERBLOCKS_WORKER_PROXY_PORT,
    SUPERBLOCKS_WORKER_HTTP_PROXY,
)
from src.service import SandboxExecutorServicer
from src.network_proxy import install_socket_proxy, get_proxy_config


def _setup_network_proxy() -> None:
    """Set up network proxy interception if enabled.

    This must be called early, before any network connections are made,
    to ensure all outbound traffic is properly intercepted.
    """
    if not SUPERBLOCKS_WORKER_PROXY_ENABLED:
        return

    # Determine proxy URL
    proxy_url = SUPERBLOCKS_WORKER_HTTP_PROXY
    if not proxy_url and SUPERBLOCKS_WORKER_PROXY_HOST:
        proxy_url = f"http://{SUPERBLOCKS_WORKER_PROXY_HOST}:{SUPERBLOCKS_WORKER_PROXY_PORT}"

    if not proxy_url:
        print("Warning: Proxy enabled but no proxy URL configured")
        return

    # Install socket-level interception - ALL traffic goes through proxy
    success = install_socket_proxy(proxy_url=proxy_url)

    if success:
        config = get_proxy_config()
        print(f"Socket-level proxy installed: {config['host']}:{config['port']}")
    else:
        print("Warning: Failed to install socket-level proxy")


def serve():
    """Start the gRPC server."""
    # Set up network proxy interception before any network connections
    _setup_network_proxy()

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_MAX_WORKERS),
        options=[
            ("grpc.max_receive_message_length", SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE),
            ("grpc.max_send_message_length", SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE),
        ],
    )
    executor_pb2_grpc.add_SandboxExecutorTransportServiceServicer_to_server(
        SandboxExecutorServicer(), server
    )

    server.add_insecure_port(f"[::]:{SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT}")
    server.start()

    print(f"Python gRPC server started on port {SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT}")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.stop(grace=5)


if __name__ == "__main__":
    serve()
