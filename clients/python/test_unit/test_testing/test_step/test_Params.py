import unittest

from superblocks_agent_sdk._util.convert import to_protobuf_value
from superblocks_agent_sdk.testing.step import Params
from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock


class TestParams(unittest.TestCase):
    def test_to_proto_params(self):
        self.assertEqual(ProtoMock.Params(), Params()._to_proto_params())
        self.assertEqual(
            ProtoMock.Params(
                integration_type="integration_type",
                step_name="step_name",
                inputs=to_protobuf_value({"foo": "bar"}),
            ),
            Params(
                integration_type="integration_type",
                step_name="step_name",
                configuration={"foo": "bar"},
            )._to_proto_params(),
        )
