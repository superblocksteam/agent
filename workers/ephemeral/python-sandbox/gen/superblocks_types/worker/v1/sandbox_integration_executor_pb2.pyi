from api.v1 import service_pb2 as _service_pb2
from common.v1 import common_pb2 as _common_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ExecuteIntegrationRequest(_message.Message):
    __slots__ = ("execution_id", "integration_id", "plugin_id", "action_configuration", "view_mode", "profile")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    PLUGIN_ID_FIELD_NUMBER: _ClassVar[int]
    ACTION_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    integration_id: str
    plugin_id: str
    action_configuration: _struct_pb2.Struct
    view_mode: _service_pb2.ViewMode
    profile: _common_pb2.Profile
    def __init__(self, execution_id: _Optional[str] = ..., integration_id: _Optional[str] = ..., plugin_id: _Optional[str] = ..., action_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., view_mode: _Optional[_Union[_service_pb2.ViewMode, str]] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ...) -> None: ...

class ExecuteIntegrationResponse(_message.Message):
    __slots__ = ("execution_id", "output", "error")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    output: _struct_pb2.Value
    error: str
    def __init__(self, execution_id: _Optional[str] = ..., output: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., error: _Optional[str] = ...) -> None: ...
