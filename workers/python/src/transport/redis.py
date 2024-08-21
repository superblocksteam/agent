import asyncio
import traceback
from typing import Any, Coroutine, Dict, List, Optional, Set

import log
import ujson
from constants import (
    OBS_CORRELATION_ID_TAG,
    PLUGIN_EVENT,
    PLUGIN_NAME,
    SUPERBLOCKS_AGENT_ASYNC_REDIS,
    SUPERBLOCKS_AGENT_BUCKET,
    SUPERBLOCKS_AGENT_PLATFORM_NAME,
    SUPERBLOCKS_AGENT_REDIS_GROUP,
    SUPERBLOCKS_WORKER_ID,
)
from health import mark_worker_healthy, mark_worker_unhealthy
from kvstore.kvstore import KVStore
from metrics import busy_seconds_counter
from models import Quotas
from opentelemetry import baggage, trace
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from otel import get_tracer
from performance.utils import now_microseconds, now_seconds
from plugin.plugin import Event, Python
from pydantic import BaseModel
from redis.asyncio import Redis

from transport.constants import INBOX_ACK_MESSAGE_ID, INBOX_DATA_MESSAGE_ID
from transport.errors import RedisMalformedResponseError
from transport.signal import attach_signal_handlers
from transport.transport import Transport

REDIS_STREAM_EXISTS_ERROR = "BUSYGROUP Consumer Group name already exists"
REDIS_STREAM_NOT_EXISTS_ERROR = "NOGROUP No such key"


class RequestData(BaseModel):
    props: dict
    baggage: Optional[dict]
    quotas: Optional[Quotas]


class RedisMessage(BaseModel):
    message_id: str
    message_body: str


class RequestMetadata(BaseModel):
    # Plugin Name
    name: str
    # Plugin Event
    event: str
    bucket: str
    carrier: Optional[dict]


class RequestDataWrapper(BaseModel):
    data: RequestData
    pinned: Optional[RequestMetadata]


class ExecuteRequest(BaseModel):
    inbox: str
    data: RequestDataWrapper


class RedisTransport(Transport):
    def __init__(
        self,
        kv_store: Optional[KVStore] = None,
        url: str = "",
        batch: int = 2,
        redis_options: dict = {},
    ) -> None:
        if url:
            self._client: Redis = Redis.from_url(
                url, **{"decode_responses": True, **redis_options}
            )
        else:
            self._client = Redis(**{"decode_responses": True, **redis_options})  # type: ignore
        self._kv_store = kv_store
        self._stream: str = (
            f"agent.{SUPERBLOCKS_AGENT_PLATFORM_NAME}.bucket.{SUPERBLOCKS_AGENT_BUCKET}"
            f".plugin.{PLUGIN_NAME}.event.{PLUGIN_EVENT}"
        )
        self._batch = batch
        self._alive = False
        self._plugin = Python()
        self._tasks: Set[Coroutine] = set()

    async def init(self):
        await self.__init_stream()

        loop = asyncio.get_event_loop()
        attach_signal_handlers(self, loop)

        self._alive = True
        mark_worker_healthy()
        await self._start_polling()

    def alive(self) -> bool:
        return self._alive

    async def __init_stream(self):
        try:
            await self._client.xgroup_create(
                name=self._stream,
                groupname=SUPERBLOCKS_AGENT_REDIS_GROUP,
                id="0",
                mkstream=True,
            )
            log.info(f"created stream, {self._stream}")
        except Exception as e:
            if str(e) == REDIS_STREAM_EXISTS_ERROR:
                log.info(f"verfied stream, {self._stream}")
            else:
                log.error(f"could not create or verify stream, {str(e)}")
                raise e

    async def close(self, reason: str):
        log.info(f"shutdown request received, {reason}", who="transport")
        self._alive = False
        while len(self._tasks) > 0:
            await asyncio.gather(*self._tasks)
        await self._client.close()

    async def _start_polling(self):
        while self._alive:
            streams = None
            try:
                streams = await self._client.xreadgroup(
                    groupname=SUPERBLOCKS_AGENT_REDIS_GROUP,
                    consumername=SUPERBLOCKS_WORKER_ID,
                    streams={self._stream: ">"},
                    count=self._batch,
                    block=5000,
                )
            except Exception as e:
                log.error("failed to read from stream, processing error...", err=str(e))
                await self.process_redis_read_error(e)

            # No messages received
            if not streams:
                log.debug("no messages read")
                continue

            if len(streams) < 1:
                log.error(
                    f"failed to read from stream, {str(RedisMalformedResponseError())}"
                )

            start_time = now_seconds()

            try:
                messages: List[RedisMessage] = self._unpack_stream_response(streams)

                for message in messages:
                    task = asyncio.create_task(self._process_message(message))
                    self._tasks.add(task)
                    task.add_done_callback(self._tasks.discard)

                if not SUPERBLOCKS_AGENT_ASYNC_REDIS:
                    await asyncio.gather(*self._tasks)
                    busy_seconds_counter.inc(now_seconds() - start_time)

            except Exception as e:
                # FIXME(bruce): This error message is kind of useless since it just logs the first exception
                # in the batch
                log.error("failed to process some messages from stream", err=str(e))

    async def process_redis_read_error(self, e: Exception) -> None:
        try:
            if str(e).startswith(REDIS_STREAM_NOT_EXISTS_ERROR):
                await self.__init_stream()
            else:
                raise e from None
        except Exception as e:
            log.error(
                "could not read from stream or re-create it, marking worker as unhealthy",
                err=str(e),
            )
            mark_worker_unhealthy()

    async def _process_message(self, redis_message: RedisMessage) -> None:
        step_performance: Dict[str, Any] = dict()
        step_performance.setdefault("queueRequest", {})["end"] = now_microseconds()

        message = redis_message.message_body

        await self._client.xack(
            self._stream, SUPERBLOCKS_AGENT_REDIS_GROUP, redis_message.message_id
        )

        execute_request = self._decode(message)

        obs_tags: Dict[str, Any] = (
            {OBS_CORRELATION_ID_TAG: execute_request.data.data.props.get("executionId")}
            if execute_request.data.data.props.get("executionId")
            else {}
        )

        carrier = (
            execute_request.data.pinned.carrier
            if execute_request.data.pinned is not None
            and execute_request.data.pinned.carrier is not None
            else {}
        )

        # TODO(bruce): Wrap this in a retry later
        try:
            await self._client.xadd(
                execute_request.inbox,
                {"data": "ack"},
                INBOX_ACK_MESSAGE_ID,
            )
        except Exception as e:
            log.error(
                "dropping request due to ack failure",
                err=str(e),
                inbox=execute_request.inbox,
                **obs_tags,
            )
            raise e

        propagator = TraceContextTextMapPropagator()
        ctx = propagator.extract(carrier)

        # This is a workaround until we implement a redis based propagator
        baggage_propagator = W3CBaggagePropagator()
        baggage_ctx = baggage_propagator.extract(carrier)
        obs_tags.update(baggage.get_all(baggage_ctx))

        with get_tracer().start_as_current_span(
            "execute.step.python",
            context=ctx,
            attributes=obs_tags,
            kind=trace.SpanKind.SERVER,
        ):
            result = {"data": {"pinned": step_performance, "data": {}}}

            try:
                log.debug("executing request", **obs_tags)
                result["data"]["data"] = await self._plugin.run(
                    Event.from_str(PLUGIN_EVENT),
                    {"pluginProps": execute_request.data.data.props},
                    kv_store=self._kv_store,
                    step_performance=step_performance,
                    baggage=execute_request.data.data.baggage,
                    quotas=execute_request.data.data.quotas
                    or {"size": None, "duration": None},
                    # baggage is write only by design, and not meant to be used as a
                    # way of passing parameters. we may be able to hook in our logger
                    # into otel's baggage, but that's a future task.
                    log_attributes=obs_tags,
                )
                log.info(
                    "executed request",
                    quotas=execute_request.data.data.quotas,
                    **obs_tags,
                )
            except Exception as e:
                log.error("plugin execution failed", err=str(e), **obs_tags)
                result["pinned"] = {
                    "name": e.__class__.__name__,
                    "message": str(e),
                }
                traceback.print_exc()

            try:
                step_performance["queueResponse"] = {"start": now_microseconds()}
                serialized_result = ujson.dumps(result)
            except Exception as e:
                log.error(f"could not encode response, {str(e)}", **obs_tags)
                serialized_result = ujson.dumps(
                    {"err": {"cause": f"{e.__class__.__name__}: {str(e)}"}}
                )

            try:
                log.info("[BEFORE] publishing response", **obs_tags)
                await self._client.xadd(
                    execute_request.inbox,
                    {"data": serialized_result},
                    INBOX_DATA_MESSAGE_ID,
                    nomkstream=True,
                )
                log.info("[AFTER] publishing response", **obs_tags)
            except Exception as e:
                log.error(f"[ERROR] publishing response, {str(e)}", **obs_tags)
                raise e

    def _decode(self, message) -> ExecuteRequest:
        if not message:
            raise RedisMalformedResponseError("message body is empty")

        try:
            parsed_message = ujson.loads(message)
        except ujson.JSONDecodeError:
            log.error("could not decode message")

        try:
            request_data = RequestData(**parsed_message["data"]["data"])
            request_metadata = RequestMetadata(**parsed_message["data"]["pinned"])
            wrapper = RequestDataWrapper(data=request_data, pinned=request_metadata)
            execute_request = ExecuteRequest(
                data=wrapper, inbox=parsed_message["inbox"]
            )
            execute_request.inbox = parsed_message["inbox"]
        except (KeyError, TypeError) as e:
            log.error(f"message schema does not match request schema, {str(e)}")
            raise e

        return execute_request

    def _unpack_stream_response(self, streams) -> List[RedisMessage]:
        if not isinstance(streams, list):
            raise RedisMalformedResponseError("stream messages must be an array")

        if len(streams) < 1:
            raise RedisMalformedResponseError("no stream messages returned")

        all_messages: List[RedisMessage] = []
        for stream in streams:
            try:
                stream_name = stream[0]
                assert stream_name == self._stream
                stream_messages = stream[1]
            except (IndexError, AssertionError) as e:
                raise RedisMalformedResponseError(str(e))

            for stream_message in stream_messages:
                message_id, message = stream_message
                redis_message = self._validate_message(message_id, message)
                all_messages.append(redis_message)
        return all_messages

    def _validate_message(self, message_id, message) -> RedisMessage:
        if not isinstance(message, dict):
            raise RedisMalformedResponseError(f"message {message_id} is malformed")
        if not isinstance(message_id, str):
            raise RedisMalformedResponseError(
                f"message {message_id} is malformed: id must be a string"
            )
        if not isinstance(message.get("data"), str):
            raise RedisMalformedResponseError(
                f"message {message_id} is malformed: message must be a str"
            )

        return RedisMessage(message_id=message_id, message_body=message.get("data"))
