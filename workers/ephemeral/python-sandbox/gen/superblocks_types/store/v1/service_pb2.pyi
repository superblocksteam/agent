from common.v1 import errors_pb2 as _errors_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from store.v1 import store_pb2 as _store_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ReadRequest(_message.Message):
    __slots__ = ("keys",)
    KEYS_FIELD_NUMBER: _ClassVar[int]
    keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, keys: _Optional[_Iterable[str]] = ...) -> None: ...

class ReadResponse(_message.Message):
    __slots__ = ("results", "error")
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    results: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Value]
    error: _errors_pb2.Error
    def __init__(self, results: _Optional[_Iterable[_Union[_struct_pb2.Value, _Mapping]]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...

class WriteRequest(_message.Message):
    __slots__ = ("pairs",)
    PAIRS_FIELD_NUMBER: _ClassVar[int]
    pairs: _containers.RepeatedCompositeFieldContainer[_store_pb2.Pair]
    def __init__(self, pairs: _Optional[_Iterable[_Union[_store_pb2.Pair, _Mapping]]] = ...) -> None: ...

class WriteResponse(_message.Message):
    __slots__ = ("pairs", "error")
    PAIRS_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    pairs: _containers.RepeatedCompositeFieldContainer[_store_pb2.Pair]
    error: _errors_pb2.Error
    def __init__(self, pairs: _Optional[_Iterable[_Union[_store_pb2.Pair, _Mapping]]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...
