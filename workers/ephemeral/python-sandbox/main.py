#!/usr/bin/env python3
"""Python gRPC server that executes Python scripts with full sandbox support."""

import asyncio
import multiprocessing
import signal

import grpc

from superblocks_types.worker.v1 import sandbox_transport_pb2_grpc as transport_pb2_grpc
from src.constants import (
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT,
    SUPERBLOCKS_WORKER_SANDBOX_GRACEFUL_SHUTDOWN_TIMEOUT_MS,
)
from src.service import SandboxTransportServicer


async def serve():
    """Start the gRPC server."""
    servicer = SandboxTransportServicer()
    server = grpc.aio.server(
        options=[
            ("grpc.max_receive_message_length", SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_REQUEST_SIZE),
            ("grpc.max_send_message_length", SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_MAX_RESPONSE_SIZE),
        ],
    )
    transport_pb2_grpc.add_SandboxTransportServiceServicer_to_server(servicer, server)

    server.add_insecure_port(f"[::]:{SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT}")
    await server.start()

    loop = asyncio.get_event_loop()

    def _on_signal(sig: signal.Signals) -> None:
        grace_seconds = SUPERBLOCKS_WORKER_SANDBOX_GRACEFUL_SHUTDOWN_TIMEOUT_MS / 1000
        print(f"received {sig.name}, starting graceful shutdown ({grace_seconds}s grace)", flush=True)
        # Mark draining immediately so the task-manager stops routing new work
        # before the gRPC server stops accepting new RPCs.
        servicer.mark_shutting_down()
        # stop(grace=N): reject new RPCs immediately, allow in-flight up to N seconds.
        loop.create_task(server.stop(grace=grace_seconds))

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _on_signal, sig)

    await server.wait_for_termination()


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
