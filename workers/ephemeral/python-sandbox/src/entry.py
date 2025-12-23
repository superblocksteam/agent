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
)
from src.service import SandboxExecutorServicer


def serve():
    """Start the gRPC server."""
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
