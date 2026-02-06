from plugins.common.v1 import auth_pb2 as _auth_pb2
from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "dynamic_workflow_configuration", "connection", "sql", "point_operation")
    class CosmosDbConnection(_message.Message):
        __slots__ = ("host", "port", "database_id", "auth")
        HOST_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        DATABASE_ID_FIELD_NUMBER: _ClassVar[int]
        AUTH_FIELD_NUMBER: _ClassVar[int]
        host: str
        port: int
        database_id: str
        auth: _auth_pb2.Azure
        def __init__(self, host: _Optional[str] = ..., port: _Optional[int] = ..., database_id: _Optional[str] = ..., auth: _Optional[_Union[_auth_pb2.Azure, _Mapping]] = ...) -> None: ...
    class Metadata(_message.Message):
        __slots__ = ("containers",)
        class Container(_message.Message):
            __slots__ = ("id", "partition_key")
            class PartitionKey(_message.Message):
                __slots__ = ("paths", "kind", "version")
                PATHS_FIELD_NUMBER: _ClassVar[int]
                KIND_FIELD_NUMBER: _ClassVar[int]
                VERSION_FIELD_NUMBER: _ClassVar[int]
                paths: _containers.RepeatedScalarFieldContainer[str]
                kind: str
                version: int
                def __init__(self, paths: _Optional[_Iterable[str]] = ..., kind: _Optional[str] = ..., version: _Optional[int] = ...) -> None: ...
            ID_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            id: str
            partition_key: Plugin.Metadata.Container.PartitionKey
            def __init__(self, id: _Optional[str] = ..., partition_key: _Optional[_Union[Plugin.Metadata.Container.PartitionKey, _Mapping]] = ...) -> None: ...
        CONTAINERS_FIELD_NUMBER: _ClassVar[int]
        containers: _containers.RepeatedCompositeFieldContainer[Plugin.Metadata.Container]
        def __init__(self, containers: _Optional[_Iterable[_Union[Plugin.Metadata.Container, _Mapping]]] = ...) -> None: ...
    class Sql(_message.Message):
        __slots__ = ("singleton",)
        class Singleton(_message.Message):
            __slots__ = ("container_id", "query", "cross_partition", "partition_key")
            CONTAINER_ID_FIELD_NUMBER: _ClassVar[int]
            QUERY_FIELD_NUMBER: _ClassVar[int]
            CROSS_PARTITION_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            container_id: str
            query: str
            cross_partition: bool
            partition_key: str
            def __init__(self, container_id: _Optional[str] = ..., query: _Optional[str] = ..., cross_partition: bool = ..., partition_key: _Optional[str] = ...) -> None: ...
        SINGLETON_FIELD_NUMBER: _ClassVar[int]
        singleton: Plugin.Sql.Singleton
        def __init__(self, singleton: _Optional[_Union[Plugin.Sql.Singleton, _Mapping]] = ...) -> None: ...
    class PointOperation(_message.Message):
        __slots__ = ("container_id", "read", "replace", "upsert", "delete", "create")
        class Read(_message.Message):
            __slots__ = ("id", "partition_key")
            ID_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            id: str
            partition_key: str
            def __init__(self, id: _Optional[str] = ..., partition_key: _Optional[str] = ...) -> None: ...
        class Delete(_message.Message):
            __slots__ = ("id", "partition_key")
            ID_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            id: str
            partition_key: str
            def __init__(self, id: _Optional[str] = ..., partition_key: _Optional[str] = ...) -> None: ...
        class Replace(_message.Message):
            __slots__ = ("body", "partition_key")
            BODY_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            body: str
            partition_key: str
            def __init__(self, body: _Optional[str] = ..., partition_key: _Optional[str] = ...) -> None: ...
        class Upsert(_message.Message):
            __slots__ = ("body", "partition_key")
            BODY_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            body: str
            partition_key: str
            def __init__(self, body: _Optional[str] = ..., partition_key: _Optional[str] = ...) -> None: ...
        class Create(_message.Message):
            __slots__ = ("body", "partition_key")
            BODY_FIELD_NUMBER: _ClassVar[int]
            PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
            body: str
            partition_key: str
            def __init__(self, body: _Optional[str] = ..., partition_key: _Optional[str] = ...) -> None: ...
        CONTAINER_ID_FIELD_NUMBER: _ClassVar[int]
        READ_FIELD_NUMBER: _ClassVar[int]
        REPLACE_FIELD_NUMBER: _ClassVar[int]
        UPSERT_FIELD_NUMBER: _ClassVar[int]
        DELETE_FIELD_NUMBER: _ClassVar[int]
        CREATE_FIELD_NUMBER: _ClassVar[int]
        container_id: str
        read: Plugin.PointOperation.Read
        replace: Plugin.PointOperation.Replace
        upsert: Plugin.PointOperation.Upsert
        delete: Plugin.PointOperation.Delete
        create: Plugin.PointOperation.Create
        def __init__(self, container_id: _Optional[str] = ..., read: _Optional[_Union[Plugin.PointOperation.Read, _Mapping]] = ..., replace: _Optional[_Union[Plugin.PointOperation.Replace, _Mapping]] = ..., upsert: _Optional[_Union[Plugin.PointOperation.Upsert, _Mapping]] = ..., delete: _Optional[_Union[Plugin.PointOperation.Delete, _Mapping]] = ..., create: _Optional[_Union[Plugin.PointOperation.Create, _Mapping]] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    SQL_FIELD_NUMBER: _ClassVar[int]
    POINT_OPERATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    connection: Plugin.CosmosDbConnection
    sql: Plugin.Sql
    point_operation: Plugin.PointOperation
    def __init__(self, name: _Optional[str] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., connection: _Optional[_Union[Plugin.CosmosDbConnection, _Mapping]] = ..., sql: _Optional[_Union[Plugin.Sql, _Mapping]] = ..., point_operation: _Optional[_Union[Plugin.PointOperation, _Mapping]] = ...) -> None: ...
