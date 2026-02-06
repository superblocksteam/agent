from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Logs(_message.Message):
    __slots__ = ("logs",)
    LOGS_FIELD_NUMBER: _ClassVar[int]
    logs: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Struct]
    def __init__(self, logs: _Optional[_Iterable[_Union[_struct_pb2.Struct, _Mapping]]] = ...) -> None: ...
