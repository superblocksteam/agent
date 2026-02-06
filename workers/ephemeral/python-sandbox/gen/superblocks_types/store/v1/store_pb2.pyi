from google.protobuf import struct_pb2 as _struct_pb2
from secrets.v1 import secrets_pb2 as _secrets_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Pair(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: _struct_pb2.Value
    def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...

class Stores(_message.Message):
    __slots__ = ("secrets",)
    SECRETS_FIELD_NUMBER: _ClassVar[int]
    secrets: _containers.RepeatedCompositeFieldContainer[_secrets_pb2.Store]
    def __init__(self, secrets: _Optional[_Iterable[_Union[_secrets_pb2.Store, _Mapping]]] = ...) -> None: ...
