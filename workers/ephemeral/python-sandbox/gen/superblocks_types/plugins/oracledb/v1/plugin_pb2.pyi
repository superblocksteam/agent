from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "dynamic_workflow_configuration", "run_sql", "bulk_edit", "operation")
    class OracleDbConnection(_message.Message):
        __slots__ = ("host_url", "port", "user", "password", "database_service", "use_tcps", "connection_type", "connection_url")
        HOST_URL_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        USER_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        DATABASE_SERVICE_FIELD_NUMBER: _ClassVar[int]
        USE_TCPS_FIELD_NUMBER: _ClassVar[int]
        CONNECTION_TYPE_FIELD_NUMBER: _ClassVar[int]
        CONNECTION_URL_FIELD_NUMBER: _ClassVar[int]
        host_url: str
        port: int
        user: str
        password: str
        database_service: str
        use_tcps: bool
        connection_type: str
        connection_url: str
        def __init__(self, host_url: _Optional[str] = ..., port: _Optional[int] = ..., user: _Optional[str] = ..., password: _Optional[str] = ..., database_service: _Optional[str] = ..., use_tcps: bool = ..., connection_type: _Optional[str] = ..., connection_url: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    RUN_SQL_FIELD_NUMBER: _ClassVar[int]
    BULK_EDIT_FIELD_NUMBER: _ClassVar[int]
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.OracleDbConnection
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    run_sql: _plugin_pb2.SQLExecution
    bulk_edit: _plugin_pb2.SQLBulkEdit
    operation: _plugin_pb2.SQLOperation
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.OracleDbConnection, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., run_sql: _Optional[_Union[_plugin_pb2.SQLExecution, _Mapping]] = ..., bulk_edit: _Optional[_Union[_plugin_pb2.SQLBulkEdit, _Mapping]] = ..., operation: _Optional[_Union[_plugin_pb2.SQLOperation, str]] = ...) -> None: ...
