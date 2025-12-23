"""Constants for the Python sandbox."""

import os
from typing import Any, Callable, Optional, Type

from dotenv import load_dotenv

load_dotenv()

PLUGIN_NAME = "python-sandbox"


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
        os.unsetenv(name)
        os.environ.pop(name, None)
    return var


# gRPC server configuration
SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT = get_env_var(
    "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT", default=50051, as_type=int
)
SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_MAX_WORKERS = get_env_var(
    "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_MAX_WORKERS", default=10, as_type=int
)
SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE = get_env_var(
    "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_REQUEST_SIZE",
    default=30000000,  # ~30MB
    as_type=int,
)
SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE = get_env_var(
    "SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_MAX_RESPONSE_SIZE",
    default=100000000,  # ~100MB
    as_type=int,
)

# Sandbox execution configuration
SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST = get_env_var(
    "SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST", default=[], as_type=list
)
SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_ALLOW_LIST = get_env_var(
    "SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_ALLOW_LIST", default=["*"], as_type=list
)
SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_DENY_LIST = get_env_var(
    "SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_DENY_LIST", default=[], as_type=list
)
SUPERBLOCKS_PYTHON_EXECUTION_BUILTINS_DENY_LIST = get_env_var(
    "SUPERBLOCKS_PYTHON_EXECUTION_BUILTINS_DENY_LIST", default=[], as_type=list
)
