from typing import List

from exceptions import QuotaError
from kvstore.kvstore import KVStore, WriteOps
from kvstore.redis import KV
from performance.utils import observe
from plugin.constants import STORE_PROPERTY, ContextCategory, get_store_key


class PluginPropsWriterError(Exception):
    pass


class PluginPropsWriter:
    def __init__(
        self, props: dict, step_performance: dict, kvStoreOps: WriteOps, version: str
    ) -> None:
        self._plugin_props = props
        self._step_performance = step_performance
        self._kvStoreOps = kvStoreOps
        self._version = version

    def _shallow_load(
        self,
        obj: dict,
        execution_id: str,
        category: ContextCategory,
        write_op: List[KV],
        omit: List[str] = [],
    ):
        if obj:
            for key, value in obj.items():
                if key in omit:
                    continue
                write_op.append(
                    KV(key=get_store_key(execution_id, category, key), value=value)
                )

    def _prepare_write(self, execution_id: str, property_value: dict) -> List[KV]:
        write_op: List[KV] = []
        self._shallow_load(
            property_value.get("globals", {}),
            execution_id,
            ContextCategory.CONTEXT_GLOBAL,
            write_op,
        )
        if self._version == "v2":
            self._shallow_load(
                property_value.get("outputs", {}),
                execution_id,
                ContextCategory.CONTEXT_OUTPUT_V2,
                write_op,
            )
        elif (
            (self._version == "v1") or (self._version == "") or (self._version is None)
        ):
            self._shallow_load(
                property_value.get("outputs", {}),
                execution_id,
                ContextCategory.CONTEXT_OUTPUT,
                write_op,
            )
        else:
            raise Exception("Unknown plugin property version: " + self._version)
        self._shallow_load(
            property_value,
            execution_id,
            ContextCategory.CONTEXT_GLOBAL,
            write_op,
            ["globals", "outputs"],
        )
        return write_op

    async def write_store(self, store: KVStore) -> List[str]:
        async def _write_store(store):
            try:
                property_value = self._plugin_props[STORE_PROPERTY]
                kvs = self._prepare_write(
                    self._plugin_props["executionId"], property_value
                )
                size_in_bytes = await store.write_many(kvs, self._kvStoreOps)
                self._step_performance.setdefault("kvStorePush", {})["bytes"] = (
                    size_in_bytes
                )

                return [kv.key for kv in kvs]
            except QuotaError:
                raise
            except Exception as e:
                raise PluginPropsWriterError(
                    f"[ERROR] failed to write properties to store: {e}"
                )

        return await observe(
            self._step_performance.setdefault("kvStorePush", {}),
            lambda: _write_store(store),
        )
