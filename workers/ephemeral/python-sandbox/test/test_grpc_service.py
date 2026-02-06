"""Tests for the gRPC service."""

import json
from unittest.mock import MagicMock, patch

import pytest
from google.protobuf import json_format

from src.service import SandboxTransportServicer
from src.superblocks import List, Object
from src.variables.variable_client import VariableClient
from superblocks_types.worker.v1 import sandbox_transport_pb2 as transport_pb2


def _plugin_props(script, context_json="{}", variables_json="{}", execution_id=""):
    """Build the plugin_props dict that MessageToDict(request.props) would return."""
    return {
        "actionConfiguration": {"body": script},
        "executionId": execution_id,
        "bindingKeys": [],
        "variables": json.loads(variables_json) if variables_json else {},
        "$fileServerUrl": "",
        "$flagWorker": "",
        "files": [],
    }


def _result_from_response(response):
    """Extract Python result from ExecuteResponse.output.output (struct Value)."""
    if not response.output.output.ListFields():
        return None
    # Value serializes to JSON as the wrapped value (e.g. 2, "hello", {...})
    return json.loads(json_format.MessageToJson(response.output.output))


def _stdout_from_response(response):
    """Extract stdout lines from ExecuteResponse (output.log)."""
    return list(response.output.log)


def _stderr_from_response(response):
    """Extract stderr lines from ExecuteResponse (structuredLog with LEVEL_ERROR)."""
    return [
        entry.message
        for entry in response.structuredLog
        if entry.level == transport_pb2.StructuredLog.LEVEL_ERROR
    ]


def _exit_code_from_response(response):
    """Derive exit code: 1 if error set, else 0."""
    return 1 if response.error and response.error.message else 0


class TestSandboxTransportServicer:
    @pytest.fixture
    def servicer(self):
        return SandboxTransportServicer()

    @pytest.fixture
    def mock_context(self):
        return MagicMock()

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_simple_script(self, mock_message_to_dict, servicer, mock_context):
        """Test executing a simple script via gRPC."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("return 1 + 1")

        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == 2
        assert _exit_code_from_response(response) == 0
        assert response.error.message == ""

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_with_context(self, mock_message_to_dict, servicer, mock_context):
        """Test executing a script with context."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        # Context comes from binding_keys + store; use binding_keys and mock read
        mock_message_to_dict.return_value = _plugin_props(
            "return foo + bar",
            execution_id="",
        )
        mock_message_to_dict.return_value["bindingKeys"] = [
            {"type": "global", "key": "foo"},
            {"type": "global", "key": "bar"},
        ]
        mock_message_to_dict.return_value["actionConfiguration"] = {
            "body": "return foo + bar",
            "foo": True,
            "bar": True,
        }

        with patch.object(VariableClient, "connect"):
            with patch.object(
                VariableClient,
                "read",
                return_value=([10, 20], 0),
            ):
                with patch.object(VariableClient, "close"):
                    with patch.object(VariableClient, "flush"):
                        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == 30
        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_empty_script(self, mock_message_to_dict, servicer, mock_context):
        """Test executing an empty script."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("   ")

        response = await servicer.Execute(request, mock_context)

        # Empty script returns empty output, no error
        assert _exit_code_from_response(response) == 0
        assert response.output.log == []

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_with_stdout(self, mock_message_to_dict, servicer, mock_context):
        """Test that stdout is captured."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props('print("hello")\nreturn 123')

        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == 123
        assert "hello" in _stdout_from_response(response)

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_with_error(self, mock_message_to_dict, servicer, mock_context):
        """Test executing a script that raises an error."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("return undefined_variable")

        response = await servicer.Execute(request, mock_context)

        stderr = _stderr_from_response(response)
        assert any("__EXCEPTION__" in line or "undefined_variable" in line for line in stderr)
        assert _exit_code_from_response(response) == 1

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_default_timeout(self, mock_message_to_dict, servicer, mock_context):
        """Test that execution works (timeout not enforced in-process)."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("return 123")

        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == 123
        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_nested_context(self, mock_message_to_dict, servicer, mock_context):
        """Test executing with nested context."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props(
            "return data.nested.value",
            context_json='{"data": {"nested": {"value": 42}}}',
        )
        mock_message_to_dict.return_value["bindingKeys"] = [
            {"type": "global", "key": "data"},
        ]
        mock_message_to_dict.return_value["actionConfiguration"] = {
            "body": "return data.nested.value",
            "data": True,
        }

        with patch.object(VariableClient, "connect"):
            with patch.object(
                VariableClient,
                "read",
                return_value=([{"nested": {"value": 42}}], 0),
            ):
                with patch.object(VariableClient, "close"):
                    with patch.object(VariableClient, "flush"):
                        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == 42
        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_returns_dict(self, mock_message_to_dict, servicer, mock_context):
        """Test returning a dictionary."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props(
            'return {"result": "success", "count": 10}',
        )

        response = await servicer.Execute(request, mock_context)

        result = _result_from_response(response)
        assert result["result"] == "success"
        assert result["count"] == 10
        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_returns_list(self, mock_message_to_dict, servicer, mock_context):
        """Test returning a list."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("return [1, 2, 3, 4, 5]")

        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == [1, 2, 3, 4, 5]
        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_with_imports(self, mock_message_to_dict, servicer, mock_context):
        """Test executing with imports."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props(
            "import json\nreturn json.dumps({'key': 'value'})",
        )

        response = await servicer.Execute(request, mock_context)

        assert _result_from_response(response) == '{"key": "value"}'
        assert _exit_code_from_response(response) == 0


class TestVariableClientIntegration:
    """Tests for variable client integration (mocked)."""

    @pytest.fixture
    def servicer(self):
        return SandboxTransportServicer()

    @pytest.fixture
    def mock_context(self):
        return MagicMock()

    @pytest.mark.asyncio
    @patch("src.service.json_format.MessageToDict")
    async def test_execute_without_variable_client(
        self, mock_message_to_dict, servicer, mock_context
    ):
        """Test executing without variable client (no address provided)."""
        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = ""
        request.variable_store_address = ""
        mock_message_to_dict.return_value = _plugin_props("return 123")

        response = await servicer.Execute(request, mock_context)

        assert _exit_code_from_response(response) == 0

    @pytest.mark.asyncio
    @patch.object(VariableClient, "read")
    @patch.object(VariableClient, "flush")
    @patch.object(VariableClient, "close")
    @patch.object(VariableClient, "connect")
    @patch("src.service.json_format.MessageToDict")
    async def test_variable_dict_dot_notation_access(
        self,
        mock_message_to_dict,
        mock_connect,
        mock_close,
        mock_flush,
        mock_read,
        servicer,
        mock_context,
    ):
        """Test that variables from the variable store support dot notation access.

        Regression test: variables should be wrapped in Object instances that support
        dot notation (e.g. item.value.name).
        """
        mock_read.return_value = (
            [Object({"name": "test_item", "value": {"count": 42, "status": "active"}})],
            0,
        )

        request = MagicMock()
        request.script = "return item.get().value.count"
        request.metadata.pluginName = "python"
        request.props.execution_id = "test-exec-123"
        request.variable_store_address = "localhost:50052"
        mock_message_to_dict.return_value = _plugin_props(
            "return item.get().value.count",
            variables_json=json.dumps({
                "item": {"key": "loop_item", "type": "TYPE_SIMPLE", "mode": "MODE_READ"},
            }),
            execution_id="test-exec-123",
        )

        response = await servicer.Execute(request, mock_context)

        assert _exit_code_from_response(response) == 0, _stderr_from_response(response)
        assert _result_from_response(response) == 42

    @pytest.mark.asyncio
    @patch.object(VariableClient, "read")
    @patch.object(VariableClient, "flush")
    @patch.object(VariableClient, "close")
    @patch.object(VariableClient, "connect")
    @patch("src.service.json_format.MessageToDict")
    async def test_variable_nested_dot_notation_access(
        self,
        mock_message_to_dict,
        mock_connect,
        mock_close,
        mock_flush,
        mock_read,
        servicer,
        mock_context,
    ):
        """Test deeply nested dot notation access on variables."""
        mock_read.return_value = (
            [
                Object({
                    "data": {
                        "user": {
                            "profile": {
                                "name": "John Doe",
                                "settings": {"theme": "dark"},
                            }
                        }
                    }
                })
            ],
            0,
        )

        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = "test-exec-456"
        request.variable_store_address = "localhost:50052"
        mock_message_to_dict.return_value = _plugin_props(
            "return item.get().data.user.profile.settings.theme",
            variables_json=json.dumps({
                "item": {"key": "my_var", "type": "TYPE_SIMPLE", "mode": "MODE_READ"},
            }),
            execution_id="test-exec-456",
        )

        response = await servicer.Execute(request, mock_context)

        assert _exit_code_from_response(response) == 0, _stderr_from_response(response)
        assert _result_from_response(response) == "dark"

    @pytest.mark.asyncio
    @patch.object(VariableClient, "read")
    @patch.object(VariableClient, "flush")
    @patch.object(VariableClient, "close")
    @patch.object(VariableClient, "connect")
    @patch("src.service.json_format.MessageToDict")
    async def test_variable_loop_iteration_dot_notation(
        self,
        mock_message_to_dict,
        mock_connect,
        mock_close,
        mock_flush,
        mock_read,
        servicer,
        mock_context,
    ):
        """Test dot notation when iterating over a list of objects."""
        mock_read.return_value = (
            [
                List([
                    Object({"value": {"name": "item1", "count": 10}}),
                    Object({"value": {"name": "item2", "count": 20}}),
                    Object({"value": {"name": "item3", "count": 30}}),
                ])
            ],
            0,
        )

        request = MagicMock()
        request.metadata.pluginName = "python"
        request.props.execution_id = "test-exec-789"
        request.variable_store_address = "localhost:50052"
        mock_message_to_dict.return_value = _plugin_props(
            """
items = data.get()
result = []
for i in range(len(items)):
    item = items[i]
    result.append(item.value.name)
return result
""",
            variables_json=json.dumps({
                "data": {"key": "items_list", "type": "TYPE_SIMPLE", "mode": "MODE_READ"},
            }),
            execution_id="test-exec-789",
        )

        response = await servicer.Execute(request, mock_context)

        assert _exit_code_from_response(response) == 0, _stderr_from_response(response)
        assert _result_from_response(response) == ["item1", "item2", "item3"]
