"""Client for accessing variables via gRPC to the orchestrator."""

from __future__ import annotations

import json
from typing import Any, List, Optional, Tuple

import grpc

from src.log import error
from src.store.kvstore import KV, KVStore, WriteOps
from src.superblocks import loads
from superblocks_types.worker.v1 import sandbox_variable_store_pb2 as variable_store_pb2
from superblocks_types.worker.v1 import sandbox_variable_store_pb2_grpc as variable_store_pb2_grpc


class VariableClient(KVStore):
    """Client for accessing variables via gRPC to the orchestrator."""

    def __init__(self, address: str, execution_id: str):
        self.address = address
        self.execution_id = execution_id
        self.channel = None
        self.stub = None
        self.buffer: dict[str, KV] = {}

    def connect(self):
        if self.channel is None and self.address:
            self.channel = grpc.insecure_channel(self.address)
            self.stub = variable_store_pb2_grpc.SandboxVariableStoreServiceStub(self.channel)

    def read(self, keys: list[str]) -> Tuple[List[Any], int]:
        """Get multiple variables from the store.

        Returns dict values as Object instances to support dot notation access, and the size in bytes of the response.
        """
        if not self.stub:
            return [None] * len(keys), 0

        try:
            resp = self.stub.GetVariables(variable_store_pb2.GetVariablesRequest(
                execution_id=self.execution_id,
                keys=keys,
            ))

            result = [loads(v) if v else None for v in resp.values]
            size_in_bytes = sum(len(v) for v in resp.values)

            return result, size_in_bytes
        except Exception as e:
            print(f"Error getting variables: {e}")
            return [None] * len(keys), 0

    def write(self, key: str, value: Any, expiration_seconds: Optional[int] = None) -> int:
        """Set a variable in the store."""
        if not self.stub:
            return 0

        string_val = json.dumps(value)
        try:
            self.stub.SetVariable(variable_store_pb2.SetVariableRequest(
                execution_id=self.execution_id,
                key=key,
                value=string_val,
            ))
        except Exception as e:
            error(f"Error setting variable {key}: {e}")
            raise e

        return len(string_val.encode())

    def write_many(self, payload: list[KV], ops: Optional[WriteOps]) -> int:
        """Set multiple variables in the store."""
        if not self.stub or not payload:
            return 0

        size_in_bytes = 0
        kvs: List[variable_store_pb2.KeyValue] = []
        for kv in payload:
            value = json.dumps(kv.value)
            size_in_bytes += len(value.encode())

            max_size = ops.get("maxSize") if ops else None
            if max_size and size_in_bytes > max_size:
                error(
                    "The value's size has exceeded the maximum limit.",
                    key=kv.key,
                    size=size_in_bytes,
                    limit=max_size,
                )
                raise Exception("Value size exceeds max size")

            kvs.append(variable_store_pb2.KeyValue(key=kv.key, value=value))

        try:
            self.stub.SetVariables(variable_store_pb2.SetVariablesRequest(
                execution_id=self.execution_id,
                kvs=kvs,
            ))
        except Exception as e:
            error(f"Error setting variables: {e}")
            raise e

        return size_in_bytes

    def write_buffer(self, key: str, value: Any):
        """Buffer a write for later flushing."""
        self.buffer[key] = KV(key=key, value=value)

    def flush(self):
        """Flush all buffered writes to the store."""
        if not self.buffer:
            return

        try:
            self.write_many(list(self.buffer.values()), None)
            self.buffer.clear()
        except Exception as e:
            error(f"Error flushing variables: {e}")

    def fetch_file(self, path: str) -> bytes:
        """Fetch file contents from the task-manager.

        The task-manager handles authentication with the orchestrator's file server.

        Args:
            path: The file path/location on the file server

        Returns:
            Raw file contents as bytes
        """
        if not self.stub:
            raise Exception("Variable client not connected")
        try:
            resp = self.stub.FetchFile(variable_store_pb2.FetchFileRequest(
                execution_id=self.execution_id,
                path=path,
            ))
            if resp.error:
                raise Exception(f"Failed to fetch file: {resp.error}")
            return resp.contents
        except Exception as e:
            raise Exception(f"Error fetching file {path}: {e}")

    def delete(self, keys: str) -> None:
        pass

    def close(self, reason: str):
        if self.channel:
            self.channel.close()
            self.channel = None
            self.stub = None
