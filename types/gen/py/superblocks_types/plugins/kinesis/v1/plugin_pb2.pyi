from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "operation_type", "put", "get", "dynamic_workflow_configuration")
    class ShardIteratorType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        SHARD_ITERATOR_TYPE_UNSPECIFIED: _ClassVar[Plugin.ShardIteratorType]
        SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER: _ClassVar[Plugin.ShardIteratorType]
        SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER: _ClassVar[Plugin.ShardIteratorType]
        SHARD_ITERATOR_TYPE_AT_TIMESTAMP: _ClassVar[Plugin.ShardIteratorType]
        SHARD_ITERATOR_TYPE_TRIM_HORIZON: _ClassVar[Plugin.ShardIteratorType]
        SHARD_ITERATOR_TYPE_LATEST: _ClassVar[Plugin.ShardIteratorType]
    SHARD_ITERATOR_TYPE_UNSPECIFIED: Plugin.ShardIteratorType
    SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER: Plugin.ShardIteratorType
    SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER: Plugin.ShardIteratorType
    SHARD_ITERATOR_TYPE_AT_TIMESTAMP: Plugin.ShardIteratorType
    SHARD_ITERATOR_TYPE_TRIM_HORIZON: Plugin.ShardIteratorType
    SHARD_ITERATOR_TYPE_LATEST: Plugin.ShardIteratorType
    class OperationType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        OPERATION_TYPE_UNSPECIFIED: _ClassVar[Plugin.OperationType]
        OPERATION_TYPE_GET: _ClassVar[Plugin.OperationType]
        OPERATION_TYPE_PUT: _ClassVar[Plugin.OperationType]
    OPERATION_TYPE_UNSPECIFIED: Plugin.OperationType
    OPERATION_TYPE_GET: Plugin.OperationType
    OPERATION_TYPE_PUT: Plugin.OperationType
    class StreamIdentifier(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        STREAM_IDENTIFIER_UNSPECIFIED: _ClassVar[Plugin.StreamIdentifier]
        STREAM_IDENTIFIER_STREAM_NAME: _ClassVar[Plugin.StreamIdentifier]
        STREAM_IDENTIFIER_STREAM_ARN: _ClassVar[Plugin.StreamIdentifier]
    STREAM_IDENTIFIER_UNSPECIFIED: Plugin.StreamIdentifier
    STREAM_IDENTIFIER_STREAM_NAME: Plugin.StreamIdentifier
    STREAM_IDENTIFIER_STREAM_ARN: Plugin.StreamIdentifier
    class KinesisConnection(_message.Message):
        __slots__ = ("aws_config",)
        AWS_CONFIG_FIELD_NUMBER: _ClassVar[int]
        aws_config: _plugin_pb2.AWSConfig
        def __init__(self, aws_config: _Optional[_Union[_plugin_pb2.AWSConfig, _Mapping]] = ...) -> None: ...
    class KinesisPut(_message.Message):
        __slots__ = ("data", "partition_key", "stream_identifier_type", "stream_name", "stream_arn")
        DATA_FIELD_NUMBER: _ClassVar[int]
        PARTITION_KEY_FIELD_NUMBER: _ClassVar[int]
        STREAM_IDENTIFIER_TYPE_FIELD_NUMBER: _ClassVar[int]
        STREAM_NAME_FIELD_NUMBER: _ClassVar[int]
        STREAM_ARN_FIELD_NUMBER: _ClassVar[int]
        data: str
        partition_key: str
        stream_identifier_type: Plugin.StreamIdentifier
        stream_name: str
        stream_arn: str
        def __init__(self, data: _Optional[str] = ..., partition_key: _Optional[str] = ..., stream_identifier_type: _Optional[_Union[Plugin.StreamIdentifier, str]] = ..., stream_name: _Optional[str] = ..., stream_arn: _Optional[str] = ...) -> None: ...
    class KinesisGet(_message.Message):
        __slots__ = ("shard_id", "shard_iterator_type", "limit", "polling_cooldown_ms", "starting_sequence_number", "timestamp", "stream_identifier_type", "stream_name", "stream_arn")
        SHARD_ID_FIELD_NUMBER: _ClassVar[int]
        SHARD_ITERATOR_TYPE_FIELD_NUMBER: _ClassVar[int]
        LIMIT_FIELD_NUMBER: _ClassVar[int]
        POLLING_COOLDOWN_MS_FIELD_NUMBER: _ClassVar[int]
        STARTING_SEQUENCE_NUMBER_FIELD_NUMBER: _ClassVar[int]
        TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
        STREAM_IDENTIFIER_TYPE_FIELD_NUMBER: _ClassVar[int]
        STREAM_NAME_FIELD_NUMBER: _ClassVar[int]
        STREAM_ARN_FIELD_NUMBER: _ClassVar[int]
        shard_id: str
        shard_iterator_type: Plugin.ShardIteratorType
        limit: int
        polling_cooldown_ms: int
        starting_sequence_number: str
        timestamp: str
        stream_identifier_type: Plugin.StreamIdentifier
        stream_name: str
        stream_arn: str
        def __init__(self, shard_id: _Optional[str] = ..., shard_iterator_type: _Optional[_Union[Plugin.ShardIteratorType, str]] = ..., limit: _Optional[int] = ..., polling_cooldown_ms: _Optional[int] = ..., starting_sequence_number: _Optional[str] = ..., timestamp: _Optional[str] = ..., stream_identifier_type: _Optional[_Union[Plugin.StreamIdentifier, str]] = ..., stream_name: _Optional[str] = ..., stream_arn: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    PUT_FIELD_NUMBER: _ClassVar[int]
    GET_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.KinesisConnection
    operation_type: Plugin.OperationType
    put: Plugin.KinesisPut
    get: Plugin.KinesisGet
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.KinesisConnection, _Mapping]] = ..., operation_type: _Optional[_Union[Plugin.OperationType, str]] = ..., put: _Optional[_Union[Plugin.KinesisPut, _Mapping]] = ..., get: _Optional[_Union[Plugin.KinesisGet, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...

class Metadata(_message.Message):
    __slots__ = ("streams",)
    STREAMS_FIELD_NUMBER: _ClassVar[int]
    streams: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, streams: _Optional[_Iterable[str]] = ...) -> None: ...
