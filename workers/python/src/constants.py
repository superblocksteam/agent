import os
from typing import Any, Callable, Optional, Type
from uuid import uuid4

from dotenv import load_dotenv

load_dotenv()

PLUGIN_NAME = "python"
PLUGIN_EVENT = "execute"

OBS_CORRELATION_ID_TAG = "correlation-id"


def __cast_bool(value: str) -> bool:
    if value in ("true", "True", "1"):
        return True
    elif value in ("false", "False", "0"):
        return False
    raise ValueError(f"could not cast value '{value}' to bool")


def __cast_list(value: str) -> list:
    if value == "":
        return []
    return [v.strip() for v in value.split(",")]


__type_to_cast_func: dict[type, Callable] = {bool: __cast_bool, list: __cast_list}


def get_env_var(
    name: str,
    *,
    default: Optional[str | bool | int | list] = None,
    as_type: Type[str | bool | int | list] = str,
    unset: bool = True,
) -> Any:
    """
    Gets the env var with the given name.
    Unsets the env var by default.
    Will attempt to cast to the type given or will just cast to str by default.
    If the env var is not found the given default will be returned as is.
    """
    result = os.environ.get(name, None)
    if result is None:
        return default
    var = result
    cast_func = __type_to_cast_func.get(as_type, as_type)
    try:
        var = cast_func(result)
    except Exception as e:
        print(f"could not cast result as type '{as_type}': {e}")
        raise e
    if unset:
        # NOTE: (joey) os.unsetenv() does not work on macos
        os.unsetenv(name)
        os.environ.pop(name, None)
    return var


AGENT_KEY_HEADER = "x-superblocks-agent-key"
SUPERBLOCKS_AGENT_PLATFORM_NAME = "main"
SUPERBLOCKS_AGENT_DOMAIN = get_env_var(
    "__SUPERBLOCKS_AGENT_DOMAIN", default="superblocks.com"
)
SUPERBLOCKS_WORKER_ID = get_env_var("__SUPERBLOCKS_WORKER_ID", default=str(uuid4()))

SUPERBLOCKS_WORKER_VERSION = get_env_var("SUPERBLOCKS_WORKER_VERSION", default="v0.0.0")

SUPERBLOCKS_AGENT_KEY = get_env_var("SUPERBLOCKS_AGENT_KEY")

SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS = get_env_var(
    "SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS", default=1200000, as_type=int
)
SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST = get_env_var(
    "SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST", default=[], as_type=list
)
SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE = get_env_var(
    "__SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE", default=True, as_type=bool
)
SUPERBLOCKS_AGENT_INTAKE_TRACES_URL = get_env_var(
    "__SUPERBLOCKS_AGENT_INTAKE_TRACES_URL",
    default="https://traces.intake.superblocks.com/v1/traces",
)
SUPERBLOCKS_WORKER_SUBPROCESS_UID = get_env_var(
    "SUPERBLOCKS_WORKER_SUBPROCESS_UID", default=1000, as_type=int
)
SUPERBLOCKS_WORKER_SUBPROCESS_GID = get_env_var(
    "SUPERBLOCKS_WORKER_SUBPROCESS_GID", default=1000, as_type=int
)
SUPERBLOCKS_WORKER_HEALTHY_PATH = get_env_var(
    "SUPERBLOCKS_WORKER_HEALTHY_PATH", default="/tmp/worker_healthy"
)
SUPERBLOCKS_AGENT_BUCKET = get_env_var("SUPERBLOCKS_AGENT_BUCKET")
SUPERBLOCKS_AGENT_TLS_INSECURE = get_env_var(
    "SUPERBLOCKS_AGENT_TLS_INSECURE", default=False, as_type=bool
)
SUPERBLOCKS_AGENT_REDIS_HOST = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_HOST", default="localhost"
)
SUPERBLOCKS_AGENT_REDIS_PORT = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_PORT", default=6379, as_type=int
)
SUPERBLOCKS_AGENT_REDIS_TOKEN = get_env_var("SUPERBLOCKS_AGENT_REDIS_TOKEN")
SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST", default="localhost"
)
SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT", default=6379, as_type=int
)
SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN"
)
SUPERBLOCKS_AGENT_REDIS_GROUP = get_env_var("SUPERBLOCKS_AGENT_REDIS_GROUP", default="")
SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE", default=10000, as_type=int
)
SUPERBLOCKS_AGENT_REDIS_SOCKET_TIMEOUT_SECONDS = get_env_var(
    "SUPERBLOCKS_AGENT_REDIS_SOCKET_TIMEOUT_SECONDS", default=180, as_type=int
)
SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS = get_env_var(
    "SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS", default=3600, as_type=int
)
SUPERBLOCKS_AGENT_LOG_JSON_FORMAT = get_env_var(
    "SUPERBLOCKS_AGENT_LOG_JSON_FORMAT", default=True, as_type=bool
)
SUPERBLOCKS_AGENT_LOG_LEVEL = get_env_var(
    "SUPERBLOCKS_AGENT_LOG_LEVEL", default="INFO"
).upper()
SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE = get_env_var(
    "SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE",
    default="https://logs.intake.superblocks.com",
)
SUPERBLOCKS_SLIM_IMAGE = get_env_var(
    "SUPERBLOCKS_SLIM_IMAGE", default=False, as_type=bool
)
SUPERBLOCKS_AGENT_HEALTH_HOST = get_env_var(
    "SUPERBLOCKS_AGENT_HEALTH_HOST", default="127.0.0.1"
)
SUPERBLOCKS_AGENT_HEALTH_PORT = get_env_var(
    "SUPERBLOCKS_AGENT_HEALTH_PORT", default=1717, as_type=int
)
SUPERBLOCKS_AGENT_ASYNC_REDIS = get_env_var(
    "SUPERBLOCKS_AGENT_ASYNC_REDIS", default=True, as_type=bool
)
SUPERBLOCKS_METRICS_PORT = get_env_var("SB_METRICS_PORT", default=9090, as_type=int)
SUPERBLOCKS_METRICS_BIND_ADDRESS = get_env_var(
    "SUPERBLOCKS_METRICS_BIND_ADDRESS", default="0.0.0.0", as_type=str
)
