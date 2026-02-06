from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Claims(_message.Message):
    __slots__ = ("user_email", "org_id", "org_type", "rbac_role", "rbac_group_objects", "user_type", "user_id", "user_name", "metadata")
    class RbacGroupObject(_message.Message):
        __slots__ = ("id", "name")
        ID_FIELD_NUMBER: _ClassVar[int]
        NAME_FIELD_NUMBER: _ClassVar[int]
        id: str
        name: str
        def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ...) -> None: ...
    USER_EMAIL_FIELD_NUMBER: _ClassVar[int]
    ORG_ID_FIELD_NUMBER: _ClassVar[int]
    ORG_TYPE_FIELD_NUMBER: _ClassVar[int]
    RBAC_ROLE_FIELD_NUMBER: _ClassVar[int]
    RBAC_GROUP_OBJECTS_FIELD_NUMBER: _ClassVar[int]
    USER_TYPE_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    USER_NAME_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    user_email: str
    org_id: str
    org_type: str
    rbac_role: str
    rbac_group_objects: _containers.RepeatedCompositeFieldContainer[Claims.RbacGroupObject]
    user_type: str
    user_id: str
    user_name: str
    metadata: _struct_pb2.Struct
    def __init__(self, user_email: _Optional[str] = ..., org_id: _Optional[str] = ..., org_type: _Optional[str] = ..., rbac_role: _Optional[str] = ..., rbac_group_objects: _Optional[_Iterable[_Union[Claims.RbacGroupObject, _Mapping]]] = ..., user_type: _Optional[str] = ..., user_id: _Optional[str] = ..., user_name: _Optional[str] = ..., metadata: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...
