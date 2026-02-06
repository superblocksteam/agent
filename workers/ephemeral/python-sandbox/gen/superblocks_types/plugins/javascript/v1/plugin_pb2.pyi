from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("body", "superblocksMetadata")
    BODY_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    body: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, body: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
