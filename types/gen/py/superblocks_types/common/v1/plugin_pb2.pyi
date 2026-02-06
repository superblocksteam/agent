from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Property(_message.Message):
    __slots__ = ("key", "value", "editable", "internal", "description", "mandatory", "type", "defaultValue", "minRange", "maxRange", "valueOptions", "system", "file")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    EDITABLE_FIELD_NUMBER: _ClassVar[int]
    INTERNAL_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    MANDATORY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    DEFAULTVALUE_FIELD_NUMBER: _ClassVar[int]
    MINRANGE_FIELD_NUMBER: _ClassVar[int]
    MAXRANGE_FIELD_NUMBER: _ClassVar[int]
    VALUEOPTIONS_FIELD_NUMBER: _ClassVar[int]
    SYSTEM_FIELD_NUMBER: _ClassVar[int]
    FILE_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: str
    editable: bool
    internal: bool
    description: str
    mandatory: bool
    type: str
    defaultValue: str
    minRange: str
    maxRange: str
    valueOptions: _containers.RepeatedScalarFieldContainer[str]
    system: bool
    file: FileMetadata
    def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ..., editable: bool = ..., internal: bool = ..., description: _Optional[str] = ..., mandatory: bool = ..., type: _Optional[str] = ..., defaultValue: _Optional[str] = ..., minRange: _Optional[str] = ..., maxRange: _Optional[str] = ..., valueOptions: _Optional[_Iterable[str]] = ..., system: bool = ..., file: _Optional[_Union[FileMetadata, _Mapping]] = ...) -> None: ...

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class HttpParameters(_message.Message):
    __slots__ = ("query", "body")
    class QueryEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class BodyEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    QUERY_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    query: _containers.MessageMap[str, _struct_pb2.Value]
    body: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, query: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., body: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class FileMetadata(_message.Message):
    __slots__ = ("filename",)
    FILENAME_FIELD_NUMBER: _ClassVar[int]
    filename: str
    def __init__(self, filename: _Optional[str] = ...) -> None: ...
