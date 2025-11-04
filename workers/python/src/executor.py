from __future__ import annotations

import asyncio
import os
import tempfile
from abc import ABC, abstractmethod
from asyncio import Task, create_task
from contextlib import redirect_stderr, redirect_stdout
from importlib.util import module_from_spec, spec_from_loader
from inspect import getsource
from io import StringIO
from multiprocessing import Process
from os import _Environ, _exit, close, pipe
from re import search
from sys import exc_info
from textwrap import indent
from traceback import extract_tb
from typing import Optional

import psutil
from backoff import constant, on_exception
from plotly.graph_objects import Figure as PlotlyFigure
from simplejson import dumps

from constants import (
    SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST,
    SUPERBLOCKS_WORKER_SUBPROCESS_GID,
    SUPERBLOCKS_WORKER_SUBPROCESS_UID,
)
from exceptions import BusyError
from kvstore.kvstore import KVStore
from pipe import publish, receiveAll
from restricted import ALLOW_BUILTINS
from superblocks import Object, Reader
from superblocks_json import encode_bytestring_as_json
from transport.signal import remove_signal_handlers
from variables.variable import build_variables
from variables.variable_client import VariableClient
from variables.variable_server import VariableServer


class Executor(ABC):
    @abstractmethod
    def run(
        self,
        code,
        context: Object,
        variables: dict[str, str],
        kv_store: KVStore,
        timeout: int,
    ):
        pass


class RealExecutor(Executor):
    async def run(
        self,
        code,
        context: Object,
        variables: dict[str, str],
        kv_store: KVStore,
        timeout: int,
    ) -> tuple[str, list[str], list[str]]:
        result_reader, result_writer = pipe()
        stdout_reader, stdout_writer = pipe()
        stderr_reader, stderr_writer = pipe()
        variable_server_client_read_fd, variable_server_client_write_fd = pipe()
        variable_client_server_read_fd, variable_client_server_write_fd = pipe()

        result_task: Task = create_task(
            receiveAll(result_reader, read_once=True), name="result"
        )
        stdout_task: Task = create_task(
            receiveAll(stdout_reader, read_once=True), name="stdout"
        )
        stderr_task: Task = create_task(
            receiveAll(stderr_reader, read_once=True), name="stderr"
        )

        variable_server = VariableServer(
            variable_client_server_read_fd, variable_server_client_write_fd, kv_store
        )

        await variable_server.start()

        result: str = ""
        ignore_exit_code: bool = False

        process = Process(
            target=self.execute,
            args=(
                result_writer,
                stdout_writer,
                stderr_writer,
                variable_server_client_read_fd,
                variable_client_server_write_fd,
                code,
                context,
                variables,
            ),
        )
        process.start()

        # NOTE(frank): We don't want to be too greedy. We want to release ourselves to the event loop ASAP.
        #              We're releasing for 8ms each time as I've never seen something finish before that.
        @on_exception(
            constant,
            exception=(BusyError),
            logger=None,
            interval=0.008,
            raise_on_giveup=True,
            jitter=None,
            max_time=timeout / 1000,  # This is in seconds.
        )
        async def __wait() -> None:
            if process.is_alive():
                raise BusyError

        # This code, which is annotated with backoff functionality allows
        # us to join/timeout the code WITHOUT blocking the main thread.
        try:
            await __wait()
        except BusyError:
            ignore_exit_code = True
            process.terminate()
            # FIXME(bruce): Cannot use the logger here as high concurrency would cause the process to hang.
            # might not be thread safe?
            # print("duration quota has been violated", timeout)

            # I originally threw an error here. However, I reverted to maintaining the same
            # interface and returning so that we could still get the std_out and std_err up
            # until the point of the timeout to provide the best experience for the customer.
            result = "DurationQuotaError"

        process.join()

        if not ignore_exit_code and process.exitcode != 0:
            publish(
                stderr_writer,
                f"__EXCEPTION__Program exited with code {str(process.exitcode)}\n",
            )

        close(result_writer)
        close(stdout_writer)
        close(stderr_writer)

        pipe_result = await result_task

        if result == "":
            if len(pipe_result) > 0:
                result = pipe_result[0]

        variable_server.close()

        close(variable_client_server_write_fd)
        close(variable_server_client_read_fd)

        # closing the following fd results in errors
        # - client sees: {
        #       "code":8,
        #       "message":"QuotaError: The duration of block Step1 has exceeded its limit of 5"
        #                 " seconds. Contact support to increase this quota.",
        #   }
        # - server sees: Bad file descriptor
        # close(variable_client_server_read_fd)

        stdout = await stdout_task
        stderr = await stderr_task

        splittedStdout = []
        if len(stdout) > 0:
            splittedStdout = stdout[0].splitlines()

        splittedStderr = []
        if len(stderr) > 0:
            splittedStderr = stderr[0].splitlines()

        return (
            result,
            splittedStdout,
            splittedStderr,
        )

    # TODO(bruce): Currently an ongoing product discussion if this is desirable. We have
    # a customer already relying on the old method of using async functions. Disabling
    # this for now for backwards compatibility.
    # def __run_async(
    #     self, result_writer, stdout_writer, stderr_writer, code, context
    # ) -> None:
    #     run(self.__run(result_writer, stdout_writer, stderr_writer, code, context))

    def execute(
        self,
        result_writer,
        stdout_writer,
        stderr_writer,
        variable_server_client_read_fd,
        variable_client_server_write_fd,
        code,
        context,
        variables,
    ) -> None:
        try:
            loop = asyncio.get_event_loop()
            remove_signal_handlers(loop)
            with tempfile.TemporaryDirectory() as execution_dir:
                try:
                    os.chdir(execution_dir)
                    os.chown(
                        execution_dir,
                        SUPERBLOCKS_WORKER_SUBPROCESS_UID,
                        SUPERBLOCKS_WORKER_SUBPROCESS_GID,
                    )
                    os.setgid(SUPERBLOCKS_WORKER_SUBPROCESS_GID)
                    os.setuid(SUPERBLOCKS_WORKER_SUBPROCESS_UID)
                except Exception:
                    pass
                    # FIXME(bruce): Cannot use the logger here as high concurrency would cause the process to hang.
                    # might not be thread safe?
                    # print(
                    #     f"Cannot switch user ids. Main process is unprotected. Error: {e}"
                    # )

                loop = asyncio.new_event_loop()
                loop.run_until_complete(
                    self.__execute(
                        result_writer,
                        stdout_writer,
                        stderr_writer,
                        variable_server_client_read_fd,
                        variable_client_server_write_fd,
                        code,
                        context,
                        variables,
                    )
                )

            try:
                for proc in psutil.process_iter():
                    if proc.ppid() == os.getpid():
                        proc.terminate()
            except Exception:
                pass

        except Exception as e:
            # FIXME(bruce): Cannot use the logger here as high concurrency would cause the process to hang.
            # might not be thread safe?
            # print("Failed to execute: ", e, code, variables)
            raise e

    async def __execute(
        self,
        result_writer,
        stdout_writer,
        stderr_writer,
        variable_server_client_read_fd,
        variable_client_server_write_fd,
        code,
        context,
        variables,
    ):
        spec = spec_from_loader("superblocks", loader=None)

        variable_client = VariableClient(
            variable_server_client_read_fd, variable_client_server_write_fd
        )
        await variable_client.start()

        # NOTE(frank): Added this to fix the type hint. Is there a better way?
        if spec is None:
            # TODO(frank): fix me
            raise Exception()

        self.__unset_environ()

        myModule = module_from_spec(spec)
        # Copy the context variables into the scope
        for k in context.keys():
            myModule.__dict__[k] = context[k]

        wrapper = f"{getsource(Reader)}\ndef wrapper():\n"

        # For backwards compatibility
        if variables is not None:
            built = await build_variables(variables, variable_client)
            for k, v in built.items():
                if myModule.__dict__.get(k) is None:
                    myModule.__dict__[k] = v

        myModule.__dict__["__builtins__"] = ALLOW_BUILTINS

        with redirect_stdout(StringIO()) as std_out:
            with redirect_stderr(StringIO()) as std_err:
                try:
                    exec(
                        f'{wrapper}{indent(code, "    ")}',
                        myModule.__dict__,
                    )
                    publish(
                        result_writer,
                        self.__marshal(myModule.wrapper()),
                    )
                    await variable_client.flush()
                except SystemExit as e:
                    _exit(int(str(e.code)))
                except Exception as e:
                    publish(
                        result_writer,
                        "",
                    )
                    try:
                        std_err.write(
                            self.__retrieve_line_number(
                                str(e), len(wrapper.splitlines())
                            )
                        )
                    except Exception as e:
                        std_err.write(
                            f"__EXCEPTION__Unable to parse error line number {str(e)}\n"
                        )
                finally:
                    variable_client.close()

        publish(stdout_writer, std_out.getvalue())
        publish(stderr_writer, std_err.getvalue())

    def __marshal(self, result):
        return (
            result.to_json()
            if isinstance(result, PlotlyFigure)
            else dumps(
                result,
                ignore_nan=True,
                encoding=None,
                default=encode_bytestring_as_json,
            )
        )

    def __retrieve_line_number(self, error: str, offset: int) -> str:
        # exc_info returns a tuple with None or a Traceback as the third item
        tb = extract_tb(exc_info()[2])
        line: Optional[int] = None
        for t in tb:
            # If the traceback includes a file called "string", this is the
            # Python code from the action configuration that is passed into
            # exec.
            if t.filename == "<string>":
                # The first line is the wrapper() function we use
                if t.lineno is not None:
                    line = t.lineno - offset
                break

        # If there's an error and we still haven't found a line number, it's an
        # exception when running `exec` itself (e.g. a syntax error in the
        # provided code).
        if line is None:
            # Search for "(<string>, line XX)"" where XX is the error line number,
            # remove the suffix and replace the line number with the one adjusted
            # with the offset.
            match = search(r"\(<string>, line (\d+)\)", error)

            if match is not None:
                lineNoString = match.group(1)
                line = int(lineNoString) - offset
                error = error.replace(match.group(), "")

        if line is not None:
            return f"__EXCEPTION__Error on line {line}: {error} "
        else:
            return f"__EXCEPTION__Error: {error} "

    def __unset_environ(self):
        def noop_encoder(value: str) -> str:
            return value

        # Looks like forking will repopulate this
        existing_env = os.environ
        os.environ = _Environ(
            {}, noop_encoder, noop_encoder, noop_encoder, noop_encoder
        )

        # Populate the forked process environment with the variables that
        # are allowed to be passed to the execution environment.
        for env_var in SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST:
            if env_var in existing_env:
                os.environ[env_var] = existing_env[env_var]
