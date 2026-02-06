from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class ExecuteRequestV1(_message.Message):
    __slots__ = ("script", "context_json", "timeout_ms", "execution_id", "variable_store_address", "variables_json", "files")
    class FilesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    SCRIPT_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_JSON_FIELD_NUMBER: _ClassVar[int]
    TIMEOUT_MS_FIELD_NUMBER: _ClassVar[int]
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    VARIABLE_STORE_ADDRESS_FIELD_NUMBER: _ClassVar[int]
    VARIABLES_JSON_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    script: str
    context_json: str
    timeout_ms: int
    execution_id: str
    variable_store_address: str
    variables_json: str
    files: _containers.ScalarMap[str, str]
    def __init__(self, script: _Optional[str] = ..., context_json: _Optional[str] = ..., timeout_ms: _Optional[int] = ..., execution_id: _Optional[str] = ..., variable_store_address: _Optional[str] = ..., variables_json: _Optional[str] = ..., files: _Optional[_Mapping[str, str]] = ...) -> None: ...

class ExecuteResponseV1(_message.Message):
    __slots__ = ("result", "stdout", "stderr", "exit_code", "error")
    RESULT_FIELD_NUMBER: _ClassVar[int]
    STDOUT_FIELD_NUMBER: _ClassVar[int]
    STDERR_FIELD_NUMBER: _ClassVar[int]
    EXIT_CODE_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    result: str
    stdout: _containers.RepeatedScalarFieldContainer[str]
    stderr: _containers.RepeatedScalarFieldContainer[str]
    exit_code: int
    error: str
    def __init__(self, result: _Optional[str] = ..., stdout: _Optional[_Iterable[str]] = ..., stderr: _Optional[_Iterable[str]] = ..., exit_code: _Optional[int] = ..., error: _Optional[str] = ...) -> None: ...
