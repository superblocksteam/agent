from google.protobuf import any_pb2 as _any_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class MappedColumns(_message.Message):
    __slots__ = ("json", "sql")
    JSON_FIELD_NUMBER: _ClassVar[int]
    SQL_FIELD_NUMBER: _ClassVar[int]
    json: str
    sql: str
    def __init__(self, json: _Optional[str] = ..., sql: _Optional[str] = ...) -> None: ...

class Tuple(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: _any_pb2.Any
    def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_any_pb2.Any, _Mapping]] = ...) -> None: ...

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("body", "usePreparedSql", "operation", "useAdvancedMatching", "table", "newValues", "oldValues", "filterBy", "mappingMode", "mappedColumns", "superblocksMetadata", "insertedRows", "deletedRows", "schema", "parameters")
    BODY_FIELD_NUMBER: _ClassVar[int]
    USEPREPAREDSQL_FIELD_NUMBER: _ClassVar[int]
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    USEADVANCEDMATCHING_FIELD_NUMBER: _ClassVar[int]
    TABLE_FIELD_NUMBER: _ClassVar[int]
    NEWVALUES_FIELD_NUMBER: _ClassVar[int]
    OLDVALUES_FIELD_NUMBER: _ClassVar[int]
    FILTERBY_FIELD_NUMBER: _ClassVar[int]
    MAPPINGMODE_FIELD_NUMBER: _ClassVar[int]
    MAPPEDCOLUMNS_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    INSERTEDROWS_FIELD_NUMBER: _ClassVar[int]
    DELETEDROWS_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    body: str
    usePreparedSql: bool
    operation: str
    useAdvancedMatching: str
    table: str
    newValues: str
    oldValues: str
    filterBy: _containers.RepeatedScalarFieldContainer[str]
    mappingMode: str
    mappedColumns: _containers.RepeatedCompositeFieldContainer[MappedColumns]
    superblocksMetadata: SuperblocksMetadata
    insertedRows: str
    deletedRows: str
    schema: str
    parameters: str
    def __init__(self, body: _Optional[str] = ..., usePreparedSql: bool = ..., operation: _Optional[str] = ..., useAdvancedMatching: _Optional[str] = ..., table: _Optional[str] = ..., newValues: _Optional[str] = ..., oldValues: _Optional[str] = ..., filterBy: _Optional[_Iterable[str]] = ..., mappingMode: _Optional[str] = ..., mappedColumns: _Optional[_Iterable[_Union[MappedColumns, _Mapping]]] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ..., insertedRows: _Optional[str] = ..., deletedRows: _Optional[str] = ..., schema: _Optional[str] = ..., parameters: _Optional[str] = ...) -> None: ...
