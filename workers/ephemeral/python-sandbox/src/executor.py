"""Executor for running Python code in the sandbox."""

from __future__ import annotations

import json
import os
from contextlib import redirect_stderr, redirect_stdout
from functools import partial
from importlib.util import module_from_spec, spec_from_loader
from inspect import getsource
from io import StringIO
from re import search
from sys import exc_info
from textwrap import indent
from traceback import extract_tb
from typing import Optional

from src.constants import get_env_var
from src.log import error
from src.restricted import ALLOW_BUILTINS, restricted_environment
from src.superblocks import Object, Reader, encode_bytestring_as_json
from src.variables.variable import build_variables
from src.variables.variable_client import VariableClient

class Executor:
    """Executes Python code directly in the current process."""

    def run(
        self,
        code: str,
        context: Object,
        variable_client: Optional[VariableClient] = None,
        variables: dict = {},
        superblocks_files: Optional[dict] = None,
    ) -> tuple[str, list[str], list[str]]:
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
            variable_client,
            variables,
            superblocks_files=superblocks_files or {},
        )

        stdout_lines = stdout_data.splitlines() if stdout_data else []
        stderr_lines = stderr_data.splitlines() if stderr_data else []

        return result, stdout_lines, stderr_lines

    def _execute(
        self,
        code: str,
        context: Object,
        variable_client: Optional[VariableClient],
        variables: dict,
        superblocks_files: Optional[dict] = None,
    ) -> tuple[str, str, str]:
        """Execute code and return result, stdout, stderr."""
        result = ""
        stdout_data = ""
        stderr_data = ""

        # NOTE: We intentionally do NOT use os.chdir() here because:
        # 1. os.chdir() is process-wide, not thread-local
        # 2. Multiple threads calling os.chdir() would race and cause
        #    "[Errno 2] No such file or directory" errors
        # User code should not depend on the current working directory.

        try:
            result, stdout_data, stderr_data = self._run_code(
                code,
                context,
                variable_client,
                variables,
                superblocks_files=superblocks_files or {},
            )
        except Exception as e:
            stderr_data = f"__EXCEPTION__{str(e)}"

        return result, stdout_data, stderr_data

    def _run_code(
        self,
        code: str,
        context: Object,
        var_client: Optional[VariableClient],
        var_spec: dict,
        superblocks_files: Optional[dict] = None,
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
        if var_client is not None:
            # Build variables from spec
            try:
                if var_spec:
                    built_vars = build_variables(var_spec, var_client)
                    for k, v in built_vars.items():
                        if k not in my_module.__dict__:
                            my_module.__dict__[k] = v
            except Exception as e:
                error(f"Error building variables: {e}", exc_info=True)

        # Get globals dict from context (this is where native variables like Table1 live)
        globals_dict = my_module.__dict__.get("globals", {})
        if isinstance(globals_dict, dict):
            # Handle filepicker files if present
            if var_client and superblocks_files:
                # superblocks_files is a pre-computed map of treePath -> remotePath
                # computed by the task-manager by traversing context to find filepicker objects

                # Create a file fetcher that uses the variable client's FetchFile RPC
                def make_file_fetcher(remote_path):
                    def fetcher(path):
                        return var_client.fetch_file(remote_path)
                    return fetcher

                # Create Reader with file fetcher and attach readContents to each file object
                for key, remote_path in superblocks_files.items():
                    reader = Reader(make_file_fetcher(remote_path))
                    paths = key.split(".")
                    obj = globals_dict.get(paths[0])
                    if obj is None:
                        continue
                    for path in paths[1:]:
                        if path.isdigit():
                            path = int(path)
                        try:
                            obj = obj[path]
                        except (KeyError, IndexError, TypeError):
                            obj = None
                            break
                    if obj is not None and isinstance(obj, dict):
                        obj["readContents"] = partial(reader.readContents, key, remote_path)
                        obj["readContentsAsync"] = partial(reader.readContentsAsync, key, remote_path)

            # Copy globals values to module dict for direct access (always do this)
            for k in globals_dict.keys():
                if not k.startswith("$"):
                    my_module.__dict__[k] = globals_dict[k]

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

        return result, std_out.getvalue(), std_err.getvalue()

    def _marshal(self, result) -> str:
        """Convert result to JSON string."""
        try:
            from plotly.graph_objects import Figure as PlotlyFigure
            if isinstance(result, PlotlyFigure):
                result_json = result.to_json()
                return str(result_json) if result_json else ""
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
