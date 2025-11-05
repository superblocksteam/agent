from __future__ import annotations

import builtins
import os
from contextlib import contextmanager
from typing import Any, Callable

from constants import (
    SUPERBLOCKS_PYTHON_EXECUTION_BUILTINS_DENY_LIST,
    SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_ALLOW_LIST,
    SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_DENY_LIST,
)

_real_import = builtins.__import__


@contextmanager
def restricted_environment(env_vars: dict | None = None):
    """
    Restricts the environment to the given variables.
    If no environment variables are provided, the environment will be cleared.

    Args:
        env_vars: A dictionary of the environment variables to include in the restricted environment.
    """
    existing_env = os.environ.copy()
    try:
        os.environ.clear()
        if env_vars is not None:
            os.environ.update(env_vars)
        yield
    finally:
        os.environ.clear()
        os.environ.update(existing_env)


def restricted_import_wrapper(
    import_inclusion_list: list[str] = [],
    import_exclusion_list: list[str] = [],
) -> Callable[[str, Any, Any, Any, Any], Any]:
    """
    Wraps the built-in __import__ function with logic to restrict which modules can be
    imported. The wrapped function will raise an ImportError if the module is blocked or
    if the module is not in the inclusion list and the inclusion list is not "*".

    If the exclusion list and the inclusion list (implicitly) contain the same module, the
    exclusion list takes precedence and the module will be blocked.

    Args:
        import_inclusion_list: A list of module names to allow. If the list contains a single "*", all imports are allowed.
        import_exclusion_list: A list of module names to block.

    Returns:
        A wrapped __import__ function that restricts imports.
    """
    allow_all_imports = (
        len(import_inclusion_list) == 1 and import_inclusion_list[0] == "*"
    )

    def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
        root = name.split(".", 1)[0]
        import_allowed = allow_all_imports or root in import_inclusion_list
        import_blocked = root in import_exclusion_list

        if import_blocked or not import_allowed:
            raise ImportError(f"Import of {root!r} is blocked")
        return _real_import(name, globals, locals, fromlist, level)

    return restricted_import


def build_allowed_builtins(
    import_inclusion_list: list[str] = [],
    import_exclusion_list: list[str] = [],
    builtins_exclusion_list: list[str] = [],
) -> dict[str, Any]:
    """
    Builds a dictionary of allowed builtins. The dictionary will contain all builtins
    except those specified in the builtins_exclusion_list, as well as the restricted
    __import__ function.

    Args:
        import_inclusion_list: A list of module names to allow. If the list contains a single "*", all imports are allowed.
        import_exclusion_list: A list of module names to block.
        builtins_exclusion_list: A list of builtins to exclude.

    Returns:
        A dictionary of allowed builtins.
    """
    allowed_builtins = {
        name: getattr(builtins, name)
        for name in dir(builtins)
        if name not in builtins_exclusion_list
    }
    allowed_builtins["__import__"] = restricted_import_wrapper(
        import_inclusion_list,
        import_exclusion_list,
    )
    return allowed_builtins


ALLOW_BUILTINS = build_allowed_builtins(
    import_inclusion_list=SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_ALLOW_LIST,
    import_exclusion_list=SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_DENY_LIST,
    builtins_exclusion_list=SUPERBLOCKS_PYTHON_EXECUTION_BUILTINS_DENY_LIST,
)
