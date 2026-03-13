#!/usr/bin/env python3
"""Entry point for the Python sandbox gRPC server."""

import asyncio
import grpc

from superblocks_types.worker.v1 import sandbox_transport_pb2_grpc as transport_pb2_grpc
from src.constants import (
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
)
from src.service import SandboxTransportServicer


async def serve():
    """Start the gRPC server."""
    server = grpc.aio.server(
        options=[
            ("grpc.max_receive_message_length", SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE),
            ("grpc.max_send_message_length", SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE),
            ("grpc.keepalive_time_ms", 10000),
            ("grpc.keepalive_timeout_ms", 5000),
            ("grpc.keepalive_permit_without_calls", 1),
            ("grpc.http2.min_recv_ping_interval_without_data_ms", 5000),
        ],
    )
    transport_pb2_grpc.add_SandboxTransportServiceServicer_to_server(
        SandboxTransportServicer(), server
    )

    server.add_insecure_port(f"[::]:{SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT}")
    await server.start()

    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        await server.stop(grace=5)


if __name__ == "__main__":
    asyncio.run(serve())
