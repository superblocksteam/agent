from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Code(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CODE_UNSPECIFIED: _ClassVar[Code]
    CODE_INTEGRATION_AUTHORIZATION: _ClassVar[Code]
    CODE_INTEGRATION_NETWORK: _ClassVar[Code]
    CODE_INTEGRATION_QUERY_TIMEOUT: _ClassVar[Code]
    CODE_INTEGRATION_SYNTAX: _ClassVar[Code]
    CODE_INTEGRATION_LOGIC: _ClassVar[Code]
    CODE_INTEGRATION_MISSING_REQUIRED_FIELD: _ClassVar[Code]
    CODE_INTEGRATION_RATE_LIMIT: _ClassVar[Code]
    CODE_INTEGRATION_USER_CANCELLED: _ClassVar[Code]
    CODE_INTEGRATION_INTERNAL: _ClassVar[Code]
CODE_UNSPECIFIED: Code
CODE_INTEGRATION_AUTHORIZATION: Code
CODE_INTEGRATION_NETWORK: Code
CODE_INTEGRATION_QUERY_TIMEOUT: Code
CODE_INTEGRATION_SYNTAX: Code
CODE_INTEGRATION_LOGIC: Code
CODE_INTEGRATION_MISSING_REQUIRED_FIELD: Code
CODE_INTEGRATION_RATE_LIMIT: Code
CODE_INTEGRATION_USER_CANCELLED: Code
CODE_INTEGRATION_INTERNAL: Code

class Error(_message.Message):
    __slots__ = ("name", "message", "handled", "block_path", "form_path", "code")
    NAME_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    HANDLED_FIELD_NUMBER: _ClassVar[int]
    BLOCK_PATH_FIELD_NUMBER: _ClassVar[int]
    FORM_PATH_FIELD_NUMBER: _ClassVar[int]
    CODE_FIELD_NUMBER: _ClassVar[int]
    name: str
    message: str
    handled: bool
    block_path: str
    form_path: str
    code: Code
    def __init__(self, name: _Optional[str] = ..., message: _Optional[str] = ..., handled: bool = ..., block_path: _Optional[str] = ..., form_path: _Optional[str] = ..., code: _Optional[_Union[Code, str]] = ...) -> None: ...
