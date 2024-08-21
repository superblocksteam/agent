from datetime import datetime
from typing import Callable

MILLION = 1000000


def now_seconds() -> int:
    return int(datetime.now().timestamp())


def now_microseconds() -> int:
    return int(datetime.now().timestamp() * MILLION)


async def observe(observable: dict, fn: Callable):
    observable["start"] = observable.get("start", now_microseconds())

    try:
        return await fn()
    finally:
        observable["end"] = now_microseconds()
        observable["value"] = observable["end"] - observable["start"]
