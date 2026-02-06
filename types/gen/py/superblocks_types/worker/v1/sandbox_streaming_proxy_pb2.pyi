from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SendRequest(_message.Message):
    __slots__ = ("topic", "data")
    TOPIC_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    topic: str
    data: _struct_pb2.Value
    def __init__(self, topic: _Optional[str] = ..., data: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...

class UntilRequest(_message.Message):
    __slots__ = ("topic",)
    TOPIC_FIELD_NUMBER: _ClassVar[int]
    topic: str
    def __init__(self, topic: _Optional[str] = ...) -> None: ...
