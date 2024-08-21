# TODO: (joey) some of these imports are weird
from __future__ import annotations

from typing import Optional

from superblocks_agent_sdk._util.convert import from_protobuf_value
from superblocks_agent_sdk._util.doc import modify_pdoc
from superblocks_agent_sdk.types_.common import JsonValue
from superblocks_types.api.v1.event_pb2 import Event, Output
from superblocks_types.api.v1.service_pb2 import StreamResponse
from superblocks_types.common.v1.errors_pb2 import Error


# @dataclass(kw_only=True)
class Result:
    """
    The result of a Superblocks API execution.

    Attributes:
        events (list[Event]): All events from the execution. Defaults to `[]`.
        errors (list[Error]): All top-level errors from the execution. Defaults to `[]`.
        output (Optional[Output]): The API run output. Defaults to `None`.
    """

    __create_key = object()

    def __init__(
        self,
        create_key,
        *,
        events: list[Event] = None,
        errors: list[Error] = None,
        output: Optional[Output] = None,
    ):
        # we don't want a public constructor
        # pattern used is suggested here: https://stackoverflow.com/questions/8212053/private-constructor-in-python
        assert create_key == self.__create_key, "'Result' should not be instantiated"
        self.events = events or []
        self.errors = errors or []
        self.output = output

    def __eq__(self, other: Result) -> bool:
        # this is needed since the __create_key field causes inequality always
        eq = self.events == other.events
        eq = eq and self.errors == other.errors
        eq = eq and self.output == other.output
        return eq

    def get_result(self) -> JsonValue:
        # TODO: (joey) we should probably raise more specific errors for these cases
        """
        Get the native Python value for the result of the API.
        Returns:
            superblocks_agent.types.common.JsonValue: The result.

        Raises:
            Exception: Raised when there is no result and there are errors. Exception will contain the errors from execution.
            Exception: Raised when there is no result and there are no errors.
        """
        if self.output is not None:
            return from_protobuf_value(self.output.result)
        if len(self.errors) > 0:
            raise Exception(self.errors)
        raise Exception("no result found")

    def get_block_result(self, name: str) -> JsonValue:
        """
        Get the native Python value for the result of a block by name.
        Args:
            name (str): The name of the block to get the result of.

        Returns:
            superblocks_agent.types.common.JsonValue: The result.

        Raises:
            KeyError: Raised when a block result isn't found.
            Exception: Raised when a block has an error. Exception will contain that error.
        """
        for event in self.events:
            if event.HasField("end") and event.name == name:
                if event.end.HasField("error"):
                    raise Exception(event.end.error)
                return from_protobuf_value(event.end.output.result)
        raise KeyError(f"no block result found for '{name}'")

    @classmethod
    def _from_proto_stream_responses(
        cls, stream_responses: list[StreamResponse]
    ) -> Result:
        events = []
        errors = []
        output = None
        output_block_name = None

        block_name_to_output_map = {}

        for stream_response in stream_responses:
            events.append(stream_response.event)
            # check if this event holds the output
            if stream_response.event.HasField("response"):
                output_block_name = stream_response.event.response.last
                errors = stream_response.event.response.errors
            elif stream_response.event.HasField("end"):
                block_name_to_output_map[stream_response.event.name] = (
                    stream_response.event.end.output
                )

        # find "response" event by name
        output = block_name_to_output_map.get(output_block_name)
        if output_block_name is not None and output is None:
            raise Exception(f"no matching event found for block '{output_block_name}'")

        return Result(cls.__create_key, events=events, errors=errors, output=output)


__pdoc__ = modify_pdoc(
    exclude=[
        "StreamResponse",
        "Result.__init__",
        "Error.DESCRIPTOR",
        "Event.DESCRIPTOR",
        "Output.DESCRIPTOR",
    ]
)
