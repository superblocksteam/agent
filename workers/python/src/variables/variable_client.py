import asyncio
import os
import pickle
from typing import Any, List

from pipe import publish, receiveAll


class VariableClient:
    nextId = 0
    pendingFutures: dict[int, asyncio.Future] = {}
    buffer: dict[str, Any] = {}

    def __init__(self, inbound_fd: int, outbound_fd: int):
        self.inbound_task = None
        self.inbound_fd = inbound_fd
        self.outbound_fd = outbound_fd

    async def start(self):
        self.inbound_task = asyncio.create_task(
            receiveAll(self.inbound_fd, lambda x: self.handleServerEvent(x))
        )

    async def read(self, key: str) -> Any:
        id = self.nextId
        self.nextId += 1
        payload = {"type": "read", "key": key, "id": id}
        publish(self.outbound_fd, payload)

        future: asyncio.Future = asyncio.Future()
        self.pendingFutures[id] = future
        resp = await future

        return resp

    async def readMany(self, keys: List[str]) -> Any:
        id = self.nextId
        self.nextId += 1
        payload = {"type": "readMany", "keys": keys, "id": id}
        publish(self.outbound_fd, payload)

        future: asyncio.Future = asyncio.Future()
        self.pendingFutures[id] = future
        resp = await future

        return resp

    async def write(self, key: str, value: Any):
        if value is None:
            return

        id = self.nextId
        self.nextId += 1
        payload = {"type": "write", "key": key, "value": value, "id": id}
        publish(self.outbound_fd, payload)

        future: asyncio.Future = asyncio.Future()
        self.pendingFutures[id] = future
        await future

    def writeBuffer(self, key: str, value: Any):
        if value is None:
            return
        self.buffer[key] = value

    async def flush(self):
        id = self.nextId
        self.nextId += 1
        payload = {"type": "writeMany", "kvs": self.buffer, "id": id}
        publish(self.outbound_fd, payload)

        future: asyncio.Future = asyncio.Future()
        self.pendingFutures[id] = future
        await future

    async def handleServerEvent(self, raw: bytes):
        obj = pickle.loads(raw)
        id = obj["id"]
        data = obj["data"]

        self.pendingFutures[id].set_result(data)
        self.pendingFutures.pop(id)

    def close(self):
        os.close(self.outbound_fd)
        self.inbound_task.cancel()
