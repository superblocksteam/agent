from buf.validate import validate_pb2 as _validate_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Variables(_message.Message):
    __slots__ = ("items",)
    class Type(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        TYPE_UNSPECIFIED: _ClassVar[Variables.Type]
        TYPE_SIMPLE: _ClassVar[Variables.Type]
        TYPE_ADVANCED: _ClassVar[Variables.Type]
        TYPE_NATIVE: _ClassVar[Variables.Type]
        TYPE_FILEPICKER: _ClassVar[Variables.Type]
    TYPE_UNSPECIFIED: Variables.Type
    TYPE_SIMPLE: Variables.Type
    TYPE_ADVANCED: Variables.Type
    TYPE_NATIVE: Variables.Type
    TYPE_FILEPICKER: Variables.Type
    class Mode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        MODE_UNSPECIFIED: _ClassVar[Variables.Mode]
        MODE_READ: _ClassVar[Variables.Mode]
        MODE_READWRITE: _ClassVar[Variables.Mode]
    MODE_UNSPECIFIED: Variables.Mode
    MODE_READ: Variables.Mode
    MODE_READWRITE: Variables.Mode
    class Config(_message.Message):
        __slots__ = ("value", "type", "mode", "key")
        VALUE_FIELD_NUMBER: _ClassVar[int]
        TYPE_FIELD_NUMBER: _ClassVar[int]
        MODE_FIELD_NUMBER: _ClassVar[int]
        KEY_FIELD_NUMBER: _ClassVar[int]
        value: str
        type: Variables.Type
        mode: Variables.Mode
        key: str
        def __init__(self, value: _Optional[str] = ..., type: _Optional[_Union[Variables.Type, str]] = ..., mode: _Optional[_Union[Variables.Mode, str]] = ..., key: _Optional[str] = ...) -> None: ...
    ITEMS_FIELD_NUMBER: _ClassVar[int]
    items: _containers.RepeatedCompositeFieldContainer[Variables.Config]
    def __init__(self, items: _Optional[_Iterable[_Union[Variables.Config, _Mapping]]] = ...) -> None: ...
