"""Subprocess integration test: verify SIGTERM triggers graceful shutdown.

This test starts main.py as a real process, sends SIGTERM, and verifies that:
  1. Health() returns STATUS_READY before the signal.
  2. After SIGTERM, the server either returns STATUS_DRAINING or rejects new
     connections (both indicate graceful shutdown in progress).
  3. The process exits cleanly within the grace period.

Unlike the unit tests in test_grpc_service.py these tests exercise the actual
asyncio signal handler wiring in main.py — mocks cannot prove that.
"""

from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

import grpc
import pytest

from superblocks_types.worker.v1 import sandbox_transport_pb2 as transport_pb2

SANDBOX_ROOT = Path(__file__).parent.parent
# Short grace so tests finish quickly. The sandbox exits after in-flight work
# completes (or this many milliseconds, whichever is first).
_TEST_GRACE_MS = 2000


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def _health_call(channel):
    """Raw unary call for Health — avoids the generated stub's _registered_method kwarg
    which requires grpcio >= 1.67 but the project pins 1.59."""
    method = channel.unary_unary(
        "/worker.v1.SandboxTransportService/Health",
        request_serializer=transport_pb2.HealthRequest.SerializeToString,
        response_deserializer=transport_pb2.HealthResponse.FromString,
    )
    return method(transport_pb2.HealthRequest())


def _wait_healthy(channel, *, timeout: float = 15.0) -> None:
    deadline = time.monotonic() + timeout
    while True:
        try:
            resp = _health_call(channel)
            if resp.status == transport_pb2.HealthResponse.STATUS_READY:
                return
        except grpc.RpcError:
            pass
        if time.monotonic() > deadline:
            raise TimeoutError("sandbox did not become healthy within timeout")
        time.sleep(0.15)


@pytest.fixture
def sandbox_process():
    """Start main.py on a free port; yield (process, grpc_channel); clean up after."""
    port = _free_port()
    gen_dir = str(SANDBOX_ROOT / "gen")
    existing_pythonpath = os.environ.get("PYTHONPATH", "")
    pythonpath = f"{gen_dir}:{existing_pythonpath}" if existing_pythonpath else gen_dir
    env = {
        **os.environ,
        "PYTHONPATH": pythonpath,
        "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT": str(port),
        "SUPERBLOCKS_WORKER_SANDBOX_GRACEFUL_SHUTDOWN_TIMEOUT_MS": str(_TEST_GRACE_MS),
        "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_FORK_EXECUTION": "false",
    }
    proc = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=str(SANDBOX_ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    channel = grpc.insecure_channel(f"localhost:{port}")
    yield proc, channel
    channel.close()
    if proc.poll() is None:
        proc.kill()
        proc.wait(timeout=5)


def test_health_ready_then_draining_or_rejected_after_sigterm(sandbox_process):
    """SIGTERM → Health() returns STATUS_DRAINING or server stops accepting requests.

    After SIGTERM, the sandbox:
    1. Marks itself as draining (Health() would return STATUS_DRAINING)
    2. Calls server.stop(grace) which stops accepting NEW requests

    Depending on timing, our test call may:
    - Get STATUS_DRAINING (call arrived before server.stop)
    - Get CANCELLED (call was in-flight when server.stop was called)
    - Get UNAVAILABLE/connection refused (server already stopped accepting)

    All three outcomes indicate correct graceful shutdown behavior.
    """
    proc, channel = sandbox_process

    _wait_healthy(channel)

    proc.send_signal(signal.SIGTERM)

    deadline = time.monotonic() + (_TEST_GRACE_MS / 1000) + 3
    shutdown_detected = False
    while time.monotonic() < deadline:
        try:
            resp = _health_call(channel)
            if resp.status == transport_pb2.HealthResponse.STATUS_DRAINING:
                shutdown_detected = True
                break
            # If we still get STATUS_READY, server hasn't processed SIGTERM yet
        except grpc.RpcError as e:
            # CANCELLED or UNAVAILABLE both indicate server is shutting down
            if e.code() in (grpc.StatusCode.CANCELLED, grpc.StatusCode.UNAVAILABLE):
                shutdown_detected = True
                break
        time.sleep(0.1)

    assert shutdown_detected, "Health() never indicated shutdown after SIGTERM"


def test_process_exits_cleanly_after_sigterm(sandbox_process):
    """Process must exit on its own within the grace period after SIGTERM."""
    proc, channel = sandbox_process

    _wait_healthy(channel)
    channel.close()

    proc.send_signal(signal.SIGTERM)

    try:
        exit_code = proc.wait(timeout=(_TEST_GRACE_MS / 1000) + 5)
    except subprocess.TimeoutExpired:
        proc.kill()
        pytest.fail("process did not exit within grace period after SIGTERM")

    assert exit_code == 0, f"process exited with non-zero code {exit_code}"
