"""Tests for the superblocks module."""

import json

import pytest

from src.superblocks import (
    List,
    Object,
    Reader,
    decode_object,
    encode_bytestring_as_json,
    loads,
)


class TestObject:
    def test_dot_notation_access(self):
        obj = Object({"foo": "bar", "nested": {"baz": "qux"}})
        assert obj.foo == "bar"
        assert obj.nested.baz == "qux"

    def test_bracket_notation_access(self):
        obj = Object({"foo": "bar", "nested": {"baz": "qux"}})
        assert obj["foo"] == "bar"
        assert obj["nested"]["baz"] == "qux"

    def test_nested_dict_returns_object(self):
        obj = Object({"nested": {"key": "value"}})
        assert type(obj.nested) is Object
        assert type(obj["nested"]) is Object

    def test_nested_list_returns_list(self):
        obj = Object({"data": [1, 2, 3]})
        assert type(obj.data) is List
        assert type(obj["data"]) is List

    def test_attribute_error_for_missing_key(self):
        obj = Object({"foo": "bar"})
        with pytest.raises(AttributeError):
            _ = obj.missing

    def test_set_attribute(self):
        obj = Object({})
        obj.foo = "bar"
        assert obj["foo"] == "bar"
        assert obj.foo == "bar"

    def test_del_attribute(self):
        obj = Object({"foo": "bar"})
        del obj.foo
        assert "foo" not in obj

    def test_dict_property(self):
        obj = Object({"foo": "bar"})
        assert obj.__dict__ is obj

    def test_deeply_nested_object(self):
        obj = Object({
            "this": {
                "be": {
                    "a": {"very": {"nested": {"object": [{"my": {"value": "bar"}}]}}}
                }
            }
        })
        assert obj.this.be.a.very.nested.object[0].my.value == "bar"

    def test_iteration_over_items(self):
        obj = Object({"foo": {"test": "test1"}, "bar": {"test": "test2"}})
        for key in obj:
            assert obj[key].test == obj[key]["test"]


class TestList:
    def test_bracket_access(self):
        lst = List([1, 2, 3])
        assert lst[0] == 1
        assert lst[1] == 2
        assert lst[2] == 3

    def test_nested_dict_returns_object(self):
        lst = List([{"foo": "bar"}])
        assert type(lst[0]) is Object
        assert lst[0].foo == "bar"

    def test_nested_list_returns_list(self):
        lst = List([[1, 2], [3, 4]])
        assert type(lst[0]) is List
        assert lst[0][0] == 1

    def test_iteration(self):
        """Test that bracket access works during iteration via indices."""
        lst = List([{"test": "0"}, {"test": "1"}, {"test": "2"}])
        for idx in range(len(lst)):
            item = lst[idx]
            assert type(item) is Object
            assert item.test == str(idx)

    def test_mixed_types(self):
        lst = List([1, "string", {"key": "value"}, [1, 2]])
        assert lst[0] == 1
        assert lst[1] == "string"
        assert type(lst[2]) is Object
        assert type(lst[3]) is List


class TestReader:
    def test_sanitize_agent_key_forward_slash(self):
        reader = Reader({})
        assert reader._sanitize_agent_key("are/you/serious") == "are__you__serious"
        assert reader._sanitize_agent_key("/are/you/serious") == "__are__you__serious"
        assert reader._sanitize_agent_key("are/you/serious/") == "are__you__serious__"

    def test_sanitize_agent_key_plus_sign(self):
        reader = Reader({})
        assert reader._sanitize_agent_key("are+you+serious") == "are--you--serious"
        assert reader._sanitize_agent_key("+are+you+serious") == "--are--you--serious"
        assert reader._sanitize_agent_key("are+you+serious+") == "are--you--serious--"

    def test_sanitize_agent_key_mixed(self):
        reader = Reader({})
        assert reader._sanitize_agent_key("/are+you/serious+") == "__are--you__serious--"


class TestDecodeObject:
    def test_decode_buffer(self):
        value = {"type": "Buffer", "data": [72, 101, 108, 108, 111]}
        result = decode_object(value)
        assert result == b"Hello"

    def test_decode_regular_dict(self):
        value = {"foo": "bar"}
        result = decode_object(value)
        assert type(result) is Object
        assert result.foo == "bar"

    def test_decode_dict_with_type_but_not_buffer(self):
        value = {"type": "NotBuffer", "data": [1, 2, 3]}
        result = decode_object(value)
        assert type(result) is Object

    def test_decode_buffer_with_invalid_data(self):
        value = {"type": "Buffer", "data": "not a list"}
        result = decode_object(value)
        assert type(result) is Object


class TestLoads:
    def test_loads_simple_object(self):
        data = '{"foo": "bar"}'
        result = loads(data)
        assert type(result) is Object
        assert result.foo == "bar"

    def test_loads_nested_object(self):
        data = '{"nested": {"key": "value"}}'
        result = loads(data)
        assert type(result) is Object
        assert type(result.nested) is Object
        assert result.nested.key == "value"

    def test_loads_with_buffer(self):
        data = '{"buffer": {"type": "Buffer", "data": [72, 101, 108, 108, 111]}}'
        result = loads(data)
        assert result.buffer == b"Hello"

    def test_loads_array(self):
        data = '[{"foo": "bar"}, {"baz": "qux"}]'
        result = loads(data)
        assert type(result) is list
        assert type(result[0]) is Object


class TestEncodeByteStringAsJson:
    def test_encode_bytes(self):
        result = encode_bytestring_as_json(b"Hello")
        assert result == {"type": "Buffer", "data": [72, 101, 108, 108, 111]}

    def test_encode_bytearray(self):
        result = encode_bytestring_as_json(bytearray(b"Hi"))
        assert result == {"type": "Buffer", "data": [72, 105]}

    def test_encode_non_bytes_raises(self):
        with pytest.raises(TypeError):
            encode_bytestring_as_json("not bytes")

        with pytest.raises(TypeError):
            encode_bytestring_as_json(123)


class TestJsonRoundTrip:
    def test_object_json_serialization(self):
        """Test that Object can be serialized back to JSON."""
        original = {"foo": "bar", "nested": {"key": "value"}}
        obj = Object(original)
        serialized = json.dumps(obj)
        assert json.loads(serialized) == original

    def test_bytes_round_trip(self):
        """Test encoding bytes and decoding back."""
        original_bytes = b"Hello World"
        encoded = encode_bytestring_as_json(original_bytes)
        json_str = json.dumps({"data": encoded})
        decoded = loads(json_str)
        assert decoded.data == original_bytes
