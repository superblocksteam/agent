# flake8: noqa
import os
import pickle
from asyncio import create_task

import nest_asyncio  # type: ignore
import pytest

from kvstore.kvstore import MockStore
from pipe import publish, receiveAll
from variables.constants import VariableMode, VariableType
from variables.variable import build_variables
from variables.variable_client import VariableClient
from variables.variable_server import VariableServer

nest_asyncio.apply()


@pytest.mark.asyncio
async def test_utils():
    global tot
    tot = 0

    async def consumer(x):
        global tot
        tot += pickle.loads(x)["rivian"]

    read_fd, write_fd = os.pipe()
    publish(write_fd, {"rivian": 1})
    publish(write_fd, {"rivian": 2})
    publish(write_fd, {"rivian": 3})
    publish(write_fd, {"rivian": 4})
    os.close(write_fd)

    await receiveAll(read_fd, consumer)

    assert tot == 10


@pytest.mark.asyncio
async def test_client_and_server():
    client_to_server_read_fd, client_to_server_write_fd = os.pipe()
    server_to_client_read_fd, server_to_client_write_fd = os.pipe()

    store = MockStore()
    await store.write("rivian", 123)
    await store.write("range-rover", "456")
    await store.write("escalade", {"123": 456})
    await store.write("X6", True)

    variable_server = VariableServer(
        client_to_server_read_fd, server_to_client_write_fd, MockStore()
    )
    await variable_server.start()
    variable_client = VariableClient(
        server_to_client_read_fd, client_to_server_write_fd
    )
    await variable_client.start()

    task1 = create_task(variable_client.read("rivian"))
    task2 = create_task(variable_client.read("rivian"))
    task3 = create_task(variable_client.read("range-rover"))
    task4 = create_task(variable_client.read("escalade"))
    task5 = create_task(variable_client.read("X6"))
    task6 = create_task(variable_client.read("sprinter"))

    task7 = create_task(variable_client.write("landcruiser", 123))
    task8 = create_task(variable_client.write("g63", "123"))
    task9 = create_task(variable_client.write("raptor", {"ok": 123}))
    task10 = create_task(variable_client.write("xc90", False))

    assert await task1 == 123
    assert await task2 == 123
    assert await task3 == "456"
    assert await task4 == {"123": 456}
    assert (await task5) is True
    assert (await task6) is None

    await task7
    await task8
    await task9
    await task10

    value7 = (await store.read(["landcruiser"]))[0][0]
    value8 = (await store.read(["g63"]))[0][0]
    value9 = (await store.read(["raptor"]))[0][0]
    value10 = (await store.read(["xc90"]))[0][0]

    assert value7 == 123
    assert value8 == "123"
    assert value9 == {"ok": 123}
    assert value10 is False

    variable_client.writeBuffer("raptor", {"ok": 456})
    variable_client.writeBuffer("g63", "456")

    task11 = create_task(variable_client.flush())
    await task11

    task12 = create_task(variable_client.readMany(["raptor", "g63"]))
    assert await task12 == [{"ok": 456}, "456"]

    variable_client.close()
    variable_server.close()


@pytest.mark.asyncio
async def test_read_and_write_simple_variables():
    client_to_server_read_fd, client_to_server_write_fd = os.pipe()
    server_to_client_read_fd, server_to_client_write_fd = os.pipe()

    store = MockStore()

    variable_server = VariableServer(
        client_to_server_read_fd, server_to_client_write_fd, store
    )
    await variable_server.start()
    variable_client = VariableClient(
        server_to_client_read_fd, client_to_server_write_fd
    )
    await variable_client.start()

    await store.write("aaa", 123)
    await store.write("bbb", {"ok": "123"})
    await store.write("ccc", True)

    built = await build_variables(
        variable_spec={
            "rivian": {
                "key": "aaa",
                "type": VariableType.SIMPLE,
                "mode": VariableMode.READ_WRITE,
            },
            "defense": {
                "key": "bbb",
                "type": VariableType.SIMPLE,
                "mode": VariableMode.READ_WRITE,
            },
            "raptor": {
                "key": "ccc",
                "type": VariableType.SIMPLE,
                "mode": VariableMode.READ_WRITE,
            },
        },
        variable_client=variable_client,
    )

    assert built["rivian"].value == 123
    assert built["defense"].value == {"ok": "123"}
    assert built["raptor"].value == True

    built["rivian"].set(456)
    built["defense"].set("ok")
    built["raptor"].set(False)
    await variable_client.flush()

    assert built["rivian"].value == 456
    assert built["defense"].value == "ok"
    assert built["raptor"].value == False

    assert (await store.read(["aaa", "bbb", "ccc"]))[0] == [456, "ok", False]

    variable_client.close()
    variable_server.close()


@pytest.mark.asyncio
async def test_read_and_write_advanced_variables():
    client_to_server_read_fd, client_to_server_write_fd = os.pipe()
    server_to_client_read_fd, server_to_client_write_fd = os.pipe()

    store = MockStore()

    variable_server = VariableServer(
        client_to_server_read_fd, server_to_client_write_fd, store
    )
    await variable_server.start()
    variable_client = VariableClient(
        server_to_client_read_fd, client_to_server_write_fd
    )
    await variable_client.start()

    await store.write("aaa", 123)
    await store.write("bbb", {"ok": "123"})
    await store.write("ccc", True)

    built = await build_variables(
        variable_spec={
            "rivian": {
                "key": "aaa",
                "type": VariableType.ADVANCED,
                "mode": VariableMode.READ_WRITE,
            },
            "defense": {
                "key": "bbb",
                "type": VariableType.ADVANCED,
                "mode": VariableMode.READ_WRITE,
            },
            "raptor": {
                "key": "ccc",
                "type": VariableType.ADVANCED,
                "mode": VariableMode.READ_WRITE,
            },
        },
        variable_client=variable_client,
    )

    assert built["rivian"].get() == 123
    assert built["defense"].get() == {"ok": "123"}
    assert built["raptor"].get() == True

    built["rivian"].set(456)
    built["defense"].set("ok")
    built["raptor"].set(False)

    assert built["rivian"].get() == 456
    assert built["defense"].get() == "ok"
    assert built["raptor"].get() == False

    assert (await store.read(["aaa", "bbb", "ccc"]))[0] == [456, "ok", False]

    variable_client.close()
    variable_server.close()


@pytest.mark.asyncio
async def test_read_native_variable():
    client_to_server_read_fd, client_to_server_write_fd = os.pipe()
    server_to_client_read_fd, server_to_client_write_fd = os.pipe()

    store = MockStore()

    variable_server = VariableServer(
        client_to_server_read_fd, server_to_client_write_fd, store
    )
    await variable_server.start()
    variable_client = VariableClient(
        server_to_client_read_fd, client_to_server_write_fd
    )
    await variable_client.start()

    await store.write("aaa", 123)

    built = await build_variables(
        variable_spec={
            "explorer": {
                "key": "aaa",
                "type": VariableType.NATIVE,
                "mode": VariableMode.READ_WRITE,
            }
        },
        variable_client=variable_client,
    )

    assert built["explorer"] == 123

    variable_client.close()
    variable_server.close()
