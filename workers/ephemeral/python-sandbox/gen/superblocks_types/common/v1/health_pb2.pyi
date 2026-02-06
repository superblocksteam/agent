from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Pool(_message.Message):
    __slots__ = ("hits", "misses", "timeouts", "total", "idle", "stale")
    HITS_FIELD_NUMBER: _ClassVar[int]
    MISSES_FIELD_NUMBER: _ClassVar[int]
    TIMEOUTS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    IDLE_FIELD_NUMBER: _ClassVar[int]
    STALE_FIELD_NUMBER: _ClassVar[int]
    hits: int
    misses: int
    timeouts: int
    total: int
    idle: int
    stale: int
    def __init__(self, hits: _Optional[int] = ..., misses: _Optional[int] = ..., timeouts: _Optional[int] = ..., total: _Optional[int] = ..., idle: _Optional[int] = ..., stale: _Optional[int] = ...) -> None: ...

class HealthResponse(_message.Message):
    __slots__ = ("message", "uptime", "version", "store", "stream", "id")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    UPTIME_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    STORE_FIELD_NUMBER: _ClassVar[int]
    STREAM_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    message: str
    uptime: int
    version: str
    store: Pool
    stream: Pool
    id: str
    def __init__(self, message: _Optional[str] = ..., uptime: _Optional[int] = ..., version: _Optional[str] = ..., store: _Optional[_Union[Pool, _Mapping]] = ..., stream: _Optional[_Union[Pool, _Mapping]] = ..., id: _Optional[str] = ...) -> None: ...
