"""Executor for running Python code in the sandbox."""

from __future__ import annotations

import json
import multiprocessing
import multiprocessing.connection
import os
import tempfile
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

import psutil

from src.constants import (
    RESERVED_CONTEXT_KEYS,
    SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST,
    SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_DEFAULT_TIMEOUT_MS,
    SUPERBLOCKS_WORKER_SUBPROCESS_GID,
    SUPERBLOCKS_WORKER_SUBPROCESS_UID,
    get_env_var,
)
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
        timeout_ms: Optional[int] = None,
    ) -> tuple[str, list[str], list[str]]:
        """
        Run Python code directly.

        Note: timeout_ms is accepted for API compatibility but not enforced
        since we're running in the same process.

        Returns:
            Tuple of (result_json, stdout_lines, stderr_lines)
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

        # Copy the context variables into the scope.
        # Skip reserved keys so they don't shadow user variables.
        for k in context.keys():
            if k in RESERVED_CONTEXT_KEYS:
                continue
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
        """Build environment variables for sandboxed execution.

        Uses the module-level constant rather than re-reading from os.environ,
        because get_env_var(..., unset=True) removes the config var at import
        time.  The customer env vars themselves (the ones *listed* in the
        inclusion list) are still present in os.environ.
        """
        return {
            env_var: os.environ.get(env_var, "")
            for env_var in SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST
            if env_var and env_var in os.environ
        }


def _run_in_child(
    conn: multiprocessing.connection.Connection,
    code: str,
    context,
    var_address: Optional[str],
    var_execution_id: Optional[str],
    variables: dict,
    superblocks_files: dict,
) -> None:
    """Execute code in a forked child process and send results over a connection.

    Uses the forkserver start method: a daemon is forked from the parent before
    gRPC starts any threads (see main.py). Each execution is then forked from
    that clean daemon. This gives fork-like startup speed (warm COW module
    memory, no interpreter re-import) without inheriting gRPC polling threads
    or asyncio state from the live server, avoiding the deadlocks that make
    plain fork unsafe in a gRPC+asyncio process.
    """
    from src.variables.variable_client import VariableClient

    # Drop to an unprivileged user inside a per-execution temp directory, matching
    # the isolation the Python worker applies in its forked children.
    try:
        execution_dir = tempfile.mkdtemp()
        os.chdir(execution_dir)
        os.chown(execution_dir, SUPERBLOCKS_WORKER_SUBPROCESS_UID, SUPERBLOCKS_WORKER_SUBPROCESS_GID)
        os.setgid(SUPERBLOCKS_WORKER_SUBPROCESS_GID)
        os.setuid(SUPERBLOCKS_WORKER_SUBPROCESS_UID)
    except Exception:
        pass

    var_client = None
    try:
        if var_address:
            var_client = VariableClient(address=var_address, execution_id=var_execution_id)
            var_client.connect()

        result, stdout_lines, stderr_lines = Executor().run(
            code=code,
            context=context,
            variable_client=var_client,
            variables=variables,
            superblocks_files=superblocks_files,
        )

        conn.send({"result": result, "stdout": stdout_lines, "stderr": stderr_lines})
    except Exception as e:
        conn.send({"result": "", "stdout": [], "stderr": [f"__EXCEPTION__{e}"]})
    finally:
        if var_client:
            var_client.close("done")
        conn.close()
        # Kill any subprocesses spawned by user code so they don't outlive the
        # child, matching the Python worker's cleanup in its forked children.
        try:
            for proc in psutil.process_iter():
                if proc.ppid() == os.getpid():
                    proc.terminate()
        except Exception:
            pass


class ForkingExecutor:
    """Executes each invocation in an isolated child process via forkserver.

    Intended for long-lived sandbox processes (non-ephemeral / OPA mode) where
    the same sandbox handles multiple concurrent executions. Each call forks a
    child from a pre-started forkserver daemon, runs the user code there, and
    returns results via a multiprocessing pipe.

    forkserver (not fork or spawn) is used deliberately:
    - fork of a live gRPC+asyncio server risks dead threads in the child
      permanently holding locks (malloc, asyncio, gRPC polling), causing
      crashes. GRPC_ENABLE_FORK_SUPPORT=1 covers gRPC threads but not other
      Python thread-local state.
    - spawn starts a fresh interpreter for every execution, paying ~80ms of
      module re-import overhead per request.
    - forkserver forks a daemon before the gRPC server starts (main.py). The
      daemon has warm module memory (fast COW copies, no re-import) but no live
      threads. Each execution is forked from that clean daemon: fork-like speed
      without fork-threading deadlocks.
    """

    def run(
        self,
        code: str,
        context,
        variable_client: Optional["VariableClient"] = None,
        variables: dict = {},
        superblocks_files: Optional[dict] = None,
        timeout_ms: Optional[int] = None,
    ) -> tuple[str, list[str], list[str]]:
        # Extract connection params before spawning — the VariableClient gRPC
        # channel cannot be pickled and must not cross the process boundary.
        var_address = variable_client.address if variable_client else None
        var_execution_id = variable_client.execution_id if variable_client else None

        parent_conn, child_conn = multiprocessing.Pipe(duplex=False)

        process = multiprocessing.get_context("forkserver").Process(
            target=_run_in_child,
            args=(
                child_conn,
                code,
                context,
                var_address,
                var_execution_id,
                variables or {},
                superblocks_files or {},
            ),
        )
        process.start()
        child_conn.close()

        effective_timeout_ms = timeout_ms if timeout_ms else SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_DEFAULT_TIMEOUT_MS
        timeout_secs = effective_timeout_ms / 1000.0 if effective_timeout_ms else None
        timed_out = False
        data: Optional[dict] = None

        try:
            # poll() lets us honour the duration quota without blocking forever.
            # timeout_secs is None only if the default is explicitly disabled (0).
            if timeout_secs is not None and not parent_conn.poll(timeout_secs):
                timed_out = True
                process.terminate()
            else:
                try:
                    data = parent_conn.recv()
                except EOFError:
                    data = {
                        "result": "",
                        "stdout": [],
                        "stderr": ["__EXCEPTION__Child process terminated before sending results"],
                    }
        finally:
            parent_conn.close()

        process.join()

        if timed_out:
            # Match the Python worker: return the sentinel so callers can surface
            # "DurationQuotaError" rather than a generic execution error.
            return "DurationQuotaError", [], []

        result = (data or {}).get("result", "")
        stdout_lines = (data or {}).get("stdout", [])
        stderr_lines = (data or {}).get("stderr", [])

        # Surface non-zero exits that didn't already report an error (e.g. SIGKILL).
        if process.exitcode not in (0, None) and not stderr_lines:
            stderr_lines = [f"__EXCEPTION__Process exited with code {process.exitcode}"]

        return result, stdout_lines, stderr_lines
