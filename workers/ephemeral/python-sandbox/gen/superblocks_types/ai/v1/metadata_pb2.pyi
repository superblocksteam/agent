from buf.validate import validate_pb2 as _validate_pb2
from plugins.common.v1 import metadata_pb2 as _metadata_pb2
from plugins.kafka.v1 import plugin_pb2 as _plugin_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Metadata(_message.Message):
    __slots__ = ("mariadb", "mssql", "mysql", "postgres", "rockset", "snowflake", "cockroachdb", "kafka", "confluent", "msk", "redpanda", "aivenkafka")
    MARIADB_FIELD_NUMBER: _ClassVar[int]
    MSSQL_FIELD_NUMBER: _ClassVar[int]
    MYSQL_FIELD_NUMBER: _ClassVar[int]
    POSTGRES_FIELD_NUMBER: _ClassVar[int]
    ROCKSET_FIELD_NUMBER: _ClassVar[int]
    SNOWFLAKE_FIELD_NUMBER: _ClassVar[int]
    COCKROACHDB_FIELD_NUMBER: _ClassVar[int]
    KAFKA_FIELD_NUMBER: _ClassVar[int]
    CONFLUENT_FIELD_NUMBER: _ClassVar[int]
    MSK_FIELD_NUMBER: _ClassVar[int]
    REDPANDA_FIELD_NUMBER: _ClassVar[int]
    AIVENKAFKA_FIELD_NUMBER: _ClassVar[int]
    mariadb: _metadata_pb2.SQLMetadata.Minified
    mssql: _metadata_pb2.SQLMetadata.Minified
    mysql: _metadata_pb2.SQLMetadata.Minified
    postgres: _metadata_pb2.SQLMetadata.Minified
    rockset: _metadata_pb2.SQLMetadata.Minified
    snowflake: _metadata_pb2.SQLMetadata.Minified
    cockroachdb: _metadata_pb2.SQLMetadata.Minified
    kafka: _plugin_pb2.Metadata.Minified
    confluent: _plugin_pb2.Metadata.Minified
    msk: _plugin_pb2.Metadata.Minified
    redpanda: _plugin_pb2.Metadata.Minified
    aivenkafka: _plugin_pb2.Metadata.Minified
    def __init__(self, mariadb: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., mssql: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., mysql: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., postgres: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., rockset: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., snowflake: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., cockroachdb: _Optional[_Union[_metadata_pb2.SQLMetadata.Minified, _Mapping]] = ..., kafka: _Optional[_Union[_plugin_pb2.Metadata.Minified, _Mapping]] = ..., confluent: _Optional[_Union[_plugin_pb2.Metadata.Minified, _Mapping]] = ..., msk: _Optional[_Union[_plugin_pb2.Metadata.Minified, _Mapping]] = ..., redpanda: _Optional[_Union[_plugin_pb2.Metadata.Minified, _Mapping]] = ..., aivenkafka: _Optional[_Union[_plugin_pb2.Metadata.Minified, _Mapping]] = ...) -> None: ...
