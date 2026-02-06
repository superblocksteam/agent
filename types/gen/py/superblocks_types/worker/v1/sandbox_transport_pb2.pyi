from api.v1 import event_pb2 as _event_pb2
from common.v1 import errors_pb2 as _errors_pb2
from google.protobuf import duration_pb2 as _duration_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from transport.v1 import transport_pb2 as _transport_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class RequestMetadata(_message.Message):
    __slots__ = ("pluginName",)
    PLUGINNAME_FIELD_NUMBER: _ClassVar[int]
    pluginName: str
    def __init__(self, pluginName: _Optional[str] = ...) -> None: ...

class ExecuteRequest(_message.Message):
    __slots__ = ("metadata", "props", "quotas", "pinned", "variable_store_address")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    PROPS_FIELD_NUMBER: _ClassVar[int]
    QUOTAS_FIELD_NUMBER: _ClassVar[int]
    PINNED_FIELD_NUMBER: _ClassVar[int]
    VARIABLE_STORE_ADDRESS_FIELD_NUMBER: _ClassVar[int]
    metadata: RequestMetadata
    props: _transport_pb2.Request.Data.Data.Props
    quotas: _transport_pb2.Request.Data.Data.Quota
    pinned: _transport_pb2.Request.Data.Pinned
    variable_store_address: str
    def __init__(self, metadata: _Optional[_Union[RequestMetadata, _Mapping]] = ..., props: _Optional[_Union[_transport_pb2.Request.Data.Data.Props, _Mapping]] = ..., quotas: _Optional[_Union[_transport_pb2.Request.Data.Data.Quota, _Mapping]] = ..., pinned: _Optional[_Union[_transport_pb2.Request.Data.Pinned, _Mapping]] = ..., variable_store_address: _Optional[str] = ...) -> None: ...

class ExecuteResponse(_message.Message):
    __slots__ = ("output", "error", "authError", "children", "startTime", "executionTime", "structuredLog")
    OUTPUT_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    AUTHERROR_FIELD_NUMBER: _ClassVar[int]
    CHILDREN_FIELD_NUMBER: _ClassVar[int]
    STARTTIME_FIELD_NUMBER: _ClassVar[int]
    EXECUTIONTIME_FIELD_NUMBER: _ClassVar[int]
    STRUCTUREDLOG_FIELD_NUMBER: _ClassVar[int]
    output: _event_pb2.OutputOld
    error: _errors_pb2.Error
    authError: bool
    children: _containers.RepeatedScalarFieldContainer[str]
    startTime: _timestamp_pb2.Timestamp
    executionTime: _duration_pb2.Duration
    structuredLog: _containers.RepeatedCompositeFieldContainer[StructuredLog]
    def __init__(self, output: _Optional[_Union[_event_pb2.OutputOld, _Mapping]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ..., authError: bool = ..., children: _Optional[_Iterable[str]] = ..., startTime: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., executionTime: _Optional[_Union[_duration_pb2.Duration, _Mapping]] = ..., structuredLog: _Optional[_Iterable[_Union[StructuredLog, _Mapping]]] = ...) -> None: ...

class StreamRequest(_message.Message):
    __slots__ = ("request", "topic")
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    TOPIC_FIELD_NUMBER: _ClassVar[int]
    request: ExecuteRequest
    topic: str
    def __init__(self, request: _Optional[_Union[ExecuteRequest, _Mapping]] = ..., topic: _Optional[str] = ...) -> None: ...

class MetadataRequest(_message.Message):
    __slots__ = ("metadata", "datasourceConfig", "actionConfig", "variable_store_address")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    DATASOURCECONFIG_FIELD_NUMBER: _ClassVar[int]
    ACTIONCONFIG_FIELD_NUMBER: _ClassVar[int]
    VARIABLE_STORE_ADDRESS_FIELD_NUMBER: _ClassVar[int]
    metadata: RequestMetadata
    datasourceConfig: _struct_pb2.Struct
    actionConfig: _struct_pb2.Struct
    variable_store_address: str
    def __init__(self, metadata: _Optional[_Union[RequestMetadata, _Mapping]] = ..., datasourceConfig: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., actionConfig: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., variable_store_address: _Optional[str] = ...) -> None: ...

class TestRequest(_message.Message):
    __slots__ = ("metadata", "datasourceConfig", "actionConfig", "variable_store_address")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    DATASOURCECONFIG_FIELD_NUMBER: _ClassVar[int]
    ACTIONCONFIG_FIELD_NUMBER: _ClassVar[int]
    VARIABLE_STORE_ADDRESS_FIELD_NUMBER: _ClassVar[int]
    metadata: RequestMetadata
    datasourceConfig: _struct_pb2.Struct
    actionConfig: _struct_pb2.Struct
    variable_store_address: str
    def __init__(self, metadata: _Optional[_Union[RequestMetadata, _Mapping]] = ..., datasourceConfig: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., actionConfig: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., variable_store_address: _Optional[str] = ...) -> None: ...

class PreDeleteRequest(_message.Message):
    __slots__ = ("metadata", "datasourceConfig")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    DATASOURCECONFIG_FIELD_NUMBER: _ClassVar[int]
    metadata: RequestMetadata
    datasourceConfig: _struct_pb2.Struct
    def __init__(self, metadata: _Optional[_Union[RequestMetadata, _Mapping]] = ..., datasourceConfig: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...

class StructuredLog(_message.Message):
    __slots__ = ("message", "level")
    class Level(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        LEVEL_UNSPECIFIED: _ClassVar[StructuredLog.Level]
        LEVEL_INFO: _ClassVar[StructuredLog.Level]
        LEVEL_WARN: _ClassVar[StructuredLog.Level]
        LEVEL_ERROR: _ClassVar[StructuredLog.Level]
    LEVEL_UNSPECIFIED: StructuredLog.Level
    LEVEL_INFO: StructuredLog.Level
    LEVEL_WARN: StructuredLog.Level
    LEVEL_ERROR: StructuredLog.Level
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    LEVEL_FIELD_NUMBER: _ClassVar[int]
    message: str
    level: StructuredLog.Level
    def __init__(self, message: _Optional[str] = ..., level: _Optional[_Union[StructuredLog.Level, str]] = ...) -> None: ...
