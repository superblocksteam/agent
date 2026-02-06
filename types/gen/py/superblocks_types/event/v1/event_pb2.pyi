from api.v1 import event_pb2 as _event_pb2
from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Mode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    MODE_UNSPECIFIED: _ClassVar[Mode]
    MODE_DEPLOYED: _ClassVar[Mode]
    MODE_EDITOR: _ClassVar[Mode]
    MODE_PREVIEW: _ClassVar[Mode]

class Type(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    TYPE_UNSPECIFIED: _ClassVar[Type]
    TYPE_EXECUTION_API: _ClassVar[Type]
    TYPE_EXECUTION_BLOCK: _ClassVar[Type]

class Status(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    STATUS_UNSPECIFIED: _ClassVar[Status]
    STATUS_STARTED: _ClassVar[Status]
    STATUS_ENDED: _ClassVar[Status]

class Trigger(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    TRIGGER_UNSPECIFIED: _ClassVar[Trigger]
    TRIGGER_APPLICATION: _ClassVar[Trigger]
    TRIGGER_WORKFLOW: _ClassVar[Trigger]
    TRIGGER_JOB: _ClassVar[Trigger]
MODE_UNSPECIFIED: Mode
MODE_DEPLOYED: Mode
MODE_EDITOR: Mode
MODE_PREVIEW: Mode
TYPE_UNSPECIFIED: Type
TYPE_EXECUTION_API: Type
TYPE_EXECUTION_BLOCK: Type
STATUS_UNSPECIFIED: Status
STATUS_STARTED: Status
STATUS_ENDED: Status
TRIGGER_UNSPECIFIED: Trigger
TRIGGER_APPLICATION: Trigger
TRIGGER_WORKFLOW: Trigger
TRIGGER_JOB: Trigger

class ExecutionEvent(_message.Message):
    __slots__ = ("execution_id", "resource_id", "resource_name", "resource_type", "resource_subtype", "result", "status", "integration_id", "integration_type", "mode", "organization_id", "user_id", "trigger", "parent_id", "parent_name", "parent_type", "is_descendant_of_stream", "api_id")
    EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_ID_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_NAME_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_TYPE_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_SUBTYPE_FIELD_NUMBER: _ClassVar[int]
    RESULT_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    MODE_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    TRIGGER_FIELD_NUMBER: _ClassVar[int]
    PARENT_ID_FIELD_NUMBER: _ClassVar[int]
    PARENT_NAME_FIELD_NUMBER: _ClassVar[int]
    PARENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    IS_DESCENDANT_OF_STREAM_FIELD_NUMBER: _ClassVar[int]
    API_ID_FIELD_NUMBER: _ClassVar[int]
    execution_id: str
    resource_id: str
    resource_name: str
    resource_type: Type
    resource_subtype: _event_pb2.BlockType
    result: _event_pb2.BlockStatus
    status: Status
    integration_id: str
    integration_type: str
    mode: Mode
    organization_id: str
    user_id: str
    trigger: Trigger
    parent_id: str
    parent_name: str
    parent_type: Type
    is_descendant_of_stream: bool
    api_id: str
    def __init__(self, execution_id: _Optional[str] = ..., resource_id: _Optional[str] = ..., resource_name: _Optional[str] = ..., resource_type: _Optional[_Union[Type, str]] = ..., resource_subtype: _Optional[_Union[_event_pb2.BlockType, str]] = ..., result: _Optional[_Union[_event_pb2.BlockStatus, str]] = ..., status: _Optional[_Union[Status, str]] = ..., integration_id: _Optional[str] = ..., integration_type: _Optional[str] = ..., mode: _Optional[_Union[Mode, str]] = ..., organization_id: _Optional[str] = ..., user_id: _Optional[str] = ..., trigger: _Optional[_Union[Trigger, str]] = ..., parent_id: _Optional[str] = ..., parent_name: _Optional[str] = ..., parent_type: _Optional[_Union[Type, str]] = ..., is_descendant_of_stream: bool = ..., api_id: _Optional[str] = ...) -> None: ...
