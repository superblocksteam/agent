"""Executor for running Python code in the sandbox."""

from __future__ import annotations

import json
import os
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from importlib.util import module_from_spec, spec_from_loader
from inspect import getsource
from io import StringIO
from re import search
from sys import exc_info
from textwrap import indent
from traceback import extract_tb
from typing import Any, Optional

from src.constants import get_env_var
from src.restricted import ALLOW_BUILTINS, restricted_environment
from src.superblocks import Object, Reader, encode_bytestring_as_json
from src.variables.variable import build_variables, SimpleVariable, AdvancedVariable
from src.variables.variable_client import VariableClient

class Executor:
    """Executes Python code directly in the current process."""

    def run(
        self,
        code: str,
        context: Object,
        timeout_ms: int,
        variable_client: Optional[VariableClient] = None,
        variables_json: str = "{}",
    ) -> tuple[str, list[str], list[str], int]:
        """
        Run Python code directly.

        Note: timeout_ms is accepted for API compatibility but not enforced
        since we're running in the same process.

        Returns:
            Tuple of (result_json, stdout_lines, stderr_lines, exit_code)
        """
        result, stdout_data, stderr_data = self._execute(
            code,
            context,
            variable_client.address if variable_client else "",
            variable_client.execution_id if variable_client else "",
            variables_json,
        )

        stdout_lines = stdout_data.splitlines() if stdout_data else []
        stderr_lines = stderr_data.splitlines() if stderr_data else []

        exit_code = 0 if not any("__EXCEPTION__" in line for line in stderr_lines) else 1

        return result, stdout_lines, stderr_lines, exit_code

    def _execute(
        self,
        code: str,
        context: Object,
        var_store_address: str,
        execution_id: str,
        variables_json: str,
    ) -> tuple[str, str, str]:
        """Execute code and return result, stdout, stderr."""
        result = ""
        stdout_data = ""
        stderr_data = ""

        # Save original directory
        original_dir = os.getcwd()

        try:
            with tempfile.TemporaryDirectory() as execution_dir:
                try:
                    os.chdir(execution_dir)
                except Exception:
                    pass

                result, stdout_data, stderr_data = self._run_code(
                    code,
                    context,
                    var_store_address,
                    execution_id,
                    variables_json,
                )
        except Exception as e:
            stderr_data = f"__EXCEPTION__{str(e)}"
        finally:
            # Restore original directory
            try:
                os.chdir(original_dir)
            except Exception:
                pass

        return result, stdout_data, stderr_data

    def _run_code(
        self,
        code: str,
        context: Object,
        var_store_address: str,
        execution_id: str,
        variables_json: str,
    ) -> tuple[str, str, str]:
        """Inner execution logic."""
        spec = spec_from_loader("superblocks", loader=None)

        if spec is None:
            raise Exception("Failed to create module spec")

        my_module = module_from_spec(spec)

        # Copy the context variables into the scope
        for k in context.keys():
            my_module.__dict__[k] = context[k]

        # Set up variable client if address provided
        var_client = None
        if var_store_address and execution_id:
            var_client = VariableClient(var_store_address, execution_id)
            var_client.connect()

            # Build variables from spec
            try:
                var_spec = json.loads(variables_json) if variables_json else {}
                if var_spec:
                    built_vars = build_variables(var_spec, var_client)
                    for k, v in built_vars.items():
                        if k not in my_module.__dict__:
                            my_module.__dict__[k] = v
            except Exception as e:
                print(f"Error building variables: {e}")

        # Create wrapper function with Reader class
        wrapper = f"{getsource(Reader)}\ndef wrapper():\n"

        # Set restricted builtins
        my_module.__dict__["__builtins__"] = ALLOW_BUILTINS

        result = ""
        with redirect_stdout(StringIO()) as std_out:
            with redirect_stderr(StringIO()) as std_err:
                with restricted_environment(self._build_sandbox_environment()):
                    try:
                        exec(
                            f'{wrapper}{indent(code, "    ")}',
                            my_module.__dict__,
                        )
                        result = self._marshal(my_module.wrapper())

                        # Flush variable writes
                        if var_client:
                            var_client.flush()
                    except SystemExit as e:
                        result = ""
                        std_err.write(f"__EXCEPTION__SystemExit: {e.code}")
                    except Exception as e:
                        result = ""
                        try:
                            std_err.write(
                                self._retrieve_line_number(
                                    str(e), len(wrapper.splitlines())
                                )
                            )
                        except Exception as inner_e:
                            std_err.write(
                                f"__EXCEPTION__Unable to parse error line number {str(inner_e)}"
                            )
                    finally:
                        if var_client:
                            var_client.close()

        return result, std_out.getvalue(), std_err.getvalue()

    def _marshal(self, result) -> str:
        """Convert result to JSON string."""
        try:
            from plotly.graph_objects import Figure as PlotlyFigure
            if isinstance(result, PlotlyFigure):
                return result.to_json()
        except ImportError:
            pass

        return json.dumps(
            result,
            default=encode_bytestring_as_json,
        )

    def _retrieve_line_number(self, error: str, offset: int) -> str:
        """Extract line number from exception traceback."""
        tb = extract_tb(exc_info()[2])
        line: Optional[int] = None

        for t in tb:
            if t.filename == "<string>":
                if t.lineno is not None:
                    line = t.lineno - offset
                break

        if line is None:
            match = search(r"\(<string>, line (\d+)\)", error)
            if match is not None:
                lineNoString = match.group(1)
                line = int(lineNoString) - offset
                error = error.replace(match.group(), "")

        if line is not None:
            return f"__EXCEPTION__Error on line {line}: {error} "
        else:
            return f"__EXCEPTION__Error: {error} "

    def _build_sandbox_environment(self) -> dict[str, str]:
        """Build environment variables for sandboxed execution."""
        allowed_vars = get_env_var(
            "SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST", default=[], as_type=list, unset=False
        )
        return {
            env_var: os.environ.get(env_var, "")
            for env_var in allowed_vars
            if env_var and env_var in os.environ
        }
