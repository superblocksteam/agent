from ai.v1 import ai_pb2 as _ai_pb2
from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import health_pb2 as _health_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Overrides(_message.Message):
    __slots__ = ("llm", "model")
    LLM_FIELD_NUMBER: _ClassVar[int]
    MODEL_FIELD_NUMBER: _ClassVar[int]
    llm: _ai_pb2.LLM
    model: _ai_pb2.MODEL
    def __init__(self, llm: _Optional[_Union[_ai_pb2.LLM, str]] = ..., model: _Optional[_Union[_ai_pb2.MODEL, str]] = ...) -> None: ...

class CreateTaskRequest(_message.Message):
    __slots__ = ("task", "overrides")
    TASK_FIELD_NUMBER: _ClassVar[int]
    OVERRIDES_FIELD_NUMBER: _ClassVar[int]
    task: _ai_pb2.Task
    overrides: Overrides
    def __init__(self, task: _Optional[_Union[_ai_pb2.Task, _Mapping]] = ..., overrides: _Optional[_Union[Overrides, _Mapping]] = ...) -> None: ...

class TaskEvent(_message.Message):
    __slots__ = ("chunk", "llm", "model", "id")
    CHUNK_FIELD_NUMBER: _ClassVar[int]
    LLM_FIELD_NUMBER: _ClassVar[int]
    MODEL_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    chunk: str
    llm: _ai_pb2.LLM
    model: _ai_pb2.MODEL
    id: str
    def __init__(self, chunk: _Optional[str] = ..., llm: _Optional[_Union[_ai_pb2.LLM, str]] = ..., model: _Optional[_Union[_ai_pb2.MODEL, str]] = ..., id: _Optional[str] = ...) -> None: ...
