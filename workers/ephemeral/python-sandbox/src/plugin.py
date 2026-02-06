import json
from datetime import datetime
from src.executor import Executor
from src.props_reader import PluginPropsReader
from src.utils import get_tree_path_to_disk_path
from src.variables.variable_client import VariableClient

class PythonPlugin:
    def __init__(self):
        self.executor = Executor()

    async def execute(
        self,
        plugin_props: dict,
        variable_client: VariableClient,
    ) -> tuple[dict, list[str], list[str]]:

        startDatetime = datetime.utcnow().timestamp()

        props_reader = PluginPropsReader(plugin_props, variable_client, {})
        props = await props_reader.build()

        code = props["actionConfiguration"]["body"]
        if not code.strip():
            return {}, [], []

        props.setdefault("files", [])
        superblocks_files = get_tree_path_to_disk_path(
            props["context"]["globals"], props["files"]
        )

        result, stdout_lines, stderr_lines = self.executor.run(
            code=code,
            context=props["context"],
            variable_client=variable_client,
            variables=props["context"]["variables"],
            superblocks_files=superblocks_files,
        )

        output = {
            "startTimeUtc": startDatetime,
            "request": code,
            "log": stdout_lines,
            "executionTime": round(
                (datetime.utcnow().timestamp() - startDatetime) * 1000
            ),
        }

        try:
            json_output = json.loads(result)
            output.update({"output": json_output})
        except json.JSONDecodeError as e:
            output.update({"error": e})

        error_logs = []
        for err_log in stderr_lines:
            if err_log.startswith("__EXCEPTION__"):
                err_log = err_log.removeprefix("__EXCEPTION__")
                # NOTE(frank): I'm just copy/pasting from JS but we
                # can do better than updating everytime.
                output["error"] = err_log
            stdout_lines.append(f"[ERROR] {err_log}")
            error_logs.append(err_log)

        return output, stdout_lines, stderr_lines
