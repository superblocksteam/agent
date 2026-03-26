#!/usr/bin/env python3
"""Python gRPC server that executes Python scripts with full sandbox support."""

import asyncio
import multiprocessing

import grpc

from superblocks_types.worker.v1 import sandbox_transport_pb2_grpc as transport_pb2_grpc
from src.constants import (
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
)
from src.service import SandboxTransportServicer


async def serve():
    """Start the gRPC server."""
    server = grpc.aio.server(
        options=[
            ("grpc.max_receive_message_length", SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE),
            ("grpc.max_send_message_length", SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE),
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
    # Start the forkserver daemon while still single-threaded, before gRPC
    # creates any polling threads. The daemon is forked from the current
    # process at this point: all application modules are warm in memory
    # (fast COW copies for children) but no gRPC server threads or asyncio
    # event loop exist yet. ForkingExecutor calls later fork from this clean
    # daemon instead of from the live gRPC+asyncio process, avoiding
    # deadlocks caused by inherited thread-held locks (malloc, asyncio,
    # gRPC polling internals).
    _p = multiprocessing.get_context("forkserver").Process(target=int)
    _p.start()
    _p.join()

    asyncio.run(serve())
