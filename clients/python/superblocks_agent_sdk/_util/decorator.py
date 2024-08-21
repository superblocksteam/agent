# wraps async funcs and runs them syncronously as default
# looks for run_async kwarg. if true, runs async
import asyncio
import functools
from typing import Callable


def support_sync(*, async_is_default: bool = True):
    """
    Wraps async funcs and allows them to be run syncronously by looking for a "run_async" kwarg.

    Example:
        @support_sync()
        async def foo():
            await asyncio.sleep(0.1)
            return "foo"

        # can be called like
        await foo()
        # or
        foo(run_async=False)
    """

    def decorator(func: Callable) -> Callable:
        if not asyncio.iscoroutinefunction(func):
            raise Exception("cannot wrap non async func with this decorator")

        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> any:
            run_async = kwargs.pop("run_async", async_is_default)
            ret_func = func(*args, **kwargs)
            if run_async:
                return ret_func
            return asyncio.run(ret_func)

        return wrapper

    return decorator
