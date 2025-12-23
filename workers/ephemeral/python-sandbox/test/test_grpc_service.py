"""Tests for the gRPC service."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.service import SandboxExecutorServicer
from src.superblocks import Object


class TestSandboxExecutorServicer:
    @pytest.fixture
    def servicer(self):
        return SandboxExecutorServicer()

    @pytest.fixture
    def mock_context(self):
        return MagicMock()

    def test_execute_simple_script(self, servicer, mock_context):
        """Test executing a simple script via gRPC."""
        request = MagicMock()
        request.script = "return 1 + 1"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == 2
        assert response.exit_code == 0
        assert response.error == ""

    def test_execute_with_context(self, servicer, mock_context):
        """Test executing a script with context."""
        request = MagicMock()
        request.script = "return foo + bar"
        request.context_json = '{"foo": 10, "bar": 20}'
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == 30
        assert response.exit_code == 0

    def test_execute_empty_script(self, servicer, mock_context):
        """Test executing an empty script."""
        request = MagicMock()
        request.script = "   "
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert response.exit_code == 1
        assert response.error == "Empty script provided"

    def test_execute_with_stdout(self, servicer, mock_context):
        """Test that stdout is captured."""
        request = MagicMock()
        request.script = 'print("hello")\nreturn 123'
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == 123
        assert "hello" in response.stdout

    def test_execute_with_error(self, servicer, mock_context):
        """Test executing a script that raises an error."""
        request = MagicMock()
        request.script = "return undefined_variable"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert any("__EXCEPTION__" in line for line in response.stderr)
        assert response.exit_code == 1

    def test_execute_default_timeout(self, servicer, mock_context):
        """Test that default timeout is used when not specified."""
        request = MagicMock()
        request.script = "return 123"
        request.context_json = "{}"
        request.timeout_ms = 0  # Should use default
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == 123
        assert response.exit_code == 0

    def test_execute_nested_context(self, servicer, mock_context):
        """Test executing with nested context."""
        request = MagicMock()
        request.script = "return data.nested.value"
        request.context_json = '{"data": {"nested": {"value": 42}}}'
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == 42
        assert response.exit_code == 0

    def test_execute_returns_dict(self, servicer, mock_context):
        """Test returning a dictionary."""
        request = MagicMock()
        request.script = 'return {"result": "success", "count": 10}'
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        result = json.loads(response.result)
        assert result["result"] == "success"
        assert result["count"] == 10
        assert response.exit_code == 0

    def test_execute_returns_list(self, servicer, mock_context):
        """Test returning a list."""
        request = MagicMock()
        request.script = "return [1, 2, 3, 4, 5]"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == [1, 2, 3, 4, 5]
        assert response.exit_code == 0

    def test_execute_with_imports(self, servicer, mock_context):
        """Test executing with imports."""
        request = MagicMock()
        request.script = "import json\nreturn json.dumps({'key': 'value'})"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert json.loads(response.result) == '{"key": "value"}'
        assert response.exit_code == 0


class TestVariableClientIntegration:
    """Tests for variable client integration (mocked)."""

    @pytest.fixture
    def servicer(self):
        return SandboxExecutorServicer()

    @pytest.fixture
    def mock_context(self):
        return MagicMock()

    def test_execute_without_variable_client(self, servicer, mock_context):
        """Test executing without variable client (no address provided)."""
        request = MagicMock()
        request.script = "return 123"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = ""
        request.execution_id = ""
        request.variables_json = "{}"
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert response.exit_code == 0
