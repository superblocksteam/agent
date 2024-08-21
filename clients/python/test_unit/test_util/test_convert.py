import unittest
from copy import deepcopy
from unittest.mock import patch

from google.protobuf.struct_pb2 import ListValue, Struct, Value

from superblocks_agent_sdk._util.convert import (
    Mock_,
    from_protobuf_value,
    to_protobuf_value,
)
from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock


class TestConvert(unittest.TestCase):
    def test_to_protobuf_value__none(self):
        self.assertEqual(Value(null_value=0), to_protobuf_value(None))

    def test_to_protobuf_value__bool(self):
        self.assertEqual(Value(bool_value=True), to_protobuf_value(True))
        self.assertEqual(Value(bool_value=False), to_protobuf_value(False))

    def test_to_protobuf_value__number(self):
        self.assertEqual(Value(number_value=1), to_protobuf_value(1))
        self.assertEqual(Value(number_value=1.1), to_protobuf_value(1.1))

    def test_to_protobuf_value__string(self):
        self.assertEqual(Value(string_value="foo"), to_protobuf_value("foo"))

    def test_to_protobuf_value__dict(self):
        self.assertEqual(
            Value(struct_value=Struct(fields={"foo": Value(string_value="bar")})),
            to_protobuf_value({"foo": "bar"}),
        )

    def test_to_protobuf_value__list(self):
        self.assertEqual(
            Value(
                list_value=ListValue(
                    values=[Value(string_value="foo"), Value(string_value="bar")]
                )
            ),
            to_protobuf_value(["foo", "bar"]),
        )

    def test_to_protobuf_value__unsupported_type(self):
        with self.assertRaises(TypeError) as context:
            to_protobuf_value(lambda x: x)
        self.assertEqual(
            "Object of type function is not JSON serializable", str(context.exception)
        )

    def test_from_protobuf_value__none(self):
        self.assertIsNone(from_protobuf_value(Value(null_value=0)))

    def test_from_protobuf_value__number(self):
        self.assertEqual(1, from_protobuf_value(Value(number_value=1)))
        self.assertEqual(1.1, from_protobuf_value(Value(number_value=1.1)))

    def test_from_protobuf_value__string(self):
        self.assertEqual("foo", from_protobuf_value(Value(string_value="foo")))

    def test_from_protobuf_value__bool(self):
        self.assertTrue(from_protobuf_value(Value(bool_value=True)))
        self.assertFalse(from_protobuf_value(Value(bool_value=False)))

    def test_from_protobuf_value__dict(self):
        self.assertEqual(
            {"foo": "bar"},
            from_protobuf_value(
                Value(struct_value=Struct(fields={"foo": Value(string_value="bar")}))
            ),
        )

    def test_from_protobuf_value__list(self):
        self.assertEqual(
            ["foo", "bar"],
            from_protobuf_value(
                Value(
                    list_value=ListValue(
                        values=[Value(string_value="foo"), Value(string_value="bar")]
                    )
                )
            ),
        )

    @patch.object(Value, "WhichOneof", return_value="unknown_kind")
    def test_from_protobuf_value__unknown_type(self, _):
        with self.assertRaises(AttributeError) as context:
            value = Value()
            from_protobuf_value(value)
        self.assertEqual("unknown_kind", str(context.exception))

    def test_mock_(self):
        self.assertEqual(ProtoMock(), Mock_())

        kwargs = {
            "on": ProtoMock.On(
                static=ProtoMock.Params(
                    integration_type="integration_type",
                    step_name="step_name",
                    inputs=to_protobuf_value({"foo": "bar"}),
                ),
                dynamic="dynamic",
            ),
            "return": ProtoMock.Return(dynamic="dynamic"),
        }

        # Mock_ takes slightly different kwargs
        mock__kwargs = deepcopy(kwargs)
        mock__kwargs["return_"] = kwargs["return"]
        del mock__kwargs["return"]

        self.assertEqual(ProtoMock(**kwargs), Mock_(**mock__kwargs))
