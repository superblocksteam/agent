from google.protobuf import any_pb2 as _any_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CloudEvent(_message.Message):
    __slots__ = ("id", "source", "spec_version", "type", "attributes", "binary_data", "text_data", "proto_data")
    class AttributesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: CloudEventAttributeValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[CloudEventAttributeValue, _Mapping]] = ...) -> None: ...
    ID_FIELD_NUMBER: _ClassVar[int]
    SOURCE_FIELD_NUMBER: _ClassVar[int]
    SPEC_VERSION_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    ATTRIBUTES_FIELD_NUMBER: _ClassVar[int]
    BINARY_DATA_FIELD_NUMBER: _ClassVar[int]
    TEXT_DATA_FIELD_NUMBER: _ClassVar[int]
    PROTO_DATA_FIELD_NUMBER: _ClassVar[int]
    id: str
    source: str
    spec_version: str
    type: str
    attributes: _containers.MessageMap[str, CloudEventAttributeValue]
    binary_data: bytes
    text_data: str
    proto_data: _any_pb2.Any
    def __init__(self, id: _Optional[str] = ..., source: _Optional[str] = ..., spec_version: _Optional[str] = ..., type: _Optional[str] = ..., attributes: _Optional[_Mapping[str, CloudEventAttributeValue]] = ..., binary_data: _Optional[bytes] = ..., text_data: _Optional[str] = ..., proto_data: _Optional[_Union[_any_pb2.Any, _Mapping]] = ...) -> None: ...

class CloudEventAttributeValue(_message.Message):
    __slots__ = ("ce_boolean", "ce_integer", "ce_string", "ce_bytes", "ce_uri", "ce_uri_ref", "ce_timestamp")
    CE_BOOLEAN_FIELD_NUMBER: _ClassVar[int]
    CE_INTEGER_FIELD_NUMBER: _ClassVar[int]
    CE_STRING_FIELD_NUMBER: _ClassVar[int]
    CE_BYTES_FIELD_NUMBER: _ClassVar[int]
    CE_URI_FIELD_NUMBER: _ClassVar[int]
    CE_URI_REF_FIELD_NUMBER: _ClassVar[int]
    CE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    ce_boolean: bool
    ce_integer: int
    ce_string: str
    ce_bytes: bytes
    ce_uri: str
    ce_uri_ref: str
    ce_timestamp: _timestamp_pb2.Timestamp
    def __init__(self, ce_boolean: bool = ..., ce_integer: _Optional[int] = ..., ce_string: _Optional[str] = ..., ce_bytes: _Optional[bytes] = ..., ce_uri: _Optional[str] = ..., ce_uri_ref: _Optional[str] = ..., ce_timestamp: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...
