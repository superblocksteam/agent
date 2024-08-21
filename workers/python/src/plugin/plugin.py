import json
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from functools import partial
from time import time
from typing import Optional

import log
from constants import (
    SUPERBLOCKS_AGENT_KEY,
    SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS,
)
from exceptions import QuotaError
from executor import RealExecutor as Executor
from kvstore.kvstore import KVStore, MockStore
from models import Quotas
from performance.utils import observe
from remote_log import remote_error, remote_info
from superblocks import Object, Reader
from utils import extract_vars, get_tree_path_to_disk_path

from plugin.props_builder import ExecutionOutputPropsBuilder
from plugin.props_reader import PluginPropsReader
from plugin.props_writer import PluginPropsWriter

DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"


class Event(Enum):
    EXECUTE = "execute"
    METADATA = "metadata"
    PRE_DELETE = "pre_delete"
    TEST = "test"

    @classmethod
    def from_str(cls, data: str):
        if data == "execute":
            return Event.EXECUTE
        if data == "metadata":
            return Event.METADATA
        if data == "pre_delete":
            return Event.PRE_DELETE
        if data == "test":
            return Event.TEST

        raise Exception(f"unknown type {data}")


class Plugin(ABC):
    async def run(
        self,
        event: Event,
        request: dict,
        # Note(taha) The default is required for the on-premise agent's python executions
        # to work. In any case, the on-prem agent should have no size or duration quotas.
        quotas: Quotas = {"size": None, "duration": None},
        kv_store: Optional[KVStore] = None,
        step_performance: Optional[dict] = None,
        baggage: Optional[dict[str, str]] = {},
        log_attributes: dict = {},
    ):
        startTime = time()
        log.info("started", who="plugin", event=event.value, **log_attributes)
        try:
            if event == Event.EXECUTE:
                return await self.execute(
                    request["pluginProps"],
                    kv_store,
                    step_performance,
                    quotas,
                    baggage,
                    log_attributes,
                )

            if event == Event.METADATA:
                return self.metadata(
                    request["datasourceConfiguration"], request["actionConfiguration"]
                )

            if event == Event.PRE_DELETE:
                return self.preDelete(request["datasourceConfiguration"])

            if event == Event.TEST:
                return self.test(request["datasourceConfiguration"])

        finally:
            log.info(
                "finished",
                who="plugin",
                event=event.value,
                duration=(time() - startTime) * 1000,
                **log_attributes,
            )

        raise Exception("unknown event {}".format(event))

    @abstractmethod
    async def execute(
        self,
        props,
        kv_store: Optional[KVStore],
        step_performance: Optional[dict],
        quotas: Quotas,
        baggage: Optional[dict[str, str]],
        log_attributes: dict,
    ):
        pass

    @abstractmethod
    def metadata(self, dConfig, aConfig):
        pass

    @abstractmethod
    def preDelete(self, dConfig):
        pass

    @abstractmethod
    def test(self, dConfig):
        pass


class Python(Plugin):
    async def _run(self, data, kv_store: KVStore, timeout: int):
        """
        spin up process and run the code not blocking main thread
        """
        return await Executor().run(
            data.code,
            Object(
                {
                    **extract_vars(data.context.globals),
                    **extract_vars(data.context.outputs),
                }
            ),
            data.context.get("variables"),
            kv_store,
            timeout,
        )

    async def execute(
        self,
        props: dict,
        kv_store: Optional[KVStore],
        step_performance: Optional[dict],
        quotas: Quotas,
        baggage: Optional[dict[str, str]],
        log_attributes: dict = {},
    ):
        if kv_store is not None and step_performance:
            # NOTE(frank): I could use closure for the store and perf object but the linter
            #              isn't smart enough to combine the closure with the conditional.
            async def _flush_output(
                props: dict, output: dict, store: KVStore, perf: dict
            ) -> str:
                builder = ExecutionOutputPropsBuilder(
                    props["executionId"], props["stepName"], output
                )

                writer = PluginPropsWriter(
                    props=builder.build(),
                    step_performance=perf,
                    kvStoreOps={
                        "maxSize": quotas.get("size"),
                        "expiration": None,
                        "baggage": baggage,
                    },
                    version=props.get("context").get("version"),  # type: ignore
                )

                return (await writer.write_store(store))[0]

            plugin_props_reader = PluginPropsReader(props, kv_store, step_performance)
            props = await plugin_props_reader.build()
            output = await observe(
                step_performance.setdefault("pluginExecution", {}),
                lambda: self._execute(
                    props,
                    kv_store,  # type: ignore
                    quotas.get("duration")
                    or SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS,
                    log_attributes,
                ),
            )

            output_store_key = None
            error_name = "IntegrationError"
            error_message = output.get("executionOutput", {}).get("error")
            try:
                output_store_key = await _flush_output(
                    props, output["executionOutput"], kv_store, step_performance
                )
            except QuotaError:
                error_name = "QuotaError"
                error_message = "QuotaError"
                output["executionOutput"]["error"] = "QuotaError"

                # In order to retain the contract of errors being included in the step output,
                # We need to clear the output, add the error, and re-flush. In the future, we
                # should revisit how this flow works.
                del output["executionOutput"]["output"]

                output_store_key = await _flush_output(
                    props, output["executionOutput"], kv_store, step_performance
                )

            result = {
                "err": {"name": error_name, "message": error_message}
                if error_message
                else None,
                "key": output_store_key,
            }
        else:
            result = await self._execute(
                props, MockStore(), SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS, {}
            )

        return result

    async def _execute(
        self,
        props,
        kv_store: KVStore,
        timeout: int,
        log_attributes: dict,
    ):
        startDatetime = datetime.utcnow()
        startDatetimeStr = startDatetime.strftime(DATETIME_FORMAT)
        startTimestamp = startDatetime.timestamp()
        # NOTE(frank): eh, very messy
        props.setdefault("files", [])

        props["context"]["globals"]["$agentKey"] = SUPERBLOCKS_AGENT_KEY

        props["context"]["globals"]["$superblocksFiles"] = get_tree_path_to_disk_path(
            props["context"]["globals"], props["files"]
        )

        reader = Reader(props["context"]["globals"])

        # TODO(frank): move elsewhere. Maybe a static method on Reader
        for key, value in props["context"]["globals"]["$superblocksFiles"].items():
            paths = key.split(".")
            obj = props["context"]["globals"][paths[0]]
            for path in paths[1:]:
                if path.isdigit():
                    path = int(path)
                obj = obj[path]
            obj["readContents"] = partial(reader.readContents, key, value)

        data = Object(
            {"context": props["context"], "code": props["actionConfiguration"]["body"]}
        )

        result, std_out, std_err = await self._run(data, kv_store, timeout)

        remote_info(std_out, **log_attributes)

        # TODO(frank): make this a class
        output = {
            "startTimeUtc": startDatetimeStr,
            "request": data.code,
            "log": std_out,
            "executionTime": round(
                (datetime.utcnow().timestamp() - startTimestamp) * 1000
            ),
        }

        if result == "DurationQuotaError":
            output.update({"error": "DurationQuotaError"})
        else:
            try:
                json_output = json.loads(result)
                output.update({"output": json_output})
            except json.JSONDecodeError as e:
                output.update({"error": e})

        error_logs = []
        for err_log in std_err:
            if err_log.startswith("__EXCEPTION__"):
                err_log = err_log.removeprefix("__EXCEPTION__")
                # NOTE(frank): I'm just copy/pasting from JS but we
                # can do better than updating everytime.
                output["error"] = err_log
            std_out.append(f"[ERROR] {err_log}")
            error_logs.append(err_log)

        remote_error(error_logs, **log_attributes)

        return {"executionOutput": output}

    def metadata(self, dConfig, aConfig):
        return {}

    def preDelete(self, dConfig):
        return {}

    def test(self, dConfig):
        return {}
