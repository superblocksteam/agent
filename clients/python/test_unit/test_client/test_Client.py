import asyncio
import unittest

from superblocks_agent_sdk.client import Client, Config
from superblocks_types.api.v1.service_pb2_grpc import ExecutorServiceStub


class TestClient(unittest.TestCase):
    def test_bad_connection_info(self):
        client = Client(config=Config(token=""))
        with self.assertRaises(Exception):
            asyncio.run(
                client._run(
                    with_stub=ExecutorServiceStub,
                    stub_func_name="TwoWayStream",
                    initial_request={},
                    response_handler=lambda _: True,
                )
            )

    def test_config_token_formatted(self):
        config = Config(token="foo")
        formatted_token = config.token_formatted
        self.assertEqual("Bearer foo", formatted_token)

    def test_config_token_safe_url_encoded_token(self):
        config = Config(token="Hello%20World%21")
        formatted_token = config.token_formatted
        self.assertEqual("Bearer Hello World!", formatted_token)
