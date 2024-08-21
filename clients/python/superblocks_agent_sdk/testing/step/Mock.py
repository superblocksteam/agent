from __future__ import annotations

from typing import Callable, Optional

from superblocks_agent_sdk._util.convert import Mock_, to_protobuf_value
from superblocks_agent_sdk._util.generate import get_unique_id_for_object
from superblocks_agent_sdk.testing.step import Params
from superblocks_agent_sdk.types_.common import JsonValue, is_json_value
from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock

# NOTE: (joey) not sure where these should live. i think this is fine for now
WhenCallable = Callable[[Params], bool]
"""
A callable used to determine if a mock should be used.
Args:
    params (superblocks_agent.testing.step.Params): The callable input.

Returns:
    bool: Whether the mock should be used or not.
"""

MockCallable = Callable[[Params], JsonValue]
"""
A callable used to determine the output of a mock.
Args:
    params (superblocks_agent.testing.step.Params): The callable input.

Returns:
    superblocks_agent.types.common.JsonValue: The value the mock should return.
"""


class Mock:
    """
    A Superblocks Step Mock.
    """

    def __init__(
        self, *, params: Optional[Params] = None, when: Optional[WhenCallable] = None
    ):
        """
        Args:
            params (Optional[superblocks_agent.testing.step.Params]): On these parameters, use this mock. Defaults to `None`.
            when (Optional[WhenCallable]): When this callable returns `True`, use this mock. Defaults to `None`.
        """
        self.__on_params = params
        self.__when_callable = when
        self.__return_value = None
        self.__return_callable = None

    def _get_return_value(self) -> Optional[dict]:
        return self.__return_value

    def _get_return_callable(self) -> Optional[MockCallable]:
        return self.__return_callable

    def _get_when_callable(self) -> Optional[WhenCallable]:
        return self.__when_callable

    # we use "return_" as is recommended by PEP 8: https://peps.python.org/pep-0008/#descriptive-naming-styles
    def return_(self, value: JsonValue | MockCallable) -> Mock:
        """
        Return the given value or the result of the given callable when this mock is chosen.

        Args:
            value (typing.Union[superblocks_agent.types.common.JsonValue, MockCallable]): If given value is a `superblocks_agent.types.common.JsonValue`, the mock will return this value. If given value is a `MockCallable`, it will be called with `superblocks_agent.testing.step.Params` and return a `superblocks_agent.types.common.JsonValue`.

        Returns:
            superblocks_agent.testing.step.Mock: A copy of *this* mock with the return value updated.
        """
        # NOTE: (joey) i don't know if there's an easy way to validate the function signature
        if callable(value):
            self.__return_callable = value
        elif is_json_value(value):
            self.__return_value = value
        else:
            raise ValueError(f"invalid type for return: '{type(value)}'")
        return self

    def _to_proto_on(self) -> Optional[ProtoMock.On]:
        mock_on = None
        if self.__on_params is not None:
            mock_on = ProtoMock.On()
            mock_on.static.CopyFrom(self.__on_params._to_proto_params())
        if self.__when_callable is not None:
            mock_on = ProtoMock.On() if mock_on is None else mock_on
            mock_on.dynamic = get_unique_id_for_object(self.__when_callable)
        return mock_on

    def _to_proto_return(self) -> Optional[Mock.Return]:
        mock_return = None
        if self.__return_value is not None or self.__return_callable is not None:
            mock_return = ProtoMock.Return()
            if self.__return_value is not None:
                mock_return.static.CopyFrom(to_protobuf_value(self.__return_value))
            elif self.__return_callable is not None:
                # should be type type_.mock.WhenCallable
                mock_return.dynamic = get_unique_id_for_object(self.__return_callable)
        return mock_return

    def _to_proto_mock(self) -> Mock:
        return Mock_(on=self._to_proto_on(), return_=self._to_proto_return())


def on(params: Optional[Params] = None, *, when: Optional[WhenCallable] = None) -> Mock:
    """
    Generates a new mock.

    Args:
        params (Optional[superblocks_agent.testing.step.Params]): On these parameters, use this mock. Defaults to `None`.
        when (Optional[WhenCallable]): When this callable returns `True`, use this mock. Defaults to `None`.

    Returns:
        superblocks_agent.testing.step.Mock: A new mock.
    """
    return Mock(params=params, when=when)


__pdoc__ = {"ProtoMock": False}
