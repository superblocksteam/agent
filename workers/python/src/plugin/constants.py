from enum import Enum
from uuid import uuid4

STREAM_PROPERTIES = [
    "actionConfiguration",
    "agentCredentials",
    "bindingKeys",
    "datasourceConfiguration",
    "environment",
    "executionId",
    "files",
    "recursionContext",
    "redactedDatasourceConfiguration",
    "relayDelegate",
    "stepName",
    "forwardedCookies",
    "$fileServerUrl",
    "$flagWorker",
]

STORE_PROPERTY = "context"


class ContextCategory(str, Enum):
    CONTEXT_GLOBAL = "context.global"
    CONTEXT_OUTPUT = "context.output"
    CONTEXT_OUTPUT_V2 = "context.output.v2"


def get_store_key(execution_id: str, category: str, key: str):
    if category == ContextCategory.CONTEXT_OUTPUT_V2:
        uuid = uuid4()
        return f"{execution_id}.output.{uuid}"
    return f"{execution_id}.{category}.{key}"
