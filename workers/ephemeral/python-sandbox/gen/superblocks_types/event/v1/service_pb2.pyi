from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IngestEventRequest(_message.Message):
    __slots__ = ("events",)
    EVENTS_FIELD_NUMBER: _ClassVar[int]
    events: _containers.RepeatedScalarFieldContainer[bytes]
    def __init__(self, events: _Optional[_Iterable[bytes]] = ...) -> None: ...

class IngestEventResponse(_message.Message):
    __slots__ = ("success", "errors")
    class ErrorWrapper(_message.Message):
        __slots__ = ("id", "error")
        ID_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        id: str
        error: str
        def __init__(self, id: _Optional[str] = ..., error: _Optional[str] = ...) -> None: ...
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    success: int
    errors: _containers.RepeatedCompositeFieldContainer[IngestEventResponse.ErrorWrapper]
    def __init__(self, success: _Optional[int] = ..., errors: _Optional[_Iterable[_Union[IngestEventResponse.ErrorWrapper, _Mapping]]] = ...) -> None: ...
