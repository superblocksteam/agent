import unittest

from superblocks_agent_sdk._util.convert import Mock_, to_protobuf_value
from superblocks_agent_sdk._util.generate import get_unique_id_for_object
from superblocks_agent_sdk.testing.step import Mock, Params, on
from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock


class Test_Mock(unittest.TestCase):
    def test_return_(self):
        # overwrites existing return val
        api_mock = Mock().return_({"old": "value"})
        self.assertEqual({"old": "value"}, api_mock._get_return_value())
        api_mock = api_mock.return_({"new": "value"})
        self.assertEqual({"new": "value"}, api_mock._get_return_value())

    def test_return__invalid_type_given(self):
        with self.assertRaises(ValueError) as context:
            Mock().return_(Exception())
        self.assertEqual(
            "invalid type for return: '<class 'Exception'>'", str(context.exception)
        )

    def test_return__accepts_valid_types(self):
        # just don't want any validation errors raised
        Mock().return_("")
        Mock().return_(1)
        Mock().return_(1.1)
        Mock().return_(True)
        Mock().return_({})
        Mock().return_([])

    def test_on__no_params(self):
        api_mock = on()
        self.assertIsNone(api_mock._get_when_callable())
        self.assertIsNone(api_mock._get_return_value())

    def test_on__only_params_given(self):
        params = Params(
            integration_type="integration_type",
            step_name="step_name",
            configuration={"foo": "bar"},
        )
        api_mock = on(params=params)
        self.assertIsNone(api_mock._get_when_callable())
        self.assertIsNone(api_mock._get_return_value())

    def test_on__only_when_given(self):
        func = lambda _: True
        api_mock = on(when=func)
        self.assertEqual(func, api_mock._get_when_callable())
        self.assertIsNone(api_mock._get_return_value())

    def test_on__params_and_when_given(self):
        func = lambda _: True
        params = Params(
            integration_type="integration_type",
            step_name="step_name",
            configuration={"foo": "bar"},
        )
        api_mock = on(when=func, params=params)
        self.assertEqual(func, api_mock._get_when_callable())
        self.assertIsNone(api_mock._get_return_value())

    def test_to_proto_on(self):
        self.assertIsNone(Mock()._to_proto_on())

        func = lambda _: True
        api_mock = Mock(
            params=Params(
                integration_type="integration_type",
                step_name="step_name",
                configuration={"foo": "bar"},
            ),
            when=func,
        )
        self.assertEqual(
            ProtoMock.On(
                static=ProtoMock.Params(
                    integration_type="integration_type",
                    step_name="step_name",
                    inputs=to_protobuf_value({"foo": "bar"}),
                ),
                dynamic=get_unique_id_for_object(func),
            ),
            api_mock._to_proto_on(),
        )

    def test_to_proto_return(self):
        # None
        self.assertIsNone(Mock()._to_proto_return())

        # static
        api_mock = Mock().return_({"foo": "bar"})
        self.assertEqual(
            ProtoMock.Return(static=to_protobuf_value({"foo": "bar"})),
            api_mock._to_proto_return(),
        )

        # dynamic
        func = lambda _: True
        api_mock = Mock().return_(func)
        self.assertEqual(
            ProtoMock.Return(dynamic=get_unique_id_for_object(func)),
            api_mock._to_proto_return(),
        )

    def test_to_proto_mock(self):
        when_func = lambda _: True
        return_func = lambda _: True
        api_mock = Mock(
            params=Params(
                integration_type="integration_type",
                step_name="step_name",
                configuration={"foo": "bar"},
            ),
            when=when_func,
        ).return_(return_func)

        self.assertEqual(
            Mock_(
                on=ProtoMock.On(
                    static=ProtoMock.Params(
                        integration_type="integration_type",
                        step_name="step_name",
                        inputs=to_protobuf_value({"foo": "bar"}),
                    ),
                    dynamic=get_unique_id_for_object(when_func),
                ),
                return_=ProtoMock.Return(dynamic=get_unique_id_for_object(return_func)),
            ),
            api_mock._to_proto_mock(),
        )
