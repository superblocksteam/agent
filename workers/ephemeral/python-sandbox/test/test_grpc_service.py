"""Tests for the gRPC service."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.service import SandboxExecutorServicer
from src.superblocks import List, Object
from src.variables.variable_client import VariableClient


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

    @patch.object(VariableClient, 'get_many')
    @patch.object(VariableClient, 'flush')
    @patch.object(VariableClient, 'close')
    @patch.object(VariableClient, 'connect')
    def test_variable_dict_dot_notation_access(self, mock_connect, mock_close, mock_flush, mock_get_many, servicer, mock_context):
        """Test that variables from the variable store support dot notation access.

        This is a regression test for AGENT-1121: Python dict dot notation fails
        in sandboxed steps. Previously, variables retrieved from the variable store
        were plain dicts, so accessing `item.value.name` would fail with
        "'dict' object has no attribute 'name'".

        Now variables should be wrapped in Object instances that support dot notation.
        """
        # Mock get_many to return an Object instance (which is what the real method does now)
        mock_get_many.return_value = [
            Object({"name": "test_item", "value": {"count": 42, "status": "active"}})
        ]

        request = MagicMock()
        # Test dot notation access on the variable's value (simulating item.value.count)
        request.script = "return item.get().value.count"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = "localhost:50052"
        request.execution_id = "test-exec-123"
        request.variables_json = json.dumps({
            "item": {"key": "loop_item", "type": "TYPE_SIMPLE", "mode": "MODE_READ"}
        })
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert response.exit_code == 0, f"Execution failed: {response.stderr}"
        assert json.loads(response.result) == 42

    @patch.object(VariableClient, 'get_many')
    @patch.object(VariableClient, 'flush')
    @patch.object(VariableClient, 'close')
    @patch.object(VariableClient, 'connect')
    def test_variable_nested_dot_notation_access(self, mock_connect, mock_close, mock_flush, mock_get_many, servicer, mock_context):
        """Test deeply nested dot notation access on variables.

        Verifies that deeply nested dict values can be accessed via dot notation,
        which is the common pattern for accessing data like item.value.nested.name.
        """
        # Mock get_many to return deeply nested Object instances
        mock_get_many.return_value = [
            Object({
                "data": {
                    "user": {
                        "profile": {
                            "name": "John Doe",
                            "settings": {"theme": "dark"}
                        }
                    }
                }
            })
        ]

        request = MagicMock()
        request.script = "return item.get().data.user.profile.settings.theme"
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = "localhost:50052"
        request.execution_id = "test-exec-456"
        request.variables_json = json.dumps({
            "item": {"key": "my_var", "type": "TYPE_SIMPLE", "mode": "MODE_READ"}
        })
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert response.exit_code == 0, f"Execution failed: {response.stderr}"
        assert json.loads(response.result) == "dark"

    @patch.object(VariableClient, 'get_many')
    @patch.object(VariableClient, 'flush')
    @patch.object(VariableClient, 'close')
    @patch.object(VariableClient, 'connect')
    def test_variable_loop_iteration_dot_notation(self, mock_connect, mock_close, mock_flush, mock_get_many, servicer, mock_context):
        """Test dot notation access when iterating over a list of objects.

        This simulates the common pattern of looping over items and accessing
        nested properties via dot notation.
        """
        # Mock get_many to return a list of Objects with nested dicts
        mock_get_many.return_value = [
            List([
                Object({"value": {"name": "item1", "count": 10}}),
                Object({"value": {"name": "item2", "count": 20}}),
                Object({"value": {"name": "item3", "count": 30}}),
            ])
        ]

        request = MagicMock()
        # Test iterating and using dot notation
        request.script = """
items = data.get()
result = []
for i in range(len(items)):
    item = items[i]
    result.append(item.value.name)
return result
"""
        request.context_json = "{}"
        request.timeout_ms = 5000
        request.variable_store_address = "localhost:50052"
        request.execution_id = "test-exec-789"
        request.variables_json = json.dumps({
            "data": {"key": "items_list", "type": "TYPE_SIMPLE", "mode": "MODE_READ"}
        })
        request.files = {}

        response = servicer.Execute(request, mock_context)

        assert response.exit_code == 0, f"Execution failed: {response.stderr}"
        assert json.loads(response.result) == ["item1", "item2", "item3"]
