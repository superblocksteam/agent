import os

import ujson
from redis import Redis


def _get_redis_key():
    return os.environ.get("TEST_REDIS_KEY", "koala")


def _get_redis_host():
    return os.environ.get("TEST_REDIS_HOST", "localhost")


def _get_redis_port():
    return os.environ.get("TEST_REDIS_PORT", "6379")


class TestRedisClient:
    STREAM_NAME = "agent.main.bucket.test.plugin.python.event.execute"

    def __init__(
        self,
    ) -> None:
        self._client: Redis = Redis.from_url(
            f"redis://:{_get_redis_key()}@{_get_redis_host()}:{_get_redis_port()}",
            decode_responses=True,
        )

    def execute(self, inbox_id, plugin_request):
        try:
            message_id = self._client.xadd(
                self.STREAM_NAME,
                {
                    "data": ujson.dumps(
                        {
                            "inbox": inbox_id,
                            "data": {
                                "data": {"props": plugin_request},
                                "pinned": {
                                    "name": "python",
                                    "event": "execute",
                                    "bucket": "test",
                                    "carrier": {},
                                },
                            },
                        }
                    )
                },
                id="*",
                nomkstream=False,
            )

            response_message = self._client.xread(
                {inbox_id: "0-1"}, count=1, block=3000
            )
            # sample object:
            # [['INBOX.bb92283f-8b3d-45e3-8ece-ea18c4b4bac0', [('0-2',
            # {'data': '{"data":{"pinned":{"queueRequest":{"end":1695421568010787},
            # "kvStoreFetch":{"start":1695421568011785,"end":1695421568011806,"value":21},
            # "bindings":{"data":0},"pluginExecution":{"start":1695421568011879,"end":1695421568031331,
            # "value":19452},"kvStorePush":{"start":1695421568031377,"bytes":123,"end":1695421568032921,
            # "value":1544},"queueResponse":{"start":1695421568032989}},"data":{"err":null,
            # "key":"plugin-exec-js-e48a3378-36c8-416c-ad0f-1766b47d7301.context.output.Step1"}}}'})]]]

            parsed_response = ujson.loads(response_message[0][1][0][1]["data"])
            err = parsed_response["data"]["data"]["err"]
            response_key = parsed_response["data"]["data"]["key"]
            return ujson.loads(self._client.get(response_key)), err
        finally:
            self._client.xdel(self.STREAM_NAME, message_id)

    def write_key(self, key, value):
        self._client.setex(key, 5, ujson.dumps(value))

    def write_output(self, execution_id, step_name, output):
        self.write_key(f"{execution_id}.context.output.{step_name}", output)

    def write_global(self, execution_id, var_name, output):
        self.write_key(f"{execution_id}.context.global.{var_name}", output)
