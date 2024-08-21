import asyncio
from typing import Any, Generator

import pytest
from pytest_mock import MockFixture
from redis.asyncio import Redis
from transport.redis import RedisMessage, RedisTransport


def awaitable_result(result: Any = None) -> asyncio.Future[None]:
    """Create an awaitable result that resolves immediately to the provided value."""
    future: asyncio.Future = asyncio.Future()
    future.set_result(result)
    return future


def true_then_false() -> Generator[bool, None, None]:
    yield True
    while True:
        yield False


def patch_redis(
    mocker: MockFixture, read_group_resp: Any = None, create_group_resp: Any = None
) -> MockFixture:
    mock_redis = mocker.MagicMock(spec=Redis)
    if isinstance(read_group_resp, Exception):
        mock_redis.xreadgroup.side_effect = read_group_resp
    else:
        mock_redis.xreadgroup.return_value = awaitable_result(read_group_resp)

    if isinstance(create_group_resp, Exception):
        mock_redis.xgroup_create.side_effect = create_group_resp
    else:
        mock_redis.xgroup_create.return_value = awaitable_result(create_group_resp)

    mocker.patch.object(Redis, "__new__", return_value=mock_redis)
    return mock_redis


def patch_redis_transport(
    mocker: MockFixture, unpack_resp: Any = None, process_resp: Any = None
) -> tuple[RedisTransport, MockFixture, MockFixture]:
    transport = RedisTransport()
    type(transport)._alive = mocker.PropertyMock(side_effect=true_then_false())

    patch_unpack = mocker.patch.object(
        transport, "_unpack_stream_response", return_value=unpack_resp
    )
    patch_process_msg = mocker.patch.object(
        transport, "_process_message", return_value=process_resp
    )

    return transport, patch_unpack, patch_process_msg


@pytest.mark.asyncio
@pytest.mark.parametrize("read_resp", [None, []])
async def test_start_polling_handles_no_messages(
    read_resp: Any, mocker: MockFixture
) -> None:
    patch_error_log = mocker.patch("transport.redis.log.error")
    mock_redis = patch_redis(mocker, read_group_resp=read_resp)
    transport, _, _ = patch_redis_transport(mocker)

    await transport._start_polling()

    mock_redis.xreadgroup.assert_called_once()
    patch_error_log.assert_not_called()


@pytest.mark.asyncio
async def test_start_polling_processes_messages(mocker: MockFixture) -> None:
    mocker.patch("transport.redis.SUPERBLOCKS_AGENT_ASYNC_REDIS", return_value=True)
    patch_error_log = mocker.patch("transport.redis.log.error")
    mock_redis = patch_redis(mocker, read_group_resp=[{"streams": "data"}])
    transport, patch_unpack, patch_process_msg = patch_redis_transport(
        mocker, unpack_resp=[RedisMessage(message_id="123", message_body="data")]
    )

    await transport._start_polling()

    mock_redis.xreadgroup.assert_called_once()
    patch_unpack.assert_called_once()
    patch_process_msg.assert_called_once()
    patch_error_log.assert_not_called()


@pytest.mark.asyncio
async def test_start_polling_handles_redis_errors(mocker: MockFixture) -> None:
    mock_redis = patch_redis(
        mocker, read_group_resp=Exception("could not connect to redis")
    )
    transport, patch_unpack, patch_process_msg = patch_redis_transport(
        mocker, unpack_resp=[RedisMessage(message_id="123", message_body="data")]
    )
    patch_process_error = mocker.patch.object(transport, "process_redis_read_error")

    await transport._start_polling()

    mock_redis.xreadgroup.assert_called_once()
    patch_process_error.assert_called_once()
    patch_unpack.assert_not_called()
    patch_process_msg.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("raise_already_exist_err", [True, False])
async def test_process_read_error_recreates_stream_if_missing(
    raise_already_exist_err: bool, mocker: MockFixture
) -> None:
    mock_redis = patch_redis(
        mocker,
        create_group_resp=Exception("BUSYGROUP Consumer Group name already exists")
        if raise_already_exist_err
        else None,
    )
    patch_mark_unhealthy = mocker.patch("transport.redis.mark_worker_unhealthy")

    await RedisTransport().process_redis_read_error(Exception("NOGROUP No such key"))

    mock_redis.xgroup_create.assert_called_once()
    patch_mark_unhealthy.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("raise_no_stream_err", [True, False])
async def test_process_read_error_marks_worker_unhealthy(
    raise_no_stream_err: bool, mocker: MockFixture
) -> None:
    mock_redis = patch_redis(
        mocker, create_group_resp=Exception("could not connect to redis")
    )
    patch_mark_unhealthy = mocker.patch("transport.redis.mark_worker_unhealthy")
    err_msg = "NOGROUP No such key" if raise_no_stream_err else "redis read timeout"

    await RedisTransport().process_redis_read_error(Exception(err_msg))

    patch_mark_unhealthy.assert_called_once()
    if raise_no_stream_err:
        mock_redis.xgroup_create.assert_called_once()
