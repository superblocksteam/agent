"""Variable classes for simple and advanced variables."""

from __future__ import annotations

from typing import Any

from src.variables.constants import VariableMode, VariableType
from src.variables.variable_client import VariableClient


def build_variables(var_spec: dict, var_client: VariableClient) -> dict[str, Any]:
    """Build variables from specification."""
    result = {}
    keys_to_read = []
    var_info = []

    for var_name, var_props in var_spec.items():
        if not isinstance(var_props, dict):
            continue

        key = var_props.get("key", "")
        var_type = var_props.get("type", VariableType.SIMPLE)
        mode = var_props.get("mode", VariableMode.READ)

        if var_type in (VariableType.SIMPLE, VariableType.NATIVE):
            keys_to_read.append(key)
            var_info.append((var_name, key, mode))
        elif var_type == VariableType.ADVANCED:
            # Advanced variables are accessed on-demand
            result[var_name] = AdvancedVariable(key, var_client, mode == VariableMode.READ_WRITE)

    # Batch read simple/native variables
    if keys_to_read:
        values = var_client.get_many(keys_to_read)
        for i, (var_name, key, mode) in enumerate(var_info):
            allow_write = mode == VariableMode.READ_WRITE
            result[var_name] = SimpleVariable(key, values[i], var_client, allow_write)

    return result


class SimpleVariable:
    """A simple variable that caches its value."""

    def __init__(self, key: str, initial_value: Any, client: VariableClient, allow_write: bool):
        self.key = key
        self.value = initial_value
        self.client = client
        self.allow_write = allow_write

    def get(self):
        return self.value

    def set(self, value: Any):
        if not self.allow_write:
            raise Exception("Variable write is forbidden.")
        self.value = value
        self.client.write_buffer(self.key, value)


class AdvancedVariable:
    """An advanced variable that reads/writes on demand."""

    def __init__(self, key: str, client: VariableClient, allow_write: bool):
        self.key = key
        self.client = client
        self.allow_write = allow_write

    def get(self):
        return self.client.get(self.key)

    def set(self, value: Any):
        if not self.allow_write:
            raise Exception("Variable write is forbidden.")
        self.client.set(self.key, value)
