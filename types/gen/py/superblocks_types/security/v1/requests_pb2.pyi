from google.protobuf import timestamp_pb2 as _timestamp_pb2
from security.v1 import service_pb2 as _service_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class KeyRotationStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    KEY_ROTATION_STATUS_UNSPECIFIED: _ClassVar[KeyRotationStatus]
    KEY_ROTATION_STATUS_IN_PROGRESS: _ClassVar[KeyRotationStatus]
    KEY_ROTATION_STATUS_COMPLETED: _ClassVar[KeyRotationStatus]
    KEY_ROTATION_STATUS_FAILED: _ClassVar[KeyRotationStatus]
    KEY_ROTATION_STATUS_CANCELED: _ClassVar[KeyRotationStatus]
KEY_ROTATION_STATUS_UNSPECIFIED: KeyRotationStatus
KEY_ROTATION_STATUS_IN_PROGRESS: KeyRotationStatus
KEY_ROTATION_STATUS_COMPLETED: KeyRotationStatus
KEY_ROTATION_STATUS_FAILED: KeyRotationStatus
KEY_ROTATION_STATUS_CANCELED: KeyRotationStatus

class ResourcesToResignRequest(_message.Message):
    __slots__ = ("claimed_by", "limit")
    CLAIMED_BY_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    claimed_by: str
    limit: int
    def __init__(self, claimed_by: _Optional[str] = ..., limit: _Optional[int] = ...) -> None: ...

class ResourcesToResignResponse(_message.Message):
    __slots__ = ("resources",)
    RESOURCES_FIELD_NUMBER: _ClassVar[int]
    resources: _containers.RepeatedCompositeFieldContainer[_service_pb2.Resource]
    def __init__(self, resources: _Optional[_Iterable[_Union[_service_pb2.Resource, _Mapping]]] = ...) -> None: ...

class KeyRotation(_message.Message):
    __slots__ = ("id", "status", "resources_completed", "resources_total", "signing_key_id", "created", "updated", "completed")
    ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESOURCES_COMPLETED_FIELD_NUMBER: _ClassVar[int]
    RESOURCES_TOTAL_FIELD_NUMBER: _ClassVar[int]
    SIGNING_KEY_ID_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    UPDATED_FIELD_NUMBER: _ClassVar[int]
    COMPLETED_FIELD_NUMBER: _ClassVar[int]
    id: str
    status: KeyRotationStatus
    resources_completed: int
    resources_total: int
    signing_key_id: str
    created: _timestamp_pb2.Timestamp
    updated: _timestamp_pb2.Timestamp
    completed: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., status: _Optional[_Union[KeyRotationStatus, str]] = ..., resources_completed: _Optional[int] = ..., resources_total: _Optional[int] = ..., signing_key_id: _Optional[str] = ..., created: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., completed: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class KeyRotationsResponse(_message.Message):
    __slots__ = ("key_rotations",)
    KEY_ROTATIONS_FIELD_NUMBER: _ClassVar[int]
    key_rotations: _containers.RepeatedCompositeFieldContainer[KeyRotation]
    def __init__(self, key_rotations: _Optional[_Iterable[_Union[KeyRotation, _Mapping]]] = ...) -> None: ...
