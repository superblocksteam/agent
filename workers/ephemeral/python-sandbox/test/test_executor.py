"""Tests for the Executor class."""

import json
import os
from unittest.mock import MagicMock, patch

import pytest

from src.executor import Executor
from src.superblocks import Object
from src.variables.variable import SimpleVariable, AdvancedVariable
from src.variables.variable_client import VariableClient


class TestExecutor:
    @pytest.fixture
    def executor(self):
        return Executor()

    def test_simple_return(self, executor):
        """Test basic script execution with a simple return."""
        result, stdout, stderr, exit_code = executor.run(
            code="return 1 + 1",
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == 2
        assert exit_code == 0
        assert stderr == []

    def test_return_string(self, executor):
        """Test returning a string."""
        result, stdout, stderr, exit_code = executor.run(
            code='return "hello world"',
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == "hello world"
        assert exit_code == 0

    def test_return_dict(self, executor):
        """Test returning a dictionary."""
        result, stdout, stderr, exit_code = executor.run(
            code='return {"foo": "bar", "num": 123}',
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == {"foo": "bar", "num": 123}
        assert exit_code == 0

    def test_return_list(self, executor):
        """Test returning a list."""
        result, stdout, stderr, exit_code = executor.run(
            code="return [1, 2, 3, 4, 5]",
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == [1, 2, 3, 4, 5]
        assert exit_code == 0

    def test_return_none(self, executor):
        """Test returning None."""
        result, stdout, stderr, exit_code = executor.run(
            code="return None",
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) is None
        assert exit_code == 0

    def test_context_access(self, executor):
        """Test accessing context variables."""
        context = Object({"foo": 10, "bar": 20})
        result, stdout, stderr, exit_code = executor.run(
            code="return foo + bar",
            context=context,
            timeout_ms=5000,
        )
        assert json.loads(result) == 30
        assert exit_code == 0

    def test_nested_context_access(self, executor):
        """Test accessing nested context variables."""
        context = Object({"data": {"nested": {"value": 42}}})
        result, stdout, stderr, exit_code = executor.run(
            code="return data.nested.value",
            context=context,
            timeout_ms=5000,
        )
        assert json.loads(result) == 42
        assert exit_code == 0

    def test_stdout_capture(self, executor):
        """Test that stdout is captured."""
        result, stdout, stderr, exit_code = executor.run(
            code='print("hello")\nprint("world")\nreturn 123',
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == 123
        assert "hello" in stdout
        assert "world" in stdout
        assert exit_code == 0

    def test_syntax_error(self, executor):
        """Test handling of syntax errors."""
        result, stdout, stderr, exit_code = executor.run(
            code="return def invalid syntax",
            context=Object({}),
            timeout_ms=5000,
        )
        assert result == ""
        # Syntax errors are caught and reported in stderr
        assert any("__EXCEPTION__" in line for line in stderr) or any("SyntaxError" in line for line in stderr)
        assert exit_code == 1

    def test_runtime_error(self, executor):
        """Test handling of runtime errors."""
        result, stdout, stderr, exit_code = executor.run(
            code="return undefined_variable",
            context=Object({}),
            timeout_ms=5000,
        )
        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)
        assert exit_code == 1

    def test_division_by_zero(self, executor):
        """Test handling of division by zero."""
        result, stdout, stderr, exit_code = executor.run(
            code="return 1 / 0",
            context=Object({}),
            timeout_ms=5000,
        )
        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)
        assert exit_code == 1

    def test_import_allowed(self, executor):
        """Test that allowed imports work."""
        result, stdout, stderr, exit_code = executor.run(
            code="import json\nreturn json.dumps({'foo': 'bar'})",
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == '{"foo": "bar"}'
        assert exit_code == 0

    def test_multiline_script(self, executor):
        """Test multiline script execution."""
        code = """
x = 10
y = 20
z = x + y
return z * 2
"""
        result, stdout, stderr, exit_code = executor.run(
            code=code,
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == 60
        assert exit_code == 0

    def test_function_definition(self, executor):
        """Test defining and calling functions."""
        code = """
def add(a, b):
    return a + b

return add(5, 3)
"""
        result, stdout, stderr, exit_code = executor.run(
            code=code,
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == 8
        assert exit_code == 0

    def test_list_comprehension(self, executor):
        """Test list comprehension."""
        result, stdout, stderr, exit_code = executor.run(
            code="return [x * 2 for x in range(5)]",
            context=Object({}),
            timeout_ms=5000,
        )
        assert json.loads(result) == [0, 2, 4, 6, 8]
        assert exit_code == 0

    def test_bytes_encoding(self, executor):
        """Test that bytes are encoded correctly."""
        result, stdout, stderr, exit_code = executor.run(
            code='return b"hello"',
            context=Object({}),
            timeout_ms=5000,
        )
        parsed = json.loads(result)
        assert parsed["type"] == "Buffer"
        assert parsed["data"] == [104, 101, 108, 108, 111]
        assert exit_code == 0


class TestSimpleVariable:
    def test_get_value(self):
        """Test getting a simple variable value."""
        client = MagicMock()
        var = SimpleVariable("key", 123, client, allow_write=False)
        assert var.get() == 123

    def test_set_value_allowed(self):
        """Test setting a simple variable when allowed."""
        client = MagicMock()
        var = SimpleVariable("key", 123, client, allow_write=True)
        var.set(456)
        assert var.value == 456
        client.write_buffer.assert_called_once_with("key", 456)

    def test_set_value_forbidden(self):
        """Test setting a simple variable when not allowed."""
        client = MagicMock()
        var = SimpleVariable("key", 123, client, allow_write=False)
        with pytest.raises(Exception, match="Variable write is forbidden"):
            var.set(456)


class TestAdvancedVariable:
    def test_get_value(self):
        """Test getting an advanced variable value."""
        client = MagicMock()
        client.get.return_value = 123
        var = AdvancedVariable("key", client, allow_write=False)
        assert var.get() == 123
        client.get.assert_called_once_with("key")

    def test_set_value_allowed(self):
        """Test setting an advanced variable when allowed."""
        client = MagicMock()
        var = AdvancedVariable("key", client, allow_write=True)
        var.set(456)
        client.set.assert_called_once_with("key", 456)

    def test_set_value_forbidden(self):
        """Test setting an advanced variable when not allowed."""
        client = MagicMock()
        var = AdvancedVariable("key", client, allow_write=False)
        with pytest.raises(Exception, match="Variable write is forbidden"):
            var.set(456)


class TestEnvironmentRestriction:
    @pytest.fixture
    def executor(self):
        return Executor()

    def test_environment_is_restricted(self, executor):
        """Test that environment variables are restricted during execution."""
        os.environ["TEST_SECRET"] = "secret_value"
        os.environ["SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST"] = ""

        result, stdout, stderr, exit_code = executor.run(
            code="""
import os
return dict(os.environ)
""",
            context=Object({}),
            timeout_ms=5000,
        )

        env_dict = json.loads(result)
        assert "TEST_SECRET" not in env_dict
        assert exit_code == 0

    def test_allowed_env_vars_are_present(self, executor):
        """Test that allowed environment variables are present."""
        os.environ["ALLOWED_VAR"] = "allowed_value"
        os.environ["SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST"] = "ALLOWED_VAR"

        result, stdout, stderr, exit_code = executor.run(
            code="""
import os
return dict(os.environ)
""",
            context=Object({}),
            timeout_ms=5000,
        )

        env_dict = json.loads(result)
        assert env_dict.get("ALLOWED_VAR") == "allowed_value"
        assert exit_code == 0
