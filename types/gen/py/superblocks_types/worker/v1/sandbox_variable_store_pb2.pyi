from google.api import annotations_pb2 as _annotations_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetVariableRequest(_message.Message):
    __slots__ = ("execution_id", "key")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    KEY_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    key: str
    def __init__(self, execution_id: _Optional[str] = ..., key: _Optional[str] = ...) -> None: ...

class GetVariableResponse(_message.Message):
    __slots__ = ("value", "found")
    VALUE_FIELD_NUMBER: _ClassVar[int]
    FOUND_FIELD_NUMBER: _ClassVar[int]
    value: str
    found: bool
    def __init__(self, value: _Optional[str] = ..., found: bool = ...) -> None: ...

class SetVariableRequest(_message.Message):
    __slots__ = ("execution_id", "key", "value")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    key: str
    value: str
    def __init__(self, execution_id: _Optional[str] = ..., key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...

class SetVariableResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class GetVariablesRequest(_message.Message):
    __slots__ = ("execution_id", "keys")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    KEYS_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, execution_id: _Optional[str] = ..., keys: _Optional[_Iterable[str]] = ...) -> None: ...

class GetVariablesResponse(_message.Message):
    __slots__ = ("values",)
    VALUES_FIELD_NUMBER: _ClassVar[int]
    values: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, values: _Optional[_Iterable[str]] = ...) -> None: ...

class SetVariablesRequest(_message.Message):
    __slots__ = ("execution_id", "kvs")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    KVS_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    kvs: _containers.RepeatedCompositeFieldContainer[KeyValue]
    def __init__(self, execution_id: _Optional[str] = ..., kvs: _Optional[_Iterable[_Union[KeyValue, _Mapping]]] = ...) -> None: ...

class KeyValue(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: str
    def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...

class SetVariablesResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class FetchFileRequest(_message.Message):
    __slots__ = ("execution_id", "path")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    path: str
    def __init__(self, execution_id: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...

class FetchFileResponse(_message.Message):
    __slots__ = ("contents", "error")
    CONTENTS_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    contents: bytes
    error: str
    def __init__(self, contents: _Optional[bytes] = ..., error: _Optional[str] = ...) -> None: ...
