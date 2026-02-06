from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "operation", "run_sql", "bulk_edit", "dynamic_workflow_configuration")
    class ConnectionType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        CONNECTION_TYPE_UNSPECIFIED: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_PAT: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_M2M: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_OAUTH_EXCHANGE: _ClassVar[Plugin.ConnectionType]
    CONNECTION_TYPE_UNSPECIFIED: Plugin.ConnectionType
    CONNECTION_TYPE_PAT: Plugin.ConnectionType
    CONNECTION_TYPE_M2M: Plugin.ConnectionType
    CONNECTION_TYPE_OAUTH_EXCHANGE: Plugin.ConnectionType
    class DatabricksConnection(_message.Message):
        __slots__ = ("default_catalog", "default_schema", "host_url", "path", "port", "connection_type", "token", "oauth_client_id", "oauth_client_secret", "scoped_catalog_schemas")
        DEFAULT_CATALOG_FIELD_NUMBER: _ClassVar[int]
        DEFAULT_SCHEMA_FIELD_NUMBER: _ClassVar[int]
        HOST_URL_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        CONNECTION_TYPE_FIELD_NUMBER: _ClassVar[int]
        TOKEN_FIELD_NUMBER: _ClassVar[int]
        OAUTH_CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        OAUTH_CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        SCOPED_CATALOG_SCHEMAS_FIELD_NUMBER: _ClassVar[int]
        default_catalog: str
        default_schema: str
        host_url: str
        path: str
        port: int
        connection_type: Plugin.ConnectionType
        token: str
        oauth_client_id: str
        oauth_client_secret: str
        scoped_catalog_schemas: _containers.RepeatedCompositeFieldContainer[Plugin.ScopedCatalogSchemas]
        def __init__(self, default_catalog: _Optional[str] = ..., default_schema: _Optional[str] = ..., host_url: _Optional[str] = ..., path: _Optional[str] = ..., port: _Optional[int] = ..., connection_type: _Optional[_Union[Plugin.ConnectionType, str]] = ..., token: _Optional[str] = ..., oauth_client_id: _Optional[str] = ..., oauth_client_secret: _Optional[str] = ..., scoped_catalog_schemas: _Optional[_Iterable[_Union[Plugin.ScopedCatalogSchemas, _Mapping]]] = ...) -> None: ...
    class ScopedCatalogSchemas(_message.Message):
        __slots__ = ("catalog", "schemas")
        CATALOG_FIELD_NUMBER: _ClassVar[int]
        SCHEMAS_FIELD_NUMBER: _ClassVar[int]
        catalog: str
        schemas: _containers.RepeatedScalarFieldContainer[str]
        def __init__(self, catalog: _Optional[str] = ..., schemas: _Optional[_Iterable[str]] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    RUN_SQL_FIELD_NUMBER: _ClassVar[int]
    BULK_EDIT_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.DatabricksConnection
    operation: _plugin_pb2.SQLOperation
    run_sql: _plugin_pb2.SQLExecution
    bulk_edit: _plugin_pb2.SQLBulkEdit
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.DatabricksConnection, _Mapping]] = ..., operation: _Optional[_Union[_plugin_pb2.SQLOperation, str]] = ..., run_sql: _Optional[_Union[_plugin_pb2.SQLExecution, _Mapping]] = ..., bulk_edit: _Optional[_Union[_plugin_pb2.SQLBulkEdit, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...
