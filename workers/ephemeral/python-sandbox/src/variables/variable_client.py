"""Client for accessing variables via gRPC to the orchestrator."""

from __future__ import annotations

import json
from typing import Any

import grpc

from gen.superblocks_types.worker.v1 import sandbox_variable_store_pb2 as variable_store_pb2
from gen.superblocks_types.worker.v1 import sandbox_variable_store_pb2_grpc as variable_store_pb2_grpc


class VariableClient:
    """Client for accessing variables via gRPC to the orchestrator."""

    def __init__(self, address: str, execution_id: str):
        self.address = address
        self.execution_id = execution_id
        self.channel = None
        self.stub = None
        self.buffer: dict[str, Any] = {}

    def connect(self):
        if self.channel is None and self.address:
            self.channel = grpc.insecure_channel(self.address)
            self.stub = variable_store_pb2_grpc.SandboxVariableStoreServiceStub(self.channel)

    def close(self):
        if self.channel:
            self.channel.close()
            self.channel = None
            self.stub = None

    def get(self, key: str) -> Any:
        """Get a variable from the store."""
        if not self.stub:
            return None
        try:
            resp = self.stub.GetVariable(variable_store_pb2.GetVariableRequest(
                execution_id=self.execution_id,
                key=key,
            ))
            if resp.found:
                return json.loads(resp.value) if resp.value else None
            return None
        except Exception as e:
            print(f"Error getting variable {key}: {e}")
            return None

    def set(self, key: str, value: Any):
        """Set a variable in the store."""
        if not self.stub:
            return
        try:
            self.stub.SetVariable(variable_store_pb2.SetVariableRequest(
                execution_id=self.execution_id,
                key=key,
                value=json.dumps(value),
            ))
        except Exception as e:
            print(f"Error setting variable {key}: {e}")

    def get_many(self, keys: list[str]) -> list[Any]:
        """Get multiple variables from the store."""
        if not self.stub:
            return [None] * len(keys)
        try:
            resp = self.stub.GetVariables(variable_store_pb2.GetVariablesRequest(
                execution_id=self.execution_id,
                keys=keys,
            ))
            return [json.loads(v) if v else None for v in resp.values]
        except Exception as e:
            print(f"Error getting variables: {e}")
            return [None] * len(keys)

    def write_buffer(self, key: str, value: Any):
        """Buffer a write for later flushing."""
        self.buffer[key] = value

    def flush(self):
        """Flush all buffered writes to the store."""
        if not self.stub or not self.buffer:
            return
        try:
            kvs = [
                variable_store_pb2.KeyValue(key=k, value=json.dumps(v))
                for k, v in self.buffer.items()
            ]
            self.stub.SetVariables(variable_store_pb2.SetVariablesRequest(
                execution_id=self.execution_id,
                kvs=kvs,
            ))
            self.buffer.clear()
        except Exception as e:
            print(f"Error flushing variables: {e}")
