import unittest

from superblocks_agent_sdk._util.convert import to_protobuf_value
from superblocks_agent_sdk.api import Result
from superblocks_types.api.v1.event_pb2 import Event, Output
from superblocks_types.api.v1.service_pb2 import StreamResponse
from superblocks_types.common.v1.errors_pb2 import Error


class TestResult(unittest.TestCase):
    def test_cannot_instantiate(self):
        with self.assertRaises(TypeError):
            Result()
        with self.assertRaises(AssertionError) as context:
            Result(1)
        self.assertEqual("'Result' should not be instantiated", str(context.exception))

    def test_from_proto_stream_responses__empty_list(self):
        actual = Result._from_proto_stream_responses([])
        self.assertEqual(
            Result(Result._Result__create_key, events=[], output=None), actual
        )

    def test_from_proto_stream_responses__with_errors(self):
        output = Output(result=to_protobuf_value({"foo": "bar"}))
        end_event = Event(name="end_event", end=Event.End(output=output))
        errors = [Error(message="some error")]
        response_event = Event(
            name="response_event",
            response=Event.Response(last="end_event", errors=errors),
        )
        actual = Result._from_proto_stream_responses(
            [StreamResponse(event=end_event), StreamResponse(event=response_event)]
        )
        expected = Result(
            Result._Result__create_key,
            events=[end_event, response_event],
            errors=errors,
            output=output,
        )
        self.assertEqual(expected, actual)

    def test_from_proto_stream_responses__without_error(self):
        output = Output(result=to_protobuf_value({"foo": "bar"}))
        end_event = Event(name="end_event", end=Event.End(output=output))
        response_event = Event(
            name="response_event", response=Event.Response(last="end_event", errors=[])
        )
        actual = Result._from_proto_stream_responses(
            [StreamResponse(event=end_event), StreamResponse(event=response_event)]
        )
        expected = Result(
            Result._Result__create_key,
            events=[end_event, response_event],
            errors=[],
            output=output,
        )
        self.assertEqual(expected, actual)

    def test_from_proto_stream_responses__no_matching_response_event_found(self):
        output = Output(result=to_protobuf_value({"foo": "bar"}))
        end_event = Event(name="end_event", end=Event.End(output=output))
        response_event = Event(
            name="response_event",
            response=Event.Response(last="i dont match anything", errors=[]),
        )

        with self.assertRaises(Exception) as context:
            Result._from_proto_stream_responses(
                [StreamResponse(event=end_event), StreamResponse(event=response_event)]
            )
        self.assertEqual(
            "no matching event found for block 'i dont match anything'",
            str(context.exception),
        )

    def test_get_result__happy_path(self):
        result = Result(
            Result._Result__create_key, output=Output(result=to_protobuf_value("foo"))
        )
        self.assertEqual("foo", result.get_result())

    def test_get_result__no_result(self):
        result = Result(Result._Result__create_key)
        with self.assertRaises(Exception) as context:
            result.get_result()
        self.assertEqual("no result found", str(context.exception))

    def test_get_result__no_result__has_errors(self):
        errors = [Error(name="some err")]
        result = Result(Result._Result__create_key, errors=errors)
        with self.assertRaises(Exception) as context:
            result.get_result()
        self.assertEqual(errors, context.exception.args[0])

    def test_get_block_result__has_result_and_no_error(self):
        event = Event(
            name="e1", end=Event.End(output=Output(result=to_protobuf_value("foo")))
        )
        result = Result(Result._Result__create_key, events=[event])
        self.assertEqual("foo", result.get_block_result("e1"))

    def test_get_block_result__has_error(self):
        error = Error(name="some error")
        event = Event(
            name="e1",
            end=Event.End(output=Output(result=to_protobuf_value("foo")), error=error),
        )
        result = Result(Result._Result__create_key, events=[event])
        with self.assertRaises(Exception) as context:
            result.get_block_result("e1")
        self.assertEqual(error, context.exception.args[0])

    def test_get_block_result__no_block_with_matching_name(self):
        result = Result(Result._Result__create_key, events=[])
        with self.assertRaises(KeyError) as context:
            result.get_block_result("e1")
        self.assertEqual("\"no block result found for 'e1'\"", str(context.exception))
