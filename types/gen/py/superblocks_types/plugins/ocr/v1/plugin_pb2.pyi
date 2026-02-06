from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("action", "file", "fileUrl")
    ACTION_FIELD_NUMBER: _ClassVar[int]
    FILE_FIELD_NUMBER: _ClassVar[int]
    FILEURL_FIELD_NUMBER: _ClassVar[int]
    action: str
    file: str
    fileUrl: str
    def __init__(self, action: _Optional[str] = ..., file: _Optional[str] = ..., fileUrl: _Optional[str] = ...) -> None: ...
