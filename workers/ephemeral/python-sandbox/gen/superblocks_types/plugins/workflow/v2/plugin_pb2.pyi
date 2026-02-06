from common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("id", "parameters")
    ID_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    id: str
    parameters: _plugin_pb2.HttpParameters
    def __init__(self, id: _Optional[str] = ..., parameters: _Optional[_Union[_plugin_pb2.HttpParameters, _Mapping]] = ...) -> None: ...
