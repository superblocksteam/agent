import asyncio
import os
import pickle
from typing import List

from kvstore.kvstore import KV, KVStore
from pipe import publish, receiveAll


class VariableServer:
    def __init__(self, inbound_fd: int, outbound_fd: int, kv_store: KVStore):
        self.inbound_task = None
        self.inbound_fd = inbound_fd
        self.outbound_fd = outbound_fd
        self.kv_store = kv_store

    async def start(self):
        self.inbound_task = asyncio.create_task(
            receiveAll(self.inbound_fd, lambda x: self.handleClientEvent(x))
        )

    async def handleClientEvent(self, raw: bytes):
        obj = pickle.loads(raw)
        if obj["type"] == "read":
            id = obj["id"]
            key = obj["key"]
            value = (await self.kv_store.read([key]))[0][0]
            payload = {"data": value, "id": id}
            publish(self.outbound_fd, payload)
        elif obj["type"] == "write":
            id = obj["id"]
            key = obj["key"]
            value = obj["value"]
            payload = {"data": "ok", "id": id}
            await self.kv_store.write(key, value)
            publish(self.outbound_fd, payload)
        elif obj["type"] == "readMany":
            id = obj["id"]
            kvs = obj["keys"]
            values = (await self.kv_store.read(kvs))[0]
            payload = {"data": values, "id": id}
            publish(self.outbound_fd, payload)
        elif obj["type"] == "writeMany":
            id = obj["id"]
            kvs = obj["kvs"]
            writable: List[KV] = []
            for [key, value] in kvs.items():
                writable.append(KV(key=key, value=value))

            await self.kv_store.write_many(
                writable, {"maxSize": None, "expiration": None, "baggage": None}
            )
            payload = {"data": "ok", "id": id}
            publish(self.outbound_fd, payload)

    def close(self):
        os.close(self.outbound_fd)
        self.inbound_task.cancel()
