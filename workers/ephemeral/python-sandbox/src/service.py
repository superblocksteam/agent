"""gRPC service implementation for the sandbox transport."""

from __future__ import annotations

from google.protobuf import duration_pb2, json_format, struct_pb2, timestamp_pb2

from src.log import error
from src.plugin import PythonPlugin
from src.variables.variable_client import VariableClient
from superblocks_types.api.v1 import event_pb2 as api_event_pb2
from superblocks_types.common.v1 import errors_pb2 as errors_pb2
from superblocks_types.transport.v1 import transport_pb2 as transport_v1_pb2
from superblocks_types.worker.v1 import sandbox_transport_pb2 as transport_pb2
from superblocks_types.worker.v1 import sandbox_transport_pb2_grpc as transport_pb2_grpc


class SandboxTransportServicer(transport_pb2_grpc.SandboxTransportServiceServicer):
    """gRPC servicer that handles sandbox transport requests."""

    def __init__(self):
        self.plugin = PythonPlugin()

    async def Execute(self, request: transport_pb2.ExecuteRequest, context) -> transport_pb2.ExecuteResponse:
        """Execute a Python script and return stdout, stderr, and exit code."""
        if request.metadata.pluginName != "python":
            raise Exception(f"Unknown plugin: {request.metadata.pluginName}")

        kv_store = VariableClient(
            address=request.variable_store_address,
            execution_id=request.props.execution_id,
        )

        try:
            kv_store.connect()
            # Execute the request
            execution_output, stdout, stderr = await self.plugin.execute(
                plugin_props=json_format.MessageToDict(request.props),
                variable_client=kv_store,
            )

            execute_response = self._execution_output_to_proto(execution_output)
            execute_response.structuredLog.extend(self._create_structured_logs(stdout, stderr))
            return execute_response
        except Exception as e:
            error(f"Error executing Python script: {e}", exc_info=True)
            return self._execution_output_to_proto({
                "error": str(e),
            })
        finally:
            kv_store.close("done")

    def Stream(self, request, context) -> None:
        pass

    def Metadata(self, request, context) -> transport_v1_pb2.Response.Data.Data:
        return transport_v1_pb2.Response.Data.Data()

    def Test(self, request, context) -> None:
        pass

    def PreDelete(self, request, context) -> None:
        pass

    def _execution_output_to_proto(self, output: dict) -> transport_pb2.ExecuteResponse:
        """Convert an ExecutionOutput-like dict to ExecuteResponse proto."""
        output_old = self._create_output_old(output)
        err_proto = self._create_error(output.get("error"))

        # startTime: optional Timestamp from startTimeUtc (ISO string or similar)
        start_time_proto = None
        start_time_utc = output.get("startTimeUtc", None)
        if start_time_utc is not None:
            start_time_proto = timestamp_pb2.Timestamp(
                seconds=int(start_time_utc) // 1000,
                nanos=(int(start_time_utc) % 1000) * 1_000_000
            )

        # executionTime: number (milliseconds) -> Duration
        execution_time_proto = None
        execution_time_ms = output.get("executionTime", None)
        if execution_time_ms is not None:
            execution_time_proto = duration_pb2.Duration(
                seconds=execution_time_ms // 1000,
                nanos=(execution_time_ms % 1000) * 1_000_000
            )

        return transport_pb2.ExecuteResponse(
            output=output_old,
            error=err_proto,
            startTime=start_time_proto,
            executionTime=execution_time_proto,
        )

    def _create_output_old(self, output: dict) -> api_event_pb2.OutputOld:
        """Build api.v1.OutputOld from an ExecutionOutput-like dict."""
        output_old = api_event_pb2.OutputOld()

        output_data = output.get("output")
        if output_data is not None:
            output_value = struct_pb2.Value()
            json_format.ParseDict(output_data, output_value)
            output_old.output.CopyFrom(output_value)

        output_old.log.extend(output.get("log", []))
        output_old.request = str(output.get("request", ""))

        return output_old

    def _create_structured_logs(
        self,
        stdout: list[str],
        stderr: list[str],
    ) -> list[transport_pb2.StructuredLog]:
        """Build a list of StructuredLog entries from stdout and stderr lists."""
        result = [transport_pb2.StructuredLog(
            message=line,
            level=transport_pb2.StructuredLog.LEVEL_INFO
        ) for line in stdout]

        result.extend([transport_pb2.StructuredLog(
            message=line,
            level=transport_pb2.StructuredLog.LEVEL_ERROR
        ) for line in stderr])

        return result

    def _create_error(self, message: str | None) -> errors_pb2.Error | None:
        """Build common.v1.Error from a message string, or None if empty."""
        if message is None or not str(message).strip():
            return None

        return errors_pb2.Error(
            message=str(message),
            code=errors_pb2.Code.CODE_UNSPECIFIED,
        )
