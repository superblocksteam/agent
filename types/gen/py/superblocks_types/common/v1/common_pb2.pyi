from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class UserType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    USER_TYPE_UNSPECIFIED: _ClassVar[UserType]
    USER_TYPE_SUPERBLOCKS: _ClassVar[UserType]
    USER_TYPE_EXTERNAL: _ClassVar[UserType]
USER_TYPE_UNSPECIFIED: UserType
USER_TYPE_SUPERBLOCKS: UserType
USER_TYPE_EXTERNAL: UserType

class Timestamps(_message.Message):
    __slots__ = ("created", "updated", "deactivated")
    CREATED_FIELD_NUMBER: _ClassVar[int]
    UPDATED_FIELD_NUMBER: _ClassVar[int]
    DEACTIVATED_FIELD_NUMBER: _ClassVar[int]
    created: _timestamp_pb2.Timestamp
    updated: _timestamp_pb2.Timestamp
    deactivated: _timestamp_pb2.Timestamp
    def __init__(self, created: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., deactivated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class Metadata(_message.Message):
    __slots__ = ("id", "description", "name", "organization", "folder", "timestamps", "version", "tags", "type")
    class TagsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    ID_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_FIELD_NUMBER: _ClassVar[int]
    FOLDER_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    TAGS_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    id: str
    description: str
    name: str
    organization: str
    folder: str
    timestamps: Timestamps
    version: str
    tags: _containers.ScalarMap[str, str]
    type: str
    def __init__(self, id: _Optional[str] = ..., description: _Optional[str] = ..., name: _Optional[str] = ..., organization: _Optional[str] = ..., folder: _Optional[str] = ..., timestamps: _Optional[_Union[Timestamps, _Mapping]] = ..., version: _Optional[str] = ..., tags: _Optional[_Mapping[str, str]] = ..., type: _Optional[str] = ...) -> None: ...

class Profile(_message.Message):
    __slots__ = ("id", "name", "environment")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    ENVIRONMENT_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    environment: str
    def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., environment: _Optional[str] = ...) -> None: ...
