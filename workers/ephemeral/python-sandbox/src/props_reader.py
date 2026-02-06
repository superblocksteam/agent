from copy import deepcopy
from datetime import datetime
from typing import Any, Callable, Dict, List

from src.constants import STREAM_PROPERTIES, ContextCategory
from src.log import warn
from src.store.kvstore import KVStore
from src.superblocks import Object
from src.utils import deep_contains
from src.variables.constants import VariableType

MILLION = 1000000


def now_microseconds() -> int:
    return int(datetime.now().timestamp() * MILLION)


async def observe(observable: dict, fn: Callable):
    observable["start"] = observable.get("start", now_microseconds())

    try:
        return await fn()
    finally:
        observable["end"] = now_microseconds()
        observable["value"] = observable["end"] - observable["start"]


class PluginPropReaderException(Exception):
    pass


class PluginPropsReader:
    def __init__(
        self, request_props: dict, kv_store: KVStore, step_performance: dict
    ) -> None:
        self._plugin_props: Dict[str, Any] = dict()
        self._request_props = request_props
        self._kv_store = kv_store
        self._step_performance = step_performance
        self._stream_stats = 0
        self._store_stats = 0
        self._store_bytes = 0

    def _load_from_stream(self):
        for prop in STREAM_PROPERTIES:
            self._stream_stats += 1
            self._plugin_props[prop] = self._request_props.get(prop)

    async def _load_from_store(self):
        keys, build_context = self._prepare_read()
        self._store_stats += len(keys)
        data, size_in_bytes = self._kv_store.read(keys)
        # Not 100% accurate since deserialized data, can disable serialization
        # on client and then deserialize in this method to get accurate data
        self._store_bytes += size_in_bytes
        propertyValue = build_context(data)
        self._plugin_props["context"] = propertyValue

        variables = self._request_props.get("variables")

        if variables is not None:
            nativeVars = [
                (k, v)
                for k, v in variables.items()
                if v["type"] in (VariableType.NATIVE, VariableType.FILEPICKER)
            ]
            keys = [v[1]["key"] for v in nativeVars]
            vals = self._kv_store.read(keys)[0]

            for i in range(len(nativeVars)):
                varName = nativeVars[i][0]
                varVal = vals[i]

                if (
                    isinstance(varVal, dict)
                    and varVal.get("files") is not None
                    and isinstance(varVal["files"], list)
                ):
                    if len(varVal["files"]) == 0 or any(
                        file_entry and "$superblocksId" in file_entry
                        for file_entry in varVal["files"]
                    ):
                        self._plugin_props["context"]["globals"][varName] = varVal

    def _prepare_read(self):
        execution_id = self._plugin_props.get("executionId") or ""
        binding_keys = self._plugin_props.get("bindingKeys") or []
        action_configuration = self._plugin_props.get("actionConfiguration") or {}

        required_keys = [
            key
            for key in binding_keys
            if deep_contains(action_configuration, key.get("key"))
        ]

        keys = list()
        for key in required_keys:
            key_type = key.get("type")
            key_value = key.get("key")
            if key_type == "global":
                keys.append(
                    self._get_store_key(
                        execution_id, ContextCategory.CONTEXT_GLOBAL, key_value
                    )
                )
            elif key_type == "output":
                keys.append(
                    self._get_store_key(
                        execution_id, ContextCategory.CONTEXT_OUTPUT, key_value
                    )
                )
            else:
                warn("unsupported binding key type {key_type}: {key_value}")

        def build_property(values: List[dict]) -> dict:
            context = Object()
            context.setdefault("globals", Object())
            context.setdefault("outputs", Object())

            for idx, key in enumerate(required_keys):
                key_type = key.get("type")
                key_value = key.get("key")
                value = values[idx]

                if key_type == "global":
                    context["globals"][key_value] = value
                elif key_type == "output":
                    context["outputs"][key_value] = value

            return context

        return keys, build_property

    def _get_store_key(self, execution_id: str, category: str, key: str):
        return f"{execution_id}.{category}.{key}"

    async def build(self):
        self._load_from_stream()
        await observe(
            self._step_performance.setdefault("kvStoreFetch", {}), self._load_from_store
        )
        # don't populate metric unless we actually read from the store
        if self._store_stats:
            self._step_performance.setdefault("kvStoreFetch", {})["bytes"] = (
                self._store_bytes
            )

        self._step_performance.setdefault("bindings", {})["data"] = self._store_stats
        try:
            self._plugin_props.setdefault("context", {}).setdefault("globals", {})
            self._plugin_props["context"]["globals"]["$fileServerUrl"] = (
                self._plugin_props["$fileServerUrl"]
            )
            self._plugin_props["context"]["globals"]["$flagWorker"] = (
                self._plugin_props["$flagWorker"]
            )
            self._plugin_props["context"]["variables"] = self._request_props.get(
                "variables"
            )
            self._plugin_props["context"]["version"] = self._request_props.get(
                "version"
            )
            self._plugin_props["redactedContext"] = deepcopy(
                self._plugin_props["context"]
            )
            self._plugin_props["redactedContext"]["variables"] = (
                self._request_props.get("variables")
            )
        except KeyError as e:
            raise PluginPropReaderException(
                "Could not successfully construct plugin props "
                f"due to missing properties: {e}"
            )

        return self._plugin_props
