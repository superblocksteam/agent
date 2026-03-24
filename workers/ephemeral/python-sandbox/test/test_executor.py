"""Tests for the Executor and ForkingExecutor classes."""

import asyncio
import json
import os
from unittest.mock import MagicMock, patch

import pytest

from src.executor import Executor, ForkingExecutor
from src.superblocks import Object
from src.variables.constants import VariableMode, VariableType
from src.variables.variable import AdvancedVariable, SimpleVariable
from src.variables.variable_client import VariableClient


class TestExecutor:
    @pytest.fixture
    def executor(self):
        return Executor()

    def test_asyncio_run_in_user_code_on_worker_thread(self, executor):
        """asyncio.run in user code without a host running loop (e.g. asyncio.to_thread worker)."""
        code = """
import asyncio
async def f():
    return 42
return asyncio.run(f())
"""
        result, stdout, stderr = executor.run(
            code=code.strip(),
            context=Object({}),
        )
        assert json.loads(result) == 42
        assert stderr == []

    @pytest.mark.asyncio
    async def test_asyncio_run_in_user_code_via_to_thread_like_plugin(self, executor):
        """Same threading model as PythonPlugin.execute (asyncio.to_thread + executor.run)."""
        code = """
import asyncio
async def f():
    return 42
return asyncio.run(f())
"""
        result, stdout, stderr = await asyncio.to_thread(
            executor.run,
            code=code.strip(),
            context=Object({}),
        )
        assert json.loads(result) == 42
        assert stderr == []

    @pytest.mark.asyncio
    async def test_asyncio_run_directly_in_async_context(self, executor):
        """Exercises nest_asyncio.apply() — executor.run from a coroutine (running loop in thread)."""
        code = """
import asyncio
async def f():
    return 42
return asyncio.run(f())
"""
        result, _, stderr = executor.run(
            code=code.strip(),
            context=Object({}),
        )
        assert json.loads(result) == 42
        assert stderr == []

    @pytest.mark.asyncio
    async def test_sync_user_code_after_nest_asyncio_may_apply(self, executor):
        """Sync executions still work after nest_asyncio.apply() may have patched the loop."""
        code_async = """
import asyncio
async def f():
    return 0
return asyncio.run(f())
"""
        executor.run(code=code_async.strip(), context=Object({}))
        result, _, stderr = executor.run(
            code="return 1 + 1",
            context=Object({}),
        )
        assert json.loads(result) == 2
        assert stderr == []

    def test_simple_return(self, executor):
        """Test basic script execution with a simple return."""
        result, stdout, stderr = executor.run(
            code="return 1 + 1",
            context=Object({}),
        )
        assert json.loads(result) == 2
        assert stderr == []

    def test_return_string(self, executor):
        """Test returning a string."""
        result, stdout, stderr = executor.run(
            code='return "hello world"',
            context=Object({}),
        )
        assert json.loads(result) == "hello world"

    def test_return_dict(self, executor):
        """Test returning a dictionary."""
        result, stdout, stderr = executor.run(
            code='return {"foo": "bar", "num": 123}',
            context=Object({}),
        )
        assert json.loads(result) == {"foo": "bar", "num": 123}

    def test_return_list(self, executor):
        """Test returning a list."""
        result, stdout, stderr = executor.run(
            code="return [1, 2, 3, 4, 5]",
            context=Object({}),
        )
        assert json.loads(result) == [1, 2, 3, 4, 5]

    def test_return_none(self, executor):
        """Test returning None."""
        result, stdout, stderr = executor.run(
            code="return None",
            context=Object({}),
        )
        assert json.loads(result) is None

    def test_context_access(self, executor):
        """Test accessing context variables."""
        context = Object({"foo": 10, "bar": 20})
        result, stdout, stderr = executor.run(
            code="return foo + bar",
            context=context,
        )
        assert json.loads(result) == 30

    def test_nested_context_access(self, executor):
        """Test accessing nested context variables."""
        context = Object({"data": {"nested": {"value": 42}}})
        result, stdout, stderr = executor.run(
            code="return data.nested.value",
            context=context,
        )
        assert json.loads(result) == 42

    def test_system_version_not_leaked_to_user_scope(self, executor):
        """System 'version' from API transport must not leak into user scope when globals has no version."""
        context = Object({
            "globals": {},
            "outputs": {},
            "version": "v2",
        })
        result, stdout, stderr = executor.run(
            code="return version",
            context=context,
        )

        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)
        assert "name 'version' is not defined" in " ".join(stderr).lower()

    def test_user_version_superblocks_variable_not_shadowed_by_system(self, executor):
        """When user defines 'version' as a Superblocks Variable, their value must be used, not system API version."""
        var_client = MagicMock(spec=VariableClient)
        var_client.read.return_value = (["23.1.0"], 0)
        variables = {
            "version": {
                "key": "version",
                "type": VariableType.NATIVE,
                "mode": VariableMode.READ,
            },
        }
        context = Object({
            "globals": {},
            "outputs": {},
            "version": "v2",
        })
        result, stdout, stderr = executor.run(
            code="return version",
            context=context,
            variable_client=var_client,
            variables=variables,
        )
        assert json.loads(result) == "23.1.0"
        assert stderr == []

    def test_stdout_capture(self, executor):
        """Test that stdout is captured."""
        result, stdout, stderr = executor.run(
            code='print("hello")\nprint("world")\nreturn 123',
            context=Object({}),
        )
        assert json.loads(result) == 123
        assert "hello" in stdout
        assert "world" in stdout

    def test_syntax_error(self, executor):
        """Test handling of syntax errors."""
        result, stdout, stderr = executor.run(
            code="return def invalid syntax",
            context=Object({}),
        )
        assert result == ""
        # Syntax errors are caught and reported in stderr
        assert any("__EXCEPTION__" in line for line in stderr) or any("SyntaxError" in line for line in stderr)

    def test_runtime_error(self, executor):
        """Test handling of runtime errors."""
        result, stdout, stderr = executor.run(
            code="return undefined_variable",
            context=Object({}),
        )
        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)

    def test_division_by_zero(self, executor):
        """Test handling of division by zero."""
        result, stdout, stderr = executor.run(
            code="return 1 / 0",
            context=Object({}),
        )
        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)

    def test_import_allowed(self, executor):
        """Test that allowed imports work."""
        result, stdout, stderr = executor.run(
            code="import json\nreturn json.dumps({'foo': 'bar'})",
            context=Object({}),
        )
        assert json.loads(result) == '{"foo": "bar"}'

    def test_multiline_script(self, executor):
        """Test multiline script execution."""
        code = """
x = 10
y = 20
z = x + y
return z * 2
"""
        result, stdout, stderr = executor.run(
            code=code,
            context=Object({}),
        )
        assert json.loads(result) == 60

    def test_function_definition(self, executor):
        """Test defining and calling functions."""
        code = """
def add(a, b):
    return a + b

return add(5, 3)
"""
        result, stdout, stderr = executor.run(
            code=code,
            context=Object({}),
        )
        assert json.loads(result) == 8

    def test_list_comprehension(self, executor):
        """Test list comprehension."""
        result, stdout, stderr = executor.run(
            code="return [x * 2 for x in range(5)]",
            context=Object({}),
        )
        assert json.loads(result) == [0, 2, 4, 6, 8]

    def test_bytes_encoding(self, executor):
        """Test that bytes are encoded correctly."""
        result, stdout, stderr = executor.run(
            code='return b"hello"',
            context=Object({}),
        )
        parsed = json.loads(result)
        assert parsed["type"] == "Buffer"
        assert parsed["data"] == [104, 101, 108, 108, 111]


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
        client.read.return_value = ([123], 0)
        var = AdvancedVariable("key", client, allow_write=False)
        assert var.get() == 123
        client.read.assert_called_once_with(["key"])

    def test_set_value_allowed(self):
        """Test setting an advanced variable when allowed."""
        client = MagicMock()
        var = AdvancedVariable("key", client, allow_write=True)
        var.set(456)
        client.write.assert_called_once_with("key", 456)

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
        with patch("src.executor.SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST", []):
            result, stdout, stderr = executor.run(
                code="""
import os
return dict(os.environ)
""",
                context=Object({}),
            )

        env_dict = json.loads(result)
        assert "TEST_SECRET" not in env_dict

    def test_allowed_env_vars_are_present(self, executor):
        """Test that allowed environment variables are present."""
        os.environ["ALLOWED_VAR"] = "allowed_value"
        with patch("src.executor.SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST", ["ALLOWED_VAR"]):
            result, stdout, stderr = executor.run(
                code="""
import os
return dict(os.environ)
""",
                context=Object({}),
            )

        env_dict = json.loads(result)
        assert env_dict.get("ALLOWED_VAR") == "allowed_value"


class TestForkingExecutor:
    """Tests for ForkingExecutor — mirrors TestExecutor but runs each execution
    in a forked child process."""

    @pytest.fixture
    def executor(self):
        return ForkingExecutor()

    def test_simple_return(self, executor):
        result, stdout, stderr = executor.run(
            code="return 1 + 1",
            context=Object({}),
        )
        assert json.loads(result) == 2
        assert stderr == []

    def test_return_string(self, executor):
        result, stdout, stderr = executor.run(
            code='return "hello world"',
            context=Object({}),
        )
        assert json.loads(result) == "hello world"

    def test_return_dict(self, executor):
        result, stdout, stderr = executor.run(
            code='return {"foo": "bar", "num": 123}',
            context=Object({}),
        )
        assert json.loads(result) == {"foo": "bar", "num": 123}

    def test_return_list(self, executor):
        result, stdout, stderr = executor.run(
            code="return [1, 2, 3, 4, 5]",
            context=Object({}),
        )
        assert json.loads(result) == [1, 2, 3, 4, 5]

    def test_return_none(self, executor):
        result, stdout, stderr = executor.run(
            code="return None",
            context=Object({}),
        )
        assert json.loads(result) is None

    def test_context_access(self, executor):
        context = Object({"foo": 10, "bar": 20})
        result, stdout, stderr = executor.run(
            code="return foo + bar",
            context=context,
        )
        assert json.loads(result) == 30

    def test_stdout_capture(self, executor):
        result, stdout, stderr = executor.run(
            code='print("hello")\nprint("world")\nreturn 123',
            context=Object({}),
        )
        assert json.loads(result) == 123
        assert "hello" in stdout
        assert "world" in stdout

    def test_runtime_error(self, executor):
        result, stdout, stderr = executor.run(
            code="return undefined_variable",
            context=Object({}),
        )
        assert result == ""
        assert any("__EXCEPTION__" in line for line in stderr)

    def test_isolation_between_executions(self, executor):
        """Each forked execution is isolated: globals set in one run don't bleed
        into the next."""
        executor.run(
            code="import sys; sys.modules['__main__'].LEAKED = True",
            context=Object({}),
        )
        result, _, _ = executor.run(
            code="return getattr(__import__('sys').modules.get('__main__'), 'LEAKED', False)",
            context=Object({}),
        )
        assert json.loads(result) is False

    def test_concurrent_executions(self, executor):
        """Multiple concurrent forks produce independent, correct results."""
        import concurrent.futures

        def run(n):
            return executor.run(code=f"return {n} * 2", context=Object({}))

        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(run, i) for i in range(8)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        values = sorted(json.loads(r[0]) for r in results)
        assert values == sorted(i * 2 for i in range(8))

    def test_timeout_returns_duration_quota_error(self, executor):
        """Child killed after timeout_ms returns 'DurationQuotaError' without hanging."""
        import time

        start = time.monotonic()
        result, stdout, stderr = executor.run(
            code="import time\ntime.sleep(30)\nreturn 'done'",
            context=Object({}),
            timeout_ms=300,
        )
        elapsed = time.monotonic() - start

        assert result == "DurationQuotaError"
        assert stdout == []
        assert stderr == []
        # Should complete well within the sleep duration.
        assert elapsed < 5

    def test_timeout_not_triggered_when_fast(self, executor):
        """A generous timeout doesn't interfere with a fast execution."""
        result, stdout, stderr = executor.run(
            code="return 42",
            context=Object({}),
            timeout_ms=10_000,
        )
        assert json.loads(result) == 42
        assert stderr == []

    def test_default_timeout_applies(self):
        """When no explicit timeout_ms is given, the default kicks in."""
        import time

        executor = ForkingExecutor()
        with patch("src.executor.SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_DEFAULT_TIMEOUT_MS", 300):
            start = time.monotonic()
            result, stdout, stderr = executor.run(
                code="import time\ntime.sleep(30)\nreturn 'done'",
                context=Object({}),
            )
            elapsed = time.monotonic() - start

        assert result == "DurationQuotaError"
        assert elapsed < 5

    def test_grandchild_cleanup(self, executor):
        """Subprocesses spawned by user code are terminated before the child exits."""
        import sys
        import time

        result, stdout, stderr = executor.run(
            code=(
                "import subprocess, sys, os\n"
                f"p = subprocess.Popen(['{sys.executable}', '-c', 'import time; time.sleep(60)'])\n"
                "return p.pid"
            ),
            context=Object({}),
            timeout_ms=5_000,
        )
        grandchild_pid = json.loads(result)
        assert isinstance(grandchild_pid, int)
        assert stderr == []

        time.sleep(0.5)
        try:
            os.kill(grandchild_pid, 0)
            alive = True
        except OSError:
            alive = False
        assert not alive, f"Grandchild process {grandchild_pid} is still running after cleanup"
