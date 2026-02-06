from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "dynamic_workflow_configuration", "connection", "list_indexes", "create_index", "upsert_vector", "query")
    class Connection(_message.Message):
        __slots__ = ("environment", "api_key")
        ENVIRONMENT_FIELD_NUMBER: _ClassVar[int]
        API_KEY_FIELD_NUMBER: _ClassVar[int]
        environment: str
        api_key: str
        def __init__(self, environment: _Optional[str] = ..., api_key: _Optional[str] = ...) -> None: ...
    class ListIndexes(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class CreateIndex(_message.Message):
        __slots__ = ("name",)
        NAME_FIELD_NUMBER: _ClassVar[int]
        name: str
        def __init__(self, name: _Optional[str] = ...) -> None: ...
    class UpsertVector(_message.Message):
        __slots__ = ("raw",)
        RAW_FIELD_NUMBER: _ClassVar[int]
        raw: str
        def __init__(self, raw: _Optional[str] = ...) -> None: ...
    class Query(_message.Message):
        __slots__ = ("vector", "top_k")
        VECTOR_FIELD_NUMBER: _ClassVar[int]
        TOP_K_FIELD_NUMBER: _ClassVar[int]
        vector: str
        top_k: str
        def __init__(self, vector: _Optional[str] = ..., top_k: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    LIST_INDEXES_FIELD_NUMBER: _ClassVar[int]
    CREATE_INDEX_FIELD_NUMBER: _ClassVar[int]
    UPSERT_VECTOR_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    name: str
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    connection: Plugin.Connection
    list_indexes: Plugin.ListIndexes
    create_index: Plugin.CreateIndex
    upsert_vector: Plugin.UpsertVector
    query: Plugin.Query
    def __init__(self, name: _Optional[str] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., connection: _Optional[_Union[Plugin.Connection, _Mapping]] = ..., list_indexes: _Optional[_Union[Plugin.ListIndexes, _Mapping]] = ..., create_index: _Optional[_Union[Plugin.CreateIndex, _Mapping]] = ..., upsert_vector: _Optional[_Union[Plugin.UpsertVector, _Mapping]] = ..., query: _Optional[_Union[Plugin.Query, _Mapping]] = ...) -> None: ...
