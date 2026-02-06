from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Connection(_message.Message):
    __slots__ = ("workgroup_name", "override_s3_output_location", "s3_output_location", "s3_output_location_suffix", "database_name", "aws_config")
    class DateFolderType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        DATE_FOLDER_TYPE_UNSPECIFIED: _ClassVar[Connection.DateFolderType]
        DATE_FOLDER_TYPE_YYYY: _ClassVar[Connection.DateFolderType]
        DATE_FOLDER_TYPE_YYYYMM: _ClassVar[Connection.DateFolderType]
        DATE_FOLDER_TYPE_YYYYMMDD: _ClassVar[Connection.DateFolderType]
    DATE_FOLDER_TYPE_UNSPECIFIED: Connection.DateFolderType
    DATE_FOLDER_TYPE_YYYY: Connection.DateFolderType
    DATE_FOLDER_TYPE_YYYYMM: Connection.DateFolderType
    DATE_FOLDER_TYPE_YYYYMMDD: Connection.DateFolderType
    WORKGROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    OVERRIDE_S3_OUTPUT_LOCATION_FIELD_NUMBER: _ClassVar[int]
    S3_OUTPUT_LOCATION_FIELD_NUMBER: _ClassVar[int]
    S3_OUTPUT_LOCATION_SUFFIX_FIELD_NUMBER: _ClassVar[int]
    DATABASE_NAME_FIELD_NUMBER: _ClassVar[int]
    AWS_CONFIG_FIELD_NUMBER: _ClassVar[int]
    workgroup_name: str
    override_s3_output_location: bool
    s3_output_location: str
    s3_output_location_suffix: Connection.DateFolderType
    database_name: str
    aws_config: _plugin_pb2.AWSConfig
    def __init__(self, workgroup_name: _Optional[str] = ..., override_s3_output_location: bool = ..., s3_output_location: _Optional[str] = ..., s3_output_location_suffix: _Optional[_Union[Connection.DateFolderType, str]] = ..., database_name: _Optional[str] = ..., aws_config: _Optional[_Union[_plugin_pb2.AWSConfig, _Mapping]] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "run_sql", "dynamic_workflow_configuration")
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    RUN_SQL_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Connection
    run_sql: _plugin_pb2.SQLExecution
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Connection, _Mapping]] = ..., run_sql: _Optional[_Union[_plugin_pb2.SQLExecution, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...
