from json import dumps
from logging import basicConfig
from logging import debug as lDebug
from logging import error as lError
from logging import info as lInfo
from logging import warn as lWarn
from math import floor
from time import time

from constants import SUPERBLOCKS_AGENT_LOG_JSON_FORMAT, SUPERBLOCKS_AGENT_LOG_LEVEL

if SUPERBLOCKS_AGENT_LOG_JSON_FORMAT:
    basicConfig(level=SUPERBLOCKS_AGENT_LOG_LEVEL, format="%(message)s")
else:
    basicConfig(level=SUPERBLOCKS_AGENT_LOG_LEVEL)


def info(message, /, **kwargs) -> None:
    lInfo(msg(message, level="info", **kwargs))


def error(message, /, **kwargs) -> None:
    lError(msg(message, level="error", **kwargs))


def warn(message, /, **kwargs) -> None:
    lWarn(msg(message, level="warn", **kwargs))


def debug(message, /, **kwargs) -> None:
    lDebug(msg(message, level="debug", **kwargs))


def msg(message, /, **kwargs) -> str:
    if SUPERBLOCKS_AGENT_LOG_JSON_FORMAT:
        return dumps(construct_json_msg(message, **kwargs), separators=(",", ":"))
    else:
        return message


def construct_json_msg(message, /, **kwargs) -> dict:
    return {
        "msg": message,
        "ts": floor(time() * 1000),
        "component": "worker.py",
        **kwargs,
    }
