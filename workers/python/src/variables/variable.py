import asyncio
from typing import Any

from variables.constants import VariableMode, VariableType
from variables.variable_client import VariableClient


async def build_variables(
    variable_spec: dict[str, dict], variable_client
) -> dict[str, Any]:
    def is_object(thing):
        return thing is not None and isinstance(thing, dict)

    if not is_object(variable_spec):
        raise ValueError("Failed to build the variable: invalid variableSpec.")

    ret = {}
    variables_read_in_advance = []
    for variable_name, variable_property in variable_spec.items():
        if not is_object(variable_property):
            raise ValueError(f"Failed to build the variable: {variable_name}")

        key, type, mode = (
            variable_property.get("key"),
            variable_property.get("type"),
            variable_property.get("mode"),
        )

        allow_write = mode == VariableMode.READ_WRITE

        if type == VariableType.SIMPLE or type == VariableType.NATIVE:
            variables_read_in_advance.append(
                {"variable_name": variable_name, "key": key, "type": type, "mode": mode}
            )
        elif type == VariableType.ADVANCED:
            ret[variable_name] = AdvancedVariable(key, variable_client, allow_write)  # type: ignore

    values = await variable_client.readMany(
        [v["key"] for v in variables_read_in_advance]
    )

    for i, variable in enumerate(variables_read_in_advance):
        variable_name, key, mode, type = (
            variable["variable_name"],
            variable["key"],
            variable["mode"],
            variable["type"],
        )
        value = values[i]

        allow_write = mode == VariableMode.READ_WRITE

        if type == VariableType.SIMPLE:
            ret[variable_name] = SimpleVariable(
                key, value, variable_client, allow_write
            )  # type: ignore
        elif type == VariableType.NATIVE:
            ret[variable_name] = value
        else:
            raise Exception(
                "This should not happen: pre-read variables are not simple or native."
            )

    return ret


class SimpleVariable:
    def __init__(
        self,
        store_key: str,
        initial_value: Any,
        variable_client: VariableClient,
        allow_write: bool,
    ):
        self.store_key = store_key
        self.variable_client = variable_client
        self.value = initial_value
        self.allow_write = allow_write

    # def get(self):
    #     return self.value

    def set(self, value: Any):
        if not self.allow_write:
            raise Exception("Variable write is forbidden.")
        self.value = value
        self.variable_client.writeBuffer(self.store_key, value)


class AdvancedVariable:
    def __init__(
        self, store_key: str, variable_client: VariableClient, allow_write: bool
    ):
        self.store_key = store_key
        self.variable_client = variable_client
        self.allow_write = allow_write

    def get(self):
        result = asyncio.run(self.variable_client.read(self.store_key))
        return result

    def set(self, value: Any):
        if not self.allow_write:
            raise Exception("Variable write is forbidden.")
        asyncio.run(self.variable_client.write(self.store_key, value))


# def variablesCodeGen(variablesSpec: dict):
#     for scope, variables in variablesSpec.items():
#
