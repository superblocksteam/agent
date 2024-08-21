import asyncio
import unittest

from superblocks_agent_sdk._util.decorator import support_sync


@support_sync()
async def func_async_default():
    return "foo"


@support_sync(async_is_default=False)
async def func_async_non_default():
    return "foo"


class TestDecorator(unittest.TestCase):
    def test_support_sync__non_async_func(self):
        with self.assertRaises(Exception) as context:

            @support_sync()
            def func(): ...

        self.assertEqual(
            "cannot wrap non async func with this decorator", str(context.exception)
        )

    def test_support_sync__run_async_default(self):
        resp = asyncio.run(func_async_default())
        self.assertEqual("foo", resp)

    def test_support_sync__run_async_true(self):
        resp = asyncio.run(func_async_default(run_async=True))
        self.assertEqual("foo", resp)

    def test_support_sync__run_async_false(self):
        resp = func_async_default(run_async=False)
        self.assertEqual("foo", resp)

    def test_support_sync__run_async_default_changed(self):
        resp = func_async_non_default()
        self.assertEqual("foo", resp)

    def test_support_sync__run_async_default_changed_true(self):
        resp = asyncio.run(func_async_non_default(run_async=True))
        self.assertEqual("foo", resp)

    def test_support_sync__run_async_default_changed_false(self):
        resp = func_async_non_default(run_async=False)
        self.assertEqual("foo", resp)
