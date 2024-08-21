from typing import Any, Dict


class PluginPropsBuilderError(Exception):
    pass


class ExecutionOutputPropsBuilder:
    def __init__(self, execution_id: str, step_name: str, output: dict) -> None:
        if not output:
            raise PluginPropsBuilderError("Cannot build from empty output")

        self._pluginProps: Dict[str, Any] = {}
        self._pluginProps["context"] = {"outputs": {step_name: output}}
        self._pluginProps["executionId"] = execution_id

    def build(self):
        return self._pluginProps
