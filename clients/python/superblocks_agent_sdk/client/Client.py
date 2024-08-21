from __future__ import annotations

import json
import queue
from functools import partial
from platform import machine, release, system
from typing import Callable, Optional

import grpc
from grpc import ChannelConnectivity

from superblocks_agent_sdk._util.doc import modify_pdoc
from superblocks_agent_sdk._version import __version__
from superblocks_agent_sdk.api.Config import Config as ApiConfig
from superblocks_agent_sdk.client.Config import Config as ClientConfig
from superblocks_agent_sdk.types_._client import TwoWayStreamResponseHandler
from superblocks_types.api.v1.service_pb2 import StreamResponse


def _get_connection_monitor(
    client: Client,
) -> Callable[[grpc.ChannelConnectivity], None]:
    def connection_monitor(channel_connectivity: ChannelConnectivity):
        """
        Monitors the GRPC connection and reconnects when it shuts down.
        """
        match channel_connectivity:
            case ChannelConnectivity.SHUTDOWN:
                if client._expect_alive:
                    # the connection was shut down and we expect to be connected, attempt to reconnect
                    client.close()
                    client._get_connection()

    return connection_monitor


class Client:
    """
    Used for connecting to the Superblocks Agent.
    """

    def __init__(self, *, config: ClientConfig, defaults: Optional[ApiConfig] = None):
        """
        Args:
            config (superblocks_agent.client.Config): The Client configuration.
            defaults (Optional[superblocks_agent.api.Config]): The default API configuration. Defaults to `Config()`.
        """
        self.config = config
        self.defaults = defaults or ApiConfig()
        self._channel = None
        self._connection_monitor_callable = _get_connection_monitor(self)
        # expect_alive is used to monitor whether this client is expected to be connected or not
        # this is important to know whether we should try to reconnect or not
        self._expect_alive = False

    def close(self) -> None:
        """
        Closes the client.
        """
        self._expect_alive = False
        if self._channel is not None:
            self._channel.unsubscribe(self._connection_monitor_callable)
            self._channel.close()
            # set to None so next time this client is used, it is reset
            self._channel = None

    def __enter__(self):
        self._get_connection()
        return self

    def __exit__(self, exception_type, exception_value, exception_traceback):
        self.close()
        # this check is needed in order to propagate errors
        return exception_type is None

    def _get_options(self) -> list[tuple]:
        options = []
        # SOURCE: https://github.com/grpc/grpc/blob/master/examples/python/retry/retry_client.py
        service_config_json = json.dumps(
            {
                "methodConfig": [
                    {
                        "name": [{}],  # match all services
                        "retryPolicy": {
                            "maxAttempts": 5,
                            "initialBackoff": "0.1s",
                            "maxBackoff": "1s",
                            "backoffMultiplier": 2,
                            "retryableStatusCodes": ["UNAVAILABLE"],
                        },
                    }
                ]
            }
        )
        options.append(("grpc.enable_retries", 1))
        options.append(("grpc.service_config", service_config_json))
        options.append(
            (
                "grpc.primary_user_agent",
                f"Superblocks-Python/{__version__} ({system()} {release()}; {machine()})",
            )
        )
        if self.config.authority is not None:
            options.append(("grpc.default_authority", self.authority))
        return options

    def _get_connection(self) -> grpc.Channel:
        """
        If a channel already exists, returns it.
        If a channel does not already exist, instanciates and returns the new channel.
        """
        self._expect_alive = True
        if self._channel is None:
            channel_func = (
                grpc.insecure_channel
                if self.config.insecure
                else partial(
                    grpc.secure_channel, credentials=grpc.ssl_channel_credentials()
                )
            )
            self._channel = channel_func(
                target=self.config.endpoint, options=self._get_options()
            )
            self._channel.subscribe(
                self._connection_monitor_callable, try_to_connect=True
            )
        return self._channel

    async def _run(
        self,
        *,
        with_stub: object,
        stub_func_name: str,
        initial_request: object,
        response_handler: TwoWayStreamResponseHandler,
    ) -> list[StreamResponse]:
        # TODO: (joey) throw clear errors here for auth/connection issues
        stub = with_stub(channel=self._get_connection())
        stub_function = getattr(stub, stub_func_name)

        stream_responses = []
        q = queue.Queue()

        q.put(initial_request)

        def get_requests():
            while True:
                yield q.get()

        try:
            responses = stub_function(get_requests())

            for response in responses:
                next_request, two_way_response = response_handler(response)
                if two_way_response is not None:
                    stream_responses.append(two_way_response.stream)
                if next_request is not None:
                    q.put(next_request)
        except Exception as e:
            print("ERROR WHILE GETTING RESPONSES", e)
            raise e

        return stream_responses


__pdoc__ = modify_pdoc(exclude=["StreamResponse"])
