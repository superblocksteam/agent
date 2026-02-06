from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import errors_pb2 as _errors_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class BlockStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    BLOCK_STATUS_UNSPECIFIED: _ClassVar[BlockStatus]
    BLOCK_STATUS_SUCCEEDED: _ClassVar[BlockStatus]
    BLOCK_STATUS_ERRORED: _ClassVar[BlockStatus]

class BlockType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    BLOCK_TYPE_UNSPECIFIED: _ClassVar[BlockType]
    BLOCK_TYPE_BREAK: _ClassVar[BlockType]
    BLOCK_TYPE_RETURN: _ClassVar[BlockType]
    BLOCK_TYPE_WAIT: _ClassVar[BlockType]
    BLOCK_TYPE_PARALLEL: _ClassVar[BlockType]
    BLOCK_TYPE_CONDITIONAL: _ClassVar[BlockType]
    BLOCK_TYPE_LOOP: _ClassVar[BlockType]
    BLOCK_TYPE_TRYCATCH: _ClassVar[BlockType]
    BLOCK_TYPE_STEP: _ClassVar[BlockType]
    BLOCK_TYPE_VARIABLES: _ClassVar[BlockType]
    BLOCK_TYPE_THROW: _ClassVar[BlockType]
    BLOCK_TYPE_SEND: _ClassVar[BlockType]
    BLOCK_TYPE_STREAM: _ClassVar[BlockType]
    BLOCK_TYPE_AUTHORIZATION_CHECK: _ClassVar[BlockType]
BLOCK_STATUS_UNSPECIFIED: BlockStatus
BLOCK_STATUS_SUCCEEDED: BlockStatus
BLOCK_STATUS_ERRORED: BlockStatus
BLOCK_TYPE_UNSPECIFIED: BlockType
BLOCK_TYPE_BREAK: BlockType
BLOCK_TYPE_RETURN: BlockType
BLOCK_TYPE_WAIT: BlockType
BLOCK_TYPE_PARALLEL: BlockType
BLOCK_TYPE_CONDITIONAL: BlockType
BLOCK_TYPE_LOOP: BlockType
BLOCK_TYPE_TRYCATCH: BlockType
BLOCK_TYPE_STEP: BlockType
BLOCK_TYPE_VARIABLES: BlockType
BLOCK_TYPE_THROW: BlockType
BLOCK_TYPE_SEND: BlockType
BLOCK_TYPE_STREAM: BlockType
BLOCK_TYPE_AUTHORIZATION_CHECK: BlockType

class Resolved(_message.Message):
    __slots__ = ("value", "bindings")
    VALUE_FIELD_NUMBER: _ClassVar[int]
    BINDINGS_FIELD_NUMBER: _ClassVar[int]
    value: _struct_pb2.Value
    bindings: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Value]
    def __init__(self, value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., bindings: _Optional[_Iterable[_Union[_struct_pb2.Value, _Mapping]]] = ...) -> None: ...

class Event(_message.Message):
    __slots__ = ("name", "type", "timestamp", "start", "end", "data", "request", "response", "parent", "execution_index")
    class Data(_message.Message):
        __slots__ = ("value",)
        VALUE_FIELD_NUMBER: _ClassVar[int]
        value: _struct_pb2.Value
        def __init__(self, value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class Request(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class Response(_message.Message):
        __slots__ = ("last", "errors")
        LAST_FIELD_NUMBER: _ClassVar[int]
        ERRORS_FIELD_NUMBER: _ClassVar[int]
        last: str
        errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
        def __init__(self, last: _Optional[str] = ..., errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ...) -> None: ...
    class Start(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class End(_message.Message):
        __slots__ = ("performance", "output", "error", "status", "resolved")
        class ResolvedEntry(_message.Message):
            __slots__ = ("key", "value")
            KEY_FIELD_NUMBER: _ClassVar[int]
            VALUE_FIELD_NUMBER: _ClassVar[int]
            key: str
            value: Resolved
            def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Resolved, _Mapping]] = ...) -> None: ...
        PERFORMANCE_FIELD_NUMBER: _ClassVar[int]
        OUTPUT_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        STATUS_FIELD_NUMBER: _ClassVar[int]
        RESOLVED_FIELD_NUMBER: _ClassVar[int]
        performance: Performance
        output: Output
        error: _errors_pb2.Error
        status: BlockStatus
        resolved: _containers.MessageMap[str, Resolved]
        def __init__(self, performance: _Optional[_Union[Performance, _Mapping]] = ..., output: _Optional[_Union[Output, _Mapping]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ..., status: _Optional[_Union[BlockStatus, str]] = ..., resolved: _Optional[_Mapping[str, Resolved]] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    START_FIELD_NUMBER: _ClassVar[int]
    END_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    PARENT_FIELD_NUMBER: _ClassVar[int]
    EXECUTION_INDEX_FIELD_NUMBER: _ClassVar[int]
    name: str
    type: BlockType
    timestamp: _timestamp_pb2.Timestamp
    start: Event.Start
    end: Event.End
    data: Event.Data
    request: Event.Request
    response: Event.Response
    parent: str
    execution_index: str
    def __init__(self, name: _Optional[str] = ..., type: _Optional[_Union[BlockType, str]] = ..., timestamp: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., start: _Optional[_Union[Event.Start, _Mapping]] = ..., end: _Optional[_Union[Event.End, _Mapping]] = ..., data: _Optional[_Union[Event.Data, _Mapping]] = ..., request: _Optional[_Union[Event.Request, _Mapping]] = ..., response: _Optional[_Union[Event.Response, _Mapping]] = ..., parent: _Optional[str] = ..., execution_index: _Optional[str] = ...) -> None: ...

class Performance(_message.Message):
    __slots__ = ("start", "finish", "total", "execution", "overhead", "custom")
    class CustomEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    START_FIELD_NUMBER: _ClassVar[int]
    FINISH_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    OVERHEAD_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    start: int
    finish: int
    total: int
    execution: int
    overhead: int
    custom: _containers.ScalarMap[str, int]
    def __init__(self, start: _Optional[int] = ..., finish: _Optional[int] = ..., total: _Optional[int] = ..., execution: _Optional[int] = ..., overhead: _Optional[int] = ..., custom: _Optional[_Mapping[str, int]] = ...) -> None: ...

class Output(_message.Message):
    __slots__ = ("result", "request", "stdout", "stderr", "request_v2")
    class Request(_message.Message):
        __slots__ = ("summary", "metadata")
        SUMMARY_FIELD_NUMBER: _ClassVar[int]
        METADATA_FIELD_NUMBER: _ClassVar[int]
        summary: str
        metadata: _struct_pb2.Struct
        def __init__(self, summary: _Optional[str] = ..., metadata: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...
    RESULT_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    STDOUT_FIELD_NUMBER: _ClassVar[int]
    STDERR_FIELD_NUMBER: _ClassVar[int]
    REQUEST_V2_FIELD_NUMBER: _ClassVar[int]
    result: _struct_pb2.Value
    request: str
    stdout: _containers.RepeatedScalarFieldContainer[str]
    stderr: _containers.RepeatedScalarFieldContainer[str]
    request_v2: Output.Request
    def __init__(self, result: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., request: _Optional[str] = ..., stdout: _Optional[_Iterable[str]] = ..., stderr: _Optional[_Iterable[str]] = ..., request_v2: _Optional[_Union[Output.Request, _Mapping]] = ...) -> None: ...

class OutputOld(_message.Message):
    __slots__ = ("output", "log", "request", "place_holders_info")
    OUTPUT_FIELD_NUMBER: _ClassVar[int]
    LOG_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    PLACE_HOLDERS_INFO_FIELD_NUMBER: _ClassVar[int]
    output: _struct_pb2.Value
    log: _containers.RepeatedScalarFieldContainer[str]
    request: str
    place_holders_info: _struct_pb2.Value
    def __init__(self, output: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., log: _Optional[_Iterable[str]] = ..., request: _Optional[str] = ..., place_holders_info: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
