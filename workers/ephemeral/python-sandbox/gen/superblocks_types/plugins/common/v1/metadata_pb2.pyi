from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SQLMetadata(_message.Message):
    __slots__ = ()
    class Minified(_message.Message):
        __slots__ = ("tables",)
        class Table(_message.Message):
            __slots__ = ("columns",)
            class ColumnsEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: str
                def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
            COLUMNS_FIELD_NUMBER: _ClassVar[int]
            columns: _containers.ScalarMap[str, str]
            def __init__(self, columns: _Optional[_Mapping[str, str]] = ...) -> None: ...
        class TablesEntry(_message.Message):
            __slots__ = ("key", "value")
            KEY_FIELD_NUMBER: _ClassVar[int]
            VALUE_FIELD_NUMBER: _ClassVar[int]
            key: str
            value: SQLMetadata.Minified.Table
            def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[SQLMetadata.Minified.Table, _Mapping]] = ...) -> None: ...
        TABLES_FIELD_NUMBER: _ClassVar[int]
        tables: _containers.MessageMap[str, SQLMetadata.Minified.Table]
        def __init__(self, tables: _Optional[_Mapping[str, SQLMetadata.Minified.Table]] = ...) -> None: ...
    def __init__(self) -> None: ...

class BucketsMetadata(_message.Message):
    __slots__ = ()
    class Minified(_message.Message):
        __slots__ = ("names",)
        NAMES_FIELD_NUMBER: _ClassVar[int]
        names: _containers.RepeatedScalarFieldContainer[str]
        def __init__(self, names: _Optional[_Iterable[str]] = ...) -> None: ...
    def __init__(self) -> None: ...
