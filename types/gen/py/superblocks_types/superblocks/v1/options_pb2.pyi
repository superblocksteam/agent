from google.protobuf import descriptor_pb2 as _descriptor_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor
INTEGRATIONS_FIELD_NUMBER: _ClassVar[int]
integrations: _descriptor.FieldDescriptor
INTEGRATION_OPTIONS_FIELD_NUMBER: _ClassVar[int]
integration_options: _descriptor.FieldDescriptor

class Integrations(_message.Message):
    __slots__ = ("registry",)
    REGISTRY_FIELD_NUMBER: _ClassVar[int]
    registry: bool
    def __init__(self, registry: bool = ...) -> None: ...

class IntegrationOptions(_message.Message):
    __slots__ = ("pluginType",)
    PLUGINTYPE_FIELD_NUMBER: _ClassVar[int]
    pluginType: str
    def __init__(self, pluginType: _Optional[str] = ...) -> None: ...
