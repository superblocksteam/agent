"""gRPC service implementation for the sandbox executor."""

from __future__ import annotations

from superblocks_types.worker.v1 import sandbox_executor_transport_pb2 as executor_pb2
from superblocks_types.worker.v1 import sandbox_executor_transport_pb2_grpc as executor_pb2_grpc
from src.executor import Executor
from src.superblocks import Object, loads
from src.variables.variable_client import VariableClient


class SandboxExecutorServicer(executor_pb2_grpc.SandboxExecutorTransportServiceServicer):
    """gRPC servicer that executes Python scripts."""

    def __init__(self):
        self.executor = Executor()

    def Execute(self, request, context):
        """Execute a Python script and return stdout, stderr, and exit code."""
        script = request.script
        context_json = request.context_json or "{}"
        timeout_ms = request.timeout_ms or 30000

        if not script.strip():
            return executor_pb2.ExecuteResponse(
                result="",
                stdout=[],
                stderr=[],
                exit_code=1,
                error="Empty script provided",
            )

        try:
            # Parse context JSON
            ctx = Object({})
            if context_json and context_json != "{}":
                ctx = loads(context_json)

            # Set up variable client
            var_client = None
            if request.variable_store_address and request.execution_id:
                var_client = VariableClient(
                    request.variable_store_address,
                    request.execution_id
                )

            # Get pre-computed superblocksFiles map (treePath -> remotePath)
            # This is a protobuf map field, convert to dict
            superblocks_files = dict(request.files) if request.files else {}

            result, stdout, stderr, exit_code = self.executor.run(
                script,
                ctx,
                timeout_ms,
                var_client,
                request.variables_json or "{}",
                superblocks_files=superblocks_files,
            )

            return executor_pb2.ExecuteResponse(
                result=result,
                stdout=stdout,
                stderr=stderr,
                exit_code=exit_code,
                error="",
            )

        except Exception as e:
            return executor_pb2.ExecuteResponse(
                result="",
                stdout=[],
                stderr=[],
                exit_code=-1,
                error=f"Execution error: {str(e)}",
            )
