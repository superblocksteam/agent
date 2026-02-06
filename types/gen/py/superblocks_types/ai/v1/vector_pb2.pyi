from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Vector(_message.Message):
    __slots__ = ("id", "values", "metadata", "score")
    ID_FIELD_NUMBER: _ClassVar[int]
    VALUES_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    SCORE_FIELD_NUMBER: _ClassVar[int]
    id: str
    values: _containers.RepeatedScalarFieldContainer[float]
    metadata: _struct_pb2.Struct
    score: float
    def __init__(self, id: _Optional[str] = ..., values: _Optional[_Iterable[float]] = ..., metadata: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., score: _Optional[float] = ...) -> None: ...
