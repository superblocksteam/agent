import os

import nest_asyncio  # type: ignore
import pytest
from kvstore.kvstore import MockStore
from plugin.plugin import Python
from pytest_mock import MockFixture
from variables.constants import VariableMode, VariableType

nest_asyncio.apply()


@pytest.mark.asyncio
async def test_read_and_write():
    kv_store = MockStore()
    await kv_store.write("aaa", 123)
    await kv_store.write("bbb", "456")
    await kv_store.write("ccc", 789)

    context = {
        "globals": {"$agentKey": "", "$superblocksFiles": {}},
        "outputs": {},
        "variables": {
            "rivian": {
                "key": "aaa",
                "type": VariableType.SIMPLE,
                "mode": VariableMode.READ_WRITE,
            },
            "defense": {
                "key": "bbb",
                "type": VariableType.ADVANCED,
                "mode": VariableMode.READ_WRITE,
            },
            "explorer": {
                "key": "ccc",
                "type": VariableType.NATIVE,
                "mode": VariableMode.READ_WRITE,
            },
        },
    }

    p = Python()
    result = await p.execute(
        {
            "actionConfiguration": {
                "body": "return rivian.value, defense.get(), explorer"
            },
            "context": context,
        },
        kv_store,
        None,
        {"size": None, "duration": None},
        None,
        {},
    )
    output = result["executionOutput"]["output"]
    assert output[0] == 123
    assert output[1] == "456"
    assert output[2] == 789

    p = Python()
    result = await p.execute(
        {
            "actionConfiguration": {
                "body": "rivian.set(True)\ndefense.set({'ok': 123})\nreturn rivian.value, defense.get()"
            },
            "context": context,
        },
        kv_store,
        None,
        {"size": None, "duration": None},
        None,
        {},
    )
    output = result["executionOutput"]["output"]
    assert output == [True, {"ok": 123}]

    p = Python()
    result = await p.execute(
        {
            "actionConfiguration": {"body": "return rivian.value, defense.get()"},
            "context": context,
        },
        kv_store,
        None,
        {"size": None, "duration": None},
        None,
        {},
    )
    output = result["executionOutput"]["output"]
    assert output == [True, {"ok": 123}]

    assert (await kv_store.read(["aaa", "bbb"]))[0] == [True, {"ok": 123}]


@pytest.mark.asyncio
async def test_kv_store_backwards_compatibility():
    kv_store = MockStore()
    await kv_store.write("aaa", 123)
    await kv_store.write("bbb", "456")

    context = {
        "globals": {"$agentKey": "", "$superblocksFiles": {}},
        "outputs": {},
    }

    p = Python()
    result = await p.execute(
        {
            "actionConfiguration": {"body": "return 123"},
            "context": context,
        },
        kv_store,
        None,
        {"size": None, "duration": None},
        None,
        {},
    )
    output = result["executionOutput"]["output"]
    assert output == 123


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "inclusion_list, expected",
    [
        (
            ["AWS_CONTAINER_CREDENTIALS_RELATIVE_URI", "TEST_ENV_VAR"],
            {
                "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI": "arn://aws:1234",
                "TEST_ENV_VAR": "test_value",
            },
        ),
        (
            ["AWS_CONTAINER_CREDENTIALS_RELATIVE_URI", "NON_EXISTENT_ENV_VAR"],
            {"AWS_CONTAINER_CREDENTIALS_RELATIVE_URI": "arn://aws:1234"},
        ),
        ([], {}),
    ],
)
async def test_environment_is_overwritten(
    inclusion_list: list[str], expected: dict[str, str], mocker: MockFixture
):
    context = {
        "globals": {"$agentKey": "", "$superblocksFiles": {}},
        "outputs": {},
        "variables": {},
    }

    mocker.patch(
        "executor.SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST",
        inclusion_list,
    )

    os.environ["AWS_CONTAINER_CREDENTIALS_RELATIVE_URI"] = "arn://aws:1234"
    os.environ["PATH"] = "/usr/bin"
    os.environ["HOME"] = "/home/user"
    os.environ["TEST_ENV_VAR"] = "test_value"

    p = Python()
    result = await p.execute(
        {
            "actionConfiguration": {
                "body": """
import os
result = {}
for k, v in os.environ.items():
    result[k] = v
return result
"""
            },
            "context": context,
        },
        MockStore(),
        None,
        {"size": None, "duration": None},
        None,
        {},
    )

    output = result["executionOutput"]["output"]
    assert output == expected
